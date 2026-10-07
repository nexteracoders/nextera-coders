import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';

export const getAdminTest = (req: Request, res: Response): void => {
  ApiResponse.success(
    res,
    'Admin access granted. Authorization working properly.',
    {
      message: 'You have verified administrative authorization on NextEra Coders.',
      admin: req.user ? req.user.toSanitizedUser() : null,
      timestamp: new Date().toISOString(),
    },
    200
  );
};
