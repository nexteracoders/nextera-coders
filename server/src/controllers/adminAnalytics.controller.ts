import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { Quiz } from '../models/quiz.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { CodingProblem } from '../models/problem.model';
import { Submission } from '../models/submission.model';
import { Tutorial } from '../models/tutorial.model';
import { Certificate } from '../models/certificate.model';
import { ApiResponse } from '../utils/apiResponse';

// @desc    Get detailed Admin Analytics charts and popular content
// @route   GET /api/admin/analytics
// @access  Protected (Admin)
export const getAdminAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const timeframe = (req.query.timeframe as string) || '30d';

    let days = 30;
    if (timeframe === '7d') days = 7;
    else if (timeframe === '90d') days = 90;
    else if (timeframe === '1y') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Grouping interval format: %Y-%m-%d
    const dateFormat = '%Y-%m-%d';

    const [
      registrationGrowth,
      enrollmentGrowth,
      quizActivity,
      dsaActivity,
      certificateGrowth,
      topCourses,
      topProblems,
      topQuizzes,
      topTutorials,
    ] = await Promise.all([
      // 1. User Registration Growth
      User.aggregate([
        { $match: { role: 'student', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 2. Course Enrollment Growth
      Enrollment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            enrollments: { $sum: 1 },
            completions: {
              $sum: { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 3. Quiz Attempts & Passing
      QuizAttempt.aggregate([
        { $match: { status: 'SUBMITTED', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            totalAttempts: { $sum: 1 },
            passedAttempts: { $sum: { $cond: ['$passed', 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 4. DSA Submissions & Accepted
      Submission.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            totalSubmissions: { $sum: 1 },
            acceptedSubmissions: {
              $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 5. Certificates Issued Over Time
      Certificate.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            certificates: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 6. Popular Content Rankings
      Course.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title slug category level')
        .lean(),

      CodingProblem.find({ isPublished: true })
        .sort({ totalSubmissions: -1 })
        .limit(5)
        .select('title slug difficulty category totalSubmissions totalAccepted acceptanceRate')
        .lean(),

      Quiz.find({ isPublished: true })
        .sort({ totalAttempts: -1 })
        .limit(5)
        .select('title slug passingScore totalAttempts')
        .lean(),

      Tutorial.find({ isPublished: true })
        .sort({ views: -1, createdAt: -1 })
        .limit(5)
        .select('title slug category views readingTime')
        .lean(),
    ]);

    // Build contiguous date points map for clean continuous charts
    const dateMap = new Map<string, any>();
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      if (d > new Date()) break;
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, {
        date: key,
        students: 0,
        enrollments: 0,
        completions: 0,
        quizAttempts: 0,
        quizPassed: 0,
        dsaSubmissions: 0,
        dsaAccepted: 0,
        certificates: 0,
      });
    }

    registrationGrowth.forEach((r) => {
      if (dateMap.has(r._id)) dateMap.get(r._id).students = r.count;
    });

    enrollmentGrowth.forEach((e) => {
      if (dateMap.has(e._id)) {
        dateMap.get(e._id).enrollments = e.enrollments;
        dateMap.get(e._id).completions = e.completions;
      }
    });

    quizActivity.forEach((q) => {
      if (dateMap.has(q._id)) {
        dateMap.get(q._id).quizAttempts = q.totalAttempts;
        dateMap.get(q._id).quizPassed = q.passedAttempts;
      }
    });

    dsaActivity.forEach((s) => {
      if (dateMap.has(s._id)) {
        dateMap.get(s._id).dsaSubmissions = s.totalSubmissions;
        dateMap.get(s._id).dsaAccepted = s.acceptedSubmissions;
      }
    });

    certificateGrowth.forEach((c) => {
      if (dateMap.has(c._id)) {
        dateMap.get(c._id).certificates = c.certificates;
      }
    });

    const timeSeriesData = Array.from(dateMap.values());

    const enrichedTopCourses = await Promise.all(
      topCourses.map(async (c) => {
        const totalEnrollments = await Enrollment.countDocuments({ courseId: c._id });
        return {
          id: c._id.toString(),
          title: c.title,
          slug: c.slug,
          category: c.category,
          level: c.level,
          totalEnrollments,
        };
      })
    );

    ApiResponse.success(
      res,
      'Admin analytics data retrieved successfully',
      {
        timeframe,
        days,
        timeSeries: timeSeriesData,
        topContent: {
          courses: enrichedTopCourses,
          problems: topProblems.map((p) => ({
            id: p._id.toString(),
            title: p.title,
            slug: p.slug,
            difficulty: p.difficulty,
            category: p.category,
            totalSubmissions: p.totalSubmissions || 0,
            totalAccepted: p.totalAccepted || 0,
            acceptanceRate: p.acceptanceRate || 0,
          })),
          quizzes: topQuizzes.map((q) => ({
            id: q._id.toString(),
            title: q.title,
            slug: q.slug,
            passingScore: q.passingScore,
            totalAttempts: q.totalAttempts || 0,
          })),
          tutorials: topTutorials.map((t) => ({
            id: t._id.toString(),
            title: t.title,
            slug: t.slug,
            category: t.category,
            views: t.views || 0,
            readingTime: t.readingTime,
          })),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};
