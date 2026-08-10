import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import {
  createDocumentMetadata,
  createYoutubeDocument,
} from '../services/document.service';
import { ApiResponse } from '../types/response';

export class DocumentController {
  async uploadDocument(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        throw new AppError('File is required', 400);
      }

      const document = await createDocumentMetadata(file);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: document._id,
          originalFilename: document.originalFilename,
          storedFilename: document.storedFilename,
          mimeType: document.mimeType,
          size: document.size,
          status: document.status,
          uploadedAt: document.uploadedAt,
          languages: Array.isArray(document.metadata?.languages)
            ? document.metadata.languages
            : [],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadYoutube(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const url = typeof req.body.url === 'string' ? req.body.url.trim() : '';
      if (!url) {
        throw new AppError('YouTube URL is required', 400);
      }

      const document = await createYoutubeDocument(url);

      res.status(201).json({
        success: true,
        message: 'YouTube transcript uploaded successfully',
        data: {
          id: document._id,
          originalFilename: document.originalFilename,
          storedFilename: document.storedFilename,
          mimeType: document.mimeType,
          size: document.size,
          status: document.status,
          uploadedAt: document.uploadedAt,
          languages: Array.isArray(document.metadata?.languages)
            ? document.metadata.languages
            : [],
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
