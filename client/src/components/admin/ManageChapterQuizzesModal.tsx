import React, { useState, useEffect, useMemo } from 'react';
import {
  Edit2,
  Plus,
  Trash2,
  RotateCcw,
  ExternalLink,
  Save,
  BookOpen,
  Check,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TUTORIAL_TRACKS, ITutorialQuiz } from '../../data/tutorialDocumentation';
import {
  getChapterQuizQuestions,
  getChapterQuizTimeLimit,
  getCustomChapterQuiz,
  saveCustomChapterQuiz,
  resetCustomChapterQuiz,
} from '../../data/tutorialQuizBank';

interface ManageChapterQuizzesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackId?: string;
  initialChapterId?: string;
  onSaved?: () => void;
}

export const ManageChapterQuizzesModal: React.FC<ManageChapterQuizzesModalProps> = ({
  isOpen,
  onClose,
  initialTrackId,
  initialChapterId,
  onSaved,
}) => {
  const { success, error: toastError, info: toastInfo } = useToast();

  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    initialTrackId || TUTORIAL_TRACKS[0]?.id || 'react'
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialChapterId || '');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(5);
  const [questions, setQuestions] = useState<ITutorialQuiz[]>([]);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);

  // Active track object
  const activeTrack = useMemo(() => {
    return TUTORIAL_TRACKS.find((t) => t.id === selectedTrackId) || TUTORIAL_TRACKS[0];
  }, [selectedTrackId]);

  // All chapters in this track
  const trackChapters = useMemo(() => {
    if (!activeTrack) return [];
    return activeTrack.sections.flatMap((s) => s.chapters);
  }, [activeTrack]);

  // Sync initial track or chapter when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTrackId) setSelectedTrackId(initialTrackId);
      if (initialChapterId) {
        setSelectedChapterId(initialChapterId);
      } else if (trackChapters[0]) {
        setSelectedChapterId(trackChapters[0].id);
      }
    }
  }, [isOpen, initialTrackId, initialChapterId, trackChapters]);

  // Active chapter object
  const activeChapter = useMemo(() => {
    return trackChapters.find((c) => c.id === selectedChapterId) || trackChapters[0];
  }, [trackChapters, selectedChapterId]);

  // Load questions and time limit whenever active chapter changes
  useEffect(() => {
    if (activeChapter) {
      const qList = getChapterQuizQuestions(activeChapter.id, activeTrack.id, activeChapter.quiz);
      setQuestions(JSON.parse(JSON.stringify(qList)));
      const timeSec = getChapterQuizTimeLimit(activeChapter.id);
      setTimeLimitMinutes(Math.round(timeSec / 60));
      setEditingQuestionIdx(null);
    }
  }, [activeChapter, activeTrack.id]);

  // Check if customized
  const isCustomized = useMemo(() => {
    if (!activeChapter) return false;
    const custom = getCustomChapterQuiz(activeChapter.id);
    return !!(custom && custom.questions && custom.questions.length > 0);
  }, [activeChapter]);

  // Question editing handlers
  const handleUpdateQuestion = (idx: number, field: keyof ITutorialQuiz, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIdx].options];
      opts[optIdx] = val;
      updated[qIdx] = { ...updated[qIdx], options: opts };
      return updated;
    });
  };

  const handleAddQuestion = () => {
    const newQ: ITutorialQuiz = {
      question: 'New Interview Question Text Here',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Detailed technical explanation of why this answer is correct.',
    };
    setQuestions((prev) => [...prev, newQ]);
    setEditingQuestionIdx(questions.length);
    success('New question added to pool. Edit details below.', 'Question Added');
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      toastError('A chapter assessment must have at least 1 question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    if (editingQuestionIdx === idx) {
      setEditingQuestionIdx(null);
    } else if (editingQuestionIdx !== null && editingQuestionIdx > idx) {
      setEditingQuestionIdx(editingQuestionIdx - 1);
    }
    toastInfo('Question removed from chapter assessment.');
  };

  const handleResetToDefault = () => {
    if (!activeChapter) return;
    if (window.confirm('Reset this chapter quiz to default questions? Any custom changes will be cleared.')) {
      resetCustomChapterQuiz(activeChapter.id);
      const qList = getChapterQuizQuestions(activeChapter.id, activeTrack.id, activeChapter.quiz);
      setQuestions(JSON.parse(JSON.stringify(qList)));
      setTimeLimitMinutes(5);
      setEditingQuestionIdx(null);
      success('Quiz reset to verified default questions bank.', 'Reset Complete');
      if (onSaved) onSaved();
    }
  };

  const handleSaveAll = () => {
    if (!activeChapter) return;

    // Validation: make sure all questions have non-empty text and at least 2 options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toastError(`Question ${i + 1} cannot have empty text.`);
        setEditingQuestionIdx(i);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        toastError(`Question ${i + 1} has empty option choices.`);
        setEditingQuestionIdx(i);
        return;
      }
    }

    const timeLimitSeconds = Math.max(60, (timeLimitMinutes || 5) * 60);
    saveCustomChapterQuiz(activeChapter.id, questions, timeLimitSeconds);
    success(
      `Saved ${questions.length} questions & ${timeLimitMinutes}m timer for "${activeChapter.title}"!`,
      'Quiz Updated'
    );
    if (onSaved) onSaved();
    onClose();
  };

  const tutorialLink = activeChapter
    ? `/tutorials?track=${activeTrack.id}&chapter=${activeChapter.slug || activeChapter.id}#chapter-quiz`
    : '/tutorials';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tutorial Chapter Quizzes — Admin Management"
      maxWidth="xl"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Track & Chapter Selectors Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Target Tutorial Track & Chapter
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select track and chapter to configure 10-question assessment and 5-min timer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  isCustomized
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isCustomized ? '⭐ Custom Admin Override' : '✓ Standard Verified Bank'}
              </span>

              <a
                href={tutorialLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <span>Live View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Track Selector */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                Select Track
              </label>
              <select
                value={selectedTrackId}
                onChange={(e) => {
                  setSelectedTrackId(e.target.value);
                  const track = TUTORIAL_TRACKS.find((t) => t.id === e.target.value);
                  if (track && track.sections[0]?.chapters[0]) {
                    setSelectedChapterId(track.sections[0].chapters[0].id);
                  }
                }}
                className="w-full h-9 px-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                {TUTORIAL_TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.shortTitle || t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Selector */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                Select Chapter
              </label>
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                {trackChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Limit Setting */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
                <span>Timer Duration</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {timeLimitMinutes} Minutes
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value) || 5)}
                  className="w-full h-9 px-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-slate-400">mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-dark-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Questions in Assessment ({questions.length})
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              • 70% passing requirement
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs font-mono"
            >
              Reset Default
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleAddQuestion}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-mono bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Add Question
            </Button>
          </div>
        </div>

        {/* Questions Accordion List */}
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const isEditing = editingQuestionIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all ${
                  isEditing
                    ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20 p-4 space-y-3'
                    : 'border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 p-3.5 hover:border-slate-300'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>

                    {isEditing ? (
                      <div className="w-full space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-slate-500">
                          Question Prompt
                        </label>
                        <textarea
                          rows={2}
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(idx, 'question', e.target.value)}
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-sans"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                          {q.question}
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          ✓ Correct: {q.options[q.correctIndex]}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingQuestionIdx(isEditing ? null : idx)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-400 transition-colors"
                      title={isEditing ? 'Collapse' : 'Edit Question'}
                    >
                      {isEditing ? <Check className="w-4 h-4 text-emerald-500" /> : <Edit2 className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Options Editor when active */}
                {isEditing && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-dark-800">
                    <label className="block text-[10px] font-mono uppercase font-bold text-slate-500">
                      Options (Select the radio button of the correct answer)
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctIndex === oIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 p-2 rounded-xl border ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-opt-${idx}`}
                              checked={isCorrect}
                              onChange={() => handleUpdateQuestion(idx, 'correctIndex', oIdx)}
                              className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(idx, oIdx, e.target.value)}
                              className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                        Detailed Explanation
                      </label>
                      <textarea
                        rows={2}
                        value={q.explanation}
                        onChange={(e) => handleUpdateQuestion(idx, 'explanation', e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-sans"
                        placeholder="Explain why the correct answer is right and why others are wrong..."
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-dark-800 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveAll}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Save Chapter Quiz
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
