import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { Quiz } from '../models/quiz.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { CodingProblem } from '../models/problem.model';
import { Submission } from '../models/submission.model';
import { Project } from '../models/project.model';
import { Tutorial } from '../models/tutorial.model';
import { Certificate } from '../models/certificate.model';
import { ApiResponse } from '../utils/apiResponse';

// @desc    Get consolidated Admin Dashboard KPIs and recent activity
// @route   GET /api/admin/dashboard
// @access  Protected (Admin)
export const getAdminDashboardMetrics = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel aggregate count queries
    const [
      totalStudents,
      newStudentsThirtyDays,
      activeStudentsSevenDays,
      totalCourses,
      publishedCourses,
      draftCourses,
      totalEnrollments,
      completedEnrollments,
      totalQuizzes,
      totalProblems,
      totalProjects,
      totalTutorials,
      totalCertificates,
      recentUsers,
      recentEnrollments,
      recentQuizAttempts,
      recentCertificates,
      recentSubmissions,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ role: 'student', lastActivityDate: { $gte: sevenDaysAgo } }),
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true }),
      Course.countDocuments({ isPublished: false }),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ completedAt: { $exists: true, $ne: null } }),
      Quiz.countDocuments(),
      CodingProblem.countDocuments(),
      Project.countDocuments(),
      Tutorial.countDocuments(),
      Certificate.countDocuments(),

      // Recent Registrations
      User.find({ role: 'student' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email profileImage createdAt points learningStreak')
        .lean(),

      // Recent Enrollments
      Enrollment.find()
        .populate('userId', 'name email profileImage')
        .populate('courseId', 'title slug thumbnail')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Recent Quiz Attempts
      QuizAttempt.find({ status: 'SUBMITTED' })
        .populate('userId', 'name email profileImage')
        .populate('quizId', 'title slug')
        .sort({ completedAt: -1 })
        .limit(5)
        .lean(),

      // Recent Certificates
      Certificate.find()
        .populate('userId', 'name email profileImage')
        .populate('courseId', 'title slug')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Recent Problem Submissions
      Submission.find()
        .populate('userId', 'name email profileImage')
        .populate('problemId', 'title slug difficulty')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    // Combine recent activity into a single unified stream
    const activityStream: any[] = [];

    recentUsers.forEach((u: any) => {
      activityStream.push({
        id: `user-${u._id}`,
        type: 'REGISTRATION',
        title: 'New Student Registered',
        description: `${u.name} created an account`,
        user: { name: u.name, email: u.email, profileImage: u.profileImage },
        timestamp: u.createdAt,
      });
    });

    recentEnrollments.forEach((e: any) => {
      if (e.userId && e.courseId) {
        activityStream.push({
          id: `enroll-${e._id}`,
          type: 'ENROLLMENT',
          title: 'Course Enrollment',
          description: `${e.userId.name} enrolled in ${e.courseId.title}`,
          user: { name: e.userId.name, email: e.userId.email, profileImage: e.userId.profileImage },
          target: { title: e.courseId.title, link: `/courses/${e.courseId.slug}` },
          timestamp: e.createdAt,
        });
      }
    });

    recentCertificates.forEach((c: any) => {
      activityStream.push({
        id: `cert-${c._id}`,
        type: 'CERTIFICATE',
        title: 'Certificate Conferred',
        description: `${c.studentName} earned a certificate in ${c.courseName}`,
        user: c.userId ? { name: c.userId.name, email: c.userId.email } : { name: c.studentName },
        target: { title: c.certificateId, link: `/verify-certificate/${c.certificateId}` },
        timestamp: c.issueDate || c.createdAt,
      });
    });

    recentQuizAttempts.forEach((qa: any) => {
      if (qa.userId && qa.quizId) {
        activityStream.push({
          id: `quiz-${qa._id}`,
          type: 'QUIZ',
          title: 'Quiz Assessment Completed',
          description: `${qa.userId.name} scored ${qa.percentage}% (${qa.passed ? 'PASSED' : 'FAILED'}) on ${qa.quizId.title}`,
          user: { name: qa.userId.name, email: qa.userId.email },
          target: { title: qa.quizId.title },
          timestamp: qa.completedAt || qa.createdAt,
        });
      }
    });

    recentSubmissions.forEach((s: any) => {
      if (s.userId && s.problemId) {
        activityStream.push({
          id: `dsa-${s._id}`,
          type: 'DSA',
          title: 'DSA Code Submission',
          description: `${s.userId.name} submitted solution for ${s.problemId.title} (${s.status})`,
          user: { name: s.userId.name, email: s.userId.email },
          target: { title: s.problemId.title, link: `/dsa/${s.problemId.slug}` },
          timestamp: s.createdAt,
        });
      }
    });

    // Sort combined activities by timestamp descending
    activityStream.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const kpis = {
      totalStudents,
      newStudentsThirtyDays,
      activeStudentsSevenDays,
      totalCourses,
      publishedCourses,
      draftCourses,
      totalEnrollments,
      completedEnrollments,
      completionRate,
      totalQuizzes,
      totalProblems,
      totalProjects,
      totalTutorials,
      totalCertificates,
    };

    ApiResponse.success(
      res,
      'Admin dashboard metrics retrieved successfully',
      {
        kpis,
        stats: kpis,
        recentActivity: activityStream.slice(0, 15),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};
