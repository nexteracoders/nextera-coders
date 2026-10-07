import { Types } from 'mongoose';
import { AuditLog, AuditAction, AuditResourceType } from '../models/auditLog.model';

export const auditLogService = {
  async recordLog(options: {
    adminId: Types.ObjectId | string;
    action: AuditAction;
    resourceType: AuditResourceType;
    resourceId?: string;
    resourceTitle?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await AuditLog.create({
        adminId: new Types.ObjectId(options.adminId),
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        resourceTitle: options.resourceTitle,
        metadata: options.metadata || {},
        ipAddress: options.ipAddress,
      });
    } catch (err) {
      console.error('[AuditLog] Failed to record log:', err);
    }
  },

  async getLogs(options: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
    adminId?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 25;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (options.action) query.action = options.action;
    if (options.resourceType) query.resourceType = options.resourceType;
    if (options.adminId && Types.ObjectId.isValid(options.adminId)) {
      query.adminId = new Types.ObjectId(options.adminId);
    }

    const [logs, totalItems] = await Promise.all([
      AuditLog.find(query)
        .populate('adminId', 'name email profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs: logs.map((l: any) => ({
        id: l._id.toString(),
        admin: l.adminId
          ? {
              id: l.adminId._id.toString(),
              name: l.adminId.name,
              email: l.adminId.email,
              profileImage: l.adminId.profileImage,
            }
          : null,
        action: l.action,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        resourceTitle: l.resourceTitle,
        metadata: l.metadata,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit) || 1,
        totalItems,
        limit,
      },
    };
  },
};
