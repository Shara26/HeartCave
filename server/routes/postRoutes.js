import { Router } from 'express';
import {
  createPost,
  listPosts,
  addComment,
  listComments,
  reactToPost,
  deletePost,
} from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { postRules, commentRules, runValidation } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.route('/').post(writeLimiter, postRules, runValidation, createPost).get(listPosts);
router.post('/:id/comment', writeLimiter, commentRules, runValidation, addComment);
router.get('/:id/comments', listComments);
router.post('/:id/react', reactToPost);
router.delete('/:id', deletePost);

export default router;
