import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../errors/app-error';
import { logger } from '../config/logger';

const friendlyUploadErrors: Record<
  string,
  { status: number; message: string }
> = {
  LIMIT_FILE_SIZE: {
    status: 400,
    message: 'File is too large. The maximum allowed size is 10 MB.',
  },
  LIMIT_FILE_COUNT: {
    status: 400,
    message: 'Too many files were uploaded in a single request.',
  },
  LIMIT_UNEXPECTED_FILE: {
    status: 400,
    message: 'Unexpected file field in the upload request.',
  },
};

export const errorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    logger.warn({ err }, 'Operational error');
    const code =
      typeof err.data === 'object' &&
      err.data !== null &&
      'code' in err.data &&
      typeof (err.data as { code: unknown }).code === 'string'
        ? (err.data as { code: string }).code
        : `ERR_${err.statusCode}`;
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: code,
      timestamp,
    });
  }

  if (err instanceof multer.MulterError) {
    const mapped = friendlyUploadErrors[err.code];
    logger.warn({ err }, 'Upload validation error');
    return res.status(mapped?.status ?? 400).json({
      success: false,
      message: mapped?.message ?? 'File upload failed. Please try again.',
      errorCode: mapped ? `ERR_${mapped.status}` : 'ERR_400',
      timestamp,
    });
  }

  if (
    err instanceof SyntaxError &&
    'body' in err &&
    (err as SyntaxError & { status?: number }).status === 400 &&
    (err as SyntaxError & { type?: string }).type === 'entity.parse.failed'
  ) {
    logger.warn({ err }, 'Malformed JSON body');
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body.',
      errorCode: 'ERR_400',
      timestamp,
    });
  }

  if (err instanceof Error && err.message === 'Unsupported file type') {
    logger.warn({ err }, 'Upload type rejected');
    return res.status(400).json({
      success: false,
      message:
        'Unsupported file type. Please upload a PDF, image (.png/.jpg/.jpeg) or text (.txt/.md) file.',
      errorCode: 'ERR_400',
      timestamp,
    });
  }

  logger.error({ err }, 'Unexpected error');
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errorCode: 'ERR_500',
    timestamp,
  });
};
