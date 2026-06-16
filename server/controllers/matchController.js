import User from '../models/User.js';
import Match from '../models/Match.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Notification from '../models/Notification.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { findCandidates, enqueueSeeker, scorePair } from '../services/matchService.js';
import { explainMatch } from '../services/ai/matchExplanationService.js';
import { generateStarters } from '../services/ai/conversationStarterService.js';
import { MATCH_CATEGORY } from '../config/constants.js';

// POST /api/match/find
// Returns top compatible users (with "why we matched"). If none, queues seeker.
export const findMatches = asyncHandler(async (req, res) => {
  const candidates = await findCandidates(req.user._id, { limit: 5 });

  if (!candidates.length) {
    await enqueueSeeker(req.user);
    return res.json({
      success: false,
      queued: true,
      message:
        "We couldn't find the right person yet. We'll notify you when someone with a similar journey joins.",
      matches: [],
    });
  }

  const matches = candidates.map((c) => ({
    user: c.candidate.toPublicProfile(),
    score: c.score,
    matchType: c.matchType,
    sharedStruggles: c.sharedStruggles,
    sharedInterests: c.sharedInterests,
    sharedAgeGroup: c.sharedAgeGroup,
    explanation: c.explanation,
  }));

  res.json({
    success: true,
    queued: false,
    message: 'Great News! We found someone who understands your journey.',
    matches,
  });
});

// POST /api/match/request  { toUserId, message? }
export const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { toUserId, message = '' } = req.body;
  if (toUserId === req.user._id.toString()) throw new ApiError(400, 'You cannot connect with yourself');

  const target = await User.findById(toUserId);
  if (!target || target.isBanned) throw new ApiError(404, 'User not available');

  // Respect blocks in both directions.
  const iBlocked = req.user.blockedUsers.some((b) => b.toString() === toUserId);
  const theyBlocked = target.blockedUsers.some((b) => b.toString() === req.user._id.toString());
  if (iBlocked || theyBlocked) throw new ApiError(403, 'Connection not allowed');

  // No duplicate active/pending relationship.
  const already = await ConnectionRequest.findOne({
    $or: [
      { from: req.user._id, to: toUserId },
      { from: toUserId, to: req.user._id },
    ],
    status: { $in: ['pending', 'accepted'] },
  });
  if (already) throw new ApiError(409, 'A connection or request already exists with this person');

  const breakdown = scorePair(req.user, target);
  if (breakdown.score < 50) throw new ApiError(400, 'This pairing is below the match threshold');

  const explanation = await explainMatch({
    sharedStruggles: breakdown.sharedStruggles,
    sharedInterests: breakdown.sharedInterests,
    sharedAgeGroup: breakdown.sharedAgeGroup,
    score: breakdown.score,
  });

  const request = await ConnectionRequest.create({
    from: req.user._id,
    to: toUserId,
    matchScore: breakdown.score,
    matchType: breakdown.matchType,
    sharedStruggles: breakdown.sharedStruggles,
    sharedInterests: breakdown.sharedInterests,
    sharedAgeGroup: breakdown.sharedAgeGroup,
    explanation,
    message: message.slice(0, 300),
  });

  await Notification.create({
    user: toUserId,
    type: 'connection_request',
    title: 'New connection request',
    body: `${req.user.anonymousName} would like to connect with you.`,
    refId: request._id,
  });

  res.status(201).json({ success: true, message: 'Connection request sent', requestId: request._id });
});

// GET /api/match/requests  (incoming + outgoing, pending)
export const listRequests = asyncHandler(async (req, res) => {
  const [incoming, outgoing] = await Promise.all([
    ConnectionRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'anonymousName avatar badges interests struggles ageGroup kindnessScore'),
    ConnectionRequest.find({ from: req.user._id, status: 'pending' })
      .populate('to', 'anonymousName avatar badges interests struggles ageGroup kindnessScore'),
  ]);

  const shape = (r, otherKey) => ({
    id: r._id,
    user: r[otherKey]?.toPublicProfile?.() || null,
    score: r.matchScore,
    matchType: r.matchType,
    sharedStruggles: r.sharedStruggles,
    sharedInterests: r.sharedInterests,
    explanation: r.explanation,
    message: r.message,
    createdAt: r.createdAt,
  });

  res.json({
    success: true,
    incoming: incoming.map((r) => shape(r, 'from')),
    outgoing: outgoing.map((r) => shape(r, 'to')),
  });
});

// POST /api/match/respond  { requestId, action: 'accept'|'reject' }
export const respondToRequest = asyncHandler(async (req, res) => {
  const { requestId, action } = req.body;
  const request = await ConnectionRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Request not found');
  if (request.to.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not your request');
  if (request.status !== 'pending') throw new ApiError(400, 'Request already handled');

  if (action === 'reject') {
    request.status = 'rejected';
    await request.save();
    await Notification.create({
      user: request.from,
      type: 'request_rejected',
      title: 'Connection update',
      body: 'A connection request was not accepted this time.',
    });
    return res.json({ success: true, message: 'Request declined' });
  }

  if (action !== 'accept') throw new ApiError(400, 'Invalid action');

  // Accept → create the Match (chat room) with AI conversation starters.
  const starters = await generateStarters({
    sharedStruggles: request.sharedStruggles,
    sharedInterests: request.sharedInterests,
  });

  const match = await Match.create({
    users: [request.from, request.to],
    matchScore: request.matchScore,
    matchType: request.matchType,
    sharedStruggles: request.sharedStruggles,
    sharedInterests: request.sharedInterests,
    sharedAgeGroup: request.sharedAgeGroup,
    conversationStarters: starters,
  });

  request.status = 'accepted';
  request.matchId = match._id;
  await request.save();

  await Notification.create({
    user: request.from,
    type: 'request_accepted',
    title: 'You have a new connection!',
    body: `${req.user.anonymousName} accepted your request. You can start chatting now.`,
    refId: match._id,
  });

  res.json({ success: true, message: 'Connection accepted', matchId: match._id });
});

// GET /api/match  (active matches for the current user)
export const listMatches = asyncHandler(async (req, res) => {
  const matches = await Match.find({ users: req.user._id, isActive: true })
    .populate('users', 'anonymousName avatar badges interests struggles ageGroup kindnessScore')
    .sort({ lastMessageAt: -1, createdAt: -1 });

  const shaped = matches.map((m) => {
    const partner = m.users.find((u) => u._id.toString() !== req.user._id.toString());
    return {
      matchId: m._id,
      partner: partner?.toPublicProfile?.() || null,
      score: m.matchScore,
      matchType: m.matchType,
      sharedStruggles: m.sharedStruggles,
      sharedInterests: m.sharedInterests,
      conversationStarters: m.conversationStarters,
      lastMessageAt: m.lastMessageAt,
      createdAt: m.createdAt,
    };
  });

  res.json({ success: true, matches: shaped });
});
