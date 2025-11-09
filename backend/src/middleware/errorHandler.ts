import type { Request, Response, NextFunction } from 'express';
import { apiError } from '../utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Request error', {
    message: err?.message,
    stack: err?.stack,
  });

  if (err?.status && err?.code) {
    return apiError(res, {
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  return apiError(res, {
    status: 500,
    code: 'internal_error',
    message: 'An unexpected error occurred',
  });
}
