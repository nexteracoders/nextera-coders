import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { Enrollment } from '../models/enrollment.model';
import { Course } from '../models/course.model';
import { PaymentRequest } from '../models/paymentRequest.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { Submission } from '../models/submission.model';
import { Certificate } from '../models/certificate.model';
import { UserAchievement } from '../models/userAchievement.model';
import { PointTransaction } from '../models/pointTransaction.model';
import { auditLogService } from '../services/auditLog.service';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { generateSubAdminPassword, isSubAdminPasswordFormat } from '../utils/credentialGenerator';

// @desc    Get paginated student roster
// @route   GET /api/admin/students
// @access  Protected (Admin)
export const getAdminStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const membership = req.query.membership as string;
    const roleFilter = (req.query.role as string) || '';

    const query: any = {};
    if (roleFilter === 'student') {
      query.role = 'student';
    } else if (roleFilter === 'sub_admin') {
      query.role = 'sub_admin';
    } else if (roleFilter === 'all') {
      query.role = { $in: ['student', 'sub_admin'] };
    } else {
      query.role = { $in: ['student', 'sub_admin'] };
    }

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (status === 'active') {
      query.isActive = { $ne: false };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (membership === 'pro') {
      query.isPro = true;
      query['subscription.status'] = 'active';
    } else if (membership === 'free') {
      query.$or = [{ isPro: false }, { isPro: { $exists: false } }, { subscription: null }];
    }

    const [students, totalItems] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    // Enrich students with enrollment and certificate counts
    const enriched = await Promise.all(
      students.map(async (s) => {
        const [enrollmentCount, certCount] = await Promise.all([
          Enrollment.countDocuments({ userId: s._id }),
          Certificate.countDocuments({ userId: s._id }),
        ]);

        const hasActiveSub = Boolean(
          s.isPro &&
          s.subscription?.plan &&
          s.subscription?.status === 'active' &&
          (!s.subscription.endDate || new Date(s.subscription.endDate) > new Date())
        );

        return {
          id: s._id.toString(),
          name: s.name,
          email: s.email,
          profileImage: s.profileImage,
          role: s.role,
          college: s.college || '',
          isActive: s.isActive !== undefined ? s.isActive : true,
          isPro: hasActiveSub,
          subscription: hasActiveSub ? s.subscription : undefined,
          points: typeof s.points === 'number' ? s.points : 0,
          learningStreak: s.learningStreak || 0,
          totalLearningTime: s.totalLearningTime || 0,
          unlockedCoupons: s.unlockedCoupons || [],
          unlockedCourses: s.unlockedCourses || [],
          swagOrders: s.swagOrders || [],
          enrolledCoursesCount: enrollmentCount,
          certificatesCount: certCount,
          lastActivityDate: s.lastActivityDate,
          createdAt: s.createdAt,
        };
      })
    );

    ApiResponse.success(
      res,
      'Students retrieved successfully',
      {
        students: enriched,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit) || 1,
          totalItems,
          limit,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete 360-degree Student Dossier
// @route   GET /api/admin/students/:id
// @access  Protected (Admin)
export const getAdminStudentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid student ID format', 'INVALID_STUDENT_ID');
    }

    const student = await User.findById(id).lean();
    if (!student) {
      throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');
    }

    // Parallel fetch related data
    const [
      enrollments,
      quizAttempts,
      submissions,
      certificates,
      userAchievements,
      pointTransactions,
      paymentRequests,
    ] = await Promise.all([
      Enrollment.find({ userId: student._id })
        .populate('courseId', 'title slug thumbnail category level')
        .sort({ updatedAt: -1 })
        .lean(),
      QuizAttempt.find({ userId: student._id })
        .populate('quizId', 'title slug passingScore')
        .sort({ createdAt: -1 })
        .lean(),
      Submission.find({ userId: student._id })
        .populate('problemId', 'title slug difficulty category')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Certificate.find({ userId: student._id })
        .populate('courseId', 'title slug')
        .sort({ issuedAt: -1 })
        .lean(),
      UserAchievement.find({ userId: student._id })
        .populate('achievementId')
        .sort({ unlockedAt: -1 })
        .lean(),
      PointTransaction.find({ userId: student._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      PaymentRequest.find({
        $or: [{ userId: student._id }, { userEmail: student.email.toLowerCase() }],
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const hasActiveSub = Boolean(
      student.isPro &&
      student.subscription?.plan &&
      student.subscription?.status === 'active' &&
      (!student.subscription.endDate || new Date(student.subscription.endDate) > new Date())
    );

    ApiResponse.success(
      res,
      'Student dossier retrieved successfully',
      {
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          profileImage: student.profileImage,
          role: student.role,
          college: student.college || '',
          bio: student.bio,
          skills: student.skills,
          github: student.github,
          linkedin: student.linkedin,
          isActive: student.isActive !== undefined ? student.isActive : true,
          isPro: hasActiveSub,
          subscription: hasActiveSub ? student.subscription : undefined,
          points: typeof student.points === 'number' ? student.points : 0,
          learningStreak: student.learningStreak || 0,
          longestStreak: student.longestStreak || 0,
          lastActivityDate: student.lastActivityDate,
          totalLearningTime: student.totalLearningTime || 0,
          unlockedCoupons: student.unlockedCoupons || [],
          unlockedCourses: student.unlockedCourses || [],
          swagOrders: student.swagOrders || [],
          createdAt: student.createdAt,
          subAdminCredential: (() => {
            if (student.role !== 'sub_admin' || req.user?.role !== 'admin') return undefined;
            let plainPw = student.subAdminCredential?.plainPassword;
            if (!plainPw || !isSubAdminPasswordFormat(plainPw)) {
              plainPw = generateSubAdminPassword();
              const salt = bcrypt.genSaltSync(12);
              const hashed = bcrypt.hashSync(plainPw, salt);
              User.findByIdAndUpdate(student._id, {
                $set: {
                  password: hashed,
                  'subAdminCredential.plainPassword': plainPw,
                  'subAdminCredential.appointedAt': student.subAdminCredential?.appointedAt || student.createdAt || new Date(),
                  'subAdminCredential.appointedBy': student.subAdminCredential?.appointedBy || 'NextEra Coders Leadership',
                  'subAdminCredential.lastPasswordChangedAt': new Date(),
                },
              }).exec().catch(() => {});
            }
            return {
              plainPassword: plainPw,
              appointedAt: student.subAdminCredential?.appointedAt || student.createdAt,
              appointedBy: student.subAdminCredential?.appointedBy || 'NextEra Coders Leadership',
              lastPasswordChangedAt: student.subAdminCredential?.lastPasswordChangedAt,
            };
          })(),
        },
        enrollments: enrollments.map((e: any) => ({
          id: e._id.toString(),
          courseId: e.courseId ? e.courseId._id.toString() : null,
          course: e.courseId
            ? {
                id: e.courseId._id.toString(),
                title: e.courseId.title,
                slug: e.courseId.slug,
                thumbnail: e.courseId.thumbnail,
                category: e.courseId.category,
                level: e.courseId.level,
              }
            : null,
          tier: e.tier || 'free',
          progress: e.progress,
          completedLessonsCount: e.completedLessons?.length || 0,
          completedAt: e.completedAt,
          enrolledAt: e.createdAt,
        })),
        quizAttempts: quizAttempts.map((qa: any) => ({
          id: qa._id.toString(),
          quiz: qa.quizId
            ? {
                id: qa.quizId._id.toString(),
                title: qa.quizId.title,
                slug: qa.quizId.slug,
                passingScore: qa.quizId.passingScore,
              }
            : null,
          score: qa.score,
          percentage: qa.percentage,
          passed: qa.passed,
          timeTaken: qa.timeTaken,
          completedAt: qa.completedAt || qa.createdAt,
        })),
        submissions: submissions.map((sub: any) => ({
          id: sub._id.toString(),
          problem: sub.problemId
            ? {
                id: sub.problemId._id.toString(),
                title: sub.problemId.title,
                slug: sub.problemId.slug,
                difficulty: sub.problemId.difficulty,
                category: sub.problemId.category,
              }
            : null,
          language: sub.language,
          status: sub.status,
          runtime: sub.runtime,
          memory: sub.memory,
          createdAt: sub.createdAt,
        })),
        certificates: certificates.map((cert) => ({
          id: cert._id.toString(),
          certificateId: cert.certificateId,
          courseName: cert.courseName,
          issueDate: cert.issueDate,
          verificationUrl: cert.verificationUrl,
          certificateUrl: cert.certificateUrl,
        })),
        achievements: userAchievements.map((ua: any) => ({
          id: ua._id.toString(),
          achievement: ua.achievementId
            ? {
                id: ua.achievementId._id.toString(),
                name: ua.achievementId.name,
                description: ua.achievementId.description,
                icon: ua.achievementId.icon,
                category: ua.achievementId.category,
                points: ua.achievementId.points,
              }
            : null,
          unlockedAt: ua.unlockedAt,
        })),
        pointTransactions: pointTransactions.map((pt) => ({
          id: pt._id.toString(),
          amount: pt.amount,
          type: pt.type,
          description: pt.description,
          createdAt: pt.createdAt,
        })),
        paymentRequests: paymentRequests.map((pr: any) => ({
          id: pr._id.toString(),
          type: pr.type,
          courseTitle: pr.courseTitle,
          planId: pr.planId,
          amount: pr.amount,
          transactionId: pr.transactionId,
          paymentMethod: pr.paymentMethod,
          status: pr.status,
          rejectionReason: pr.rejectionReason,
          reviewedAt: pr.reviewedAt,
          createdAt: pr.createdAt,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle student account active / deactivated status
// @route   PATCH /api/admin/students/:id/status
// @access  Protected (Admin)
export const updateAdminStudentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid student ID format');
    }

    if (isActive === undefined || typeof isActive !== 'boolean') {
      throw ApiError.badRequest('Field "isActive" must be a boolean');
    }

    const student = await User.findById(id);
    if (!student) {
      throw ApiError.notFound('Student not found');
    }

    if (student.role === 'admin') {
      throw ApiError.badRequest('Cannot deactivate another administrator account through this route');
    }

    student.isActive = isActive;
    await student.save();

    await auditLogService.recordLog({
      adminId: admin._id,
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      resourceType: 'STUDENT',
      resourceId: student._id.toString(),
      resourceTitle: student.name,
      metadata: { email: student.email, isActive },
    });

    ApiResponse.success(
      res,
      `Student account ${isActive ? 'activated' : 'deactivated'} successfully`,
      {
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          isActive: student.isActive,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Manage Student Pro Membership (Grant, Extend, or Revoke)
// @route   PUT /api/admin/students/:id/subscription
// @access  Protected (Admin)
export const updateAdminStudentSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, plan = 'yearly', customEndDate } = req.body;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid student ID format');
    }

    const student = await User.findById(id);
    if (!student) {
      throw ApiError.notFound('Student not found');
    }

    if (action === 'grant' || action === 'extend') {
      let endDate: Date;
      if (customEndDate) {
        endDate = new Date(customEndDate);
      } else if (plan === 'lifetime') {
        endDate = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000); // 3 full years
      } else if (plan === 'yearly') {
        endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      } else {
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      student.isPro = true;
      student.subscription = {
        plan,
        status: 'active',
        startDate: new Date(),
        endDate,
        paymentId: `ADMIN_GRANT_${Date.now()}`,
        amount: plan === 'lifetime' ? 5999 : plan === 'yearly' ? 2999 : 399,
      };

      await student.save();

      await notificationService.createNotification({
        userId: student._id,
        type: 'ACHIEVEMENT',
        title: '👑 Pro Membership Granted by Administrator!',
        message: `An administrator has granted your account full NEC Pro One ${plan === 'lifetime' ? '3-Year' : plan.toUpperCase()} Pass access until ${endDate.toLocaleDateString()}. Enjoy all unlocked courses, video lectures, and certificates!`,
        link: '/profile',
      });

      await auditLogService.recordLog({
        adminId: admin._id,
        action: 'UPDATE',
        resourceType: 'STUDENT',
        resourceId: student._id.toString(),
        resourceTitle: student.name,
        metadata: { action: 'GRANT_PRO_MEMBERSHIP', plan, endDate },
      });

      ApiResponse.success(res, `Pro membership ${action === 'extend' ? 'extended' : 'granted'} successfully`, {
        student: student.toSanitizedUser(),
      });
    } else if (action === 'revoke') {
      student.isPro = false;
      student.subscription = undefined;
      await student.save();

      await notificationService.createNotification({
        userId: student._id,
        type: 'SYSTEM',
        title: 'Membership Status Notice',
        message: 'Your Pro Membership access has been updated by an administrator. Please contact support if you believe this was in error.',
        link: '/profile',
      });

      await auditLogService.recordLog({
        adminId: admin._id,
        action: 'UPDATE',
        resourceType: 'STUDENT',
        resourceId: student._id.toString(),
        resourceTitle: student.name,
        metadata: { action: 'REVOKE_PRO_MEMBERSHIP' },
      });

      ApiResponse.success(res, 'Pro membership revoked successfully', {
        student: student.toSanitizedUser(),
      });
    } else {
      throw ApiError.badRequest('Invalid subscription action. Allowed: "grant", "extend", "revoke"');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Admin manually enroll student in course
// @route   POST /api/admin/students/:id/enroll
// @access  Protected (Admin)
export const adminEnrollStudentCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { courseId, tier = 'pro' } = req.body;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(courseId)) {
      throw ApiError.badRequest('Invalid student ID or course ID format');
    }

    const [student, course] = await Promise.all([User.findById(id), Course.findById(courseId)]);

    if (!student) throw ApiError.notFound('Student not found');
    if (!course) throw ApiError.notFound('Course not found');

    let enrollment = await Enrollment.findOne({ userId: student._id, courseId: course._id });
    if (enrollment) {
      enrollment.tier = tier;
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        userId: student._id,
        courseId: course._id,
        tier,
        progress: 0,
        completedLessons: [],
      });

      if (!student.enrolledCourses.includes(course._id)) {
        student.enrolledCourses.push(course._id);
        await student.save();
      }
    }

    await notificationService.createNotification({
      userId: student._id,
      type: 'COURSE',
      title: `📚 Enrolled in ${course.title}`,
      message: `An administrator has enrolled you into "${course.title}" with ${tier.toUpperCase()} track access.`,
      link: `/courses/${course.slug}/learn`,
    });

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'STUDENT',
      resourceId: student._id.toString(),
      resourceTitle: student.name,
      metadata: { action: 'MANUAL_COURSE_ENROLLMENT', courseTitle: course.title, tier },
    });

    ApiResponse.success(res, `Student enrolled in "${course.title}" successfully`, {
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin remove student course enrollment
// @route   DELETE /api/admin/students/:id/enrollments/:enrollmentId
// @access  Protected (Admin)
export const adminRemoveStudentEnrollment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, enrollmentId } = req.params;
    const admin = req.user!;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(enrollmentId)) {
      throw ApiError.badRequest('Invalid ID format');
    }

    const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId: id });
    if (!enrollment) {
      throw ApiError.notFound('Enrollment not found for this student');
    }

    const courseId = enrollment.courseId;
    await Enrollment.deleteOne({ _id: enrollment._id });

    await User.findByIdAndUpdate(id, {
      $pull: { enrolledCourses: courseId },
    });

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'DELETE',
      resourceType: 'STUDENT',
      resourceId: id,
      resourceTitle: 'Enrollment Removal',
      metadata: { action: 'REMOVE_ENROLLMENT', enrollmentId, courseId },
    });

    ApiResponse.success(res, 'Course enrollment removed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin edit student profile
// @route   PUT /api/admin/students/:id/profile
// @access  Protected (Admin)
export const updateAdminStudentProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      profileImage,
      college,
      bio,
      skills,
      github,
      linkedin,
      points,
      learningStreak,
      isActive,
      newPassword,
    } = req.body;
    const admin = req.user!;

    const student = await findStudentFlexible(id, req.body);
    if (!student) {
      throw ApiError.notFound('Student not found in database');
    }

    const previousRole = student.role;
    let isPromotedToSubAdmin = false;

    if (name) student.name = name.trim();
    if (email) student.email = email.toLowerCase().trim();
    if (role) {
      if (role === 'admin' && student.email !== 'nexteracoders@gmail.com') {
        throw ApiError.forbidden('Only sub_admin or student roles can be assigned. Admin is reserved exclusively for NextEra Coders owner (nexteracoders@gmail.com).');
      }
      if (role === 'student' || role === 'sub_admin') {
        if (role === 'sub_admin' && previousRole !== 'sub_admin') {
          isPromotedToSubAdmin = true;
          if (!student.subAdminCredential) {
            student.subAdminCredential = {
              appointedAt: new Date(),
              appointedBy: admin.name || 'NextEra Coders Leadership',
              initialRoleSource: 'student',
            };
          }
        } else if (role === 'student' && previousRole === 'sub_admin') {
          student.subAdminCredential = undefined;
        }
        student.role = role;
      }
    }
    if (profileImage !== undefined) student.profileImage = profileImage.trim();
    if (college !== undefined) student.college = college.trim();
    if (bio !== undefined) student.bio = bio;
    if (skills !== undefined) student.skills = skills;
    if (github !== undefined) student.github = github;
    if (linkedin !== undefined) student.linkedin = linkedin;
    if (points !== undefined && !isNaN(Number(points))) {
      const newPoints = Math.max(0, Number(points));
      const oldPoints = student.points || 0;
      if (newPoints !== oldPoints) {
        const diff = newPoints - oldPoints;
        student.points = newPoints;
        if (newPoints > (student.totalPoints || 0)) {
          student.totalPoints = newPoints;
        }
        await PointTransaction.create({
          userId: student._id,
          amount: diff,
          type: 'ADMIN_ADJUSTMENT',
          referenceType: 'ADMIN',
          referenceId: admin._id.toString(),
          description: `Admin profile edit adjustment (${diff > 0 ? `+${diff}` : `${diff}`} Coins)`,
        }).catch((err: any) => logger.warn(`[PointTransaction] Failed to log admin profile coin adjustment: ${err.message}`));
      }
    }
    if (learningStreak !== undefined && !isNaN(Number(learningStreak))) {
      student.learningStreak = Math.max(0, Number(learningStreak));
      if (student.learningStreak > (student.longestStreak || 0)) {
        student.longestStreak = student.learningStreak;
      }
    }
    if (isActive !== undefined) student.isActive = Boolean(isActive);

    let plainPasswordAssigned: string | undefined;
    if (newPassword && newPassword.trim().length >= 6 && isSubAdminPasswordFormat(newPassword)) {
      plainPasswordAssigned = newPassword.trim();
      student.password = plainPasswordAssigned; // pre-save hook will hash it

      if (student.role === 'sub_admin') {
        if (!student.subAdminCredential) {
          student.subAdminCredential = {
            appointedAt: new Date(),
            appointedBy: admin.name || 'NextEra Coders Leadership',
            initialRoleSource: 'student',
          };
        }
        student.subAdminCredential.plainPassword = plainPasswordAssigned;
        student.subAdminCredential.lastPasswordChangedAt = new Date();
      }
    } else if (isPromotedToSubAdmin || (student.role === 'sub_admin' && (!student.subAdminCredential?.plainPassword || !isSubAdminPasswordFormat(student.subAdminCredential.plainPassword)))) {
      // Auto-generate password in required NEC@...SubAdmin format and auto-reset user's password
      plainPasswordAssigned = generateSubAdminPassword();
      student.password = plainPasswordAssigned; // pre-save hook will hash it

      if (!student.subAdminCredential) {
        student.subAdminCredential = {
          appointedAt: new Date(),
          appointedBy: admin.name || 'NextEra Coders Leadership',
          initialRoleSource: 'student',
        };
      }
      student.subAdminCredential.plainPassword = plainPasswordAssigned;
      student.subAdminCredential.lastPasswordChangedAt = new Date();
    }

    await student.save();

    // If promoted to Sub-Admin, trigger congratulations email & in-app notification
    if (isPromotedToSubAdmin) {
      emailService
        .sendSubAdminAppointmentEmail({
          userName: student.name,
          userEmail: student.email,
          assignedPassword: plainPasswordAssigned,
          assignedByAdminName: admin.name || 'Super Administrator',
        })
        .catch((err) => logger.error(`[Sub-Admin Email Error] ${err.message}`));

      notificationService
        .createNotification({
          userId: student._id.toString(),
          title: '🎉 Promoted to Sub-Admin (Content Manager)!',
          message: `Congratulations ${student.name}! You now have Sub-Admin access to create and manage courses, tutorials, problems, and community posts.`,
          type: 'ANNOUNCEMENT',
          link: '/admin/courses',
        })
        .catch(() => {});
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'STUDENT',
      resourceId: student._id.toString(),
      resourceTitle: student.name,
      metadata: { action: isPromotedToSubAdmin ? 'PROMOTE_SUB_ADMIN' : 'UPDATE_PROFILE', email: student.email, role: student.role },
    });

    ApiResponse.success(res, 'Student profile updated successfully', {
      student: student.toSanitizedUser(),
    });
  } catch (error) {
    next(error);
  }
};

// Helper to find student by MongoDB ObjectId, Email, or Name safely
const findStudentFlexible = async (id: string, body?: any) => {
  if (id && Types.ObjectId.isValid(id)) {
    const byId = await User.findById(id);
    if (byId) return byId;
  }
  const emailCandidate = (
    body?.email ||
    body?.userEmail ||
    (id && id.includes('@') ? id : '') ||
    ''
  )
    .toLowerCase()
    .trim();
  if (emailCandidate) {
    const byEmail = await User.findOne({ email: emailCandidate });
    if (byEmail) return byEmail;
  }
  const nameCandidate = (body?.name || body?.userName || '').trim();
  if (nameCandidate) {
    const byName = await User.findOne({
      name: { $regex: new RegExp(`^${nameCandidate}$`, 'i') },
    });
    if (byName) return byName;
  }
  return null;
};

// @desc    Admin adjust student coins balance
// @route   PUT /api/admin/students/:id/coins
// @access  Protected (Admin)
export const adminAdjustStudentCoins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, mode = 'add', reason = 'Admin adjustment' } = req.body;
    const admin = req.user!;

    const student = await findStudentFlexible(id, req.body);
    if (!student) {
      throw ApiError.notFound('Student account not found in database');
    }

    const numericAmount = Math.max(0, Number(amount) || 0);
    let newCoins = student.points || 0;
    if (mode === 'add') {
      newCoins = (student.points || 0) + numericAmount;
      student.totalPoints = (student.totalPoints || 0) + numericAmount;
    } else if (mode === 'deduct') {
      newCoins = Math.max(0, (student.points || 0) - numericAmount);
    } else if (mode === 'set') {
      newCoins = numericAmount;
      if (newCoins > (student.totalPoints || 0)) {
        student.totalPoints = newCoins;
      }
    }

    const oldCoins = student.points || 0;
    const txAmount = mode === 'deduct' ? -numericAmount : mode === 'set' ? (newCoins - oldCoins) : numericAmount;

    student.points = newCoins;
    await student.save();

    if (txAmount !== 0) {
      try {
        await PointTransaction.create({
          userId: student._id,
          amount: txAmount,
          type: 'ADMIN_ADJUSTMENT',
          referenceType: 'ADMIN',
          referenceId: admin._id.toString(),
          description: `Admin adjustment (${mode}): ${reason || 'Manual balance correction'} (${txAmount > 0 ? `+${txAmount}` : `${txAmount}`} Coins)`,
        });
      } catch (txErr: any) {
        logger.warn(`[PointTransaction] Failed to log admin coin adjustment: ${txErr.message}`);
      }
    }

    await notificationService.createNotification({
      userId: student._id,
      type: 'SYSTEM',
      title: `🪙 Coins Adjusted: ${newCoins} NEC Coins`,
      message: `Your NEC Coins balance was updated by administrator (${mode === 'add' ? `+${numericAmount}` : mode === 'deduct' ? `-${numericAmount}` : `Set to ${numericAmount}`} coins). Reason: ${reason}`,
      link: '/rewards',
    });

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'STUDENT',
      resourceId: student._id.toString(),
      resourceTitle: student.name,
      metadata: { action: 'ADJUST_COINS', amount: numericAmount, mode, newBalance: newCoins, reason },
    });

    ApiResponse.success(res, 'Student coins updated successfully', {
      studentId: student._id.toString(),
      coins: student.points,
      totalPoints: student.totalPoints,
      name: student.name,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin adjust student daily streak
// @route   PUT /api/admin/students/:id/streak
// @access  Protected (Admin)
export const adminAdjustStudentStreak = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { streak, claimedToday } = req.body;
    const admin = req.user!;

    const student = await findStudentFlexible(id, req.body);
    if (!student) {
      throw ApiError.notFound('Student account not found in database');
    }

    const cleanStreak = Math.max(0, Number(streak) || 0);
    student.learningStreak = cleanStreak;
    if (cleanStreak > (student.longestStreak || 0)) {
      student.longestStreak = cleanStreak;
    }
    if (claimedToday) {
      student.lastActivityDate = new Date();
    }

    await student.save();

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'STUDENT',
      resourceId: student._id.toString(),
      resourceTitle: student.name,
      metadata: { action: 'ADJUST_STREAK', newStreak: cleanStreak, claimedToday },
    });

    ApiResponse.success(res, 'Student learning streak updated successfully', {
      studentId: student._id.toString(),
      learningStreak: student.learningStreak,
      longestStreak: student.longestStreak,
      lastActivityDate: student.lastActivityDate,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin update physical swag order status & dispatch delivery email
// @route   PUT /api/admin/swag-orders/:orderId/status
// @access  Protected (Admin)
export const adminUpdateSwagOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;
    const admin = req.user!;

    if (!orderId) {
      throw ApiError.badRequest('Order ID is required');
    }

    if (!status || !['Processing', 'Shipped', 'Delivered'].includes(status)) {
      throw ApiError.badRequest('Invalid order status. Must be Processing, Shipped, or Delivered');
    }

    // Find the user containing this swag order
    const user = await User.findOne({ 'swagOrders.id': orderId });
    if (!user || !user.swagOrders) {
      throw ApiError.notFound('Swag order not found across platform users');
    }

    const orderIdx = user.swagOrders.findIndex((o) => o.id === orderId);
    if (orderIdx === -1) {
      throw ApiError.notFound('Swag order index not found');
    }

    const prevStatus = user.swagOrders[orderIdx].status;
    user.swagOrders[orderIdx].status = status as 'Processing' | 'Shipped' | 'Delivered';
    if (trackingNumber !== undefined) {
      user.swagOrders[orderIdx].trackingNumber = trackingNumber;
    }

    user.markModified('swagOrders');
    await user.save();

    const orderObj = user.swagOrders[orderIdx];

    // Create in-app notification
    await notificationService.createNotification({
      userId: user._id,
      type: 'SYSTEM',
      title: status === 'Delivered' ? `📦 Swag Reward Delivered: ${orderObj.rewardTitle}` : `🚚 Swag Status Updated: ${status}`,
      message: status === 'Delivered'
        ? `Congratulations! Your official NEC merchandise "${orderObj.rewardTitle}" has been successfully delivered to your address.`
        : `Your order #${orderId} for "${orderObj.rewardTitle}" is now ${status}.${trackingNumber ? ` Tracking Number: ${trackingNumber}` : ''}`,
      link: '/rewards',
    });

    // If marked as DELIVERED, send congratulatory email to student
    if (status === 'Delivered' && prevStatus !== 'Delivered') {
      emailService.sendSwagDeliveredEmail({
        studentName: orderObj.fullName || user.name,
        studentEmail: user.email,
        rewardTitle: orderObj.rewardTitle,
        orderId: orderObj.id,
        trackingNumber: orderObj.trackingNumber,
        coinsCost: orderObj.coinsCost,
        deliveryAddress: orderObj.address,
        city: orderObj.city,
        pincode: orderObj.pincode,
      }).catch((err) => logger.warn('[EMAIL SWAG] Background delivery email error', err));
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'STUDENT',
      resourceId: user._id.toString(),
      resourceTitle: user.name,
      metadata: { action: 'UPDATE_SWAG_ORDER_STATUS', orderId, status, trackingNumber, studentEmail: user.email },
    });

    ApiResponse.success(res, `Swag order #${orderId} status updated to ${status}`, {
      order: orderObj,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin grant perk (coupon or course) to student
// @route   POST /api/admin/students/:id/perks
// @access  Protected (Admin)
export const adminGrantStudentPerk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, title, discountPercent, couponCode, courseSlug } = req.body;
    const admin = req.user!;

    const student = await findStudentFlexible(id, req.body);
    if (!student) {
      throw ApiError.notFound('Student account not found in database');
    }

    if (type === 'coupon') {
      const code = couponCode || `ADMIN${discountPercent || 20}OFF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      if (!student.unlockedCoupons) student.unlockedCoupons = [];
      student.unlockedCoupons.unshift({
        code,
        discount: Number(discountPercent) || 20,
        title: title || 'Admin VIP Discount Coupon',
        unlockedAt: new Date(),
      });
      student.markModified('unlockedCoupons');
      await student.save();

      await notificationService.createNotification({
        userId: student._id,
        type: 'SYSTEM',
        title: `🎁 Exclusive Coupon Granted: ${discountPercent || 20}% OFF`,
        message: `An administrator has granted you a special discount coupon code: ${code}. Use it on any course checkout!`,
        link: '/rewards',
      });

      await auditLogService.recordLog({
        adminId: admin._id,
        action: 'UPDATE',
        resourceType: 'STUDENT',
        resourceId: student._id.toString(),
        resourceTitle: student.name,
        metadata: { action: 'GRANT_COUPON', couponCode: code, discount: discountPercent || 20 },
      });

      ApiResponse.success(res, `Coupon code "${code}" granted successfully`, {
        coupon: { code, discount: discountPercent || 20, title: title || 'VIP Coupon' },
      });
    } else if (type === 'course') {
      if (!courseSlug) throw ApiError.badRequest('Course slug is required');
      if (!student.unlockedCourses) student.unlockedCourses = [];
      if (!student.unlockedCourses.includes(courseSlug)) {
        student.unlockedCourses.push(courseSlug);
        student.markModified('unlockedCourses');
        await student.save();
      }

      await notificationService.createNotification({
        userId: student._id,
        type: 'COURSE',
        title: `🎓 Lifetime Course Access Unlocked`,
        message: `An administrator has granted you free lifetime access to the course track: ${courseSlug}.`,
        link: `/courses/${courseSlug}/learn`,
      });

      await auditLogService.recordLog({
        adminId: admin._id,
        action: 'UPDATE',
        resourceType: 'STUDENT',
        resourceId: student._id.toString(),
        resourceTitle: student.name,
        metadata: { action: 'GRANT_COURSE', courseSlug },
      });

      ApiResponse.success(res, `Course "${courseSlug}" access granted successfully`, {
        unlockedCourses: student.unlockedCourses,
      });
    } else {
      throw ApiError.badRequest('Invalid perk type. Allowed: "coupon", "course"');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Admin create manual swag order for student
// @route   POST /api/admin/students/:id/swag-order
// @access  Protected (Admin)
export const adminCreateStudentSwagOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { rewardTitle, coinsCost, fullName, phone, address, city, pincode } = req.body;
    const admin = req.user!;

    const student = await findStudentFlexible(id, req.body);
    if (!student) {
      throw ApiError.notFound('Student account not found in database');
    }

    const orderId = `SWAG-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingId = `NEC-EXP-${Math.floor(100000 + Math.random() * 900000)}`;
    const cost = Number(coinsCost) || 0;

    const newOrder = {
      id: orderId,
      rewardId: `admin-manual-${Date.now()}`,
      rewardTitle: rewardTitle || 'NextEra Swag Merchandise',
      coinsCost: cost,
      fullName: (fullName || student.name || 'Student').trim(),
      phone: (phone || '—').trim(),
      address: (address || '—').trim(),
      city: (city || '—').trim(),
      pincode: (pincode || '—').trim(),
      status: 'Processing' as const,
      orderedAt: new Date(),
      trackingNumber: trackingId,
    };

    if (!student.swagOrders) student.swagOrders = [];
    student.swagOrders.unshift(newOrder);
    student.markModified('swagOrders');
    await student.save();

    await notificationService.createNotification({
      userId: student._id,
      type: 'SYSTEM',
      title: `🎁 New Swag Order Assigned: ${newOrder.rewardTitle}`,
      message: `An official merchandise order #${orderId} has been created and queued for courier dispatch.`,
      link: '/rewards',
    });

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'CREATE',
      resourceType: 'STUDENT',
      resourceId: student._id.toString(),
      resourceTitle: student.name,
      metadata: { action: 'CREATE_SWAG_ORDER', orderId, rewardTitle: newOrder.rewardTitle, studentEmail: student.email },
    });

    ApiResponse.success(res, `Swag order #${orderId} created successfully`, {
      order: newOrder,
    });
  } catch (error) {
    next(error);
  }
};
