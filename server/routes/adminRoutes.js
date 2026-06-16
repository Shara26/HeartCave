import { Router } from 'express';
import {
  getStats,
  listUsers,
  getUserDetail,
  listReports,
  updateReport,
  listModerationLogs,
  reviewModerationLog,
  banUser,
  unbanUser,
  warnUser,
  suspendUser,
  adminDeletePost,
  getChatLogs,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);
router.put('/users/:id/warn', warnUser);
router.put('/users/:id/suspend', suspendUser);

router.get('/reports', listReports);
router.put('/reports/:id', updateReport);

router.get('/moderation', listModerationLogs);
router.put('/moderation/:id', reviewModerationLog);

router.delete('/posts/:id', adminDeletePost);
router.get('/matches/:id/messages', getChatLogs);

export default router;
