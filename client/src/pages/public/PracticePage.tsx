import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { problemService } from '../../services/problem.service';
import { IProblemListItem } from '../../types/problem.types';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { ProblemVideoModal } from '../../components/problem/ProblemVideoModal';
import { AnimatedCoinModal } from '../../components/contest/AnimatedCoinModal';
import { Modal } from '../../components/ui/Modal';
import { coinService, CoinWalletState } from '../../services/coin.service';
import { sundayContestService, PRACTICE_PROBLEMS_CATALOG } from '../../services/contest.service';
import { adminProblemService } from '../../services/adminProblem.service';
import { top150Service } from '../../services/top150.service';
import { monthlyContestService, MonthlyUserAttempt } from '../../services/monthlyContest.service';
import { ROUTES } from '../../constants/routes';
import {
  Search,
  CheckCircle2,
  Clock,
  Circle,
  Code2,
  ChevronLeft,
  ChevronRight,
  Youtube,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Flame,
  Building2,
  Sparkles,
  Terminal,
  Database,
  Cpu,
  Layers,
  Trophy,
  Lock,
  Plus,
  Shield,
  ExternalLink,
  X,
  BookOpen,
  ArrowRight,
  Play,
  Swords,
  Bookmark,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { BookmarkProblemModal } from '../../components/problem/BookmarkProblemModal';
import { bookmarkService } from '../../services/bookmark.service';

// Enriched problem item for the master 158+ problemset
export interface MasterProblemItem extends IProblemListItem {
  inTop150: boolean;
  isSundayContest: boolean;
  companies: string[];
  points: number;
  acceptanceRateStr?: string;
  description?: string;
}

// Curated Top Category Tags
const CORE_TOPIC_TAGS = [
  'Array',
  'String',
  'Hash Table',
  'Dynamic Programming',
  'Binary Trees',
  'Binary Search Trees',
  'Graphs',
  'Two Pointers',
  'Sliding Window',
  'Linked List',
  'Stacks & Queues',
  'Searching & Sorting',
  'Greedy',
  'Backtracking',
  'Bit Manipulation',
  'Heap',
  '2D Arrays',
  'Trie & Advanced DS',
  'Recursion',
];

// Curated Sub-Track Tabs with Tutorial Linkage
export interface SubCategoryTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tutorialTrack?: string;
  tutorialName?: string;
  tutorialDescription?: string;
}

const SUB_CATEGORIES: SubCategoryTab[] = [
  { id: 'all', label: 'All Topics', icon: Layers },
  {
    id: 'algorithms',
    label: 'Algorithms',
    icon: Cpu,
    tutorialTrack: 'dsa',
    tutorialName: 'DSA & Algorithms',
    tutorialDescription: 'Master Big-O, Sorting, Recursion, Two Pointers, Dynamic Programming & Graph Traversals.',
  },
  {
    id: 'datastructures',
    label: 'Data Structures',
    icon: Layers,
    tutorialTrack: 'dsa',
    tutorialName: 'Data Structures Blueprint',
    tutorialDescription: 'In-depth conceptual guides on Arrays, Linked Lists, Trees, Heaps, and Hash Tables.',
  },
  {
    id: 'database',
    label: 'Database / SQL',
    icon: Database,
    tutorialTrack: 'sql',
    tutorialName: 'SQL & Database Engineering',
    tutorialDescription: 'Comprehensive tutorials on Joins, Window Functions, Aggregate Queries, and Schema Design.',
  },
  { id: 'top150', label: 'Top Interview 150', icon: Sparkles },
  { id: 'contests', label: 'Sunday Contest', icon: Trophy },
  {
    id: 'javascript',
    label: 'JavaScript',
    icon: Terminal,
    tutorialTrack: 'javascript',
    tutorialName: 'JavaScript & Modern Web',
    tutorialDescription: 'Deep-dive theory on Event Loop, Closures, Promises, Prototypes, and Async patterns.',
  },
];

// Top 20 Trending Tech Companies for Interview Prep (Top Indian Service Giants & Global Product/FinTech Leaders)
export const TOP_20_TRENDING_COMPANIES = [
  'Amazon',
  'TCS',
  'Microsoft',
  'Infosys',
  'Accenture',
  'Google',
  'Cognizant',
  'Meta',
  'Wipro',
  'Flipkart',
  'HCLTech',
  'Adobe',
  'Apple',
  'Goldman Sachs',
  'Zoho',
  'Paytm',
  'Oracle',
  'Uber',
  'Swiggy',
  'Zomato',
] as const;

export const PracticePage: React.FC = () => {
  useDocumentTitle('Problems — NextEra Coders Master DSA Suite');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, isAdmin } = useAuth();
  const { success, error: toastError, info: toastInfo } = useToast();

  // Raw fetched API problems
  const [apiProblems, setApiProblems] = useState<IProblemListItem[]>([]);
  // Local trigger to force re-render when services update
  const [dataVersion, setDataVersion] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedSubTab, setSelectedSubTab] = useState(searchParams.get('tab') || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get('difficulty') || 'All');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedCompany, setSelectedCompany] = useState(searchParams.get('company') || '');
  const [companySearch, setCompanySearch] = useState('');
  const [isAllCompaniesExpanded, setIsAllCompaniesExpanded] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Expandable Tags
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  // Video Solution Modal State
  const [activeVideoProblem, setActiveVideoProblem] = useState<IProblemListItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Bookmark Modal State
  const [activeBookmarkProblem, setActiveBookmarkProblem] = useState<{
    slug: string;
    title: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    category?: string;
  } | null>(null);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Wallet & Daily Streak
  const [wallet, setWallet] = useState<CoinWalletState>(coinService.getState());
  const [timeUntilUnlock, setTimeUntilUnlock] = useState(() => coinService.getTimeUntilMidnight());

  // Admin Quick Create Problem Modal
  const [isAdminCreateModalOpen, setIsAdminCreateModalOpen] = useState(false);
  const [newProblemData, setNewProblemData] = useState({
    title: '',
    slug: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    category: 'Array / String',
    companies: 'TCS, Infosys, Google, Amazon',
    acceptanceRate: '54.0%',
    points: 200,
    addToTop150: true,
    description: '',
  });

  const [streakModalData, setStreakModalData] = useState<{
    isOpen: boolean;
    coins: number;
    title: string;
    subtitle: string;
    badgeText: string;
    streakCount: number;
    isBonus: boolean;
  }>({
    isOpen: false,
    coins: 1,
    title: '⚡ DAILY STREAK CLAIMED!',
    subtitle: 'You received +1 NEC Coin for your wallet & maintained your streak!',
    badgeText: 'DAILY STREAK REWARD',
    streakCount: 1,
    isBonus: false,
  });

  // Live Monthly Contest Attempt state
  const [monthlyContestAttempt, setMonthlyContestAttempt] = useState<MonthlyUserAttempt>(() =>
    monthlyContestService.getUserAttempt(user?.id)
  );

  // Sync monthly contest attempt on focus & storage
  useEffect(() => {
    const syncMonthlyContest = () => {
      setMonthlyContestAttempt(monthlyContestService.getUserAttempt(user?.id));
    };
    syncMonthlyContest();
    window.addEventListener('focus', syncMonthlyContest);
    window.addEventListener('storage', syncMonthlyContest);
    return () => {
      window.removeEventListener('focus', syncMonthlyContest);
      window.removeEventListener('storage', syncMonthlyContest);
    };
  }, [user]);

  // Handle direct "Join Contest" from Grand Championship container
  const handleJoinMonthlyContest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = monthlyContestService.getUserAttempt(user?.id);
    if (current.status === 'not_started') {
      const updated = monthlyContestService.startAttempt(user?.id);
      setMonthlyContestAttempt(updated);
      success('⚡ Contest Joined! Your 72-Hour Personal Timer is now running.');
    }
    navigate(`${ROUTES.MONTHLY_CONTEST}?join=true`);
  };

  // Subscribe to service updates (Top 150, Contest, Coin)
  useEffect(() => {
    const unsubTop150 = top150Service.subscribe(() => setDataVersion((v) => v + 1));
    const unsubContest = sundayContestService.subscribe(() => setDataVersion((v) => v + 1));
    const unsubCoin = coinService.subscribe(setWallet);
    const unsubBookmarks = bookmarkService.subscribe(() => setDataVersion((v) => v + 1));

    return () => {
      unsubTop150();
      unsubContest();
      unsubCoin();
      unsubBookmarks();
    };
  }, []);

  // Midnight countdown timer ticker
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();

      if (diffMs <= 0) {
        coinService.checkDayReset();
        coinService.fetchLiveWallet();
        setTimeUntilUnlock({ hours: 24, minutes: 0, seconds: 0, formatted: '24h 00m 00s' });
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');

      setTimeUntilUnlock({
        hours,
        minutes,
        seconds,
        formatted: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      coinService.syncUserProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        college: (user as any).college,
        points: user.points,
        learningStreak: user.learningStreak,
        unlockedCoupons: (user as any).unlockedCoupons,
        unlockedCourses: (user as any).unlockedCourses,
        swagOrders: (user as any).swagOrders,
      });
    }
  }, [user]);

  // Fetch base API problems from backend
  const fetchApiProblems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await problemService.getProblems({
        page: 1,
        limit: 5000,
      });
      setApiProblems(data.problems || []);
    } catch (err: any) {
      console.warn('Backend problems API notice (falling back to curated master set):', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiProblems();
  }, [fetchApiProblems]);

  // 1. MASTER PROBLEMSET MERGE ENGINE (Unified 1095+ Problems synchronized with Admin)
  const masterProblems = useMemo<MasterProblemItem[]>(() => {
    void dataVersion;

    const map = new Map<string, MasterProblemItem>();
    const top150List = top150Service.getProblems();
    const contestProblems = sundayContestService.getConfig().problems;
    const solvedTop150 = top150Service.getSolvedIds();

    const normalizeSlug = (s?: string) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // 1. Add API-created problems from MongoDB (2,769 problems)
    const seenSlugs = new Set<string>();
    apiProblems.forEach((ap, idx) => {
      const id = ap.id || (ap as any)._id;
      const slug = normalizeSlug(ap.slug || ap.title);
      if (slug) seenSlugs.add(slug);
      map.set(id, {
        id,
        order: typeof ap.order === 'number' && ap.order > 0 ? ap.order : (idx + 1),
        title: ap.title,
        slug: ap.slug || slug,
        difficulty: ap.difficulty,
        category: ap.category || 'Algorithms',
        supportedLanguages: ap.supportedLanguages || ['javascript', 'python', 'java', 'cpp', 'typescript'],
        expectedComplexity: ap.expectedComplexity || { time: 'O(N)', space: 'O(1)' },
        acceptanceRate: ap.acceptanceRate ?? 60.5,
        acceptanceRateStr: `${ap.acceptanceRate ?? 60.5}%`,
        totalSubmissions: ap.totalSubmissions || 1240,
        status: ap.status || (solvedTop150.has(id) ? 'Solved' : 'Unsolved'),
        createdAt: ap.createdAt || new Date().toISOString(),
        inTop150: top150Service.isProblemInTop150(slug),
        isSundayContest: false,
        companies: (ap as any).companies && Array.isArray((ap as any).companies) ? (ap as any).companies : [],
        points: (ap as any).points || (ap.difficulty === 'Hard' ? 300 : ap.difficulty === 'Medium' ? 200 : 100),
        youtubeUrl: ap.youtubeUrl,
      });
    });

    // 2. Add Master PRACTICE_PROBLEMS_CATALOG ONLY as offline fallback when API has 0 problems
    if (apiProblems.length === 0) {
      PRACTICE_PROBLEMS_CATALOG.forEach((p, idx) => {
        const id = p.id || `practice-cat-${idx}`;
        const slug = normalizeSlug(p.slug || p.title);
        if (!map.has(id)) {
          const inTop = top150Service.isProblemInTop150(slug);
          map.set(id, {
            id,
            order: typeof (p as any).order === 'number' && (p as any).order > 0 ? (p as any).order : (idx + 1),
            title: p.title,
            slug: p.slug || slug,
            difficulty: p.difficulty,
            category: p.category || 'Algorithms',
            supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'typescript'],
            expectedComplexity: p.expectedComplexity || { time: 'O(N)', space: 'O(1)' },
            acceptanceRate: parseFloat((p as any).accuracy) || 60.5,
            acceptanceRateStr: (p as any).accuracy || '60.5%',
            totalSubmissions: 1240,
            status: solvedTop150.has(p.id) ? 'Solved' : 'Unsolved',
            createdAt: new Date().toISOString(),
            inTop150: inTop,
            isSundayContest: false,
            companies: p.companies && Array.isArray(p.companies) ? p.companies : [],
            points: p.points || (p.difficulty === 'Hard' ? 300 : p.difficulty === 'Medium' ? 200 : 100),
          });
        }
      });
    }

    // 3. Sync Top Interview 150 items
    top150List.forEach((p) => {
      const slug = normalizeSlug(p.slug || p.title);
      let found = false;
      for (const item of map.values()) {
        if (normalizeSlug(item.slug || item.title) === slug) {
          item.inTop150 = true;
          if (p.companies && Array.isArray(p.companies) && p.companies.length > 0) {
            item.companies = p.companies;
          }
          if (solvedTop150.has(p.id)) item.status = 'Solved';
          found = true;
        }
      }
      if (!found && !map.has(p.id)) {
        map.set(p.id, {
          id: p.id,
          title: p.title,
          slug: p.slug || slug,
          difficulty: p.difficulty,
          category: p.category || 'Algorithms',
          supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'typescript'],
          expectedComplexity: { time: 'O(N)', space: 'O(1)' },
          acceptanceRate: parseFloat(p.acceptanceRate) || 60.5,
          acceptanceRateStr: p.acceptanceRate || '60.5%',
          totalSubmissions: 1240,
          status: solvedTop150.has(p.id) ? 'Solved' : 'Unsolved',
          createdAt: new Date().toISOString(),
          inTop150: true,
          isSundayContest: false,
          companies: p.companies && Array.isArray(p.companies) ? p.companies : [],
          points: p.points || (p.difficulty === 'Hard' ? 300 : p.difficulty === 'Medium' ? 200 : 100),
        });
      }
    });

    // 4. Sync Sunday Weekly Contest Problems (or add if offline fallback)
    contestProblems.forEach((cp) => {
      const slug = normalizeSlug(cp.slug || cp.title);
      let found = false;
      for (const item of map.values()) {
        if (normalizeSlug(item.slug || item.title) === slug) {
          item.isSundayContest = true;
          found = true;
        }
      }
      if (!found && apiProblems.length === 0 && !map.has(cp.id)) {
        map.set(cp.id, {
          id: cp.id,
          title: cp.title,
          slug: cp.slug || slug,
          difficulty: cp.difficulty,
          category: 'Contest / Graph & DP',
          supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'typescript'],
          expectedComplexity: { time: 'O(N)', space: 'O(N)' },
          acceptanceRate: 42.5,
          acceptanceRateStr: '42.5%',
          totalSubmissions: 310,
          status: 'Unsolved',
          createdAt: new Date().toISOString(),
          inTop150: false,
          isSundayContest: true,
          companies: (cp as any).companies && Array.isArray((cp as any).companies) ? (cp as any).companies : [],
          points: cp.points || 400,
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
  }, [apiProblems, dataVersion]);

  // Dynamic Category Stats across all 1095 problems
  const dynamicTagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CORE_TOPIC_TAGS.forEach((t) => (counts[t.toLowerCase()] = 0));

    masterProblems.forEach((p) => {
      const catLower = (p.category || '').toLowerCase();
      const titleLower = (p.title || '').toLowerCase();

      CORE_TOPIC_TAGS.forEach((tag) => {
        const tagLower = tag.toLowerCase();
        let matched = false;

        if (tagLower === 'array') {
          matched = catLower.includes('array') || catLower.includes('arrays');
        } else if (tagLower === 'string') {
          matched = catLower.includes('string') || catLower.includes('strings');
        } else if (tagLower === '2d arrays' || tagLower === 'matrix') {
          matched = catLower.includes('2d') || catLower.includes('matrix');
        } else if (tagLower === 'hash table') {
          matched = catLower.includes('hash') || catLower.includes('hashmap');
        } else if (tagLower === 'dynamic programming') {
          matched = catLower.includes('dynamic programming') || catLower.includes('dp');
        } else if (tagLower === 'binary trees') {
          matched = catLower.includes('tree') && !catLower.includes('bst') && !catLower.includes('search tree');
        } else if (tagLower === 'binary search trees') {
          matched = catLower.includes('bst') || catLower.includes('search tree');
        } else if (tagLower === 'graphs') {
          matched = catLower.includes('graph');
        } else if (tagLower === 'linked list') {
          matched = catLower.includes('linked list') || catLower.includes('linkedlist');
        } else if (tagLower === 'stacks & queues') {
          matched = catLower.includes('stack') || catLower.includes('queue');
        } else if (tagLower === 'greedy') {
          matched = catLower.includes('greedy');
        } else if (tagLower === 'backtracking') {
          matched = catLower.includes('backtracking');
        } else if (tagLower === 'searching & sorting') {
          matched = catLower.includes('search') || catLower.includes('sort') || catLower.includes('binary search');
        } else if (tagLower === 'bit manipulation') {
          matched = catLower.includes('bit');
        } else if (tagLower === 'heap') {
          matched = catLower.includes('heap');
        } else if (tagLower === 'trie & advanced ds') {
          matched = catLower.includes('trie') || catLower.includes('advanced');
        } else if (tagLower === 'sliding window') {
          matched = catLower.includes('sliding window');
        } else if (tagLower === 'two pointers') {
          matched = catLower.includes('two pointers') || catLower.includes('two pointer');
        } else if (tagLower === 'recursion') {
          matched = catLower.includes('recursion');
        } else {
          matched = catLower.includes(tagLower) || titleLower.includes(tagLower);
        }

        if (matched) {
          counts[tagLower] = (counts[tagLower] || 0) + 1;
        }
      });
    });

    return counts;
  }, [masterProblems]);

  // Live Overall Stats
  const liveDSAStats = useMemo(() => {
    const total = masterProblems.length;
    const solved = masterProblems.filter((p) => p.status === 'Solved').length;
    const easy = masterProblems.filter((p) => p.difficulty === 'Easy');
    const med = masterProblems.filter((p) => p.difficulty === 'Medium');
    const hard = masterProblems.filter((p) => p.difficulty === 'Hard');

    return {
      totalProblems: total,
      userProgress: {
        solved,
        attempted: masterProblems.filter((p) => p.status === 'Attempted').length,
        total,
      },
      difficulty: {
        easy: {
          total: easy.length,
          solved: easy.filter((p) => p.status === 'Solved').length,
        },
        medium: {
          total: med.length,
          solved: med.filter((p) => p.status === 'Solved').length,
        },
        hard: {
          total: hard.length,
          solved: hard.filter((p) => p.status === 'Solved').length,
        },
      },
    };
  }, [masterProblems]);

  // Filtered problems based on active search, subcategory tab, category tag, difficulty, and status
  const filteredProblems = useMemo(() => {
    return masterProblems.filter((p) => {
      // 1. Subcategory Tab Filter
      if (selectedSubTab === 'top150' && !p.inTop150) return false;
      if (selectedSubTab === 'contests' && !p.isSundayContest) return false;
      if (selectedSubTab === 'algorithms' && p.category?.toLowerCase().includes('database')) return false;
      if (selectedSubTab === 'database' && !p.category?.toLowerCase().includes('sql') && !p.category?.toLowerCase().includes('database')) return false;
      if (selectedSubTab === 'javascript' && !p.category?.toLowerCase().includes('js') && !p.category?.toLowerCase().includes('javascript')) return false;
      if (selectedSubTab === 'datastructures' && !['tree', 'graph', 'linked list', 'stack', 'heap', 'matrix', 'array', 'queue', 'hash', 'bst'].some((t) => p.category?.toLowerCase().includes(t))) return false;

      // 1.5. Company Filter (from Trending Companies Top 20)
      if (selectedCompany) {
        const compLower = selectedCompany.toLowerCase();
        const matchesCompany = p.companies?.some((c) => {
          const cLower = c.toLowerCase();
          if (cLower === compLower) return true;
          if (compLower === 'meta' && (cLower === 'facebook' || cLower === 'meta')) return true;
          if (compLower === 'hcltech' && (cLower === 'hcl' || cLower === 'hcl tech' || cLower === 'hcltech')) return true;
          return false;
        });
        if (!matchesCompany) return false;
      }

      // 2. Search Filter (Title, Category, Company, or Serial Number #42 / 42)
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const cleanNum = q.replace(/^#/, '');
        const parsedNum = parseInt(cleanNum, 10);
        const matchesOrder = !isNaN(parsedNum) && (p.order === parsedNum || String(p.order || '').includes(cleanNum));
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesCategory = (p.category || '').toLowerCase().includes(q);
        const matchesCompany = p.companies?.some((c) => c.toLowerCase().includes(q));
        if (!matchesOrder && !matchesTitle && !matchesCategory && !matchesCompany) return false;
      }

      // 3. Category Tag Filter
      if (selectedCategory !== 'All') {
        const catQ = selectedCategory.toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        let matches = false;

        if (catQ === 'array') {
          matches = pCat.includes('array') || pCat.includes('arrays');
        } else if (catQ === 'string') {
          matches = pCat.includes('string') || pCat.includes('strings');
        } else if (catQ === '2d arrays' || catQ === 'matrix') {
          matches = pCat.includes('2d') || pCat.includes('matrix');
        } else if (catQ === 'hash table') {
          matches = pCat.includes('hash') || pCat.includes('hashmap');
        } else if (catQ === 'dynamic programming') {
          matches = pCat.includes('dynamic programming') || pCat.includes('dp');
        } else if (catQ === 'binary trees') {
          matches = pCat.includes('tree') && !pCat.includes('bst') && !pCat.includes('search tree');
        } else if (catQ === 'binary search trees') {
          matches = pCat.includes('bst') || pCat.includes('search tree');
        } else if (catQ === 'graphs') {
          matches = pCat.includes('graph');
        } else if (catQ === 'linked list') {
          matches = pCat.includes('linked list') || pCat.includes('linkedlist');
        } else if (catQ === 'stacks & queues') {
          matches = pCat.includes('stack') || pCat.includes('queue');
        } else if (catQ === 'greedy') {
          matches = pCat.includes('greedy');
        } else if (catQ === 'backtracking') {
          matches = pCat.includes('backtracking');
        } else if (catQ === 'searching & sorting') {
          matches = pCat.includes('search') || pCat.includes('sort') || pCat.includes('binary search');
        } else if (catQ === 'bit manipulation') {
          matches = pCat.includes('bit');
        } else if (catQ === 'heap') {
          matches = pCat.includes('heap');
        } else if (catQ === 'trie & advanced ds') {
          matches = pCat.includes('trie') || pCat.includes('advanced');
        } else if (catQ === 'sliding window') {
          matches = pCat.includes('sliding window');
        } else if (catQ === 'two pointers') {
          matches = pCat.includes('two pointers') || pCat.includes('two pointer');
        } else if (catQ === 'recursion') {
          matches = pCat.includes('recursion');
        } else {
          matches = pCat.includes(catQ);
        }

        if (!matches) return false;
      }

      // 4. Difficulty Filter
      if (selectedDifficulty !== 'All' && p.difficulty !== selectedDifficulty) {
        return false;
      }

      // 5. Status Filter
      if (selectedStatus === 'solved' && p.status !== 'Solved') return false;
      if (selectedStatus === 'attempted' && p.status !== 'Attempted') return false;
      if (selectedStatus === 'unsolved' && p.status === 'Solved') return false;

      return true;
    });
  }, [masterProblems, search, selectedCompany, selectedSubTab, selectedCategory, selectedDifficulty, selectedStatus]);

  // Paginated Problem list
  const totalItems = filteredProblems.length;
  const effectivePageSize = pageSize === -1 ? Math.max(1, totalItems) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProblems = useMemo(() => {
    if (pageSize === -1) return filteredProblems;
    const start = (validCurrentPage - 1) * effectivePageSize;
    return filteredProblems.slice(start, start + effectivePageSize);
  }, [filteredProblems, validCurrentPage, effectivePageSize, pageSize]);

  // ADMIN ACTION: 1-Click Toggle Top 150
  const handleToggleTop150 = (problem: MasterProblemItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isNowAdded = top150Service.toggleTop150({
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      category: problem.category,
      companies: problem.companies,
      points: problem.points,
    });

    if (isNowAdded) {
      success(`Added "${problem.title}" to Top Interview 150 Sheet! ⭐`, 'Top 150 Updated');
    } else {
      toastInfo(`Removed "${problem.title}" from Top Interview 150 Sheet.`, 'Top 150 Updated');
    }
    setDataVersion((v) => v + 1);
  };

  // ADMIN ACTION: Quick Create Problem Form Submit
  const handleAdminCreateProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblemData.title.trim()) {
      toastError('Please enter a problem title.');
      return;
    }

    const finalSlug = (newProblemData.slug || newProblemData.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const companiesArray = newProblemData.companies
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const newId = `custom-p-${Date.now()}`;
    const newProblemItem: MasterProblemItem = {
      id: newId,
      title: newProblemData.title.trim(),
      slug: finalSlug,
      difficulty: newProblemData.difficulty as any,
      category: newProblemData.category,
      supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'typescript'],
      expectedComplexity: { time: 'O(N)', space: 'O(1)' },
      acceptanceRate: parseFloat(newProblemData.acceptanceRate) || 54.0,
      acceptanceRateStr: newProblemData.acceptanceRate || '54.0%',
      totalSubmissions: 1,
      status: 'Unsolved',
      createdAt: new Date().toISOString(),
      inTop150: Boolean(newProblemData.addToTop150),
      isSundayContest: false,
      companies: companiesArray,
      points: Number(newProblemData.points) || 100,
      description: newProblemData.description,
    };

    // Prepend immediately to apiProblems state so all master problem filters & company counters update instantly in real-time
    setApiProblems((prev) => [newProblemItem as any, ...prev]);

    // Persist to backend database
    adminProblemService
      .createProblem({
        title: newProblemData.title.trim(),
        slug: finalSlug,
        difficulty: newProblemData.difficulty,
        category: newProblemData.category,
        description: newProblemData.description || `Practice problem for ${newProblemData.title}`,
        companies: companiesArray,
        isPublished: true,
        constraints: ['1 <= arr.length <= 10^5'],
        testCases: [{ input: 'sample', expectedOutput: 'output', hidden: false }],
        starterCode: { javascript: '// solution', python: '# solution' },
      })
      .then(() => {
        fetchApiProblems();
      })
      .catch((err) => {
        console.warn('Saved problem locally in memory/overrides:', err);
      });

    // 1. Add to Top 150 if checked
    if (newProblemData.addToTop150) {
      top150Service.addProblem({
        title: newProblemData.title.trim(),
        slug: finalSlug,
        difficulty: newProblemData.difficulty,
        category: newProblemData.category,
        companies: companiesArray,
        acceptanceRate: newProblemData.acceptanceRate,
        frequency: 85,
        points: Number(newProblemData.points) || 100,
      });
    }

    success(`Problem "${newProblemData.title}" created with companies [${companiesArray.join(', ')}]! 🚀`, 'Problem Created');
    setIsAdminCreateModalOpen(false);
    setNewProblemData({
      title: '',
      slug: '',
      difficulty: 'Medium',
      category: 'Array / String',
      companies: 'TCS, Infosys, Google, Amazon',
      acceptanceRate: '54.0%',
      points: 200,
      addToTop150: true,
      description: '',
    });
    setDataVersion((v) => v + 1);
  };

  const handleSolveDailyChallenge = () => {
    const dailyStreakProb = sundayContestService.getDailyStreakProblem();
    const targetSlug = dailyStreakProb.slug ? dailyStreakProb.slug.toLowerCase().replace(/\s+/g, '-') : 'two-sum';
    navigate(`/dsa/${encodeURIComponent(targetSlug)}`);
  };

  const handleTagClick = (tag: string) => {
    const nextCategory = selectedCategory.toLowerCase() === tag.toLowerCase() ? 'All' : tag;
    setSelectedCategory(nextCategory);
    setCurrentPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (nextCategory === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', nextCategory);
    }
    setSearchParams(newParams);
  };

  const handleOpenVideo = (problem: IProblemListItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveVideoProblem(problem);
    setIsVideoModalOpen(true);
  };

  const handleCloseVideo = () => {
    setIsVideoModalOpen(false);
    setActiveVideoProblem(null);
  };

  const handlePickRandom = () => {
    if (filteredProblems.length === 0) return;
    const randomIdx = Math.floor(Math.random() * filteredProblems.length);
    const randomProblem = filteredProblems[randomIdx];
    const targetSlug = randomProblem.slug
      ? randomProblem.slug.toLowerCase().replace(/\s+/g, '-')
      : randomProblem.title.toLowerCase().replace(/\s+/g, '-');
    navigate(`/dsa/${encodeURIComponent(targetSlug)}`);
  };

  // Handle company chip selection & URL query synchronization
  const handleSelectCompany = (compName: string) => {
    const nextComp = selectedCompany.toLowerCase() === compName.toLowerCase() ? '' : compName;
    setSelectedCompany(nextComp);
    setCurrentPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (nextComp) {
      newParams.set('company', nextComp);
    } else {
      newParams.delete('company');
    }
    setSearchParams(newParams);
  };

  // Dynamic problem counts for each Top 20 company directly calculated from masterProblems (100% synchronized)
  const dynamicTrendingCompanies = useMemo(() => {
    return TOP_20_TRENDING_COMPANIES.map((name) => {
      const lower = name.toLowerCase();
      const count = masterProblems.filter((p) =>
        p.companies?.some((c) => {
          const cLower = c.toLowerCase();
          if (cLower === lower) return true;
          if (lower === 'meta' && (cLower === 'facebook' || cLower === 'meta')) return true;
          if (lower === 'hcltech' && (cLower === 'hcl' || cLower === 'hcl tech' || cLower === 'hcltech')) return true;
          return false;
        })
      ).length;
      return { name, count };
    }).sort((a, b) => b.count - a.count);
  }, [masterProblems]);

  // Filtered companies for sidebar search
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return dynamicTrendingCompanies;
    return dynamicTrendingCompanies.filter((c) =>
      c.name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [dynamicTrendingCompanies, companySearch]);

  // Displayed companies (supports expandable show all/less)
  const displayedCompanies = useMemo(() => {
    if (companySearch.trim() || isAllCompaniesExpanded) {
      return filteredCompanies;
    }
    return filteredCompanies.slice(0, 14);
  }, [filteredCompanies, companySearch, isAllCompaniesExpanded]);

  // Mini Calendar calculations
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'short' });
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-800 dark:text-slate-200 antialiased font-sans pb-16">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 1. TOP CAROUSEL FEATURE BANNERS (PURPOSE-DRIVEN DISTINCT THEMES) */}
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pb-2 no-scrollbar snap-x items-stretch">
          {/* Card 1: Monthly Grand Contest - ROYAL PURPLE & GOLD PRESTIGE */}
          <Link
            to={ROUTES.MONTHLY_CONTEST}
            className="group relative p-4 rounded-2xl bg-gradient-to-br from-purple-100/70 via-indigo-50/60 to-violet-100/50 dark:from-[#180e29] dark:via-[#140c24] dark:to-[#0c0817] border border-purple-300/80 dark:border-purple-500/40 hover:border-purple-400 dark:hover:border-amber-400/70 flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-xs hover:shadow-md dark:hover:shadow-[0_8px_30px_rgba(168,85,247,0.25)] active:scale-[0.98] h-full min-h-[148px] min-w-[280px] xs:min-w-[300px] sm:min-w-0 snap-center shrink-0 sm:shrink"
          >
            {/* Top Accent Radiant Golden-Purple Glow Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-500" />
            
            {/* Dual Ambient Background Glow Orbs */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 dark:bg-purple-600/25 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute -left-6 -top-6 w-20 h-20 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="space-y-1.5 z-10">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-amber-400">
                  <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Grand Championship
                </span>
                <span className="text-amber-800 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-500/20 px-2 py-0.5 rounded-full font-bold border border-amber-400/40 text-[10px]">
                  3,300+ 🪙 Pool
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-amber-300 transition-colors">
                NEC Grand Championship
              </h3>
              <p className="text-xs text-slate-600 dark:text-purple-200/70 line-clamp-1">
                4 stages, 18 curated challenges, 72h sprint & 1,800 🪙 champion bounty.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between z-10 border-t border-purple-200/70 dark:border-purple-800/40 mt-2">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-200 bg-purple-100/90 dark:bg-purple-900/60 px-2.5 py-0.5 rounded-md border border-purple-300/80 dark:border-purple-500/40 font-mono">
                18 Challenges
              </span>

              <button
                type="button"
                onClick={handleJoinMonthlyContest}
                title={monthlyContestAttempt.status === 'in_progress' ? 'Resume Monthly Contest' : 'Join Monthly Contest'}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 active:scale-95 text-white font-extrabold text-xs font-mono shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center gap-1.5 cursor-pointer z-20"
              >
                <Play className="w-3 h-3 fill-current text-amber-300" />
                <span>Join Contest</span>
              </button>
            </div>
          </Link>

          {/* Card 2: Daily Streak Hub - FIERY BLAZE ORANGE */}
          <Link
            to={ROUTES.DAILY_STREAK}
            className="group relative p-4 rounded-2xl bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-rose-50/30 dark:from-[#2a1407] dark:via-[#1f1107] dark:to-[#140b05] border border-orange-200/90 dark:border-orange-500/30 hover:border-orange-400 dark:hover:border-orange-400/60 flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-xs hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(249,115,22,0.18)] active:scale-98 h-full min-h-[148px] min-w-[280px] xs:min-w-[300px] sm:min-w-0 snap-center shrink-0 sm:shrink"
          >
            {/* Top Accent Glow Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500" />
            
            {/* Ambient Background Glow Orb */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="space-y-1.5 z-10">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 font-bold text-orange-700 dark:text-orange-300">
                  <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" /> Daily Streak Hub
                </span>
                <span className="text-[10px] bg-orange-500/15 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold border border-orange-400/30">
                  +1 🪙 Daily
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                Problem Of The Day
              </h3>
              <p className="text-xs text-slate-600 dark:text-orange-200/70 line-clamp-1">
                Maintain consistency, solve daily & unlock 7-day bonuses.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between z-10 border-t border-orange-200/50 dark:border-orange-900/30 mt-2">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-md border border-emerald-300/60 dark:border-emerald-500/30 flex items-center gap-1">
                Day {wallet.dailyStreak}/7 🔥
              </span>
              <span className="text-xs font-bold text-orange-700 dark:text-orange-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Solve Today &rarr;
              </span>
            </div>
          </Link>

          {/* Card 3: Top Interview 150 - CYBER CYAN & TECH INDIGO */}
          <Link
            to={ROUTES.TOP_INTERVIEW_150}
            className="group relative p-4 rounded-2xl bg-gradient-to-br from-cyan-50/90 via-sky-50/40 to-blue-50/30 dark:from-[#091b29] dark:via-[#091621] dark:to-[#050e16] border border-cyan-200/90 dark:border-cyan-500/30 hover:border-cyan-400 dark:hover:border-cyan-400/60 flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-xs hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(6,182,212,0.18)] active:scale-98 h-full min-h-[148px] min-w-[280px] xs:min-w-[300px] sm:min-w-0 snap-center shrink-0 sm:shrink"
          >
            {/* Top Accent Glow Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500" />
            
            {/* Ambient Background Glow Orb */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="space-y-1.5 z-10">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 font-bold text-cyan-700 dark:text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500/30" /> Curated Sheet
                </span>
                <span className="text-[10px] bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-full font-bold border border-cyan-400/30">
                  {top150Service.getProblems().length} Problems
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                Top Interview 150
              </h3>
              <p className="text-xs text-slate-600 dark:text-cyan-200/70 line-clamp-1">
                Must-do coding patterns for FAANG & top tier companies.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between z-10 border-t border-cyan-200/50 dark:border-cyan-900/30 mt-2">
              <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-100/80 dark:bg-cyan-900/40 px-2.5 py-0.5 rounded-md border border-cyan-300/60 dark:border-cyan-500/30">
                FAANG Roadmap
              </span>
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Sheet &rarr;
              </span>
            </div>
          </Link>

          {/* Card 4: Weekly Contest - RADIANT AMBER & GOLD */}
          <Link
            to={ROUTES.CONTEST}
            className="group relative p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-orange-50/30 dark:from-[#261c08] dark:via-[#1c1507] dark:to-[#120d04] border border-amber-200/90 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-400/60 flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-xs hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(245,158,11,0.18)] active:scale-98 h-full min-h-[148px] min-w-[280px] xs:min-w-[300px] sm:min-w-0 snap-center shrink-0 sm:shrink"
          >
            {/* Top Accent Glow Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500" />
            
            {/* Ambient Background Glow Orb */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="space-y-1.5 z-10">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                  <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" /> Weekly Contest
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
                  Win 100 🪙
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                Sunday Contest #{sundayContestService.getConfig().contestNumber}
              </h3>
              <p className="text-xs text-slate-600 dark:text-amber-200/70 line-clamp-1">
                2 challenges, 90 mins, earn 100 NEC coins + prizes.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between z-10 border-t border-amber-200/50 dark:border-amber-900/30 mt-2">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-500/30 font-bold">
                1st Prize: 100 Coins
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Join Contest &rarr;
              </span>
            </div>
          </Link>
        </div>

        {/* 2. ADMIN CURATION TOOLBAR (Visible when user is Admin) */}
        {(isAdmin || user?.role === 'admin') && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50 via-white to-amber-50 dark:from-cyan-950/40 dark:via-[#1c2430] dark:to-amber-950/30 border border-cyan-300 dark:border-cyan-500/40 shadow-sm dark:shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-300 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    🛡️ ADMIN PROBLEMSET & TRACK CURATION
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40">
                    Live Control Mode
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-300">
                  Total Problemset: <strong className="text-slate-900 dark:text-white font-mono">{masterProblems.length}</strong> &bull; Top 150: <strong className="text-cyan-600 dark:text-cyan-300 font-mono">{top150Service.getProblems().length}</strong> &bull; Sunday Contests: <strong className="text-yellow-600 dark:text-yellow-300 font-mono">2</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsAdminCreateModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Problem</span>
              </button>

              <Link
                to={ROUTES.TOP_INTERVIEW_150}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:hover:bg-[#333333] text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                <span>Manage Top 150</span>
              </Link>

              <Link
                to={ROUTES.ADMIN_MONTHLY_CONTEST}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:hover:bg-[#333333] text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Manage Monthly Contest</span>
              </Link>

              <Link
                to={ROUTES.ADMIN_CONTEST}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:hover:bg-[#333333] text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                <span>Contest Hub</span>
              </Link>

              <Link
                to={ROUTES.ADMIN_DUELS}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:hover:bg-[#333333] text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
              >
                <Swords className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span>Manage 1vs1 Duels</span>
              </Link>
            </div>
          </div>
        )}

        {/* 3. TOPIC TAGS HORIZONTAL PILL BAR (LeetCode 1:1 Clean Tags) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <div className="flex items-center gap-2 flex-wrap">
              {CORE_TOPIC_TAGS.slice(0, isTagsExpanded ? CORE_TOPIC_TAGS.length : 10).map((tag) => {
                const count = dynamicTagCounts[tag.toLowerCase()] || 0;
                const isSelected = selectedCategory.toLowerCase() === tag.toLowerCase();

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                      isSelected
                        ? 'bg-brand-600 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-sm'
                        : 'bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 hover:bg-slate-300 dark:hover:bg-[#333333] hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <span>{tag}</span>
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1.5 py-0.2 rounded-full',
                        isSelected ? 'bg-white/20 dark:bg-neutral-200 text-white dark:text-neutral-900' : 'bg-slate-300 dark:bg-[#3a3a3a] text-slate-700 dark:text-neutral-400'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              {/* Expand / Collapse Button */}
              <button
                type="button"
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white bg-slate-200 hover:bg-slate-300 dark:bg-[#262626] dark:hover:bg-[#333333] transition-colors cursor-pointer"
              >
                <span>{isTagsExpanded ? 'Collapse' : 'Expand'}</span>
                {isTagsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* 4. SUBCATEGORY NAVIGATION PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium border-b border-slate-200 dark:border-neutral-800">
            {SUB_CATEGORIES.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedSubTab === tab.id;
              return (
                <div key={tab.id} className="inline-flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubTab(tab.id);
                      setCurrentPage(1);
                      const newParams = new URLSearchParams(searchParams);
                      if (tab.id === 'all') {
                        newParams.delete('tab');
                        setSelectedCategory('All');
                      } else {
                        newParams.set('tab', tab.id);
                      }
                      setSearchParams(newParams);
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer group',
                      isActive
                        ? 'bg-white dark:bg-[#2a2a2a] text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 font-semibold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#222222]'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-neutral-500')} />
                    <span>
                      {tab.label}
                      {tab.id === 'all' && ` (${masterProblems.length})`}
                    </span>
                  </button>
                </div>
              );
            })}

            {/* Highlighted Shortcut: Open Saved Lists Hub (After Sunday Contest & JavaScript) */}
            <div className="inline-flex items-center shrink-0 ml-1">
              <Link
                to={ROUTES.BOOKMARKS}
                title="Open your Saved Problem Lists Hub (Favorites, Revise Later, Hard Questions)"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-400/80 dark:border-amber-500/50 shadow-xs hover:shadow-md hover:shadow-amber-500/15 transition-all cursor-pointer active:scale-95 group"
              >
                <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500/30 group-hover:scale-110 transition-transform" />
                <span>Open Saved Lists Hub</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Highlighted Shortcut: Community Posts & Doubts Hub (After JavaScript & Open Saved Lists Hub) */}
            <div className="inline-flex items-center shrink-0 ml-1">
              <Link
                to={ROUTES.COMMUNITY}
                title="Community Posts, Doubts & Reviews Hub"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs bg-brand-500/15 hover:bg-brand-500/25 text-brand-700 dark:text-brand-300 border border-brand-400/80 dark:border-brand-500/50 shadow-xs hover:shadow-md hover:shadow-brand-500/15 transition-all cursor-pointer active:scale-95 group"
              >
                <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform" />
                <span>Community & Doubts Hub</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* 5. MAIN WORKSPACE: PROBLEM LIST (LEFT 8/12) + SIDEBAR WIDGETS (RIGHT 4/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 8 COLS: TOOLBAR + PROBLEM LIST */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Toolbar: Search, Difficulty, Status, Page Size, Shuffle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#262626] p-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 dark:text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search from ${masterProblems.length || '1,000'}+ questions, topics, companies...`}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-neutral-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-brand-500"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Difficulty Filter Dropdown */}
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    setSelectedDifficulty(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-neutral-700/80 text-xs font-mono text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="All">Difficulty: All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                {/* Status Filter Dropdown */}
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-neutral-700/80 text-xs font-mono text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-brand-500 hidden md:block cursor-pointer"
                >
                  <option value="all">Status: All</option>
                  <option value="solved">Solved</option>
                  <option value="unsolved">Unsolved</option>
                </select>

                {/* Page Size Selector */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-neutral-700/80 text-xs font-mono text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-brand-500 hidden sm:block cursor-pointer"
                  title="Items per page"
                >
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                  <option value={-1}>All ({masterProblems.length})</option>
                </select>
              </div>

              {/* Progress & Shuffle Action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs font-mono">
                <span className="text-slate-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {liveDSAStats.userProgress.solved} / {liveDSAStats.totalProblems} Solved
                </span>

                <button
                  type="button"
                  onClick={handlePickRandom}
                  title="Pick a random challenge"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1a1a] dark:hover:bg-[#333333] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-neutral-700/80 transition-colors flex items-center gap-1.5 text-xs cursor-pointer active:scale-95"
                >
                  <Shuffle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Pick One</span>
                </button>

                <Link
                  to={ROUTES.DUELS}
                  title="Enter NEC Live Coding Battles Arena"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-sm shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>NEC battle</span>
                </Link>
              </div>
            </div>

            {/* Subcategory Banner Indicators */}
            {selectedSubTab === 'top150' && (
              <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/40 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Showing <strong>NEC DSA Sheet (Top 150)</strong> ({filteredProblems.length} questions)</span>
                </div>
                <Link
                  to={ROUTES.TOP_INTERVIEW_150}
                  className="text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-200 underline font-semibold flex items-center gap-1"
                >
                  <span>Open Full Study Plan</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {selectedSubTab === 'contests' && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/40 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Showing <strong>Sunday Contest Challenge Set</strong> ({filteredProblems.length} questions)</span>
                </div>
                <Link
                  to={ROUTES.CONTEST}
                  className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline font-semibold flex items-center gap-1"
                >
                  <span>Enter Contest Arena</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Topic Tutorial Spotlight Banners for Algorithms, Data Structures, Database / SQL, JavaScript */}
            {selectedSubTab === 'algorithms' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50/40 dark:from-[#1b132a] dark:via-[#141427] dark:to-[#0f172a] border border-purple-200/80 dark:border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 dark:bg-purple-500/25 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/20">
                        Tutorial Guide Available
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Algorithms & Complexity Analysis
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                      Master Time/Space Complexity, Divide & Conquer, Dynamic Programming, and Graph Traversals with visual diagrams.
                    </p>
                  </div>
                </div>
                <Link
                  to={`${ROUTES.TUTORIALS}?track=dsa`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 transition-all shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Algo Tutorial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {selectedSubTab === 'datastructures' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-cyan-50/50 to-indigo-50/40 dark:from-[#0d1c29] dark:via-[#0c1825] dark:to-[#0c1220] border border-blue-200/80 dark:border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 dark:bg-blue-500/25 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/20">
                        Tutorial Guide Available
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Data Structures Blueprint & Visual Memory
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                      Deep-dive into Arrays, Linked Lists, Binary Trees, Heaps, Hash Tables, and Trie structures before solving.
                    </p>
                  </div>
                </div>
                <Link
                  to={`${ROUTES.TUTORIALS}?track=dsa`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open DSA Tutorial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {selectedSubTab === 'database' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-cyan-50/40 dark:from-[#0d2319] dark:via-[#0c1e19] dark:to-[#081515] border border-emerald-200/80 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        Tutorial Guide Available
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        SQL & Relational Database Engineering
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                      Master Subqueries, Window Functions, Aggregate Joins, Group By, Indexes, and ACID transactions.
                    </p>
                  </div>
                </div>
                <Link
                  to={`${ROUTES.TUTORIALS}?track=sql`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-all shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open SQL Tutorial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {selectedSubTab === 'javascript' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50/50 to-orange-50/40 dark:from-[#241e0b] dark:via-[#1c180a] dark:to-[#141106] border border-amber-200/80 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/20">
                        Tutorial Guide Available
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        JavaScript & Modern Web Foundations
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                      Read in-depth theory on Closures, Promises, Event Loop, Prototypes, Array methods, and TypeScript fundamentals.
                    </p>
                  </div>
                </div>
                <Link
                  to={`${ROUTES.TUTORIALS}?track=javascript`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 transition-all shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open JS Tutorial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}



            {/* Active Company Filter Indicator */}
            {selectedCompany && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#131d2c] dark:to-[#171b2e] border border-blue-200 dark:border-cyan-800/60 flex items-center justify-between text-xs font-mono shadow-xs">
                <div className="flex items-center gap-2 text-blue-900 dark:text-cyan-200">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <span>
                    Interview Questions asked at <strong className="text-blue-700 dark:text-cyan-300 font-bold">{selectedCompany}</strong>{' '}
                    ({filteredProblems.length} {filteredProblems.length === 1 ? 'problem' : 'problems'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectCompany('')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 text-blue-700 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-neutral-700 border border-blue-200 dark:border-neutral-700 font-semibold text-[11px] transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <X className="w-3 h-3" /> Clear Filter
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && masterProblems.length === 0 && (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#222222] border border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3 bg-slate-200 dark:bg-[#2a2a2a]" />
                      <Skeleton className="h-3 w-1/5 bg-slate-200 dark:bg-[#2a2a2a]" />
                    </div>
                    <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-[#2a2a2a] rounded-md" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!loading && error && masterProblems.length === 0 && (
              <ErrorState
                title="Error Loading Problemset"
                message={error}
                onRetry={() => fetchApiProblems()}
              />
            )}

            {/* Problem List Table (LeetCode Clean Zebra Table) */}
            {masterProblems.length > 0 && paginatedProblems.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#222222] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 font-mono text-[11px] bg-slate-100 dark:bg-[#1d1d1d]">
                        <th className="py-3 px-3.5 w-10 text-center">Status</th>
                        <th className="py-3 px-3.5">Title</th>
                        <th className="py-3 px-3 text-center hidden md:table-cell">Solution</th>
                        <th className="py-3 px-3 text-center hidden sm:table-cell">Acceptance</th>
                        <th className="py-3 px-3.5 text-center">Difficulty</th>
                        {(isAdmin || user?.role === 'admin') && (
                          <th className="py-3 px-3.5 text-center bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 font-bold border-l border-slate-200 dark:border-neutral-800">
                            🛡️ Admin Track Controls
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                      {/* Main Paginated Problem Rows */}
                      {paginatedProblems.map((p, index) => {
                        const problemNumber = (typeof p.order === 'number' && p.order > 0)
                          ? p.order
                          : ((validCurrentPage - 1) * effectivePageSize + index + 1);
                        const formattedRowNumber = String(problemNumber).padStart(2, '0');
                        const cleanTitle = (p.title || '').replace(/^\d+\.\s*/, '');
                        const isEven = index % 2 === 0;

                        return (
                          <tr
                            key={p.slug || p.id}
                            className={cn(
                              'transition-colors group',
                              isEven ? 'bg-white dark:bg-[#222222]' : 'bg-slate-50/70 dark:bg-[#1e1e1e]',
                              'hover:bg-blue-50/50 dark:hover:bg-[#2a2a2a]'
                            )}
                          >
                            {/* Status */}
                            <td className="py-3 px-3.5 text-center">
                              {p.status === 'Solved' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                              ) : p.status === 'Attempted' ? (
                                <Clock className="w-4 h-4 text-amber-500 inline" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-neutral-600 inline" />
                              )}
                            </td>

                            {/* Title (Clean LeetCode / GFG Style without inline track badges) */}
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/dsa/${encodeURIComponent(p.slug)}`}
                                  className="font-semibold text-slate-800 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                                >
                                  <span>{formattedRowNumber}. {cleanTitle}</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveBookmarkProblem({
                                      slug: p.slug,
                                      title: p.title,
                                      difficulty: p.difficulty,
                                      category: p.category,
                                    });
                                    setIsBookmarkModalOpen(true);
                                  }}
                                  className={cn(
                                    "p-1 rounded-md transition-all cursor-pointer shrink-0",
                                    bookmarkService.isProblemBookmarked(p.slug)
                                      ? "text-amber-500 opacity-100 hover:text-amber-600"
                                      : "text-slate-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-[#333333]"
                                  )}
                                  title={
                                    bookmarkService.isProblemBookmarked(p.slug)
                                      ? `Saved in: ${bookmarkService.getProblemListNames(p.slug).join(', ')} (Click to manage)`
                                      : "Bookmark problem into list"
                                  }
                                >
                                  <Bookmark
                                    className={cn(
                                      "w-3.5 h-3.5",
                                      bookmarkService.isProblemBookmarked(p.slug) && "fill-amber-500 text-amber-500"
                                    )}
                                  />
                                </button>
                              </div>

                              {/* Subtle Category & Company tags */}
                              <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500 dark:text-neutral-500 font-mono">
                                <span>{p.category}</span>
                                {p.companies && p.companies.length > 0 && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="truncate max-w-[340px]">
                                      {selectedCompany && p.companies.some((c) => c.toLowerCase() === selectedCompany.toLowerCase())
                                        ? [
                                            selectedCompany,
                                            ...p.companies.filter((c) => c.toLowerCase() !== selectedCompany.toLowerCase()),
                                          ]
                                            .slice(0, 3)
                                            .join(', ')
                                        : p.companies.slice(0, 3).join(', ')}
                                      {p.companies.length > 3 && ` +${p.companies.length - 3}`}
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* YouTube Video Editorial Link */}
                            <td className="py-3 px-3 text-center hidden md:table-cell">
                              {p.youtubeUrl ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenVideo(p, e)}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 transition-all cursor-pointer"
                                  title="Watch Video Editorial"
                                >
                                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              ) : (
                                <Link
                                  to={`/dsa/${encodeURIComponent(p.slug)}`}
                                  className="text-[11px] font-mono text-slate-400 hover:text-blue-600 dark:text-neutral-500 dark:hover:text-cyan-400"
                                >
                                  Code &rarr;
                                </Link>
                              )}
                            </td>

                            {/* Acceptance Rate */}
                            <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-neutral-400 hidden sm:table-cell">
                              {p.acceptanceRateStr || `${p.acceptanceRate}%`}
                            </td>

                            {/* Difficulty */}
                            <td className="py-3 px-3.5 text-center font-semibold">
                              <span
                                className={cn(
                                  'text-xs font-mono',
                                  p.difficulty === 'Easy'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : p.difficulty === 'Medium'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                )}
                              >
                                {p.difficulty === 'Medium' ? 'Med.' : p.difficulty}
                              </span>
                            </td>

                            {/* ADMIN CONTROLS COLUMN (Add/Remove from Top 150) */}
                            {(isAdmin || user?.role === 'admin') && (
                              <td className="py-2.5 px-3.5 text-center border-l border-slate-200 dark:border-neutral-800 bg-cyan-50/50 dark:bg-cyan-950/10">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {/* Top 150 1-Click Toggle */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleTop150(p, e)}
                                    className={cn(
                                      'px-2 py-0.8 rounded-md text-[10.5px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95',
                                      p.inTop150
                                        ? 'bg-cyan-100 hover:bg-rose-100 dark:bg-cyan-500/20 dark:hover:bg-rose-500/25 text-cyan-700 hover:text-rose-700 dark:text-cyan-300 dark:hover:text-rose-300 border border-cyan-300 hover:border-rose-300 dark:border-cyan-500/40 dark:hover:border-rose-500/40'
                                        : 'bg-slate-100 hover:bg-cyan-100 dark:bg-[#2a2a2a] dark:hover:bg-cyan-500/20 text-slate-600 hover:text-cyan-700 dark:text-neutral-400 dark:hover:text-cyan-300 border border-slate-300 hover:border-cyan-300 dark:border-neutral-700 dark:hover:border-cyan-500/30'
                                    )}
                                    title={p.inTop150 ? 'Click to Remove from Top 150' : 'Click to Add to Top 150'}
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>{p.inTop150 ? '⭐ In Top 150' : '+ Top 150'}</span>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-3.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#1e1e1e] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-600 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing {(validCurrentPage - 1) * effectivePageSize + 1} to{' '}
                      {Math.min(validCurrentPage * effectivePageSize, totalItems)} of {totalItems} questions
                    </span>
                    {filteredProblems.length !== masterProblems.length && (
                      <span className="text-slate-400 dark:text-neutral-500">
                        (filtered from {masterProblems.length} total)
                      </span>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={validCurrentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="bg-white dark:bg-[#2a2a2a] border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white"
                        leftIcon={<ChevronLeft className="w-4 h-4" />}
                      >
                        Prev
                      </Button>

                      <span className="px-2 font-bold text-slate-800 dark:text-neutral-200">
                        Page {validCurrentPage} of {totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={validCurrentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="bg-white dark:bg-[#2a2a2a] border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white"
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredProblems.length === 0 && (
              <EmptyState
                icon={<Code2 className="w-8 h-8 text-slate-400 dark:text-neutral-500" />}
                title="No Questions Found"
                description={`No questions match the search "${search || selectedCategory}".`}
                actionLabel="Reset Filter"
                onAction={() => {
                  setSearch('');
                  handleTagClick('All');
                  setSelectedDifficulty('All');
                  setSelectedStatus('all');
                  setSelectedSubTab('all');
                }}
              />
            )}
          </div>

          {/* RIGHT 4 COLS: CALENDAR (SCROLLS PAST) + STICKY PROGRESS & TRENDING COMPANIES */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Widget 1: Interactive Monthly Calendar / Daily Challenge (Scrolls with page) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#222222] border border-slate-200 dark:border-neutral-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Link
                  to={ROUTES.DAILY_STREAK}
                  className="flex items-center gap-2 group cursor-pointer hover:text-emerald-500 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase font-mono group-hover:text-emerald-500 transition-colors">
                    Day {currentDay} &bull; {currentMonthName} 2026
                  </h3>
                </Link>
                <Link
                  to={ROUTES.DAILY_STREAK}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/20 transition-colors cursor-pointer"
                >
                  <Flame className="w-3 h-3 text-emerald-500" /> Day {wallet.dailyStreak} Streak &rarr;
                </Link>
              </div>

              {/* Mini Calendar Grid */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-7 text-center text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                  <span>S</span>
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                </div>
                <div className="grid grid-cols-7 text-center text-xs font-mono gap-1">
                  {[...Array(firstDayIndex)].map((_, i) => (
                    <span key={`empty-${i}`} className="py-1 text-slate-300 dark:text-neutral-700">
                      -
                    </span>
                  ))}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const isToday = day === currentDay;
                    const isPast = day < currentDay;

                    const isTodaySolved = isToday && Boolean(wallet.claimedToday);
                    const isPastSolved = isPast && (currentDay - day < (wallet.dailyStreak || 0));
                    const isSolved = isTodaySolved || isPastSolved;

                    return (
                      <Link
                        key={day}
                        to={ROUTES.DAILY_STREAK}
                        className={cn(
                          'py-1 rounded-md text-[11px] flex flex-col items-center justify-center transition-colors font-mono cursor-pointer',
                          isSolved
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-500/40'
                            : isToday
                            ? 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-400 dark:border-emerald-500/60 ring-2 ring-emerald-400/40 animate-pulse'
                            : isPast
                            ? 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#2e2e2e]'
                            : 'text-slate-400 dark:text-neutral-600'
                        )}
                        title={
                          isSolved
                            ? `Day ${day}: Solved ✓`
                            : isToday
                            ? `Day ${day}: Today's Challenge (${wallet.claimedToday ? 'Solved' : 'Pending'})`
                            : `Day ${day}: Past Day`
                        }
                      >
                        <span>{day}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* View Full Daily Streak Hub Link */}
              <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-neutral-400">Problem Of The Day</span>
                <Link
                  to={ROUTES.DAILY_STREAK}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Open Hub</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* STICKY SECTION: Starts at Daily Coding Streak and stays in view while scrolling problems */}
            <div className="lg:sticky lg:top-20 space-y-4">
              
              {/* Daily Challenge & Coding Streak Banner */}
              {wallet.claimedToday ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-[#1c2420] dark:to-[#141a17] border border-emerald-300 dark:border-emerald-500/40 shadow-sm dark:shadow-lg dark:shadow-emerald-950/20 space-y-2.5 text-xs transition-all">
                  <div className="flex items-center justify-between">
                    <Link
                      to={ROUTES.DAILY_STREAK}
                      className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <Flame className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                      <span>Daily Coding Streak</span>
                    </Link>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/40">
                      <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Day {wallet.dailyStreak}/7 &bull; Locked</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        Today's Reward Secured (+1🪙)
                      </span>
                      <span className="text-[9.5px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">
                        Claimed ✓
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-600 dark:text-neutral-300 leading-snug">
                      Daily streak reward claimed for today! Next reward unlocks tomorrow at midnight.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-neutral-800/90 text-[11px] font-mono">
                    <span className="text-slate-600 dark:text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                      Next Reward Unlocks:
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
                      {timeUntilUnlock.formatted}
                    </span>
                  </div>

                  <div className="pt-0.5 flex items-center gap-2">
                    <Link
                      to={ROUTES.DAILY_STREAK}
                      className="flex-1 py-1.5 px-2.5 rounded-lg font-bold text-[11px] font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40 text-center transition-colors"
                    >
                      <span>⚡ Daily Streak Hub</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleSolveDailyChallenge}
                      className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:hover:bg-[#333333] text-slate-800 dark:text-neutral-200 font-semibold text-[11px] border border-slate-300 dark:border-neutral-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Practice More</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/70 to-white dark:from-emerald-950/40 dark:via-[#13231b] dark:to-[#0e1914] border border-emerald-300 dark:border-emerald-500/40 space-y-2 text-xs shadow-sm dark:shadow-lg dark:shadow-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <Link
                      to={ROUTES.DAILY_STREAK}
                      className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 hover:underline"
                    >
                      <Flame className="w-4 h-4 text-emerald-500 fill-emerald-500 animate-pulse" />
                      <span>Daily Coding Streak</span>
                    </Link>
                    <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/40">
                      Day {wallet.dailyStreak}/7 🔥
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Solve today's Daily Streak Problem to maintain your streak and earn +1 NEC Coin for your wallet!
                  </p>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-neutral-800/80 text-[10.5px] font-mono">
                    <span className="text-slate-600 dark:text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      Today's window resets in:
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                      {timeUntilUnlock.formatted}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      to={ROUTES.DAILY_STREAK}
                      className="flex-1 py-1.5 px-2.5 rounded-lg font-bold text-[11px] transition-all font-mono cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1"
                    >
                      <span>⚡ Daily Streak Hub</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleSolveDailyChallenge}
                      className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-semibold text-[11px] border border-slate-300 dark:border-neutral-700 hover:border-emerald-400/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Solve Challenge
                    </button>
                  </div>
                </div>
              )}
              {/* Widget 2: Session Progress & Solved Breakdown (158+ Problem Scale) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#222222] border border-slate-200 dark:border-neutral-800 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-neutral-300 uppercase font-mono">
                    Master Problemset Progress
                  </h3>
                  <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                    {liveDSAStats.userProgress.solved} / {liveDSAStats.totalProblems} Solved
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  {/* Easy Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-700 dark:text-neutral-300">
                      <span className="text-emerald-600 dark:text-emerald-400">Easy</span>
                      <span>
                        {liveDSAStats.difficulty.easy.solved} / {liveDSAStats.difficulty.easy.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${
                            liveDSAStats.difficulty.easy.total > 0
                              ? (liveDSAStats.difficulty.easy.solved / liveDSAStats.difficulty.easy.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Medium Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-700 dark:text-neutral-300">
                      <span className="text-amber-600 dark:text-amber-400">Medium</span>
                      <span>
                        {liveDSAStats.difficulty.medium.solved} / {liveDSAStats.difficulty.medium.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{
                          width: `${
                            liveDSAStats.difficulty.medium.total > 0
                              ? (liveDSAStats.difficulty.medium.solved / liveDSAStats.difficulty.medium.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Hard Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-700 dark:text-neutral-300">
                      <span className="text-rose-600 dark:text-rose-400">Hard</span>
                      <span>
                        {liveDSAStats.difficulty.hard.solved} / {liveDSAStats.difficulty.hard.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{
                          width: `${
                            liveDSAStats.difficulty.hard.total > 0
                              ? (liveDSAStats.difficulty.hard.solved / liveDSAStats.difficulty.hard.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 3: Trending Companies (LeetCode Style) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#222222] border border-slate-200 dark:border-neutral-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-neutral-300">
                    <Building2 className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                    <h3 className="text-xs font-bold uppercase font-mono">Trending Companies</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 font-semibold border border-slate-200 dark:border-neutral-700/80">
                      Top {dynamicTrendingCompanies.length}
                    </span>
                  </div>
                  {selectedCompany && (
                    <button
                      type="button"
                      onClick={() => handleSelectCompany('')}
                      className="text-[10px] font-mono font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search top companies (e.g. TCS, Infosys, Google)..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-neutral-700/80 text-[11px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1 max-h-72 overflow-y-auto pr-1">
                  {displayedCompanies.length === 0 ? (
                    <div className="w-full text-center py-3 text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                      No companies match "{companySearch}".
                    </div>
                  ) : (
                    displayedCompanies.map((comp) => {
                      const isSelected = selectedCompany.toLowerCase() === comp.name.toLowerCase();
                      return (
                        <button
                          key={comp.name}
                          type="button"
                          onClick={() => handleSelectCompany(comp.name)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer select-none active:scale-95',
                            isSelected
                              ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-xs ring-2 ring-blue-400 dark:ring-cyan-300'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#2e2e2e] dark:hover:bg-[#383838] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-neutral-700/60'
                          )}
                          title={
                            isSelected
                              ? `Click to clear ${comp.name} filter`
                              : `Filter ${comp.count} problems asked at ${comp.name}`
                          }
                        >
                          <span>{comp.name}</span>
                          <span
                            className={cn(
                              'text-[9px] px-1 py-0.2 rounded font-bold transition-colors',
                              isSelected
                                ? 'bg-white/20 text-white dark:text-slate-950'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            )}
                          >
                            {comp.count}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {!companySearch.trim() && filteredCompanies.length > 14 && (
                  <button
                    type="button"
                    onClick={() => setIsAllCompaniesExpanded(!isAllCompaniesExpanded)}
                    className="w-full text-center py-1 text-[11px] font-mono font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer border-t border-slate-100 dark:border-neutral-800 pt-2"
                  >
                    {isAllCompaniesExpanded ? '▲ Show Less' : `▼ Show All (${filteredCompanies.length} Companies)`}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ADMIN QUICK CREATE PROBLEM MODAL */}
      <Modal
        isOpen={isAdminCreateModalOpen}
        onClose={() => setIsAdminCreateModalOpen(false)}
        title="➕ Add New Problem to Master Catalog"
        maxWidth="lg"
      >
        <form onSubmit={handleAdminCreateProblem} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold">Problem Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Trapping Rain Water"
                value={newProblemData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setNewProblemData((prev) => ({
                    ...prev,
                    title,
                    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                  }));
                }}
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold">URL Slug *</label>
              <input
                type="text"
                required
                placeholder="e.g. trapping-rain-water"
                value={newProblemData.slug}
                onChange={(e) => setNewProblemData({ ...newProblemData, slug: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold">Difficulty</label>
              <select
                value={newProblemData.difficulty}
                onChange={(e) => setNewProblemData({ ...newProblemData, difficulty: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold">Category</label>
              <input
                type="text"
                placeholder="Array / String"
                value={newProblemData.category}
                onChange={(e) => setNewProblemData({ ...newProblemData, category: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold">XP / Coins Points</label>
              <input
                type="number"
                value={newProblemData.points}
                onChange={(e) => setNewProblemData({ ...newProblemData, points: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-300 font-bold">Target Companies (comma separated)</label>
            <input
              type="text"
              placeholder="Google, Amazon, Meta, Microsoft"
              value={newProblemData.companies}
              onChange={(e) => setNewProblemData({ ...newProblemData, companies: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Quick Track Inclusion Toggles */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Track Inclusion Settings:</span>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-200">
                <input
                  type="checkbox"
                  checked={newProblemData.addToTop150}
                  onChange={(e) => setNewProblemData({ ...newProblemData, addToTop150: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 bg-neutral-900 border-neutral-700 focus:ring-cyan-500"
                />
                <span className="font-semibold text-cyan-300">⭐ Include in Top Interview 150</span>
              </label>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdminCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
            >
              Create & Save Problem
            </button>
          </div>
        </form>
      </Modal>

      {/* YOUTUBE VIDEO EDITORIAL MODAL */}
      <ProblemVideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideo}
        problem={activeVideoProblem}
      />

      {/* ANIMATED COIN REWARD MODAL */}
      <AnimatedCoinModal
        isOpen={streakModalData.isOpen}
        onClose={() => setStreakModalData((prev) => ({ ...prev, isOpen: false }))}
        coins={streakModalData.coins}
        title={streakModalData.title}
        subtitle={streakModalData.subtitle}
        badgeText={streakModalData.badgeText}
        streakCount={streakModalData.streakCount}
        isBonus={streakModalData.isBonus}
        isDailyStreak={true}
      />

      {/* BOOKMARK & CUSTOM PROBLEM LISTS MODAL */}
      <BookmarkProblemModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        problem={activeBookmarkProblem}
      />
    </div>
  );
};
