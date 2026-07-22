import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Target = 'body' | 'query' | 'params';

/** Parses+replaces req[target] with the schema's output (so defaults/coercions apply downstream). */
export function validate(schema: ZodTypeAny, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (err) {
      next(err); // ZodError is handled centrally by errorHandler
    }
  };
}
