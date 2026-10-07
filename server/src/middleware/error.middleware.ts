import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Custom ApiError
  if (err instanceof ApiError) {
    ApiResponse.error(res, err.message, err.code, err.statusCode);
    return;
  }

  // 2. Mongoose Invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    ApiResponse.error(
      res,
      `Resource not found with the specified ID (${err.value})`,
      'INVALID_RESOURCE_ID',
      400
    );
    return;
  }

  // 3. Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    ApiResponse.error(
      res,
      `Duplicate entry for field(s): ${fields || 'unique property'}`,
      'DUPLICATE_KEY_ERROR',
      409
    );
    return;
  }

  // 4. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join('; ');
    ApiResponse.error(
      res,
      messages || 'Validation failed for model payload',
      'VALIDATION_ERROR',
      422
    );
    return;
  }

  // 5. JSON Syntax Error
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    ApiResponse.error(
      res,
      'Malformed JSON request payload provided',
      'INVALID_JSON_BODY',
      400
    );
    return;
  }

  // 6. Generic Unexpected Exception
  logger.error('Unhandled Exception:', err);

  const message =
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred. Please try again later.'
      : err.message || 'Something went wrong';

  ApiResponse.error(res, message, 'INTERNAL_SERVER_ERROR', 500);
}
