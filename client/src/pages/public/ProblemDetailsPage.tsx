import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { problemService } from '../../services/problem.service';
import { submissionService } from '../../services/submission.service';
import {
  IProblemDetail,
  IRunCodeResult,
  ISubmissionHistoryItem,
} from '../../types/problem.types';
import { ROUTES } from '../../constants/routes';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../../utils/youtube';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Shuffle,
  Play,
  Pause,
  CloudUpload,
  RotateCcw,
  RotateCw,
  Copy,
  Check,
  Youtube,
  History,
  FileText,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Bug,
  Flame,
  Timer,
  Code2,
  ExternalLink,
  Crown,
  Lock,
  AlignLeft,
  Settings,
  Maximize2,
  Minimize2,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Terminal,
  Building2,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { ProfessionalCodeEditor, EDITOR_THEMES } from '../../components/code/ProfessionalCodeEditor';
import { OutputWindowDrawer } from '../../components/code/OutputWindowDrawer';
import { AnimatedCoinModal } from '../../components/contest/AnimatedCoinModal';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { coinService, CoinWalletState } from '../../services/coin.service';
import { sanitizeAiText } from '../../utils/cleanAiText';
import { BookmarkProblemModal } from '../../components/problem/BookmarkProblemModal';
import { bookmarkService } from '../../services/bookmark.service';
import { discussionService } from '../../services/discussion.service';
import {
  sundayContestService,
  PRACTICE_PROBLEMS_CATALOG,
  PracticeProblemTemplate,
} from '../../services/contest.service';
import { top150Service } from '../../services/top150.service';
import { monthlyContestService } from '../../services/monthlyContest.service';
import { getCleanStarterCode } from '../../utils/starterCode';
import { evaluateTestCases, EvaluatorTestCase } from '../../utils/codeEvaluator';
import {
  ProblemDiscussionSection,
  IProblemComment,
} from '../../components/problem/ProblemDiscussionSection';
import { useAutoLandscape } from '../../hooks/useAutoLandscape';
import { MobileLandscapePrompt } from '../../components/common/MobileLandscapePrompt';

// Multi-language code formatter utility
const formatCode = (rawCode: string, lang: string, tabSpaces: number = 2): string => {
  if (!rawCode || !rawCode.trim()) return rawCode;

  const l = (lang || 'javascript').toLowerCase();
  const indentStr = ' '.repeat(tabSpaces);

  // Python formatting
  if (l === 'python' || l === 'py' || l === 'python3') {
    const lines = rawCode.split('\n');
    const cleanedLines = lines.map((line) => line.replace(/\s+$/, ''));
    const resultLines: string[] = [];
    let emptyCount = 0;
    for (const line of cleanedLines) {
      if (!line.trim()) {
        emptyCount++;
        if (emptyCount <= 2) resultLines.push('');
      } else {
        emptyCount = 0;
        resultLines.push(line);
      }
    }
    return resultLines.join('\n');
  }

  // C-style languages (JavaScript, TypeScript, Java, C++, C)
  const lines = rawCode.split('\n');
  let currentIndent = 0;
  const formatted: string[] = [];
  let emptyCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      emptyCount++;
      if (emptyCount <= 1) {
        formatted.push('');
      }
      continue;
    }
    emptyCount = 0;

    let openCount = 0;
    let closeCount = 0;
    let leadingCloses = 0;

    let ptr = 0;
    while (ptr < trimmed.length && ['}', ']', ')'].includes(trimmed[ptr])) {
      leadingCloses++;
      ptr++;
    }

    let inString = false;
    let stringChar = '';
    for (let c = 0; c < trimmed.length; c++) {
      const ch = trimmed[c];
      if ((ch === '"' || ch === "'" || ch === '`') && trimmed[c - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = ch;
        } else if (stringChar === ch) {
          inString = false;
        }
      }
      if (!inString) {
        if (
          ch === '{' ||
          ch === '[' ||
          (ch === '(' &&
            !trimmed.startsWith('for') &&
            !trimmed.startsWith('if') &&
            !trimmed.startsWith('while'))
        ) {
          openCount++;
        } else if (ch === '}' || ch === ']' || ch === ')') {
          closeCount++;
        }
      }
    }

    const lineIndent = Math.max(0, currentIndent - leadingCloses);

    let cleanedText = trimmed
      .replace(/\s*([=+\-*/%&|^<>!]=|[=+\-*/%&|^<>])\s*/g, (match, op) => {
        if (op === '/' && trimmed.includes('//')) return match;
        if (op === '*' && trimmed.startsWith('*')) return match;
        if (
          op === '<' &&
          (trimmed.includes('<iostream>') ||
            trimmed.includes('<vector>') ||
            trimmed.includes('<string>'))
        )
          return match;
        return ` ${op} `;
      })
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s+/g, ' ')
      .replace(/#\s*include\s*<\s*([^>]+)\s*>/g, '#include <$1>')
      .replace(/;\s*$/g, ';')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\[\s+/g, '[')
      .replace(/\s+\]/g, ']');

    formatted.push(
      indentStr.repeat(lineIndent) +
        (trimmed.startsWith('#include') ||
        trimmed.startsWith('#define') ||
        trimmed.startsWith('//')
          ? trimmed
          : cleanedText)
    );

    currentIndent = Math.max(0, currentIndent + (openCount - closeCount));
  }

  return formatted.join('\n');
};

// Synchronously convert any practice/contest problem into an IProblemDetail
const convertTemplateToDetail = (
  template: PracticeProblemTemplate | any,
  fallbackSlug: string = 'two-sum'
): IProblemDetail => {
  const cleanSlug =
    template?.slug ||
    fallbackSlug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

  const sampleCases =
    template?.sampleTestCases && template.sampleTestCases.length > 0
      ? template.sampleTestCases
      : template?.examples && template.examples.length > 0
      ? template.examples.map((ex: any) => ({
          input: ex.input || '',
          expectedOutput: ex.output || ex.expectedOutput || '',
          explanation: ex.explanation,
        }))
      : [
          {
            input: 'nums = [2,7,11,15], target = 9',
            expectedOutput: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
          },
          {
            input: 'nums = [3,2,4], target = 6',
            expectedOutput: '[1,2]',
            explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
          },
        ];

  return {
    id: template?.id || `prob-${cleanSlug}`,
    order: typeof template?.order === 'number' && template.order > 0 ? template.order : undefined,
    title:
      template?.title ||
      cleanSlug
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    slug: cleanSlug,
    description:
      template?.description ||
      'Given an array of integers and a target value, return the indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    difficulty: template?.difficulty || 'Easy',
    category: template?.category || 'Arrays',
    youtubeUrl: template?.youtubeUrl || '',
    constraints:
      template?.constraints && template.constraints.length > 0
        ? template.constraints
        : [
            '1 <= n <= 10^5',
            '-10^9 <= arr[i] <= 10^9',
            'Time Complexity should satisfy the expected bounds.',
          ],
    examples: sampleCases.map((tc: any) => ({
      input: tc.input,
      output: tc.expectedOutput,
      explanation: tc.explanation,
    })),
    hints:
      template?.hints && template.hints.length > 0
        ? template.hints
        : [
            'Consider the time and space complexity trade-offs before writing code.',
            'Can you optimize the auxiliary space to O(1) or logarithmic memory?',
            'Think about edge cases such as empty inputs, single element arrays, or negative values.',
          ],
    starterCode: template?.starterCode || {
      javascript: `/**
 * @param {...any} args
 * @return {any}
 */
function solve(...args) {
  // Write your code here
}`,
      python: `class Solution:
    def solve(self, *args):
        # Write your code here
        pass`,
      java: `class Solution {
    public Object solve(Object... args) {
        // Write your code here
        return null;
    }
}`,
      cpp: `#include <vector>
#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    void solve() {
        // Write your code here
    }
};`,
      typescript: `function solve(...args: any[]): any {
  // Write your code here
}`,
    },
    supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c'],
    expectedComplexity: (template as any)?.expectedComplexity || {
      time: 'O(n)',
      space: 'O(1)',
    },
    sampleTestCases: sampleCases,
    acceptanceRate: parseFloat((template as any)?.accuracy) || 58.6,
    totalSubmissions: 150000,
    accuracy: (template as any)?.accuracy || '58.62%',
    submissionsCount: (template as any)?.submissionsCount || '207K+',
    averageTime: (template as any)?.averageTime || (template?.difficulty === 'Hard' ? '45m' : template?.difficulty === 'Medium' ? '30m' : '15m'),
    points: template?.points || (template?.difficulty === 'Hard' ? 300 : template?.difficulty === 'Medium' ? 200 : 100),
    companies: (() => {
      if (template?.companies && Array.isArray(template.companies) && template.companies.length > 0) {
        return template.companies;
      }
      const tSlug = (template?.slug || cleanSlug).toLowerCase().trim();
      const tTitle = (template?.title || '').toLowerCase().trim();
      const top150Match = top150Service.getProblems().find((p) => {
        const pSlug = (p.slug || '').toLowerCase().trim();
        const pTitle = (p.title || '').toLowerCase().trim();
        return (tSlug && pSlug === tSlug) || (tTitle && pTitle === tTitle);
      });
      return top150Match?.companies && Array.isArray(top150Match.companies) && top150Match.companies.length > 0
        ? top150Match.companies
        : [];
    })(),
    isSolved: false,
    isAttempted: false,
    createdAt: new Date().toISOString(),
  };
};

// 0ms Instant Problem Resolver
export const getInitialProblem = (slugParam?: string): IProblemDetail => {
  if (!slugParam) {
    return convertTemplateToDetail(PRACTICE_PROBLEMS_CATALOG[0]);
  }

  const rawDecoded = decodeURIComponent(slugParam).trim();
  const normalizedHyphen = rawDecoded.toLowerCase().replace(/[\s_]+/g, '-');
  const normalizedSpace = rawDecoded.toLowerCase().replace(/[-_]+/g, ' ');

  // 1. Search in Master PRACTICE_PROBLEMS_CATALOG (all 404 rich DSA problems)
  const catalogMatch = PRACTICE_PROBLEMS_CATALOG.find((p) => {
    const pSlug = (p.slug || '').toLowerCase();
    const pTitle = (p.title || '').toLowerCase();
    const pId = (p.id || '').toLowerCase();
    return (
      pSlug === normalizedHyphen ||
      pSlug === rawDecoded.toLowerCase() ||
      pTitle === normalizedSpace ||
      pTitle === rawDecoded.toLowerCase() ||
      pId === rawDecoded.toLowerCase() ||
      pSlug.replace(/-/g, ' ') === normalizedSpace
    );
  });
  if (catalogMatch) {
    return convertTemplateToDetail(catalogMatch, normalizedHyphen);
  }

  // 2. Search in Top Interview 150 catalog
  const top150Match = top150Service.getProblems().find((p) => {
    const pSlug = (p.slug || '').toLowerCase();
    const pTitle = (p.title || '').toLowerCase();
    const pId = (p.id || '').toLowerCase();
    return (
      pSlug === normalizedHyphen ||
      pSlug === rawDecoded.toLowerCase() ||
      pTitle === normalizedSpace ||
      pTitle === rawDecoded.toLowerCase() ||
      pId === rawDecoded.toLowerCase() ||
      pSlug.replace(/-/g, ' ') === normalizedSpace
    );
  });
  if (top150Match) {
    const sampleCases = [
      { input: '[2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]' },
      { input: '[3, 2, 4], target = 6', expectedOutput: '[1, 2]' },
    ];
    return {
      id: top150Match.id,
      title: top150Match.title,
      slug: top150Match.slug,
      description: `Given the input parameters, implement an optimal solution for ${top150Match.title} (${top150Match.category}).`,
      difficulty: top150Match.difficulty,
      category: top150Match.category,
      youtubeUrl: top150Match.youtubeUrl || '',
      constraints: ['1 <= N <= 10^5', 'Time Limit: 2.0s', 'Memory Limit: 256MB'],
      examples: [
        {
          input: 'nums = [2, 7, 11, 15], target = 9',
          output: '[0, 1]',
          explanation: 'Standard optimal solution.',
        },
      ],
      hints:
        top150Match.hints && top150Match.hints.length > 0
          ? top150Match.hints
          : [
              'Try to break down the problem into smaller subproblems or identify patterns (e.g. hashmap lookups, two pointers, sliding window).',
              'Can you optimize the space complexity by reusing variables or in-place transformations?',
            ],
      starterCode: {
        javascript: getCleanStarterCode(top150Match, 'javascript'),
        typescript: getCleanStarterCode(top150Match, 'typescript'),
        python: getCleanStarterCode(top150Match, 'python'),
        java: getCleanStarterCode(top150Match, 'java'),
        cpp: getCleanStarterCode(top150Match, 'cpp'),
        c: getCleanStarterCode(top150Match, 'c'),
        csharp: getCleanStarterCode(top150Match, 'csharp'),
      },
      supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp'],
      expectedComplexity: {
        time: 'O(N)',
        space: 'O(1)',
      },
      sampleTestCases: sampleCases,
      acceptanceRate: parseFloat(top150Match.acceptanceRate) || 54.5,
      totalSubmissions: 4200,
      companies: top150Match.companies && Array.isArray(top150Match.companies) ? top150Match.companies : [],
      isSolved: false,
      isAttempted: false,
      createdAt: new Date().toISOString(),
    };
  }

  // 4. Search in Sunday Contest & Daily Streak Problems
  const contestConfig = sundayContestService.getConfig();
  const dailyStreakProb = sundayContestService.getDailyStreakProblem();
  const allContestProbs = [
    ...(contestConfig.problems || []),
    dailyStreakProb,
  ].filter(Boolean);

  const contestMatch = allContestProbs.find((p) => {
    const pSlug = (p.slug || '').toLowerCase();
    const pTitle = (p.title || '').toLowerCase();
    const pId = (p.id || '').toLowerCase();
    return (
      pSlug === normalizedHyphen ||
      pSlug === rawDecoded.toLowerCase() ||
      pTitle === normalizedSpace ||
      pTitle === rawDecoded.toLowerCase() ||
      pId === rawDecoded.toLowerCase()
    );
  });
  if (contestMatch) {
    return convertTemplateToDetail(contestMatch, normalizedHyphen);
  }

  // 5. Substring / Word Match in Catalog
  const partialMatch = PRACTICE_PROBLEMS_CATALOG.find((p) => {
    const pSlug = (p.slug || '').toLowerCase();
    const pTitle = (p.title || '').toLowerCase();
    return (
      pSlug.includes(normalizedHyphen) ||
      normalizedHyphen.includes(pSlug) ||
      pTitle.includes(normalizedSpace) ||
      normalizedSpace.includes(pTitle)
    );
  });
  if (partialMatch) {
    return convertTemplateToDetail(partialMatch, normalizedHyphen);
  }

  // 6. Fallback: Base on Two Sum template but adapt slug & title
  const fallback = convertTemplateToDetail(PRACTICE_PROBLEMS_CATALOG[0], normalizedHyphen);
  fallback.slug = normalizedHyphen;
  fallback.title = rawDecoded
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  fallback.companies = [];
  return fallback;
};

// Helper to calculate problem serial number across catalog and database
const getProblemSerialNumber = (prob: { id?: string; slug?: string; title?: string; order?: number }): number => {
  if (typeof prob.order === 'number' && prob.order > 0) {
    return prob.order;
  }
  const normSlug = (prob.slug || '').toLowerCase().replace(/[-_ ]+/g, '-');
  if (normSlug === 'even-number') {
    return 1;
  }
  const normTitle = (prob.title || '').toLowerCase().trim();
  const catalogIdx = PRACTICE_PROBLEMS_CATALOG.findIndex((p) => {
    const pNormSlug = (p.slug || '').toLowerCase().replace(/[-_ ]+/g, '-');
    const pNormTitle = (p.title || '').toLowerCase().trim();
    return (
      (normSlug && pNormSlug === normSlug) ||
      (normTitle && pNormTitle === normTitle) ||
      (prob.id && p.id && p.id === prob.id)
    );
  });
  if (catalogIdx !== -1) {
    return PRACTICE_PROBLEMS_CATALOG[catalogIdx].order || (catalogIdx + 1);
  }
  const numMatch = (prob.slug || '').match(/\d+/) || (prob.id || '').match(/\d+/);
  if (numMatch) {
    const parsed = parseInt(numMatch[0], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 1;
};

const formatProblemTitleWithNumber = (
  title: string,
  prob: { id?: string; slug?: string; title?: string; order?: number }
): string => {
  const rawTitle = (title || '').trim();
  const num = getProblemSerialNumber(prob);
  const cleanTitle = rawTitle.replace(/^\d+\.\s*/, '');
  return `${String(num).padStart(2, '0')}. ${cleanTitle}`;
};

// Initial realistic peer discussion tailored per problem with headings & code blocks
const getInitialComments = (slug: string, probTitle: string): IProblemComment[] => {
  const savedKey = `nextera:comments:${slug}`;
  const saved = localStorage.getItem(savedKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }

  // Curated initial comments for active student peer learning with public profiles
  return [
    {
      id: 'c1',
      userId: 'usr-1',
      author: 'Aarav Sharma',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      text: `### 🚀 Optimal Approach
For **${probTitle}**, a single-pass HashMap approach with O(N) time and O(N) auxiliary space is the most optimal in interview settings!

### ⏱️ Complexity
- **Time Complexity:** \`O(N)\`
- **Auxiliary Space:** \`O(N)\`

### 💻 Python 3 Solution
\`\`\`python
def solve(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
\`\`\``,
      createdAt: '2 hours ago',
      likes: 16,
      hasLiked: false,
    },
    {
      id: 'c2',
      userId: 'usr-2',
      author: 'Priya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      text: `### 💡 Edge Case Notice
Remember to handle edge cases with negative values and zeroes.

> Worked flawlessly on first submission with \`0ms\` runtime! Make sure to verify duplicate elements before indexing.`,
      createdAt: '1 day ago',
      likes: 9,
      hasLiked: false,
    },
    {
      id: 'c3',
      userId: 'usr-3',
      author: 'Rohan Verma',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      text: `### ⚡ Two-Pointers Alternative
Great problem to master array patterns! If the input array is guaranteed to be sorted, the two-pointers approach achieves \`O(1)\` extra space:
1. Initialize left at \`0\` and right at \`n - 1\`
2. Check current sum vs target and adjust pointers`,
      createdAt: '2 days ago',
      likes: 6,
      hasLiked: false,
    },
  ];
};

export const ProblemDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError, info } = useToast();
  const location = useLocation();

  // Monthly Contest detection from query param (?contest=monthly or ?source=monthly-contest)
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isMonthlyContest = useMemo(() => {
    return searchParams.get('contest') === 'monthly' || searchParams.get('source') === 'monthly-contest';
  }, [searchParams]);

  // Anti-Cheat copy-paste prevention notice
  const handleCopyPasteBlocked = useCallback(() => {
    toastError(
      '⚠️ Anti-Cheat Active: Copy-paste is strictly disabled during the Monthly Contest. All code must be hand-typed.',
      'Copy-Paste Prohibited'
    );
  }, [toastError]);

  // Anti-Cheat Tab Switch Proctoring
  useAntiCheat({
    enabled: isMonthlyContest,
    onTabSwitch: () => {
      const res = monthlyContestService.recordAntiCheatWarning(user?.id);
      toastError(
        `⚠️ Anti-Cheat Warning #${res.warningsCount}: Tab switch detected! Integrity trust score: ${res.integrityScore}%.`,
        'Focus Loss Logged'
      );
    },
  });

  // Check if this problem is solved in the active Monthly Contest
  const isSolvedInMonthlyContest = useMemo(() => {
    const attempt = monthlyContestService.getUserAttempt(user?.id);
    return attempt.solvedProblemSlugs?.includes(slug || '');
  }, [user?.id, slug]);

  // Core Problem State (initialized synchronously with 0ms delay)
  const initialProb = useMemo(() => getInitialProblem(slug), [slug]);
  const [problem, setProblem] = useState<IProblemDetail>(initialProb);

  // Serial Number & Display Title (e.g., "01. Two Sum")
  const displayProblemTitle = useMemo(
    () => formatProblemTitleWithNumber(problem.title, problem),
    [problem]
  );

  // Dynamic Page Title
  useDocumentTitle(`${displayProblemTitle} — NextEra Coders DSA Arena`);

  // Left Panel Tab: 'description' | 'editorial' | 'solutions' | 'submissions' | 'hints' | 'nec-ai'
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'editorial' | 'solutions' | 'submissions' | 'hints' | 'nec-ai'>('description');

  // Mobile auto-landscape detection and workable mobile workspace tabs
  const { isMobile, isPortrait, showPrompt, dismissPrompt, reopenPrompt, lockLandscape } = useAutoLandscape();
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'problem' | 'code' | 'console'>('problem');

  // Code Editor State (Constrained to Java, Python, C++, C, JavaScript)
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    const pref = localStorage.getItem('nextera:preferred_language');
    return pref && ['java', 'python', 'cpp', 'c', 'javascript'].includes(pref) ? pref : 'java';
  });
  const [editorTheme, setEditorTheme] = useState<string>(() => localStorage.getItem('nextera:editor_theme') || 'system');
  const [fontSize, setFontSize] = useState<number>(() => Number(localStorage.getItem('nextera:editor_fontsize')) || 14);
  const [tabSize, setTabSize] = useState<number>(() => Number(localStorage.getItem('nextera:editor_tabsize')) || 2);
  const [wordWrap, setWordWrap] = useState<boolean>(() => localStorage.getItem('nextera:editor_wordwrap') === 'true');
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(() => localStorage.getItem('nextera:editor_linenumbers') !== 'false');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Starter Code
  const [code, setCode] = useState<string>(() => {
    const pref = localStorage.getItem('nextera:preferred_language');
    const defaultLang = pref && ['java', 'python', 'cpp', 'c', 'javascript'].includes(pref) ? pref : 'java';
    return getCleanStarterCode(initialProb, defaultLang);
  });
  const [copied, setCopied] = useState(false);
  const [problemCopied, setProblemCopied] = useState(false);
  const [copiedExampleIdx, setCopiedExampleIdx] = useState<number | null>(null);

  // Problem metadata interactivity
  const [likesCount, setLikesCount] = useState(248);
  const [hasLiked, setHasLiked] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isBookmarkedInLists, setIsBookmarkedInLists] = useState(() =>
    bookmarkService.isProblemBookmarked(initialProb.slug)
  );
  const [savedListNames, setSavedListNames] = useState<string[]>(() =>
    bookmarkService.getProblemListNames(initialProb.slug)
  );

  useEffect(() => {
    const syncBookmarks = () => {
      setIsBookmarkedInLists(bookmarkService.isProblemBookmarked(problem.slug));
      setSavedListNames(bookmarkService.getProblemListNames(problem.slug));
    };
    syncBookmarks();
    const unsub = bookmarkService.subscribe(syncBookmarks);
    return () => unsub();
  }, [problem.slug]);
  const [showCompanies, setShowCompanies] = useState(true);
  const [showExpectedComplexities, setShowExpectedComplexities] = useState(true);
  const [showTopicTags, setShowTopicTags] = useState(true);
  const [showRelatedProblems, setShowRelatedProblems] = useState(true);
  const [comments, setComments] = useState<IProblemComment[]>(() =>
    getInitialComments(initialProb.slug, initialProb.title)
  );
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());

  // 2-3 Related Problems matching category / topic
  const relatedProblems = useMemo(() => {
    const currentSlug = (problem.slug || '').toLowerCase().trim();
    const currentCat = (problem.category || '').toLowerCase().trim();

    // 1. Same category first
    let candidates = PRACTICE_PROBLEMS_CATALOG.filter((p) => {
      const pSlug = (p.slug || '').toLowerCase().trim();
      if (pSlug === currentSlug || p.title.toLowerCase() === problem.title.toLowerCase()) return false;
      const pCat = (p.category || '').toLowerCase().trim();
      return pCat === currentCat || (currentCat && pCat.includes(currentCat)) || (pCat && currentCat.includes(pCat));
    });

    // 2. Fallback to catalog if fewer than 3
    if (candidates.length < 3) {
      const fallback = PRACTICE_PROBLEMS_CATALOG.filter((p) => {
        const pSlug = (p.slug || '').toLowerCase().trim();
        return (
          pSlug !== currentSlug &&
          p.title.toLowerCase() !== problem.title.toLowerCase() &&
          !candidates.some((c) => c.slug === p.slug)
        );
      });
      candidates = [...candidates, ...fallback];
    }

    return candidates.slice(0, 3).map((p) => ({
      ...p,
      displayTitle: formatProblemTitleWithNumber(p.title, p),
    }));
  }, [problem.slug, problem.category, problem.title]);

  // Sync comments whenever problem changes (fetch from MongoDB with graceful fallback)
  useEffect(() => {
    let isMounted = true;
    setComments(getInitialComments(problem.slug, problem.title));

    if (problem.slug) {
      discussionService
        .getDiscussions(problem.slug)
        .then((liveComments) => {
          if (isMounted && Array.isArray(liveComments) && liveComments.length > 0) {
            setComments(liveComments);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch live discussions from server:', err);
        });
    }

    // Refresh wallet and streak from backend to prevent cross-device desync
    coinService.fetchLiveWallet().catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [problem.slug, problem.title]);

  // Comment submission handler (Synced to MongoDB)
  const handlePostComment = async (text: string) => {
    if (!text.trim()) return;

    const authorName = user?.name || 'Code Enthusiast';
    const tempId = `comm-${Date.now()}`;
    const newComment: IProblemComment = {
      id: tempId,
      userId: user?.id || 'me',
      author: authorName,
      avatar: user?.profileImage || '',
      text: text.trim(),
      createdAt: 'Just now',
      likes: 0,
      hasLiked: false,
      isCurrentUser: true,
    };

    setComments((prev) => [newComment, ...prev]);

    try {
      const created = await discussionService.createDiscussion(problem.slug, text.trim());
      if (created && created.id) {
        setComments((prev) => prev.map((c) => (c.id === tempId ? created : c)));
      }
      success('Your discussion comment has been posted! 💬', 'Comment Added');
    } catch (err: any) {
      try {
        localStorage.setItem(`nextera:comments:${problem.slug}`, JSON.stringify([newComment, ...comments]));
      } catch {}
      if (!user) {
        info('Comment saved locally. Sign in to share across all your devices!');
      } else {
        console.warn('Backend comment sync error:', err);
      }
    }
  };

  // Comment like handler (Synced to MongoDB)
  const handleLikeComment = async (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const hasLiked = !c.hasLiked;
          return {
            ...c,
            hasLiked,
            likes: hasLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
          };
        }
        return c;
      })
    );

    try {
      const res = await discussionService.toggleLike(commentId);
      if (res) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, hasLiked: res.hasLiked, likes: res.likesCount }
              : c
          )
        );
      }
    } catch (err) {
      console.warn('Like toggle sync error:', err);
    }
  };

  // Comment delete handler (Synced to MongoDB)
  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await discussionService.deleteDiscussion(commentId);
      info('Your comment has been removed', 'Discussion Updated');
    } catch (err) {
      console.warn('Delete comment sync error:', err);
    }
  };

  // Submissions state
  const [pastSubmissions, setPastSubmissions] = useState<ISubmissionHistoryItem[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Stopwatch Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Live Wallet & Streak State
  const [wallet, setWallet] = useState<CoinWalletState>(() => coinService.getState());

  // Animated Coin Celebration Modal
  const [coinModalData, setCoinModalData] = useState<{
    isOpen: boolean;
    coins: number;
    dailyCoins?: number;
    extraCoins?: number;
    title: string;
    subtitle: string;
    badgeText: string;
    streakCount: number;
    isBonus: boolean;
  }>({
    isOpen: false,
    coins: 1,
    dailyCoins: 1,
    extraCoins: 0,
    title: '⚡ PROBLEM SOLVED!',
    subtitle: 'Congratulations! You solved this challenge and earned NEC Coins!',
    badgeText: 'PROBLEM MASTERED',
    streakCount: 1,
    isBonus: false,
  });

  // Sliding Output Window Drawer State
  const [isOutputOpen, setIsOutputOpen] = useState(false);
  const [isOutputMinimized, setIsOutputMinimized] = useState(false);
  const [outputDrawerTab, setOutputDrawerTab] = useState<'results' | 'custom' | 'arena-ai' | 'yogi'>('results');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<IRunCodeResult | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [evaluatedSampleCases, setEvaluatedSampleCases] = useState<EvaluatorTestCase[]>([]);

  // Horizontal Split Pane Resizing (Left: Problem Statement, Right: Code & Console)
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(() => {
    const saved = localStorage.getItem('nextera:practice_split_width');
    return saved ? Number(saved) : 45;
  });
  const [isDraggingH, setIsDraggingH] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Synchronize problem whenever slug parameter changes
  useEffect(() => {
    const nextProb = getInitialProblem(slug);
    setProblem(nextProb);
    setCode(getCleanStarterCode(nextProb, selectedLanguage));
    setRunResult(null);
    setSubmissionResult(null);
    setIsOutputOpen(false);
    setRevealedHints(new Set());

    // Fetch live backend updates in background if server has more recent details
    const rawDecoded = decodeURIComponent(slug || '').trim();
    if (rawDecoded) {
      problemService
        .getProblemBySlug(rawDecoded)
        .then((serverProb) => {
          if (serverProb && serverProb.id) {
            setProblem((prev) => ({
              ...prev,
              ...serverProb,
              order: typeof serverProb.order === 'number' && serverProb.order > 0 ? serverProb.order : prev.order,
              description: serverProb.description || prev.description,
              examples: serverProb.examples?.length ? serverProb.examples : prev.examples,
              sampleTestCases: serverProb.sampleTestCases?.length ? serverProb.sampleTestCases : prev.sampleTestCases,
              hints: serverProb.hints?.length ? serverProb.hints : prev.hints,
              constraints: serverProb.constraints?.length ? serverProb.constraints : prev.constraints,
              youtubeUrl: serverProb.youtubeUrl || prev.youtubeUrl,
              companies: Array.isArray(serverProb.companies) && serverProb.companies.length > 0
                ? serverProb.companies
                : prev.companies && prev.companies.length > 0
                  ? prev.companies
                  : [],
            }));
          }
        })
        .catch(() => {
          // Local catalog fallback is already rendering cleanly
        });
    }
  }, [slug, selectedLanguage]);

  // Lock Page Scroll when inside the Code Workspace
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, []);

  // Coin Wallet listener
  useEffect(() => {
    const unsub = coinService.subscribe(setWallet);
    coinService.fetchLiveWallet();
    return () => unsub();
  }, []);

  // Close settings popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  // Stopwatch Timer Ticker
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  // Format stopwatch timer seconds to mm:ss or hh:mm:ss
  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Resizable Horizontal Split Drag Handler
  const handleMouseDownH = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingH(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingH || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth >= 25 && newWidth <= 75) {
        setLeftPaneWidth(newWidth);
        localStorage.setItem('nextera:practice_split_width', String(Math.round(newWidth)));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingH) {
        setIsDraggingH(false);
      }
    };

    if (isDraggingH) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingH]);

  // Sync state when browser fullscreen changes (e.g. user presses Esc in browser)
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Fullscreen Toggle Handler (Only runs on explicit user click or action)
  const handleToggleFullScreen = () => {
    const nextState = !isFullScreen;
    setIsFullScreen(nextState);
    try {
      if (nextState) {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {}
  };

  // Keyboard Shortcuts (Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit, Esc to exit Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitCode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      } else if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, selectedLanguage, problem, isFullScreen]);

  // Language Change Handler
  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    localStorage.setItem('nextera:preferred_language', newLang);
    const starter = getCleanStarterCode(problem, newLang);
    setCode(starter);
    success(`Switched language to ${newLang.toUpperCase()}`);
  };

  // Code Editor Change
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  // Reset Code to Starter Template
  const handleResetCode = () => {
    const starter = getCleanStarterCode(problem, selectedLanguage);
    setCode(starter);
    info('Starter code template reset');
  };

  // Format Code Utility
  const handleFormatCode = () => {
    const formatted = formatCode(code, selectedLanguage, tabSize);
    setCode(formatted);
    success('Code formatted successfully');
  };

  // Copy Code to Clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError('Failed to copy code');
    }
  };

  // Restore Last Submitted Code
  const handleRestoreLastSubmittedCode = () => {
    if (pastSubmissions.length > 0 && pastSubmissions[0]?.code) {
      setCode(pastSubmissions[0].code);
      if (pastSubmissions[0].language) {
        setSelectedLanguage(pastSubmissions[0].language);
      }
      success('Restored code from your last submission!');
    } else {
      info('No past submission code available to restore.');
    }
  };

  // Toggle Hint Reveal
  const toggleHint = (idx: number) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Reveal all hints
  const handleRevealAllHints = () => {
    const all = new Set<number>(safeHints.map((_, i) => i));
    setRevealedHints(all);
  };

  // Hide all hints
  const handleHideAllHints = () => {
    setRevealedHints(new Set());
  };

  // Fetch past submissions
  const fetchSubmissions = useCallback(async () => {
    if (!problem || !isAuthenticated) return;
    try {
      setLoadingSubmissions(true);
      const subs = await submissionService.getProblemSubmissions(problem.id);
      setPastSubmissions(subs || []);
    } catch {
      // ignore
    } finally {
      setLoadingSubmissions(false);
    }
  }, [problem, isAuthenticated]);

  useEffect(() => {
    if (activeLeftTab === 'submissions') {
      fetchSubmissions();
    }
  }, [activeLeftTab, fetchSubmissions]);

  // Safe Sample Test Cases, Constraints & Hints
  const safeSampleTestCases = useMemo(() => {
    if (problem.examples && problem.examples.length > 0) {
      return problem.examples.map((ex) => ({
        input: ex.input || '',
        expectedOutput: ex.output || '',
        explanation: ex.explanation,
      }));
    }
    if (problem.sampleTestCases && problem.sampleTestCases.length > 0) {
      return problem.sampleTestCases;
    }
    return [
      { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]', explanation: '2 + 7 = 9' },
      { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]', explanation: '2 + 4 = 6' },
    ];
  }, [problem]);

  const safeConstraints = problem.constraints && Array.isArray(problem.constraints) ? problem.constraints : [];
  const safeHints = problem.hints && Array.isArray(problem.hints) ? problem.hints : [];

  // Copy Problem Statement & Examples
  const handleCopyProblem = () => {
    let content = `${displayProblemTitle} [Difficulty: ${problem.difficulty || 'Easy'}]\n\n`;
    content += `Problem Description:\n${problem.description || ''}\n\n`;
    if (safeSampleTestCases && safeSampleTestCases.length > 0) {
      safeSampleTestCases.forEach((tc, idx) => {
        content += `Example ${idx + 1}:\nInput: ${tc.input}\nOutput: ${tc.expectedOutput}\n`;
        if ((tc as any).explanation) {
          content += `Explanation: ${(tc as any).explanation}\n`;
        }
        content += '\n';
      });
    }
    if (safeConstraints && safeConstraints.length > 0) {
      content += `Constraints:\n` + safeConstraints.map((c) => `- ${c}`).join('\n');
    }
    navigator.clipboard.writeText(content.trim());
    setProblemCopied(true);
    success('Problem statement & examples copied to clipboard!', 'Copied');
    setTimeout(() => setProblemCopied(false), 2000);
  };

  const handleCopyExample = (idx: number, tc: any) => {
    const text = `Input: ${tc.input}\nOutput: ${tc.expectedOutput}${tc.explanation ? `\nExplanation: ${tc.explanation}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedExampleIdx(idx);
    success(`Example ${idx + 1} copied to clipboard!`, 'Copied');
    setTimeout(() => setCopiedExampleIdx(null), 1800);
  };

  // Check if current problem is today's Daily Streak Problem & if already claimed today
  const dailyStreakProb = sundayContestService.getDailyStreakProblem();
  const isDailyChallenge = Boolean(
    problem &&
      (problem.slug === dailyStreakProb.slug ||
        problem.id === dailyStreakProb.id ||
        problem.title.toLowerCase().trim() === dailyStreakProb.title.toLowerCase().trim())
  );
  const isDailyStreakLocked = isDailyChallenge && Boolean(wallet.claimedToday);

  // Run Code (Opens sliding Output Window and executes test cases)
  const handleRunCode = async () => {
    if (!problem) return;
    if (!isAuthenticated) {
      info('Running in Guest Mode. Log in to save submissions and claim rewards.', 'Guest Practice');
    }

    try {
      setIsOutputOpen(true);
      setIsOutputMinimized(false);
      setOutputDrawerTab('results');
      setIsRunning(true);
      setSubmissionResult(null);

      if (outputDrawerTab === 'custom' && customInput.trim()) {
        const customCase = [{ input: customInput.trim(), expectedOutput: '' }];
        const evalRes = await evaluateTestCases(selectedLanguage, code, customCase, problem.slug, problem.title);
        setEvaluatedSampleCases(evalRes.testCases);
        setRunResult({
          output: evalRes.output,
          error: evalRes.error,
          executionTime: evalRes.executionTime,
          memory: evalRes.memory,
          passed: evalRes.passed,
          status: evalRes.status,
        });
        if (evalRes.error) {
          toastError(`Execution Error: ${evalRes.error}`);
        } else {
          success('Custom test executed successfully!');
        }
      } else {
        const evalRes = await evaluateTestCases(selectedLanguage, code, safeSampleTestCases, problem.slug, problem.title);
        setEvaluatedSampleCases(evalRes.testCases);
        setRunResult({
          output: evalRes.output,
          error: evalRes.error,
          executionTime: evalRes.executionTime,
          memory: evalRes.memory,
          passed: evalRes.passed,
          status: evalRes.status,
        });

        if (evalRes.passed) {
          success(`✅ Sample test cases passed (${evalRes.testCasesPassed}/${evalRes.totalTestCases})! Click Submit to evaluate.`);
        } else if (evalRes.error) {
          toastError(`Compilation / Runtime Error: ${evalRes.error}`);
        } else {
          toastError(`Wrong Answer: ${evalRes.testCasesPassed}/${evalRes.totalTestCases} sample test cases passed. Inspect output drawer for details.`);
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  // Open Custom Input Drawer
  const handleOpenCustomInput = () => {
    setIsOutputOpen(true);
    setIsOutputMinimized(false);
    setOutputDrawerTab('custom');
  };

  // Submit Solution (Opens sliding Output Window & Celebrates with Coins ONLY if 100% Passed)
  const handleSubmitCode = async () => {
    if (!problem) return;
    if (!isAuthenticated) {
      toastError('Authentication Required: Please log in or create an account to submit your solution.', 'Login Required');
      return;
    }

    if (isDailyStreakLocked) {
      info(
        "Today's daily streak challenge has already been solved and locked (+1🪙 claimed). Next challenge unlocks tomorrow at 12:00 AM.",
        '🔒 Locked for Today'
      );
      return;
    }

    try {
      setIsOutputOpen(true);
      setIsOutputMinimized(false);
      setOutputDrawerTab('results');
      setIsSubmitting(true);

      // Evaluate against sample + hidden test cases
      const allCases = [...safeSampleTestCases, ...(problem.hiddenTestCases || [])];
      const localEval = await evaluateTestCases(selectedLanguage, code, allCases, problem.slug, problem.title);
      setEvaluatedSampleCases(localEval.testCases);

      let serverSubRes: any = null;
      try {
        if (problem.id && !problem.id.startsWith('prob-') && !problem.id.startsWith('practice-') && !problem.id.startsWith('sunday-')) {
          serverSubRes = await submissionService.submitSolution(problem.id, selectedLanguage, code);

          // Asynchronous submission queue polling (Queued -> Processing -> Evaluated)
          const submissionId = serverSubRes?.submission?.id;
          if (submissionId && (serverSubRes?.submission?.status === 'Queued' || serverSubRes?.submission?.status === 'Processing')) {
            let attempts = 0;
            const maxAttempts = 30; // 15 seconds max polling
            while (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              attempts++;
              try {
                const polled = await submissionService.getSubmissionStatus(submissionId);
                if (polled?.submission) {
                  serverSubRes = polled;
                  if (polled.submission.status !== 'Queued' && polled.submission.status !== 'Processing') {
                    break;
                  }
                }
              } catch (pollErr) {
                console.warn('Submission queue polling error:', pollErr);
                break;
              }
            }
          }
        }
      } catch (err) {
        // Fallback to local evaluation
      }

      if (serverSubRes?.submission?.details && serverSubRes.submission.details.length > 0) {
        setEvaluatedSampleCases(serverSubRes.submission.details);
      }

      const isAccepted = serverSubRes
        ? serverSubRes?.submission?.status === 'Accepted'
        : localEval.passed;

      const submissionStatus = serverSubRes?.submission?.status || (localEval.passed ? 'Accepted' : localEval.status);
      const passedCount = serverSubRes?.submission?.testCasesPassed !== undefined ? serverSubRes.submission.testCasesPassed : localEval.testCasesPassed;
      const totalCount = serverSubRes?.submission?.totalTestCases !== undefined ? serverSubRes.submission.totalTestCases : allCases.length;

      const finalResult = {
        submission: {
          status: submissionStatus,
          testCasesPassed: passedCount,
          totalTestCases: totalCount,
          executionTime: serverSubRes?.submission?.executionTime || localEval.executionTime,
          memory: serverSubRes?.submission?.memory || localEval.memory,
          errorMessage: serverSubRes?.submission?.errorMessage || localEval.error || (isAccepted ? undefined : `Wrong Answer: ${passedCount}/${totalCount} test cases passed`),
        },
      };

      setSubmissionResult(finalResult);
      setRunResult({
        output: localEval.output,
        error: localEval.error,
        executionTime: localEval.executionTime,
        memory: localEval.memory,
        passed: isAccepted,
        status: submissionStatus as any,
      });

      if (isAccepted) {
        success('🎉 Accepted! All test cases passed successfully!');

        // Check if daily streak challenge (ONLY daily streak problem awards 1 NEC Coin & opens popup)
        if (isDailyChallenge && !wallet.claimedToday) {
          const claimRes = await coinService.claimDailyStreakAsync(dailyStreakProb.slug, dailyStreakProb.id, true);
          setCoinModalData({
            isOpen: true,
            coins: claimRes.coinsAwarded || 1,
            dailyCoins: claimRes.dailyCoins || 1,
            extraCoins: claimRes.extraCoins || 0,
            title: claimRes.isBonus
              ? '🔥 7-DAY STREAK MEGA BONUS!'
              : '⚡ DAILY STREAK CLAIMED!',
            subtitle: claimRes.isBonus
              ? `🎉 Congratulations on maintaining your 7-Day Daily Streak!`
              : `You solved today's challenge "${displayProblemTitle}" and secured your streak! +1 NEC Coin credited.`,
            badgeText: claimRes.isBonus ? '7-DAY STREAK BONUS' : 'DAILY STREAK REWARD',
            streakCount: claimRes.newStreak || wallet.dailyStreak || 1,
            isBonus: Boolean(claimRes.isBonus),
          });

          // Sync solver record to Admin POTD solvers tracker
          try {
            const rawSolvers = localStorage.getItem('nextera_admin_potd_solvers');
            const solversList: any[] = rawSolvers ? JSON.parse(rawSolvers) : [];
            const userKey = user?.id || (user as any)?._id || 'user-current';
            const existingIdx = solversList.findIndex((s) => s.userId === userKey);
            const nowTimeStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            const langLabel = selectedLanguage === 'cpp' ? 'C++' : selectedLanguage === 'python' ? 'Python' : selectedLanguage === 'java' ? 'Java' : 'JavaScript';
            const newRecord = {
              id: `solv-${Date.now()}`,
              userId: userKey,
              name: user?.name || 'Student Coder',
              username: (user as any)?.username || (user?.email ? user.email.split('@')[0] : 'student_coder'),
              avatar: user?.profileImage || '',
              college: user?.college || 'Engineering College',
              streak: claimRes.newStreak || (wallet.dailyStreak || 0) + 1,
              longestStreak: Math.max(claimRes.newStreak || 1, (user as any)?.longestStreak || 1),
              solvedAt: nowTimeStr,
              solveTimeMinutes: Math.floor(Math.random() * 6) + 3,
              solveTimeSeconds: Math.floor(Math.random() * 50) + 5,
              language: langLabel,
              runtimeMs: serverSubRes?.submission?.executionTime || localEval.executionTime || 14,
              memoryMb: 14.5,
              testCasesPassed: `${passedCount}/${totalCount} (100%)`,
              coinsEarned: claimRes.coinsAwarded || 1,
              status: 'Accepted',
              submittedCode: code,
            };
            if (existingIdx !== -1) {
              solversList[existingIdx] = newRecord;
            } else {
              solversList.unshift(newRecord);
            }
            localStorage.setItem('nextera_admin_potd_solvers', JSON.stringify(solversList));
          } catch {}
        }

        // Check if Monthly Contest challenge
        const currentProblemSlug = (problem?.slug || slug || '').toLowerCase().trim();
        const monthlyConfig = monthlyContestService.getConfig();
        const matchedMonthlyChallenge = monthlyConfig.stages
          .flatMap((s) => s.challenges)
          .find((c) => {
            const cSlug = (c.slug || '').toLowerCase().trim();
            return (
              cSlug === currentProblemSlug ||
              (slug && cSlug === slug.toLowerCase().trim()) ||
              c.title.toLowerCase().trim() === (problem?.title || '').toLowerCase().trim()
            );
          });

        const isPartOfMonthly = isMonthlyContest || Boolean(matchedMonthlyChallenge);
        if (isPartOfMonthly && (matchedMonthlyChallenge || currentProblemSlug)) {
          const targetSlug = matchedMonthlyChallenge?.slug || currentProblemSlug;
          const res = monthlyContestService.markProblemSolved(targetSlug, user?.id);
          const solvedTotal = res.attempt.solvedProblemSlugs.length;

          if (res.is18Completed && res.coinsCredited) {
            setCoinModalData({
              isOpen: true,
              coins: 1800,
              dailyCoins: 1800,
              extraCoins: 0,
              title: '🏆 100% MONTHLY CONTEST CLEARED!',
              subtitle: '🎉 Outstanding! You solved all 18 challenges in this month\'s contest! 1,800 NEC Coins have been credited to your wallet.',
              badgeText: 'MONTHLY CHAMPION',
              streakCount: 18,
              isBonus: true,
            });
          } else {
            success(
              `🏆 Monthly Contest: Verified Blue Tick (✓) Applied! (${solvedTotal}/18 Solved)${
                solvedTotal >= 2 ? ' • Official Contest Submission is now UNLOCKED!' : ' • Solve 1 more to unlock submission'
              }`
            );
          }
        }

        // Refresh submissions
        fetchSubmissions();
      } else {
        toastError(
          localEval.error
            ? `Execution Error: ${localEval.error}`
            : `Wrong Answer: ${passedCount}/${totalCount} test cases passed. Output did not match expected answer.`
        );
      }
    } catch (err: any) {
      toastError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Random Problem Navigation
  const handleRandomProblem = () => {
    if (PRACTICE_PROBLEMS_CATALOG.length === 0) return;
    const currentIdx = PRACTICE_PROBLEMS_CATALOG.findIndex((p) => p.slug === problem.slug);
    let nextIdx = Math.floor(Math.random() * PRACTICE_PROBLEMS_CATALOG.length);
    if (nextIdx === currentIdx && PRACTICE_PROBLEMS_CATALOG.length > 1) {
      nextIdx = (nextIdx + 1) % PRACTICE_PROBLEMS_CATALOG.length;
    }
    const nextProb = PRACTICE_PROBLEMS_CATALOG[nextIdx];
    navigate(`/dsa/${encodeURIComponent(nextProb.slug)}`);
  };

  // Prev Problem Navigation
  const handlePrevProblem = () => {
    const currentIdx = PRACTICE_PROBLEMS_CATALOG.findIndex((p) => p.slug === problem.slug);
    const prevIdx = currentIdx <= 0 ? PRACTICE_PROBLEMS_CATALOG.length - 1 : currentIdx - 1;
    const prevProb = PRACTICE_PROBLEMS_CATALOG[prevIdx];
    navigate(`/dsa/${encodeURIComponent(prevProb.slug)}`);
  };

  // Next Problem Navigation
  const handleNextProblem = () => {
    const currentIdx = PRACTICE_PROBLEMS_CATALOG.findIndex((p) => p.slug === problem.slug);
    const nextIdx = currentIdx === -1 || currentIdx >= PRACTICE_PROBLEMS_CATALOG.length - 1 ? 0 : currentIdx + 1;
    const nextProb = PRACTICE_PROBLEMS_CATALOG[nextIdx];
    navigate(`/dsa/${encodeURIComponent(nextProb.slug)}`);
  };

  // YouTube Video Embed URL
  const embedUrl = problem.youtubeUrl ? getYouTubeEmbedUrl(problem.youtubeUrl) : null;
  const watchUrl = problem.youtubeUrl ? getYouTubeWatchUrl(problem.youtubeUrl) : null;

  // Editor line count
  const lineCount = useMemo(() => (code ? code.split('\n').length : 1), [code]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-[#121212] text-slate-800 dark:text-neutral-200 overflow-hidden select-none font-sans transition-colors">
      
      {/* 1. TOP LEETCODE-STYLE GLOBAL NAVIGATION HEADER */}
      <header className="h-12 px-3 sm:px-4 bg-white dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between shrink-0 z-40 transition-colors">
        
        {/* Left: Back to Practice / Problemset & Problem Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back Button */}
          <Link
            to={ROUTES.PRACTICE}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333333] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-mono font-semibold border border-slate-200 dark:border-neutral-700/60 shadow-xs active:scale-95"
            title="Back to Problemset (/practice)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white" />
            <span className="hidden sm:inline">Problem List</span>
          </Link>

          {/* Prev Problem */}
          <button
            type="button"
            onClick={handlePrevProblem}
            className="p-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all cursor-pointer active:scale-90"
            title="Previous Problem"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Problem Title Badge & Verified Blue Tick */}
          <div className="flex items-center gap-2 max-w-[220px] sm:max-w-[420px] truncate">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
              {displayProblemTitle}
            </span>
            {isSolvedInMonthlyContest && (
              <span title="Monthly Contest Solution Verified & Blue Tick Applied ✓" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-[10px] font-mono font-bold shrink-0">
                <BadgeCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white" />
                <span className="hidden sm:inline">Contest Solved ✓</span>
              </span>
            )}
            {isMonthlyContest && !isSolvedInMonthlyContest && (
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold shrink-0">
                <span>Contest Mode</span>
              </span>
            )}
          </div>

          {/* Next Problem */}
          <button
            type="button"
            onClick={handleNextProblem}
            className="p-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all cursor-pointer active:scale-90"
            title="Next Problem"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Random Problem Shuffle */}
          <button
            type="button"
            onClick={handleRandomProblem}
            className="p-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all cursor-pointer hidden md:flex active:scale-90"
            title="Pick Random Problem"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Top Quick Run & Submit Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Top Run Button */}
          <button
            type="button"
            disabled={isRunning || isSubmitting}
            onClick={handleRunCode}
            className={cn(
              'relative overflow-hidden h-8 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-gradient-to-r dark:from-[#242634] dark:via-[#2f3244] dark:to-[#242634] dark:hover:from-[#2e3244] dark:hover:via-[#393d52] dark:hover:to-[#2e3244] border border-cyan-500/30 hover:border-cyan-400/70 text-cyan-100 hover:text-white font-bold flex items-center gap-1.5 transition-all duration-200 text-xs cursor-pointer shadow-xs hover:shadow-[0_0_16px_rgba(34,211,238,0.3)] active:scale-95 group',
              isRunning && 'opacity-60 cursor-not-allowed'
            )}
            title="Run Code"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            {isRunning ? (
              <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400 group-hover:scale-115 transition-transform" />
            )}
            <span className="tracking-wide">Run</span>
          </button>

          {/* Top Submit Button */}
          {isDailyStreakLocked ? (
            <button
              type="button"
              disabled
              className="h-8 px-4 sm:px-5 rounded-lg bg-slate-100 dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 font-bold flex items-center gap-1.5 shadow-sm text-xs cursor-not-allowed"
              title="Today's daily streak challenge has already been solved and locked (+1🪙 claimed)."
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Locked for Today</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isRunning || isSubmitting}
              onClick={handleSubmitCode}
              className={cn(
                'relative overflow-hidden h-8 px-5 rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 text-white font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_24px_rgba(16,185,129,0.6)] active:scale-95 transition-all duration-200 text-xs cursor-pointer border border-emerald-400/40 group',
                isSubmitting && 'opacity-60 cursor-not-allowed'
              )}
              title="Submit Solution"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4 text-white group-hover:-translate-y-0.5 group-hover:scale-110 transition-transform" />
              )}
              <span className="tracking-wide">Submit</span>
            </button>
          )}
        </div>

        {/* Right: Timer, Streak, Coins, Theme Toggle & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Timer Stopwatch */}
          <div
            onClick={() => setTimerRunning(!timerRunning)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 cursor-pointer transition-colors active:scale-95"
            title="Click to pause/resume timer"
          >
            <Timer className={cn('w-3.5 h-3.5', timerRunning ? 'text-emerald-500' : 'text-slate-400 dark:text-neutral-500')} />
            <span className="text-xs font-mono">{formatTimer(seconds)}</span>
          </div>

          {/* Live Coins Wallet Pill */}
          <Link
            to={ROUTES.REWARDS}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-mono font-bold transition-all shadow-xs active:scale-95 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title="Your NEC Coins Wallet - Click to redeem in Store"
          >
            <span>🪙</span>
            <span>{wallet.coins}</span>
          </Link>

          {/* Streak Flame */}
          <div
            className="hidden sm:flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-lg border border-orange-500/20 text-xs font-mono"
            title="Daily Coding Streak"
          >
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>{wallet.dailyStreak}d</span>
          </div>

          {/* Contest Link */}
          <Link
            to={ROUTES.CONTEST}
            className="hidden md:flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-xs"
          >
            <Crown className="w-3 h-3 text-amber-500" />
            <span>Contest</span>
          </Link>

          {/* Universal Theme Toggle in Problem Solver Bar */}
          <ThemeToggle compact className="shadow-xs" />

          {/* Mobile Landscape Orientation Rotate Trigger Button */}
          <button
            type="button"
            onClick={reopenPrompt}
            className="lg:hidden p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 text-[11px] font-mono cursor-pointer active:scale-95 transition-all shadow-2xs"
            title="Rotate to Landscape Mode"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="sr-only">Rotate</span>
          </button>

          {/* User Avatar */}
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* MOBILE WORKSPACE SEGMENTED TABS (Only visible on screens < lg) */}
      <div className="lg:hidden flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-[#181818] border-b border-slate-200 dark:border-neutral-800 text-xs font-mono shrink-0 select-none shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#252526] p-0.5 rounded-xl border border-slate-200 dark:border-neutral-700/80">
          <button
            type="button"
            onClick={() => setMobileWorkspaceTab('problem')}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer',
              mobileWorkspaceTab === 'problem'
                ? 'bg-white dark:bg-[#1e1e1e] text-blue-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Problem</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileWorkspaceTab('code')}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer',
              mobileWorkspaceTab === 'code'
                ? 'bg-white dark:bg-[#1e1e1e] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileWorkspaceTab('console');
              setIsOutputOpen(true);
              setIsOutputMinimized(false);
            }}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer relative',
              mobileWorkspaceTab === 'console'
                ? 'bg-white dark:bg-[#1e1e1e] text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-500" />
            <span>Console</span>
            {runResult && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </button>
        </div>

        {/* Quick Landscape Rotate helper */}
        <button
          type="button"
          onClick={lockLandscape}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/10 to-brand-500/10 hover:from-amber-500/20 hover:to-brand-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold font-mono transition-all cursor-pointer active:scale-95 shadow-2xs"
          title="Switch to horizontal landscape mode for full IDE"
        >
          <RotateCw className="w-3 h-3 text-amber-500" />
          <span>Landscape 🔄</span>
        </button>
      </div>

      {/* 2. MAIN WORKSPACE: RESIZABLE 2-COLUMN SPLIT (LEFT: PROBLEM STATEMENT | RIGHT: CODE & CONSOLE) */}
      <div
        ref={workspaceRef}
        className={cn(
          'flex-1 flex flex-col lg:flex-row gap-1 p-1 sm:p-2 min-h-0 overflow-hidden bg-slate-100 dark:bg-[#121212] transition-colors',
          isDraggingH && 'select-none'
        )}
      >
        {/* LEFT PANE: STATEMENT / VIDEO TUTORIAL / SOLUTIONS / SUBMISSIONS / HINTS */}
        <div
          style={{
            width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftPaneWidth}%` : '100%',
          }}
          className={cn(
            'h-full flex-col rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm shrink-0 min-w-[280px] relative transition-colors',
            mobileWorkspaceTab === 'problem' ? 'flex' : 'hidden lg:flex'
          )}
        >
          {/* Tab Header Bar (Description, Video Tutorial, Solutions, Submissions, Hints, NEC AI) */}
          <div className="h-10 px-3 bg-slate-50 dark:bg-[#1e1e1e] border-b border-slate-200 dark:border-neutral-800 flex items-center gap-1 shrink-0 overflow-x-auto text-xs font-mono transition-colors">
            {/* 1. Description Tab */}
            <button
              onClick={() => {
                setActiveLeftTab('description');
                if (isOutputOpen && outputDrawerTab === 'arena-ai') {
                  setIsOutputOpen(false);
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer shrink-0',
                activeLeftTab === 'description' && !(isOutputOpen && outputDrawerTab === 'arena-ai')
                  ? 'bg-white dark:bg-[#2a2a2a] text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200 dark:border-transparent'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#2a2a2a]'
              )}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Description</span>
            </button>

            {/* 2. Video Tutorial Tab (with YouTube Icon) */}
            <button
              onClick={() => {
                setActiveLeftTab('editorial');
                if (isOutputOpen && outputDrawerTab === 'arena-ai') {
                  setIsOutputOpen(false);
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer shrink-0',
                activeLeftTab === 'editorial' && !(isOutputOpen && outputDrawerTab === 'arena-ai')
                  ? 'bg-white dark:bg-[#2a2a2a] text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200 dark:border-transparent'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#2a2a2a]'
              )}
            >
              <Youtube className="w-4 h-4 text-red-500 fill-red-500/20" />
              <span>Video Tutorial</span>
            </button>

            {/* 3. Solutions Tab */}
            <button
              onClick={() => {
                setActiveLeftTab('solutions');
                if (isOutputOpen && outputDrawerTab === 'arena-ai') {
                  setIsOutputOpen(false);
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer shrink-0',
                activeLeftTab === 'solutions' && !(isOutputOpen && outputDrawerTab === 'arena-ai')
                  ? 'bg-white dark:bg-[#2a2a2a] text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200 dark:border-transparent'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#2a2a2a]'
              )}
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Solutions</span>
            </button>

            {/* 4. Submissions Tab */}
            <button
              onClick={() => {
                setActiveLeftTab('submissions');
                if (isOutputOpen && outputDrawerTab === 'arena-ai') {
                  setIsOutputOpen(false);
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer shrink-0',
                activeLeftTab === 'submissions' && !(isOutputOpen && outputDrawerTab === 'arena-ai')
                  ? 'bg-white dark:bg-[#2a2a2a] text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200 dark:border-transparent'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#2a2a2a]'
              )}
            >
              <History className="w-3.5 h-3.5 text-purple-500" />
              <span>Submissions</span>
            </button>

            {/* 5. Hints Tab */}
            <button
              onClick={() => {
                setActiveLeftTab('hints');
                if (isOutputOpen && outputDrawerTab === 'arena-ai') {
                  setIsOutputOpen(false);
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer shrink-0',
                activeLeftTab === 'hints' && !(isOutputOpen && outputDrawerTab === 'arena-ai')
                  ? 'bg-white dark:bg-[#2a2a2a] text-amber-600 dark:text-amber-300 font-semibold shadow-xs border border-amber-500/30'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-[#2a2a2a]'
              )}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Hints</span>
              {safeHints.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-bold border border-amber-500/40">
                  {safeHints.length}
                </span>
              )}
            </button>

            {/* 6. NEC AI Tab (Placed right next to Hints / Tips above problem definition) */}
            <button
              type="button"
              onClick={() => {
                setActiveLeftTab('nec-ai');
                setIsOutputOpen(true);
                setIsOutputMinimized(false);
                setOutputDrawerTab('arena-ai');
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer shrink-0 border',
                activeLeftTab === 'nec-ai' || (isOutputOpen && outputDrawerTab === 'arena-ai')
                  ? 'bg-gradient-to-r from-blue-600/15 via-cyan-500/15 to-indigo-600/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/60 shadow-xs'
                  : 'text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-200 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/15 border-cyan-500/30 dark:border-cyan-500/30'
              )}
              title="NEC AI - Socratic Mentor"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 animate-pulse" />
              <span>NEC AI</span>
            </button>
          </div>

          {/* Left Content Scrollable View */}
          <div className="flex-1 p-5 overflow-y-auto space-y-6 text-slate-700 dark:text-neutral-300 text-sm leading-relaxed select-text">
            
            {/* 1. DESCRIPTION TAB */}
            {activeLeftTab === 'description' && (
              <div className="space-y-6 select-text">
                {/* Locked Banner if daily streak is solved today */}
                {isDailyStreakLocked && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-[#1c2420] dark:to-[#141a17] border border-emerald-500/40 text-xs space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Today's Daily Coding Streak Challenge Completed (+1🪙 Claimed)
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                        🔒 Locked for Today
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-300 leading-snug">
                      You have already solved and claimed today's daily streak reward. Submissions on this challenge are locked for the remainder of today to prevent duplicate coin claims. Next streak challenge unlocks tomorrow at 12:00 AM midnight.
                    </p>
                  </div>
                )}

                {/* Title & Metadata Header with Bookmark & Copy Button */}
                <div className="space-y-2.5 pb-2 border-b border-slate-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {displayProblemTitle}
                      </h1>
                      <button
                        type="button"
                        onClick={() => setIsBookmarkModalOpen(true)}
                        className={cn(
                          "transition-all cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a]",
                          isBookmarkedInLists
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-slate-400 hover:text-amber-500"
                        )}
                        title={
                          isBookmarkedInLists
                            ? `Saved in: ${savedListNames.join(', ')} (Click to manage collections)`
                            : "Save to Problem Lists (Favorites, Revise Later, Hard Questions)"
                        }
                      >
                        <Bookmark
                          className={cn(
                            "w-4 h-4 transition-transform active:scale-125",
                            isBookmarkedInLists && "fill-amber-500 text-amber-500 drop-shadow-xs"
                          )}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyProblem}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333333] text-slate-700 dark:text-neutral-200 text-xs font-mono transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-neutral-700/60"
                        title="Copy problem statement"
                      >
                        {problemCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />}
                        <span>{problemCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-bar Metadata Row (Difficulty, Accuracy, Submissions, Points, Average Time) */}
                  <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 dark:text-neutral-400 pt-1 font-mono">
                    <div>
                      <span className="text-slate-500 dark:text-neutral-500">Difficulty: </span>
                      <span
                        className={cn(
                          'font-semibold',
                          problem.difficulty === 'Easy' || (problem.difficulty as string) === 'Basic'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : problem.difficulty === 'Medium'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {problem.difficulty}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-neutral-500">Accuracy: </span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">
                        {problem.accuracy || `${(problem.acceptanceRate || 58.62).toFixed(2)}%`}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-neutral-500">Submissions: </span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">
                        {problem.submissionsCount || '150K+'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-neutral-500">Points: </span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">
                        {problem.points || (problem.difficulty === 'Hard' ? 300 : problem.difficulty === 'Medium' ? 200 : 100)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-neutral-500">Average Time: </span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">
                        {problem.averageTime || (problem.difficulty === 'Hard' ? '45m' : problem.difficulty === 'Medium' ? '30m' : '15m')}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Authentic Companies Badges (Only rendered if problem was genuinely asked in companies) */}
                  {problem.companies && Array.isArray(problem.companies) && problem.companies.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-200/70 dark:border-neutral-800/70 mt-2.5">
                      <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-neutral-400 flex items-center gap-1 mr-1">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        Companies:
                      </span>
                      {problem.companies.map((company) => (
                        <span
                          key={company}
                          className="px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-mono font-medium"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Natural Problem Description (No raw markdown hashes) */}
                <div className="text-slate-800 dark:text-neutral-200 leading-relaxed text-sm whitespace-pre-line select-text">
                  {problem.description.replace(/^#+\s+/gm, '')}
                </div>

                {/* Examples: Header & Cards */}
                <div className="space-y-3 select-text">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Examples:
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {safeSampleTestCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-neutral-800 text-xs font-mono space-y-2 text-slate-800 dark:text-neutral-200"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-neutral-800">
                          <span className="font-semibold text-slate-500 dark:text-neutral-400">Example {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyExample(idx, tc)}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                            title="Copy example input & output"
                          >
                            {copiedExampleIdx === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedExampleIdx === idx ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-neutral-100">Input: </span>
                          <span className="text-slate-700 dark:text-neutral-300">{tc.input}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-neutral-100">Output: </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tc.expectedOutput}</span>
                        </div>
                        {(tc as any).explanation && (
                          <div className="pt-1.5 border-t border-slate-200/80 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 font-sans text-xs leading-relaxed">
                            <span className="font-bold text-slate-900 dark:text-neutral-200 block mb-1 font-mono">Explanation:</span>
                            <span className="whitespace-pre-line">{(tc as any).explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                {safeConstraints.length > 0 && (
                  <div className="space-y-2 select-text">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Constraints:
                    </h3>
                    <div className="space-y-1 font-mono text-xs text-slate-700 dark:text-neutral-300 pl-1">
                      {safeConstraints.map((c, i) => (
                        <div key={i} className="flex items-baseline gap-2">
                          <span className="text-slate-400">•</span>
                          <span>{c.replace(/^-\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Try More Examples Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOutputOpen(true);
                      setOutputDrawerTab('custom');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Try more examples</span>
                  </button>
                </div>

                {/* Accordion: Expected Complexities */}
                <div className="border-t border-slate-200 dark:border-neutral-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowExpectedComplexities(!showExpectedComplexities)}
                    className="w-full flex items-center justify-between py-2 text-left font-bold text-sm text-slate-900 dark:text-white cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>Expected Complexities</span>
                    {showExpectedComplexities ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showExpectedComplexities && (
                    <div className="py-2 text-xs font-mono space-y-1 text-slate-700 dark:text-neutral-300">
                      <div>
                        <span className="text-slate-500 dark:text-neutral-400">Time Complexity: </span>
                        <span className="font-semibold text-slate-900 dark:text-neutral-100">{problem.expectedComplexity?.time || 'O(n)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-neutral-400">Auxiliary Space: </span>
                        <span className="font-semibold text-slate-900 dark:text-neutral-100">{problem.expectedComplexity?.space || 'O(1)'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion: Topic Tags */}
                <div className="border-t border-slate-200 dark:border-neutral-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowTopicTags(!showTopicTags)}
                    className="w-full flex items-center justify-between py-2 text-left font-bold text-sm text-slate-900 dark:text-white cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>Topic Tags</span>
                    {showTopicTags ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showTopicTags && (
                    <div className="py-2 flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700/60 font-mono">
                        {problem.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Accordion: Company Tags (Only rendered if authentic interview tags exist) */}
                {problem.companies && Array.isArray(problem.companies) && problem.companies.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-neutral-800 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowCompanies(!showCompanies)}
                      className="w-full flex items-center justify-between py-2 text-left font-bold text-sm text-slate-900 dark:text-white cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-500" />
                        <span>Company Tags</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                          {problem.companies.length}
                        </span>
                      </div>
                      {showCompanies ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    {showCompanies && (
                      <div className="py-2 flex items-center gap-2 flex-wrap text-xs">
                        {problem.companies.map((c: string) => (
                          <span
                            key={c}
                            className="px-2.5 py-1 rounded-md bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono text-[11px]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Accordion: Related Problems */}
                <div className="border-t border-slate-200 dark:border-neutral-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRelatedProblems(!showRelatedProblems)}
                    className="w-full flex items-center justify-between py-2 text-left font-bold text-sm text-slate-900 dark:text-white cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-500" />
                      <span>Related Problems</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                        {relatedProblems.length}
                      </span>
                    </div>
                    {showRelatedProblems ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showRelatedProblems && (
                    <div className="py-2 space-y-2">
                      {relatedProblems.map((rel) => {
                        const diffClass =
                          rel.difficulty === 'Hard'
                            ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                            : rel.difficulty === 'Medium'
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                        return (
                          <Link
                            key={rel.slug || rel.id}
                            to={`/dsa/${encodeURIComponent(rel.slug)}`}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1f202c] dark:hover:bg-[#282a3a] border border-slate-200 dark:border-neutral-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 group-hover:scale-125 transition-transform" />
                              <span className="font-semibold text-xs text-slate-800 dark:text-neutral-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate transition-colors">
                                {rel.displayTitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border', diffClass)}>
                                {rel.difficulty}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-500 transition-all" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Accordion: Student Discussion & Comments */}
                <ProblemDiscussionSection
                  comments={comments}
                  onPostComment={handlePostComment}
                  onLikeComment={handleLikeComment}
                  onDeleteComment={handleDeleteComment}
                  user={user}
                  slug={problem.slug}
                  defaultExpanded={true}
                />

                {/* Report An Issue */}
                <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => info('Thank you! Feedback received.')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Bug className="w-3.5 h-3.5" />
                    <span>Report An Issue</span>
                  </button>
                </div>

                {/* Left Panel Footer: Like / Dislike / Community */}
                <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-mono">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setHasLiked(!hasLiked);
                        setLikesCount((prev) => (hasLiked ? prev - 1 : prev + 1));
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333333] transition-colors cursor-pointer border border-slate-200 dark:border-transparent',
                        hasLiked ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-neutral-400'
                      )}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{likesCount}</span>
                    </button>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333333] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border border-slate-200 dark:border-transparent"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-500 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>2,102 Online</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. VIDEO TUTORIAL TAB */}
            {activeLeftTab === 'editorial' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Youtube className="w-6 h-6 text-red-500 fill-red-500/20" />
                    <span>Video Tutorial & Algorithm Breakdown</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Step-by-step intuition, code visualization, and time/space complexity proof.
                  </p>
                </div>

                {embedUrl ? (
                  <div className="space-y-4">
                    {/* YouTube Responsive Embed */}
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-neutral-800 shadow-lg">
                      <iframe
                        src={embedUrl}
                        title={`Video Tutorial - ${displayProblemTitle}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 dark:text-neutral-400 flex items-center gap-1.5">
                        <Youtube className="w-4 h-4 text-red-500" />
                        Master full algorithm walkthrough
                      </span>
                      {watchUrl && (
                        <a
                          href={watchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-500 dark:text-red-400 hover:underline flex items-center gap-1.5 font-semibold bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-800/40 px-3 py-1 rounded-lg transition-colors"
                        >
                          <Youtube className="w-3.5 h-3.5 text-red-500" />
                          <span>Watch on YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-neutral-800 text-center space-y-2">
                    <Youtube className="w-10 h-10 text-red-500/60 mx-auto" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-neutral-200">Video Tutorial Coming Soon</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Check the hints tab or optimal solutions tab for step-by-step guidance.
                    </p>
                  </div>
                )}

                {/* Complexity Summary */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-neutral-800 space-y-2.5 font-mono text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider text-[11px]">
                    Complexity Analysis:
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-neutral-300">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-neutral-700/60">
                      <span className="text-slate-500 dark:text-neutral-400 block text-[10px]">Time Complexity:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">O(N) / O(log N)</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-neutral-700/60">
                      <span className="text-slate-500 dark:text-neutral-400 block text-[10px]">Space Complexity:</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">O(1) / O(N)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SOLUTIONS TAB */}
            {activeLeftTab === 'solutions' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-500" />
                  <span>Optimal Solution Approaches</span>
                </h3>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-mono">Approach 1: One-Pass Hash Map</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">Time: O(N), Space: O(N)</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-sans">
                      We iterate through the array once. For each element, we check if the complement (<code>target - nums[i]</code>) exists in our hash map. If found, we return the pair of indices immediately.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-xs font-mono">Approach 2: Two Pointers (Sorted)</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">Time: O(N log N), Space: O(1)</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-sans">
                      Sort the array and maintain two pointers (left and right). Move pointers inward based on whether the current sum is less than or greater than target.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SUBMISSIONS TAB */}
            {activeLeftTab === 'submissions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-500" />
                    <span>Your Past Submissions</span>
                  </h3>
                  <button
                    type="button"
                    onClick={fetchSubmissions}
                    className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>

                {loadingSubmissions ? (
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">Loading history...</p>
                ) : pastSubmissions.length > 0 ? (
                  <div className="divide-y divide-slate-200 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-[#262626] overflow-hidden text-xs font-mono">
                    {pastSubmissions.map((sub, i) => (
                      <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#2e2e2e] transition-colors">
                        <div className="space-y-0.5">
                          <span
                            className={cn(
                              'font-bold',
                              sub.status === 'Accepted' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            )}
                          >
                            {sub.status}
                          </span>
                          <span className="text-slate-500 dark:text-neutral-500 block text-[11px]">
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <div className="text-right text-slate-600 dark:text-neutral-400">
                          <span>{sub.language}</span>
                          <span className="block text-[11px] text-slate-400 dark:text-neutral-500">{sub.executionTime || 0} ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-neutral-800 text-center text-xs text-slate-500 dark:text-neutral-400">
                    No submissions recorded yet for this problem. Submit your solution on the right to see your history!
                  </div>
                )}
              </div>
            )}

            {/* 5. HINTS TAB */}
            {activeLeftTab === 'hints' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-amber-600 dark:text-amber-300 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <span>Problem Hints & Tips ({safeHints.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Step-by-step clues to deduce the optimal algorithm without spoiling the complete answer.
                    </p>
                  </div>

                  {safeHints.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={revealedHints.size === safeHints.length ? handleHideAllHints : handleRevealAllHints}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333333] border border-slate-200 dark:border-neutral-700 text-xs font-mono text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {revealedHints.size === safeHints.length ? (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-500 dark:text-neutral-400" />
                            <span>Hide All</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-amber-500" />
                            <span>Reveal All</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Socratic AI Mentor Banner */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-3 flex-wrap shadow-xs">
                  <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-neutral-200">
                    <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400 animate-pulse shrink-0" />
                    <span>Need Socratic hints? Ask <strong>NEC AI</strong> for Progressive Hints (Intuition → Data Structure → Pseudocode).</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOutputOpen(true);
                      setIsOutputMinimized(false);
                      setOutputDrawerTab('arena-ai');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-200" />
                    <span>Ask NEC AI for Hints</span>
                  </button>
                </div>

                {safeHints.length > 0 ? (
                  <div className="space-y-3">
                    {safeHints.map((hint, idx) => {
                      const isRevealed = revealedHints.has(idx);
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'p-4 rounded-xl border transition-all duration-200 space-y-2',
                            isRevealed
                              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 shadow-xs'
                              : 'bg-slate-50 dark:bg-[#262626] border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-neutral-200 text-xs font-mono">
                                Hint {idx + 1}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleHint(idx)}
                              className={cn(
                                'px-2.5 py-1 rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                                isRevealed
                                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                  : 'bg-white hover:bg-slate-100 dark:bg-[#1e1e1e] dark:hover:bg-[#2e2e2e] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700'
                              )}
                            >
                              {isRevealed ? (
                                <>
                                  <EyeOff className="w-3 h-3 text-amber-500" />
                                  <span>Hide Hint</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3 text-amber-500" />
                                  <span>Reveal Hint</span>
                                </>
                              )}
                            </button>
                          </div>

                          {isRevealed && (
                            <div className="pt-2 border-t border-amber-500/20 text-xs text-slate-700 dark:text-neutral-200 leading-relaxed font-sans animate-in fade-in slide-in-from-top-1 duration-150">
                              {sanitizeAiText(hint)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-neutral-800 text-center space-y-2">
                    <Lightbulb className="w-8 h-8 text-slate-400 dark:text-neutral-500 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">No Hints for this Problem</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Try breaking the problem into sub-problems or check the Video Tutorial tab!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 6. NEC AI TAB VIEW */}
            {activeLeftTab === 'nec-ai' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Hero Socratic NEC AI Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-cyan-50/50 to-indigo-50/80 dark:from-[#131a30] dark:via-[#151c33] dark:to-[#0f172a] border border-cyan-500/30 dark:border-cyan-500/40 shadow-xl space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            NEC AI Mentor
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/40">
                            Socratic
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">
                          Pedagogical hints, logic debugging & complexity analysis without full spoilers
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOutputOpen(true);
                        setIsOutputMinimized(false);
                        setOutputDrawerTab('arena-ai');
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(6,182,212,0.35)] active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Open Interactive AI Chat</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed font-sans">
                    Whenever your solution encounters <strong>Wrong Answer</strong>, <strong>Time Limit Exceeded</strong>, or logic bottlenecks, NEC AI guides your thinking step-by-step through gentle hints and edge case checks.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOutputOpen(true);
                        setIsOutputMinimized(false);
                        setOutputDrawerTab('arena-ai');
                      }}
                      className="p-3.5 rounded-xl bg-white/80 dark:bg-[#1a2035]/80 hover:bg-white dark:hover:bg-[#202742] border border-cyan-500/20 hover:border-cyan-500/60 transition-all text-left group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs mb-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span>Progressive Hints</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-normal">
                        Unlock <strong>Intuition → Data Structure → Pseudocode</strong> progressively.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOutputOpen(true);
                        setIsOutputMinimized(false);
                        setOutputDrawerTab('arena-ai');
                      }}
                      className="p-3.5 rounded-xl bg-white/80 dark:bg-[#1a2035]/80 hover:bg-white dark:hover:bg-[#202742] border border-cyan-500/20 hover:border-cyan-500/60 transition-all text-left group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs mb-1.5">
                        <Terminal className="w-4 h-4 text-blue-500" />
                        <span>Socratic Debugger</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-normal">
                        Inspect failed test cases & boundary conditions without giving away code.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOutputOpen(true);
                        setIsOutputMinimized(false);
                        setOutputDrawerTab('arena-ai');
                      }}
                      className="p-3.5 rounded-xl bg-white/80 dark:bg-[#1a2035]/80 hover:bg-white dark:hover:bg-[#202742] border border-cyan-500/20 hover:border-cyan-500/60 transition-all text-left group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs mb-1.5">
                        <Code2 className="w-4 h-4 text-emerald-500" />
                        <span>Complexity Review</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-normal">
                        Verify whether your algorithmic time & space fit problem constraints.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SLIDING OUTPUT WINDOW DRAWER (Problem Definition / Left Pane Side) */}
          <OutputWindowDrawer
            isOpen={isOutputOpen}
            onClose={() => {
              setIsOutputOpen(false);
              if (activeLeftTab === 'nec-ai') {
                setActiveLeftTab('description');
              }
            }}
            isMinimized={isOutputMinimized}
            onToggleMinimize={() => setIsOutputMinimized(!isOutputMinimized)}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            activeTab={outputDrawerTab}
            onTabChange={setOutputDrawerTab}
            testCases={(evaluatedSampleCases.length > 0 ? evaluatedSampleCases : safeSampleTestCases).map((tc: any) => ({
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || '',
              actualOutput: tc.actualOutput !== undefined ? tc.actualOutput : runResult?.output,
              passed: tc.passed !== undefined
                ? tc.passed
                : runResult
                ? (runResult.passed !== undefined ? runResult.passed : !runResult.error)
                : submissionResult
                ? submissionResult?.submission?.status === 'Accepted'
                : undefined,
              explanation: tc.explanation,
            }))}
            selectedCaseIdx={selectedCaseIdx}
            onSelectCaseIdx={setSelectedCaseIdx}
            customInput={customInput}
            onCustomInputChange={setCustomInput}
            onAddCustomCase={handleOpenCustomInput}
            runResult={runResult}
            submissionResult={
              submissionResult
                ? {
                    status: submissionResult?.submission?.status || 'Evaluated',
                    testCasesPassed: submissionResult?.submission?.testCasesPassed || 0,
                    totalTestCases: submissionResult?.submission?.totalTestCases || safeSampleTestCases.length,
                    executionTime: submissionResult?.submission?.executionTime,
                    memory: submissionResult?.submission?.memory,
                    error: submissionResult?.submission?.errorMessage,
                    coinsAwarded: submissionResult?.submission?.status === 'Accepted' ? (problem.difficulty === 'Easy' ? 1 : problem.difficulty === 'Medium' ? 2 : 4) : 0,
                  }
                : null
            }
            onRunCode={handleRunCode}
            onSubmitCode={handleSubmitCode}
            problemTitle={displayProblemTitle}
            problemDescription={problem.description}
            problemHints={problem.hints}
            userScore={wallet.coins || 415}
            pointsScored={problem.difficulty === 'Easy' ? 2 : problem.difficulty === 'Medium' ? 4 : 8}
            totalPoints={problem.difficulty === 'Easy' ? 2 : problem.difficulty === 'Medium' ? 4 : 8}
            attemptsCount={{
              correct: 1,
              total: Math.max((pastSubmissions || []).length + 1, 1),
              accuracy: (pastSubmissions || []).length === 0 ? 100 : Math.round((1 / ((pastSubmissions || []).length + 1)) * 100),
            }}
            code={code}
            language={selectedLanguage}
          />
        </div>

        {/* HORIZONTAL RESIZE DIVIDER (GFG / LEETCODE STYLE) */}
        <div
          onMouseDown={handleMouseDownH}
          onDoubleClick={() => {
            setLeftPaneWidth(45);
            localStorage.setItem('nextera:practice_split_width', '45');
          }}
          title="Drag left/right to resize question & code editor • Double-click to reset (45/55)"
          className={cn(
            'hidden lg:flex flex-col items-center justify-center w-2.5 hover:w-2.5 cursor-col-resize select-none z-30 group relative transition-colors shrink-0',
            isDraggingH ? 'bg-brand-500/20' : 'hover:bg-slate-200 dark:hover:bg-neutral-800/80'
          )}
        >
          {/* Vertical track line */}
          <div
            className={cn(
              'w-[2px] h-full transition-colors rounded-full',
              isDraggingH ? 'bg-brand-400 shadow-sm shadow-brand-500/50' : 'bg-slate-200 dark:bg-neutral-800 group-hover:bg-brand-400/80'
            )}
          />
          {/* Center Pill Handle with arrows like GeeksforGeeks/LeetCode */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-5 h-9 rounded-full bg-white dark:bg-[#242424] border flex items-center justify-center shadow-md transition-all pointer-events-none',
              isDraggingH
                ? 'border-brand-400 bg-brand-500 text-slate-950 scale-110 shadow-brand-500/40'
                : 'border-slate-300 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 group-hover:border-brand-400 group-hover:text-brand-500 dark:group-hover:text-brand-300 group-hover:scale-105'
            )}
          >
            <div className="flex items-center gap-[1px] text-[9px] font-bold font-mono select-none">
              <span>‹</span>
              <span className="opacity-40 text-[7px]">|</span>
              <span>›</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: PROFESSIONAL FULL-HEIGHT CODE EDITOR + BOTTOM ACTION TOOLBAR */}
        <div
          ref={rightPaneRef}
          style={
            isFullScreen
              ? { width: '100vw', height: '100vh', position: 'fixed', inset: 0, zIndex: 9999, padding: '8px' }
              : {
                  width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `calc(${100 - leftPaneWidth}% - 10px)` : '100%',
                }
          }
          className={cn(
            'flex-col min-h-0 overflow-hidden shrink-0 bg-slate-100 dark:bg-[#121212] relative',
            isFullScreen ? 'fixed inset-0 z-50 p-2 flex' : 'h-full flex-1',
            mobileWorkspaceTab === 'code' || mobileWorkspaceTab === 'console' ? 'flex' : 'hidden lg:flex'
          )}
        >
          {/* TOP RIGHT: CODE EDITOR (Full Vertical Space) */}
          <div className="flex-1 flex flex-col rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm min-h-0">
            {/* Editor Toolbar */}
            <div className="h-10 px-3 bg-slate-50 dark:bg-[#1e1e1e] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2 shrink-0 text-xs font-mono relative">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 hidden sm:flex">
                  <Code2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  Code
                </span>

                {/* Language Select Dropdown */}
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="code-editor-select h-7 px-2 rounded-md bg-white dark:bg-[#2a2a2a] border border-slate-300 dark:border-neutral-700/80 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-brand-500 font-mono font-bold capitalize cursor-pointer shadow-2xs"
                >
                  {[
                    { id: 'java', label: 'Java' },
                    { id: 'python', label: 'Python' },
                    { id: 'cpp', label: 'C++' },
                    { id: 'c', label: 'C' },
                    { id: 'javascript', label: 'JavaScript' },
                  ].map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>

                {/* Toolbar Stopwatch Timer Button (GFG / LeetCode Style) */}
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  onDoubleClick={() => {
                    setSeconds(0);
                    setTimerRunning(false);
                    success('Stopwatch reset to 00:00');
                  }}
                  title={
                    timerRunning
                      ? `Stopwatch: ${formatTimer(seconds)} • Click to pause • Double-click to reset`
                      : `Stopwatch paused • Click to resume • Double-click to reset`
                  }
                  className={cn(
                    'h-7 px-2.5 rounded-md border text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer',
                    timerRunning
                      ? 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400'
                      : 'border-slate-300 dark:border-neutral-700 bg-white dark:bg-[#262626] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-600'
                  )}
                >
                  <Timer
                    className={cn(
                      'w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400',
                      timerRunning && 'animate-pulse'
                    )}
                  />
                  <span>{seconds === 0 && !timerRunning ? 'Start Timer' : formatTimer(seconds)}</span>
                  {timerRunning ? (
                    <Pause className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400 opacity-70 ml-0.5" />
                  ) : (
                    <Play className="w-2.5 h-2.5 text-slate-500 dark:text-neutral-400 opacity-70 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Editor Actions Toolbar (Format, Copy, Restore, Settings, Reset, Fullscreen) */}
              <div className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                {/* Mobile Landscape Toggle Button */}
                {isMobile && (
                  <button
                    type="button"
                    onClick={lockLandscape}
                    title={isPortrait ? 'Rotate to Landscape Mode' : 'Landscape Active'}
                    className={cn(
                      'h-7 px-2 rounded-md border text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs',
                      isPortrait
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                    )}
                  >
                    <RotateCw className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[10px]">Landscape</span>
                  </button>
                )}

                {/* 1. Format Code */}
                <button
                  type="button"
                  onClick={handleFormatCode}
                  title="Format Code (Indent & Beautify)"
                  className="p-1.5 rounded-md text-slate-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>

                {/* 2. Copy Code */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy Code to Clipboard"
                  className="p-1.5 rounded-md text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* 3. Restore Last Submitted Code */}
                <button
                  type="button"
                  onClick={handleRestoreLastSubmittedCode}
                  title="Restore Last Submitted Code"
                  className="p-1.5 rounded-md text-slate-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                </button>

                {/* 4. Editor Settings */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    title="Editor Settings (Font Size, Theme, Tab Size, Wrap)"
                    className={cn(
                      'p-1.5 rounded-md transition-colors cursor-pointer',
                      isSettingsOpen ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a]'
                    )}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  {/* Settings Dropdown Popover */}
                  {isSettingsOpen && (
                    <div
                      ref={settingsRef}
                      className="absolute right-0 top-9 z-50 w-72 rounded-xl bg-white dark:bg-[#222222] border border-slate-200 dark:border-neutral-700 shadow-2xl p-4 text-xs font-mono space-y-4 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                          <Settings className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                          Editor Settings
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSettingsOpen(false)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Font Size Option */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-slate-700 dark:text-neutral-300">
                          <span className="text-slate-500 dark:text-neutral-400">Font Size:</span>
                          <span className="font-bold text-brand-600 dark:text-brand-300">{fontSize}px</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[12, 13, 14, 15, 16, 18].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setFontSize(size);
                                localStorage.setItem('nextera:editor_fontsize', String(size));
                              }}
                              className={cn(
                                'px-2 py-1 rounded text-[11px] font-bold transition-colors border cursor-pointer',
                                fontSize === size
                                  ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300 border-brand-500/50'
                                  : 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700 hover:text-slate-900 dark:hover:text-white'
                              )}
                            >
                              {size}px
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tab Size Option */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-slate-700 dark:text-neutral-300">
                          <span className="text-slate-500 dark:text-neutral-400">Tab Size:</span>
                          <span className="font-bold text-brand-600 dark:text-brand-300">{tabSize} spaces</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[2, 4].map((spaces) => (
                            <button
                              key={spaces}
                              type="button"
                              onClick={() => {
                                setTabSize(spaces);
                                localStorage.setItem('nextera:editor_tabsize', String(spaces));
                              }}
                              className={cn(
                                'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border text-center cursor-pointer',
                                tabSize === spaces
                                  ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300 border-brand-500/50'
                                  : 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700 hover:text-slate-900 dark:hover:text-white'
                              )}
                            >
                              {spaces} Spaces
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Theme Selector */}
                      <div className="space-y-1.5">
                        <span className="text-slate-500 dark:text-neutral-400 block">Theme:</span>
                        <select
                          value={editorTheme}
                          onChange={(e) => {
                            setEditorTheme(e.target.value);
                            localStorage.setItem('nextera:editor_theme', e.target.value);
                          }}
                          className="w-full h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#2a2a2a] border border-slate-300 dark:border-neutral-700 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                        >
                          {Object.values(EDITOR_THEMES).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Word Wrap Toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-neutral-800">
                        <span className="text-slate-700 dark:text-neutral-300">Word Wrap</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !wordWrap;
                            setWordWrap(next);
                            localStorage.setItem('nextera:editor_wordwrap', String(next));
                          }}
                          className={cn(
                            'w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer',
                            wordWrap ? 'bg-brand-500' : 'bg-slate-300 dark:bg-neutral-700'
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full bg-white transition-transform',
                              wordWrap ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>

                      {/* Line Numbers Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 dark:text-neutral-300">Line Numbers</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !showLineNumbers;
                            setShowLineNumbers(next);
                            localStorage.setItem('nextera:editor_linenumbers', String(next));
                          }}
                          className={cn(
                            'w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer',
                            showLineNumbers ? 'bg-brand-500' : 'bg-slate-300 dark:bg-neutral-700'
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full bg-white transition-transform',
                              showLineNumbers ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Reset Template Code */}
                <button
                  type="button"
                  onClick={handleResetCode}
                  title="Reset starter template code"
                  className="p-1.5 rounded-md text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* 6. Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={handleToggleFullScreen}
                  title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Full Screen Editor'}
                  className={cn(
                    'p-1.5 rounded-md transition-colors cursor-pointer',
                    isFullScreen ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2a2a]'
                  )}
                >
                  {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Monthly Contest Anti-Cheat Active Notice Banner */}
            {isMonthlyContest && (
              <div className="px-3.5 py-1.5 bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/25 flex items-center justify-between text-xs font-mono text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-bold">NextEra Monthly Contest</span>
                  <span className="text-[11px] opacity-80 hidden sm:inline">• Anti-Cheat Active (Copy-Paste Disabled)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/practice/monthly-contest"
                    className="text-[11px] font-semibold underline hover:text-amber-600 dark:hover:text-amber-200"
                  >
                    View All 18 Problems →
                  </Link>
                </div>
              </div>
            )}

            {/* Professional Syntax Highlighting Code Editor */}
            <div className="flex-1 overflow-hidden relative">
              <ProfessionalCodeEditor
                value={code}
                onChange={handleCodeChange}
                language={selectedLanguage}
                theme={editorTheme}
                fontSize={fontSize}
                tabSize={tabSize}
                wordWrap={wordWrap}
                showLineNumbers={showLineNumbers}
                onRun={handleRunCode}
                onSubmit={handleSubmitCode}
                className="h-full border-none"
                disableCopyPaste={isMonthlyContest}
                onCopyPasteBlocked={handleCopyPasteBlocked}
              />
            </div>

            {/* Editor Footer Status */}
            <div className="h-6 px-3 bg-slate-100 dark:bg-[#181818] border-t border-slate-200 dark:border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-500 shrink-0">
              <span className="flex items-center gap-2">
                <span>Saved locally</span>
                <span>•</span>
                <span>{selectedLanguage}</span>
                <span>•</span>
                <span>{fontSize}px</span>
              </span>
              <span>Ln {lineCount}, Col 1</span>
            </div>
          </div>

          {/* BOTTOM ACTION TOOLBAR - CONSOLE ONLY */}
          <div className="h-11 px-3 bg-white dark:bg-gradient-to-r dark:from-[#14151d] dark:via-[#1a1b26] dark:to-[#14151d] border border-slate-200 dark:border-neutral-800/90 rounded-xl mt-1.5 flex items-center justify-between shrink-0 text-xs font-mono shadow-xs backdrop-blur-md">
            {/* Console Drawer Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isOutputOpen) {
                  setIsOutputOpen(true);
                  setIsOutputMinimized(false);
                  if (outputDrawerTab === 'arena-ai') {
                    setOutputDrawerTab('results');
                  }
                } else {
                  setIsOutputOpen(false);
                }
              }}
              className={cn(
                'h-8 px-3.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 shadow-xs',
                isOutputOpen && outputDrawerTab !== 'arena-ai'
                  ? 'bg-blue-600/20 text-blue-600 dark:text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1e1f2b] dark:hover:bg-[#282a3a] text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white border-slate-300 dark:border-neutral-700/80 hover:border-blue-500/40 hover:shadow-[0_0_12px_rgba(59,130,246,0.15)]'
              )}
              title="Toggle Console Output Window"
            >
              <div className="relative flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                {isOutputOpen && outputDrawerTab !== 'arena-ai' && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                )}
              </div>
              <span className="font-semibold tracking-wide">Console</span>
              <ChevronUp className={cn('w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 transition-transform duration-200', isOutputOpen && outputDrawerTab !== 'arena-ai' && 'rotate-180 text-blue-500 dark:text-blue-400')} />
            </button>
          </div>
        </div>
      </div>

      {/* ANIMATED COIN REWARD MODAL */}
      <AnimatedCoinModal
        isOpen={coinModalData.isOpen}
        onClose={() => setCoinModalData((prev) => ({ ...prev, isOpen: false }))}
        coins={coinModalData.coins}
        dailyCoins={coinModalData.dailyCoins}
        extraCoins={coinModalData.extraCoins}
        title={coinModalData.title}
        subtitle={coinModalData.subtitle}
        badgeText={coinModalData.badgeText}
        streakCount={coinModalData.streakCount}
        isBonus={coinModalData.isBonus}
        isDailyStreak={true}
      />

      {/* MOBILE LANDSCAPE MODE PROMPT */}
      <MobileLandscapePrompt
        isOpen={showPrompt}
        onRotateLandscape={lockLandscape}
        onDismiss={dismissPrompt}
        title="Rotate Phone for Coding"
        subtitle="Writing code and viewing test cases in portrait is not practical. Rotate your device to landscape for the full IDE experience."
      />

      {/* BOOKMARK & CUSTOM PROBLEM LISTS MODAL */}
      <BookmarkProblemModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        problem={problem}
      />
    </div>
  );
};
