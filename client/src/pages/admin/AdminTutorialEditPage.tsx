import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminTutorialService } from '../../services/adminTutorial.service';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  ArrowLeft,
  Save,
  ImageIcon,
  Sparkles,
  Code2,
  HelpCircle,
  CheckCircle2,
  FileText,
  Trash2,
} from 'lucide-react';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { cn } from '../../utils/cn';

const formSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  slug: z.string().trim().optional(),
  track: z.string().default('python'),
  sectionTitle: z.string().default('Fundamentals'),
  category: z.string().trim().min(2, 'Category is required'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).default('Beginner'),
  excerpt: z.string().trim().min(5, 'Excerpt is required').max(500),
  quickFacts: z.string().optional(),
  diagramImageUrl: z.string().optional(),
  thumbnail: z.string().optional(),
  keyPointsText: z.string().optional(),
  content: z.string().min(5, 'Content must be at least 5 characters'),
  codeLanguage: z.string().default('python'),
  codeFilename: z.string().optional(),
  codeSnippetText: z.string().optional(),
  codeOutputText: z.string().optional(),
  quizQuestion: z.string().optional(),
  quizOption1: z.string().optional(),
  quizOption2: z.string().optional(),
  quizOption3: z.string().optional(),
  quizOption4: z.string().optional(),
  quizCorrectIndex: z.number().default(0),
  quizExplanation: z.string().optional(),
  practiceProblemLink: z.string().optional(),
  isPublished: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const TRACK_OPTIONS = [
  { id: 'dbms', label: '🗄️ Database Management Systems (DBMS)' },
  { id: 'os', label: '💻 Operating Systems (OS)' },
  { id: 'cn', label: '🌐 Computer Networks (CN)' },
  { id: 'toc', label: '🧮 Theory of Computation (TOC)' },
  { id: 'compiler', label: '⚙️ Compiler Design' },
  { id: 'coa', label: '⚡ Computer Org & Architecture (COA)' },
  { id: 'dsa', label: '🧠 DSA & Algorithms' },
  { id: 'sql', label: '🗄️ SQL & Databases' },
  { id: 'python', label: '🐍 Python' },
  { id: 'javascript', label: '⚡ JavaScript & TypeScript' },
  { id: 'react', label: '⚛️ React & Next.js' },
  { id: 'java', label: '☕ Java 21' },
  { id: 'cpp', label: '🚀 C++' },
  { id: 'c', label: '💻 C Language' },
  { id: 'devops', label: '☁️ DevOps & Cloud' },
  { id: 'systemdesign', label: '🌐 System Design' },
  { id: 'cybersecurity', label: '🛡️ Cybersecurity' },
  { id: 'ml', label: '✨ Machine Learning & GenAI' },
];

export const AdminTutorialEditPage: React.FC = () => {
  useDocumentTitle('Edit Tutorial — NextEra Coders Admin');
  const { id } = useParams<{ id: string; }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCustomTrack, setIsCustomTrack] = useState(false);
  const [customTrackInput, setCustomTrackInput] = useState('');
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);

  useEffect(() => {
    adminTutorialService.getSubjects().then((list) => {
      if (list && list.length) setDbSubjects(list);
    }).catch(() => {});
  }, []);

  const trackOptions = dbSubjects.length > 0
    ? dbSubjects.map((s) => ({ id: s.slug, label: `${s.title} (${s.slug})` }))
    : TRACK_OPTIONS;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      track: 'python',
      sectionTitle: 'Fundamentals',
      level: 'Beginner',
      isPublished: true,
    },
  });

  const watchDiagramUrl = watch('diagramImageUrl');
  const watchQuickFacts = watch('quickFacts') || '';
  const quickFactsWordCount = watchQuickFacts.trim() ? watchQuickFacts.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await adminTutorialService.getTutorialById(id);
        
        const trackVal = data.track || 'python';
        const isStandard = TRACK_OPTIONS.some((t) => t.id === trackVal);
        if (!isStandard) {
          setIsCustomTrack(true);
          setCustomTrackInput(trackVal);
        } else {
          setIsCustomTrack(false);
          setCustomTrackInput('');
        }
        
        reset({
          title: data.title || '',
          slug: data.slug || '',
          track: trackVal,
          sectionTitle: data.sectionTitle || 'Fundamentals',
          category: data.category || 'Python',
          level: (data.level as any) || 'Beginner',
          excerpt: data.excerpt || '',
          quickFacts: data.quickFacts || '',
          diagramImageUrl: data.diagramImageUrl || '',
          thumbnail: data.thumbnail || '',
          keyPointsText: data.keyPoints ? data.keyPoints.join('\n') : '',
          content: data.content || '',
          codeLanguage: data.codeSnippet?.language || 'python',
          codeFilename: data.codeSnippet?.filename || '',
          codeSnippetText: data.codeSnippet?.code || '',
          codeOutputText: data.codeSnippet?.output || '',
          quizQuestion: data.quiz?.question || '',
          quizOption1: data.quiz?.options?.[0] || '',
          quizOption2: data.quiz?.options?.[1] || '',
          quizOption3: data.quiz?.options?.[2] || '',
          quizOption4: data.quiz?.options?.[3] || '',
          quizCorrectIndex: data.quiz?.correctIndex || 0,
          quizExplanation: data.quiz?.explanation || '',
          practiceProblemLink: data.practiceProblemLink || '',
          isPublished: data.isPublished !== false,
        });
      } catch (err: any) {
        toastError(err.message || 'Failed to load tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [id, reset, toastError]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    try {
      setSubmitting(true);

      const track = isCustomTrack && customTrackInput.trim()
        ? customTrackInput.trim().toLowerCase().replace(/[^\w-]/g, '')
        : data.track;

      const keyPoints = data.keyPointsText
        ? data.keyPointsText.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];

      const quizOptions = [
        data.quizOption1 || '',
        data.quizOption2 || '',
        data.quizOption3 || '',
        data.quizOption4 || '',
      ].filter(Boolean);

      const payload = {
        title: data.title,
        slug: data.slug || undefined,
        track,
        sectionTitle: data.sectionTitle,
        category: data.category,
        level: data.level,
        excerpt: data.excerpt,
        quickFacts: data.quickFacts?.trim() || undefined,
        diagramImageUrl: data.diagramImageUrl?.trim() || '',
        thumbnail: data.thumbnail || data.diagramImageUrl || '',
        content: data.content,
        keyPoints,
        codeSnippet: {
          language: data.codeLanguage,
          filename: data.codeFilename || `${data.codeLanguage}_demo`,
          code: data.codeSnippetText || '',
          output: data.codeOutputText || '',
        },
        quiz: data.quizQuestion?.trim()
          ? {
              question: data.quizQuestion,
              options: quizOptions,
              correctIndex: Number(data.quizCorrectIndex) || 0,
              explanation: data.quizExplanation || '',
            }
          : undefined,
        practiceProblemLink: data.practiceProblemLink || '',
        isPublished: data.isPublished,
      };

      const updated = await adminTutorialService.updateTutorial(id, payload);
      success(`Tutorial "${updated.title}" updated successfully!`, 'Saved');
      navigate(ROUTES.ADMIN_TUTORIALS);
    } catch (err: any) {
      toastError(err.message || 'Failed to update tutorial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await adminTutorialService.deleteTutorial(id);
      success('Tutorial deleted successfully');
      navigate(ROUTES.ADMIN_TUTORIALS);
    } catch (err: any) {
      toastError(err.message || 'Failed to delete tutorial');
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3 font-sans">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading tutorial data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={ROUTES.ADMIN_TUTORIALS}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Tutorials
            </Button>
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Edit Chapter</span>
        </div>

        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Delete Chapter
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>1. Tutorial Track & Classification</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Learning Track / Subject *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomTrack(!isCustomTrack)}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isCustomTrack ? '← Select Standard' : '+ Add New Subject'}
                  </button>
                </div>
                {isCustomTrack ? (
                  <Input
                    value={customTrackInput}
                    onChange={(e) => setCustomTrackInput(e.target.value)}
                    placeholder="e.g. rust, golang, flutter, web3"
                    className="text-sm font-mono"
                    required
                  />
                ) : (
                  <select
                    {...register('track')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 focus:outline-none focus:border-emerald-500"
                  >
                    {trackOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Section / Module Group *
                </label>
                <Input
                  {...register('sectionTitle')}
                  placeholder="e.g. Deep Learning Architecture"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  {...register('level')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chapter Title *
                </label>
                <Input
                  {...register('title')}
                  placeholder="e.g. Transformer Architecture & Attention Mechanism"
                  error={errors.title?.message}
                  className="text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Tag *
                </label>
                <Input
                  {...register('category')}
                  placeholder="e.g. Artificial Intelligence"
                  error={errors.category?.message}
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chapter Summary / Excerpt *
              </label>
              <textarea
                {...register('excerpt')}
                rows={2}
                placeholder="Short summary displayed in the header and topic previews..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 focus:outline-none focus:border-emerald-500"
              />
              {errors.excerpt && <p className="text-xs text-rose-500 mt-1">{errors.excerpt.message}</p>}
            </div>

            {/* Quick Facts Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-dark-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>⚡ Quick Facts (Right Sidebar Widget • Max 200 words)</span>
                </label>
                <span
                  className={cn(
                    'text-[11px] font-mono font-bold px-2 py-0.5 rounded-md',
                    quickFactsWordCount > 200
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-slate-400'
                  )}
                >
                  {quickFactsWordCount} / 200 words ({watchQuickFacts.length} chars)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Displayed in the top-right sidebar "Quick Facts" card when students read this chapter. Highlight essential pointers, key syntax rules, or core takeaways.
              </p>
              <textarea
                {...register('quickFacts')}
                rows={3}
                placeholder="e.g. Learn C++ pointers, RAII, std::unique_ptr & shared_ptr, STL algorithms, memory layouts, Move Semantics, and Game Engine architecture."
                className={cn(
                  'w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-dark-900 focus:outline-none transition-colors leading-relaxed',
                  quickFactsWordCount > 200
                    ? 'border-rose-500 focus:border-rose-500 text-rose-900 dark:text-rose-100'
                    : 'border-slate-200 dark:border-dark-800 focus:border-emerald-500'
                )}
              />
              {quickFactsWordCount > 200 && (
                <p className="text-xs text-rose-500 font-medium">
                  ⚠️ Quick Facts exceeds 200 words ({quickFactsWordCount} words). Please condense the text for optimal sidebar display.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Attached Architecture Diagram / Illustration Image */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-500" />
              <span>2. Attach Architecture Diagram / Illustration Image</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Attach a high-resolution workflow diagram (e.g. Neural Net flowchart, Docker lifecycle, Database schema, System Design blueprint) that renders directly in the student's tutorial body.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Diagram / Infographic Image URL
              </label>
              <Input
                {...register('diagramImageUrl')}
                placeholder="https://example.com/images/neural-net-diagram.png"
                className="text-sm font-mono"
              />
            </div>

            {/* Live Diagram Image Preview */}
            {watchDiagramUrl && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">
                  Diagram Live Preview
                </span>
                <div className="max-h-64 overflow-hidden rounded-lg border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 flex items-center justify-center p-2">
                  <img
                    src={watchDiagramUrl}
                    alt="Tutorial Diagram Preview"
                    className="max-h-60 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Key Points & Highlights (Interview Takeaways) */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>3. Key Concept Takeaways (1 point per line)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <textarea
              {...register('keyPointsText')}
              rows={4}
              placeholder="Enter one key point per line:&#10;• Point 1: Fundamental concept&#10;• Point 2: Interview formula&#10;• Point 3: Best practice"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 font-mono focus:outline-none focus:border-emerald-500"
            />
          </CardContent>
        </Card>

        {/* 4. Detailed Tutorial Content (Markdown) */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>4. Full Chapter Content & Explanation (Markdown)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <textarea
              {...register('content')}
              rows={10}
              placeholder="Write detailed documentation, formulas, architecture breakdown, and engineering insights..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 font-mono focus:outline-none focus:border-emerald-500"
            />
            {errors.content && <p className="text-xs text-rose-500 mt-1">{errors.content.message}</p>}
          </CardContent>
        </Card>

        {/* 5. In-Page Code Snippet & Runner */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" />
              <span>5. Interactive Code Snippet & Console Output</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Programming Language
                </label>
                <select
                  {...register('codeLanguage')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="sql">SQL</option>
                  <option value="dockerfile">Dockerfile</option>
                  <option value="bash">Bash / Linux</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Filename Badge
                </label>
                <Input
                  {...register('codeFilename')}
                  placeholder="e.g. main.py, model.ts"
                  className="text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Code Snippet Text
              </label>
              <textarea
                {...register('codeSnippetText')}
                rows={7}
                placeholder="def execute(): ... Code here"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-dark-800 bg-[#0d1117] text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Console Terminal Output
              </label>
              <textarea
                {...register('codeOutputText')}
                rows={3}
                placeholder="[Execution Output] Process finished with exit code 0..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-dark-800 bg-[#090d13] text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* 6. Interactive Checkpoint Quiz */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>6. Interactive Checkpoint Quiz (Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quiz Question
              </label>
              <Input
                {...register('quizQuestion')}
                placeholder="e.g. Which of the following is true about Python memory management?"
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Option A (Index 0)</label>
                <Input {...register('quizOption1')} placeholder="Option A text" className="text-xs" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Option B (Index 1)</label>
                <Input {...register('quizOption2')} placeholder="Option B text" className="text-xs" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Option C (Index 2)</label>
                <Input {...register('quizOption3')} placeholder="Option C text" className="text-xs" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Option D (Index 3)</label>
                <Input {...register('quizOption4')} placeholder="Option D text" className="text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correct Option
                </label>
                <select
                  {...register('quizCorrectIndex', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value={0}>Option A (Index 0)</option>
                  <option value={1}>Option B (Index 1)</option>
                  <option value={2}>Option C (Index 2)</option>
                  <option value={3}>Option D (Index 3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Answer Explanation
                </label>
                <Input
                  {...register('quizExplanation')}
                  placeholder="Explanation shown when student checks answer..."
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Publishing Options & Actions */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('isPublished')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Published Status</span>
              <p className="text-xs text-slate-500">Live on /tutorials for all students</p>
            </div>
          </label>

          <div className="flex items-center gap-3">
            <Link to={ROUTES.ADMIN_TUTORIALS}>
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {submitting ? 'Saving Changes...' : 'Update Chapter'}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Chapter"
        description="Are you sure you want to permanently delete this tutorial chapter? This action cannot be undone."
      />
    </div>
  );
};
