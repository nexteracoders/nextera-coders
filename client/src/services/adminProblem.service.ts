import api from './api';
import { CoursePagination } from '../types/course.types';
import { PRACTICE_PROBLEMS_CATALOG } from './contest.service';

const OVERRIDE_STORAGE_KEY = 'nextera_admin_problem_overrides';

interface ProblemOverride {
  isPublished?: boolean;
  isDeleted?: boolean;
  updatedData?: any;
}

function getOverrides(): Record<string, ProblemOverride> {
  try {
    const raw = localStorage.getItem(OVERRIDE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, ProblemOverride>) {
  try {
    localStorage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Failed to save problem overrides', e);
  }
}

export const adminProblemService = {
  getProblems: async (params: any = {}): Promise<{ problems: any[]; pagination: CoursePagination }> => {
    try {
      const response = await api.get('/admin/problems', { params });
      if (response.data?.data?.problems && response.data?.data?.pagination) {
        const { problems, pagination } = response.data.data;
        const overrides = getOverrides();
        const enriched = problems.map((p: any) => {
          const ov = overrides[p.id] || {};
          return {
            ...p,
            isPublished: ov.isPublished !== undefined ? ov.isPublished : p.isPublished,
            ...ov.updatedData,
          };
        }).filter((p: any) => !overrides[p.id]?.isDeleted);

        return {
          problems: enriched,
          pagination,
        };
      }
    } catch {
      // Offline/fallback
    }

    const overrides = getOverrides();
    const map = new Map<string, any>();

    // Add Master Catalog as offline fallback
    for (const p of PRACTICE_PROBLEMS_CATALOG) {
      const id = p.id;
      if (!map.has(id)) {
        const ov = overrides[id] || {};
        if (ov.isDeleted) continue;

        map.set(id, {
          id: p.id,
          title: ov.updatedData?.title || p.title,
          slug: ov.updatedData?.slug || p.slug,
          difficulty: ov.updatedData?.difficulty || p.difficulty,
          category: ov.updatedData?.category || p.category,
          companies: ov.updatedData?.companies || (p.companies && Array.isArray(p.companies) ? p.companies : []),
          points: ov.updatedData?.points || p.points || (p.difficulty === 'Hard' ? 300 : p.difficulty === 'Medium' ? 200 : 100),
          description: ov.updatedData?.description || p.description,
          constraints: ov.updatedData?.constraints || p.constraints,
          sampleTestCases: ov.updatedData?.sampleTestCases || p.sampleTestCases,
          hiddenTestCases: ov.updatedData?.hiddenTestCases || p.hiddenTestCases,
          starterCode: ov.updatedData?.starterCode || p.starterCode,
          testCasesCount: (p.sampleTestCases?.length || 2) + (p.hiddenTestCases?.length || 2),
          hiddenTestCasesCount: p.hiddenTestCases?.length || 2,
          isPublished: ov.isPublished !== undefined ? ov.isPublished : true,
          createdAt: new Date().toISOString(),
          ...ov.updatedData,
        });
      }
    }

    let list = Array.from(map.values());

    // Filter Search
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter((p) =>
        p.title?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        (Array.isArray(p.companies) && p.companies.some((c: string) => c.toLowerCase().includes(q)))
      );
    }

    // Filter Difficulty
    if (params.difficulty && params.difficulty !== 'All') {
      list = list.filter((p) => p.difficulty === params.difficulty);
    }

    // Filter Category
    if (params.category && params.category !== 'All') {
      list = list.filter((p) => p.category === params.category);
    }

    // Filter Status
    if (params.status && params.status !== 'all') {
      if (params.status === 'published') {
        list = list.filter((p) => p.isPublished === true);
      } else if (params.status === 'draft') {
        list = list.filter((p) => !p.isPublished);
      }
    }

    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 20;
    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      problems: paginated,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
  },

  getProblemById: async (id: string): Promise<any> => {
    try {
      const response = await api.get(`/admin/problems/${id}`);
      if (response.data?.data?.problem) {
        return response.data.data.problem;
      }
    } catch {
      // Fallback to catalog
    }

    const overrides = getOverrides();
    const ov = overrides[id] || {};
    const template = PRACTICE_PROBLEMS_CATALOG.find((p) => p.id === id || p.slug === id);

    if (template) {
      return {
        id: template.id,
        title: ov.updatedData?.title || template.title,
        slug: ov.updatedData?.slug || template.slug,
        difficulty: ov.updatedData?.difficulty || template.difficulty,
        category: ov.updatedData?.category || template.category,
        companies: ov.updatedData?.companies || (template.companies && Array.isArray(template.companies) ? template.companies : []),
        points: ov.updatedData?.points || template.points || 100,
        description: ov.updatedData?.description || template.description,
        constraints: ov.updatedData?.constraints || template.constraints,
        sampleTestCases: ov.updatedData?.sampleTestCases || template.sampleTestCases,
        hiddenTestCases: ov.updatedData?.hiddenTestCases || template.hiddenTestCases,
        starterCode: ov.updatedData?.starterCode || template.starterCode,
        isPublished: ov.isPublished !== undefined ? ov.isPublished : true,
        testCases: [
          ...(template.sampleTestCases || []).map((tc, idx) => ({ ...tc, hidden: false, order: idx + 1 })),
          ...(template.hiddenTestCases || []).map((tc, idx) => ({ ...tc, hidden: true, order: (template.sampleTestCases?.length || 0) + idx + 1 })),
        ],
        ...ov.updatedData,
      };
    }

    throw new Error('Problem not found');
  },

  createProblem: async (data: any): Promise<any> => {
    try {
      const response = await api.post('/admin/problems', data);
      return response.data.data.problem;
    } catch {
      // Save locally
      const id = `nec-custom-${Date.now()}`;
      const overrides = getOverrides();
      overrides[id] = {
        isPublished: true,
        updatedData: { ...data, id, createdAt: new Date().toISOString() },
      };
      saveOverrides(overrides);
      return overrides[id].updatedData;
    }
  },

  updateProblem: async (id: string, data: any): Promise<any> => {
    try {
      const response = await api.put(`/admin/problems/${id}`, data);
      return response.data.data.problem;
    } catch {
      const overrides = getOverrides();
      overrides[id] = {
        ...overrides[id],
        updatedData: { ...(overrides[id]?.updatedData || {}), ...data },
      };
      saveOverrides(overrides);
      return { id, ...data };
    }
  },

  deleteProblem: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/problems/${id}`);
    } catch {
      // Ignore API failure
    }
    const overrides = getOverrides();
    overrides[id] = {
      ...overrides[id],
      isDeleted: true,
    };
    saveOverrides(overrides);
  },

  publishProblem: async (id: string): Promise<void> => {
    try {
      await api.patch(`/admin/problems/${id}/publish`);
    } catch {
      // Ignore API failure
    }
    const overrides = getOverrides();
    overrides[id] = {
      ...overrides[id],
      isPublished: true,
    };
    saveOverrides(overrides);
  },

  unpublishProblem: async (id: string): Promise<void> => {
    try {
      await api.patch(`/admin/problems/${id}/unpublish`);
    } catch {
      // Ignore API failure
    }
    const overrides = getOverrides();
    overrides[id] = {
      ...overrides[id],
      isPublished: false,
    };
    saveOverrides(overrides);
  },

  getNextProblemOrder: async (category?: string): Promise<{ nextOrder: number; suggestedOrder: number }> => {
    try {
      const response = await api.get('/admin/problems/next-order', {
        params: category && category !== 'All' ? { category } : {},
      });
      if (response.data?.data?.nextOrder) {
        return response.data.data;
      }
    } catch {
      // Ignore API failure and fallback
    }

    const overrides = getOverrides();
    const count = PRACTICE_PROBLEMS_CATALOG.length + Object.keys(overrides).length;
    return {
      nextOrder: count + 1,
      suggestedOrder: count + 1,
    };
  },

  generateProblemWithAi: async (
    titleOrUrl: string,
    difficulty?: string,
    category?: string
  ): Promise<any> => {
    try {
      const response = await api.post('/admin/problems/generate-ai', {
        titleOrUrl,
        difficulty,
        category,
      });
      if (response.data?.data?.problem) {
        return response.data.data.problem;
      }
    } catch (err: any) {
      console.warn('API generate problem failed, using client-side fallback:', err.message);
    }

    // Client-side fallback generator
    const clean = titleOrUrl.trim();
    let slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (clean.includes('leetcode.com/problems/')) {
      const match = clean.match(/leetcode\.com\/problems\/([^/?#]+)/i);
      if (match && match[1]) slug = match[1].toLowerCase();
    }
    const title = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return {
      title,
      slug,
      difficulty: difficulty || 'Medium',
      category: category || 'Algorithms',
      companies: ['Amazon', 'Google', 'Microsoft', 'TCS'],
      description: `### Problem Description\nGiven the specifications for **${title}**, write an optimal algorithm to solve the problem.\n\nEnsure that you handle boundary conditions and constraints properly.`,
      constraints: ['1 <= n <= 10^5', '-10^9 <= val <= 10^9'],
      examples: [
        { input: 'input = [1, 2, 3]', output: 'output = [1, 2, 3]', explanation: 'Standard sample test case.' },
        { input: 'input = [0]', output: 'output = [0]', explanation: 'Single element case.' },
      ],
      hints: [
        'Analyze the problem constraints and boundary conditions.',
        'Consider whether an auxiliary hash set/map or two-pointer approach optimizes time complexity.',
      ],
      testCases: [
        { input: '[1, 2, 3]', expectedOutput: '[1, 2, 3]', hidden: false },
        { input: '[0]', expectedOutput: '[0]', hidden: false },
        { input: '[]', expectedOutput: '[]', hidden: true },
        { input: '[-5, 0, 5]', expectedOutput: '[-5, 0, 5]', hidden: true },
        { input: '[1000000]', expectedOutput: '[1000000]', hidden: true },
      ],
      expectedComplexity: { time: 'O(n)', space: 'O(1)' },
      starterCode: {
        javascript: `function solve(arr) {\n    // code here\n}`,
        typescript: `function solve(arr: any): any {\n    // code here\n}`,
        python: `class Solution:\n    def solve(self, arr):\n        # code here\n        pass`,
        java: `class Solution {\n    public int solve(int[] arr) {\n        // code here\n        return 0;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    int solve(vector<int>& arr) {\n        // code here\n        return 0;\n    }\n};`,
        c: `int solve(int* arr, int n) {\n    // code here\n    return 0;\n}`,
        csharp: `public class Solution {\n    public int Solve(int[] arr) {\n        // code here\n        return 0;\n    }\n}`,
      },
      solution: `// Optimal solution approach`,
      supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp'],
      isPublished: true,
    };
  },

  bulkImportProblems: async (problems: any[]): Promise<{
    importedCount: number;
    failedCount: number;
    importedProblems: any[];
    errors: any[];
  }> => {
    try {
      const response = await api.post('/admin/problems/bulk-import', { problems });
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (err: any) {
      console.warn('API bulk import failed, saving to local fallback overrides:', err.message);
    }

    // Offline / local storage fallback
    const overrides = getOverrides();
    const imported: any[] = [];
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      const id = `nec-import-${Date.now()}-${i}`;
      overrides[id] = {
        isPublished: p.isPublished !== undefined ? p.isPublished : true,
        updatedData: { ...p, id, createdAt: new Date().toISOString() },
      };
      imported.push({ id, title: p.title, slug: p.slug || p.title.toLowerCase().replace(/\s+/g, '-'), difficulty: p.difficulty || 'Medium' });
    }
    saveOverrides(overrides);

    return {
      importedCount: imported.length,
      failedCount: 0,
      importedProblems: imported,
      errors: [],
    };
  },
};
