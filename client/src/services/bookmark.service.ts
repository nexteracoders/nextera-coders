import { api } from './api';

export type ProblemListType = 'favorites' | 'revise_later' | 'hard_questions' | 'custom';

export interface IProblemListItemEntry {
  problemSlug: string;
  problemTitle: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  addedAt?: string;
  notes?: string;
}

export interface IProblemList {
  _id: string;
  userId?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  listType: ProblemListType;
  problems: IProblemListItemEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IProblemBookmarkStatus {
  problemSlug: string;
  containingListIds: string[];
  lists: Array<{
    _id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
    isDefault: boolean;
    listType: string;
    totalProblems: number;
    containsProblem: boolean;
  }>;
}

const STORAGE_KEY = 'nextera:problem_lists';
const BOOKMARK_EVENT = 'nextera:bookmarks_changed';

// Initial local fallback lists so UI is instantly responsive even without network
const DEFAULT_CLIENT_LISTS: IProblemList[] = [
  {
    _id: 'default-favorites',
    name: 'Favorites',
    slug: 'favorites',
    description: 'Favorite algorithms & key DSA patterns for quick recall',
    icon: 'Star',
    color: '#f59e0b',
    isDefault: true,
    listType: 'favorites',
    problems: [],
  },
  {
    _id: 'default-revise-later',
    name: 'Revise Later',
    slug: 'revise-later',
    description: 'Questions to review before upcoming technical interviews',
    icon: 'Bookmark',
    color: '#3b82f6',
    isDefault: true,
    listType: 'revise_later',
    problems: [],
  },
  {
    _id: 'default-hard-questions',
    name: 'Hard Questions',
    slug: 'hard-questions',
    description: 'Challenging questions requiring repeated practice and deep study',
    icon: 'Flame',
    color: '#ef4444',
    isDefault: true,
    listType: 'hard_questions',
    problems: [],
  },
];

function getCachedLists(): IProblemList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON errors
  }
  return DEFAULT_CLIENT_LISTS;
}

function setCachedLists(lists: IProblemList[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // Ignore storage quota
  }
  window.dispatchEvent(new CustomEvent(BOOKMARK_EVENT));
}

export const bookmarkService = {
  /**
   * Fetches all problem lists with instant cache fallback
   */
  async getLists(): Promise<IProblemList[]> {
    try {
      const res = await api.get<{ success: boolean; data: IProblemList[] }>('/problem-lists');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCachedLists(res.data.data);
        return res.data.data;
      }
    } catch {
      // Offline or unauthenticated fallback
    }
    return getCachedLists();
  },

  /**
   * Synchronous cached retrieval for 0ms render
   */
  getCachedListsSync(): IProblemList[] {
    return getCachedLists();
  },

  /**
   * Creates a custom problem list
   */
  async createList(name: string, description?: string, color?: string, icon?: string): Promise<IProblemList> {
    try {
      const res = await api.post<{ success: boolean; data: IProblemList }>('/problem-lists', {
        name,
        description,
        color,
        icon,
      });
      if (res.data?.success && res.data.data) {
        const current = getCachedLists();
        const updated = [...current, res.data.data];
        setCachedLists(updated);
        return res.data.data;
      }
    } catch (err: any) {
      // If offline/local, simulate creating locally
      const localId = `custom-${Date.now()}`;
      const localSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newList: IProblemList = {
        _id: localId,
        name,
        slug: localSlug,
        description: description || '',
        icon: icon || 'Folder',
        color: color || '#8b5cf6',
        isDefault: false,
        listType: 'custom',
        problems: [],
      };
      const current = getCachedLists();
      const updated = [...current, newList];
      setCachedLists(updated);
      return newList;
    }
    throw new Error('Could not create list');
  },

  /**
   * Updates an existing custom list
   */
  async updateList(id: string, data: { name?: string; description?: string; color?: string; icon?: string }): Promise<IProblemList> {
    try {
      const res = await api.put<{ success: boolean; data: IProblemList }>(`/problem-lists/${id}`, data);
      if (res.data?.success && res.data.data) {
        const current = getCachedLists();
        const updated = current.map((l) => (l._id === id ? res.data.data : l));
        setCachedLists(updated);
        return res.data.data;
      }
    } catch {
      // Local update fallback
      const current = getCachedLists();
      const updated = current.map((l) => (l._id === id ? { ...l, ...data } : l));
      setCachedLists(updated);
      const target = updated.find((l) => l._id === id);
      if (target) return target;
    }
    throw new Error('Could not update list');
  },

  /**
   * Deletes a custom list
   */
  async deleteList(id: string): Promise<void> {
    try {
      await api.delete(`/problem-lists/${id}`);
    } catch {
      // Allow local delete
    }
    const current = getCachedLists();
    const updated = current.filter((l) => l._id !== id);
    setCachedLists(updated);
  },

  /**
   * Toggles which lists a problem belongs to
   */
  async toggleProblem(
    problemSlug: string,
    problemTitle: string,
    difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium',
    category: string = 'Algorithms',
    targetListIds: string[]
  ): Promise<{ containingListIds: string[]; lists: IProblemList[] }> {
    const cleanSlug = problemSlug.trim().toLowerCase();
    const targetSet = new Set(targetListIds.map(String));

    try {
      const res = await api.post<{
        success: boolean;
        data: { containingListIds: string[]; lists: IProblemList[] };
      }>('/problem-lists/toggle', {
        problemSlug: cleanSlug,
        problemTitle,
        difficulty,
        category,
        targetListIds,
      });

      if (res.data?.success && res.data.data) {
        setCachedLists(res.data.data.lists);
        return res.data.data;
      }
    } catch {
      // Local optimistic fallback
    }

    // Apply change locally in cache
    const current = getCachedLists();
    const updated = current.map((list) => {
      const listIdStr = String(list._id);
      const isTarget = targetSet.has(listIdStr);
      const existingIdx = list.problems.findIndex((p) => p.problemSlug === cleanSlug);

      const clone = { ...list, problems: [...list.problems] };

      if (isTarget && existingIdx === -1) {
        clone.problems.push({
          problemSlug: cleanSlug,
          problemTitle,
          difficulty,
          category,
          addedAt: new Date().toISOString(),
          notes: '',
        });
      } else if (!isTarget && existingIdx !== -1) {
        clone.problems.splice(existingIdx, 1);
      }
      return clone;
    });

    setCachedLists(updated);

    const containingListIds = updated
      .filter((l) => l.problems.some((p) => p.problemSlug === cleanSlug))
      .map((l) => String(l._id));

    return { containingListIds, lists: updated };
  },

  /**
   * Removes a single problem from a list
   */
  async removeProblemFromList(listId: string, problemSlug: string): Promise<void> {
    const cleanSlug = problemSlug.trim().toLowerCase();
    try {
      await api.delete(`/problem-lists/${listId}/problems/${cleanSlug}`);
    } catch {
      // Local fallback
    }

    const current = getCachedLists();
    const updated = current.map((list) => {
      if (String(list._id) === String(listId)) {
        return {
          ...list,
          problems: list.problems.filter((p) => p.problemSlug !== cleanSlug),
        };
      }
      return list;
    });

    setCachedLists(updated);
  },

  /**
   * Checks if a problem is saved in any list
   */
  isProblemBookmarked(problemSlug: string): boolean {
    const cleanSlug = problemSlug.trim().toLowerCase();
    const lists = getCachedLists();
    return lists.some((l) => l.problems.some((p) => p.problemSlug === cleanSlug));
  },

  /**
   * Returns all list names that contain this problem
   */
  getProblemListNames(problemSlug: string): string[] {
    const cleanSlug = problemSlug.trim().toLowerCase();
    const lists = getCachedLists();
    return lists
      .filter((l) => l.problems.some((p) => p.problemSlug === cleanSlug))
      .map((l) => l.name);
  },

  /**
   * Subscribe to real-time bookmark updates
   */
  subscribe(callback: () => void): () => void {
    window.addEventListener(BOOKMARK_EVENT, callback);
    window.addEventListener('storage', callback);
    return () => {
      window.removeEventListener(BOOKMARK_EVENT, callback);
      window.removeEventListener('storage', callback);
    };
  },
};
