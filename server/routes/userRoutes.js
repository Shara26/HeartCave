import { Router } from 'express';
import {
  submitRating,
  createReport,
  blockUser,
  unblockUser,
  getPublicProfile,
  getNotifications,
  markNotificationsRead,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { reportRules, runValidation } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.post('/ratings', submitRating);
router.post('/reports', reportRules, runValidation, createReport);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsRead);
router.get('/:id/profile', getPublicProfile);
//router.post('/notifications/:id/read', markOneNotificationRead);

export default router;
