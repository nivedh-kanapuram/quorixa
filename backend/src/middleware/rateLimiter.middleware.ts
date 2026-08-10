import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from '../errors/app-error';

type Entry = { count: number; resetAt: number };

const map = new Map<string, Entry>();

export const rateLimiter = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const key =
    req.ip ??
    (req.headers['x-forwarded-for']
      ? String(req.headers['x-forwarded-for'])
      : 'unknown');
  const now = Date.now();
  const windowMs = env.rateLimitWindowMs ?? 60_000;
  const max = env.rateLimitMax ?? 60;

  const existing = map.get(key);
  if (!existing || existing.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (existing.count >= max) {
    return next(new AppError('Too many requests, please try again later', 429));
  }

  existing.count += 1;
  map.set(key, existing);
  return next();
};

export default rateLimiter;
