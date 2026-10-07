import { Request, Response, NextFunction } from 'express';
import { User, IUserDocument } from '../models/user.model';
import { BroadcastLog } from '../models/broadcastLog.model';
import { emailService } from '../services/email.service';
import { whatsappService } from '../services/whatsapp.service';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

// @desc    Get list of inactive students (10+ days since last activity)
// @route   GET /api/admin/broadcast/inactive-students
// @access  Protected (Admin only)
export const getInactiveStudents = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenDaysAgo = new Date(Date.now() - TEN_DAYS_MS);

    // Find active students where lastActivityDate or createdAt is <= 10 days ago
    const students = await User.find({
      role: 'student',
      isActive: true,
      $or: [
        { lastActivityDate: { $lte: tenDaysAgo } },
        { lastActivityDate: { $exists: false }, createdAt: { $lte: tenDaysAgo } },
      ],
    })
      .select('name email phone college learningStreak longestStreak lastActivityDate lastRetentionNotificationSentAt createdAt swagOrders')
      .sort({ lastActivityDate: 1, createdAt: 1 })
      .lean();

    const formattedStudents = students.map((s) => {
      const activityDate = s.lastActivityDate ? new Date(s.lastActivityDate) : new Date(s.createdAt);
      const daysInactive = Math.max(10, Math.floor((Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24)));
      const phone = s.phone || s.swagOrders?.[0]?.phone || '';

      const waText = `Hi ${s.name}! 👋 We miss you at NextEra Coders. Your ${s.learningStreak ? `${s.learningStreak}-day streak` : 'coding momentum'} misses you! Jump back in today: http://localhost:5173/problems`;
      const waLink = phone ? whatsappService.generateClickToChatLink(phone, waText) : null;

      return {
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        phone,
        college: s.college || '',
        learningStreak: s.learningStreak || 0,
        longestStreak: s.longestStreak || 0,
        lastActivityDate: activityDate.toISOString(),
        daysInactive,
        lastRetentionNotificationSentAt: s.lastRetentionNotificationSentAt || null,
        whatsAppLink: waLink,
      };
    });

    ApiResponse.success(res, `Found ${formattedStudents.length} students inactive for 10+ days`, {
      students: formattedStudents,
      totalInactive: formattedStudents.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    1-Click Blast to all Inactive Students (Email & WhatsApp links)
// @route   POST /api/admin/broadcast/blast-inactive
// @access  Protected (Admin only)
export const blastInactiveStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = req.user!;
    const { channels = ['email', 'whatsapp', 'in_app'], customMessage } = req.body;
    const tenDaysAgo = new Date(Date.now() - TEN_DAYS_MS);

    const students = await User.find({
      role: 'student',
      isActive: true,
      $or: [
        { lastActivityDate: { $lte: tenDaysAgo } },
        { lastActivityDate: { $exists: false }, createdAt: { $lte: tenDaysAgo } },
      ],
    });

    if (students.length === 0) {
      ApiResponse.success(res, 'No inactive students currently found (all students active within 10 days!)', {
        targetedCount: 0,
        emailSuccessCount: 0,
        whatsAppCount: 0,
      });
      return;
    }

    let emailSuccessCount = 0;
    let whatsAppCount = 0;
    let inAppCount = 0;
    const waChatLinks: Array<{ name: string; phone: string; link: string }> = [];

    for (const student of students) {
      const activityDate = student.lastActivityDate ? new Date(student.lastActivityDate) : new Date(student.createdAt);
      const daysInactive = Math.max(10, Math.floor((Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24)));
      const phone = student.phone || student.swagOrders?.[0]?.phone || '';

      // 1. Send Comeback Email
      if (channels.includes('email')) {
        try {
          await emailService.sendInactiveComebackEmail({
            studentName: student.name,
            studentEmail: student.email,
            daysInactive,
            lastStreak: student.learningStreak,
          });
          emailSuccessCount++;
        } catch (err: any) {
          logger.warn(`Failed to send comeback email to ${student.email}: ${err.message}`);
        }
      }

      // 2. Dispatch / Generate WhatsApp Comeback
      if (channels.includes('whatsapp') && phone) {
        try {
          const waRes = await whatsappService.sendInactiveComebackWhatsApp({
            studentName: student.name,
            phone,
            daysInactive,
            lastStreak: student.learningStreak,
          });
          if (waRes.success) whatsAppCount++;
          if (waRes.waMeLink) {
            waChatLinks.push({ name: student.name, phone, link: waRes.waMeLink });
          }
        } catch (err: any) {
          logger.warn(`Failed to dispatch WhatsApp comeback to ${phone}: ${err.message}`);
        }
      }

      // 3. In-App Notification
      if (channels.includes('in_app')) {
        try {
          await notificationService.createNotification({
            userId: student._id,
            title: '👋 We miss you! Keep your streak alive',
            message: customMessage || `You've been away for ${daysInactive} days. 15 minutes of coding today can keep your momentum sharp!`,
            type: 'LEARNING',
            link: '/problems',
          });
          inAppCount++;
        } catch (err: any) {
          logger.warn(`Failed to create in-app notification for ${student._id}: ${err.message}`);
        }
      }

      // Record timestamp of retention ping
      student.lastRetentionNotificationSentAt = new Date();
      await student.save();
    }

    // Save Broadcast Log
    await BroadcastLog.create({
      title: 'Come back & keep your streak alive! (10-Day Retention Alert)',
      message: customMessage || 'Automated re-engagement blast sent to students inactive for 10 or more days.',
      channels,
      targetAudience: 'inactive_10_days',
      recipientCount: students.length,
      emailSuccessCount,
      whatsAppLinksGenerated: waChatLinks.length,
      inAppCount,
      triggeredBy: adminUser._id,
      triggeredByName: adminUser.name,
      presetKey: 'inactive_comeback',
    });

    ApiResponse.success(res, `Comeback blast dispatched to ${students.length} inactive students`, {
      targetedCount: students.length,
      emailSuccessCount,
      whatsAppCount,
      inAppCount,
      whatsAppChatLinks: waChatLinks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Multi-Channel Broadcast Announcement (Email, WhatsApp, In-App)
// @route   POST /api/admin/broadcast/send
// @access  Protected (Admin only)
export const sendBroadcastAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = req.user!;
    const {
      title,
      message,
      link,
      channels = ['email', 'in_app'],
      targetAudience = 'all',
      targetUserId,
      presetKey = 'custom',
    } = req.body;

    if (!title?.trim() || !message?.trim()) {
      throw ApiError.badRequest('Title and message are required for broadcast');
    }

    let recipients: IUserDocument[] = [];

    if (targetAudience === 'single' && targetUserId) {
      const singleUser = await User.findById(targetUserId);
      if (!singleUser) throw ApiError.notFound('Target student not found');
      recipients = [singleUser];
    } else if (targetAudience === 'inactive_10_days') {
      const tenDaysAgo = new Date(Date.now() - TEN_DAYS_MS);
      recipients = await User.find({
        role: 'student',
        isActive: true,
        $or: [
          { lastActivityDate: { $lte: tenDaysAgo } },
          { lastActivityDate: { $exists: false }, createdAt: { $lte: tenDaysAgo } },
        ],
      });
    } else {
      // All active students
      recipients = await User.find({ role: 'student', isActive: true });
    }

    let emailSuccessCount = 0;
    let whatsAppSuccessCount = 0;
    let inAppCount = 0;
    const waChatLinks: Array<{ name: string; phone: string; link: string }> = [];

    // Dispatch In-App Notifications
    if (channels.includes('in_app')) {
      if (targetAudience === 'all') {
        inAppCount = await notificationService.broadcastAnnouncement(title, message, link);
      } else {
        for (const r of recipients) {
          try {
            await notificationService.createNotification({
              userId: r._id,
              title,
              message,
              type: 'SYSTEM',
              link: link || '/announcements',
            });
            inAppCount++;
          } catch (e: any) {
            logger.warn(`In-app notification error for ${r._id}: ${e.message}`);
          }
        }
      }
    }

    // Dispatch Emails & WhatsApp
    for (const r of recipients) {
      if (channels.includes('email') && r.email) {
        try {
          await emailService.sendBroadcastAnnouncementEmail({
            studentName: r.name,
            studentEmail: r.email,
            title,
            message,
            link,
            type: presetKey.toUpperCase(),
          });
          emailSuccessCount++;
        } catch (e: any) {
          logger.warn(`Broadcast email error for ${r.email}: ${e.message}`);
        }
      }

      const phone = r.phone || r.swagOrders?.[0]?.phone || '';
      if (channels.includes('whatsapp') && phone) {
        try {
          const waRes = await whatsappService.sendAnnouncementWhatsApp({
            name: r.name,
            phone,
            title,
            message,
            link,
            type: presetKey,
          });
          if (waRes.success) whatsAppSuccessCount++;
          if (waRes.waMeLink) {
            waChatLinks.push({ name: r.name, phone, link: waRes.waMeLink });
          }
        } catch (e: any) {
          logger.warn(`Broadcast WhatsApp error for ${phone}: ${e.message}`);
        }
      }
    }

    // Record Broadcast in Logs
    const log = await BroadcastLog.create({
      title,
      message,
      channels,
      targetAudience,
      recipientCount: recipients.length,
      emailSuccessCount,
      whatsAppLinksGenerated: waChatLinks.length,
      inAppCount,
      triggeredBy: adminUser._id,
      triggeredByName: adminUser.name,
      presetKey,
    });

    ApiResponse.success(res, `Broadcast successfully dispatched across ${channels.join(', ')}`, {
      log,
      recipientsTargeted: recipients.length,
      emailSuccessCount,
      whatsAppSuccessCount,
      inAppCount,
      whatsAppChatLinks: waChatLinks.slice(0, 20), // preview top 20 links
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get broadcast history & audit logs
// @route   GET /api/admin/broadcast/logs
// @access  Protected (Admin only)
export const getBroadcastLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      BroadcastLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BroadcastLog.countDocuments(),
    ]);

    ApiResponse.success(res, 'Broadcast logs retrieved', {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
