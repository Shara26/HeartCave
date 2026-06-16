import User from '../models/User.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { issueTokens, verifyRefreshToken, signAccessToken, refreshCookieOptions } from '../utils/tokens.js';
import { generateUniqueAnonymousName } from '../utils/anonymousName.js';
import { recalculateQueueForNewUser } from '../services/matchService.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, ageGroup, interests, struggles } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'An account with that email already exists.');

  const anonymousName = await generateUniqueAnonymousName(User);

  const user = await User.create({
    name,
    email,
    password,
    ageGroup,
    interests,
    struggles,
    anonymousName,
    avatar: anonymousName.slice(0, 2).toUpperCase(),
    acceptedSafetyPolicy: true,
  });

  // Async matching: see if existing queued seekers now have a match.
  recalculateQueueForNewUser(user).catch((e) => console.warn('queue recalc:', e.message));

  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  res.status(201).json({ success: true, accessToken, user: user.toSelf() });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, 'Invalid email or password.');
  if (user.isBanned) throw new ApiError(403, 'This account has been banned.');

  user.lastSeenAt = new Date();
  await user.save();

  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  res.json({ success: true, accessToken, user: user.toSelf() });
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user || user.isBanned) throw new ApiError(401, 'Account unavailable');

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
  res.json({ success: true, accessToken, user: user.toSelf() });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', { ...refreshCookieOptions(), maxAge: 0 });
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSelf() });
});
