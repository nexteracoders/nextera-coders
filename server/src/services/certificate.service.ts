import { Types } from 'mongoose';
import crypto from 'crypto';
import { Certificate, ICertificate } from '../models/certificate.model';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';
import { Enrollment } from '../models/enrollment.model';
import { User } from '../models/user.model';
import { Quiz } from '../models/quiz.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { gamificationService } from './gamification.service';
import { notificationService } from './notification.service';
import { emailService } from './email.service';
import { whatsappService } from './whatsapp.service';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';

export class CertificateService {
  /**
   * Check if a student is eligible for a course certificate
   */
  async checkEligibility(
    userId: string | Types.ObjectId,
    courseId: string | Types.ObjectId
  ): Promise<{
    eligible: boolean;
    progress: number;
    completedLessonsCount: number;
    totalLessonsCount: number;
    reason?: string;
  }> {
    const course = await Course.findById(courseId).lean();
    if (!course || !course.isPublished) {
      return {
        eligible: false,
        progress: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 0,
        reason: 'Course not found or is in draft mode',
      };
    }

    const enrollment = await Enrollment.findOne({ userId, courseId }).lean();
    if (!enrollment) {
      return {
        eligible: false,
        progress: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 0,
        reason: 'Student is not enrolled in this course',
      };
    }

    const totalLessons = await Lesson.countDocuments({ courseId, isPublished: true });
    if (totalLessons === 0) {
      return {
        eligible: false,
        progress: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 0,
        reason: 'Course does not contain published lessons',
      };
    }

    const completedCount = enrollment.completedLessons?.length || 0;
    const progress = Math.min(100, Math.round((completedCount / totalLessons) * 100));

    if (completedCount < totalLessons) {
      return {
        eligible: false,
        progress,
        completedLessonsCount: completedCount,
        totalLessonsCount: totalLessons,
        reason: `Course incomplete: ${completedCount}/${totalLessons} lessons finished (${progress}%)`,
      };
    }

    // Check if course has required quizzes that must be passed
    const requiredQuizzes = await Quiz.find({ courseId, isPublished: true }).select('_id title').lean();
    for (const q of requiredQuizzes) {
      const passedAttempt = await QuizAttempt.findOne({
        userId,
        quizId: q._id,
        passed: true,
      });

      if (!passedAttempt) {
        return {
          eligible: false,
          progress: 100,
          completedLessonsCount: completedCount,
          totalLessonsCount: totalLessons,
          reason: `Required quiz "${q.title}" has not been passed yet`,
        };
      }
    }

    return {
      eligible: true,
      progress: 100,
      completedLessonsCount: completedCount,
      totalLessonsCount: totalLessons,
    };
  }

  /**
   * Generate certificate for completed course (Idempotent: returns existing if already generated)
   */
  async generateCertificate(
    userId: string | Types.ObjectId,
    courseId: string | Types.ObjectId
  ): Promise<{ certificate: ICertificate; newlyCreated: boolean }> {
    // 1. Check if certificate already exists
    const existing = await Certificate.findOne({ userId, courseId });
    if (existing) {
      return { certificate: existing, newlyCreated: false };
    }

    // 2. Verify eligibility
    const eligibility = await this.checkEligibility(userId, courseId);
    if (!eligibility.eligible) {
      throw ApiError.badRequest(
        eligibility.reason || 'Course completion requirements not yet satisfied',
        'CERTIFICATE_NOT_ELIGIBLE'
      );
    }

    // 3. Load user and course
    const [user, course, enrollment] = await Promise.all([
      User.findById(userId),
      Course.findById(courseId),
      Enrollment.findOne({ userId, courseId }),
    ]);

    if (!user || !course || !enrollment) {
      throw ApiError.notFound('User, course, or enrollment record not found');
    }

    // 4. Generate unique certificate ID (e.g. NEC-CERT-2026-A8B9C0D1)
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const certificateId = `NEC-CERT-${year}-${randomHex}`;

    const verificationUrl = `/verify-certificate/${certificateId}`;
    const certificateUrl = `/certificates/${certificateId}`;

    const isFree = (course.proPrice === 0 || course.isProAvailable === false);
    const trackType: 'free' | 'pro' = isFree ? 'free' : 'pro';

    // 5. Create certificate
    const certificate = await Certificate.create({
      userId: user._id,
      courseId: course._id,
      certificateId,
      studentName: user.name,
      courseName: course.title,
      courseCategory: course.category,
      trackType,
      grade: 'Grade A+ (Honors)',
      issueDate: new Date(),
      verificationUrl,
      certificateUrl,
    });

    // 6. Update user's completedCourses and enrollment status
    if (!user.completedCourses.some((cId) => cId.toString() === course._id.toString())) {
      user.completedCourses.push(course._id);
      await user.save();
    }

    if (!enrollment.completedAt) {
      enrollment.completedAt = new Date();
      enrollment.progress = 100;
      await enrollment.save();
    }

    // 7. Gamification: Award 100 points, update streak, check achievements
    await gamificationService.recordCourseCompleted(user._id, course._id, course.title);

    // 8. Notification
    await notificationService.createNotification({
      userId: user._id,
      title: 'Certificate Earned! 🎓',
      message: `Congratulations! You successfully completed "${course.title}" and earned your verified certificate.`,
      type: 'CERTIFICATE',
      link: `/certificates/${certificate._id.toString()}`,
      referenceType: 'CERTIFICATE',
      referenceId: certificate._id.toString(),
    });

    // 9. Dispatch Congratulatory Email with verified certificate details and PDF attachment
    emailService
      .sendCertificateEarnedEmail({
        studentName: user.name,
        studentEmail: user.email,
        courseTitle: course.title,
        courseCategory: course.category,
        trackType: certificate.trackType || trackType,
        grade: 'Grade A+ (Honors)',
        certificateId: certificate.certificateId,
        verificationUrl,
        certificateUrl,
        issueDate: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      })
      .catch((err) => logger.error(`[CERTIFICATE EMAIL ERROR] Failed: ${err?.message}`));

    // 10. Dispatch Congratulatory WhatsApp Alert (if phone number is available)
    const studentPhone = user.phone || user.swagOrders?.[0]?.phone;
    if (studentPhone) {
      whatsappService
        .sendCertificateEarnedWhatsApp({
          studentName: user.name,
          phone: studentPhone,
          courseTitle: course.title,
          certificateId: certificate.certificateId,
          verificationUrl,
        })
        .catch((err) => logger.error(`[CERTIFICATE WHATSAPP ERROR] Failed: ${err?.message}`));
    }

    return { certificate, newlyCreated: true };
  }

  /**
   * Get all certificates for active student
   */
  async getUserCertificates(userId: string | Types.ObjectId) {
    const certificates = await Certificate.find({ userId })
      .populate('courseId', 'title slug thumbnail category level duration isProAvailable proPrice')
      .sort({ createdAt: -1 })
      .lean();

    return certificates.map((c: any) => ({
      id: c._id.toString(),
      certificateId: c.certificateId,
      studentName: c.studentName,
      courseName: c.courseName,
      courseCategory: c.courseCategory || c.courseId?.category,
      trackType: c.trackType || (c.courseId?.isProAvailable ? 'pro' : 'free'),
      grade: c.grade || 'Grade A+ (Honors)',
      course: c.courseId
        ? {
            id: c.courseId._id.toString(),
            title: c.courseId.title,
            slug: c.courseId.slug,
            thumbnail: c.courseId.thumbnail,
            category: c.courseId.category,
            level: c.courseId.level,
            duration: c.courseId.duration,
          }
        : null,
      issueDate: c.issueDate,
      verificationUrl: c.verificationUrl,
      certificateUrl: c.certificateUrl,
      createdAt: c.createdAt,
    }));
  }

  /**
   * Get single certificate by ID or CertificateId
   */
  async getCertificateById(
    idOrCertId: string,
    _requestingUserId?: string | Types.ObjectId,
    _isAdmin: boolean = false
  ) {
    const query: any = Types.ObjectId.isValid(idOrCertId)
      ? { $or: [{ _id: idOrCertId }, { certificateId: idOrCertId }] }
      : { certificateId: idOrCertId };

    const cert = await Certificate.findOne(query)
      .populate('courseId', 'title slug thumbnail category level duration instructor isProAvailable proPrice')
      .lean();

    if (!cert) {
      throw ApiError.notFound('Certificate not found');
    }

    const isFree = cert.trackType
      ? cert.trackType === 'free'
      : (cert.courseId as any)?.isProAvailable ? false : true;

    return {
      id: cert._id.toString(),
      certificateId: cert.certificateId,
      studentName: cert.studentName,
      courseName: cert.courseName,
      courseCategory: cert.courseCategory || (cert.courseId as any)?.category,
      trackType: cert.trackType || (isFree ? 'free' : 'pro'),
      grade: cert.grade || 'Grade A+ (Honors)',
      course: cert.courseId
        ? {
            id: (cert.courseId as any)._id.toString(),
            title: (cert.courseId as any).title,
            slug: (cert.courseId as any).slug,
            thumbnail: (cert.courseId as any).thumbnail,
            category: (cert.courseId as any).category,
            level: (cert.courseId as any).level,
            instructor: (cert.courseId as any).instructor,
          }
        : null,
      issueDate: cert.issueDate,
      verificationUrl: cert.verificationUrl,
      certificateUrl: cert.certificateUrl,
      createdAt: cert.createdAt,
    };
  }

  /**
   * Public certificate verification (No auth required)
   */
  async verifyCertificate(certificateId: string): Promise<{
    verified: boolean;
    certificateId?: string;
    studentName?: string;
    courseName?: string;
    courseCategory?: string;
    trackType?: 'free' | 'pro';
    grade?: string;
    issueDate?: Date;
  }> {
    if (!certificateId || certificateId.trim() === '') {
      return { verified: false };
    }

    const cert = await Certificate.findOne({ certificateId: certificateId.trim() })
      .populate('courseId', 'category isProAvailable proPrice')
      .lean();
    if (!cert) {
      return { verified: false };
    }

    const trackType: 'free' | 'pro' = cert.trackType || ((cert.courseId as any)?.isProAvailable ? 'pro' : 'free');

    return {
      verified: true,
      certificateId: cert.certificateId,
      studentName: cert.studentName,
      courseName: cert.courseName,
      courseCategory: cert.courseCategory || (cert.courseId as any)?.category,
      trackType,
      grade: cert.grade || 'Grade A+ (Honors)',
      issueDate: cert.issueDate,
    };
  }

  /**
   * Admin certificate listing
   */
  async getAdminCertificates(options: {
    page?: number;
    limit?: number;
    search?: string;
    courseId?: string;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (options.courseId && Types.ObjectId.isValid(options.courseId)) {
      query.courseId = options.courseId;
    }

    if (options.search) {
      query.$or = [
        { certificateId: { $regex: options.search, $options: 'i' } },
        { studentName: { $regex: options.search, $options: 'i' } },
        { courseName: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [certificates, totalItems] = await Promise.all([
      Certificate.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Certificate.countDocuments(query),
    ]);

    return {
      certificates: certificates.map((c) => ({
        id: c._id.toString(),
        certificateId: c.certificateId,
        studentName: c.studentName,
        courseName: c.courseName,
        userId: c.userId.toString(),
        courseId: c.courseId.toString(),
        issueDate: c.issueDate,
        createdAt: c.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit) || 1,
        totalItems,
        limit,
      },
    };
  }
}

export const certificateService = new CertificateService();
