import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async Express handler so any thrown error or rejected promise is
 * forwarded to next(err). Without this, Express 4 silently hangs the request.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

