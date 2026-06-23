import crypto from 'crypto';
import User from '../models/User.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { issueTokens, verifyRefreshToken, signAccessToken, refreshCookieOptions } from '../utils/tokens.js';
import { generateUniqueAnonymousName } from '../utils/anonymousName.js';
import { recalculateQueueForNewUser } from '../services/matchService.js';
import { sendPasswordResetEmail, isMailConfigured } from '../utils/mailer.js';

// Trim, cap length, drop empties, de-dupe, limit count — for freeform "Other" values.
const cleanCustom = (arr) =>
  Array.from(
    new Set(
      (Array.isArray(arr) ? arr : [])
        .map((s) => String(s).trim())
        .filter(Boolean)
        .map((s) => s.slice(0, 40))
    )
  ).slice(0, 5);

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, ageGroup, interests, struggles, customInterests, customStruggles } =
    req.body;

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
    customInterests: cleanCustom(customInterests),
    customStruggles: cleanCustom(customStruggles),
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

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond identically so attackers can't discover which emails exist.
  const message = 'If an account exists for that email, a reset link is on its way.';

  if (user && !user.isBanned) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken); // store only the hash
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const base = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${base}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (e) {
      console.error('[forgot-password] email send failed:', e.message);
    }

    // Dev convenience ONLY when email isn't configured — so once SMTP works,
    // the link is delivered by email and never exposed in the API response.
    if (process.env.NODE_ENV !== 'production' && !isMailConfigured()) {
      return res.json({ success: true, message, devResetUrl: resetUrl });
    }
  }

  res.json({ success: true, message });
});

// POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token) throw new ApiError(400, 'Reset token is required');

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired.');

  user.password = password; // re-hashed by the pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Your password has been reset. You can now sign in.' });
});