import { Router } from 'express';
import { LibraryController } from '../controllers/library.controller';
import validate from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const libraryController = new LibraryController();

const idParam = z.object({ id: z.string().min(1) });
const renameBody = z.object({ name: z.string().min(1).max(255) });
const listQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
});

router.get(
  '/library',
  validate(listQuery, 'query'),
  libraryController.list.bind(libraryController)
);
router.get(
  '/library/:id',
  validate(idParam, 'params'),
  libraryController.details.bind(libraryController)
);
router.delete(
  '/library/:id',
  validate(idParam, 'params'),
  libraryController.delete.bind(libraryController)
);
router.patch(
  '/library/:id/reprocess',
  validate(idParam, 'params'),
  libraryController.reprocess.bind(libraryController)
);
router.patch(
  '/library/:id/rename',
  validate(idParam, 'params'),
  validate(renameBody, 'body'),
  libraryController.rename.bind(libraryController)
);

export default router;
