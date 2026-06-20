import { FEEDBACK_TYPES } from '../models/Feedback.js';
import { body, validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';
import { AGE_GROUPS, STRUGGLES, INTERESTS, REPORT_REASONS } from '../config/constants.js';

// Collects express-validator errors into a single ApiError.
export const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(422, 'Validation failed', errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }))));
  }
  return next();
};

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),
  body('ageGroup').isIn(AGE_GROUPS).withMessage('Choose a valid age group'),
  body('interests').isArray({ min: 1 }).withMessage('Pick at least one interest'),
  body('interests.*').isIn(INTERESTS).withMessage('Invalid interest'),
  body('struggles').isArray({ min: 1 }).withMessage('Pick at least one struggle'),
  body('struggles.*').isIn(STRUGGLES).withMessage('Invalid struggle'),
  body('acceptedSafetyPolicy')
    .equals('true')
    .withMessage('You must accept the community safety policy'),
];

export const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const postRules = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Post must be 1–2000 chars'),
];

export const commentRules = [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1–1000 chars'),
];

export const reportRules = [
  body('reportedUser').isMongoId().withMessage('Invalid user'),
  body('reason').isIn(REPORT_REASONS).withMessage('Invalid reason'),
  body('description').optional().isLength({ max: 2000 }),
];

export const feedbackRules = [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message is required (max 2000 chars)'),
  body('type').optional().isIn(FEEDBACK_TYPES).withMessage('Invalid feedback type'),
  body('name').optional({ checkFalsy: true }).trim().isLength({ max: 80 }).withMessage('Name too long'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email').normalizeEmail(),
];
