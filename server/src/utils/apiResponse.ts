import { Response } from 'express';
import { ApiResponseSuccess, ApiResponseError } from '../types/api.types';

export class ApiResponse {
  static success<T>(
    res: Response,
    message: string = 'Operation successful',
    data?: T,
    statusCode: number = 200
  ): Response {
    const payload: ApiResponseSuccess<T> = {
      success: true,
      message,
    };
    if (data !== undefined) {
      payload.data = data;
    }
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    message: string = 'Something went wrong',
    code: string = 'ERROR',
    statusCode: number = 500
  ): Response {
    const payload: ApiResponseError = {
      success: false,
      message,
      code,
    };
    return res.status(statusCode).json(payload);
  }
}
