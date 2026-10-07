import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { ROUTES } from '../../constants/routes';
import {
  sundayContestService,
  PRACTICE_PROBLEMS_CATALOG,
  SundayContestProblem,
} from '../../services/contest.service';
import {
  Flame,
  Sparkles,
  Bot,
  UserCheck,
  Search,
  CheckCircle2,
  Clock,
  Code2,
  Calendar,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Coins,
  X,
  FileCode,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Interface for a student solver record
export interface PotdSolverRecord {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar: string;
  college: string;
  streak: number;
  longestStreak: number;
  solvedAt: string; // ISO string or formatted
  solveTimeMinutes: number;
  solveTimeSeconds: number;
  language: 'C++' | 'Python' | 'Java' | 'JavaScript' | 'TypeScript';
  runtimeMs: number;
  memoryMb: number;
  testCasesPassed: string;
  coinsEarned: number;
  submittedCode: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded';
}

// Initial realistic solver submissions for today's POTD
const INITIAL_SOLVERS: PotdSolverRecord[] = [
  {
    id: 'solv-1',
    userId: 'u-101',
    name: 'Aarav Sharma',
    username: 'aarav_codes',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    college: 'IIT Delhi',
    streak: 42,
    longestStreak: 45,
    solvedAt: 'Today at 06:14 AM',
    solveTimeMinutes: 8,
    solveTimeSeconds: 24,
    language: 'C++',
    runtimeMs: 12,
    memoryMb: 14.8,
    testCasesPassed: '28/28 (100%)',
    coinsEarned: 150,
    status: 'Accepted',
    submittedCode: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> solveProblem(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
  },
  {
    id: 'solv-2',
    userId: 'u-102',
    name: 'Priya Iyer',
    username: 'priya_algo',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    college: 'BITS Pilani',
    streak: 28,
    longestStreak: 30,
    solvedAt: 'Today at 06:38 AM',
    solveTimeMinutes: 11,
    solveTimeSeconds: 15,
    language: 'Python',
    runtimeMs: 44,
    memoryMb: 17.2,
    testCasesPassed: '28/28 (100%)',
    coinsEarned: 150,
    status: 'Accepted',
    submittedCode: `class Solution:
    def solveProblem(self, nums: list[int], target: int) -> list[int]:
        lookup = {}
        for idx, val in enumerate(nums):
            diff = target - val
            if diff in lookup:
                return [lookup[diff], idx]
            lookup[val] = idx
        return []`,
  },
  {
    id: 'solv-3',
    userId: 'u-103',
    name: 'Rohan Mehra',
    username: 'rohan_dev',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    college: 'NIT Trichy',
    streak: 19,
    longestStreak: 21,
    solvedAt: 'Today at 07:05 AM',
    solveTimeMinutes: 14,
    solveTimeSeconds: 50,
    language: 'Java',
    runtimeMs: 18,
    memoryMb: 42.1,
    testCasesPassed: '28/28 (100%)',
    coinsEarned: 150,
    status: 'Accepted',
    submittedCode: `import java.util.HashMap;
import java.util.Map;

public class Solution {
    public int[] solveProblem(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (map.containsKey(comp)) {
                return new int[] { map.get(comp), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
  },
  {
    id: 'solv-4',
    userId: 'u-104',
    name: 'Ananya Sen',
    username: 'ananya_codes',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    college: 'IIIT Hyderabad',
    streak: 35,
    longestStreak: 40,
    solvedAt: 'Today at 07:42 AM',
    solveTimeMinutes: 9,
    solveTimeSeconds: 5,
    language: 'JavaScript',
    runtimeMs: 56,
    memoryMb: 48.5,
    testCasesPassed: '28/28 (100%)',
    coinsEarned: 150,
    status: 'Accepted',
    submittedCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solveProblem(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
  },
  {
    id: 'solv-5',
    userId: 'u-105',
    name: 'Vikramaditya Roy',
    username: 'v_roy_ai',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    college: 'DTU Delhi',
    streak: 15,
    longestStreak: 18,
    solvedAt: 'Today at 08:20 AM',
    solveTimeMinutes: 16,
    solveTimeSeconds: 30,
    language: 'C++',
    runtimeMs: 14,
    memoryMb: 15.1,
    testCasesPassed: '28/28 (100%)',
    coinsEarned: 150,
    status: 'Accepted',
    submittedCode: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> solveProblem(vector<int>& nums, int target) {
        // Optimized linear scan with fast unordered lookup
        unordered_map<int, int> mp;
        mp.reserve(nums.size());
        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            auto it = mp.find(complement);
            if (it != mp.end()) {
                return {it->second, i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};`,
  },
  {
    id: 'solv-6',
    userId: 'u-106',
    name: 'Sneha Patel',
    username: 'sneha_p',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    college: 'VIT Vellore',
    streak: 9,
    longestStreak: 14,
    solvedAt: 'Today at 08:55 AM',
    solveTimeMinutes: 22,
    solveTimeSeconds: 40,
    language: 'Python',
    runtimeMs: 52,
    memoryMb: 18.0,
    testCasesPassed: '28/28 (100%)',
    coinsEarned: 150,
    status: 'Accepted',
    submittedCode: `class Solution:
    def solveProblem(self, nums: list[int], target: int) -> list[int]:
        # Two pointer or hashmap approach
        seen = {}
        for i, num in enumerate(nums):
            comp = target - num
            if comp in seen:
                return [seen[comp], i]
            seen[num] = i
        return []`,
  },
];

export const AdminPotdPage: React.FC = () => {
  useDocumentTitle('NEC POTD Management & Solvers Tracker — Admin CMS');
  const { success, error: toastError, info } = useToast();

  // Active POTD state from Sunday Contest Service
  const [activePotd, setActivePotd] = useState<SundayContestProblem>(() =>
    sundayContestService.getDailyStreakProblem()
  );
  const [config, setConfig] = useState(() => sundayContestService.getConfig());

  // Solvers list state
  const [solvers, setSolvers] = useState<PotdSolverRecord[]>(() => {
    const saved = localStorage.getItem('nextera_admin_potd_solvers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SOLVERS;
      }
    }
    return INITIAL_SOLVERS;
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'today_solvers' | 'problem_details' | 'archive_history'>('today_solvers');

  // Modals
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [inspectCodeSolver, setInspectCodeSolver] = useState<PotdSolverRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Change problem modal state
  const [modalTab, setModalTab] = useState<'catalog' | 'custom' | 'ai'>('catalog');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDifficulty, setCatalogDifficulty] = useState<string>('All');

  // Custom problem form state
  const [customForm, setCustomForm] = useState({
    title: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    points: 200,
    category: 'Array / String',
    companies: 'Google, Amazon, Meta',
    description: '',
    constraints: '1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9',
    sampleInput: 'nums = [2,7,11,15], target = 9',
    sampleOutput: '[0,1]',
    starterCodePython: 'class Solution:\n    def solve(self, nums: list[int], target: int):\n        # Write solution here\n        pass',
    starterCodeCpp: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        // Write solution here\n        return {};\n    }\n};',
  });

  // AI Generation state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState('Sliding Window / Subarrays');
  const [aiPromptDifficulty, setAiPromptDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [aiPromptCompany, setAiPromptCompany] = useState('Google');

  // Sync with contest service
  useEffect(() => {
    const unsub = sundayContestService.subscribe((newConfig) => {
      setConfig(newConfig);
      setActivePotd(sundayContestService.getDailyStreakProblem());
    });
    return () => unsub();
  }, []);

  // Save solvers to storage when changed
  useEffect(() => {
    localStorage.setItem('nextera_admin_potd_solvers', JSON.stringify(solvers));
  }, [solvers]);

  // Is today's problem manual override or AI autopilot?
  const isManualOverride = Boolean(config.autoPilot?.isDailyManualForToday);

  // Filtered solvers
  const filteredSolvers = useMemo(() => {
    return solvers.filter((s) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.college.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLang =
        selectedLanguage === 'All' || s.language === selectedLanguage;

      return matchesSearch && matchesLang;
    });
  }, [solvers, searchQuery, selectedLanguage]);

  // Stats
  const totalSolversCount = solvers.length;
  const avgSolveTimeMinutes = useMemo(() => {
    if (solvers.length === 0) return 0;
    const totalMinutes = solvers.reduce(
      (acc, s) => acc + s.solveTimeMinutes + s.solveTimeSeconds / 60,
      0
    );
    return (totalMinutes / solvers.length).toFixed(1);
  }, [solvers]);

  const totalCoinsAwarded = useMemo(() => {
    return solvers.reduce((acc, s) => acc + s.coinsEarned, 0);
  }, [solvers]);

  // Handlers
  const handleRevertToAutoPilot = () => {
    sundayContestService.revertDailyStreakToAuto();
    success(
      'Reverted today\'s POTD to AI Auto-Pilot serial rotation!',
      'Auto-Pilot Restored'
    );
  };

  const handleForceAiReRoll = () => {
    sundayContestService.checkAndAutoRotateDailyStreak(true);
    success(
      'AI Auto-Pilot successfully rolled a new problem for today!',
      'POTD Re-rolled'
    );
  };

  const handleSelectFromCatalog = (probId: string) => {
    sundayContestService.setDailyStreakProblem(probId);
    setIsChangeModalOpen(false);
    success('Today\'s POTD problem successfully updated!', 'Problem Updated');
  };

  const handleSaveCustomProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.title.trim()) {
      toastError('Problem title is required', 'Validation Error');
      return;
    }

    const customProb: Partial<SundayContestProblem> = {
      title: customForm.title,
      slug: customForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      difficulty: customForm.difficulty,
      points: Number(customForm.points) || 200,
      description: customForm.description || `Given an array of integers, solve the problem according to ${customForm.category} requirements.`,
      constraints: customForm.constraints.split('\n').filter(Boolean),
      sampleTestCases: [
        {
          input: customForm.sampleInput,
          expectedOutput: customForm.sampleOutput,
          explanation: 'Standard sample case demonstration.',
        },
      ],
      starterCode: {
        python: customForm.starterCodePython,
        cpp: customForm.starterCodeCpp,
      },
      sourceType: 'admin',
      sourceLabel: 'Admin Custom Crafted',
    };

    sundayContestService.setCustomDailyStreakProblem(customProb);
    setIsChangeModalOpen(false);
    success(
      `Custom problem "${customForm.title}" is now live as today's POTD!`,
      'Manual Override Active'
    );
  };

  const handleGenerateWithAi = () => {
    setAiGenerating(true);
    setTimeout(() => {
      // Find a matching problem from catalog or generate
      const candidate = PRACTICE_PROBLEMS_CATALOG.find(
        (p) => p.difficulty === aiPromptDifficulty
      ) || PRACTICE_PROBLEMS_CATALOG[0];

      setCustomForm({
        title: `${aiPromptTopic}: ${candidate.title}`,
        difficulty: aiPromptDifficulty,
        points: aiPromptDifficulty === 'Easy' ? 100 : aiPromptDifficulty === 'Medium' ? 200 : 300,
        category: aiPromptTopic,
        companies: `${aiPromptCompany}, Amazon, Microsoft`,
        description: `This question was curated by NEC AI for high-frequency ${aiPromptCompany} interviews focusing on ${aiPromptTopic}.\n\n${candidate.description}`,
        constraints: candidate.constraints.join('\n') || '1 <= n <= 10^5',
        sampleInput: candidate.sampleTestCases[0]?.input || 'arr = [1, 2, 3]',
        sampleOutput: candidate.sampleTestCases[0]?.expectedOutput || 'true',
        starterCodePython: candidate.starterCode?.python || 'class Solution:\n    def solve(self):\n        pass',
        starterCodeCpp: candidate.starterCode?.cpp || 'class Solution {\npublic:\n    void solve() {}\n};',
      });
      setAiGenerating(false);
      setModalTab('custom');
      info('AI drafted a tailored problem. Review and hit Save & Activate!', 'AI Draft Ready');
    }, 900);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = [
      'Rank',
      'Name',
      'Username',
      'College',
      'Streak',
      'Language',
      'SolveTimeMinutes',
      'RuntimeMs',
      'MemoryMb',
      'CoinsAwarded',
      'SolvedAt',
    ];
    const rows = filteredSolvers.map((s, idx) => [
      idx + 1,
      `"${s.name}"`,
      `"${s.username}"`,
      `"${s.college}"`,
      s.streak,
      s.language,
      s.solveTimeMinutes,
      s.runtimeMs,
      s.memoryMb,
      s.coinsEarned,
      `"${s.solvedAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nec-potd-solvers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported today\'s solvers to CSV file!', 'Export Complete');
  };

  // Filter catalog in modal
  const filteredCatalog = useMemo(() => {
    return PRACTICE_PROBLEMS_CATALOG.filter((p) => {
      const matchesSearch =
        catalogSearch.trim() === '' ||
        p.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.slug.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesDiff =
        catalogDifficulty === 'All' || p.difficulty === catalogDifficulty;
      return matchesSearch && matchesDiff;
    });
  }, [catalogSearch, catalogDifficulty]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  NEC POTD Management & Solvers Hub
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Live Today
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track students who solved today's daily streak problem, inspect submitted code, and manage AI vs manual problem overrides.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <Link
            to={ROUTES.DAILY_STREAK}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Student Arena</span>
          </Link>

          <button
            onClick={() => setIsChangeModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Change / Override Problem</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setSolvers([...INITIAL_SOLVERS]);
              info("Refreshed today's live solvers roster", 'Feed Refreshed');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh solvers feed"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Solvers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today's Solvers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalSolversCount}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18% vs yesterday
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active streakers locked in their bonus
          </p>
        </div>

        {/* Card 2: Current Problem */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Difficulty
            </span>
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                activePotd.difficulty === 'Easy'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : activePotd.difficulty === 'Medium'
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-rose-500/10 text-rose-500'
              )}
            >
              {activePotd.difficulty[0]}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white truncate">
              {activePotd.title}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold',
                activePotd.difficulty === 'Easy'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : activePotd.difficulty === 'Medium'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              )}
            >
              {activePotd.difficulty}
            </span>
            <span>•</span>
            <span>{activePotd.points} Points</span>
          </p>
        </div>

        {/* Card 3: Avg Time to Solve */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Solve Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {avgSolveTimeMinutes} <span className="text-sm font-normal text-slate-500">min</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across C++, Python & Java solvers
          </p>
        </div>

        {/* Card 4: Total Coins Awarded */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Coins Distributed
            </span>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500">
              {totalCoinsAwarded.toLocaleString()} 🪙
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Daily streak bonuses credited
          </p>
        </div>
      </div>

      {/* Active Problem Detailed Banner with Auto-Pilot vs Manual Indicator */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ACTIVE PROBLEM OF THE DAY
              </span>

              {isManualOverride ? (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  Admin Manual Override Active
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-blue-400" />
                  AI Auto-Pilot Rotation: Active
                </span>
              )}

              <span className="text-xs text-slate-400 font-mono">
                Date: {activePotd.date || 'Today'}
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{activePotd.title}</span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-bold uppercase',
                  activePotd.difficulty === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : activePotd.difficulty === 'Medium'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                )}
              >
                {activePotd.difficulty}
              </span>
            </h2>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {activePotd.description || 'Practice daily algorithmic mastery. Earn bonus streak coins and climb the weekly leaderboard.'}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
              <span>Slug: <code className="text-amber-400 font-mono">{activePotd.slug}</code></span>
              <span>•</span>
              <span>Reward: <strong className="text-white">{activePotd.points} Points</strong></span>
              <span>•</span>
              <span>Source: <strong className="text-slate-200">{activePotd.sourceLabel || (isManualOverride ? 'Admin Curated' : 'Auto-Pilot Serial')}</strong></span>
            </div>
          </div>

          {/* Quick Problem Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => setIsChangeModalOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Change Problem</span>
            </button>

            {isManualOverride ? (
              <button
                onClick={handleRevertToAutoPilot}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                title="Restore automatic AI rotation"
              >
                <Bot className="w-4 h-4 text-blue-400" />
                <span>Revert to Auto-Pilot</span>
              </button>
            ) : (
              <button
                onClick={handleForceAiReRoll}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                title="Ask AI to pick another question for today"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Force AI Re-Roll</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('today_solvers')}
          className={cn(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'today_solvers'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <UserCheck className="w-4 h-4" />
          <span>Today's Solvers ({filteredSolvers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('problem_details')}
          className={cn(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'problem_details'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Code2 className="w-4 h-4" />
          <span>Problem Spec & Test Cases</span>
        </button>

        <button
          onClick={() => setActiveTab('archive_history')}
          className={cn(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'archive_history'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Calendar className="w-4 h-4" />
          <span>POTD Calendar Archive</span>
        </button>
      </div>

      {/* TAB 1: TODAY'S SOLVERS TRACKER */}
      {activeTab === 'today_solvers' && (
        <div className="space-y-4">
          {/* Search & Language Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search solver by name, username or college..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">Language:</span>
              {['All', 'C++', 'Python', 'Java', 'JavaScript'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    selectedLanguage === lang
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Solvers Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4"># Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Streak Status</th>
                    <th className="py-3 px-4">Solved At</th>
                    <th className="py-3 px-4">Time Taken</th>
                    <th className="py-3 px-4">Language</th>
                    <th className="py-3 px-4">Performance</th>
                    <th className="py-3 px-4">Coins</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredSolvers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSolvers.map((s, idx) => (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={s.avatar}
                              alt={s.name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-500/20 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{s.name}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                @{s.username}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {s.college}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-500" />
                              {s.streak} Days
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono" title="Max streak">
                              (Max: {s.longestStreak})
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {s.solvedAt}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {s.solveTimeMinutes}m {s.solveTimeSeconds}s
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-bold font-mono',
                              s.language === 'C++' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                              s.language === 'Python' && 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
                              s.language === 'Java' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                              s.language === 'JavaScript' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            )}
                          >
                            {s.language}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          <div>{s.runtimeMs} ms</div>
                          <div className="text-[10px] text-slate-400">{s.memoryMb} MB</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-500 font-mono">
                          +{s.coinsEarned} 🪙
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setInspectCodeSolver(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <FileCode className="w-3.5 h-3.5 text-amber-500" />
                            <span>View Code</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROBLEM DETAILS & TEST CASES */}
      {activeTab === 'problem_details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Problem Description & Constraints</span>
            </h3>

            <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p className="whitespace-pre-line">{activePotd.description}</p>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                Constraints
              </h4>
              <ul className="space-y-1">
                {activePotd.constraints.map((c, i) => (
                  <li
                    key={i}
                    className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    • {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            {/* Sample Test Cases */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Sample Test Cases</span>
              </h3>

              <div className="space-y-3">
                {activePotd.sampleTestCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs font-mono"
                  >
                    <div className="text-[11px] font-bold text-amber-500 uppercase">
                      Example #{idx + 1}
                    </div>
                    <div>
                      <span className="text-slate-400">Input: </span>
                      <span className="text-slate-800 dark:text-slate-200">{tc.input}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Expected Output: </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tc.expectedOutput}</span>
                    </div>
                    {tc.explanation && (
                      <p className="text-[11px] text-slate-500 font-sans italic pt-1">
                        Explanation: {tc.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Starter Code Preview */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-500" />
                <span>Starter Code Template (C++ / Python)</span>
              </h3>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
                {activePotd.starterCode?.cpp || activePotd.starterCode?.python || '// No starter template loaded'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POTD CALENDAR ARCHIVE */}
      {activeTab === 'archive_history' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Past POTD Archive & History</span>
            </h3>
            <span className="text-xs text-slate-400">Showing recent 7 days</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[
              { day: 'Yesterday', date: 'Yesterday', prob: 'Valid Parentheses', diff: 'Easy', solvers: 86, accuracy: '91.2%' },
              { day: '2 Days Ago', date: '2 Days Ago', prob: 'Merge Two Sorted Lists', diff: 'Easy', solvers: 94, accuracy: '88.5%' },
              { day: '3 Days Ago', date: '3 Days Ago', prob: 'Longest Substring Without Repeating Characters', diff: 'Medium', solvers: 64, accuracy: '54.0%' },
              { day: '4 Days Ago', date: '4 Days Ago', prob: 'Container With Most Water', diff: 'Medium', solvers: 71, accuracy: '62.4%' },
              { day: '5 Days Ago', date: '5 Days Ago', prob: 'Trapping Rain Water', diff: 'Hard', solvers: 39, accuracy: '38.1%' },
              { day: '6 Days Ago', date: '6 Days Ago', prob: '3Sum', diff: 'Medium', solvers: 58, accuracy: '49.8%' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 font-semibold">{item.day}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold',
                      item.diff === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : item.diff === 'Medium'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-rose-500/10 text-rose-500'
                    )}
                  >
                    {item.diff}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {item.prob}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span>Solvers: <strong className="text-slate-800 dark:text-slate-200">{item.solvers}</strong></span>
                  <span>Accuracy: <strong className="text-emerald-500">{item.accuracy}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CHANGE / OVERRIDE TODAY'S PROBLEM */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                  <span>Change Today's Problem of the Day</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a problem from the verified catalog, craft a custom question, or prompt AI.
                </p>
              </div>
              <button
                onClick={() => setIsChangeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center px-5 pt-3 border-b border-slate-200 dark:border-slate-800 gap-4">
              <button
                onClick={() => setModalTab('catalog')}
                className={cn(
                  'pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
                  modalTab === 'catalog'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Pick From Catalog ({PRACTICE_PROBLEMS_CATALOG.length})</span>
              </button>

              <button
                onClick={() => setModalTab('ai')}
                className={cn(
                  'pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
                  modalTab === 'ai'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Prompt Generator</span>
              </button>

              <button
                onClick={() => setModalTab('custom')}
                className={cn(
                  'pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
                  modalTab === 'custom'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Custom Problem Builder</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto">
              {modalTab === 'catalog' && (
                <div className="space-y-4">
                  {/* Catalog filters */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="Search catalog by title..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <select
                      value={catalogDifficulty}
                      onChange={(e) => setCatalogDifficulty(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    >
                      <option value="All">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  {/* Catalog List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredCatalog.map((prob) => (
                      <div
                        key={prob.id}
                        className={cn(
                          'p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all',
                          activePotd.slug === prob.slug
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {prob.title}
                            </span>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-bold',
                                prob.difficulty === 'Easy'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : prob.difficulty === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-rose-500/10 text-rose-500'
                              )}
                            >
                              {prob.difficulty}
                            </span>
                            {activePotd.slug === prob.slug && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                                Currently Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {prob.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleSelectFromCatalog(prob.id)}
                          disabled={activePotd.slug === prob.slug}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer',
                            activePotd.slug === prob.slug
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          )}
                        >
                          {activePotd.slug === prob.slug ? 'Active' : 'Set as POTD'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modalTab === 'ai' && (
                <div className="space-y-4 max-w-xl mx-auto py-2">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                    💡 <strong>AI POTD Assistant:</strong> Specify target company or pattern. The AI will curate and scaffold constraints, description, testcases, and starter code.
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Topic / Pattern</label>
                      <input
                        type="text"
                        value={aiPromptTopic}
                        onChange={(e) => setAiPromptTopic(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        placeholder="e.g. Dynamic Programming, Two Pointers, Trees"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Difficulty</label>
                        <select
                          value={aiPromptDifficulty}
                          onChange={(e) => setAiPromptDifficulty(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Target Company</label>
                        <input
                          type="text"
                          value={aiPromptCompany}
                          onChange={(e) => setAiPromptCompany(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          placeholder="e.g. Google, Amazon, Meta"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateWithAi}
                      disabled={aiGenerating}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
                    >
                      {aiGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Problem Draft...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Draft Problem with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {modalTab === 'custom' && (
                <form onSubmit={handleSaveCustomProblem} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-slate-400 font-medium mb-1">Problem Title</label>
                      <input
                        type="text"
                        value={customForm.title}
                        onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                        required
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                        placeholder="e.g. Subarray Sum Equals K"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Difficulty</label>
                      <select
                        value={customForm.difficulty}
                        onChange={(e) => setCustomForm({ ...customForm, difficulty: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="Easy">Easy (100 Pts)</option>
                        <option value="Medium">Medium (200 Pts)</option>
                        <option value="Hard">Hard (300 Pts)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Problem Description</label>
                    <textarea
                      rows={3}
                      value={customForm.description}
                      onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed"
                      placeholder="Full problem statement..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Sample Input</label>
                      <input
                        type="text"
                        value={customForm.sampleInput}
                        onChange={(e) => setCustomForm({ ...customForm, sampleInput: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                        placeholder="nums = [1,1,1], k = 2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Expected Output</label>
                      <input
                        type="text"
                        value={customForm.sampleOutput}
                        onChange={(e) => setCustomForm({ ...customForm, sampleOutput: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                        placeholder="2"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsChangeModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-md shadow-orange-500/20"
                    >
                      Save & Activate as POTD
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT STUDENT CODE */}
      {inspectCodeSolver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={inspectCodeSolver.avatar}
                  alt={inspectCodeSolver.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/30"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{inspectCodeSolver.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {inspectCodeSolver.status}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {inspectCodeSolver.college} • {inspectCodeSolver.language} • {inspectCodeSolver.solveTimeMinutes}m {inspectCodeSolver.solveTimeSeconds}s
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCode(inspectCodeSolver.submittedCode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setInspectCodeSolver(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Runtime: <strong className="text-slate-800 dark:text-slate-200">{inspectCodeSolver.runtimeMs} ms</strong></span>
              <span className="text-slate-400">Memory: <strong className="text-slate-800 dark:text-slate-200">{inspectCodeSolver.memoryMb} MB</strong></span>
              <span className="text-slate-400">Test Cases: <strong className="text-emerald-500">{inspectCodeSolver.testCasesPassed}</strong></span>
              <span className="text-amber-500 font-bold">+{inspectCodeSolver.coinsEarned} Coins Awarded</span>
            </div>

            {/* Code Body */}
            <div className="p-5 flex-1 overflow-y-auto bg-slate-950">
              <pre className="text-slate-200 font-mono text-xs leading-relaxed selection:bg-amber-500/30">
                {inspectCodeSolver.submittedCode}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
