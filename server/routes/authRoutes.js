import { Router } from 'express';
import { register, login, logout, refresh, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerRules, loginRules, runValidation } from '../middleware/validate.js';

const router = Router();

router.post('/register', authLimiter, registerRules, runValidation, register);
router.post('/login', authLimiter, loginRules, runValidation, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;
