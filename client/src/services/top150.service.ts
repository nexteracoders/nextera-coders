// Top Interview 150 Service with Progress Tracking & Admin Controls
// NEC DSA Sheet: Top Interview 150 - Highly repeated FAANG & Tier 1 Interview Problems
export interface Top150Problem {
  id: string;
  number: number;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  companies: string[];
  acceptanceRate: string;
  frequency: number; // 1 - 100
  points: number;
  youtubeUrl?: string;
  hints?: string[];
  solutionNotes?: string;
  isCustom?: boolean;
}

const STORAGE_KEY_PROBLEMS = 'nextera_top_150_problems_v3';
const STORAGE_KEY_SOLVED = 'nextera_top_150_solved_ids_v3';
const STORAGE_KEY_FAVORITES = 'nextera_top_150_favorites_v3';

export const TOP_150_CATEGORIES = [
  'Array / String',
  'Two Pointers',
  'Sliding Window',
  'Matrix',
  'Hashmap',
  'Intervals',
  'Stack',
  'Linked List',
  'Binary Tree General',
  'Binary Tree BFS',
  'Binary Search Tree',
  'Graph General',
  'Graph BFS',
  'Trie',
  'Backtracking',
  'Divide & Conquer',
  'Kadane\'s Algorithm',
  '1D Dynamic Programming',
  'Multidimensional DP',
  'Bit Manipulation',
  'Math',
] as const;

// NEC DSA Sheet: Curated Top 150 Core Interview Questions
export const DEFAULT_TOP_150_PROBLEMS: Top150Problem[] = [
  {
    "id": "t150-1",
    "number": 1,
    "title": "Two Sum",
    "slug": "two-sum",
    "difficulty": "Easy",
    "category": "Array / String",
    "companies": [
      "Google",
      "Amazon",
      "Apple",
      "Meta",
      "NVIDIA",
      "ByteDance",
      "TCS",
      "Infosys",
      "Zoho",
      "PhonePe"
    ],
    "acceptanceRate": "80.50%",
    "frequency": 95,
    "points": 100,
    "hints": [
      "Use a hash map to store complements in O(n) time."
    ]
  },
  {
    "id": "t150-2",
    "number": 2,
    "title": "Best Time to Buy and Sell Stock",
    "slug": "best-time-to-buy-and-sell-stock",
    "difficulty": "Easy",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "Microsoft",
      "Meta",
      "Google",
      "JPMorgan Chase",
      "Stripe",
      "CRED",
      "PhonePe"
    ],
    "acceptanceRate": "62.60%",
    "frequency": 95,
    "points": 100,
    "hints": [
      "Track minimum price seen so far and maximum profit."
    ]
  },
  {
    "id": "t150-3",
    "number": 3,
    "title": "Majority Element",
    "slug": "majority-element",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Accolite",
      "Amazon",
      "Atlassian",
      "Flipkart",
      "Oracle",
      "Cisco"
    ],
    "acceptanceRate": "27.82%",
    "frequency": 95,
    "points": 200,
    "hints": [
      "Boyer-Moore Voting Algorithm achieves O(1) space."
    ]
  },
  {
    "id": "t150-4",
    "number": 4,
    "title": "Rotate Array",
    "slug": "rotate-array",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "Codenation",
      "MAQ Software",
      "Qualcomm",
      "Samsung"
    ],
    "acceptanceRate": "37.06%",
    "frequency": 95,
    "points": 200,
    "hints": [
      "Reverse entire array, then reverse first k elements, then rest."
    ]
  },
  {
    "id": "t150-5",
    "number": 5,
    "title": "Contains Duplicate",
    "slug": "contains-duplicate",
    "difficulty": "Easy",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "Google",
      "Apple",
      "Spotify",
      "Airbnb",
      "Wipro",
      "Cognizant"
    ],
    "acceptanceRate": "81.70%",
    "frequency": 95,
    "points": 100,
    "hints": [
      "Use a hash set to check for seen elements."
    ]
  },
  {
    "id": "t150-6",
    "number": 6,
    "title": "Product of Array Except Self",
    "slug": "product-of-array-except-self",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "Meta",
      "Apple",
      "Google",
      "NVIDIA",
      "ByteDance",
      "DE Shaw"
    ],
    "acceptanceRate": "66.80%",
    "frequency": 94,
    "points": 200,
    "hints": [
      "Compute prefix products and suffix products."
    ]
  },
  {
    "id": "t150-7",
    "number": 7,
    "title": "Maximum Subarray",
    "slug": "maximum-subarray",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "Microsoft",
      "Google",
      "LinkedIn",
      "TCS",
      "Infosys",
      "Wipro",
      "Cognizant",
      "Zoho"
    ],
    "acceptanceRate": "59.80%",
    "frequency": 94,
    "points": 200,
    "hints": [
      "Kadane's Algorithm: update current sum and max sum."
    ]
  },
  {
    "id": "t150-8",
    "number": 8,
    "title": "Move Zeroes",
    "slug": "move-zeroes",
    "difficulty": "Easy",
    "category": "Array / String",
    "companies": [
      "Meta",
      "Apple",
      "Google"
    ],
    "acceptanceRate": "49.50%",
    "frequency": 94,
    "points": 100,
    "hints": [
      "Two pointers: swap non-zeros to the front."
    ]
  },
  {
    "id": "t150-9",
    "number": 9,
    "title": "Valid Palindrome",
    "slug": "valid-palindrome",
    "difficulty": "Easy",
    "category": "Array / String",
    "companies": [
      "Meta",
      "Microsoft",
      "Amazon"
    ],
    "acceptanceRate": "74.50%",
    "frequency": 94,
    "points": 100,
    "hints": [
      "Two pointers from both ends ignoring non-alphanumeric."
    ]
  },
  {
    "id": "t150-10",
    "number": 10,
    "title": "Longest Common Prefix",
    "slug": "longest-common-prefix",
    "difficulty": "Easy",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "Google",
      "Apple"
    ],
    "acceptanceRate": "50.30%",
    "frequency": 94,
    "points": 100,
    "hints": [
      "Compare characters column by column or sort and compare first and last."
    ]
  },
  {
    "id": "t150-11",
    "number": 11,
    "title": "Roman to Integer",
    "slug": "roman-to-integer",
    "difficulty": "Easy",
    "category": "Array / String",
    "companies": [
      "Microsoft",
      "Amazon",
      "Facebook",
      "+4 more"
    ],
    "acceptanceRate": "43.31%",
    "frequency": 93,
    "points": 100,
    "hints": [
      "If current numeral is less than next numeral, subtract it; otherwise add."
    ]
  },
  {
    "id": "t150-12",
    "number": 12,
    "title": "String to Integer (atoi)",
    "slug": "string-to-integer-atoi",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "acceptanceRate": "34.20%",
    "frequency": 93,
    "points": 200,
    "hints": [
      "Handle whitespace, sign, overflow clamping carefully."
    ]
  },
  {
    "id": "t150-13",
    "number": 13,
    "title": "ZigZag Conversion",
    "slug": "zigzag-conversion",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "PayPal"
    ],
    "acceptanceRate": "61.40%",
    "frequency": 93,
    "points": 200,
    "hints": [
      "Simulate movement across rows with direction flag."
    ]
  },
  {
    "id": "t150-14",
    "number": 14,
    "title": "Gas Station",
    "slug": "gas-station",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "FactSet",
      "Flipkart"
    ],
    "acceptanceRate": "34.79%",
    "frequency": 93,
    "points": 200,
    "hints": [
      "If total gas < total cost, return -1. Otherwise greedy start index."
    ]
  },
  {
    "id": "t150-15",
    "number": 15,
    "title": "Shop in Candy Store",
    "slug": "shop-in-candy-store",
    "difficulty": "Easy",
    "category": "Array / String",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "45.43%",
    "frequency": 93,
    "points": 100,
    "hints": [
      "Two passes: left to right, then right to left."
    ]
  },
  {
    "id": "t150-16",
    "number": 16,
    "title": "Two Sum",
    "slug": "two-sum",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "companies": [
      "Amazon",
      "Google",
      "Meta"
    ],
    "acceptanceRate": "80.50%",
    "frequency": 92,
    "points": 100,
    "hints": [
      "Left and right pointers moving inward based on sum."
    ]
  },
  {
    "id": "t150-17",
    "number": 17,
    "title": "3Sum",
    "slug": "3sum",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "companies": [
      "Meta",
      "Amazon",
      "Google",
      "Apple"
    ],
    "acceptanceRate": "65.90%",
    "frequency": 92,
    "points": 200,
    "hints": [
      "Sort array, fix one element, use two pointers for remaining pair."
    ]
  },
  {
    "id": "t150-18",
    "number": 18,
    "title": "3Sum",
    "slug": "3sum",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "65.90%",
    "frequency": 92,
    "points": 200,
    "hints": [
      "Sort, two pointers, track closest difference."
    ]
  },
  {
    "id": "t150-19",
    "number": 19,
    "title": "Find Four Elements that Sum to a Given Value (4Sum)",
    "slug": "find-four-elements-that-sum-to-a-given-value-4sum",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "39.20%",
    "frequency": 92,
    "points": 200,
    "hints": [
      "Sort, two nested loops, two pointers with duplicate skips."
    ]
  },
  {
    "id": "t150-20",
    "number": 20,
    "title": "Container With Most Water",
    "slug": "container-with-most-water",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "companies": [
      "Flipkart",
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "53.84%",
    "frequency": 92,
    "points": 200,
    "hints": [
      "Move the pointer with smaller height inward."
    ]
  },
  {
    "id": "t150-21",
    "number": 21,
    "title": "Trapping Rain Water",
    "slug": "trapping-rain-water",
    "difficulty": "Hard",
    "category": "Two Pointers",
    "companies": [
      "Adobe",
      "Amazon",
      "Flipkart"
    ],
    "acceptanceRate": "33.14%",
    "frequency": 91,
    "points": 300,
    "hints": [
      "Maintain leftMax and rightMax with two pointers."
    ]
  },
  {
    "id": "t150-22",
    "number": 22,
    "title": "Remove Duplicates from Sorted Array",
    "slug": "remove-duplicates-from-sorted-array",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "companies": [
      "Meta",
      "Microsoft"
    ],
    "acceptanceRate": "50.60%",
    "frequency": 91,
    "points": 100,
    "hints": [
      "Keep write pointer for unique elements."
    ]
  },
  {
    "id": "t150-23",
    "number": 23,
    "title": "Remove Duplicates from Sorted Array",
    "slug": "remove-duplicates-from-sorted-array",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "50.60%",
    "frequency": 91,
    "points": 100,
    "hints": [
      "Allow at most 2 occurrences using write index."
    ]
  },
  {
    "id": "t150-24",
    "number": 24,
    "title": "Longest Substring Without Repeating Characters",
    "slug": "longest-substring-without-repeating-characters",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "companies": [
      "Amazon",
      "Google",
      "Meta",
      "Bloomberg"
    ],
    "acceptanceRate": "71.70%",
    "frequency": 91,
    "points": 200,
    "hints": [
      "Track last seen index of characters in window."
    ]
  },
  {
    "id": "t150-25",
    "number": 25,
    "title": "Minimum Size Subarray Sum",
    "slug": "minimum-size-subarray-sum",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "36.70%",
    "frequency": 91,
    "points": 200,
    "hints": [
      "Expand right pointer until sum >= target, then shrink left."
    ]
  },
  {
    "id": "t150-26",
    "number": 26,
    "title": "Longest Repeating Character Replacement",
    "slug": "longest-repeating-character-replacement",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "50.04%",
    "frequency": 90,
    "points": 200,
    "hints": [
      "Window length - maxFrequency <= k."
    ]
  },
  {
    "id": "t150-27",
    "number": 27,
    "title": "Anagram",
    "slug": "anagram",
    "difficulty": "Easy",
    "category": "Sliding Window",
    "companies": [
      "Adobe",
      "Directi",
      "Flipkart"
    ],
    "acceptanceRate": "44.93%",
    "frequency": 90,
    "points": 100,
    "hints": [
      "Sliding frequency map comparison."
    ]
  },
  {
    "id": "t150-28",
    "number": 28,
    "title": "Maximum Average Subarray",
    "slug": "maximum-average-subarray",
    "difficulty": "Easy",
    "category": "Sliding Window",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "42.11%",
    "frequency": 90,
    "points": 100,
    "hints": [
      "Maintain running sum of k elements."
    ]
  },
  {
    "id": "t150-29",
    "number": 29,
    "title": "Sliding Window Maximum",
    "slug": "sliding-window-maximum",
    "difficulty": "Hard",
    "category": "Sliding Window",
    "companies": [
      "Amazon",
      "Google",
      "Meta"
    ],
    "acceptanceRate": "37.80%",
    "frequency": 90,
    "points": 300,
    "hints": [
      "Monotonic decreasing deque storing indices."
    ]
  },
  {
    "id": "t150-30",
    "number": 30,
    "title": "Minimum Window Substring",
    "slug": "minimum-window-substring",
    "difficulty": "Hard",
    "category": "Sliding Window",
    "companies": [
      "Meta",
      "Google",
      "Amazon",
      "LinkedIn"
    ],
    "acceptanceRate": "26.20%",
    "frequency": 90,
    "points": 300,
    "hints": [
      "Expand right to satisfy condition, contract left to minimize."
    ]
  },
  {
    "id": "t150-31",
    "number": 31,
    "title": "Set Matrix Zeroes",
    "slug": "set-matrix-zeroes",
    "difficulty": "Medium",
    "category": "Matrix",
    "companies": [
      "Meta",
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "56.80%",
    "frequency": 89,
    "points": 200,
    "hints": [
      "Use first row and first column as markers to achieve O(1) space."
    ]
  },
  {
    "id": "t150-32",
    "number": 32,
    "title": "Spiral Matrix",
    "slug": "spiral-matrix",
    "difficulty": "Medium",
    "category": "Matrix",
    "companies": [
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "acceptanceRate": "65.20%",
    "frequency": 89,
    "points": 200,
    "hints": [
      "Four boundary pointers: top, bottom, left, right."
    ]
  },
  {
    "id": "t150-33",
    "number": 33,
    "title": "Search a 2D Matrix",
    "slug": "search-a-2d-matrix",
    "difficulty": "Medium",
    "category": "Matrix",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "45.20%",
    "frequency": 89,
    "points": 200,
    "hints": [
      "Treat as flattened 1D sorted array: row = mid / cols, col = mid % cols."
    ]
  },
  {
    "id": "t150-34",
    "number": 34,
    "title": "Search a 2D Matrix II",
    "slug": "search-a-2d-matrix-ii",
    "difficulty": "Medium",
    "category": "Matrix",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "34.70%",
    "frequency": 89,
    "points": 200,
    "hints": [
      "Start from top-right corner; move left if too big, down if too small."
    ]
  },
  {
    "id": "t150-35",
    "number": 35,
    "title": "Valid Sudoku",
    "slug": "valid-sudoku",
    "difficulty": "Medium",
    "category": "Matrix",
    "companies": [
      "Apple",
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "63.00%",
    "frequency": 89,
    "points": 200,
    "hints": [
      "Track seen digits for rows, columns, and 3x3 sub-boxes."
    ]
  },
  {
    "id": "t150-36",
    "number": 36,
    "title": "Conway's Game Of Life",
    "slug": "conway-s-game-of-life",
    "difficulty": "Medium",
    "category": "Matrix",
    "companies": [
      "Google",
      "Amazon"
    ],
    "acceptanceRate": "%",
    "frequency": 88,
    "points": 200,
    "hints": [
      "Use 2-bit state encoding for in-place transitions."
    ]
  },
  {
    "id": "t150-37",
    "number": 37,
    "title": "Word Search",
    "slug": "word-search",
    "difficulty": "Medium",
    "category": "Matrix",
    "companies": [
      "Amazon",
      "Apple",
      "Intuit"
    ],
    "acceptanceRate": "32.69%",
    "frequency": 88,
    "points": 200,
    "hints": [
      "DFS with backtracking on grid."
    ]
  },
  {
    "id": "t150-38",
    "number": 38,
    "title": "Group Anagrams",
    "slug": "group-anagrams",
    "difficulty": "Medium",
    "category": "Hashmap",
    "companies": [
      "Amazon",
      "Google",
      "Meta",
      "Apple"
    ],
    "acceptanceRate": "35.20%",
    "frequency": 88,
    "points": 200,
    "hints": [
      "Sorted string or character frequency tuple as hash key."
    ]
  },
  {
    "id": "t150-39",
    "number": 39,
    "title": "Longest Consecutive Sequence",
    "slug": "longest-consecutive-sequence",
    "difficulty": "Medium",
    "category": "Hashmap",
    "companies": [
      "Google",
      "Amazon",
      "Meta"
    ],
    "acceptanceRate": "25.50%",
    "frequency": 88,
    "points": 200,
    "hints": [
      "Check if (num - 1) is in set; only start counting from streak start."
    ]
  },
  {
    "id": "t150-40",
    "number": 40,
    "title": "Isomorphic Strings",
    "slug": "isomorphic-strings",
    "difficulty": "Easy",
    "category": "Hashmap",
    "companies": [
      "Google"
    ],
    "acceptanceRate": "34.21%",
    "frequency": 88,
    "points": 100,
    "hints": [
      "Two-way mapping between characters."
    ]
  },
  {
    "id": "t150-41",
    "number": 41,
    "title": "Valid Anagram",
    "slug": "valid-anagram",
    "difficulty": "Easy",
    "category": "Hashmap",
    "companies": [
      "Amazon",
      "Google",
      "Meta"
    ],
    "acceptanceRate": "64.10%",
    "frequency": 87,
    "points": 100,
    "hints": [
      "Count character frequencies."
    ]
  },
  {
    "id": "t150-42",
    "number": 42,
    "title": "Next Happy Number",
    "slug": "next-happy-number",
    "difficulty": "Hard",
    "category": "Hashmap",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "53.97%",
    "frequency": 87,
    "points": 300,
    "hints": [
      "Floyd's cycle-finding algorithm on sum of squared digits."
    ]
  },
  {
    "id": "t150-43",
    "number": 43,
    "title": "Contains Duplicate",
    "slug": "contains-duplicate",
    "difficulty": "Easy",
    "category": "Hashmap",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "81.70%",
    "frequency": 87,
    "points": 100,
    "hints": [
      "Hash map of last seen indices within distance k."
    ]
  },
  {
    "id": "t150-44",
    "number": 44,
    "title": "Merge Intervals",
    "slug": "merge-intervals",
    "difficulty": "Medium",
    "category": "Intervals",
    "companies": [
      "Meta",
      "Google",
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "28.90%",
    "frequency": 87,
    "points": 200,
    "hints": [
      "Sort intervals by start time and merge overlapping."
    ]
  },
  {
    "id": "t150-45",
    "number": 45,
    "title": "Insert Interval",
    "slug": "insert-interval",
    "difficulty": "Medium",
    "category": "Intervals",
    "companies": [
      "NPCI"
    ],
    "acceptanceRate": "50.61%",
    "frequency": 87,
    "points": 200,
    "hints": [
      "Add non-overlapping before, merge overlapping, add remaining."
    ]
  },
  {
    "id": "t150-46",
    "number": 46,
    "title": "Non-Overlapping Intervals",
    "slug": "non-overlapping-intervals",
    "difficulty": "Medium",
    "category": "Intervals",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "51.92%",
    "frequency": 86,
    "points": 200,
    "hints": [
      "Sort by end time; greedily keep intervals finishing earliest."
    ]
  },
  {
    "id": "t150-47",
    "number": 47,
    "title": "Meeting Rooms",
    "slug": "meeting-rooms",
    "difficulty": "Easy",
    "category": "Intervals",
    "companies": [
      "NPCI"
    ],
    "acceptanceRate": "65.12%",
    "frequency": 86,
    "points": 100,
    "hints": [
      "Sort by start time; check if start[i] < end[i-1]."
    ]
  },
  {
    "id": "t150-48",
    "number": 48,
    "title": "Meeting Rooms II",
    "slug": "meeting-rooms-ii",
    "difficulty": "Medium",
    "category": "Intervals",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "48.01%",
    "frequency": 86,
    "points": 200,
    "hints": [
      "Min-heap of end times or two pointer chronologically."
    ]
  },
  {
    "id": "t150-49",
    "number": 49,
    "title": "Valid Parentheses",
    "slug": "valid-parentheses",
    "difficulty": "Easy",
    "category": "Stack",
    "companies": [
      "Meta",
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "acceptanceRate": "59.90%",
    "frequency": 86,
    "points": 100,
    "hints": [
      "Push opening brackets to stack; pop and match on closing."
    ]
  },
  {
    "id": "t150-50",
    "number": 50,
    "title": "Min Stack",
    "slug": "min-stack",
    "difficulty": "Medium",
    "category": "Stack",
    "companies": [
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "acceptanceRate": "29.90%",
    "frequency": 86,
    "points": 200,
    "hints": [
      "Pair each element with the current minimum."
    ]
  },
  {
    "id": "t150-51",
    "number": 51,
    "title": "Evaluate Reverse Polish Notation",
    "slug": "evaluate-reverse-polish-notation",
    "difficulty": "Medium",
    "category": "Stack",
    "companies": [
      "Amazon",
      "Google",
      "LinkedIn"
    ],
    "acceptanceRate": "73.80%",
    "frequency": 85,
    "points": 200,
    "hints": [
      "Push numbers; pop two operands on operator and push result."
    ]
  },
  {
    "id": "t150-52",
    "number": 52,
    "title": "Daily Temperatures",
    "slug": "daily-temperatures",
    "difficulty": "Medium",
    "category": "Stack",
    "companies": [
      "Meta",
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "66.20%",
    "frequency": 85,
    "points": 200,
    "hints": [
      "Monotonic decreasing stack of day indices."
    ]
  },
  {
    "id": "t150-53",
    "number": 53,
    "title": "Next Greater Element",
    "slug": "next-greater-element",
    "difficulty": "Medium",
    "category": "Stack",
    "companies": [
      "Adobe",
      "Amazon",
      "Flipkart"
    ],
    "acceptanceRate": "32.95%",
    "frequency": 85,
    "points": 200,
    "hints": [
      "Monotonic stack with hash map lookup."
    ]
  },
  {
    "id": "t150-54",
    "number": 54,
    "title": "Largest Rectangle in Histogram",
    "slug": "largest-rectangle-in-histogram",
    "difficulty": "Hard",
    "category": "Stack",
    "companies": [
      "Google",
      "Amazon",
      "Meta"
    ],
    "acceptanceRate": "32.70%",
    "frequency": 85,
    "points": 300,
    "hints": [
      "Monotonic increasing stack tracking indices and heights."
    ]
  },
  {
    "id": "t150-55",
    "number": 55,
    "title": "Simplify Path",
    "slug": "simplify-path",
    "difficulty": "Medium",
    "category": "Stack",
    "companies": [
      "Meta",
      "Amazon"
    ],
    "acceptanceRate": "35.50%",
    "frequency": 85,
    "points": 200,
    "hints": [
      "Split by '/', ignore empty and '.', pop on '..'"
    ]
  },
  {
    "id": "t150-56",
    "number": 56,
    "title": "Implement Queue using Stacks",
    "slug": "implement-queue-using-stacks",
    "difficulty": "Easy",
    "category": "Stack",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "66.10%",
    "frequency": 84,
    "points": 100,
    "hints": [
      "Two stacks: one for in, one for out."
    ]
  },
  {
    "id": "t150-57",
    "number": 57,
    "title": "Implement Stack using Queues",
    "slug": "implement-stack-using-queues",
    "difficulty": "Easy",
    "category": "Stack",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "49.80%",
    "frequency": 84,
    "points": 100,
    "hints": [
      "Rotate queue on push."
    ]
  },
  {
    "id": "t150-58",
    "number": 58,
    "title": "Reverse Linked List",
    "slug": "reverse-linked-list",
    "difficulty": "Easy",
    "category": "Linked List",
    "companies": [
      "Amazon",
      "Google",
      "Microsoft",
      "Meta"
    ],
    "acceptanceRate": "55.20%",
    "frequency": 84,
    "points": 100,
    "hints": [
      "Three pointers: prev, curr, next."
    ]
  },
  {
    "id": "t150-59",
    "number": 59,
    "title": "Linked List Cycle",
    "slug": "linked-list-cycle",
    "difficulty": "Easy",
    "category": "Linked List",
    "companies": [
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "acceptanceRate": "57.80%",
    "frequency": 84,
    "points": 100,
    "hints": [
      "Floyd's Tortoise and Hare two pointers."
    ]
  },
  {
    "id": "t150-60",
    "number": 60,
    "title": "Linked List Cycle",
    "slug": "linked-list-cycle",
    "difficulty": "Easy",
    "category": "Linked List",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "57.80%",
    "frequency": 84,
    "points": 100,
    "hints": [
      "Find meeting point, then reset slow to head."
    ]
  },
  {
    "id": "t150-61",
    "number": 61,
    "title": "Merge Two Sorted Lists",
    "slug": "merge-two-sorted-lists",
    "difficulty": "Easy",
    "category": "Linked List",
    "companies": [
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "acceptanceRate": "60.50%",
    "frequency": 83,
    "points": 100,
    "hints": [
      "Dummy head with two pointer merge."
    ]
  },
  {
    "id": "t150-62",
    "number": 62,
    "title": "Remove Nth Node From End of List",
    "slug": "remove-nth-node-from-end-of-list",
    "difficulty": "Medium",
    "category": "Linked List",
    "companies": [
      "Amazon",
      "Meta",
      "Google"
    ],
    "acceptanceRate": "60.40%",
    "frequency": 83,
    "points": 200,
    "hints": [
      "Fast pointer leads by n steps before slow begins."
    ]
  },
  {
    "id": "t150-63",
    "number": 63,
    "title": "Add Two Numbers",
    "slug": "add-two-numbers",
    "difficulty": "Medium",
    "category": "Linked List",
    "companies": [
      "Amazon",
      "Microsoft",
      "Meta",
      "Google"
    ],
    "acceptanceRate": "72.10%",
    "frequency": 83,
    "points": 200,
    "hints": [
      "Traverse both lists with carry propagation."
    ]
  },
  {
    "id": "t150-64",
    "number": 64,
    "title": "Palindrome Linked List",
    "slug": "palindrome-linked-list",
    "difficulty": "Medium",
    "category": "Linked List",
    "companies": [
      "Accolite",
      "Adobe",
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "41.48%",
    "frequency": 83,
    "points": 200,
    "hints": [
      "Find midpoint, reverse second half, compare."
    ]
  },
  {
    "id": "t150-65",
    "number": 65,
    "title": "LRU Cache",
    "slug": "lru-cache",
    "difficulty": "Hard",
    "category": "Linked List",
    "companies": [
      "Adobe",
      "Amazon",
      "Flipkart"
    ],
    "acceptanceRate": "18.44%",
    "frequency": 83,
    "points": 300,
    "hints": [
      "Hash map + Doubly linked list for O(1) get & put."
    ]
  },
  {
    "id": "t150-66",
    "number": 66,
    "title": "Copy List with Random Pointer",
    "slug": "copy-list-with-random-pointer",
    "difficulty": "Medium",
    "category": "Linked List",
    "companies": [
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "acceptanceRate": "49.80%",
    "frequency": 82,
    "points": 200,
    "hints": [
      "Interweave cloned nodes between originals, assign randoms, unweave."
    ]
  },
  {
    "id": "t150-67",
    "number": 67,
    "title": "Reorder List",
    "slug": "reorder-list",
    "difficulty": "Hard",
    "category": "Linked List",
    "companies": [
      "Amazon",
      "Intuit",
      "Microsoft"
    ],
    "acceptanceRate": "47.90%",
    "frequency": 82,
    "points": 300,
    "hints": [
      "Find middle, reverse second half, merge alternatively."
    ]
  },
  {
    "id": "t150-68",
    "number": 68,
    "title": "Maximum Depth of Binary Tree",
    "slug": "maximum-depth-of-binary-tree",
    "difficulty": "Easy",
    "category": "Binary Tree General",
    "companies": [
      "Amazon",
      "Microsoft",
      "Facebook"
    ],
    "acceptanceRate": "77.83%",
    "frequency": 82,
    "points": 100,
    "hints": [
      "1 + max(depth(left), depth(right))."
    ]
  },
  {
    "id": "t150-69",
    "number": 69,
    "title": "Same Tree",
    "slug": "same-tree",
    "difficulty": "Easy",
    "category": "Binary Tree General",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "54.20%",
    "frequency": 82,
    "points": 100,
    "hints": [
      "Recursive equality on roots, lefts, and rights."
    ]
  },
  {
    "id": "t150-70",
    "number": 70,
    "title": "Invert Binary Tree",
    "slug": "invert-binary-tree",
    "difficulty": "Easy",
    "category": "Binary Tree General",
    "companies": [
      "Google",
      "Amazon",
      "Meta"
    ],
    "acceptanceRate": "79.10%",
    "frequency": 82,
    "points": 100,
    "hints": [
      "Swap left and right subtrees recursively."
    ]
  },
  {
    "id": "t150-71",
    "number": 71,
    "title": "Symmetric Tree",
    "slug": "symmetric-tree",
    "difficulty": "Easy",
    "category": "Binary Tree General",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "44.96%",
    "frequency": 81,
    "points": 100,
    "hints": [
      "Helper checking mirror equality of left and right."
    ]
  },
  {
    "id": "t150-72",
    "number": 72,
    "title": "Diameter of Binary Tree",
    "slug": "diameter-of-binary-tree",
    "difficulty": "Easy",
    "category": "Binary Tree General",
    "companies": [
      "Meta",
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "78.60%",
    "frequency": 81,
    "points": 100,
    "hints": [
      "Max path length through any node = leftHeight + rightHeight."
    ]
  },
  {
    "id": "t150-73",
    "number": 73,
    "title": "Count Balanced Binary Trees of Height h",
    "slug": "count-balanced-binary-trees-of-height-h",
    "difficulty": "Medium",
    "category": "Binary Tree General",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "65.50%",
    "frequency": 81,
    "points": 200,
    "hints": [
      "Return height or -1 if unbalanced."
    ]
  },
  {
    "id": "t150-74",
    "number": 74,
    "title": "Path Sum",
    "slug": "path-sum",
    "difficulty": "Easy",
    "category": "Binary Tree General",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "79.20%",
    "frequency": 81,
    "points": 100,
    "hints": [
      "Subtract node val and check leaf."
    ]
  },
  {
    "id": "t150-75",
    "number": 75,
    "title": "Lowest Common Ancestor of a Binary Tree",
    "slug": "lowest-common-ancestor-of-a-binary-tree",
    "difficulty": "Medium",
    "category": "Binary Tree General",
    "companies": [
      "Meta",
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "acceptanceRate": "51.90%",
    "frequency": 81,
    "points": 200,
    "hints": [
      "If root is p or q, return root. If both subtrees return non-null, root is LCA."
    ]
  },
  {
    "id": "t150-76",
    "number": 76,
    "title": "Construct Binary Tree from Preorder and Inorder Traversal",
    "slug": "construct-binary-tree-from-preorder-and-inorder-traversal",
    "difficulty": "Medium",
    "category": "Binary Tree General",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "33.60%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "First preorder is root; find in inorder map."
    ]
  },
  {
    "id": "t150-77",
    "number": 77,
    "title": "Flatten Binary Tree to Linked List",
    "slug": "flatten-binary-tree-to-linked-list",
    "difficulty": "Medium",
    "category": "Binary Tree General",
    "companies": [
      "Microsoft"
    ],
    "acceptanceRate": "75.82%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Reverse post-order traversal: right, left, root."
    ]
  },
  {
    "id": "t150-78",
    "number": 78,
    "title": "Binary Tree Maximum Path Sum",
    "slug": "binary-tree-maximum-path-sum",
    "difficulty": "Hard",
    "category": "Binary Tree General",
    "companies": [
      "Meta",
      "Google",
      "Amazon"
    ],
    "acceptanceRate": "37.80%",
    "frequency": 80,
    "points": 300,
    "hints": [
      "Node contribution = max(0, subtree); update global max."
    ]
  },
  {
    "id": "t150-79",
    "number": 79,
    "title": "Binary Tree Level Order Traversal",
    "slug": "binary-tree-level-order-traversal",
    "difficulty": "Medium",
    "category": "Binary Tree BFS",
    "companies": [
      "Amazon",
      "Meta",
      "Google"
    ],
    "acceptanceRate": "58.00%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Queue based BFS recording elements per level."
    ]
  },
  {
    "id": "t150-80",
    "number": 80,
    "title": "Binary Tree Zigzag Level Order Traversal",
    "slug": "binary-tree-zigzag-level-order-traversal",
    "difficulty": "Medium",
    "category": "Binary Tree BFS",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "66.90%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Level order traversal reversing alternate levels."
    ]
  },
  {
    "id": "t150-81",
    "number": 81,
    "title": "Populating Next Right Pointers in Each Node",
    "slug": "populating-next-right-pointers-in-each-node",
    "difficulty": "Medium",
    "category": "Binary Tree BFS",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "68.00%",
    "frequency": 79,
    "points": 200,
    "hints": [
      "Use next pointers of current level to link children."
    ]
  },
  {
    "id": "t150-82",
    "number": 82,
    "title": "Validate Binary Search Tree",
    "slug": "validate-binary-search-tree",
    "difficulty": "Medium",
    "category": "Binary Search Tree",
    "companies": [
      "Amazon",
      "Meta",
      "Microsoft"
    ],
    "acceptanceRate": "69.80%",
    "frequency": 79,
    "points": 200,
    "hints": [
      "Pass (minVal, maxVal) boundaries down recursively."
    ]
  },
  {
    "id": "t150-83",
    "number": 83,
    "title": "Kth Smallest Element in a BST",
    "slug": "kth-smallest-element-in-a-bst",
    "difficulty": "Medium",
    "category": "Binary Search Tree",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "59.00%",
    "frequency": 79,
    "points": 200,
    "hints": [
      "In-order traversal yields sorted order."
    ]
  },
  {
    "id": "t150-84",
    "number": 84,
    "title": "Binary Search",
    "slug": "binary-search",
    "difficulty": "Easy",
    "category": "Binary Search Tree",
    "companies": [
      "Paytm"
    ],
    "acceptanceRate": "48.03%",
    "frequency": 79,
    "points": 100,
    "hints": [
      "If both p and q < root, go left; if both > root, go right."
    ]
  },
  {
    "id": "t150-85",
    "number": 85,
    "title": "Binary Search",
    "slug": "binary-search",
    "difficulty": "Easy",
    "category": "Binary Search Tree",
    "companies": [
      "Paytm"
    ],
    "acceptanceRate": "48.03%",
    "frequency": 79,
    "points": 100,
    "hints": [
      "Standard BST search comparison."
    ]
  },
  {
    "id": "t150-86",
    "number": 86,
    "title": "Binary Search",
    "slug": "binary-search",
    "difficulty": "Easy",
    "category": "Binary Search Tree",
    "companies": [
      "Paytm"
    ],
    "acceptanceRate": "48.03%",
    "frequency": 78,
    "points": 100,
    "hints": [
      "Traverse until null child found."
    ]
  },
  {
    "id": "t150-87",
    "number": 87,
    "title": "Binary Search",
    "slug": "binary-search",
    "difficulty": "Easy",
    "category": "Divide & Conquer",
    "companies": [
      "Paytm"
    ],
    "acceptanceRate": "48.03%",
    "frequency": 78,
    "points": 100,
    "hints": [
      "Low, high, mid with integer overflow safe mid."
    ]
  },
  {
    "id": "t150-88",
    "number": 88,
    "title": "Search in Rotated Sorted Array",
    "slug": "search-in-rotated-sorted-array",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Adobe",
      "Amazon",
      "BankBazaar"
    ],
    "acceptanceRate": "37.64%",
    "frequency": 78,
    "points": 200,
    "hints": [
      "Identify which half is sorted, then check if target is in that half."
    ]
  },
  {
    "id": "t150-89",
    "number": 89,
    "title": "Find Minimum in Rotated Sorted Array",
    "slug": "find-minimum-in-rotated-sorted-array",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "58.10%",
    "frequency": 78,
    "points": 200,
    "hints": [
      "Compare mid with right pointer."
    ]
  },
  {
    "id": "t150-90",
    "number": 90,
    "title": "Find Peak Element",
    "slug": "find-peak-element",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Meta",
      "Google"
    ],
    "acceptanceRate": "68.20%",
    "frequency": 78,
    "points": 200,
    "hints": [
      "If mid < mid + 1, peak must be in right half."
    ]
  },
  {
    "id": "t150-91",
    "number": 91,
    "title": "Find First and Last Position of Element in Sorted Array",
    "slug": "find-first-and-last-position-of-element-in-sorted-array",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Meta",
      "Amazon"
    ],
    "acceptanceRate": "67.00%",
    "frequency": 77,
    "points": 200,
    "hints": [
      "Two binary searches: one for lower bound, one for upper bound."
    ]
  },
  {
    "id": "t150-92",
    "number": 92,
    "title": "Search Insert Position",
    "slug": "search-insert-position",
    "difficulty": "Easy",
    "category": "Divide & Conquer",
    "companies": [
      "Google",
      "Apple"
    ],
    "acceptanceRate": "52.30%",
    "frequency": 77,
    "points": 100,
    "hints": [
      "Standard lower bound binary search."
    ]
  },
  {
    "id": "t150-93",
    "number": 93,
    "title": "Peak Index in a Mountain Array",
    "slug": "peak-index-in-a-mountain-array",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Google",
      "Amazon"
    ],
    "acceptanceRate": "67.80%",
    "frequency": 77,
    "points": 200,
    "hints": [
      "Binary search on slopes."
    ]
  },
  {
    "id": "t150-94",
    "number": 94,
    "title": "Kth Largest Element in an Array",
    "slug": "kth-largest-element-in-an-array",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Meta",
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "55.30%",
    "frequency": 77,
    "points": 200,
    "hints": [
      "Min-heap of size k or Quickselect."
    ]
  },
  {
    "id": "t150-95",
    "number": 95,
    "title": "Find Median from Data Stream (Running Median)",
    "slug": "find-median-from-data-stream-running-median",
    "difficulty": "Hard",
    "category": "Divide & Conquer",
    "companies": [
      "Google",
      "Amazon",
      "Apple"
    ],
    "acceptanceRate": "16.70%",
    "frequency": 77,
    "points": 300,
    "hints": [
      "Max-heap for lower half, Min-heap for upper half."
    ]
  },
  {
    "id": "t150-96",
    "number": 96,
    "title": "Merge k Sorted Lists",
    "slug": "merge-k-sorted-lists",
    "difficulty": "Hard",
    "category": "Divide & Conquer",
    "companies": [
      "Amazon",
      "Google",
      "Meta"
    ],
    "acceptanceRate": "21.50%",
    "frequency": 76,
    "points": 300,
    "hints": [
      "Min-heap of node heads or divide-and-conquer merge."
    ]
  },
  {
    "id": "t150-97",
    "number": 97,
    "title": "Task Scheduler",
    "slug": "task-scheduler",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "58.08%",
    "frequency": 76,
    "points": 200,
    "hints": [
      "Greedy formula: (maxFreq - 1) * (n + 1) + countOfMaxFreq."
    ]
  },
  {
    "id": "t150-98",
    "number": 98,
    "title": "K Closest Points to Origin",
    "slug": "k-closest-points-to-origin",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "62.40%",
    "frequency": 76,
    "points": 200,
    "hints": [
      "Max-heap of size k keyed by Euclidean distance."
    ]
  },
  {
    "id": "t150-99",
    "number": 99,
    "title": "Subsets",
    "slug": "subsets",
    "difficulty": "Medium",
    "category": "Backtracking",
    "companies": [
      "Microsoft",
      "NPCI"
    ],
    "acceptanceRate": "44.30%",
    "frequency": 76,
    "points": 200,
    "hints": [
      "Include/exclude decisions or backtrack with start index."
    ]
  },
  {
    "id": "t150-100",
    "number": 100,
    "title": "Subsets",
    "slug": "subsets",
    "difficulty": "Medium",
    "category": "Backtracking",
    "companies": [
      "Microsoft",
      "NPCI"
    ],
    "acceptanceRate": "44.30%",
    "frequency": 76,
    "points": 200,
    "hints": [
      "Sort and skip duplicate elements at same recursion depth."
    ]
  },
  {
    "id": "t150-101",
    "number": 101,
    "title": "Permutations",
    "slug": "permutations",
    "difficulty": "Medium",
    "category": "Backtracking",
    "companies": [
      "Meta",
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "49.90%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Backtrack swapping elements or boolean visited array."
    ]
  },
  {
    "id": "t150-102",
    "number": 102,
    "title": "Combination Sum",
    "slug": "combination-sum",
    "difficulty": "Medium",
    "category": "Backtracking",
    "companies": [
      "Amazon",
      "Meta",
      "Google"
    ],
    "acceptanceRate": "72.40%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Sort and backtrack reusing current candidate."
    ]
  },
  {
    "id": "t150-103",
    "number": 103,
    "title": "Combination Sum",
    "slug": "combination-sum",
    "difficulty": "Medium",
    "category": "Backtracking",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "72.40%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Sort and skip duplicates at same level."
    ]
  },
  {
    "id": "t150-104",
    "number": 104,
    "title": "Letter Combinations of a Phone Number",
    "slug": "letter-combinations-of-a-phone-number",
    "difficulty": "Medium",
    "category": "Backtracking",
    "companies": [
      "Amazon",
      "Meta",
      "Google"
    ],
    "acceptanceRate": "61.70%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "DFS across mapped keypad letters."
    ]
  },
  {
    "id": "t150-105",
    "number": 105,
    "title": "Generate Parentheses",
    "slug": "generate-parentheses",
    "difficulty": "Medium",
    "category": "Backtracking",
    "companies": [
      "Amazon",
      "Microsoft",
      "Walmart"
    ],
    "acceptanceRate": "59.23%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Add '(' if open < n, add ')' if close < open."
    ]
  },
  {
    "id": "t150-106",
    "number": 106,
    "title": "Number of Islands",
    "slug": "number-of-islands",
    "difficulty": "Medium",
    "category": "Graph General",
    "companies": [
      "Amazon",
      "Google",
      "Meta",
      "Microsoft"
    ],
    "acceptanceRate": "72.70%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "DFS / BFS marking visited land cells as water."
    ]
  },
  {
    "id": "t150-107",
    "number": 107,
    "title": "Clone Graph",
    "slug": "clone-graph",
    "difficulty": "Medium",
    "category": "Graph General",
    "companies": [
      "Meta",
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "69.90%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Hash map of original node -> cloned node."
    ]
  },
  {
    "id": "t150-108",
    "number": 108,
    "title": "Course Schedule",
    "slug": "course-schedule",
    "difficulty": "Medium",
    "category": "Graph General",
    "companies": [
      "Amazon",
      "Google",
      "Meta"
    ],
    "acceptanceRate": "58.20%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Cycle detection using Kahn's algorithm (indegree BFS) or DFS colors."
    ]
  },
  {
    "id": "t150-109",
    "number": 109,
    "title": "Course Schedule II",
    "slug": "course-schedule-ii",
    "difficulty": "Medium",
    "category": "Graph General",
    "companies": [
      "Google"
    ],
    "acceptanceRate": "51.77%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Topological sort order recording."
    ]
  },
  {
    "id": "t150-110",
    "number": 110,
    "title": "Minimum Time Required to Rot All Oranges (Rotting Oranges)",
    "slug": "minimum-time-required-to-rot-all-oranges-rotting-oranges",
    "difficulty": "Medium",
    "category": "Graph BFS",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "41.90%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Multi-source BFS from all initial rotten oranges."
    ]
  },
  {
    "id": "t150-111",
    "number": 111,
    "title": "Pacific Atlantic Water Flow",
    "slug": "pacific-atlantic-water-flow",
    "difficulty": "Medium",
    "category": "Graph BFS",
    "companies": [
      "Google",
      "Amazon"
    ],
    "acceptanceRate": "31.10%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "BFS/DFS inward from ocean borders; find intersection."
    ]
  },
  {
    "id": "t150-112",
    "number": 112,
    "title": "Word Ladder",
    "slug": "word-ladder",
    "difficulty": "Hard",
    "category": "Graph BFS",
    "companies": [
      "Amazon",
      "Google",
      "Meta"
    ],
    "acceptanceRate": "22.20%",
    "frequency": 75,
    "points": 300,
    "hints": [
      "Shortest path in unweighted graph -> BFS with wildcard word map."
    ]
  },
  {
    "id": "t150-113",
    "number": 113,
    "title": "Network Delay Time",
    "slug": "network-delay-time",
    "difficulty": "Medium",
    "category": "Graph General",
    "companies": [
      "Google",
      "Amazon"
    ],
    "acceptanceRate": "67.20%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Dijkstra's shortest path algorithm using priority queue."
    ]
  },
  {
    "id": "t150-114",
    "number": 114,
    "title": "Is Graph Bipartite?",
    "slug": "is-graph-bipartite",
    "difficulty": "Medium",
    "category": "Graph General",
    "companies": [
      "Meta",
      "Google"
    ],
    "acceptanceRate": "33.30%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "BFS 2-coloring with 0 and 1."
    ]
  },
  {
    "id": "t150-115",
    "number": 115,
    "title": "Climbing Stairs",
    "slug": "climbing-stairs",
    "difficulty": "Easy",
    "category": "1D Dynamic Programming",
    "companies": [
      "Amazon",
      "Google",
      "Apple"
    ],
    "acceptanceRate": "80.60%",
    "frequency": 75,
    "points": 100,
    "hints": [
      "dp[i] = dp[i-1] + dp[i-2]."
    ]
  },
  {
    "id": "t150-116",
    "number": 116,
    "title": "House Robber III",
    "slug": "house-robber-iii",
    "difficulty": "Medium",
    "category": "1D Dynamic Programming",
    "companies": [
      "Amazon",
      "Google",
      "Meta"
    ],
    "acceptanceRate": "72.50%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "dp[i] = max(dp[i-1], dp[i-2] + nums[i])."
    ]
  },
  {
    "id": "t150-117",
    "number": 117,
    "title": "House Robber III",
    "slug": "house-robber-iii",
    "difficulty": "Medium",
    "category": "1D Dynamic Programming",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "72.50%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Rob houses 0 to n-2, or 1 to n-1, take max."
    ]
  },
  {
    "id": "t150-118",
    "number": 118,
    "title": "Coin Change Problem (Count Ways & Min Coins)",
    "slug": "coin-change-problem-count-ways-min-coins",
    "difficulty": "Medium",
    "category": "1D Dynamic Programming",
    "companies": [
      "Amazon",
      "Google",
      "Meta"
    ],
    "acceptanceRate": "28.50%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Unbounded knapsack: dp[i] = min(dp[i], dp[i - coin] + 1)."
    ]
  },
  {
    "id": "t150-119",
    "number": 119,
    "title": "Longest Increasing Subsequence (LIS)",
    "slug": "longest-increasing-subsequence-lis",
    "difficulty": "Medium",
    "category": "1D Dynamic Programming",
    "companies": [
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "acceptanceRate": "40.20%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Patience sorting with binary search in O(n log n)."
    ]
  },
  {
    "id": "t150-120",
    "number": 120,
    "title": "Word Break Problem",
    "slug": "word-break-problem",
    "difficulty": "Medium",
    "category": "1D Dynamic Programming",
    "companies": [
      "Amazon",
      "Meta",
      "Google"
    ],
    "acceptanceRate": "55.60%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "dp[i] = true if dp[j] and s[j..i] in dictionary."
    ]
  },
  {
    "id": "t150-121",
    "number": 121,
    "title": "Decode Ways",
    "slug": "decode-ways",
    "difficulty": "Medium",
    "category": "1D Dynamic Programming",
    "companies": [
      "Meta",
      "Amazon"
    ],
    "acceptanceRate": "70.30%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "dp[i] based on 1-digit and 2-digit valid decodings."
    ]
  },
  {
    "id": "t150-122",
    "number": 122,
    "title": "Maximum Product Subarray",
    "slug": "maximum-product-subarray",
    "difficulty": "Medium",
    "category": "1D Dynamic Programming",
    "companies": [
      "Amazon",
      "Google",
      "LinkedIn"
    ],
    "acceptanceRate": "70.70%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Track both maxProduct and minProduct due to negatives."
    ]
  },
  {
    "id": "t150-123",
    "number": 123,
    "title": "Jump Game",
    "slug": "jump-game",
    "difficulty": "Medium",
    "category": "1D Dynamic Programming",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "57.80%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Track furthest reachable index greedily."
    ]
  },
  {
    "id": "t150-124",
    "number": 124,
    "title": "Jump Game II",
    "slug": "jump-game-ii",
    "difficulty": "Medium",
    "category": "1D Dynamic Programming",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "59.70%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "BFS level boundaries of jump ranges."
    ]
  },
  {
    "id": "t150-125",
    "number": 125,
    "title": "Unique Paths",
    "slug": "unique-paths",
    "difficulty": "Medium",
    "category": "Multidimensional DP",
    "companies": [
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "acceptanceRate": "31.70%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "dp[i][j] = dp[i-1][j] + dp[i][j-1]."
    ]
  },
  {
    "id": "t150-126",
    "number": 126,
    "title": "Unique Paths",
    "slug": "unique-paths",
    "difficulty": "Medium",
    "category": "Multidimensional DP",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "31.70%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Set obstacles to 0 ways."
    ]
  },
  {
    "id": "t150-127",
    "number": 127,
    "title": "Path Sum",
    "slug": "path-sum",
    "difficulty": "Easy",
    "category": "Multidimensional DP",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "79.20%",
    "frequency": 75,
    "points": 100,
    "hints": [
      "dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])."
    ]
  },
  {
    "id": "t150-128",
    "number": 128,
    "title": "Longest Common Subsequence Between Two Strings",
    "slug": "longest-common-subsequence-between-two-strings",
    "difficulty": "Medium",
    "category": "Multidimensional DP",
    "companies": [
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "acceptanceRate": "71.30%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "If match: 1 + dp[i-1][j-1]; else max(dp[i-1][j], dp[i][j-1])."
    ]
  },
  {
    "id": "t150-129",
    "number": 129,
    "title": "Edit Distance",
    "slug": "edit-distance",
    "difficulty": "Hard",
    "category": "Multidimensional DP",
    "companies": [
      "Amazon",
      "Goldman Sachs",
      "Google",
      "Microsoft"
    ],
    "acceptanceRate": "35.14%",
    "frequency": 75,
    "points": 300,
    "hints": [
      "Insert, delete, replace operations table."
    ]
  },
  {
    "id": "t150-130",
    "number": 130,
    "title": "Find if a String is Interleaved of Two Other Strings (Interleaving String)",
    "slug": "find-if-a-string-is-interleaved-of-two-other-strings-interleaving-string",
    "difficulty": "Medium",
    "category": "Multidimensional DP",
    "companies": [
      "Google",
      "Amazon"
    ],
    "acceptanceRate": "55.00%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "2D DP checking if s3[i+j-1] matches s1[i-1] or s2[j-1]."
    ]
  },
  {
    "id": "t150-131",
    "number": 131,
    "title": "Partition Equal Subset Sum Problem",
    "slug": "partition-equal-subset-sum-problem",
    "difficulty": "Medium",
    "category": "Multidimensional DP",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "25.20%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "0/1 Knapsack targeting totalSum / 2."
    ]
  },
  {
    "id": "t150-132",
    "number": 132,
    "title": "Implement Trie (Prefix Tree)",
    "slug": "implement-trie-prefix-tree",
    "difficulty": "Medium",
    "category": "Trie",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft"
    ],
    "acceptanceRate": "56.90%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Node with children map and isEndOfWord flag."
    ]
  },
  {
    "id": "t150-133",
    "number": 133,
    "title": "Design Add and Search Words Data Structure",
    "slug": "design-add-and-search-words-data-structure",
    "difficulty": "Medium",
    "category": "Trie",
    "companies": [
      "Amazon",
      "Google"
    ],
    "acceptanceRate": "67.88%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Trie with DFS branch traversal for '.' wildcards."
    ]
  },
  {
    "id": "t150-134",
    "number": 134,
    "title": "Word Search II",
    "slug": "word-search-ii",
    "difficulty": "Hard",
    "category": "Trie",
    "companies": [
      "Amazon",
      "Directi",
      "Facebook"
    ],
    "acceptanceRate": "40.80%",
    "frequency": 75,
    "points": 300,
    "hints": [
      "Build Trie of words, DFS traverse grid."
    ]
  },
  {
    "id": "t150-135",
    "number": 135,
    "title": "Reverse Bits",
    "slug": "reverse-bits",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "companies": [
      "Apple",
      "Amazon"
    ],
    "acceptanceRate": "71.47%",
    "frequency": 75,
    "points": 100,
    "hints": [
      "Shift result left and add lowest bit of n."
    ]
  },
  {
    "id": "t150-136",
    "number": 136,
    "title": "Pow(x, n)",
    "slug": "powx-n",
    "difficulty": "Medium",
    "category": "Math",
    "companies": [
      "Meta",
      "Google",
      "Amazon"
    ],
    "acceptanceRate": "54.00%",
    "frequency": 75,
    "points": 200,
    "hints": [
      "Binary exponentiation in O(log n)."
    ]
  },
  {
    "id": "t150-137",
    "number": 137,
    "title": "Factorial",
    "slug": "factorial",
    "difficulty": "Easy",
    "category": "Math",
    "companies": [
      "FactSet",
      "MAQ Software",
      "Morgan Stanley"
    ],
    "acceptanceRate": "40.58%",
    "frequency": 75,
    "points": 100,
    "hints": [
      "Count factors of 5: n/5 + n/25 + n/125 + ..."
    ]
  },
  {
    "id": "t150-138",
    "number": 138,
    "title": "Next Permutation",
    "slug": "next-permutation",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Amazon",
      "FactSet",
      "Flipkart"
    ],
    "acceptanceRate": "40.66%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-139",
    "number": 139,
    "title": "Expression Add Operators",
    "slug": "expression-add-operators",
    "difficulty": "Hard",
    "category": "Backtracking",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "61.49%",
    "frequency": 80,
    "points": 300,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-140",
    "number": 140,
    "title": "Remove K Digits",
    "slug": "remove-k-digits",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Microsoft",
      "NPCI"
    ],
    "acceptanceRate": "26.80%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-141",
    "number": 141,
    "title": "Design Twitter",
    "slug": "design-twitter",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Twitter"
    ],
    "acceptanceRate": "64.21%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-142",
    "number": 142,
    "title": "Intersection of Two Linked Lists",
    "slug": "intersection-of-two-linked-lists",
    "difficulty": "Easy",
    "category": "Linked List",
    "companies": [
      "VMWare",
      "Flipkart",
      "Accolite"
    ],
    "acceptanceRate": "21.23%",
    "frequency": 80,
    "points": 100,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-143",
    "number": 143,
    "title": "Alien Dictionary",
    "slug": "alien-dictionary",
    "difficulty": "Hard",
    "category": "Graph General",
    "companies": [
      "Amazon",
      "Flipkart",
      "Google"
    ],
    "acceptanceRate": "47.81%",
    "frequency": 80,
    "points": 300,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-144",
    "number": 144,
    "title": "Chocolate Distribution Problem",
    "slug": "chocolate-distribution-problem",
    "difficulty": "Easy",
    "category": "Divide & Conquer",
    "companies": [
      "Flipkart"
    ],
    "acceptanceRate": "49.91%",
    "frequency": 80,
    "points": 100,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-145",
    "number": 145,
    "title": "Smallest number with at least n trailing zeroes in factorial",
    "slug": "smallest-number-with-at-least-n-trailing-zeroes-in-factorial",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "NPCI"
    ],
    "acceptanceRate": "38.79%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-146",
    "number": 146,
    "title": "Sort a linked list of 0s, 1s and 2s",
    "slug": "sort-a-linked-list-of-0s-1s-and-2s",
    "difficulty": "Medium",
    "category": "Linked List",
    "companies": [
      "Amazon",
      "MakeMyTrip",
      "Microsoft"
    ],
    "acceptanceRate": "60.75%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-147",
    "number": 147,
    "title": "Merge K Sorted Linked Lists",
    "slug": "merge-k-sorted-linked-lists",
    "difficulty": "Medium",
    "category": "Divide & Conquer",
    "companies": [
      "Amazon",
      "Microsoft",
      "NPCI"
    ],
    "acceptanceRate": "57.01%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-148",
    "number": 148,
    "title": "Maximum Trains for Which Stoppage Can Be Provided",
    "slug": "maximum-trains-for-which-stoppage-can-be-provided",
    "difficulty": "Medium",
    "category": "Array / String",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "35.64%",
    "frequency": 80,
    "points": 200,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-149",
    "number": 149,
    "title": "K Centers Problem",
    "slug": "k-centers-problem",
    "difficulty": "Hard",
    "category": "Backtracking",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "59.98%",
    "frequency": 80,
    "points": 300,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  },
  {
    "id": "t150-150",
    "number": 150,
    "title": "Remove Invalid Parentheses",
    "slug": "remove-invalid-parentheses",
    "difficulty": "Hard",
    "category": "Backtracking",
    "companies": [
      "Amazon"
    ],
    "acceptanceRate": "43.53%",
    "frequency": 80,
    "points": 300,
    "hints": [
      "Analyze constraints and look for edge cases."
    ]
  }
];

class Top150Service {
  private problems: Top150Problem[] = [];
  private solvedIds: Set<string> = new Set();
  private favoriteIds: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const cachedProbs = localStorage.getItem(STORAGE_KEY_PROBLEMS);
      if (cachedProbs) {
        const parsed = JSON.parse(cachedProbs);
        if (Array.isArray(parsed) && parsed.length === 150) {
          this.problems = parsed;
        } else {
          this.problems = [...DEFAULT_TOP_150_PROBLEMS];
          this.saveProblems();
        }
      } else {
        this.problems = [...DEFAULT_TOP_150_PROBLEMS];
        this.saveProblems();
      }

      const cachedSolved = localStorage.getItem(STORAGE_KEY_SOLVED);
      if (cachedSolved) {
        this.solvedIds = new Set(JSON.parse(cachedSolved));
      }

      const cachedFavs = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (cachedFavs) {
        this.favoriteIds = new Set(JSON.parse(cachedFavs));
      }
    } catch (e) {
      console.error('Failed to load Top 150 state', e);
      this.problems = [...DEFAULT_TOP_150_PROBLEMS];
    }
  }

  private saveProblems() {
    try {
      localStorage.setItem(STORAGE_KEY_PROBLEMS, JSON.stringify(this.problems));
    } catch (e) {
      console.error('Failed to save problems', e);
    }
    this.notify();
  }

  private saveSolved() {
    try {
      localStorage.setItem(STORAGE_KEY_SOLVED, JSON.stringify(Array.from(this.solvedIds)));
    } catch (e) {
      console.error('Failed to save solved IDs', e);
    }
    this.notify();
  }

  private saveFavorites() {
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(Array.from(this.favoriteIds)));
    } catch (e) {
      console.error('Failed to save favorite IDs', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Get all problems
  public getProblems(): Top150Problem[] {
    return [...this.problems];
  }

  // Get solved problem IDs
  public getSolvedIds(): Set<string> {
    return new Set(this.solvedIds);
  }

  // Get favorite problem IDs
  public getFavoriteIds(): Set<string> {
    return new Set(this.favoriteIds);
  }

  // Toggle solved status
  public toggleSolved(problemId: string): boolean {
    if (this.solvedIds.has(problemId)) {
      this.solvedIds.delete(problemId);
    } else {
      this.solvedIds.add(problemId);
    }
    this.saveSolved();
    return this.solvedIds.has(problemId);
  }

  // Mark solved (from test case submission)
  public markSolvedBySlug(slug: string): boolean {
    const p = this.problems.find((item) => item.slug.toLowerCase() === slug.toLowerCase());
    if (p) {
      this.solvedIds.add(p.id);
      this.saveSolved();
      return true;
    }
    return false;
  }

  // Toggle favorite
  public toggleFavorite(problemId: string): boolean {
    if (this.favoriteIds.has(problemId)) {
      this.favoriteIds.delete(problemId);
    } else {
      this.favoriteIds.add(problemId);
    }
    this.saveFavorites();
    return this.favoriteIds.has(problemId);
  }

  // Calculate statistics
  public getStats() {
    const total = this.problems.length;
    const solved = this.solvedIds.size;
    const easyTotal = this.problems.filter((p) => p.difficulty === 'Easy').length;
    const easySolved = this.problems.filter((p) => p.difficulty === 'Easy' && this.solvedIds.has(p.id)).length;
    const mediumTotal = this.problems.filter((p) => p.difficulty === 'Medium').length;
    const mediumSolved = this.problems.filter((p) => p.difficulty === 'Medium' && this.solvedIds.has(p.id)).length;
    const hardTotal = this.problems.filter((p) => p.difficulty === 'Hard').length;
    const hardSolved = this.problems.filter((p) => p.difficulty === 'Hard' && this.solvedIds.has(p.id)).length;

    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

    return {
      total,
      solved,
      percentage,
      easy: { solved: easySolved, total: easyTotal },
      medium: { solved: mediumSolved, total: mediumTotal },
      hard: { solved: hardSolved, total: hardTotal },
    };
  }

  // ADMIN CONTROLS: Add Problem
  public addProblem(problem: Omit<Top150Problem, 'id' | 'number'>): Top150Problem {
    const nextNumber = this.problems.length + 1;
    const newProblem: Top150Problem = {
      ...problem,
      id: `t150-custom-${Date.now()}`,
      number: nextNumber,
      isCustom: true,
    };
    this.problems.push(newProblem);
    this.saveProblems();
    return newProblem;
  }

  // ADMIN CONTROLS: Update Problem
  public updateProblem(id: string, updates: Partial<Top150Problem>): boolean {
    const index = this.problems.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.problems[index] = { ...this.problems[index], ...updates };
      this.saveProblems();
      return true;
    }
    return false;
  }

  // ADMIN CONTROLS: Delete Problem
  public deleteProblem(id: string): boolean {
    const initialLen = this.problems.length;
    this.problems = this.problems.filter((p) => p.id !== id);
    if (this.problems.length !== initialLen) {
      this.problems = this.problems.map((p, idx) => ({ ...p, number: idx + 1 }));
      this.solvedIds.delete(id);
      this.favoriteIds.delete(id);
      this.saveProblems();
      this.saveSolved();
      this.saveFavorites();
      return true;
    }
    return false;
  }

  // Check if problem is in Top 150
  public isProblemInTop150(slugOrTitle: string): boolean {
    const query = slugOrTitle.toLowerCase().trim();
    return this.problems.some(
      (p) =>
        p.slug.toLowerCase() === query ||
        p.title.toLowerCase() === query ||
        p.id.toLowerCase() === query
    );
  }

  // Get problem by slug
  public getProblemBySlug(slug: string): Top150Problem | undefined {
    const s = slug.toLowerCase().trim();
    return this.problems.find((p) => p.slug.toLowerCase() === s);
  }

  // Remove from Top 150 by slug or title
  public removeFromTop150BySlug(slugOrTitle: string): boolean {
    const query = slugOrTitle.toLowerCase().trim();
    const target = this.problems.find(
      (p) =>
        p.slug.toLowerCase() === query ||
        p.title.toLowerCase() === query ||
        p.id.toLowerCase() === query
    );
    if (target) {
      return this.deleteProblem(target.id);
    }
    return false;
  }

  // Toggle problem membership in Top 150
  public toggleTop150(problem: {
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category?: string;
    companies?: string[];
    points?: number;
  }): boolean {
    if (this.isProblemInTop150(problem.slug) || this.isProblemInTop150(problem.title)) {
      this.removeFromTop150BySlug(problem.slug);
      return false; // removed
    } else {
      this.addProblem({
        title: problem.title,
        slug: problem.slug.toLowerCase().replace(/\s+/g, '-'),
        difficulty: problem.difficulty,
        category: problem.category || 'Array / String',
        companies: problem.companies || ['Google', 'Amazon', 'Meta', 'Microsoft'],
        acceptanceRate: '52.0%',
        frequency: 85,
        points: problem.points || (problem.difficulty === 'Hard' ? 300 : problem.difficulty === 'Medium' ? 200 : 100),
      });
      return true; // added
    }
  }

  // ADMIN CONTROLS: Reset to default curated problems
  public resetToDefault() {
    this.problems = [...DEFAULT_TOP_150_PROBLEMS];
    this.saveProblems();
  }
}

export const top150Service = new Top150Service();
