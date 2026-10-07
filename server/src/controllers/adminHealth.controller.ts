import { Request, Response, NextFunction } from 'express';
import { systemHealthService } from '../services/systemHealth.service';
import { ApiResponse } from '../utils/apiResponse';

// @desc    Get real-time system, memory, Judge0 quota, and execution health metrics
// @route   GET /api/admin/health/metrics
// @access  Protected (Admin)
export const getAdminSystemHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const metrics = await systemHealthService.getComprehensiveMetrics();
    ApiResponse.success(res, 'System health metrics retrieved successfully', metrics, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Perform instantaneous live ping test against Judge0 cluster
// @route   POST /api/admin/health/test-judge0
// @access  Protected (Admin)
export const testJudge0Ping = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await systemHealthService.pingJudge0(true);
    ApiResponse.success(res, 'Judge0 live probe completed', result, 200);
  } catch (error) {
    next(error);
  }
};
