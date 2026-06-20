import { Router } from 'express';
import {
  submitFeedback,
  listFeedback,
  deleteFeedback,
} from '../controllers/feedbackController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { feedbackRules, runValidation } from '../middleware/validate.js';

const router = Router();
router.use(protect); // all feedback routes require a logged-in user

// User submits feedback — writeLimiter (30/min) curbs spam.
router.post('/', writeLimiter, feedbackRules, runValidation, submitFeedback);

// Admin-only management.
router.get('/admin', adminOnly, listFeedback);
router.delete('/admin/:id', adminOnly, deleteFeedback);

export default router;