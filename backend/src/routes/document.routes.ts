import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();
const documentController = new DocumentController();

router.post(
  '/documents/upload',
  upload.single('file'),
  documentController.uploadDocument.bind(documentController),
);

export default router;
