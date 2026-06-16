import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import User from '../models/User.js';

// Reads the Bearer access token, loads the user, and enforces ban/suspension.
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated');

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Session expired. Please refresh or log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'Account not found');
  if (user.isBanned) throw new ApiError(403, 'This account has been banned.');
  if (user.isSuspended()) {
    throw new ApiError(403, `Account suspended until ${user.suspendedUntil.toISOString()}`);
  }

  req.user = user;
  next();
});

// Restricts a route to specific roles.
export const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to do this.'));
    }
    return next();
  };

export const adminOnly = authorize('admin');
