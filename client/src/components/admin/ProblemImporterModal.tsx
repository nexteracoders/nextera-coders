import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { adminProblemService } from '../../services/adminProblem.service';
import { ROUTES } from '../../constants/routes';
import {
  Sparkles,
  FileJson,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Code2,
  Edit3,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ProblemImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_DSA_PROMPTS = [
  'Find Pair with Target Sum',
  'Valid Bracket Sequence',
  'Reverse a Singly Linked List',
  'Trapping Rain Water',
  'LRU Cache Design',
  'Merge Overlapping Intervals',
  'Binary Search in Rotated Array',
];

const SAMPLE_JSON_TEMPLATE = [
  {
    title: 'Find Pair with Target Sum',
    slug: 'find-pair-with-target-sum',
    difficulty: 'Easy',
    category: 'Arrays',
    companies: ['Google', 'Amazon', 'Meta'],
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
    ],
    hints: ['Try using a hash map for O(n) lookup of complements.'],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', hidden: false },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]', hidden: false },
      { input: '[3,3]\n6', expectedOutput: '[0,1]', hidden: true },
      { input: '[-1,-2,-3,-4,-5]\n-8', expectedOutput: '[2,4]', hidden: true },
    ],
    expectedComplexity: { time: 'O(n)', space: 'O(n)' },
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n    // code here\n}',
      typescript: 'function twoSum(nums: number[], target: number): number[] {\n    // code here\n    return [];\n}',
      python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};',
      c: 'int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 0;\n    return NULL;\n}',
      csharp: 'public class Solution {\n    public int[] TwoSum(int[] nums, int target) {\n        return new int[0];\n    }\n}',
    },
    solution: '// Two-pass or one-pass hash map approach',
    isPublished: true,
  },
];

export const ProblemImporterModal: React.FC<ProblemImporterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'ai' | 'json'>('ai');

  // AI Tab States
  const [inputQuery, setInputQuery] = useState('');
  const [difficultyOverride, setDifficultyOverride] = useState<string>('Auto');
  const [categoryOverride, setCategoryOverride] = useState<string>('Auto');
  const [generating, setGenerating] = useState(false);
  const [generatedProblem, setGeneratedProblem] = useState<any | null>(null);
  const [previewLang, setPreviewLang] = useState<'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c' | 'csharp'>('python');
  const [directImporting, setDirectImporting] = useState(false);

  // JSON Tab States
  const [rawJson, setRawJson] = useState('');
  const [parsedProblems, setParsedProblems] = useState<any[]>([]);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);

  // Generate Problem with AI
  const handleGenerate = async (queryToUse?: string) => {
    const targetQuery = (queryToUse || inputQuery).trim();
    if (!targetQuery) {
      toastError('Please enter a problem title or topic name');
      return;
    }

    try {
      setGenerating(true);
      const problem = await adminProblemService.generateProblemWithAi(
        targetQuery,
        difficultyOverride !== 'Auto' ? difficultyOverride : undefined,
        categoryOverride !== 'Auto' ? categoryOverride : undefined
      );

      setGeneratedProblem(problem);
      success(`Problem "${problem.title}" generated! You can review or edit below.`, '✨ AI Generator Ready');
    } catch (err: any) {
      toastError(err.message || 'Failed to generate problem');
    } finally {
      setGenerating(false);
    }
  };

  // Direct Import to Database
  const handleDirectImport = async () => {
    if (!generatedProblem) return;
    try {
      setDirectImporting(true);
      await adminProblemService.createProblem(generatedProblem);
      success(`Problem "${generatedProblem.title}" imported and published!`, 'Import Successful');
      onSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Failed to save problem');
    } finally {
      setDirectImporting(false);
    }
  };

  // Open in Full Form
  const handleOpenInEditor = () => {
    if (!generatedProblem) return;
    onClose();
    navigate(ROUTES.ADMIN_PROBLEMS_NEW, {
      state: { prefilledProblem: generatedProblem },
    });
  };

  // JSON Change Handler
  const handleJsonChange = (val: string) => {
    setRawJson(val);
    if (!val.trim()) {
      setParsedProblems([]);
      setJsonError(null);
      return;
    }

    try {
      const parsed = JSON.parse(val);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      if (list.length === 0) {
        throw new Error('JSON array is empty');
      }
      for (let i = 0; i < list.length; i++) {
        if (!list[i].title || typeof list[i].title !== 'string') {
          throw new Error(`Problem #${i + 1} is missing a valid "title" field`);
        }
      }
      setParsedProblems(list);
      setJsonError(null);
    } catch (err: any) {
      setParsedProblems([]);
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleJsonChange(content);
    };
    reader.readAsText(file);
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nextera-problems-template.json';
    a.click();
    URL.revokeObjectURL(url);
    success('Template downloaded!', 'Sample JSON');
  };

  // Bulk Import Trigger
  const handleBulkImport = async () => {
    if (parsedProblems.length === 0) return;
    try {
      setBulkImporting(true);
      const res = await adminProblemService.bulkImportProblems(parsedProblems);
      success(
        `Successfully imported ${res.importedCount} problem${res.importedCount !== 1 ? 's' : ''}!`,
        'Bulk Import Done'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Bulk import failed');
    } finally {
      setBulkImporting(false);
    }
  };

  const getDiffColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'success';
      case 'Hard':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      className="max-h-[92vh] flex flex-col p-0 overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                One-Click Problem Importer
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-bold">
                  AI Powered
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auto-generate problem definition, sample test cases, hidden edge cases & starter code from topic or title.
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-200/60 dark:bg-dark-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ai')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                activeTab === 'ai'
                  ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              AI Topic / Title Generator
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                activeTab === 'json'
                  ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-500" />
              Bulk JSON Import
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[calc(92vh-140px)] space-y-5">
          {activeTab === 'ai' ? (
            <div className="space-y-4">
              {/* Input section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  DSA Problem Title or Topic Name *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="e.g. Find Pair with Target Sum, Palindrome Partitioning, LRU Cache..."
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                      className="pr-10 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={difficultyOverride}
                      onChange={(e) => setDifficultyOverride(e.target.value)}
                      className="h-10 px-2.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="Auto">Auto Difficulty</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>

                    <select
                      value={categoryOverride}
                      onChange={(e) => setCategoryOverride(e.target.value)}
                      className="h-10 px-2.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="Auto">Auto Category</option>
                      <option value="Arrays">Arrays</option>
                      <option value="Strings">Strings</option>
                      <option value="Linked List">Linked List</option>
                      <option value="Trees">Trees</option>
                      <option value="Graphs">Graphs</option>
                      <option value="Dynamic Programming">Dynamic Programming</option>
                      <option value="Binary Search">Binary Search</option>
                    </select>

                    <Button
                      variant="primary"
                      onClick={() => handleGenerate()}
                      disabled={generating || !inputQuery.trim()}
                      leftIcon={
                        generating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )
                      }
                      className="shadow-md shadow-brand-500/20 shrink-0 font-bold"
                    >
                      {generating ? 'Synthesizing...' : 'Generate with AI'}
                    </Button>
                  </div>
                </div>

                {/* Quick Examples chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Try popular:</span>
                  {QUICK_DSA_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setInputQuery(prompt);
                        handleGenerate(prompt);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-dark-800 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 text-slate-600 dark:text-slate-400 transition-colors border border-slate-200/60 dark:border-dark-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated Result Preview */}
              {generatedProblem && (
                <div className="p-4 rounded-2xl border border-brand-500/30 bg-brand-50/20 dark:bg-brand-950/10 space-y-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-500/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {generatedProblem.title}
                        </h3>
                        <Badge variant={getDiffColor(generatedProblem.difficulty)} size="sm">
                          {generatedProblem.difficulty}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {generatedProblem.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        slug: /{generatedProblem.slug}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenInEditor}
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        className="text-xs font-semibold"
                      >
                        Edit & Review in Create Form
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDirectImport}
                        disabled={directImporting}
                        leftIcon={
                          directImporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )
                        }
                        className="text-xs shadow-md shadow-brand-500/20 font-bold"
                      >
                        {directImporting ? 'Importing...' : 'Direct Import to Platform'}
                      </Button>
                    </div>
                  </div>

                  {/* Description preview */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Problem Statement Preview:
                    </span>
                    <div className="p-3 bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-800 text-xs text-slate-700 dark:text-slate-300 max-h-32 overflow-y-auto font-sans whitespace-pre-line leading-relaxed">
                      {generatedProblem.description}
                    </div>
                  </div>

                  {/* Test Cases Count summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 flex items-center justify-between">
                      <span className="text-slate-500">Sample Test Cases:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {generatedProblem.testCases?.filter((t: any) => !t.hidden).length || 2} Public
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 flex items-center justify-between">
                      <span className="text-slate-500">Hidden Edge Cases:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {generatedProblem.testCases?.filter((t: any) => t.hidden).length || 3} Hidden
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 flex items-center justify-between">
                      <span className="text-slate-500">Complexity:</span>
                      <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                        {generatedProblem.expectedComplexity?.time || 'O(n)'}
                      </span>
                    </div>
                  </div>

                  {/* Starter Code Viewer */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-brand-500" />
                        Generated Starter Codes (7 Languages):
                      </span>
                      <div className="flex gap-1">
                        {(['python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'csharp'] as const).map(
                          (lang) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => setPreviewLang(lang)}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded uppercase font-mono font-bold transition-all',
                                previewLang === lang
                                  ? 'bg-brand-500 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-dark-800'
                              )}
                            >
                              {lang === 'javascript' ? 'JS' : lang === 'typescript' ? 'TS' : lang}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <pre className="p-3 bg-dark-950 text-slate-200 rounded-xl border border-dark-800 text-xs font-mono max-h-36 overflow-x-auto overflow-y-auto leading-relaxed">
                      {generatedProblem.starterCode?.[previewLang] || '// Template ready'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Bulk JSON Import Tab */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-dark-800/40 rounded-xl border border-slate-200/80 dark:border-dark-800">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Upload a <code>.json</code> file or paste a JSON array of problems.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Download JSON Template
                  </Button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      Upload File
                    </span>
                  </label>
                </div>
              </div>

              {/* JSON Textarea */}
              <div className="space-y-1.5">
                <textarea
                  rows={8}
                  value={rawJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  placeholder={`Paste JSON array here, e.g.:\n[\n  {\n    "title": "Two Sum",\n    "difficulty": "Easy",\n    "category": "Arrays",\n    ...\n  }\n]`}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none leading-relaxed"
                />
              </div>

              {/* Error or Success indicator */}
              {jsonError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              {parsedProblems.length > 0 && !jsonError && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                    <span className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {parsedProblems.length} Problem{parsedProblems.length !== 1 ? 's' : ''} Ready to Import
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBulkImport}
                      disabled={bulkImporting}
                      leftIcon={
                        bulkImporting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )
                      }
                      className="text-xs shadow-md shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      {bulkImporting ? 'Importing Batch...' : `Import All (${parsedProblems.length})`}
                    </Button>
                  </div>

                  {/* Problem cards list preview */}
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {parsedProblems.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 w-5 text-right">{idx + 1}.</span>
                          <span className="font-bold text-slate-900 dark:text-white">{p.title}</span>
                          <Badge variant={getDiffColor(p.difficulty || 'Medium')} size="sm">
                            {p.difficulty || 'Medium'}
                          </Badge>
                          <span className="text-[11px] text-slate-500">{p.category || 'Algorithms'}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {p.testCases?.length || 0} tests
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
