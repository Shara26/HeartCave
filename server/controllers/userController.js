import Rating from '../models/Rating.js';
import Match from '../models/Match.js';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { computeKindness } from '../utils/kindness.js';
import { RATING_TYPES, INSTANT_BAN_CATEGORIES, AGE_GROUPS, STRUGGLES, INTERESTS } from '../config/constants.js';

// Recompute a user's kindness score + badges from their full rating history.
const refreshReputation = async (userId) => {
  const ratings = await Rating.find({ toUser: userId });
  const types = ratings.flatMap((r) => r.ratingTypes);
  const count = (t) => types.filter((x) => x === t).length;

  const { score, badges } = computeKindness({
    positiveRatings: ratings.length,
    goodListener: count('Good Listener'),
    supportive: count('Supportive'),
    conversations: await Match.countDocuments({ users: userId }),
  });

  await User.findByIdAndUpdate(userId, { kindnessScore: score, badges });
  return { score, badges };
};

// POST /api/ratings  { matchId, ratingTypes:[], note? }
export const submitRating = asyncHandler(async (req, res) => {
  const { matchId, ratingTypes = [], note = '' } = req.body;
  const invalid = ratingTypes.filter((t) => !RATING_TYPES.includes(t));
  if (invalid.length) throw new ApiError(400, 'Invalid rating type');

  const match = await Match.findById(matchId);
  if (!match || !match.includes(req.user._id)) throw new ApiError(404, 'Match not found');

  const toUser = match.partnerOf(req.user._id);

  const existing = await Rating.findOne({ matchId, fromUser: req.user._id });
  if (existing) throw new ApiError(409, 'You already rated this conversation');

  await Rating.create({
    matchId,
    fromUser: req.user._id,
    toUser,
    ratingTypes,
    note: note.slice(0, 300),
  });

  const reputation = await refreshReputation(toUser);
  res.status(201).json({ success: true, message: 'Thanks for the feedback', reputation });
});

// POST /api/reports
export const createReport = asyncHandler(async (req, res) => {
  const { reportedUser, reason, description = '', context } = req.body;
  if (reportedUser === req.user._id.toString()) throw new ApiError(400, 'You cannot report yourself');

  const target = await User.findById(reportedUser);
  if (!target) throw new ApiError(404, 'User not found');

  const severe = ['Threats', 'Sexual Harassment', 'Hate Speech'].includes(reason);

  const report = await Report.create({
    reportedUser,
    reportedBy: req.user._id,
    reason,
    description: description.slice(0, 2000),
    context: context || undefined,
    priority: severe ? 'high' : 'normal',
  });

  if (severe) {
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Notification.insertMany(
      admins.map((a) => ({
        user: a._id,
        type: 'admin_alert',
        priority: 'high',
        title: `High-priority report: ${reason}`,
        body: `${target.anonymousName} was reported.`,
        refId: report._id,
      }))
    );
  }

  res.status(201).json({ success: true, message: 'Report submitted. Our team will review it.' });
});

// POST /api/users/block  { userId }
export const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (userId === req.user._id.toString()) throw new ApiError(400, 'You cannot block yourself');

  const target = await User.findById(userId);
  if (!target) throw new ApiError(404, 'User not found');

  if (!req.user.blockedUsers.some((b) => b.toString() === userId)) {
    req.user.blockedUsers.push(userId);
    await req.user.save();
  }

  // Immediately end any active match between the two.
  await Match.updateMany(
    { users: { $all: [req.user._id, userId] }, isActive: true },
    { $set: { isActive: false, endedBy: req.user._id, endedAt: new Date() } }
  );

  res.json({ success: true, message: 'User blocked' });
});

// POST /api/users/unblock  { userId }
export const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  req.user.blockedUsers = req.user.blockedUsers.filter((b) => b.toString() !== userId);
  await req.user.save();
  res.json({ success: true, message: 'User unblocked' });
});

// GET /api/users/:id/profile  (public, anonymous-only projection)
export const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.isBanned) throw new ApiError(404, 'Profile not found');
  res.json({ success: true, profile: user.toPublicProfile() });
});

// GET /api/users/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ success: true, unread, notifications });
});

// POST /api/users/notifications/read
export const markNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ success: true });
});

// POST /api/users/notifications/:id/read  — mark a single notification read
export const markOneNotificationRead = asyncHandler(async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, user: req.user._id },
    { $set: { read: true } }
  );
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ success: true, unread });
});

// Trim, cap, de-dupe, limit freeform "Other" values.
const cleanCustom = (arr) =>
  Array.from(
    new Set(
      (Array.isArray(arr) ? arr : [])
        .map((s) => String(s).trim())
        .filter(Boolean)
        .map((s) => s.slice(0, 40))
    )
  ).slice(0, 5);

// PATCH /api/users/me  — update the signed-in user's matching profile.
export const updateProfile = asyncHandler(async (req, res) => {
  const { ageGroup, interests, struggles, customInterests, customStruggles } = req.body;
  const user = req.user;

  if (ageGroup !== undefined) {
    if (!AGE_GROUPS.includes(ageGroup)) throw new ApiError(400, 'Invalid age group');
    user.ageGroup = ageGroup;
  }

  if (interests !== undefined) {
    if (!Array.isArray(interests) || interests.some((i) => !INTERESTS.includes(i))) {
      throw new ApiError(400, 'Invalid interest selection');
    }
    user.interests = interests;
  }

  if (struggles !== undefined) {
    if (!Array.isArray(struggles) || struggles.some((s) => !STRUGGLES.includes(s))) {
      throw new ApiError(400, 'Invalid struggle selection');
    }
    user.struggles = struggles;
  }

  if (customInterests !== undefined) user.customInterests = cleanCustom(customInterests);
  if (customStruggles !== undefined) user.customStruggles = cleanCustom(customStruggles);

  // At least one struggle keeps the user matchable.
  if ((user.struggles?.length || 0) + (user.customStruggles?.length || 0) === 0) {
    throw new ApiError(400, 'Please keep at least one struggle so we can match you');
  }

  await user.save();
  res.json({ success: true, user: user.toSelf() });
});