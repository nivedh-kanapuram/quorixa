import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../errors/app-error';

type Target = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: Target = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const toValidate = (req as any)[target];
    const result = schema.safeParse(toValidate);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ');
      return next(new AppError(message, 400));
    }
    // replace with parsed values
    (req as any)[target] = result.data;
    return next();
  };
};

export default validate;
