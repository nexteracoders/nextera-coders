import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminProblemService } from '../../services/adminProblem.service';
import { getCleanStarterCode } from '../../utils/starterCode';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Plus, Trash2, ArrowLeft, Save, Sparkles, Code2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const formSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  slug: z.string().trim().min(1, 'Slug is required'),
  order: z.coerce.number().int().positive('Serial number must be positive').optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  category: z.string().trim().min(2, 'Category is required'),
  youtubeUrl: z.string().trim().optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  constraints: z.string().optional(),
  hints: z.string().optional(),
  timeComplexity: z.string().default('O(n)'),
  spaceComplexity: z.string().default('O(1)'),
  starterCodeJs: z.string().optional(),
  starterCodeTs: z.string().optional(),
  starterCodePy: z.string().optional(),
  starterCodeJava: z.string().optional(),
  starterCodeCpp: z.string().optional(),
  starterCodeC: z.string().optional(),
  starterCodeCs: z.string().optional(),
  solution: z.string().optional(),
  isPublished: z.boolean().default(true),
  examples: z
    .array(
      z.object({
        input: z.string().min(1, 'Input is required'),
        output: z.string().min(1, 'Output is required'),
        explanation: z.string().optional(),
      })
    )
    .min(1, 'At least 1 example is required'),
  testCases: z
    .array(
      z.object({
        input: z.string().min(1, 'Input is required'),
        expectedOutput: z.string().min(1, 'Expected output is required'),
        hidden: z.boolean().default(false),
      })
    )
    .min(1, 'At least 1 test case is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const AdminProblemEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCodeLang, setActiveCodeLang] = useState<'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c' | 'csharp'>('java');

  useDocumentTitle('Edit DSA Problem — NextEra Coders Admin');

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const watchTitle = watch('title');
  const watchSlug = watch('slug');

  const {
    fields: exampleFields,
    append: appendExample,
    remove: removeExample,
  } = useFieldArray({ control, name: 'examples' });

  const {
    fields: testCaseFields,
    append: appendTestCase,
    remove: removeTestCase,
  } = useFieldArray({ control, name: 'testCases' });

  useEffect(() => {
    if (!id) return;
    adminProblemService
      .getProblemById(id)
      .then((prob) => {
        const probMeta = { title: prob.title, slug: prob.slug };
        reset({
          title: prob.title,
          slug: prob.slug,
          order: typeof prob.order === 'number' && prob.order > 0 ? prob.order : undefined,
          difficulty: prob.difficulty,
          category: prob.category,
          youtubeUrl: prob.youtubeUrl || '',
          description: prob.description,
          constraints: prob.constraints?.join('\n') || '',
          hints: prob.hints?.join('\n') || '',
          timeComplexity: prob.expectedComplexity?.time || 'O(n)',
          spaceComplexity: prob.expectedComplexity?.space || 'O(1)',
          starterCodeJava: prob.starterCode?.java || getCleanStarterCode(probMeta, 'java'),
          starterCodeCpp: prob.starterCode?.cpp || getCleanStarterCode(probMeta, 'cpp'),
          starterCodePy: prob.starterCode?.python || getCleanStarterCode(probMeta, 'python'),
          starterCodeJs: prob.starterCode?.javascript || getCleanStarterCode(probMeta, 'javascript'),
          starterCodeTs: prob.starterCode?.typescript || getCleanStarterCode(probMeta, 'typescript'),
          starterCodeC: prob.starterCode?.c || getCleanStarterCode(probMeta, 'c'),
          starterCodeCs: prob.starterCode?.csharp || getCleanStarterCode(probMeta, 'csharp'),
          solution: prob.solution || '',
          isPublished: prob.isPublished,
          examples: prob.examples || [{ input: '', output: '', explanation: '' }],
          testCases: prob.testCases || [{ input: '', expectedOutput: '', hidden: false }],
        });
      })
      .catch((err) => setError(err.message || 'Failed to load problem'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  // Auto-generate clean LeetCode / GFG starter templates across all languages
  const handleAutoGenerateTemplates = () => {
    const title = watchTitle || 'Sample Problem';
    const slug = watchSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const meta = { title, slug };

    setValue('starterCodeJava', getCleanStarterCode(meta, 'java'));
    setValue('starterCodeCpp', getCleanStarterCode(meta, 'cpp'));
    setValue('starterCodePy', getCleanStarterCode(meta, 'python'));
    setValue('starterCodeJs', getCleanStarterCode(meta, 'javascript'));
    setValue('starterCodeTs', getCleanStarterCode(meta, 'typescript'));
    setValue('starterCodeC', getCleanStarterCode(meta, 'c'));
    setValue('starterCodeCs', getCleanStarterCode(meta, 'csharp'));

    success('Generated standard LeetCode & GFG style starter code for all 7 languages!', '⚡ Auto-Generated');
  };

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    try {
      setSubmitting(true);
      const constraintsArray = data.constraints
        ? data.constraints.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];
      const hintsArray = data.hints
        ? data.hints.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: data.title,
        slug: data.slug,
        difficulty: data.difficulty,
        category: data.category,
        youtubeUrl: data.youtubeUrl || '',
        description: data.description,
        constraints: constraintsArray,
        hints: hintsArray,
        expectedComplexity: {
          time: data.timeComplexity,
          space: data.spaceComplexity,
        },
        starterCode: {
          javascript: data.starterCodeJs || '',
          typescript: data.starterCodeTs || '',
          python: data.starterCodePy || '',
          java: data.starterCodeJava || '',
          cpp: data.starterCodeCpp || '',
          c: data.starterCodeC || '',
          csharp: data.starterCodeCs || '',
        },
        solution: data.solution || '',
        isPublished: data.isPublished,
        order: data.order ? Number(data.order) : undefined,
        examples: data.examples,
        testCases: data.testCases,
        supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp'],
      };

      await adminProblemService.updateProblem(id, payload);
      success('Problem updated successfully with standard multi-language templates!', 'Saved ✓');
      navigate(ROUTES.ADMIN_PROBLEMS);
    } catch (err: any) {
      toastError(err.message || 'Failed to update problem');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Problem not found"
          message={error}
          onRetry={() => navigate(ROUTES.ADMIN_PROBLEMS)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2">
        <Link to={ROUTES.ADMIN_PROBLEMS}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Problems
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit DSA Problem</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Update problem statements, test cases, and LeetCode/GFG standard starter code templates.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Metadata */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Problem Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  SL. No. (Serial #) *
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 42"
                  error={errors.order?.message}
                  {...register('order')}
                />
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Permanent problem number
                </p>
              </div>

              <div className="sm:col-span-5">
                <Input
                  label="Problem Title *"
                  placeholder="e.g. Pair and Sum"
                  error={errors.title?.message}
                  {...register('title')}
                />
              </div>

              <div className="sm:col-span-4">
                <Input
                  label="Slug *"
                  placeholder="e.g. pair-and-sum"
                  error={errors.slug?.message}
                  {...register('slug')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Category / Topic *
                </label>
                <input
                  list="categories-list"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                  placeholder="e.g. Arrays, Strings, Trees, Graphs, DP"
                  {...register('category')}
                />
                <datalist id="categories-list">
                  <option value="Arrays" />
                  <option value="Strings" />
                  <option value="Linked List" />
                  <option value="Stack" />
                  <option value="Binary Search" />
                  <option value="Trees" />
                  <option value="Graphs" />
                  <option value="Dynamic Programming" />
                  <option value="Sliding Window" />
                  <option value="Bit Manipulation" />
                  <option value="Recursion" />
                </datalist>
                {errors.category && (
                  <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Difficulty *
                </label>
                <select
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                  {...register('difficulty')}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <Input
                  label="YouTube Video Tutorial URL"
                  placeholder="https://www.youtube.com/watch?v=..."
                  error={errors.youtubeUrl?.message}
                  {...register('youtubeUrl')}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Problem Description (Markdown supported) *
              </label>
              <textarea
                rows={5}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                placeholder="Given an array arr[] of N integers, calculate the sum of bitwise AND of all pairs..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Expected Time Complexity"
                placeholder="e.g. O(n)"
                {...register('timeComplexity')}
              />
              <Input
                label="Expected Space Complexity"
                placeholder="e.g. O(1)"
                {...register('spaceComplexity')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Constraints & Hints */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Constraints & Hints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Constraints (One per line)
              </label>
              <textarea
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                placeholder="1 <= N <= 10^5&#10;1 <= arr[i] <= 10^5"
                {...register('constraints')}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Hints (One per line)
              </label>
              <textarea
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                placeholder="Count set bits at each bit position from 0 to 31.&#10;For each bit position with k set bits, it contributes k*(k-1)/2 * 2^bit to total sum."
                {...register('hints')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Examples Section */}
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Public Examples</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendExample({ input: '', output: '', explanation: '' })}
              leftIcon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border-brand-500/30 hover:border-brand-500/50 shadow-xs"
            >
              Add Example
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {exampleFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850/50 space-y-3 relative"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Example {index + 1}</span>
                  {exampleFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(index)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Input"
                    placeholder="[5, 10, 15]"
                    error={errors.examples?.[index]?.input?.message}
                    {...register(`examples.${index}.input`)}
                  />
                  <Input
                    label="Output"
                    placeholder="15"
                    error={errors.examples?.[index]?.output?.message}
                    {...register(`examples.${index}.output`)}
                  />
                </div>

                <Input
                  label="Explanation (Optional)"
                  placeholder="The pairs are (5,10), (5,15), (10,15). (5&10)=0, (5&15)=5, (10&15)=10. Sum = 15."
                  {...register(`examples.${index}.explanation`)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Test Cases Section */}
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Evaluation Test Cases</CardTitle>
              <CardDescription className="text-xs">
                Public test cases are shown to students; hidden test cases are securely evaluated on submission.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendTestCase({ input: '', expectedOutput: '', hidden: true })}
              leftIcon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border-brand-500/30 hover:border-brand-500/50 shadow-xs"
            >
              Add Test Case
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {testCaseFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850/50 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>Test Case {index + 1}</span>
                    <label className="flex items-center gap-1.5 text-xs font-normal text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-brand-600"
                        {...register(`testCases.${index}.hidden`)}
                      />
                      <span>Hidden Test Case (Submission only)</span>
                    </label>
                  </div>

                  {testCaseFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Input
                    </label>
                    <textarea
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                      placeholder="Input payload e.g. [5, 10, 15]"
                      {...register(`testCases.${index}.input`)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Expected Output
                    </label>
                    <textarea
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                      placeholder="Expected output e.g. 15"
                      {...register(`testCases.${index}.expectedOutput`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Multi-Language Starter Code & Solution (LeetCode / GFG Standard) */}
        <Card variant="elevated">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="w-5 h-5 text-brand-500" /> Multi-Language Starter Code Templates
              </CardTitle>
              <CardDescription className="text-xs">
                Clean LeetCode & GFG standard <code className="text-brand-400">class Solution</code> boilerplates for students.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoGenerateTemplates}
              leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
              className="border-amber-500/40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0"
            >
              ⚡ Auto-Generate LeetCode / GFG Format
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Language Selector Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 overflow-x-auto">
              {[
                { id: 'java', label: 'Java' },
                { id: 'cpp', label: 'C++' },
                { id: 'python', label: 'Python 3' },
                { id: 'javascript', label: 'JavaScript' },
                { id: 'typescript', label: 'TypeScript' },
                { id: 'c', label: 'C' },
                { id: 'csharp', label: 'C#' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setActiveCodeLang(lang.id as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer',
                    activeCodeLang === lang.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Language Specific Textareas */}
            {activeCodeLang === 'java' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Java Starter Code (LeetCode / GFG Standard)
                </label>
                <textarea
                  rows={8}
                  className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 text-xs font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
                  {...register('starterCodeJava')}
                />
              </div>
            )}

            {activeCodeLang === 'cpp' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  C++ Starter Code (LeetCode / GFG Standard)
                </label>
                <textarea
                  rows={8}
                  className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 text-xs font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
                  {...register('starterCodeCpp')}
                />
              </div>
            )}

            {activeCodeLang === 'python' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Python 3 Starter Code (LeetCode / GFG Standard)
                </label>
                <textarea
                  rows={8}
                  className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 text-xs font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
                  {...register('starterCodePy')}
                />
              </div>
            )}

            {activeCodeLang === 'javascript' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  JavaScript Starter Code (LeetCode / GFG Standard)
                </label>
                <textarea
                  rows={8}
                  className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 text-xs font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
                  {...register('starterCodeJs')}
                />
              </div>
            )}

            {activeCodeLang === 'typescript' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  TypeScript Starter Code (LeetCode / GFG Standard)
                </label>
                <textarea
                  rows={8}
                  className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 text-xs font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
                  {...register('starterCodeTs')}
                />
              </div>
            )}

            {activeCodeLang === 'c' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  C Language Starter Code (GFG User Function Template)
                </label>
                <textarea
                  rows={8}
                  className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 text-xs font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
                  {...register('starterCodeC')}
                />
              </div>
            )}

            {activeCodeLang === 'csharp' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  C# Starter Code (LeetCode Standard)
                </label>
                <textarea
                  rows={8}
                  className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 text-xs font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
                  {...register('starterCodeCs')}
                />
              </div>
            )}

            {/* Reference Solution */}
            <div className="pt-3 border-t border-slate-200 dark:border-dark-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Official Solution (Private Reference for Editorial)
              </label>
              <textarea
                rows={5}
                className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
                placeholder="Official reference solution or editorial explanation..."
                {...register('solution')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" className="rounded text-brand-600" {...register('isPublished')} />
            <span>Publish immediately to public catalog</span>
          </label>

          <div className="flex items-center gap-2">
            <Link to={ROUTES.ADMIN_PROBLEMS}>
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
              Update Problem
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
