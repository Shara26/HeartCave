import { Router } from 'express';
import {
  findMatches,
  sendConnectionRequest,
  listRequests,
  respondToRequest,
  listMatches,
} from '../controllers/matchController.js';
import { protect } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(protect);

router.post('/find', writeLimiter, findMatches);
router.post('/request', writeLimiter, sendConnectionRequest);
router.get('/requests', listRequests);
router.post('/respond', respondToRequest);
router.get('/', listMatches);

export default router;
