export interface DSATopic {
  title: string;
  problemsCount: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  description: string;
  iconName: string;
}

export const DSA_TOPICS_DATA: DSATopic[] = [
  {
    title: 'Arrays & Two Pointers',
    problemsCount: '35 Problems',
    difficulty: 'Easy',
    description: 'Prefix sums, sliding window, two-pointer convergence, and in-place transformations.',
    iconName: 'Layers',
  },
  {
    title: 'Strings & Hash Tables',
    problemsCount: '28 Problems',
    difficulty: 'Easy',
    description: 'Frequency maps, anagram checks, palindrome checks, and substring matching.',
    iconName: 'FileCode',
  },
  {
    title: 'Linked Lists & Pointers',
    problemsCount: '22 Problems',
    difficulty: 'Medium',
    description: 'Fast & slow pointers, reversing sublists, cycle detection, and merging lists.',
    iconName: 'GitCommit',
  },
  {
    title: 'Stacks & Monotonic Queues',
    problemsCount: '18 Problems',
    difficulty: 'Medium',
    description: 'Balanced parentheses, next greater element, histogram areas, and sliding window max.',
    iconName: 'ListOrdered',
  },
  {
    title: 'Trees & Binary Search Trees',
    problemsCount: '40 Problems',
    difficulty: 'Medium',
    description: 'DFS/BFS traversals, lowest common ancestor, diameter of tree, and validation.',
    iconName: 'GitBranch',
  },
  {
    title: 'Graphs & Disjoint Sets',
    problemsCount: '32 Problems',
    difficulty: 'Hard',
    description: 'Adjacency lists, Dijkstra shortest path, topological sorting, and Union-Find.',
    iconName: 'Share2',
  },
  {
    title: 'Dynamic Programming',
    problemsCount: '45 Problems',
    difficulty: 'Hard',
    description: '0/1 Knapsack, longest common subsequence, memoization, and bottom-up tabulation.',
    iconName: 'Cpu',
  },
  {
    title: 'Greedy & Backtracking',
    problemsCount: '24 Problems',
    difficulty: 'Medium',
    description: 'N-Queens, subsets generation, permutation trees, and interval scheduling.',
    iconName: 'Sparkles',
  },
];
