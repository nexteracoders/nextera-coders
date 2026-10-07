import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ITutorialChapter, ITutorialTrack } from '../../data/tutorialDocumentation';
import { getChapterQuizQuestions, getChapterQuizTimeLimit } from '../../data/tutorialQuizBank';

interface ChapterQuizSectionProps {
  chapter: ITutorialChapter;
  track: ITutorialTrack;
  onCompleted?: () => void;
}

export const ChapterQuizSection: React.FC<ChapterQuizSectionProps> = ({
  chapter,
  track,
  onCompleted,
}) => {
  // Load 10 questions for this chapter
  const questions = useMemo(() => {
    return getChapterQuizQuestions(chapter.id, track.id, chapter.quiz);
  }, [chapter.id, track.id, chapter.quiz]);

  const totalTimeSeconds = useMemo(() => {
    return getChapterQuizTimeLimit(chapter.id);
  }, [chapter.id]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(totalTimeSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Starts on first option tick
  const [reviewMode, setReviewMode] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when chapter changes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setTimeRemaining(totalTimeSeconds);
    setIsTimerRunning(false);
    setReviewMode(false);
  }, [chapter.id, totalTimeSeconds]);

  // 5-Minute Countdown Timer (Ticks only after isTimerRunning is true)
  useEffect(() => {
    if (isSubmitted || !isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimerRunning(false);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, isTimerRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optIndex: number) => {
    if (isSubmitted) return;
    // Trigger timer on first option tick
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    setIsTimerRunning(false);
    if (onCompleted) {
      onCompleted();
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setTimeRemaining(totalTimeSeconds);
    setIsTimerRunning(false);
    setCurrentIndex(0);
    setReviewMode(false);
  };

  // Calculate score
  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  }, [questions, selectedAnswers]);

  const percentage = Math.round((score / questions.length) * 100);
  const isPassed = percentage >= 70;
  const timeSpentSeconds = totalTimeSeconds - timeRemaining;

  return (
    <section
      id="chapter-quiz"
      aria-label="Chapter Assessment"
      className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 sm:p-7 shadow-sm space-y-5 transition-all scroll-mt-20"
    >
      {/* 1. Clean Header: Title, Question Indicator & 5-Min Timer (No extra clutter/badges) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Chapter Assessment</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Clean Timer Badge */}
        <div
          className={cn(
            'px-3 py-1.5 rounded-xl font-mono font-bold text-xs flex items-center gap-2 border transition-colors shadow-2xs',
            isSubmitted
              ? 'bg-slate-100 dark:bg-dark-800 text-slate-500 border-slate-200 dark:border-dark-750'
              : !isTimerRunning
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/80'
              : timeRemaining <= 60
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 animate-pulse'
              : timeRemaining <= 120
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
          )}
          title={!isTimerRunning && !isSubmitted ? 'Timer starts as soon as you select an option' : 'Assessment countdown timer'}
        >
          <Clock className={cn('w-4 h-4', isTimerRunning && timeRemaining <= 60 && !isSubmitted && 'animate-spin')} />
          <span>{isSubmitted ? formatTime(timeSpentSeconds) : formatTime(timeRemaining)}</span>
          {!isTimerRunning && !isSubmitted && (
            <span className="text-[10.5px] font-sans font-medium text-amber-700 dark:text-amber-400 hidden sm:inline">
              (Starts on 1st option)
            </span>
          )}
        </div>
      </div>

      {/* 2. Scorecard (When Submitted) */}
      {isSubmitted && (
        <div
          className={cn(
            'p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300',
            isPassed
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg',
                isPassed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              )}
            >
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base">
                  {isPassed ? 'Assessment Completed!' : 'Assessment Completed'}
                </h4>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/80 dark:bg-dark-900/80 border border-current">
                  {score}/{questions.length} ({percentage}%)
                </span>
              </div>
              <p className="text-xs opacity-85 mt-0.5">
                {isPassed
                  ? `Great job! You passed the chapter assessment.`
                  : `Score: ${percentage}%. 70% required to pass. Review your answers below!`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setReviewMode(!reviewMode)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-current hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              {reviewMode ? 'Hide Review' : 'Review Answers'}
            </button>
            <button
              type="button"
              onClick={handleRetake}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Active Question */}
      {currentQ && (
        <div className="space-y-3.5 pt-1">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.question}
          </h4>

          {/* 4 Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;
              const isCorrectOpt = optIdx === currentQ.correctIndex;
              const optionLetters = ['A', 'B', 'C', 'D'];

              let optionClasses =
                'bg-slate-50 dark:bg-dark-800/60 border-slate-200/80 dark:border-dark-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-750';

              if (isSubmitted) {
                if (isCorrectOpt) {
                  optionClasses =
                    'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs';
                } else if (isSelected && !isCorrectOpt) {
                  optionClasses =
                    'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-semibold';
                } else {
                  optionClasses =
                    'bg-slate-50/50 dark:bg-dark-900/50 border-slate-200/50 dark:border-dark-800 text-slate-400 opacity-60';
                }
              } else if (isSelected) {
                optionClasses =
                  'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold shadow-xs ring-1 ring-brand-500/30';
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isSubmitted}
                  className={cn(
                    'w-full text-left p-3 rounded-xl text-xs sm:text-sm transition-all border flex items-center justify-between gap-3 cursor-pointer group',
                    optionClasses
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border',
                        isSubmitted && isCorrectOpt
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : isSubmitted && isSelected && !isCorrectOpt
                          ? 'bg-rose-500 text-white border-rose-500'
                          : isSelected
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white dark:bg-dark-900 border-slate-300 dark:border-dark-700 text-slate-500 group-hover:border-slate-400'
                      )}
                    >
                      {optionLetters[optIdx]}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>

                  {isSubmitted && isCorrectOpt && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {isSubmitted && isSelected && !isCorrectOpt && (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box (Visible upon submission) */}
          {isSubmitted && currentQ.explanation && (
            <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-750 text-xs space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span>Explanation:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-5">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Action Buttons: Previous, Next & Submit Assessment (Renamed as requested) */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-dark-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleSubmitQuiz}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
          >
            Submit Assessment
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRetake}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
        )}
      </div>

      {/* 5. Complete Answer Review Accordion */}
      {isSubmitted && reviewMode && (
        <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-dark-800 animate-in fade-in duration-200">
          <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Answer Review
          </h4>
          <div className="space-y-2.5">
            {questions.map((q, qIdx) => {
              const userPick = selectedAnswers[qIdx];
              const isCorrect = userPick === q.correctIndex;
              return (
                <div
                  key={qIdx}
                  className={cn(
                    'p-3.5 rounded-xl border text-xs space-y-1.5',
                    isCorrect
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 font-bold text-slate-900 dark:text-white">
                    <span>
                      {qIdx + 1}. {q.question}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 font-mono text-[10px] px-2 py-0.5 rounded font-bold',
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                      )}
                    >
                      {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>Your Answer:</strong> {userPick !== undefined ? q.options[userPick] : '(Skipped)'}
                    </p>
                    {!isCorrect && (
                      <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                        <strong>Correct Answer:</strong> {q.options[q.correctIndex]}
                      </p>
                    )}
                    <p className="opacity-90 italic pt-1 border-t border-slate-200/60 dark:border-dark-750">
                      💡 {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
