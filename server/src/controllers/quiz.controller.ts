import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Quiz } from '../models/quiz.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { gamificationService } from '../services/gamification.service';
import { notificationService } from '../services/notification.service';

// @desc    Get published quizzes
// @route   GET /api/quizzes
// @access  Public
export const getQuizzes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const courseId = req.query.courseId as string;

    const query: any = { isPublished: true };

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (courseId) {
      query.courseId = courseId;
    }

    const [quizzes, totalItems] = await Promise.all([
      Quiz.find(query)
        .populate('courseId', 'title slug')
        .select('-questions.correctAnswer -questions.explanation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quiz.countDocuments(query),
    ]);

    // Fetch student's previous attempt statuses if logged in
    let userAttemptsMap = new Map<string, { passed: boolean; score: number; percentage: number }>();
    if (req.user) {
      const attempts = await QuizAttempt.find({
        userId: req.user._id,
        status: 'SUBMITTED',
      })
        .sort({ completedAt: -1 })
        .lean();

      for (const att of attempts) {
        const qId = att.quizId.toString();
        if (!userAttemptsMap.has(qId) || att.passed) {
          userAttemptsMap.set(qId, {
            passed: att.passed,
            score: att.score,
            percentage: att.percentage,
          });
        }
      }
    }

    const formatted = quizzes.map((q: any) => {
      const qId = q._id.toString();
      const lastAttempt = userAttemptsMap.get(qId);

      return {
        id: qId,
        title: q.title,
        slug: q.slug,
        description: q.description,
        course: q.courseId
          ? { id: q.courseId._id.toString(), title: q.courseId.title, slug: q.courseId.slug }
          : null,
        totalQuestions: q.questions?.length || 0,
        passingScore: q.passingScore,
        timeLimit: q.timeLimit,
        totalAttempts: q.totalAttempts || 0,
        userAttempt: lastAttempt || null,
        createdAt: q.createdAt,
      };
    });

    ApiResponse.success(
      res,
      'Quizzes retrieved successfully',
      {
        quizzes: formatted,
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

// @desc    Get quiz details by ID or Slug (Sanitized: NO correct answers or explanations)
// @route   GET /api/quizzes/:id
// @access  Public
export const getQuizById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const isId = Types.ObjectId.isValid(id);

    const query: any = { isPublished: true };
    if (isId) query._id = id;
    else query.slug = id;

    const quiz = await Quiz.findOne(query)
      .populate('courseId', 'title slug')
      .populate('lessonId', 'title')
      .lean();

    if (!quiz) {
      throw ApiError.notFound('Quiz not found or is unpublished');
    }

    let userAttempts: any[] = [];
    if (req.user) {
      userAttempts = await QuizAttempt.find({
        userId: req.user._id,
        quizId: quiz._id,
        status: 'SUBMITTED',
      })
        .sort({ completedAt: -1 })
        .lean();
    }

    ApiResponse.success(
      res,
      'Quiz details retrieved',
      {
        quiz: {
          id: quiz._id.toString(),
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description,
          course: quiz.courseId
            ? { id: (quiz.courseId as any)._id.toString(), title: (quiz.courseId as any).title, slug: (quiz.courseId as any).slug }
            : null,
          lesson: quiz.lessonId
            ? { id: (quiz.lessonId as any)._id.toString(), title: (quiz.lessonId as any).title }
            : null,
          totalQuestions: quiz.questions?.length || 0,
          passingScore: quiz.passingScore,
          timeLimit: quiz.timeLimit,
          totalAttempts: quiz.totalAttempts || 0,
          previousAttempts: userAttempts.map((a) => ({
            id: a._id.toString(),
            score: a.score,
            percentage: a.percentage,
            passed: a.passed,
            timeTaken: a.timeTaken,
            completedAt: a.completedAt,
          })),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Start quiz attempt (Creates QuizAttempt in STARTED state, returns questions without answers)
// @route   POST /api/quizzes/:id/start
// @access  Protected (Student)
export const startQuizAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const query: any = { isPublished: true };
    if (Types.ObjectId.isValid(id)) query._id = id;
    else query.slug = id;

    const quiz = await Quiz.findOne(query);
    if (!quiz) {
      throw ApiError.notFound('Quiz not found or is unpublished');
    }

    // Create a new active attempt
    const attempt = await QuizAttempt.create({
      userId: user._id,
      quizId: quiz._id,
      status: 'STARTED',
      startedAt: new Date(),
    });

    // Sanitized questions for the quiz player
    const sanitizedQuestions = quiz.questions.map((q, idx) => ({
      index: idx,
      question: q.question,
      options: q.options,
      marks: q.marks,
      order: q.order || idx + 1,
    }));

    ApiResponse.success(
      res,
      'Quiz attempt started',
      {
        attemptId: attempt._id.toString(),
        quiz: {
          id: quiz._id.toString(),
          title: quiz.title,
          timeLimit: quiz.timeLimit,
          passingScore: quiz.passingScore,
          totalQuestions: sanitizedQuestions.length,
          questions: sanitizedQuestions,
        },
        startedAt: attempt.startedAt,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz answers and evaluate score
// @route   POST /api/quizzes/:id/submit
// @access  Protected (Student)
export const submitQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { attemptId, answers, timeTaken } = req.body;
    const user = req.user!;

    const query: any = { isPublished: true };
    if (Types.ObjectId.isValid(id)) query._id = id;
    else query.slug = id;

    const quiz = await Quiz.findOne(query);
    if (!quiz) {
      throw ApiError.notFound('Quiz not found');
    }

    // Evaluate answers
    let totalMarks = 0;
    let earnedMarks = 0;
    const evaluatedAnswers: any[] = [];
    const reviewDetails: any[] = [];

    const answerMap = new Map<number, string>();
    for (const ans of answers || []) {
      answerMap.set(ans.questionIndex, ans.selectedAnswer);
    }

    quiz.questions.forEach((q, idx) => {
      const qMarks = q.marks || 1;
      totalMarks += qMarks;

      const selected = answerMap.get(idx) || '';
      const isCorrect = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        earnedMarks += qMarks;
      }

      evaluatedAnswers.push({
        questionIndex: idx,
        selectedAnswer: selected,
        isCorrect,
        marksEarned: isCorrect ? qMarks : 0,
      });

      reviewDetails.push({
        questionIndex: idx,
        question: q.question,
        options: q.options,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
        marks: qMarks,
        marksEarned: isCorrect ? qMarks : 0,
      });
    });

    const percentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    // Update existing attempt or create new one
    let attempt;
    if (attemptId && Types.ObjectId.isValid(attemptId)) {
      attempt = await QuizAttempt.findOne({ _id: attemptId, userId: user._id });
    }

    if (attempt) {
      attempt.score = earnedMarks;
      attempt.totalMarks = totalMarks;
      attempt.percentage = percentage;
      attempt.passed = passed;
      attempt.status = 'SUBMITTED';
      attempt.answers = evaluatedAnswers;
      attempt.completedAt = new Date();
      attempt.timeTaken = timeTaken || 0;
      await attempt.save();
    } else {
      attempt = await QuizAttempt.create({
        userId: user._id,
        quizId: quiz._id,
        score: earnedMarks,
        totalMarks,
        percentage,
        passed,
        status: 'SUBMITTED',
        answers: evaluatedAnswers,
        startedAt: new Date(Date.now() - (timeTaken || 60) * 1000),
        completedAt: new Date(),
        timeTaken: timeTaken || 0,
      });
    }

    // Increment quiz total attempts count
    quiz.totalAttempts = (quiz.totalAttempts || 0) + 1;
    await quiz.save();

    // Trigger gamification (award quiz points, update streak, check achievements)
    gamificationService
      .recordQuizSubmitted(user._id, quiz._id, attempt._id, percentage)
      .catch((err) => console.error('Gamification record error:', err));

    // Send quiz result notification
    notificationService
      .createNotification({
        userId: user._id,
        title: passed ? 'Quiz Passed! 🎯' : 'Quiz Attempt Completed',
        message: `You scored ${percentage}% in "${quiz.title}".`,
        type: 'QUIZ',
        link: `/quizzes/${quiz._id}/result/${attempt._id}`,
        referenceType: 'QUIZ',
        referenceId: attempt._id.toString(),
      })
      .catch((err) => console.error('Quiz notification error:', err));

    ApiResponse.success(
      res,
      passed ? 'Congratulations! You passed the quiz!' : 'Quiz submitted. Better luck next time!',
      {
        attemptId: attempt._id.toString(),
        score: earnedMarks,
        totalMarks,
        percentage,
        passed,
        passingScore: quiz.passingScore,
        timeTaken: attempt.timeTaken,
        completedAt: attempt.completedAt,
        review: reviewDetails,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get student attempts for a quiz
// @route   GET /api/quizzes/:id/attempts
// @access  Protected (Student)
export const getQuizAttempts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const query: any = {};
    if (Types.ObjectId.isValid(id)) query._id = id;
    else query.slug = id;

    const quiz = await Quiz.findOne(query);
    if (!quiz) {
      throw ApiError.notFound('Quiz not found');
    }

    const attempts = await QuizAttempt.find({
      userId: user._id,
      quizId: quiz._id,
      status: 'SUBMITTED',
    })
      .sort({ completedAt: -1 })
      .lean();

    const formatted = attempts.map((a) => ({
      id: a._id.toString(),
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
      passed: a.passed,
      timeTaken: a.timeTaken,
      completedAt: a.completedAt,
    }));

    ApiResponse.success(res, 'Quiz attempts retrieved', { attempts: formatted }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single attempt review & result by attempt ID
// @route   GET /api/quiz-attempts/:attemptId
// @access  Protected (Student)
export const getAttemptById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const user = req.user!;

    if (!Types.ObjectId.isValid(attemptId)) {
      throw ApiError.badRequest('Invalid attempt ID');
    }

    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      userId: user._id,
    })
      .populate('quizId')
      .lean();

    if (!attempt || !attempt.quizId) {
      throw ApiError.notFound('Attempt not found');
    }

    const quiz = attempt.quizId as any;

    const answerMap = new Map<number, any>();
    for (const ans of attempt.answers || []) {
      answerMap.set(ans.questionIndex, ans);
    }

    const review = quiz.questions.map((q: any, idx: number) => {
      const userAns = answerMap.get(idx);
      return {
        questionIndex: idx,
        question: q.question,
        options: q.options,
        selectedAnswer: userAns?.selectedAnswer || '',
        correctAnswer: q.correctAnswer,
        isCorrect: !!userAns?.isCorrect,
        explanation: q.explanation || '',
        marks: q.marks,
        marksEarned: userAns?.marksEarned || 0,
      };
    });

    ApiResponse.success(
      res,
      'Attempt review retrieved',
      {
        attempt: {
          id: attempt._id.toString(),
          quiz: {
            id: quiz._id.toString(),
            title: quiz.title,
            passingScore: quiz.passingScore,
          },
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          percentage: attempt.percentage,
          passed: attempt.passed,
          timeTaken: attempt.timeTaken,
          completedAt: attempt.completedAt,
          review,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};
