import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  TUTORIAL_TRACKS,
  ITutorialTrack,
  ITutorialChapter,
} from '../../data/tutorialDocumentation';
import { ROUTES } from '../../constants/routes';
import api from '../../services/api';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { ChapterQuizSection } from '../../components/tutorial/ChapterQuizSection';
import { TutorialDiscussionSection } from '../../components/tutorial/TutorialDiscussionSection';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Play,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Bookmark,
  Sparkles,
  Terminal,
  Code2,
  ArrowRight,
  ArrowLeft,
  Star,
  Flame,
  Clock,
  CheckCircle2,
  ImageIcon,
  Layers,
  Cpu,
  Coffee,
  Database,
  Cloud,
  Network,
  ShieldCheck,
  Binary,
  FileCode2,
  FileCode,
  BookOpen,
  MessageSquare,
  Edit3,
  RotateCcw,
  X,
  Globe,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  liveTechCohortsService,
  ILiveTechCohort,
} from '../../services/liveTechCohorts.service';
import {
  TutorialContentRenderer,
  TutorialLiveEditor,
  ICodeExecutionOutput,
} from '../../components/tutorials/TutorialContentRenderer';
import { executeRemoteLanguage } from '../../utils/codeEvaluator';


// URL and search term aliases for flexible routing (e.g. /tutorials/dbms or /tutorials/database-management-systems)
const TRACK_ALIASES: Record<string, string> = {
  dbms: 'dbms',
  database: 'dbms',
  'database-management-system': 'dbms',
  'database-management-systems': 'dbms',
  databases: 'dbms',
  os: 'os',
  'operating-system': 'os',
  'operating-systems': 'os',
  cn: 'cn',
  networking: 'cn',
  'computer-networks': 'cn',
  'computer-network': 'cn',
  toc: 'toc',
  automata: 'toc',
  'theory-of-computation': 'toc',
  compiler: 'compiler',
  'compiler-design': 'compiler',
  coa: 'coa',
  'computer-organization': 'coa',
  'computer-organization-and-architecture': 'coa',
  dsa: 'dsa',
  'data-structures': 'dsa',
  algorithms: 'dsa',
  'data-structures-and-algorithms': 'dsa',
  sql: 'sql',
  python: 'python',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'javascript',
  ts: 'javascript',
  react: 'react',
  nextjs: 'react',
  java: 'java',
  cpp: 'cpp',
  'c++': 'cpp',
  c: 'c',
  'c-language': 'c',
  devops: 'devops',
  cloud: 'devops',
  systemdesign: 'systemdesign',
  'system-design': 'systemdesign',
  cybersecurity: 'cybersecurity',
  security: 'cybersecurity',
  ml: 'ml',
  ai: 'ml',
  'machine-learning': 'ml',
};

export type TDomainKey = 'development' | 'devops' | 'core-cs';

export interface IDomainCategory {
  id: TDomainKey;
  name: string;
  shortName: string;
  icon: string;
  trackIds: string[];
}

export const DOMAIN_CATEGORIES: IDomainCategory[] = [
  {
    id: 'development',
    name: 'Development & Programming',
    shortName: 'Development',
    icon: '💻',
    trackIds: ['react', 'javascript', 'python', 'java', 'cpp', 'c', 'sql'],
  },
  {
    id: 'devops',
    name: 'DevOps, Cloud & Architecture',
    shortName: 'DevOps & Cloud',
    icon: '☁️',
    trackIds: ['devops', 'systemdesign', 'cybersecurity'],
  },
  {
    id: 'core-cs',
    name: 'Core Computer Science & GATE',
    shortName: 'Core CS',
    icon: '🏛️',
    trackIds: ['dbms', 'os', 'cn', 'toc', 'compiler', 'coa', 'dsa'],
  },
];

// Helper to deduce domain category for any track
const getDomainForTrack = (trackId: string, category?: string): TDomainKey => {
  const tid = trackId.toLowerCase();
  const cat = (category || '').toLowerCase();

  // 1. Core CS / GATE / B.Tech Academic subjects
  if (
    ['dbms', 'os', 'cn', 'toc', 'compiler', 'coa', 'dsa'].includes(tid) ||
    cat.includes('core computer') ||
    cat.includes('gate') ||
    cat.includes('b.tech') ||
    cat.includes('academic')
  ) {
    return 'core-cs';
  }

  // 2. DevOps, Cloud, System Design, Cybersecurity
  if (
    ['devops', 'systemdesign', 'cybersecurity', 'cloud'].includes(tid) ||
    cat.includes('cloud') ||
    cat.includes('devops') ||
    cat.includes('infrastructure') ||
    cat.includes('systems') ||
    cat.includes('security')
  ) {
    return 'devops';
  }

  // 3. Development: Web, Languages, Full-Stack, Frontend, Backend
  return 'development';
};

// Subject Icon Resolver supporting all standard and dynamically created subjects
const renderSubjectIcon = (iconName?: string, trackId?: string) => {
  const tid = (trackId || '').toLowerCase();
  const iname = (iconName || '').toLowerCase();

  if (tid.includes('html')) return <FileCode className="w-3.5 h-3.5 text-orange-500" />;
  if (tid.includes('css') || tid.includes('tailwind') || tid.includes('bootstrap')) return <Layers className="w-3.5 h-3.5 text-cyan-500" />;
  if (tid.includes('python') || iname.includes('filecode2')) {
    return <FileCode2 className="w-3.5 h-3.5 text-blue-500" />;
  }
  if (tid.includes('javascript') || tid.includes('js') || tid.includes('typescript') || iname.includes('filecode')) {
    return <FileCode className="w-3.5 h-3.5 text-amber-500" />;
  }
  if (tid.includes('react') || tid.includes('next') || tid.includes('vue') || tid.includes('angular') || iname.includes('layers')) {
    return <Layers className="w-3.5 h-3.5 text-cyan-500" />;
  }
  if (tid.includes('java') || iname.includes('coffee')) {
    return <Coffee className="w-3.5 h-3.5 text-red-500" />;
  }
  if (tid.includes('cpp') || tid.includes('csharp') || iname.includes('cpu')) {
    return <Cpu className="w-3.5 h-3.5 text-blue-600" />;
  }
  if (tid === 'c' || tid.includes('linux') || iname.includes('terminal')) {
    return <Terminal className="w-3.5 h-3.5 text-slate-500" />;
  }
  if (tid.includes('go') || tid.includes('rust')) {
    return <Cpu className="w-3.5 h-3.5 text-teal-500" />;
  }
  if (tid.includes('dsa') || tid.includes('algo') || iname.includes('binary')) {
    return <Binary className="w-3.5 h-3.5 text-purple-500" />;
  }
  if (tid.includes('dbms') || tid.includes('database') || tid.includes('sql') || tid.includes('mongo') || tid.includes('redis') || tid.includes('postgres')) {
    return <Database className="w-3.5 h-3.5 text-emerald-500" />;
  }
  if (tid.includes('os') || tid.includes('operating')) {
    return <Cpu className="w-3.5 h-3.5 text-violet-500" />;
  }
  if (tid.includes('cn') || tid.includes('network') || tid.includes('api') || tid.includes('graphql') || tid.includes('socket')) {
    return <Network className="w-3.5 h-3.5 text-sky-500" />;
  }
  if (tid.includes('toc') || tid.includes('automata') || tid.includes('discrete')) {
    return <Binary className="w-3.5 h-3.5 text-amber-500" />;
  }
  if (tid.includes('compiler') || tid.includes('oops')) {
    return <Code2 className="w-3.5 h-3.5 text-orange-500" />;
  }
  if (tid.includes('coa') || tid.includes('graphics')) {
    return <Layers className="w-3.5 h-3.5 text-indigo-500" />;
  }
  if (tid.includes('devops') || tid.includes('docker') || tid.includes('kube') || tid.includes('aws') || tid.includes('cloud') || iname.includes('cloud')) {
    return <Cloud className="w-3.5 h-3.5 text-sky-500" />;
  }
  if (tid.includes('systemdesign') || tid.includes('microservice') || tid.includes('nginx')) {
    return <Network className="w-3.5 h-3.5 text-orange-500" />;
  }
  if (tid.includes('cyber') || tid.includes('security') || tid.includes('hack') || iname.includes('shield')) {
    return <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />;
  }
  if (tid.includes('ml') || tid.includes('ai') || tid.includes('data') || iname.includes('sparkles')) {
    return <Sparkles className="w-3.5 h-3.5 text-pink-500" />;
  }
  return <BookOpen className="w-3.5 h-3.5 text-brand-500" />;
};

export const TutorialsPage: React.FC = () => {
  const { trackSlug, chapterSlug } = useParams<{ trackSlug?: string; chapterSlug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawTrack = trackSlug || searchParams.get('track') || 'python';
  const normalizedTrackId = TRACK_ALIASES[rawTrack.toLowerCase()] || rawTrack.toLowerCase();
  const rawChapter = chapterSlug || searchParams.get('chapter');

  // Horizontal track bar container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track scroll position to only show ThemeToggle in sticky bar when main header is scrolled away
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Main navbar height is 64px. When scrollY > 60, main header has scrolled out of view
      setIsHeaderScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic backend tutorials and subjects state
  const [backendTutorials, setBackendTutorials] = useState<any[]>([]);
  const [backendSubjects, setBackendSubjects] = useState<any[]>([]);
  const [liveCohorts, setLiveCohorts] = useState<ILiveTechCohort[]>([]);

  useEffect(() => {
    const unsub = liveTechCohortsService.subscribe((list) => {
      setLiveCohorts(list.filter((c) => c.isActive).sort((a, b) => a.order - b.order));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const [tutRes, subjRes] = await Promise.all([
          api.get('/tutorials?limit=500&includeContent=true').catch(() => null),
          api.get('/tutorials/subjects').catch(() => null),
        ]);

        if (tutRes?.data?.data?.tutorials) {
          setBackendTutorials(tutRes.data.data.tutorials);
        }
        if (subjRes?.data?.data?.subjects) {
          setBackendSubjects(subjRes.data.data.subjects);
        }
      } catch {
        // Fallback to static tracks
      }
    };
    fetchBackendData();
  }, []);

  // Merged Tracks (Database is single source of truth when available)
  const tracksList = useMemo(() => {
    if (backendSubjects.length) {
      // Map all backend subjects as the authoritative tracks list
      return backendSubjects.map((bs: any) => {
        const trackId = bs.slug;
        const matchingChapters = backendTutorials
          .filter((bt: any) => bt.track === trackId)
          .sort((a: any, b: any) => {
            if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
              return a.order - b.order;
            }
            const aIsIntro = (a.title || '').toLowerCase().includes('introduction') || (a.slug || '').includes('intro');
            const bIsIntro = (b.title || '').toLowerCase().includes('introduction') || (b.slug || '').includes('intro');
            if (aIsIntro && !bIsIntro) return -1;
            if (!aIsIntro && bIsIntro) return 1;
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          });

        // Group matching chapters by sectionTitle
        const sectionMap = new Map<string, ITutorialChapter[]>();

        matchingChapters.forEach((bt: any) => {
          const secTitle = bt.sectionTitle || 'Foundations & Basics';
          if (!sectionMap.has(secTitle)) {
            sectionMap.set(secTitle, []);
          }
          sectionMap.get(secTitle)!.push({
            id: bt.id || bt._id,
            slug: bt.slug,
            title: bt.title,
            description: bt.excerpt,
            quickFacts: bt.quickFacts || bt.excerpt,
            lastUpdated: bt.updatedAt
              ? new Date(bt.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '04 Oct, 2026',
            estimatedTime: `${bt.readingTime || 5} min read`,
            level: bt.level || 'Beginner',
            diagramImageUrl: bt.diagramImageUrl,
            keyPoints: bt.keyPoints || [],
            content: bt.content,
            codeSnippet: bt.codeSnippet,
            quiz: bt.quiz,
            practiceProblem: bt.practiceProblemLink
              ? {
                  title: 'Solve Related Challenge',
                  difficulty: 'Medium',
                  link: bt.practiceProblemLink,
                }
              : undefined,
          });
        });

        // If no chapters in DB yet for this track, check if TUTORIAL_TRACKS has fallback sections
        let sections = Array.from(sectionMap.entries()).map(([title, chaps]) => ({
          id: `sec-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          title,
          chapters: chaps,
        }));

        if (sections.length === 0) {
          const staticFallback = TUTORIAL_TRACKS.find((t) => t.id === trackId);
          if (staticFallback && staticFallback.sections.length > 0) {
            sections = staticFallback.sections;
          }
        }

        return {
          id: bs.slug,
          title: bs.title,
          shortTitle: bs.shortTitle || bs.title,
          iconName: bs.iconName || 'BookOpen',
          category: bs.category || 'Core Computer Science',
          description: bs.description || `Master ${bs.title} and modern engineering standards.`,
          sections,
        };
      });
    }

    // Fallback if backend subjects not loaded yet
    return TUTORIAL_TRACKS;
  }, [backendTutorials, backendSubjects]);

  // Active track selection (supports URL slug / search param / alias)
  const activeTrack: ITutorialTrack = useMemo(() => {
    return (
      tracksList.find((t) => t.id.toLowerCase() === normalizedTrackId) ||
      tracksList.find((t) => t.shortTitle.toLowerCase() === normalizedTrackId) ||
      tracksList.find((t) => t.id === 'python') ||
      tracksList[0]
    );
  }, [tracksList, normalizedTrackId]);

  // Collapsed sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Active Chapter selection (supports chapter slug or ID)
  const activeChapter: ITutorialChapter = useMemo(() => {
    if (rawChapter) {
      const normCh = rawChapter.toLowerCase();
      for (const sec of activeTrack.sections) {
        const found = sec.chapters.find((c) => c.slug.toLowerCase() === normCh || c.id.toLowerCase() === normCh);
        if (found) return found;
      }
    }
    return activeTrack.sections[0]?.chapters[0];
  }, [activeTrack, rawChapter]);

  useDocumentTitle(`${activeChapter?.title || 'Tutorials'} — NextEra Coders`);

  // Initialize expanded state for sections
  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    activeTrack.sections.forEach((sec) => {
      newExpanded[sec.id] = true;
    });
    setExpandedSections(newExpanded);
  }, [activeTrack]);

  // Interactive UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [keyPointsCopied, setKeyPointsCopied] = useState(false);
  const [outputConsole, setOutputConsole] = useState<ICodeExecutionOutput | null>(null);
  const [outputTab, setOutputTab] = useState<'preview' | 'console'>('preview');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [bookmarked, setBookmarked] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [customCode, setCustomCode] = useState('');

  // Chapter completion state in localStorage (keyed by activeTrack.id)
  const [completedChapters, setCompletedChapters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`nec_completed_chapters_${activeTrack.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync completion on chapter change
  useEffect(() => {
    setOutputConsole(null);
    setIsPracticeMode(false);
    setCustomCode(activeChapter?.codeSnippet?.code || '');

    try {
      const saved = localStorage.getItem(`nec_completed_chapters_${activeTrack.id}`);
      setCompletedChapters(saved ? JSON.parse(saved) : []);

      const bookmarks = localStorage.getItem('nec_bookmarked_tutorials');
      if (bookmarks && activeChapter) {
        const list: string[] = JSON.parse(bookmarks);
        setBookmarked(list.includes(activeChapter.id));
      }
    } catch {
      // ignore
    }
  }, [activeChapter?.id, activeTrack.id]);

  // Fallback: If activeChapter content is not loaded, fetch directly by slug
  useEffect(() => {
    if (activeChapter && !activeChapter.content && activeChapter.slug) {
      api.get<{ data: { tutorial: any } }>(`/tutorials/${activeChapter.slug}`)
        .then((res) => {
          const fetched = res.data?.data?.tutorial;
          if (fetched && fetched.content) {
            setBackendTutorials((prev) =>
              prev.map((t) => (t.slug === fetched.slug || t._id === fetched._id ? { ...t, ...fetched } : t))
            );
          }
        })
        .catch(() => {});
    }
  }, [activeChapter?.slug, activeChapter?.content]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleSelectTrack = (trackId: string) => {
    const target = tracksList.find((t) => t.id === trackId) || tracksList[0];
    const firstChapter = target.sections[0]?.chapters[0];
    if (firstChapter) {
      navigate(`/tutorials/${trackId}/${firstChapter.slug}`);
    } else {
      navigate(`/tutorials/${trackId}`);
    }
  };

  const handleSelectChapter = (chapter: ITutorialChapter) => {
    navigate(`/tutorials/${activeTrack.id}/${chapter.slug}`);
  };

  const toggleChapterCompletion = () => {
    if (!activeChapter) return;
    const isCompleted = completedChapters.includes(activeChapter.id);
    let updated: string[];
    if (isCompleted) {
      updated = completedChapters.filter((id) => id !== activeChapter.id);
    } else {
      updated = [...completedChapters, activeChapter.id];
    }
    setCompletedChapters(updated);
    try {
      localStorage.setItem(`nec_completed_chapters_${activeTrack.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const toggleBookmark = () => {
    if (!activeChapter) return;
    try {
      const raw = localStorage.getItem('nec_bookmarked_tutorials');
      let list: string[] = raw ? JSON.parse(raw) : [];
      if (bookmarked) {
        list = list.filter((id) => id !== activeChapter.id);
        setBookmarked(false);
      } else {
        list.push(activeChapter.id);
        setBookmarked(true);
      }
      localStorage.setItem('nec_bookmarked_tutorials', JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyKeyPoints = () => {
    if (!activeChapter?.keyPoints) return;
    const text = activeChapter.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n');
    navigator.clipboard.writeText(text);
    setKeyPointsCopied(true);
    setTimeout(() => setKeyPointsCopied(false), 2000);
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const handleRunCode = async () => {
    if (!activeChapter?.codeSnippet) return;
    setIsRunningCode(true);
    setOutputConsole(null);
    const lang = activeChapter.codeSnippet.language;
    const isHtml =
      lang.toLowerCase() === 'html' ||
      lang.toLowerCase() === 'htm' ||
      lang.toLowerCase() === 'markup';
    setOutputTab(isHtml ? 'preview' : 'console');
    const start = performance.now();
    try {
      const codeToRun = isPracticeMode ? customCode : activeChapter.codeSnippet.code;
      const res = await executeRemoteLanguage(lang, codeToRun);
      setIsRunningCode(false);
      const elapsed = res.executionTime || Math.round(performance.now() - start);
      if (res.error) {
        setOutputConsole({
          text: res.error,
          isError: true,
          time: elapsed,
          status: res.status || 'Runtime Error',
          htmlCode: isHtml ? codeToRun : undefined,
        });
      } else {
        setOutputConsole({
          text:
            res.output ||
            activeChapter?.codeSnippet?.output ||
            `[Execution Success]\nProcess finished with exit code 0 (Elapsed: ${elapsed}ms)`,
          isError: false,
          time: elapsed,
          status: res.status || 'Success (Exit 0)',
          htmlCode: isHtml ? codeToRun : undefined,
        });
      }
    } catch (err: any) {
      setIsRunningCode(false);
      setOutputConsole({
        text: `Execution failed: ${err?.message || 'Failed to execute code'}`,
        isError: true,
        time: Math.round(performance.now() - start),
        status: 'Error',
      });
    }
  };

  const handleOpenInCompiler = () => {
    if (!activeChapter?.codeSnippet) return;
    try {
      localStorage.setItem(
        'nec_compiler_preload_code',
        JSON.stringify({
          language: activeChapter.codeSnippet.language,
          code: isPracticeMode ? customCode : activeChapter.codeSnippet.code,
        })
      );
    } catch {
      // ignore
    }
    navigate(ROUTES.COMPILER);
  };


  // Flattened chapters for previous/next navigation
  const allChapters = useMemo(() => {
    const list: ITutorialChapter[] = [];
    activeTrack.sections.forEach((sec) => {
      sec.chapters.forEach((ch) => list.push(ch));
    });
    return list;
  }, [activeTrack]);

  const currentIndex = allChapters.findIndex((c) => c.id === activeChapter?.id);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  // Track progress percentage
  const trackProgress = useMemo(() => {
    if (allChapters.length === 0) return 0;
    const done = allChapters.filter((c) => completedChapters.includes(c.id)).length;
    return Math.round((done / allChapters.length) * 100);
  }, [allChapters, completedChapters]);

  // Context-aware dynamic topics ordered according to activeTrack's subject domain
  const visibleTopics = useMemo(() => {
    const activeDomain = getDomainForTrack(activeTrack.id, activeTrack.category);

    // Sequence of domain groups based on what user is reading
    let domainSequence: TDomainKey[];
    if (activeDomain === 'development') {
      domainSequence = ['development', 'devops', 'core-cs'];
    } else if (activeDomain === 'devops') {
      domainSequence = ['devops', 'development', 'core-cs'];
    } else {
      domainSequence = ['core-cs', 'devops', 'development'];
    }

    const DOMAIN_IDS: Record<TDomainKey, string[]> = {
      development: ['react', 'javascript', 'python', 'java', 'cpp', 'c', 'sql'],
      devops: ['devops', 'systemdesign', 'cybersecurity'],
      'core-cs': ['dbms', 'os', 'cn', 'toc', 'compiler', 'coa', 'dsa'],
    };

    const orderedTracks: ITutorialTrack[] = [];

    // 1. Current active subject always appears first at the start of the bar
    orderedTracks.push(activeTrack);

    // 2. Add all other subjects belonging to the active domain
    const primaryIds = DOMAIN_IDS[activeDomain] || [];
    primaryIds.forEach((id) => {
      if (id !== activeTrack.id) {
        const found = tracksList.find((t) => t.id === id);
        if (found && !orderedTracks.some((ot) => ot.id === found.id)) {
          orderedTracks.push(found);
        }
      }
    });

    tracksList.forEach((tr) => {
      if (getDomainForTrack(tr.id, tr.category) === activeDomain) {
        if (!orderedTracks.some((ot) => ot.id === tr.id)) {
          orderedTracks.push(tr);
        }
      }
    });

    // 3. Add subjects from the subsequent domains in order
    domainSequence.slice(1).forEach((dom) => {
      const domIds = DOMAIN_IDS[dom] || [];
      domIds.forEach((id) => {
        const found = tracksList.find((t) => t.id === id);
        if (found && !orderedTracks.some((ot) => ot.id === found.id)) {
          orderedTracks.push(found);
        }
      });
      tracksList.forEach((tr) => {
        if (getDomainForTrack(tr.id, tr.category) === dom) {
          if (!orderedTracks.some((ot) => ot.id === tr.id)) {
            orderedTracks.push(tr);
          }
        }
      });
    });

    // 4. Any remaining dynamic subjects or cohorts
    tracksList.forEach((tr) => {
      if (!orderedTracks.some((ot) => ot.id === tr.id)) {
        orderedTracks.push(tr);
      }
    });

    return orderedTracks.map((track) => ({
      id: track.id,
      label: track.shortTitle || track.title,
      trackId: track.id,
      icon: renderSubjectIcon(track.iconName, track.id),
    }));
  }, [tracksList, activeTrack]);

  // Auto-scroll active subject chip into view cleanly without cutting off start
  useEffect(() => {
    const el = scrollContainerRef.current;
    const activeEl = document.getElementById(`topic-nav-${activeTrack.id}`);
    if (!el || !activeEl) return;

    const timer = setTimeout(() => {
      // If active track is the first item, ensure container is scrolled cleanly to 0
      if (activeTrack.id === visibleTopics[0]?.trackId) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      const elRect = el.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();

      // Check if already comfortably visible
      if (itemRect.left >= elRect.left + 8 && itemRect.right <= elRect.right - 8) {
        return;
      }

      // Scroll cleanly to show the full pill container
      if (itemRect.left < elRect.left + 8) {
        const target = el.scrollLeft - (elRect.left - itemRect.left) - 12;
        el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      } else if (itemRect.right > elRect.right - 8) {
        const target = el.scrollLeft + (itemRect.right - elRect.right) + 12;
        el.scrollTo({ left: target, behavior: 'smooth' });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activeTrack.id, visibleTopics]);

  // Discrete subject-by-subject slide navigation on mouse wheel (entire container slides at once)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let isThrottled = false;

    const handleWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8) return;

      // Only handle if container has scrollable content
      if (el.scrollWidth <= el.clientWidth) return;

      // Prevent arbitrary raw pixel scrolling that stops halfway through a subject name
      e.preventDefault();

      if (isThrottled) return;
      isThrottled = true;

      const items = Array.from(el.querySelectorAll<HTMLElement>('[data-subject-pill="true"]'));
      if (items.length === 0) {
        isThrottled = false;
        return;
      }

      const containerLeft = el.getBoundingClientRect().left;

      if (delta > 0) {
        // Next subject: find first item whose left edge is at least 15px past the container left
        const nextItem = items.find((item) => item.getBoundingClientRect().left > containerLeft + 15);
        if (nextItem) {
          const targetScroll = nextItem.getBoundingClientRect().left - containerLeft + el.scrollLeft;
          el.scrollTo({ left: Math.round(targetScroll), behavior: 'smooth' });
        }
      } else {
        // Previous subject: find last item whose left edge is to the left of the container
        const prevItems = items.filter((item) => item.getBoundingClientRect().left < containerLeft - 10);
        const prevItem = prevItems[prevItems.length - 1];
        if (prevItem) {
          const targetScroll = prevItem.getBoundingClientRect().left - containerLeft + el.scrollLeft;
          el.scrollTo({ left: Math.max(0, Math.round(targetScroll)), behavior: 'smooth' });
        } else {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }

      setTimeout(() => {
        isThrottled = false;
      }, 200);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [visibleTopics]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* 1. STICKY TOPIC SUB-NAVIGATION BAR (Compact Tabs + Dynamic Theme Toggle)  */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-dark-800/80 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md shadow-xs py-2 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Main Subject Pills: Starts at exact left alignment of Logo, flows to Profile */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar scroll-smooth flex-1 min-w-0 justify-start snap-x snap-mandatory select-none"
            style={{
              scrollSnapType: 'x mandatory',
              scrollPaddingLeft: '2px',
              scrollPaddingRight: '2px',
            }}
          >
            {visibleTopics.map((topic) => {
              const isActive = activeTrack.id === topic.trackId;
              return (
                <button
                  key={topic.id}
                  id={`topic-nav-${topic.trackId}`}
                  data-subject-pill="true"
                  onClick={() => handleSelectTrack(topic.trackId)}
                  style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                  className={cn(
                    'snap-start px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-2 cursor-pointer border shrink-0',
                    isActive
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 shadow-sm shadow-emerald-600/25 font-bold'
                      : 'bg-slate-100/90 dark:bg-dark-800/90 border-slate-200/90 dark:border-dark-750 text-slate-700 dark:text-slate-300 hover:bg-slate-200/90 dark:hover:bg-dark-750 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-dark-700'
                  )}
                >
                  <span className={cn('shrink-0', isActive ? 'text-white' : '')}>{topic.icon}</span>
                  <span className="tracking-tight">{topic.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Side: Theme Toggle shown ONLY when main header has scrolled away */}
          {isHeaderScrolled && (
            <div className="flex items-center shrink-0 pl-2.5 border-l border-slate-200/90 dark:border-dark-800 transition-opacity duration-200">
              <ThemeToggle
                compact
                className="h-8 w-8 rounded-lg p-1.5 border border-slate-200/90 dark:border-dark-750 bg-slate-100/90 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-750 transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
              />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 3-COLUMN DOCUMENTATION LAYOUT                                    */}
      {/* ========================================================================= */}
      <div className="max-w-[1700px] mx-auto w-full px-3 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row items-start gap-6">
        
        {/* ======================================================================= */}
        {/* LEFT SIDEBAR: Hierarchical Chapter Accordion Tree (Sticky in view)      */}
        {/* ======================================================================= */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 lg:sticky lg:top-14 lg:self-start lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto no-scrollbar scrollbar-none">
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200/90 dark:border-dark-800 p-4 shadow-sm space-y-4">
            
            {/* Header Track Info & Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {activeTrack.category}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400">
                  {completedChapters.length}/{allChapters.length} Done
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeTrack.title}</span>
              </h2>

              {/* Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-500">
                  <span>Track Progress</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{trackProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${trackProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="tutorial-chapter-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics & chapters..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Chapters Accordion */}
            <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
              {activeTrack.sections.map((section) => {
                const isExpanded = expandedSections[section.id] !== false;
                const filteredChapters = section.chapters.filter((ch) =>
                  ch.title.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredChapters.length === 0 && searchQuery) return null;

                return (
                  <div key={section.id} className="space-y-1">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      <span className="truncate">{section.title}</span>
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        )}
                      />
                    </button>

                    {isExpanded && (
                      <div className="space-y-0.5 pl-2 border-l-2 border-slate-100 dark:border-dark-800 ml-2">
                        {filteredChapters.map((chapter) => {
                          const isActive = activeChapter?.id === chapter.id;
                          const isDone = completedChapters.includes(chapter.id);
                          return (
                            <button
                              key={chapter.id}
                              onClick={() => handleSelectChapter(chapter)}
                              className={cn(
                                'w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-center justify-between group cursor-pointer',
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold border-l-2 border-emerald-600'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-850 hover:text-slate-900 dark:hover:text-slate-200'
                              )}
                            >
                              <span className="truncate pr-2">{chapter.title}</span>
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Promo / Banner */}
            <div className="pt-2 border-t border-slate-100 dark:border-dark-800">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>NextEra Pro Compiler</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Run high-performance Python, Java, C++ & Web apps with zero configuration.
                </p>
                <Link to={ROUTES.COMPILER} className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1">
                  Launch Compiler <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Student Community & Reviews Reference (Under NextEra Pro Compiler) */}
            <div className="pt-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-brand-500/15 via-purple-500/10 to-transparent border border-brand-500/25 text-xs space-y-1.5 shadow-xs hover:border-brand-500/40 transition-all">
                <div className="flex items-center gap-1.5 font-bold text-brand-700 dark:text-brand-400">
                  <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
                  <span>Community & Reviews Hub</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Have doubts on this tutorial or want to share a review? Ask & post with code screenshots.
                </p>
                <Link to={ROUTES.COMMUNITY} className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline pt-1 group">
                  <span>Visit Post Page</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* CENTER MAIN: Separate distinct containers for Article, Quiz, Comments  */}
        {/* ======================================================================= */}
        <main className="flex-1 min-w-0 space-y-6">
          {activeChapter ? (
            <>
              {/* 1. TUTORIAL ARTICLE READING CONTAINER */}
              <article className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200/90 dark:border-dark-800 p-6 sm:p-8 shadow-sm space-y-8">
                {/* 1. Header with Title, Metadata & Action Icons */}
              <div className="space-y-4 border-b border-slate-100 dark:border-dark-800 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 font-bold">
                      {activeTrack.shortTitle}
                    </span>
                    <span>/</span>
                    <span className="text-slate-500 dark:text-slate-400">{activeChapter.level || 'Beginner'}</span>
                    <span>•</span>
                    <span className="text-slate-500 dark:text-slate-400">{activeChapter.estimatedTime || '8 min read'}</span>
                  </div>

                  {/* Reader Controls: Font Size, Bookmark, Share, Compiler */}
                  <div className="flex items-center gap-2">
                    {/* Font Size Adjuster */}
                    <div className="flex items-center rounded-lg bg-slate-100 dark:bg-dark-800 p-0.5 text-[11px] font-mono">
                      <button
                        onClick={() => setFontSize('sm')}
                        className={cn('px-2 py-0.5 rounded', fontSize === 'sm' && 'bg-white dark:bg-dark-700 font-bold shadow-xs')}
                        title="Small font"
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setFontSize('base')}
                        className={cn('px-2 py-0.5 rounded', fontSize === 'base' && 'bg-white dark:bg-dark-700 font-bold shadow-xs')}
                        title="Normal font"
                      >
                        A
                      </button>
                      <button
                        onClick={() => setFontSize('lg')}
                        className={cn('px-2 py-0.5 rounded', fontSize === 'lg' && 'bg-white dark:bg-dark-700 font-bold shadow-xs')}
                        title="Large font"
                      >
                        A+
                      </button>
                    </div>

                    {/* Bookmark Button */}
                    <button
                      onClick={toggleBookmark}
                      className={cn(
                        'p-2 rounded-lg border transition-colors cursor-pointer',
                        bookmarked
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-500'
                          : 'border-slate-200 dark:border-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      )}
                      title="Bookmark Chapter"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={handleShareLink}
                      className="p-2 rounded-lg border border-slate-200 dark:border-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer relative"
                      title="Share Chapter"
                    >
                      <Share2 className="w-4 h-4" />
                      {shareToast && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-lg font-mono whitespace-nowrap">
                          Link Copied!
                        </span>
                      )}
                    </button>

                    {/* Open in NEC Compiler */}
                    <button
                      onClick={handleOpenInCompiler}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-brand-500" />
                      <span className="hidden sm:inline">Open in Compiler</span>
                    </button>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activeChapter.title}
                </h1>

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>Last Updated : {activeChapter.lastUpdated}</span>
                </div>
              </div>

              {/* 2. Key Points / Interview Highlights Card */}
              {activeChapter.keyPoints && activeChapter.keyPoints.length > 0 && (
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Key Concept Takeaways & Interview Points
                    </span>
                    <button
                      onClick={handleCopyKeyPoints}
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {keyPointsCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{keyPointsCopied ? 'Copied' : 'Copy Points'}</span>
                    </button>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {activeChapter.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Attached Diagram / Architecture Image (e.g. AI/ML, System Design, Cloud) */}
              {activeChapter.diagramImageUrl && (
                <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200/90 dark:border-dark-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold">
                      <ImageIcon className="w-4 h-4" /> Architecture Diagram / Workflow Visual
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-bold">
                      VISUAL DIAGRAM
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 flex items-center justify-center p-2 sm:p-4">
                    <img
                      src={activeChapter.diagramImageUrl}
                      alt={`${activeChapter.title} Visual Diagram`}
                      className="w-full max-h-[460px] object-contain rounded-lg transition-transform hover:scale-[1.01]"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* 4. Infographic Diagram Feature Box (if available) */}
              {activeChapter.infographic && (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200/90 dark:border-dark-800 space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400">
                      Visual Architecture & Ecosystem
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeChapter.infographic.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {activeChapter.infographic.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 hover:border-emerald-500/50 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-emerald-600 dark:text-emerald-400">
                            {item.number}
                          </span>
                          {item.tag && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold">
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Main Markdown Body Content with Custom Font Scaling & Interactive Sliders */}
              <div className="max-w-none space-y-4">
                <TutorialContentRenderer content={activeChapter.content} fontSize={fontSize} />
              </div>

              {/* 6. In-Page Live Interactive Code Runner */}
              {activeChapter.codeSnippet && activeChapter.codeSnippet.code && (
                <div className="rounded-2xl border border-slate-800 bg-[#0d1117] text-slate-100 overflow-hidden shadow-xl space-y-0">
                  {/* Code Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#161b22] border-b border-slate-800 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-200">
                        {activeChapter.codeSnippet.filename || `${activeChapter.codeSnippet.language}_demo`}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300 uppercase tracking-wider">
                        {activeChapter.codeSnippet.language}
                      </span>
                      {isPracticeMode && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30 animate-pulse">
                          ● Practice Mode
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {isPracticeMode && (
                        <button
                          type="button"
                          onClick={() => setCustomCode(activeChapter.codeSnippet?.code || '')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Reset to original code"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          <span className="hidden sm:inline">Reset</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyCode(isPracticeMode ? customCode : (activeChapter.codeSnippet?.code || ''))}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy Code"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Practice Button */}
                      <button
                        type="button"
                        onClick={() => setIsPracticeMode(!isPracticeMode)}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border',
                          isPracticeMode
                            ? 'bg-brand-600 text-white border-brand-500 shadow-xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        )}
                        title="Practice code: read, write and test changes in-place"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                        <span>{isPracticeMode ? 'Editing' : 'Practice'}</span>
                      </button>

                      {/* Run Button */}
                      <button
                        type="button"
                        onClick={handleRunCode}
                        disabled={isRunningCode}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Play className={cn('w-3.5 h-3.5 fill-current', isRunningCode && 'animate-spin')} />
                        <span>{isRunningCode ? 'Executing...' : 'Run'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Practice Mode Banner */}
                  {isPracticeMode && (
                    <div className="px-4 py-2 bg-brand-950/60 border-b border-brand-800/40 text-[11px] text-brand-200 flex items-center justify-between">
                      <span>
                        ✏️ <strong>Practice Mode Active:</strong> You can edit and test code changes directly. Click <strong>Run</strong> to test your edits.
                      </span>
                      <span className="font-mono text-[10px] text-brand-300/80">In-Place Playground</span>
                    </div>
                  )}

                  {/* Code Editor Body: Real-Time Multi-Color Syntax Highlighted Editor (Permanently dark #0d1117) */}
                  <TutorialLiveEditor
                    code={isPracticeMode ? customCode : activeChapter.codeSnippet.code}
                    onChange={(val) => {
                      setCustomCode(val);
                      if (!isPracticeMode) setIsPracticeMode(true);
                    }}
                    language={activeChapter.codeSnippet.language}
                    isPractice={isPracticeMode}
                    minHeight="180px"
                  />

                  {/* Output Terminal Console & Live Web Preview */}
                  {outputConsole && (
                    <div className="border-t border-slate-800 bg-[#090d13] p-4 space-y-3 animate-in fade-in duration-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                        {activeChapter.codeSnippet.language.toLowerCase() === 'html' ||
                        activeChapter.codeSnippet.language.toLowerCase() === 'htm' ||
                        activeChapter.codeSnippet.language.toLowerCase() === 'markup' ? (
                          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setOutputTab('preview')}
                              className={cn(
                                'px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                                outputTab === 'preview'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              )}
                            >
                              <Globe className="w-3.5 h-3.5 text-blue-300" />
                              <span>Live Web Preview</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setOutputTab('console')}
                              className={cn(
                                'px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                                outputTab === 'console'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              )}
                            >
                              <Terminal className="w-3.5 h-3.5 text-emerald-300" />
                              <span>DOM & Output</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                              <Terminal className="w-3.5 h-3.5" /> Output Terminal
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{outputConsole.time}ms</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded font-mono font-bold',
                              outputConsole.isError
                                ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                            )}
                          >
                            {outputConsole.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => setOutputConsole(null)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Close output"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Body: Live Web Preview iframe OR Console pre */}
                      {(activeChapter.codeSnippet.language.toLowerCase() === 'html' ||
                        activeChapter.codeSnippet.language.toLowerCase() === 'htm' ||
                        activeChapter.codeSnippet.language.toLowerCase() === 'markup') &&
                      outputTab === 'preview' ? (
                        <div className="rounded-xl border border-slate-700 bg-white overflow-hidden shadow-inner">
                          <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                            <span className="flex items-center gap-1.5 font-bold text-blue-600">
                              <Globe className="w-3.5 h-3.5" /> HTML5 Live Web Document
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">
                              Rendered View
                            </span>
                          </div>
                          <iframe
                            title="Live HTML Web Preview"
                            srcDoc={isPracticeMode ? customCode : activeChapter.codeSnippet.code}
                            className="w-full min-h-[220px] max-h-[380px] bg-white border-0"
                            sandbox="allow-scripts allow-modals"
                          />
                        </div>
                      ) : (
                        <pre
                          className={cn(
                            'm-0 text-xs font-mono p-3 rounded-lg border leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap',
                            outputConsole.isError
                              ? 'bg-rose-950/20 text-rose-300 border-rose-900/50'
                              : 'bg-[#121820] text-slate-200 border-slate-800'
                          )}
                        >
                          {outputConsole.text}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}


              {/* 7. Practice Problem Callout (if available) */}
              {activeChapter.practiceProblem && (
                <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400">
                        Related Practice Problem
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {activeChapter.practiceProblem.title}
                      </h4>
                    </div>
                  </div>
                  <Link to={activeChapter.practiceProblem.link}>
                    <button className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                      <span>Solve Problem</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              )}
              </article>

              {/* 2. SEPARATE QUIZ ASSESSMENT CONTAINER */}
              <ChapterQuizSection
                chapter={activeChapter}
                track={activeTrack}
                onCompleted={toggleChapterCompletion}
              />

              {/* 3. SEPARATE ARTICLE DISCUSSION CONTAINER */}
              <TutorialDiscussionSection
                chapter={activeChapter}
                trackId={activeTrack.id}
              />

              {/* 4. SEPARATE CHAPTER FOOTER NAVIGATION CONTAINER */}
              <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200/90 dark:border-dark-800 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={toggleChapterCompletion}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border',
                    completedChapters.includes(activeChapter.id)
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-750 hover:bg-slate-50'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completedChapters.includes(activeChapter.id) ? '✓ Completed' : 'Mark as Completed'}</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  {prevChapter && (
                    <button
                      onClick={() => handleSelectChapter(prevChapter)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{prevChapter.title}</span>
                    </button>
                  )}
                  {nextChapter && (
                    <button
                      onClick={() => handleSelectChapter(nextChapter)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <span className="truncate max-w-[120px]">{nextChapter.title}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200/90 dark:border-dark-800 py-20 text-center space-y-3 shadow-sm">
              <p className="text-sm text-slate-500">Select a chapter from the left sidebar to start reading.</p>
            </div>
          )}
        </main>

        {/* ======================================================================= */}
        {/* RIGHT SIDEBAR: In-Page TOC & Upcoming Live Courses (Sticky in view)     */}
        {/* ======================================================================= */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 lg:sticky lg:top-14 lg:self-start lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto no-scrollbar scrollbar-none">
          
          {/* Track / Chapter Quick Facts */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200/90 dark:border-dark-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                {activeTrack.shortTitle || activeTrack.title} Quick Facts
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeChapter?.quickFacts || activeChapter?.description || activeTrack.description}
            </p>
          </div>

          {/* Recommended Upcoming Live Cohorts */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200/90 dark:border-dark-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Live Tech Cohorts</span>
              </h3>
              <Link to={ROUTES.COURSES} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {liveCohorts.map((cohort) => (
                <Link
                  key={cohort.id}
                  to={cohort.linkUrl || `/courses/${cohort.slug}`}
                  className="block p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200/80 dark:border-dark-800 hover:border-emerald-500/50 transition-all space-y-1.5 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-[9px] font-mono px-1.5 py-0.2 rounded font-bold',
                        cohort.badge === 'LIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : cohort.badge === 'PRO'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      )}
                    >
                      {cohort.badge}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{cohort.rating}</span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {cohort.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{cohort.schedule}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Fast Compiler Trigger Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-dark-900 to-dark-950 text-white border border-slate-800 space-y-2.5 shadow-xl">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold font-mono">Interactive Cloud Sandbox</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Test algorithms and web snippets with our multi-language live compiler runtime.
            </p>
            <Link to={ROUTES.COMPILER} className="block pt-1">
              <button className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                <span>Launch NEC Compiler</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};
