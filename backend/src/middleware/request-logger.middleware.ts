import { NextFunction, Request, Response } from 'express';

import { logger } from '../config/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  logger.info({ method: req.method, url: req.originalUrl }, 'Incoming request');

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
      },
      'Request completed'
    );
  });

  next();
};

export default requestLogger;
