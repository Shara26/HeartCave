import { Router } from 'express';
import authRoutes from './authRoutes.js';
import postRoutes from './postRoutes.js';
import matchRoutes from './matchRoutes.js';
import chatRoutes from './chatRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './adminRoutes.js';
import { DAILY_HOPE_MESSAGES, STRUGGLES, INTERESTS, AGE_GROUPS } from '../config/constants.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

// Public reference data for the registration form.
router.get('/meta', (req, res) =>
  res.json({ success: true, struggles: STRUGGLES, interests: INTERESTS, ageGroups: AGE_GROUPS })
);

// Daily hope message — random on each call (used on dashboard load).
router.get('/hope', (req, res) => {
  const msg = DAILY_HOPE_MESSAGES[Math.floor(Math.random() * DAILY_HOPE_MESSAGES.length)];
  res.json({ success: true, message: msg });
});

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/match', matchRoutes);
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
