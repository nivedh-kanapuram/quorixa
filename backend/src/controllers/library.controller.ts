import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import {
  deleteDocumentById,
  getDocumentById,
  getLibraryDocuments,
  reprocessDocumentById,
  renameDocumentById,
} from '../services/document.service';
import { logger } from '../config/logger';

export class LibraryController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const search =
        typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const sort =
        typeof req.query.sort === 'string'
          ? req.query.sort.trim()
          : '-uploadDate';

      logger.info(
        { page, limit, search, sort },
        'Library list request received'
      );

      const result = await getLibraryDocuments({ page, limit, search, sort });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to list library documents';
      logger.error({ err: error }, 'Library list failed');
      next(new AppError(message, 500));
    }
  }

  async details(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(
        { documentId: id },
        'Library document details request received'
      );

      const document = await getDocumentById(id);

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to retrieve document';
      logger.error({ err: error }, 'Library document details failed');
      next(
        new AppError(
          message,
          error instanceof AppError ? error.statusCode : 500
        )
      );
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ documentId: id }, 'Library delete request received');

      await deleteDocumentById(id);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete document';
      logger.error({ err: error }, 'Library delete failed');
      next(
        new AppError(
          message,
          error instanceof AppError ? error.statusCode : 500
        )
      );
    }
  }

  async reprocess(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ documentId: id }, 'Library reprocess request received');

      const document = await reprocessDocumentById(id);

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to reprocess document';
      logger.error({ err: error }, 'Library reprocess failed');
      next(
        new AppError(
          message,
          error instanceof AppError ? error.statusCode : 500
        )
      );
    }
  }

  async rename(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const name =
        typeof req.body.name === 'string' ? req.body.name.trim() : '';

      if (!name) {
        throw new AppError('Name is required', 400);
      }

      if (name.length < 1 || name.length > 255) {
        throw new AppError('Name must be between 1 and 255 characters', 400);
      }

      logger.info({ documentId: id, name }, 'Library rename request received');
      const document = await renameDocumentById(id, name);

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to rename document';
      logger.error({ err: error }, 'Library rename failed');
      next(
        new AppError(
          message,
          error instanceof AppError ? error.statusCode : 500
        )
      );
    }
  }
}
