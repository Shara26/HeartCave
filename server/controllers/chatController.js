import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { moderateAndEnforce } from '../services/ai/moderationService.js';
import { checkDraft } from '../services/ai/supportiveLanguageService.js';
import { MODERATION_STATUS } from '../config/constants.js';

// Verifies the requester is part of an active match and not blocked.
const loadMatchForUser = async (matchId, user) => {
  const match = await Match.findById(matchId);
  if (!match || !match.includes(user._id)) throw new ApiError(404, 'Conversation not found');
  if (!match.isActive) throw new ApiError(403, 'This conversation has ended');

  const partnerId = match.partnerOf(user._id);
  const partner = await User.findById(partnerId);
  const blocked =
    user.blockedUsers.some((b) => b.toString() === partnerId.toString()) ||
    partner?.blockedUsers?.some((b) => b.toString() === user._id.toString());
  if (blocked) throw new ApiError(403, 'Messaging is unavailable for this conversation');

  return { match, partner };
};

// GET /api/chat/:matchId
export const getMessages = asyncHandler(async (req, res) => {
  const { match } = await loadMatchForUser(req.params.matchId, req.user);
  const messages = await Message.find({
    matchId: match._id,
    delivered: true, // blocked messages were never delivered
  }).sort({ createdAt: 1 });

  res.json({
    success: true,
    conversationStarters: match.conversationStarters,
    messages: messages.map((m) => ({
      id: m._id,
      senderId: m.senderId,
      isMine: m.senderId.toString() === req.user._id.toString(),
      content: m.content,
      read: m.read,
      createdAt: m.createdAt,
    })),
  });
});

// POST /api/chat/check  { content }  → AI FEATURE 5 supportive-language check
export const checkMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) throw new ApiError(400, 'Message is empty');
  const check = await checkDraft(content);
  res.json({ success: true, ...check });
});

// POST /api/chat/send  { matchId, content }
// Returns the created (delivered) message. Used by REST clients; socket path
// reuses the same persistence helper.
export const sendMessage = asyncHandler(async (req, res) => {
  const { matchId, content } = req.body;
  if (!content?.trim()) throw new ApiError(400, 'Message is empty');

  const { match } = await loadMatchForUser(matchId, req.user);
  const { message, blocked } = await persistMessage({ match, sender: req.user, content });

  if (blocked) {
    throw new ApiError(400, 'Message blocked: it may violate our safety policy.');
  }

  res.status(201).json({
    success: true,
    message: {
      id: message._id,
      senderId: message.senderId,
      isMine: true,
      content: message.content,
      read: false,
      createdAt: message.createdAt,
    },
  });
});

// Shared persistence used by both REST and socket layers. Runs moderation
// BEFORE delivery; blocked messages are stored as evidence but not delivered.
export const persistMessage = async ({ match, sender, content }) => {
  const message = await Message.create({
    matchId: match._id,
    senderId: sender._id,
    content,
  });

  const { result } = await moderateAndEnforce({
    text: content,
    user: sender,
    sourceType: 'message',
    sourceId: message._id,
  });

  message.moderationStatus = result.status;
  message.moderationReason = result.reason;
  message.moderationTimestamp = new Date();
  message.delivered = result.status !== MODERATION_STATUS.BLOCKED;
  await message.save();

  if (message.delivered) {
    match.lastMessageAt = new Date();
    await match.save();
  }

  return { message, blocked: result.status === MODERATION_STATUS.BLOCKED, result };
};

// POST /api/chat/:matchId/read  → mark partner's messages read
export const markRead = asyncHandler(async (req, res) => {
  const { match } = await loadMatchForUser(req.params.matchId, req.user);
  await Message.updateMany(
    { matchId: match._id, senderId: { $ne: req.user._id }, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  res.json({ success: true });
});

// POST /api/chat/:matchId/leave  → end the conversation
export const leaveConversation = asyncHandler(async (req, res) => {
  const { match } = await loadMatchForUser(req.params.matchId, req.user);
  match.isActive = false;
  match.endedBy = req.user._id;
  match.endedAt = new Date();
  await match.save();
  res.json({ success: true, message: 'You left the conversation' });
});
