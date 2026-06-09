import type { NextFunction, Request, Response } from "express";

export function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>
) {
  return function wrapped(request: Request, response: Response, next: NextFunction) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
