import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  checkMessage,
  markRead,
  leaveConversation,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(protect);

router.post('/check', checkMessage);
router.post('/send', writeLimiter, sendMessage);
router.get('/:matchId', getMessages);
router.post('/:matchId/read', markRead);
router.post('/:matchId/leave', leaveConversation);

export default router;
