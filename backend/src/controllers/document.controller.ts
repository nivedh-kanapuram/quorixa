import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { createDocumentMetadata } from '../services/document.service';
import { ApiResponse } from '../types/response';

export class DocumentController {
  async uploadDocument(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction,
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
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
