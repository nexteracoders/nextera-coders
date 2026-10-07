import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { getDatabaseStatus } from '../config/db';
import { config } from '../config/env';

export const getHealth = (_req: Request, res: Response): void => {
  const dbStatus = getDatabaseStatus();

  // Requirement format:
  // { "success": true, "message": "NextEra Coders Learning API is running" }
  ApiResponse.success(
    res,
    'NextEra Coders Learning API is running',
    {
      status: 'online',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: dbStatus,
    },
    200
  );
};
