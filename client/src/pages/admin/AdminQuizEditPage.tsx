import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminQuizService } from '../../services/adminQuiz.service';
import { courseService } from '../../services/course.service';
import { ICourse } from '../../types/course.types';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

const formSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  slug: z.string().trim().min(1, 'Slug is required'),
  courseId: z.string().optional(),
  description: z.string().trim().min(5, 'Description is required'),
  passingScore: z.number().min(1).max(100).default(70),
  timeLimit: z.number().min(0).default(15),
  isPublished: z.boolean().default(true),
  questions: z
    .array(
      z.object({
        question: z.string().trim().min(3, 'Question text is required'),
        optionsText: z.string().min(3, 'Enter at least 2 options (one per line)'),
        correctAnswer: z.string().trim().min(1, 'Correct answer is required'),
        explanation: z.string().optional(),
        marks: z.number().min(1).default(1),
        order: z.number().default(1),
      })
    )
    .min(1, 'At least 1 question is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const AdminQuizEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle('Edit Quiz Assessment — NextEra Coders Admin');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({ control, name: 'questions' });

  useEffect(() => {
    courseService.getCourses({ limit: 100 }).then((data) => setCourses(data.courses));

    if (!id) return;
    adminQuizService
      .getQuizById(id)
      .then((q) => {
        reset({
          title: q.title,
          slug: q.slug,
          courseId: q.courseId || '',
          description: q.description,
          passingScore: q.passingScore,
          timeLimit: q.timeLimit,
          isPublished: q.isPublished,
          questions: q.questions.map((item: any, idx: number) => ({
            question: item.question,
            optionsText: item.options.join('\n'),
            correctAnswer: item.correctAnswer,
            explanation: item.explanation || '',
            marks: item.marks || 1,
            order: item.order || idx + 1,
          })),
        });
      })
      .catch((err) => setError(err.message || 'Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    try {
      setSubmitting(true);

      const parsedQuestions = data.questions.map((q, idx) => {
        const options = q.optionsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);

        if (options.length < 2) {
          throw new Error(`Question ${idx + 1} must have at least 2 options.`);
        }

        return {
          question: q.question,
          options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          marks: Number(q.marks) || 1,
          order: idx + 1,
        };
      });

      const payload = {
        title: data.title,
        slug: data.slug,
        courseId: data.courseId ? data.courseId : null,
        description: data.description,
        passingScore: Number(data.passingScore),
        timeLimit: Number(data.timeLimit),
        isPublished: data.isPublished,
        questions: parsedQuestions,
      };

      await adminQuizService.updateQuiz(id, payload);
      success('Quiz updated successfully!', 'Saved');
      navigate(ROUTES.ADMIN_QUIZZES);
    } catch (err: any) {
      toastError(err.message || 'Failed to update quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <ErrorState title="Error Loading Quiz" message={error} />
        <div className="text-center mt-4">
          <Link to={ROUTES.ADMIN_QUIZZES}>
            <Button variant="outline" size="sm">
              Back to Quizzes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Link to={ROUTES.ADMIN_QUIZZES}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Quizzes
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Edit Quiz Assessment
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Update question options, answer keys, time constraints, and passing thresholds.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Quiz Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quiz Title *"
                error={errors.title?.message}
                {...register('title')}
              />
              <Input
                label="Slug *"
                error={errors.slug?.message}
                {...register('slug')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Associated Course
                </label>
                <select
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                  {...register('courseId')}
                >
                  <option value="">— Standalone Skill Test —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="number"
                label="Passing Score (%) *"
                error={errors.passingScore?.message}
                {...register('passingScore', { valueAsNumber: true })}
              />

              <Input
                type="number"
                label="Time Limit (Minutes) *"
                error={errors.timeLimit?.message}
                {...register('timeLimit', { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Quiz Description *
              </label>
              <textarea
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question Builder */}
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Questions Builder</CardTitle>
              <CardDescription className="text-xs">
                Edit multiple choice questions, options, correct answers, and explanations.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendQuestion({
                  question: '',
                  optionsText: 'Option A\nOption B\nOption C\nOption D',
                  correctAnswer: '',
                  explanation: '',
                  marks: 1,
                  order: questionFields.length + 1,
                })
              }
              leftIcon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border-brand-500/30 hover:border-brand-500/50 shadow-xs"
            >
              Add Question
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {questionFields.map((field, index) => (
              <div
                key={field.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850/50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                    Question {index + 1}
                  </span>

                  {questionFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Input
                  label="Question Text *"
                  error={errors.questions?.[index]?.question?.message}
                  {...register(`questions.${index}.question`)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Options (One per line) *
                    </label>
                    <textarea
                      rows={4}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                      {...register(`questions.${index}.optionsText`)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Input
                      label="Exact Correct Answer *"
                      error={errors.questions?.[index]?.correctAnswer?.message}
                      {...register(`questions.${index}.correctAnswer`)}
                    />

                    <Input
                      type="number"
                      label="Marks / Weight"
                      {...register(`questions.${index}.marks`, { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Explanation
                  </label>
                  <textarea
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                    {...register(`questions.${index}.explanation`)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" className="rounded text-brand-600" {...register('isPublished')} />
            <span>Published</span>
          </label>

          <div className="flex items-center gap-2">
            <Link to={ROUTES.ADMIN_QUIZZES}>
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Update Assessment
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
