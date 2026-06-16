import User from '../models/User.js';
import Post from '../models/Post.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import ModerationLog from '../models/ModerationLog.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { MODERATION_STATUS } from '../config/constants.js';

// GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalPosts,
    totalMatches,
    totalMessages,
    totalReports,
    openReports,
    resolvedReports,
    flaggedMessages,
    suspendedUsers,
    bannedUsers,
    activeUsers,
    reportsByReason,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Post.countDocuments({ isRemoved: false }),
    Match.countDocuments({}),
    Message.countDocuments({ delivered: true }),
    Report.countDocuments({}),
    Report.countDocuments({ status: { $in: ['open', 'under_review'] } }),
    Report.countDocuments({ status: { $in: ['resolved', 'dismissed'] } }),
    Message.countDocuments({ moderationStatus: { $in: [MODERATION_STATUS.FLAGGED, MODERATION_STATUS.BLOCKED] } }),
    User.countDocuments({ suspendedUntil: { $gt: new Date() } }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ lastSeenAt: { $gte: oneDayAgo } }),
    Report.aggregate([{ $group: { _id: '$reason', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
  ]);

  // Average resolution time (ms → hours) for resolved reports.
  const resolved = await Report.find({ resolvedAt: { $ne: null } }).select('createdAt resolvedAt');
  const avgResolutionHours = resolved.length
    ? Math.round(
        (resolved.reduce((sum, r) => sum + (r.resolvedAt - r.createdAt), 0) /
          resolved.length /
          (1000 * 60 * 60)) * 10
      ) / 10
    : 0;

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalPosts,
      totalMatches,
      totalMessages,
      totalReports,
      openReports,
      resolvedReports,
      flaggedMessages,
      suspendedUsers,
      bannedUsers,
      activeUsers,
      mostReportedCategories: reportsByReason.map((r) => ({ reason: r._id, count: r.count })),
      avgResolutionHours,
    },
  });
});

// GET /api/admin/users?search=&page=&limit=
// Admins MAY view real identities for moderation.
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const rx = { $regex: req.query.search.trim(), $options: 'i' };
    filter.$or = [{ anonymousName: rx }, { name: rx }, { email: rx }];
  }
  if (req.query.banned === 'true') filter.isBanned = true;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    page,
    total,
    hasMore: skip + users.length < total,
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      anonymousName: u.anonymousName,
      role: u.role,
      ageGroup: u.ageGroup,
      kindnessScore: u.kindnessScore,
      badges: u.badges,
      isBanned: u.isBanned,
      suspendedUntil: u.suspendedUntil,
      violations: u.violations.length,
      createdAt: u.createdAt,
    })),
  });
});

// GET /api/admin/users/:id  (full profile incl. violation history)
export const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const reports = await Report.find({ reportedUser: user._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    user: {
      ...user.toObject({ versionKey: false }),
      password: undefined,
    },
    reportsAgainst: reports,
  });
});

// GET /api/admin/reports?status=
export const listReports = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const reports = await Report.find(filter)
    .populate('reportedUser', 'anonymousName name email isBanned violations')
    .populate('reportedBy', 'anonymousName')
    .sort({ priority: -1, createdAt: -1 })
    .limit(200);

  res.json({ success: true, reports });
});

// PUT /api/admin/reports/:id  { status, adminNotes }
export const updateReport = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Report not found');

  if (status) report.status = status;
  if (adminNotes !== undefined) report.adminNotes = adminNotes;
  if (['resolved', 'dismissed'].includes(status)) {
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
  }
  await report.save();
  res.json({ success: true, report });
});

// GET /api/admin/moderation?status=
export const listModerationLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const logs = await ModerationLog.find(filter)
    .populate('user', 'anonymousName name')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, logs });
});

// PUT /api/admin/moderation/:id  { resolution }
export const reviewModerationLog = asyncHandler(async (req, res) => {
  const { resolution } = req.body;
  if (!['upheld', 'cleared'].includes(resolution)) throw new ApiError(400, 'Invalid resolution');
  const log = await ModerationLog.findByIdAndUpdate(
    req.params.id,
    { resolution, reviewedBy: req.user._id, reviewedAt: new Date() },
    { new: true }
  );
  if (!log) throw new ApiError(404, 'Log not found');
  res.json({ success: true, log });
});

// PUT /api/admin/users/:id/ban  { reason }
export const banUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(403, 'Cannot ban an admin');
  user.isBanned = true;
  user.bannedReason = req.body.reason || 'Banned by moderator';
  await user.save();
  res.json({ success: true, message: 'User banned' });
});

// PUT /api/admin/users/:id/unban
export const unbanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.isBanned = false;
  user.bannedReason = '';
  user.suspendedUntil = null;
  await user.save();
  res.json({ success: true, message: 'User reinstated' });
});

// PUT /api/admin/users/:id/warn  { reason }  → adds a strike
export const warnUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.violations.push({
    category: 'manual',
    reason: req.body.reason || 'Warning issued by moderator',
    severity: 'warning',
    sourceType: 'admin',
  });
  const strikes = user.violations.filter((v) => v.severity === 'warning').length;
  if (strikes >= 3) {
    user.isBanned = true;
    user.bannedReason = 'Permanent ban: three violations';
  } else if (strikes === 2) {
    user.suspendedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  await user.save();
  res.json({ success: true, strikes, message: 'Warning recorded' });
});

// PUT /api/admin/users/:id/suspend  { hours }
export const suspendUser = asyncHandler(async (req, res) => {
  const hours = Math.max(1, parseInt(req.body.hours, 10) || 24);
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.suspendedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
  await user.save();
  res.json({ success: true, message: `User suspended for ${hours}h` });
});

// DELETE /api/admin/posts/:id
export const adminDeletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');
  post.isRemoved = true;
  await post.save();
  res.json({ success: true, message: 'Post removed' });
});

// GET /api/admin/matches/:id/messages  (chat logs for moderation)
export const getChatLogs = asyncHandler(async (req, res) => {
  const messages = await Message.find({ matchId: req.params.id })
    .populate('senderId', 'anonymousName name')
    .sort({ createdAt: 1 });
  res.json({ success: true, messages });
});
