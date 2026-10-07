import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { quizService } from '../../services/quiz.service';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowLeft,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const QuizResultPage: React.FC = () => {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle('Assessment Results & Answer Review — NextEra Coders');

  useEffect(() => {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    quizService
      .getAttemptById(attemptId)
      .then((data) => setResult(data))
      .catch((err) => setError(err.message || 'Failed to load assessment results'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <ErrorState title="Error Loading Results" message={error || 'Result not found'} />
        <div className="text-center mt-4">
          <Link to={ROUTES.QUIZZES}>
            <Button variant="outline" size="sm">
              Back to Quizzes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { score, totalMarks, percentage, passed, timeTaken, quiz, review } = result;
  const correctCount = review?.filter((r: any) => r.isCorrect).length || 0;
  const incorrectCount = (review?.length || 0) - correctCount;

  return (
    <div className="min-h-screen py-10 bg-slate-50/50 dark:bg-dark-950 transition-colors pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to={`/quizzes/${id || quiz?.id}`}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Quiz Overview
          </Link>
        </div>

        {/* Score & Banner Card */}
        <Card
          variant="elevated"
          className={cn(
            'overflow-hidden border-2',
            passed
              ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
              : 'border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10'
          )}
        >
          <CardContent className="p-6 sm:p-8 space-y-6 text-center">
            <div
              className={cn(
                'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg',
                passed
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-rose-600 text-white shadow-rose-500/20'
              )}
            >
              {passed ? <Sparkles className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <span
                className={cn(
                  'text-xs font-mono font-extrabold uppercase tracking-wider',
                  passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {passed ? 'Assessment Passed' : 'Assessment Not Passed'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {percentage}% Score ({score} / {totalMarks} Marks)
              </h1>
              <p className="text-xs text-slate-500">
                {quiz?.title} • Passing Score: {quiz?.passingScore || 70}%
              </p>
            </div>

            {/* Performance Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto font-mono text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800">
                <span className="block text-[10px] text-slate-400 uppercase">Correct</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {correctCount}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800">
                <span className="block text-[10px] text-slate-400 uppercase">Incorrect</span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                  {incorrectCount}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800">
                <span className="block text-[10px] text-slate-400 uppercase">Total Questions</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {review?.length || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800">
                <span className="block text-[10px] text-slate-400 uppercase">Time Taken</span>
                <span className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {Math.floor((timeTaken || 0) / 60)}m {(timeTaken || 0) % 60}s
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to={`/quizzes/${id || quiz?.id}/attempt`}>
                <Button
                  variant="primary"
                  size="md"
                  className="font-mono text-xs"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Retake Assessment
                </Button>
              </Link>
              <Link to={ROUTES.QUIZZES}>
                <Button variant="outline" size="md" className="font-mono text-xs">
                  Explore More Quizzes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Question Review Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Detailed Answer Review & Explanations
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {correctCount} of {review?.length || 0} correct
            </span>
          </div>

          <div className="space-y-4">
            {review?.map((item: any, idx: number) => (
              <Card
                key={idx}
                variant="elevated"
                className={cn(
                  'border-l-4 transition-colors',
                  item.isCorrect
                    ? 'border-l-emerald-500 border-slate-200 dark:border-dark-800'
                    : 'border-l-rose-500 border-slate-200 dark:border-dark-800'
                )}
              >
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Question {idx + 1}
                    </span>
                    {item.isCorrect ? (
                      <Badge variant="success" size="sm" className="font-mono">
                        Correct (+{item.marksEarned} mark)
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm" className="font-mono">
                        Incorrect (0 / {item.marks} marks)
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {item.question}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Options List */}
                  <div className="space-y-2">
                    {item.options?.map((opt: string, optIdx: number) => {
                      const isSelected = item.selectedAnswer === opt;
                      const isCorrectAnswer = item.correctAnswer === opt;

                      return (
                        <div
                          key={optIdx}
                          className={cn(
                            'p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3',
                            isCorrectAnswer
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500/50'
                              : isSelected && !isCorrectAnswer
                              ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100'
                              : 'border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 opacity-80'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center font-mono text-[10px] font-bold">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            {isSelected && (
                              <span className="text-slate-500 dark:text-slate-400 font-normal">
                                (Your Answer)
                              </span>
                            )}
                            {isCorrectAnswer && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                              </span>
                            )}
                            {isSelected && !isCorrectAnswer && (
                              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Incorrect
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Block */}
                  {item.explanation && (
                    <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-800 text-xs space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono block">
                        💡 Explanation:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
