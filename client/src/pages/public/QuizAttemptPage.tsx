import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { quizService } from '../../services/quiz.service';
import { IQuizStartResponse, IQuizQuestionPlayer } from '../../types/quiz.types';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const QuizAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: toastError, warning } = useToast();

  const [attemptData, setAttemptData] = useState<IQuizStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);

  useDocumentTitle(
    attemptData ? `Attempting: ${attemptData.quiz.title} — NextEra Coders` : 'Quiz Assessment'
  );

  // Initialize Quiz Attempt
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    quizService
      .startQuiz(id)
      .then((data) => {
        setAttemptData(data);
        if (data.quiz.timeLimit > 0) {
          setTimeLeft(data.quiz.timeLimit * 60);
        }
        startTimeRef.current = Date.now();
      })
      .catch((err) => setError(err.message || 'Failed to start quiz attempt'))
      .finally(() => setLoading(false));
  }, [id]);

  // Submit Handler
  const handleSubmitQuiz = useCallback(async () => {
    if (!attemptData || submitting) return;

    try {
      setSubmitting(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const answersPayload = attemptData.quiz.questions.map((q) => ({
        questionIndex: q.index,
        selectedAnswer: selectedAnswers[q.index] || '',
      }));

      const result = await quizService.submitQuiz(attemptData.quiz.id, {
        attemptId: attemptData.attemptId,
        answers: answersPayload,
        timeTaken: elapsedSeconds,
      });

      navigate(`/quizzes/${attemptData.quiz.id}/result/${result.attemptId}`);
    } catch (err: any) {
      toastError(err.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  }, [attemptData, selectedAnswers, submitting, toastError, navigate]);

  // Timer Countdown Logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          warning('Time is up! Submitting your assessment automatically...', 'Timer Expired');
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timeLeft, handleSubmitQuiz, warning]);

  const handleSelectOption = (option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: option,
    }));
  };

  const currentQuestion: IQuizQuestionPlayer | undefined =
    attemptData?.quiz.questions[currentIndex];

  const totalQuestions = attemptData?.quiz.questions.length || 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <ErrorState title="Unable to Start Assessment" message={error || 'Quiz not found'} />
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

  return (
    <div className="min-h-screen py-8 bg-slate-50/50 dark:bg-dark-950 transition-colors pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Assessment Control Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-16 z-20 backdrop-blur-md">
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {attemptData.quiz.title}
            </h1>
            <span className="text-xs font-mono text-slate-500">
              Question {currentIndex + 1} of {totalQuestions} • {answeredCount} answered
            </span>
          </div>

          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div
                className={cn(
                  'px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold transition-colors',
                  timeLeft < 60
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 animate-pulse'
                    : timeLeft < 180
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-dark-850 border-slate-200 dark:border-dark-800 text-slate-700 dark:text-slate-300'
                )}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              className="font-mono text-xs"
              onClick={() => setShowConfirmModal(true)}
              isLoading={submitting}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Quiz
            </Button>
          </div>
        </div>

        {/* Question Palette / Quick Navigator */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Question Navigator
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {unansweredCount > 0 ? `${unansweredCount} remaining` : 'All answered ✓'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {attemptData.quiz.questions.map((_q, idx) => {
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isCurrent = currentIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all',
                    isCurrent
                      ? 'ring-2 ring-brand-500 bg-brand-600 text-white'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-100 text-slate-600 dark:bg-dark-850 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-800'
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Question Card */}
        {currentQuestion && (
          <Card variant="elevated" className="border-slate-200 dark:border-dark-800">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <Badge variant="default" size="sm" className="font-mono">
                  Question {currentIndex + 1} ({currentQuestion.marks} mark)
                </Badge>

                {selectedAnswers[currentIndex] ? (
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Answer Selected
                  </span>
                ) : (
                  <span className="text-xs font-mono text-slate-400">Unanswered</span>
                )}
              </div>

              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === option;
                const optionLetter = String.fromCharCode(65 + optIdx);

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(option)}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 group',
                      isSelected
                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 text-brand-950 dark:text-brand-100 shadow-sm ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 hover:border-slate-300 dark:hover:border-dark-700 text-slate-800 dark:text-slate-200'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors',
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-dark-750'
                      )}
                    >
                      {optionLetter}
                    </div>

                    <span className="text-xs sm:text-sm font-medium leading-normal flex-1">
                      {option}
                    </span>
                  </div>
                );
              })}
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-slate-100 dark:border-dark-800 pt-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              <div className="text-xs font-mono text-slate-400">
                {currentIndex + 1} / {totalQuestions}
              </div>

              {currentIndex < totalQuestions - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowConfirmModal(true)}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Finish & Submit
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Ready to Submit Assessment?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have answered <span className="font-bold text-slate-900 dark:text-white">{answeredCount}</span> of{' '}
                  <span className="font-bold text-slate-900 dark:text-white">{totalQuestions}</span> questions.
                  {unansweredCount > 0 && (
                    <span className="block text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                      ⚠️ You have {unansweredCount} unanswered questions!
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                >
                  Return to Quiz
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                  onClick={handleSubmitQuiz}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Confirm & Submit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
