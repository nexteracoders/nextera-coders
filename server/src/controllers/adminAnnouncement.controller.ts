import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Announcement } from '../models/announcement.model';
import { User } from '../models/user.model';
import { Notification, NotificationType } from '../models/notification.model';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { whatsappService } from '../services/whatsapp.service';
import { auditLogService } from '../services/auditLog.service';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// @desc    Admin: Get all announcements
// @route   GET /api/admin/announcements
// @access  Protected (Admin)
export const adminGetAnnouncements = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    ApiResponse.success(
      res,
      'Admin announcements retrieved',
      {
        announcements: announcements.map((a: any) => ({
          id: a._id.toString(),
          title: a.title,
          message: a.message,
          type: a.type,
          link: a.link,
          isPublished: a.isPublished,
          publishedAt: a.publishedAt,
          createdBy: a.createdBy ? { name: a.createdBy.name, email: a.createdBy.email } : null,
          createdAt: a.createdAt,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create announcement
// @route   POST /api/admin/announcements
// @access  Protected (Admin)
export const adminCreateAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, message, type, link, isPublished } = req.body;
    const admin = req.user!;

    if (!title || !message) {
      throw ApiError.badRequest('Title and message are required');
    }

    const shouldPublish = isPublished !== undefined ? Boolean(isPublished) : true;

    const announcement = await Announcement.create({
      title,
      message,
      type: type || 'GENERAL',
      link: link || '',
      isPublished: shouldPublish,
      publishedAt: shouldPublish ? new Date() : undefined,
      createdBy: admin._id,
    });

    if (shouldPublish) {
      // Trigger student notifications broadcast
      notificationService
        .broadcastAnnouncement(title, message, link)
        .catch((err) => console.error('Broadcast notification error:', err));
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: shouldPublish ? 'PUBLISH' : 'CREATE',
      resourceType: 'ANNOUNCEMENT',
      resourceId: announcement._id.toString(),
      resourceTitle: announcement.title,
    });

    ApiResponse.success(
      res,
      'Announcement created successfully',
      { announcement },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update announcement
// @route   PUT /api/admin/announcements/:id
// @access  Protected (Admin)
export const adminUpdateAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid announcement ID');
    }

    const announcement = await Announcement.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!announcement) {
      throw ApiError.notFound('Announcement not found');
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'ANNOUNCEMENT',
      resourceId: announcement._id.toString(),
      resourceTitle: announcement.title,
    });

    ApiResponse.success(res, 'Announcement updated successfully', { announcement }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Protected (Admin)
export const adminDeleteAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid announcement ID');
    }

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      throw ApiError.notFound('Announcement not found');
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'DELETE',
      resourceType: 'ANNOUNCEMENT',
      resourceId: id,
      resourceTitle: announcement.title,
    });

    ApiResponse.success(res, 'Announcement deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Toggle publish status on announcement
// @route   PATCH /api/admin/announcements/:id/publish
// @access  Protected (Admin)
export const adminPublishAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid announcement ID');
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw ApiError.notFound('Announcement not found');
    }

    announcement.isPublished = !announcement.isPublished;
    if (announcement.isPublished) {
      announcement.publishedAt = new Date();
      notificationService
        .broadcastAnnouncement(announcement.title, announcement.message, announcement.link)
        .catch((err) => console.error('Broadcast notification error:', err));
    }
    await announcement.save();

    await auditLogService.recordLog({
      adminId: admin._id,
      action: announcement.isPublished ? 'PUBLISH' : 'UNPUBLISH',
      resourceType: 'ANNOUNCEMENT',
      resourceId: announcement._id.toString(),
      resourceTitle: announcement.title,
    });

    ApiResponse.success(
      res,
      `Announcement ${announcement.isPublished ? 'published' : 'unpublished'} successfully`,
      { announcement },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Multi-Channel Announcement Broadcast (In-App, Email, WhatsApp)
// @route   POST /api/admin/announcements/broadcast
// @access  Protected (Admin)
export const adminBroadcastAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      message,
      type = 'GENERAL',
      link = '',
      channels = ['in_app'],
      targetAudience = 'all', // 'all' | 'pro' | 'inactive'
    } = req.body;
    const admin = req.user!;

    if (!title?.trim() || !message?.trim()) {
      throw ApiError.badRequest('Title and message are required for broadcast');
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      throw ApiError.badRequest('At least one broadcast channel (in_app, email, whatsapp) must be selected');
    }

    // 1. Build recipient filter according to target audience
    let audienceQuery: any = { role: 'student', isActive: { $ne: false } };
    if (targetAudience === 'pro') {
      audienceQuery.isPro = true;
    } else if (targetAudience === 'inactive') {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      audienceQuery.$or = [
        { lastActivityDate: { $lte: tenDaysAgo } },
        { lastActivityDate: { $exists: false }, createdAt: { $lte: tenDaysAgo } },
      ];
    }

    const recipients = await User.find(audienceQuery)
      .select('_id name email phone swagOrders')
      .lean();

    if (recipients.length === 0) {
      ApiResponse.success(
        res,
        'No matching students found for the selected audience',
        {
          totalAudience: 0,
          delivered: { inApp: 0, email: 0, whatsapp: 0 },
        },
        200
      );
      return;
    }

    let inAppCount = 0;
    let emailCount = 0;
    let whatsappCount = 0;

    // 2. Channel: In-App Notifications
    if (channels.includes('in_app')) {
      const inAppDocs = recipients.map((u) => ({
        userId: u._id,
        title,
        message,
        type: 'ANNOUNCEMENT' as NotificationType,
        link: link || '/announcements',
        isRead: false,
      }));

      const inserted = await Notification.insertMany(inAppDocs);
      inAppCount = inserted.length;
    }

    // 3. Channel: Email Broadcast
    if (channels.includes('email')) {
      const emailRecipients = recipients.filter((u) => u.email && u.email.includes('@'));
      emailCount = emailRecipients.length;

      // Dispatch asynchronously without blocking admin response
      (async () => {
        for (const student of emailRecipients) {
          try {
            await emailService.sendBroadcastAnnouncementEmail({
              studentName: student.name || 'NextEra Coder',
              studentEmail: student.email,
              title,
              message,
              link,
              type,
            });
          } catch (err: any) {
            logger.error(`[BROADCAST EMAIL ERROR] Failed for ${student.email}: ${err.message}`);
          }
        }
      })().catch((err) => logger.error(`[BROADCAST EMAIL RUNNER ERROR]: ${err.message}`));
    }

    // 4. Channel: WhatsApp Broadcast
    if (channels.includes('whatsapp')) {
      const waRecipients = recipients.filter((u) => {
        const phone = u.phone || (u.swagOrders && u.swagOrders[0]?.phone);
        return Boolean(phone && phone.trim().length >= 10);
      });
      whatsappCount = waRecipients.length;

      // Dispatch asynchronously
      (async () => {
        for (const student of waRecipients) {
          const phone = student.phone || student.swagOrders![0].phone;
          try {
            await whatsappService.sendAnnouncementWhatsApp({
              name: student.name || 'NextEra Coder',
              phone,
              title,
              message,
              link,
              type,
            });
          } catch (err: any) {
            logger.error(`[BROADCAST WA ERROR] Failed for ${phone}: ${err.message}`);
          }
        }
      })().catch((err) => logger.error(`[BROADCAST WA RUNNER ERROR]: ${err.message}`));
    }

    // 5. Also save announcement in catalog for permanent record
    const announcementDoc = await Announcement.create({
      title,
      message,
      type: type || 'GENERAL',
      link: link || '',
      isPublished: true,
      publishedAt: new Date(),
      createdBy: admin._id,
    });

    // 6. Record Audit Log
    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'PUBLISH',
      resourceType: 'ANNOUNCEMENT',
      resourceId: announcementDoc._id.toString(),
      resourceTitle: `[BROADCAST] ${title} (${channels.join(', ')}) to ${targetAudience} (${recipients.length} users)`,
    });

    ApiResponse.success(
      res,
      `Multi-channel broadcast initiated successfully to ${recipients.length} students!`,
      {
        totalAudience: recipients.length,
        delivered: {
          inApp: inAppCount,
          email: emailCount,
          whatsapp: whatsappCount,
        },
        channels,
        targetAudience,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get 10-day inactive students retention stats
// @route   GET /api/admin/announcements/inactive-stats
// @access  Protected (Admin)
export const adminGetInactiveRetentionStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = Date.now();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const inactiveQuery = {
      role: 'student',
      isActive: { $ne: false },
      $or: [
        { lastActivityDate: { $lte: tenDaysAgo } },
        { lastActivityDate: { $exists: false }, createdAt: { $lte: tenDaysAgo } },
      ],
    };

    const totalInactive = await User.countDocuments(inactiveQuery);

    const [withPhoneCount, recentlyRemindedCount, sampleStudents] = await Promise.all([
      User.countDocuments({
        ...inactiveQuery,
        $or: [
          { phone: { $exists: true, $ne: '' } },
          { 'swagOrders.phone': { $exists: true, $ne: '' } },
        ],
      }),
      User.countDocuments({
        ...inactiveQuery,
        lastRetentionNotificationSentAt: { $gte: sevenDaysAgo },
      }),
      User.find(inactiveQuery)
        .select('name email phone college learningStreak lastActivityDate lastRetentionNotificationSentAt createdAt')
        .sort({ lastActivityDate: 1, createdAt: 1 })
        .limit(20)
        .lean(),
    ]);

    const eligibleForBlast = Math.max(0, totalInactive - recentlyRemindedCount);

    ApiResponse.success(
      res,
      'Inactive students retention statistics retrieved',
      {
        totalInactive,
        eligibleForBlast,
        recentlyReminded: recentlyRemindedCount,
        withPhoneCount,
        sampleStudents: sampleStudents.map((s: any) => {
          const lastActive = s.lastActivityDate || s.createdAt;
          const daysInactive = Math.floor((now - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: s._id.toString(),
            name: s.name,
            email: s.email,
            phone: s.phone || '',
            college: s.college || '',
            learningStreak: s.learningStreak || 0,
            daysInactive,
            lastActiveDate: lastActive,
            remindedRecently: Boolean(
              s.lastRetentionNotificationSentAt && new Date(s.lastRetentionNotificationSentAt) >= sevenDaysAgo
            ),
            lastRetentionSentAt: s.lastRetentionNotificationSentAt,
          };
        }),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Trigger 10-day inactive users "Come Back" reminder blast
// @route   POST /api/admin/announcements/inactive-blast
// @access  Protected (Admin)
export const adminTriggerInactiveBlast = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admin = req.user!;
    const now = Date.now();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Find students inactive for 10+ days who haven't received a reminder in the last 7 days
    const eligibleStudents = await User.find({
      role: 'student',
      isActive: { $ne: false },
      $or: [
        { lastActivityDate: { $lte: tenDaysAgo } },
        { lastActivityDate: { $exists: false }, createdAt: { $lte: tenDaysAgo } },
      ],
      $and: [
        {
          $or: [
            { lastRetentionNotificationSentAt: { $exists: false } },
            { lastRetentionNotificationSentAt: null },
            { lastRetentionNotificationSentAt: { $lt: sevenDaysAgo } },
          ],
        },
      ],
    })
      .select('_id name email phone swagOrders learningStreak lastActivityDate createdAt')
      .lean();

    if (eligibleStudents.length === 0) {
      ApiResponse.success(
        res,
        'No eligible inactive students found (either all active or recently reminded within the 7-day cooldown)',
        {
          eligibleCount: 0,
          delivered: { email: 0, whatsapp: 0, inApp: 0 },
        },
        200
      );
      return;
    }

    const eligibleIds = eligibleStudents.map((s) => s._id);

    // 1. In-App Comeback Notifications
    const inAppDocs = eligibleStudents.map((s) => ({
      userId: s._id,
      title: 'We miss you! 🚀 Keep your coding momentum going',
      message:
        'It has been over 10 days since your last practice session. New coding problems, weekly contests, and 1vs1 duels are waiting for you!',
      type: 'ANNOUNCEMENT' as NotificationType,
      link: '/problems',
      isRead: false,
    }));
    await Notification.insertMany(inAppDocs);

    // 2. Mark cooldown timestamp on eligible students
    await User.updateMany(
      { _id: { $in: eligibleIds } },
      { $set: { lastRetentionNotificationSentAt: new Date() } }
    );

    let emailedCount = 0;
    let whatsappCount = 0;

    // 3. Dispatch Emails & WhatsApp asynchronously
    (async () => {
      for (const student of eligibleStudents) {
        const lastActive = student.lastActivityDate || student.createdAt;
        const daysInactive = Math.max(10, Math.floor((now - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)));

        // Email
        if (student.email && student.email.includes('@')) {
          emailedCount++;
          try {
            await emailService.sendInactiveComebackEmail({
              studentName: student.name || 'NextEra Coder',
              studentEmail: student.email,
              daysInactive,
              lastStreak: student.learningStreak,
            });
          } catch (err: any) {
            logger.error(`[RETENTION EMAIL ERROR] Failed for ${student.email}: ${err.message}`);
          }
        }

        // WhatsApp
        const phone = student.phone || (student.swagOrders && student.swagOrders[0]?.phone);
        if (phone && phone.trim().length >= 10) {
          whatsappCount++;
          try {
            await whatsappService.sendInactiveComebackWhatsApp({
              studentName: student.name || 'NextEra Coder',
              phone,
              daysInactive,
              lastStreak: student.learningStreak,
            });
          } catch (err: any) {
            logger.error(`[RETENTION WA ERROR] Failed for ${phone}: ${err.message}`);
          }
        }
      }
    })().catch((err) => logger.error(`[RETENTION BLAST RUNNER ERROR]: ${err.message}`));

    // 4. Record Audit Log
    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'ANNOUNCEMENT',
      resourceId: admin._id.toString(),
      resourceTitle: `[RETENTION BLAST] Re-engagement blast sent to ${eligibleStudents.length} inactive students`,
    });

    ApiResponse.success(
      res,
      `10-Day retention comeback blast dispatched to ${eligibleStudents.length} inactive students!`,
      {
        eligibleCount: eligibleStudents.length,
        delivered: {
          inApp: eligibleStudents.length,
          email: eligibleStudents.filter((s) => s.email?.includes('@')).length,
          whatsapp: eligibleStudents.filter(
            (s) => s.phone || (s.swagOrders && s.swagOrders[0]?.phone)
          ).length,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

