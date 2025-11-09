import type { Request, Response, NextFunction } from 'express';
import type { AuthContext } from './auth';

export interface AuthenticatedRequest<
  Params = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  auth: AuthContext;
}

export type MaybeAuthenticatedRequest<
  Params = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>,
> = Request<Params, ResBody, ReqBody, ReqQuery> & {
  auth?: AuthContext;
};

export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export type AsyncRouteHandler<
  Req extends Request = Request,
  Res = any
> = (req: Req, res: Response<Res>) => Promise<void> | void;

