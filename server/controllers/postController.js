import Post from '../models/Post.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { REACTIONS, MODERATION_STATUS } from '../config/constants.js';
import { moderateAndEnforce } from '../services/ai/moderationService.js';

// Shape a post for the feed: anonymous author only, reaction counts, viewer's
// own reaction. Never leaks author identity beyond the anonymous handle.
const serializePost = (post, viewerId) => {
  const author = post.userId;
  const myReaction = post.reactions.find(
    (r) => r.userId.toString() === viewerId?.toString()
  );
  return {
    id: post._id,
    content: post.content,
    author: author
      ? { anonymousName: author.anonymousName, avatar: author.avatar, badges: author.badges }
      : { anonymousName: 'Unknown', avatar: '' },
    reactionCounts: post.reactionCounts(),
    myReaction: myReaction?.type || null,
    commentCount: post.comments.filter((c) => c.moderationStatus !== MODERATION_STATUS.BLOCKED).length,
    createdAt: post.createdAt,
  };
};

// POST /api/posts
export const createPost = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const post = await Post.create({ userId: req.user._id, content });

  // Run moderation; blocked posts are hidden and enforced against.
  const { result } = await moderateAndEnforce({
    text: content,
    user: req.user,
    sourceType: 'post',
    sourceId: post._id,
  });
  post.moderationStatus = result.status;
  post.moderationReason = result.reason;
  if (result.status === MODERATION_STATUS.BLOCKED) post.isRemoved = true;
  await post.save();

  if (result.status === MODERATION_STATUS.BLOCKED) {
    throw new ApiError(400, 'Your post was blocked because it may violate our safety policy.');
  }

  await post.populate('userId', 'anonymousName avatar badges');
  res.status(201).json({ success: true, post: serializePost(post, req.user._id) });
});

// GET /api/posts?page=&limit=&struggle=&search=
export const listPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;

  const filter = {
    isRemoved: false,
    moderationStatus: { $ne: MODERATION_STATUS.BLOCKED },
  };
  if (req.query.search) filter.content = { $regex: req.query.search.trim(), $options: 'i' };

  // Optional filter by author struggle requires a join; keep simple with search.
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('userId', 'anonymousName avatar badges struggles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(filter),
  ]);

  let visible = posts;
  if (req.query.struggle) {
    visible = posts.filter((p) => p.userId?.struggles?.includes(req.query.struggle));
  }

  res.json({
    success: true,
    page,
    limit,
    total,
    hasMore: skip + posts.length < total,
    posts: visible.map((p) => serializePost(p, req.user._id)),
  });
});

// POST /api/posts/:id/comment
export const addComment = asyncHandler(async (req, res) => {
  const { content, isExperienceShare } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post || post.isRemoved) throw new ApiError(404, 'Post not found');

  const comment = { userId: req.user._id, content, isExperienceShare: Boolean(isExperienceShare) };
  post.comments.push(comment);
  await post.save();

  const created = post.comments[post.comments.length - 1];
  const { result } = await moderateAndEnforce({
    text: content,
    user: req.user,
    sourceType: 'comment',
    sourceId: created._id,
  });
  created.moderationStatus = result.status;
  await post.save();

  if (result.status === MODERATION_STATUS.BLOCKED) {
    throw new ApiError(400, 'Your comment was blocked because it may violate our safety policy.');
  }

  res.status(201).json({
    success: true,
    comment: {
      id: created._id,
      content: created.content,
      isExperienceShare: created.isExperienceShare,
      author: { anonymousName: req.user.anonymousName, avatar: req.user.avatar },
      createdAt: created.createdAt,
    },
  });
});

// GET /api/posts/:id/comments
export const listComments = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('comments.userId', 'anonymousName avatar');
  if (!post || post.isRemoved) throw new ApiError(404, 'Post not found');

  const comments = post.comments
    .filter((c) => c.moderationStatus !== MODERATION_STATUS.BLOCKED)
    .map((c) => ({
      id: c._id,
      content: c.content,
      isExperienceShare: c.isExperienceShare,
      author: c.userId
        ? { anonymousName: c.userId.anonymousName, avatar: c.userId.avatar }
        : { anonymousName: 'Unknown' },
      createdAt: c.createdAt,
    }));

  res.json({ success: true, comments });
});

// POST /api/posts/:id/react  { type }
export const reactToPost = asyncHandler(async (req, res) => {
  const { type } = req.body;
  if (!REACTIONS.includes(type)) throw new ApiError(400, 'Invalid reaction');

  const post = await Post.findById(req.params.id);
  if (!post || post.isRemoved) throw new ApiError(404, 'Post not found');

  const existing = post.reactions.find((r) => r.userId.toString() === req.user._id.toString());
  if (existing) {
    if (existing.type === type) {
      // toggle off
      post.reactions = post.reactions.filter(
        (r) => r.userId.toString() !== req.user._id.toString()
      );
    } else {
      existing.type = type; // switch reaction
    }
  } else {
    post.reactions.push({ userId: req.user._id, type });
  }
  await post.save();

  res.json({ success: true, reactionCounts: post.reactionCounts() });
});

// DELETE /api/posts/:id  (owner or admin)
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');

  const isOwner = post.userId.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'Not allowed');

  post.isRemoved = true;
  await post.save();
  res.json({ success: true, message: 'Post removed' });
});

