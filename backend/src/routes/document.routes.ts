import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { upload } from '../middleware/upload.middleware';
import validate from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const documentController = new DocumentController();

router.post(
  '/documents/upload',
  upload.single('file'),
  documentController.uploadDocument.bind(documentController)
);

const youtubeSchema = z.object({ url: z.string().url() });

router.post(
  '/documents/upload/youtube',
  validate(youtubeSchema, 'body'),
  documentController.uploadYoutube.bind(documentController)
);

export default router;
