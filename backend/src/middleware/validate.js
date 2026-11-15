import { AppError } from '../utils/AppError.js';

/**
 * validate(schema, source) - parses req[source] with a zod schema.
 * On success the parsed (typed, trimmed, stripped) value is stored on req.validated[source]. 
 * Any handlers read from there instead of trusting raw input.
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(AppError.badRequest('Validation failed', details));
    }
    req.validated = { ...req.validated, [source]: result.data };
    return next();
  };
}