import rateLimit from 'express-rate-limit';

const make = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

// Stricter on auth to slow credential stuffing.
export const authLimiter = make(15 * 60 * 1000, 20, 'Too many attempts. Try again later.');
export const apiLimiter = make(15 * 60 * 1000, 300, 'Too many requests. Please slow down.');
export const writeLimiter = make(60 * 1000, 30, 'You are doing that too quickly.');
