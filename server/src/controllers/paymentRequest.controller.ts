import { Request, Response } from 'express';
import { PaymentRequest } from '../models/paymentRequest.model';
import { Enrollment } from '../models/enrollment.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { AuditLog } from '../models/auditLog.model';
import { emailService } from '../services/email.service';
import { notificationService } from '../services/notification.service';

// POST /api/v1/payments/requests (Student)
export const submitPaymentRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = (req as any).user;
    let userId = authUser?._id || authUser?.id;

    const {
      type,
      courseId,
      courseTitle,
      planId,
      amount,
      paymentMethod,
      transactionId,
      payerUpiId,
      screenshotUrl,
      notes,
      userEmail: bodyEmail,
      userName: bodyName,
      email: altEmail,
      name: altName,
    } = req.body;

    if (!type || !transactionId) {
      res.status(400).json({
        success: false,
        message: 'Type and 12-digit transaction ID (UTR) are required',
      });
      return;
    }

    let finalEmail = (bodyEmail || altEmail || authUser?.email || '').trim().toLowerCase();
    let finalName = (bodyName || altName || authUser?.name || 'Student').trim();

    // If user is not logged in via token, try finding by email
    let user = authUser;
    if (!user && finalEmail) {
      user = await User.findOne({ email: finalEmail });
      if (user) {
        userId = user._id;
        if (!finalName || finalName === 'Student') finalName = user.name;
      }
    }

    if (!finalEmail) {
      finalEmail = payerUpiId ? `${payerUpiId.replace(/[^a-zA-Z0-9]/g, '')}@student.upi` : 'student@nexteracoders.com';
    }

    let resolvedCourseTitle = courseTitle;
    if (type === 'course' && courseId && !resolvedCourseTitle) {
      try {
        const course = await Course.findById(courseId);
        if (course) resolvedCourseTitle = course.title;
      } catch {
        // courseId might be a slug or custom string
      }
    }

    const cleanTxId = String(transactionId).trim();
    const cleanAmount = Number(amount) || 0;

    // Check if duplicate transaction ID is already handled
    const existing = await PaymentRequest.findOne({
      transactionId: cleanTxId,
    });

    if (existing) {
      if (existing.status === 'approved') {
        res.status(400).json({
          success: false,
          message: 'This Transaction ID (UTR) has already been approved and verified.',
        });
        return;
      }

      // If pending or rejected, update it and return success
      existing.type = type;
      if (courseId) existing.courseId = String(courseId);
      if (resolvedCourseTitle) existing.courseTitle = resolvedCourseTitle;
      if (planId) existing.planId = planId;
      existing.amount = cleanAmount;
      existing.paymentMethod = paymentMethod || 'UPI_QR';
      if (payerUpiId) existing.payerUpiId = payerUpiId.trim();
      if (screenshotUrl) existing.screenshotUrl = screenshotUrl.trim();
      if (notes) existing.notes = notes.trim();
      existing.status = 'pending';
      existing.rejectionReason = undefined;
      await existing.save();

      // Notify admins
      try {
        const admins = await User.find({ role: 'admin' }).select('_id email').lean();
        for (const admin of admins) {
          await notificationService.createNotification({
            userId: admin._id,
            title: '🔔 Payment Verification Updated',
            message: `${finalName} (${finalEmail}) re-submitted verification for ₹${cleanAmount} (Ref: ${cleanTxId}). Please review.`,
            type: 'PAYMENT',
            link: '/admin/payments',
            referenceType: 'PAYMENT_REQUEST',
            referenceId: existing._id.toString(),
          });
        }
      } catch {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Payment verification details updated successfully. Awaiting admin review.',
        data: existing,
      });
      return;
    }

    const paymentRequest = await PaymentRequest.create({
      userId: userId || undefined,
      userEmail: finalEmail,
      userName: finalName,
      type,
      courseId: type === 'course' && courseId ? String(courseId) : undefined,
      courseTitle: resolvedCourseTitle || (type === 'pro_one' ? 'NEC Pro One All-Access' : 'Pro Course'),
      planId: type === 'pro_one' ? planId || 'yearly' : undefined,
      amount: cleanAmount,
      paymentMethod: paymentMethod || 'UPI_QR',
      transactionId: cleanTxId,
      payerUpiId: payerUpiId?.trim(),
      screenshotUrl: screenshotUrl?.trim(),
      notes: notes?.trim(),
      status: 'pending',
    });

    // Create confirmation notification if user account is attached
    if (userId) {
      try {
        await notificationService.createNotification({
          userId: userId,
          title: 'Payment Verification Received ⏳',
          message: `Your payment of ₹${cleanAmount} (UTR: ${cleanTxId}) for ${
            type === 'pro_one' ? 'NEC Pro One' : resolvedCourseTitle || 'Course'
          } is under review. Our team will verify it shortly.`,
          type: 'SYSTEM',
          link: '/profile',
          referenceType: 'PAYMENT_SUBMISSION',
          referenceId: paymentRequest._id.toString(),
        });
      } catch (notifErr) {
        console.error('[NOTIFICATION] Failed to send submission notification:', notifErr);
      }
    }

    // Notify all admin accounts about the new payment verification request
    try {
      const admins = await User.find({ role: 'admin' }).select('_id email').lean();
      const itemLabel = type === 'pro_one'
        ? `NEC Pro One (${planId ? planId.toUpperCase() : 'PASS'})`
        : resolvedCourseTitle || 'Course';

      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin._id,
          title: '🔔 New Payment Verification Request!',
          message: `${finalName} (${finalEmail}) submitted payment of ₹${cleanAmount} (Ref UTR: ${cleanTxId}) for ${itemLabel}. Please verify and approve.`,
          type: 'PAYMENT',
          link: '/admin/payments',
          referenceType: 'PAYMENT_REQUEST',
          referenceId: paymentRequest._id.toString(),
        });
      }
    } catch (adminNotifErr) {
      console.error('[ADMIN NOTIFICATION] Failed to notify admins of payment request:', adminNotifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Payment verification request submitted successfully. Awaiting admin review.',
      data: paymentRequest,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit payment request',
    });
  }
};

// GET /api/v1/payments/my-requests (Student)
export const getMyPaymentRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?._id || user?.id;
    const userEmail = (user?.email || '').trim().toLowerCase();

    if (!userId && !userEmail) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const query: any = {};
    if (userId && userEmail) {
      query.$or = [{ userId }, { userEmail }];
    } else if (userId) {
      query.userId = userId;
    } else {
      query.userEmail = userEmail;
    }

    const requests = await PaymentRequest.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve payment requests',
    });
  }
};

// GET /api/v1/admin/payments/requests (Admin)
export const getAdminPaymentRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || '';
    const search = (req.query.search as string) || '';

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { courseTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await PaymentRequest.countDocuments(query);
    const requests = await PaymentRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get count breakdown by status
    const pendingCount = await PaymentRequest.countDocuments({ status: 'pending' });
    const approvedCount = await PaymentRequest.countDocuments({ status: 'approved' });
    const rejectedCount = await PaymentRequest.countDocuments({ status: 'rejected' });

    const revenueAgg = await PaymentRequest.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      data: requests,
      counts: {
        total,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalRevenue,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve admin payment requests',
    });
  }
};

// POST /api/v1/admin/payments/requests/:id/approve (Admin)
export const approvePaymentRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?._id;

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      res.status(404).json({ success: false, message: 'Payment request not found' });
      return;
    }

    if (paymentRequest.status === 'approved') {
      res.status(400).json({ success: false, message: 'Payment request has already been approved' });
      return;
    }

    paymentRequest.status = 'approved';
    paymentRequest.reviewedBy = adminId;
    paymentRequest.reviewedAt = new Date();
    await paymentRequest.save();

    // Find or resolve student user
    let studentUser = paymentRequest.userId ? await User.findById(paymentRequest.userId) : null;
    if (!studentUser && paymentRequest.userEmail) {
      studentUser = await User.findOne({ email: paymentRequest.userEmail.toLowerCase() });
      if (studentUser) {
        paymentRequest.userId = studentUser._id;
        await paymentRequest.save();
      }
    }

    // 1. If COURSE payment -> Upgrade or create Enrollment with Pro tier
    if (paymentRequest.type === 'course') {
      let resolvedCourseId = paymentRequest.courseId;

      // If courseId is not a valid ObjectId or is slug/title, try resolving course
      if (resolvedCourseId) {
        let course = null;
        try {
          course = await Course.findById(resolvedCourseId);
        } catch {
          // not an ObjectId
        }
        if (!course) {
          course = await Course.findOne({
            $or: [{ slug: resolvedCourseId }, { title: paymentRequest.courseTitle }],
          });
        }
        if (course) {
          resolvedCourseId = course._id.toString();
        }
      }

      if (studentUser?._id && resolvedCourseId) {
        try {
          let enrollment = await Enrollment.findOne({
            userId: studentUser._id,
            courseId: resolvedCourseId,
          });

          if (enrollment) {
            enrollment.tier = 'pro';
            enrollment.paymentId = paymentRequest.transactionId;
            enrollment.paymentAmount = paymentRequest.amount;
            enrollment.paymentMethod = paymentRequest.paymentMethod || 'UPI_QR';
            enrollment.upgradedAt = new Date();
            await enrollment.save();
          } else {
            await Enrollment.create({
              userId: studentUser._id,
              courseId: resolvedCourseId,
              tier: 'pro',
              paymentId: paymentRequest.transactionId,
              paymentAmount: paymentRequest.amount,
              paymentMethod: paymentRequest.paymentMethod || 'UPI_QR',
              progress: 0,
              completedLessons: [],
              isCompleted: false,
            });
          }

          // Add to user enrolledCourses
          const cIdObj: any = resolvedCourseId;
          if (!studentUser.enrolledCourses.some((c: any) => c.toString() === cIdObj.toString())) {
            studentUser.enrolledCourses.push(cIdObj);
            await studentUser.save();
          }
        } catch (enrollErr) {
          console.error('Error creating course enrollment on payment approval:', enrollErr);
        }
      }
    }

    // 2. If PRO ONE (Membership / Subscription) payment -> Grant Global Pro & All Courses
    if (paymentRequest.type === 'pro_one' && studentUser) {
      try {
        const plan = paymentRequest.planId || 'yearly';
        const startDate = new Date();
        let endDate: Date | undefined = undefined;

        if (plan === 'monthly') {
          endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (plan === 'yearly') {
          endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        } else if (plan === 'lifetime') {
          endDate = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000); // 3 Full Years Access
        }

        studentUser.isPro = true;
        studentUser.subscription = {
          plan,
          status: 'active',
          startDate,
          endDate,
          paymentId: paymentRequest.transactionId,
          amount: paymentRequest.amount,
        };

        // Auto-enroll and elevate student to Pro tier ONLY for courses included in their specific Pro plan
        const membershipCourses = await Course.find({
          isPublished: true,
          isIncludedInMembership: { $ne: false },
          $or: [
            { includedInProPlans: { $in: [plan] } },
            { includedInProPlans: { $exists: false } },
          ],
        });
        for (const course of membershipCourses) {
          let enrollment = await Enrollment.findOne({
            userId: studentUser._id,
            courseId: course._id,
          });

          if (enrollment) {
            if (enrollment.tier !== 'pro') {
              enrollment.tier = 'pro';
              enrollment.paymentId = paymentRequest.transactionId;
              enrollment.paymentMethod = 'NEC_PRO_ONE_PASS';
              enrollment.upgradedAt = new Date();
              await enrollment.save();
            }
          } else {
            await Enrollment.create({
              userId: studentUser._id,
              courseId: course._id,
              tier: 'pro',
              paymentId: paymentRequest.transactionId,
              paymentAmount: 0,
              paymentMethod: 'NEC_PRO_ONE_PASS',
              progress: 0,
              completedLessons: [],
              isCompleted: false,
            });
          }

          if (!studentUser.enrolledCourses.some((c: any) => c.toString() === course._id.toString())) {
            studentUser.enrolledCourses.push(course._id as any);
          }
        }

        await studentUser.save();
      } catch (proErr) {
        console.error('Error activating Pro One membership on payment approval:', proErr);
      }
    }

    // 3. Send student congratulatory in-app notification
    if (studentUser?._id) {
      try {
        const itemLabel =
          paymentRequest.type === 'pro_one'
            ? `NEC Pro One (${paymentRequest.planId === 'lifetime' ? '3-Year Pass' : (paymentRequest.planId || 'Yearly').toUpperCase() + ' Pass'})`
            : paymentRequest.courseTitle || 'NextEra Coders Pro Track';

        await notificationService.createNotification({
          userId: studentUser._id,
          title: 'Payment Approved & Pro Access Unlocked',
          message: `Your payment of ₹${paymentRequest.amount} (Ref: ${paymentRequest.transactionId}) for ${itemLabel} has been verified and approved by the admin. All Pro features, HD video lectures, system design blueprints, and verifiable certificates are now active!`,
          type: 'ACHIEVEMENT',
          link: '/profile',
          referenceType: 'PAYMENT_APPROVAL',
          referenceId: paymentRequest._id.toString(),
        });
      } catch (notifErr) {
        console.error('[NOTIFICATION] Failed to send approval notification:', notifErr);
      }
    }

    // 4. Send Congratulatory Email from NextEra Coders
    let emailResult: any = null;
    try {
      const recipientEmail = (studentUser?.email || paymentRequest.userEmail || '').trim();
      const recipientName = (studentUser?.name || paymentRequest.userName || 'Learner').trim();

      if (recipientEmail) {
        emailResult = await emailService.sendPaymentApprovedEmail({
          studentName: recipientName,
          studentEmail: recipientEmail,
          type: paymentRequest.type,
          courseTitle: paymentRequest.courseTitle,
          planId: paymentRequest.planId,
          amount: paymentRequest.amount,
          transactionId: paymentRequest.transactionId,
          paymentMethod: paymentRequest.paymentMethod,
        });
      }
    } catch (emailErr) {
      console.error('Error sending congratulation email on payment approval:', emailErr);
    }

    // 5. Log Audit
    if (adminId) {
      try {
        await AuditLog.create({
          userId: adminId,
          action: 'APPROVE_PAYMENT_REQUEST',
          resourceType: 'PaymentRequest',
          resourceId: paymentRequest._id.toString(),
          details: {
            transactionId: paymentRequest.transactionId,
            type: paymentRequest.type,
            amount: paymentRequest.amount,
            studentEmail: paymentRequest.userEmail,
            emailDelivered: emailResult?.success ?? false,
          },
        });
      } catch {
        // Non-fatal audit log error
      }
    }

    const approvalMsg = emailResult?.success
      ? `🎉 Payment approved! Student Pro access activated and congratulations email delivered to ${paymentRequest.userEmail}.`
      : `Payment verified & approved! Student Pro access is active. (In-app notification sent)`;

    res.status(200).json({
      success: true,
      message: approvalMsg,
      data: paymentRequest,
      emailResult,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve payment request',
    });
  }
};

// POST /api/v1/admin/payments/requests/:id/reject (Admin)
export const rejectPaymentRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = (req as any).user?._id;

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      res.status(404).json({ success: false, message: 'Payment request not found' });
      return;
    }

    paymentRequest.status = 'rejected';
    paymentRequest.rejectionReason = rejectionReason?.trim() || 'Transaction ID not verified in bank records';
    paymentRequest.reviewedBy = adminId;
    paymentRequest.reviewedAt = new Date();
    await paymentRequest.save();

    // Send notification to student
    if (paymentRequest.userId) {
      try {
        await notificationService.createNotification({
          userId: paymentRequest.userId,
          title: 'Payment Verification Update ⚠️',
          message: `Your payment verification for Ref: ${paymentRequest.transactionId} could not be verified. Reason: ${paymentRequest.rejectionReason}. Please contact support or re-submit with correct transaction details.`,
          type: 'SYSTEM',
          link: '/profile',
          referenceType: 'PAYMENT_REJECTION',
          referenceId: paymentRequest._id.toString(),
        });
      } catch (notifErr) {
        console.error('[NOTIFICATION] Failed to send rejection notification:', notifErr);
      }
    }

    if (adminId) {
      await AuditLog.create({
        userId: adminId,
        action: 'REJECT_PAYMENT_REQUEST',
        resourceType: 'PaymentRequest',
        resourceId: paymentRequest._id.toString(),
        details: {
          transactionId: paymentRequest.transactionId,
          reason: paymentRequest.rejectionReason,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment request rejected with notification sent to student.',
      data: paymentRequest,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject payment request',
    });
  }
};

// POST /api/v1/admin/payments/test-email (Admin)
export const testAdminEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetEmail } = req.body;
    const admin = (req as any).user;
    const emailToSend = (targetEmail || admin?.email || '').trim();

    if (!emailToSend) {
      res.status(400).json({ success: false, message: 'Please provide a valid targetEmail address' });
      return;
    }

    const result = await emailService.sendPaymentApprovedEmail({
      studentName: admin?.name || 'Administrator',
      studentEmail: emailToSend,
      type: 'pro_one',
      planId: 'lifetime',
      amount: 4999,
      transactionId: `TEST_UTR_${Date.now()}`,
      paymentMethod: 'Gmail SMTP Test',
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `✅ Test email successfully delivered to ${emailToSend}! Message ID: ${result.messageId}. Please check inbox & spam folder.`,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `❌ Email sending failed: ${result.error || 'SMTP authentication failed'}. Please check your Gmail address and 16-character Google App Password.`,
        data: result,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test email',
    });
  }
};
