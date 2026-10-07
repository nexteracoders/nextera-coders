import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '../services/auditLog.service';
import { ApiResponse } from '../utils/apiResponse';

// @desc    Get paginated audit logs
// @route   GET /api/admin/audit-logs
// @access  Protected (Admin)
export const getAdminAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const action = req.query.action as string;
    const resourceType = req.query.resourceType as string;
    const adminId = req.query.adminId as string;

    const result = await auditLogService.getLogs({
      page,
      limit,
      action,
      resourceType,
      adminId,
    });

    ApiResponse.success(res, 'Audit logs retrieved', result, 200);
  } catch (error) {
    next(error);
  }
};
