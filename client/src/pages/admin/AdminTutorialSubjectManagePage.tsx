import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminTutorialService, ITutorialSubject } from '../../services/adminTutorial.service';
import { ROUTES } from '../../constants/routes';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  ImageIcon,
  Code2,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Settings,
  X,
  Eye,
  Save,
  Upload,
  Zap,
  Sparkles,
} from 'lucide-react';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { ManageChapterQuizzesModal } from '../../components/admin/ManageChapterQuizzesModal';
import { InsertSliderModal } from '../../components/admin/InsertSliderModal';
import { TutorialContentRenderer } from '../../components/tutorials/TutorialContentRenderer';
import { cn } from '../../utils/cn';

export const AdminTutorialSubjectManagePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { success, error: toastError } = useToast();

  const [subject, setSubject] = useState<ITutorialSubject | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal states
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [editSubjectModalOpen, setEditSubjectModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedQuizTarget, setSelectedQuizTarget] = useState<{ trackId?: string; chapterId?: string } | null>(null);

  // Chapter form state
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'media' | 'interactive'>('basic');
  const [savingChapter, setSavingChapter] = useState(false);
  const [chapterForm, setChapterForm] = useState({
    title: '',
    slug: '',
    sectionTitle: 'Fundamentals',
    level: 'Beginner',
    readingTime: 5,
    excerpt: '',
    quickFacts: '',
    diagramImageUrl: '',
    thumbnail: '',
    keyPointsText: '',
    content: '',
    codeLanguage: 'python',
    codeFilename: 'main.py',
    codeSnippetText: '',
    codeOutputText: '',
    quizQuestion: '',
    quizOption1: '',
    quizOption2: '',
    quizOption3: '',
    quizOption4: '',
    quizCorrectIndex: 0,
    quizExplanation: '',
    practiceProblemLink: '',
    isPublished: true,
  });

  // Edit subject state
  const [subjectForm, setSubjectForm] = useState({
    title: '',
    shortTitle: '',
    category: '',
    description: '',
    isPublished: true,
  });
  const [savingSubject, setSavingSubject] = useState(false);

  // Rich Content & Slider Modal states
  const [sliderModalOpen, setSliderModalOpen] = useState(false);
  const [contentViewMode, setContentViewMode] = useState<'edit' | 'preview'>('edit');
  const diagramFileRef = React.useRef<HTMLInputElement>(null);
  const thumbnailFileRef = React.useRef<HTMLInputElement>(null);
  const singleImageFileRef = React.useRef<HTMLInputElement>(null);

  const handleDiagramFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toastError('File size exceeds 8MB limit. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setChapterForm((prev) => ({ ...prev, diagramImageUrl: ev.target!.result as string }));
        success(`Diagram "${file.name}" uploaded from device!`, 'Uploaded');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toastError('File size exceeds 8MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setChapterForm((prev) => ({ ...prev, thumbnail: ev.target!.result as string }));
        success(`Thumbnail "${file.name}" uploaded from device!`, 'Uploaded');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSingleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toastError('File size exceeds 8MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const dataUrl = ev.target.result as string;
        const cap = file.name.replace(/\.[^/.]+$/, '');
        const snippet = `\n![${cap}](${dataUrl})\n`;
        setChapterForm((prev) => ({ ...prev, content: prev.content + snippet }));
        success(`Image "${file.name}" inserted into chapter content!`, 'Uploaded');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInsertQuickFact = () => {
    const snippet = `\n:::quickfact\n**Quick Fact**: Enter key revision insight or performance rule here.\n:::\n`;
    setChapterForm((prev) => ({ ...prev, content: prev.content + snippet }));
    success('Quick Fact box template inserted', 'Inserted');
  };

  const handleInsertKeyPoints = () => {
    const snippet = `\n:::keypoints\n- Critical interview principle or rule\n- Architectural trade-off (e.g. latency vs consistency)\n- Common production pitfall to avoid\n:::\n`;
    setChapterForm((prev) => ({ ...prev, content: prev.content + snippet }));
    success('Key Takeaways block template inserted', 'Inserted');
  };

  const handleInsertCodeSnippet = () => {
    const sSlug = (subject?.slug || '').toLowerCase();
    let lang = 'javascript';
    let codeBody = '// Implementation example\nfunction exampleWorkflow() {\n  return "Demonstration code";\n}';

    if (sSlug === 'html') {
      lang = 'html';
      codeBody = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>HTML5 Demo</title>\n</head>\n<body>\n  <h1>Welcome to NextEra HTML</h1>\n  <p>Semantic web elements in action.</p>\n</body>\n</html>';
    } else if (sSlug === 'css') {
      lang = 'css';
      codeBody = '/* Modern Responsive Styles */\n.hero-card {\n  display: flex;\n  flex-direction: column;\n  background: #1e1e2e;\n  color: #ffffff;\n  border-radius: 12px;\n  padding: 24px;\n}';
    } else if (sSlug === 'python') {
      lang = 'python';
      codeBody = '# Python Implementation\ndef run_demo():\n    print("Welcome to NextEra Python!")\n\nif __name__ == "__main__":\n    run_demo()';
    } else if (sSlug === 'cpp' || sSlug === 'c++') {
      lang = 'cpp';
      codeBody = '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Welcome to NextEra C++!" << endl;\n    return 0;\n}';
    } else if (sSlug === 'c') {
      lang = 'c';
      codeBody = '#include <stdio.h>\n\nint main() {\n    printf("Welcome to NextEra C!\\n");\n    return 0;\n}';
    } else if (sSlug === 'java') {
      lang = 'java';
      codeBody = 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Welcome to NextEra Java!");\n    }\n}';
    } else if (sSlug === 'sql') {
      lang = 'sql';
      codeBody = 'SELECT id, name, department, salary\nFROM employees\nWHERE status = \'active\'\nORDER BY salary DESC;';
    } else if (sSlug === 'typescript' || sSlug === 'ts') {
      lang = 'typescript';
      codeBody = 'interface User {\n  id: string;\n  name: string;\n}\n\nconst greet = (u: User): string => `Hello ${u.name}!`;';
    }

    const snippet = `\n\`\`\`${lang}\n${codeBody}\n\`\`\`\n`;
    setChapterForm((prev) => ({ ...prev, content: prev.content + snippet }));
    success(`${lang.toUpperCase()} code snippet template inserted`, 'Inserted');
  };


  useDocumentTitle(
    subject ? `${subject.title} — Chapters Management` : 'Subject Chapters — Admin'
  );

  const fetchSubjectData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminTutorialService.getSubjectBySlug(slug);
      setSubject(data.subject);
      setChapters(data.chapters || []);
      setSubjectForm({
        title: data.subject.title,
        shortTitle: data.subject.shortTitle || data.subject.title,
        category: data.subject.category || 'Core Computer Science',
        description: data.subject.description || '',
        isPublished: data.subject.isPublished,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load subject chapters');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchSubjectData();
  }, [fetchSubjectData]);

  // Open modal to add a brand new chapter
  const handleOpenAddChapter = () => {
    setEditingChapter(null);
    setChapterForm({
      title: '',
      slug: '',
      sectionTitle: 'Fundamentals',
      level: 'Beginner',
      readingTime: 6,
      excerpt: '',
      quickFacts: '',
      diagramImageUrl: '',
      thumbnail: '',
      keyPointsText: '',
      content: `### Overview\n\nIn this chapter, we explore foundational concepts, architectures, and practical industry workflows.\n\n### Key Principles\n\n1. Core architectural foundations\n2. Implementation details and performance trade-offs\n3. Real-world engineering patterns`,
      codeLanguage: slug === 'dbms' || slug === 'sql' ? 'sql' : slug === 'react' || slug === 'javascript' ? 'javascript' : slug === 'java' ? 'java' : slug === 'cpp' ? 'cpp' : slug === 'c' ? 'c' : 'python',
      codeFilename: slug === 'dbms' || slug === 'sql' ? 'query.sql' : slug === 'react' ? 'App.jsx' : slug === 'javascript' ? 'index.js' : slug === 'java' ? 'Main.java' : slug === 'cpp' ? 'main.cpp' : slug === 'c' ? 'main.c' : 'solution.py',
      codeSnippetText: '',
      codeOutputText: '',
      quizQuestion: '',
      quizOption1: '',
      quizOption2: '',
      quizOption3: '',
      quizOption4: '',
      quizCorrectIndex: 0,
      quizExplanation: '',
      practiceProblemLink: '',
      isPublished: true,
    });
    setActiveTab('basic');
    setChapterModalOpen(true);
  };

  // Open modal to edit existing chapter
  const handleOpenEditChapter = (chap: any) => {
    setEditingChapter(chap);
    setChapterForm({
      title: chap.title || '',
      slug: chap.slug || '',
      sectionTitle: chap.sectionTitle || 'Fundamentals',
      level: chap.level || 'Beginner',
      readingTime: chap.readingTime || 5,
      excerpt: chap.excerpt || '',
      quickFacts: chap.quickFacts || '',
      diagramImageUrl: chap.diagramImageUrl || '',
      thumbnail: chap.thumbnail || '',
      keyPointsText: Array.isArray(chap.keyPoints) ? chap.keyPoints.join('\n') : '',
      content: chap.content || '',
      codeLanguage: chap.codeSnippet?.language || 'python',
      codeFilename: chap.codeSnippet?.filename || 'main.py',
      codeSnippetText: chap.codeSnippet?.code || '',
      codeOutputText: chap.codeSnippet?.output || '',
      quizQuestion: chap.quiz?.question || '',
      quizOption1: chap.quiz?.options?.[0] || '',
      quizOption2: chap.quiz?.options?.[1] || '',
      quizOption3: chap.quiz?.options?.[2] || '',
      quizOption4: chap.quiz?.options?.[3] || '',
      quizCorrectIndex: chap.quiz?.correctAnswerIndex ?? 0,
      quizExplanation: chap.quiz?.explanation || '',
      practiceProblemLink: chap.practiceProblemLink || '',
      isPublished: chap.isPublished !== false,
    });
    setActiveTab('basic');
    setChapterModalOpen(true);
  };

  // Save chapter (create or update)
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;

    if (!chapterForm.title.trim()) {
      toastError('Chapter Title is required');
      return;
    }

    if (!chapterForm.excerpt.trim()) {
      toastError('Excerpt / description is required');
      return;
    }

    if (!chapterForm.content.trim()) {
      toastError('Documentation Content is required');
      return;
    }

    try {
      setSavingChapter(true);

      const keyPoints = chapterForm.keyPointsText
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const hasQuiz = Boolean(
        chapterForm.quizQuestion &&
        chapterForm.quizOption1 &&
        chapterForm.quizOption2
      );

      const quizData = hasQuiz
        ? {
            question: chapterForm.quizQuestion.trim(),
            options: [
              chapterForm.quizOption1.trim(),
              chapterForm.quizOption2.trim(),
              chapterForm.quizOption3.trim() || 'Option C',
              chapterForm.quizOption4.trim() || 'Option D',
            ],
            correctAnswerIndex: chapterForm.quizCorrectIndex,
            explanation: chapterForm.quizExplanation.trim(),
          }
        : undefined;

      const codeSnippetData = chapterForm.codeSnippetText.trim()
        ? {
            language: chapterForm.codeLanguage,
            filename: chapterForm.codeFilename.trim() || 'main.py',
            code: chapterForm.codeSnippetText,
            output: chapterForm.codeOutputText.trim() || undefined,
          }
        : undefined;

      const payload: any = {
        title: chapterForm.title.trim(),
        slug: chapterForm.slug.trim() || undefined,
        track: subject.slug,
        sectionTitle: chapterForm.sectionTitle.trim() || 'Fundamentals',
        category: subject.category || 'Core Computer Science',
        level: chapterForm.level,
        readingTime: Number(chapterForm.readingTime) || 5,
        excerpt: chapterForm.excerpt.trim(),
        quickFacts: chapterForm.quickFacts.trim() || chapterForm.excerpt.trim(),
        diagramImageUrl: chapterForm.diagramImageUrl.trim() || undefined,
        thumbnail: chapterForm.thumbnail.trim() || undefined,
        keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
        content: chapterForm.content,
        codeSnippet: codeSnippetData,
        quiz: quizData,
        practiceProblemLink: chapterForm.practiceProblemLink.trim() || undefined,
        isPublished: chapterForm.isPublished,
      };

      if (editingChapter) {
        await adminTutorialService.updateTutorial(editingChapter.id || editingChapter._id, payload);
        success(`Chapter "${chapterForm.title}" updated successfully`, 'Updated');
      } else {
        await adminTutorialService.createTutorial(payload);
        success(`New chapter "${chapterForm.title}" added to ${subject.title}`, 'Created');
      }

      setChapterModalOpen(false);
      fetchSubjectData();
    } catch (err: any) {
      toastError(err.message || 'Failed to save chapter');
    } finally {
      setSavingChapter(false);
    }
  };

  // Toggle publish chapter
  const handleTogglePublishChapter = async (chap: any) => {
    try {
      const id = chap.id || chap._id;
      if (chap.isPublished) {
        await adminTutorialService.unpublishTutorial(id);
        success(`Chapter "${chap.title}" moved to Drafts`, 'Status Updated');
      } else {
        await adminTutorialService.publishTutorial(id);
        success(`Chapter "${chap.title}" published!`, 'Status Updated');
      }
      fetchSubjectData();
    } catch (err: any) {
      toastError(err.message || 'Failed to update publish status');
    }
  };

  // Delete chapter
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const id = deleteTarget.id || deleteTarget._id;
      await adminTutorialService.deleteTutorial(id);
      success(`Chapter "${deleteTarget.title}" deleted`, 'Deleted');
      setDeleteTarget(null);
      fetchSubjectData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete chapter');
    }
  };

  // Save subject details edit
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    try {
      setSavingSubject(true);
      await adminTutorialService.updateSubject(slug, subjectForm);
      success('Subject details updated successfully', 'Saved');
      setEditSubjectModalOpen(false);
      fetchSubjectData();
    } catch (err: any) {
      toastError(err.message || 'Failed to update subject');
    } finally {
      setSavingSubject(false);
    }
  };

  // Filter chapters
  const filteredChapters = chapters.filter((ch) => {
    if (statusFilter === 'published' && !ch.isPublished) return false;
    if (statusFilter === 'draft' && ch.isPublished) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = (ch.title || '').toLowerCase().includes(q);
      const matchSlug = (ch.slug || '').toLowerCase().includes(q);
      const matchSec = (ch.sectionTitle || '').toLowerCase().includes(q);
      return matchTitle || matchSlug || matchSec;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Back button */}
      <div>
        <Link
          to={ROUTES.ADMIN_TUTORIALS}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Subjects</span>
        </Link>
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Error Loading Subject" message={error} onRetry={fetchSubjectData} />
      )}

      {!loading && !error && subject && (
        <>
          {/* Subject Header Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {subject.title}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-700 uppercase">
                    {subject.slug}
                  </span>
                  <Badge variant={subject.isPublished ? 'success' : 'default'} size="sm">
                    {subject.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  {subject.description || `Manage chapters, interactive code runners, architecture diagrams, and assessment quizzes for ${subject.title}.`}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs font-mono text-slate-400">
                  <span>Category: <strong className="text-slate-700 dark:text-slate-300 font-sans">{subject.category}</strong></span>
                  <span>•</span>
                  <Link
                    to={`/tutorials?track=${subject.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSubjectModalOpen(true)}
                leftIcon={<Settings className="w-3.5 h-3.5" />}
                className="text-xs font-semibold"
              >
                Edit Subject Details
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleOpenAddChapter}
                leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20"
              >
                + Add Chapter
              </Button>
            </div>
          </div>

          {/* Chapters Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search chapters in this subject..."
                leftIcon={<Search className="w-4 h-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Chapters ({chapters.length})</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
              </select>
            </div>
          </div>

          {/* Empty State */}
          {filteredChapters.length === 0 && (
            <EmptyState
              title={`No Chapters Found for ${subject.title}`}
              description="Click '+ Add Chapter' above to write full documentation, attach visual diagrams, and include interactive code runners."
              actionLabel="+ Add First Chapter"
              onAction={handleOpenAddChapter}
            />
          )}

          {/* Chapters Table */}
          {filteredChapters.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-850/40 text-slate-400 font-mono">
                      <th className="py-3.5 px-4">Chapter Title & Slug</th>
                      <th className="py-3.5 px-4">Section Group</th>
                      <th className="py-3.5 px-4">Visual Diagram</th>
                      <th className="py-3.5 px-4">Code Runner</th>
                      <th className="py-3.5 px-4">Quiz Assessment</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                    {filteredChapters.map((chap) => (
                      <tr
                        key={chap.id || chap._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-dark-850/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {chap.title}
                            </p>
                            <span className="text-[11px] text-slate-400 font-mono">
                              /tutorials?track={subject.slug}&chapter={chap.slug}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <span className="font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-[11px]">
                            {chap.sectionTitle || 'Fundamentals'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {chap.diagramImageUrl ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                              <ImageIcon className="w-3 h-3" />
                              <span>Attached</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {chap.codeSnippet?.code ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                              <Code2 className="w-3 h-3" />
                              <span>{chap.codeSnippet.language || 'code'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {chap.quiz?.question ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Ready</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleTogglePublishChapter(chap)}
                            className="cursor-pointer"
                            title="Click to toggle publish status"
                          >
                            <Badge variant={chap.isPublished ? 'success' : 'default'} size="sm">
                              {chap.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQuizTarget({ trackId: subject.slug, chapterId: chap.slug || chap.id });
                                setQuizModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              title="Configure 10-Question Chapter Assessment & Timer"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              to={`/tutorials?track=${subject.slug}&chapter=${chap.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                              title="Preview in Student View"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleOpenEditChapter(chap)}
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              title="Edit Chapter"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(chap)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Chapter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT CHAPTER MODAL WITH FULL RICH OPTIONS          */}
      {/* ======================================================== */}
      {chapterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-slate-50/70 dark:bg-dark-850/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {editingChapter ? `Edit Chapter: ${editingChapter.title}` : `+ Add Chapter to ${subject?.title}`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Subject Track: <strong className="text-emerald-600">{subject?.slug}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={ROUTES.ADMIN_TUTORIALS_NEW}
                  target="_blank"
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white underline mr-2"
                >
                  <span>Open Full-Page Form</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => setChapterModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-100 dark:border-dark-800 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'basic'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                1. Basic Info & Section
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'content'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                2. Documentation & Key Points
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'media'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                3. Architecture Diagram
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('interactive')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'interactive'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                4. Code Runner & Quiz
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveChapter} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Chapter Title *
                      </label>
                      <Input
                        placeholder="e.g. Relational Data Model & ER Diagrams"
                        value={chapterForm.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          const autoSlug = val
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/[\s_-]+/g, '-')
                            .replace(/^-+|-+$/g, '');
                          setChapterForm((prev) => ({
                            ...prev,
                            title: val,
                            ...(!editingChapter && { slug: autoSlug }),
                          }));
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        URL Slug
                      </label>
                      <Input
                        placeholder="e.g. relational-data-model"
                        value={chapterForm.slug}
                        onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })}
                      />
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        Will be accessible at /tutorials?track={subject?.slug}&chapter={chapterForm.slug || 'slug'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Section / Topic Group *
                      </label>
                      <Input
                        placeholder="e.g. Relational Model, Indexing, ACID"
                        value={chapterForm.sectionTitle}
                        onChange={(e) => setChapterForm({ ...chapterForm, sectionTitle: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={chapterForm.level}
                        onChange={(e) => setChapterForm({ ...chapterForm, level: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="All Levels">All Levels</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Estimated Reading Time (mins)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={chapterForm.readingTime}
                        onChange={(e) => setChapterForm({ ...chapterForm, readingTime: Number(e.target.value) || 5 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Short Excerpt / Summary *
                    </label>
                    <textarea
                      rows={2}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                      placeholder="Brief overview explaining what students will master in this chapter..."
                      value={chapterForm.excerpt}
                      onChange={(e) => setChapterForm({ ...chapterForm, excerpt: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-dark-850/60 border border-slate-200/80 dark:border-dark-800">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        Publish Chapter
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        When enabled, students will see this chapter in the documentation portal immediately.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chapterForm.isPublished}
                        onChange={(e) => setChapterForm({ ...chapterForm, isPublished: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT & HIGHLIGHTS */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Quick Facts / Executive TL;DR
                    </label>
                    <Input
                      placeholder="High-yield key takeaways for quick revision..."
                      value={chapterForm.quickFacts}
                      onChange={(e) => setChapterForm({ ...chapterForm, quickFacts: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Key Points & Bullet Highlights (One per line)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
                      placeholder="ACID properties guarantee reliability across distributed writes&#10;B-Trees maintain log(N) lookup efficiency for disk blocks&#10;Foreign keys enforce referential integrity across schemas"
                      value={chapterForm.keyPointsText}
                      onChange={(e) => setChapterForm({ ...chapterForm, keyPointsText: e.target.value })}
                    />
                  </div>

                  {/* Smart Content Section with Toolbar & Live Preview Toggle */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Full Chapter Content (Markdown, Sliders & Highlights) *
                        </label>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex items-center rounded-lg bg-slate-100 dark:bg-dark-800 p-0.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setContentViewMode('edit')}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                            contentViewMode === 'edit'
                              ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                          )}
                        >
                          ✏️ Edit Content
                        </button>
                        <button
                          type="button"
                          onClick={() => setContentViewMode('preview')}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1',
                            contentViewMode === 'preview'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                          )}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Interactive Preview</span>
                        </button>
                      </div>
                    </div>

                    {/* Rich Formatting Toolbar */}
                    {contentViewMode === 'edit' && (
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-mono text-slate-400 font-bold mr-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-500" /> Insert:
                        </span>

                        {/* Insert 2-Image Slider Button */}
                        <button
                          type="button"
                          onClick={() => setSliderModalOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Insert interactive multi-image comparison slider"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>+ 2-Image Slider</span>
                        </button>

                        {/* Insert Quick Fact Button */}
                        <button
                          type="button"
                          onClick={handleInsertQuickFact}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Insert highlighted quick fact callout box"
                        >
                          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>+ Quick Fact</span>
                        </button>

                        {/* Insert Key Points Button */}
                        <button
                          type="button"
                          onClick={handleInsertKeyPoints}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Insert key points and takeaways checklist"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>+ Key Takeaways</span>
                        </button>

                        {/* Upload Single Image from Device */}
                        <button
                          type="button"
                          onClick={() => singleImageFileRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Upload image from device and insert into content"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>+ Device Image</span>
                        </button>

                        {/* Insert Code Block */}
                        <button
                          type="button"
                          onClick={handleInsertCodeSnippet}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Insert code block"
                        >
                          <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>+ Code Block</span>
                        </button>
                      </div>
                    )}

                    {contentViewMode === 'edit' ? (
                      <textarea
                        rows={12}
                        className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none leading-relaxed"
                        placeholder="### Architecture Overview&#10;&#10;Explain the concepts here in detail with headings, diagrams, and math formulas..."
                        value={chapterForm.content}
                        onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                        required
                      />
                    ) : (
                      <div className="p-4 rounded-xl border border-purple-200 dark:border-dark-800 bg-white dark:bg-dark-900 min-h-[280px] max-h-[460px] overflow-y-auto">
                        <div className="mb-3 pb-2 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 font-semibold">
                          <span>Live Interactive Preview (Exact student view):</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 font-bold">PREVIEW MODE</span>
                        </div>
                        <TutorialContentRenderer content={chapterForm.content} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: VISUAL DIAGRAM */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Architecture / Visual Diagram Image
                    </label>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <button
                        type="button"
                        onClick={() => diagramFileRef.current?.click()}
                        className="px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload from Device</span>
                      </button>

                      <div className="relative flex-1">
                        <Input
                          placeholder="Or paste public image / CDN URL (https://...)"
                          value={
                            chapterForm.diagramImageUrl.startsWith('data:image')
                              ? '[Device Image Uploaded]'
                              : chapterForm.diagramImageUrl
                          }
                          onChange={(e) => {
                            if (!chapterForm.diagramImageUrl.startsWith('data:image')) {
                              setChapterForm({ ...chapterForm, diagramImageUrl: e.target.value });
                            }
                          }}
                          readOnly={chapterForm.diagramImageUrl.startsWith('data:image')}
                          className="pr-8 text-xs"
                        />
                        {chapterForm.diagramImageUrl && (
                          <button
                            type="button"
                            onClick={() => setChapterForm({ ...chapterForm, diagramImageUrl: '' })}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Clear image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Upload from your phone/laptop or paste any public URL. Attaching a visual architecture diagram helps students quickly comprehend complex concepts.
                    </span>
                  </div>

                  {chapterForm.diagramImageUrl ? (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-850">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-purple-500" />
                          <span>Live Diagram Preview:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setChapterForm({ ...chapterForm, diagramImageUrl: '' })}
                          className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-dark-700 max-h-64 flex items-center justify-center bg-black/5 p-2">
                        <img
                          src={chapterForm.diagramImageUrl}
                          alt="Diagram Preview"
                          className="max-h-60 object-contain rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/800x400?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => diagramFileRef.current?.click()}
                      className="p-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-dark-800 hover:border-purple-400 dark:hover:border-purple-600 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-dark-850/40"
                    >
                      <Upload className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to Upload Diagram from Device</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WebP, SVG (up to 8MB)</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Optional Card Thumbnail Image
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <button
                        type="button"
                        onClick={() => thumbnailFileRef.current?.click()}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Thumbnail</span>
                      </button>
                      <div className="relative flex-1">
                        <Input
                          placeholder="Or paste thumbnail URL for social cards / list views"
                          value={
                            chapterForm.thumbnail.startsWith('data:image')
                              ? '[Device Image Uploaded]'
                              : chapterForm.thumbnail
                          }
                          onChange={(e) => {
                            if (!chapterForm.thumbnail.startsWith('data:image')) {
                              setChapterForm({ ...chapterForm, thumbnail: e.target.value });
                            }
                          }}
                          readOnly={chapterForm.thumbnail.startsWith('data:image')}
                          className="pr-8 text-xs"
                        />
                        {chapterForm.thumbnail && (
                          <button
                            type="button"
                            onClick={() => setChapterForm({ ...chapterForm, thumbnail: '' })}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Clear thumbnail"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CODE RUNNER & QUIZ */}
              {activeTab === 'interactive' && (
                <div className="space-y-5">
                  {/* Code Runner Section */}
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                      <Code2 className="w-4 h-4" />
                      <span>Interactive In-Browser Code Runner</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Programming Language
                        </label>
                        <select
                          value={chapterForm.codeLanguage}
                          onChange={(e) => setChapterForm({ ...chapterForm, codeLanguage: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="python">Python 3</option>
                          <option value="javascript">JavaScript / Node</option>
                          <option value="sql">SQL / Postgres</option>
                          <option value="cpp">C++ 20</option>
                          <option value="c">C Language</option>
                          <option value="java">Java 21</option>
                          <option value="go">Go</option>
                          <option value="rust">Rust</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Filename
                        </label>
                        <Input
                          placeholder="e.g. index.js or solution.py"
                          value={chapterForm.codeFilename}
                          onChange={(e) => setChapterForm({ ...chapterForm, codeFilename: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Starter Code (Editable by students in browser)
                      </label>
                      <textarea
                        rows={6}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-none"
                        placeholder="# Write starter code here..."
                        value={chapterForm.codeSnippetText}
                        onChange={(e) => setChapterForm({ ...chapterForm, codeSnippetText: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Expected Terminal Output
                      </label>
                      <Input
                        placeholder="Expected console output after running..."
                        value={chapterForm.codeOutputText}
                        onChange={(e) => setChapterForm({ ...chapterForm, codeOutputText: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Assessment Quiz Section */}
                  <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-50/20 dark:bg-teal-950/10 space-y-3">
                    <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-xs">
                      <HelpCircle className="w-4 h-4" />
                      <span>Chapter Comprehension Assessment Question</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Quiz Question
                      </label>
                      <Input
                        placeholder="e.g. Which ACID property guarantees that all database updates in a transaction commit together?"
                        value={chapterForm.quizQuestion}
                        onChange={(e) => setChapterForm({ ...chapterForm, quizQuestion: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Option 1</label>
                        <Input
                          placeholder="e.g. Atomicity"
                          value={chapterForm.quizOption1}
                          onChange={(e) => setChapterForm({ ...chapterForm, quizOption1: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Option 2</label>
                        <Input
                          placeholder="e.g. Consistency"
                          value={chapterForm.quizOption2}
                          onChange={(e) => setChapterForm({ ...chapterForm, quizOption2: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Option 3</label>
                        <Input
                          placeholder="e.g. Isolation"
                          value={chapterForm.quizOption3}
                          onChange={(e) => setChapterForm({ ...chapterForm, quizOption3: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Option 4</label>
                        <Input
                          placeholder="e.g. Durability"
                          value={chapterForm.quizOption4}
                          onChange={(e) => setChapterForm({ ...chapterForm, quizOption4: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Correct Option Index
                        </label>
                        <select
                          value={chapterForm.quizCorrectIndex}
                          onChange={(e) => setChapterForm({ ...chapterForm, quizCorrectIndex: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value={0}>Option 1 is Correct</option>
                          <option value={1}>Option 2 is Correct</option>
                          <option value={2}>Option 3 is Correct</option>
                          <option value={3}>Option 4 is Correct</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Explanation on Submit
                        </label>
                        <Input
                          placeholder="Why this option is correct..."
                          value={chapterForm.quizExplanation}
                          onChange={(e) => setChapterForm({ ...chapterForm, quizExplanation: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Practice Problem Link */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Related Practice Problem Link
                    </label>
                    <Input
                      placeholder="e.g. /problems/two-sum or external practice URL"
                      value={chapterForm.practiceProblemLink}
                      onChange={(e) => setChapterForm({ ...chapterForm, practiceProblemLink: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setChapterModalOpen(false)}
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  {activeTab !== 'interactive' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (activeTab === 'basic') setActiveTab('content');
                        else if (activeTab === 'content') setActiveTab('media');
                        else if (activeTab === 'media') setActiveTab('interactive');
                      }}
                    >
                      Next Step →
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={savingChapter}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
                  >
                    {editingChapter ? 'Save Chapter Changes' : 'Create Chapter Now'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Multi-Image Slider Modal */}
      <InsertSliderModal
        isOpen={sliderModalOpen}
        onClose={() => setSliderModalOpen(false)}
        onInsert={(snippet) => {
          setChapterForm((prev) => ({ ...prev, content: prev.content + snippet }));
          success('2-Image Slider inserted into content!', 'Inserted');
        }}
      />

      {/* Hidden file inputs for device uploads */}
      <input
        type="file"
        ref={diagramFileRef}
        onChange={handleDiagramFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={thumbnailFileRef}
        onChange={handleThumbnailFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={singleImageFileRef}
        onChange={handleSingleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* ======================================================== */}
      {/* EDIT SUBJECT DETAILS MODAL                               */}
      {/* ======================================================== */}
      {editSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>Edit Subject Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Subject Title *
                </label>
                <Input
                  value={subjectForm.title}
                  onChange={(e) => setSubjectForm({ ...subjectForm, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Short Title / Display Name
                </label>
                <Input
                  value={subjectForm.shortTitle}
                  onChange={(e) => setSubjectForm({ ...subjectForm, shortTitle: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Category
                </label>
                <select
                  value={subjectForm.category}
                  onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Core Computer Science">Core Computer Science & GATE</option>
                  <option value="Core Languages">Core Languages & Systems</option>
                  <option value="Cloud & Infrastructure">Cloud, DevOps & System Design</option>
                  <option value="Web & Full-Stack">Web & Full-Stack Development</option>
                  <option value="AI & Machine Learning">AI, Data Science & GenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Published Status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subjectForm.isPublished}
                    onChange={(e) => setSubjectForm({ ...subjectForm, isPublished: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditSubjectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingSubject}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Save Subject Details
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Chapter"
        itemName={deleteTarget?.title}
        description="Are you sure you want to permanently delete this chapter from this subject? This action cannot be undone."
      />

      {/* Chapter Quiz Assessment Modal */}
      <ManageChapterQuizzesModal
        isOpen={quizModalOpen}
        onClose={() => {
          setQuizModalOpen(false);
          setSelectedQuizTarget(null);
        }}
        initialTrackId={selectedQuizTarget?.trackId}
        initialChapterId={selectedQuizTarget?.chapterId}
        onSaved={fetchSubjectData}
      />
    </div>
  );
};
