import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { rateLimiter } from '../middleware/rateLimiter.middleware';
import validate from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const chatController = new ChatController();

const chatSchema = z.object({
  question: z.string().min(3).max(5000),
  documentIds: z.array(z.string().min(1)).optional(),
});

router.post(
  '/chat/query',
  rateLimiter,
  validate(chatSchema, 'body'),
  chatController.query.bind(chatController)
);

export default router;
