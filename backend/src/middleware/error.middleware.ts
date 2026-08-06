import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../config/logger';

export const errorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  if (err instanceof AppError) {
    logger.warn({ err }, 'Operational error');
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: err.data ?? null,
    });
  }

  logger.error({ err }, 'Unexpected error');
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    data: null,
  });
};
