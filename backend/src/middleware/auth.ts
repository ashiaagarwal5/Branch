import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { apiError } from '../utils/response';
import type { AccessTokenPayload } from '../types/auth';

function extractToken(header?: string | null) {
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  return parts[1];
}

export function requireAuth(requiredScopes: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req.header('Authorization'));
    if (!token) {
      return apiError(res, {
        status: 401,
        code: 'unauthorized',
        message: 'Authorization header missing or malformed',
      });
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
      if (payload.type !== 'access') {
        throw new Error('invalid token type');
      }

      req.auth = {
        userId: payload.sub,
        scopes: payload.scopes,
        tokenId: payload.jti,
        audience: payload.aud,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
        deviceId: payload.deviceId,
      };

      const missingScopes = requiredScopes.filter(
        (scope) => !payload.scopes.includes(scope)
      );
      if (missingScopes.length > 0) {
        return apiError(res, {
          status: 403,
          code: 'forbidden',
          message: `Missing required scopes: ${missingScopes.join(', ')}`,
        });
      }

      return next();
    } catch (error) {
      console.error('Token verification failed', error);
      return apiError(res, {
        status: 401,
        code: 'invalid_token',
        message: 'Invalid or expired access token',
      });
    }
  };
}
