import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAppSelector } from '../../store/hooks';
import { quizService } from '../../services/quiz.service';
import { IQuizDetail } from '../../types/quiz.types';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  HelpCircle,
  Clock,
  Award,
  ArrowLeft,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

export const QuizDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [quiz, setQuiz] = useState<IQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(quiz ? `${quiz.title} — Quiz Details` : 'Quiz Details — NextEra Coders');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    quizService
      .getQuizById(id)
      .then((data) => setQuiz(data))
      .catch((err) => setError(err.message || 'Failed to load quiz details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStartQuiz = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (quiz) {
      navigate(`/quizzes/${quiz.id}/attempt`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <ErrorState
          title="Quiz Not Found"
          message={error || 'This quiz does not exist or has been unpublished.'}
        />
        <div className="text-center mt-4">
          <Link to={ROUTES.QUIZZES}>
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Quizzes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const bestAttempt = quiz.previousAttempts?.reduce((best, cur) => {
    return !best || cur.percentage > best.percentage ? cur : best;
  }, null as any);

  return (
    <div className="min-h-screen py-10 bg-slate-50/50 dark:bg-dark-950 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to={ROUTES.QUIZZES}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Quizzes
          </Link>
        </div>

        {/* Overview Banner Card */}
        <Card variant="elevated" className="border-brand-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {quiz.course && (
                <Badge variant="outline" size="sm" className="font-mono">
                  {quiz.course.title}
                </Badge>
              )}
              {quiz.lesson && (
                <Badge variant="default" size="sm" className="font-mono">
                  Lesson: {quiz.lesson.title}
                </Badge>
              )}
              <Badge variant="default" size="sm" className="font-mono">
                {quiz.totalQuestions} Questions
              </Badge>
            </div>

            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {quiz.title}
            </CardTitle>

            <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              {quiz.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key Assessment Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-800">
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 mb-1">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase">Questions</span>
                </div>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {quiz.totalQuestions}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Multiple choice single-select</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-800">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase">Time Limit</span>
                </div>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {quiz.timeLimit > 0 ? `${quiz.timeLimit} Minutes` : 'Unlimited'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {quiz.timeLimit > 0 ? 'Automatic submission upon expiry' : 'Self-paced completion'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase">Passing Score</span>
                </div>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {quiz.passingScore}%
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Required to pass assessment</p>
              </div>
            </div>

            {/* Assessment Rules & Instructions */}
            <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                <AlertCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Assessment Instructions & Rules
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                <li>Answer all questions carefully. You can navigate back and forth between questions before submitting.</li>
                <li>Your answers are saved in state as you progress.</li>
                <li>When the timer expires, the assessment will automatically grade your submitted answers.</li>
                <li>You may retry the quiz if you do not achieve the passing score.</li>
              </ul>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-mono text-sm px-8"
                onClick={handleStartQuiz}
                leftIcon={bestAttempt ? <RotateCcw className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              >
                {bestAttempt ? 'Retake Quiz' : 'Start Quiz Now'}
              </Button>

              {quiz.course && (
                <Link to={`/courses/${quiz.course.slug}`}>
                  <Button variant="outline" size="lg" leftIcon={<BookOpen className="w-4 h-4" />}>
                    View Course Curriculum
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Previous Attempts History Section */}
        {quiz.previousAttempts && quiz.previousAttempts.length > 0 && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>My Past Attempts</span>
                <span className="text-xs font-normal font-mono text-slate-500">
                  {quiz.previousAttempts.length} total attempts
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dark-800 text-slate-400">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Percentage</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3">Time Taken</th>
                      <th className="py-2.5 px-3 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                    {quiz.previousAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-slate-50 dark:hover:bg-dark-850/40">
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {attempt.score} / {attempt.totalMarks}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {attempt.percentage}%
                        </td>
                        <td className="py-3 px-3">
                          {attempt.passed ? (
                            <Badge variant="success" size="sm">
                              PASSED
                            </Badge>
                          ) : (
                            <Badge variant="danger" size="sm">
                              FAILED
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link to={`/quizzes/${quiz.id}/result/${attempt.id}`}>
                            <Button variant="ghost" size="sm">
                              View Result
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
