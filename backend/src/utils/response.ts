import type { Response } from 'express';

interface Meta {
  [key: string]: unknown;
}

export function success<T>(
  res: Response,
  data: T,
  meta: Meta = {},
  status = 200
) {
  return res.status(status).json({ data, meta });
}

export interface ApiErrorOptions {
  status?: number;
  code: string;
  message: string;
  details?: unknown;
}

export function apiError(res: Response, options: ApiErrorOptions) {
  const { status = 400, code, message, details } = options;
  return res.status(status).json({
    error: {
      code,
      message,
      details,
    },
  });
}

