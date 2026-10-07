import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response): void {
  ApiResponse.error(
    res,
    `The requested API endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
    'RESOURCE_NOT_FOUND',
    404
  );
}
