// LeetCode & GeeksForGeeks Clean Starter Code Generator & Formatter for All DSA Problems & Languages

export interface ProblemBasicInfo {
  id?: string;
  title?: string;
  slug?: string;
  starterCode?: Record<string, any> | any;
  difficulty?: string;
  category?: string;
}

// Convert slug or title to camelCase function name (e.g. 'two-sum' -> 'twoSum', 'pair-and-sum' -> 'pairAndSum')
export function getFunctionNameFromSlug(slug: string = '', title: string = ''): string {
  const customMap: Record<string, string> = {
    'two-sum': 'twoSum',
    'pair-and-sum': 'pairAndSum',
    'valid-parentheses': 'isValid',
    'reverse-linked-list': 'reverseList',
    'merge-two-sorted-lists': 'mergeTwoLists',
    'maximum-subarray': 'maxSubArray',
    'kadanes-algorithm': 'maxSubArray',
    'best-time-to-buy-and-sell-stock': 'maxProfit',
    'binary-search': 'search',
    'container-with-most-water': 'maxArea',
    'trapping-rain-water': 'trap',
    'climbing-stairs': 'climbStairs',
    'coin-change': 'coinChange',
    'longest-substring-without-repeating-characters': 'lengthOfLongestSubstring',
    'longest-palindromic-substring': 'longestPalindrome',
    'median-of-two-sorted-arrays': 'findMedianSortedArrays',
    'maximum-profit-in-job-scheduling': 'jobScheduling',
    'sunday-shortest-path-obstacle-elimination': 'shortestPath',
    'shortest-path-with-obstacle-elimination-in-grid': 'shortestPath',
    'sunday-max-profit-job-scheduling': 'jobScheduling',
    'word-break': 'wordBreak',
    'number-of-islands': 'numIslands',
    'course-schedule': 'canFinish',
    'course-schedule-ii': 'findOrder',
    'lru-cache': 'LRUCache',
    'invert-binary-tree': 'invertTree',
    'same-tree': 'isSameTree',
    'symmetric-tree': 'isSymmetric',
    'maximum-depth-of-binary-tree': 'maxDepth',
    'lowest-common-ancestor-of-a-binary-tree': 'lowestCommonAncestor',
    'validate-binary-search-tree': 'isValidBST',
    'word-ladder': 'ladderLength',
    'implement-trie-prefix-tree': 'Trie',
    'letter-combinations-of-a-phone-number': 'letterCombinations',
    'permutations': 'permute',
    'subsets': 'subsets',
    'combination-sum': 'combinationSum',
    'edit-distance': 'minDistance',
    'rotate-image': 'rotate',
    'spiral-matrix': 'spiralOrder',
    'set-matrix-zeroes': 'setZeroes',
    'group-anagrams': 'groupAnagrams',
    'valid-anagram': 'isAnagram',
    'longest-consecutive-sequence': 'longestConsecutive',
    'merge-intervals': 'merge',
    'insert-interval': 'insert',
    'min-stack': 'MinStack',
    'evaluate-reverse-polish-notation': 'evalRPN',
    'basic-calculator': 'calculate',
    'linked-list-cycle': 'hasCycle',
    'add-two-numbers': 'addTwoNumbers',
    'copy-list-with-random-pointer': 'copyRandomList',
    'reverse-nodes-in-k-group': 'reverseKGroup',
    'remove-nth-node-from-end-of-list': 'removeNthFromEnd',
    'snakes-and-ladders': 'snakesAndLadders',
    'single-number': 'singleNumber',
    'palindrome-number': 'isPalindrome',
    'sqrtx': 'mySqrt',
    'powx-n': 'myPow',
    'majority-element': 'majorityElement',
    'move-zeroes': 'moveZeroes',
    'product-of-array-except-self': 'productExceptSelf',
    'find-minimum-in-rotated-sorted-array': 'findMin',
    'search-in-rotated-sorted-array': 'search',
    'house-robber': 'rob',
    'house-robber-ii': 'rob',
    'decode-ways': 'numDecodings',
    'unique-paths': 'uniquePaths',
    'longest-common-subsequence': 'longestCommonSubsequence',
    'pacific-atlantic-water-flow': 'pacificAtlantic',
  };

  const key = slug.toLowerCase().replace(/^sunday-/, '').replace(/^prob-sunday-\d+-/, '');
  if (customMap[key]) return customMap[key];
  if (customMap[slug]) return customMap[slug];

  const source = title || slug.replace(/^sunday-/, '').replace(/^prob-sunday-\d+-/, '');
  return source
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase()) || 'solve';
}

// Function signature descriptors for standard problems
interface SignatureMeta {
  javaRet: string;
  javaParams: string;
  cppRet: string;
  cppParams: string;
  pyParams: string;
  pyRet: string;
  jsParams: string;
  tsParams: string;
  tsRet: string;
  cRet?: string;
  cParams?: string;
  goParams?: string;
  goRet?: string;
}

function getProblemSignature(fnName: string): SignatureMeta {
  switch (fnName) {
    case 'pairAndSum':
      return {
        javaRet: 'long',
        javaParams: 'int[] arr',
        cppRet: 'long long',
        cppParams: 'vector<int>& arr',
        pyParams: 'self, arr: List[int]',
        pyRet: 'int',
        jsParams: 'arr',
        tsParams: 'arr: number[]',
        tsRet: 'number',
        cRet: 'long long',
        cParams: 'int* arr, int n',
        goParams: 'arr []int',
        goRet: 'int64',
      };
    case 'twoSum':
      return {
        javaRet: 'int[]',
        javaParams: 'int[] nums, int target',
        cppRet: 'vector<int>',
        cppParams: 'vector<int>& nums, int target',
        pyParams: 'self, nums: List[int], target: int',
        pyRet: 'List[int]',
        jsParams: 'nums, target',
        tsParams: 'nums: number[], target: number',
        tsRet: 'number[]',
        cRet: 'int*',
        cParams: 'int* nums, int numsSize, int target, int* returnSize',
        goParams: 'nums []int, target int',
        goRet: '[]int',
      };
    case 'maxProfit':
    case 'maxArea':
    case 'trap':
    case 'climbStairs':
    case 'coinChange':
    case 'maxSubArray':
    case 'numIslands':
    case 'ladderLength':
    case 'lengthOfLongestSubstring':
    case 'singleNumber':
    case 'mySqrt':
    case 'majorityElement':
    case 'rob':
    case 'numDecodings':
    case 'uniquePaths':
    case 'longestCommonSubsequence':
    case 'findMin':
      return {
        javaRet: 'int',
        javaParams: 'int[] arr',
        cppRet: 'int',
        cppParams: 'vector<int>& arr',
        pyParams: 'self, arr: List[int]',
        pyRet: 'int',
        jsParams: 'arr',
        tsParams: 'arr: number[]',
        tsRet: 'number',
        cRet: 'int',
        cParams: 'int* arr, int n',
        goParams: 'arr []int',
        goRet: 'int',
      };
    case 'search':
      return {
        javaRet: 'int',
        javaParams: 'int[] nums, int target',
        cppRet: 'int',
        cppParams: 'vector<int>& nums, int target',
        pyParams: 'self, nums: List[int], target: int',
        pyRet: 'int',
        jsParams: 'nums, target',
        tsParams: 'nums: number[], target: number',
        tsRet: 'number',
        cRet: 'int',
        cParams: 'int* nums, int numsSize, int target',
        goParams: 'nums []int, target int',
        goRet: 'int',
      };
    case 'jobScheduling':
      return {
        javaRet: 'int',
        javaParams: 'int[] startTime, int[] endTime, int[] profit',
        cppRet: 'int',
        cppParams: 'vector<int>& startTime, vector<int>& endTime, vector<int>& profit',
        pyParams: 'self, startTime: List[int], endTime: List[int], profit: List[int]',
        pyRet: 'int',
        jsParams: 'startTime, endTime, profit',
        tsParams: 'startTime: number[], endTime: number[], profit: number[]',
        tsRet: 'number',
        cRet: 'int',
        cParams: 'int* startTime, int* endTime, int* profit, int n',
        goParams: 'startTime []int, endTime []int, profit []int',
        goRet: 'int',
      };
    case 'shortestPath':
      return {
        javaRet: 'int',
        javaParams: 'int[][] grid, int k',
        cppRet: 'int',
        cppParams: 'vector<vector<int>>& grid, int k',
        pyParams: 'self, grid: List[List[int]], k: int',
        pyRet: 'int',
        jsParams: 'grid, k',
        tsParams: 'grid: number[][], k: number',
        tsRet: 'number',
        cRet: 'int',
        cParams: 'int** grid, int gridSize, int* gridColSize, int k',
        goParams: 'grid [][]int, k int',
        goRet: 'int',
      };
    case 'isValid':
    case 'isPalindrome':
    case 'isSameTree':
    case 'isSymmetric':
    case 'isValidBST':
    case 'hasCycle':
    case 'wordBreak':
    case 'isAnagram':
    case 'canFinish':
      return {
        javaRet: 'boolean',
        javaParams: 'String s',
        cppRet: 'bool',
        cppParams: 'string s',
        pyParams: 'self, s: str',
        pyRet: 'bool',
        jsParams: 's',
        tsParams: 's: string',
        tsRet: 'boolean',
        cRet: 'bool',
        cParams: 'char* s',
        goParams: 's string',
        goRet: 'bool',
      };
    case 'longestPalindrome':
      return {
        javaRet: 'String',
        javaParams: 'String s',
        cppRet: 'string',
        cppParams: 'string s',
        pyParams: 'self, s: str',
        pyRet: 'str',
        jsParams: 's',
        tsParams: 's: string',
        tsRet: 'string',
        cRet: 'char*',
        cParams: 'char* s',
        goParams: 's string',
        goRet: 'string',
      };
    case 'mergeTwoLists':
    case 'reverseList':
      return {
        javaRet: 'ListNode',
        javaParams: 'ListNode head',
        cppRet: 'ListNode*',
        cppParams: 'ListNode* head',
        pyParams: 'self, head: Optional[ListNode]',
        pyRet: 'Optional[ListNode]',
        jsParams: 'head',
        tsParams: 'head: ListNode | null',
        tsRet: 'ListNode | null',
        cRet: 'struct ListNode*',
        cParams: 'struct ListNode* head',
        goParams: 'head *ListNode',
        goRet: '*ListNode',
      };
    case 'productExceptSelf':
    case 'findOrder':
      return {
        javaRet: 'int[]',
        javaParams: 'int[] nums',
        cppRet: 'vector<int>',
        cppParams: 'vector<int>& nums',
        pyParams: 'self, nums: List[int]',
        pyRet: 'List[int]',
        jsParams: 'nums',
        tsParams: 'nums: number[]',
        tsRet: 'number[]',
        cRet: 'int*',
        cParams: 'int* nums, int numsSize, int* returnSize',
        goParams: 'nums []int',
        goRet: '[]int',
      };
    default:
      return {
        javaRet: 'int',
        javaParams: 'int[] arr',
        cppRet: 'int',
        cppParams: 'vector<int>& arr',
        pyParams: 'self, arr: List[int]',
        pyRet: 'int',
        jsParams: 'arr',
        tsParams: 'arr: number[]',
        tsRet: 'number',
        cRet: 'int',
        cParams: 'int* arr, int n',
        goParams: 'arr []int',
        goRet: 'int',
      };
  }
}

// Get clean formatted LeetCode/GFG style starter code for any problem & language
export function getCleanStarterCode(problem: ProblemBasicInfo | null, language: string): string {
  const lang = (language || 'javascript').toLowerCase();
  const slug = problem?.slug || 'two-sum';
  const title = problem?.title || '';
  const fnName = getFunctionNameFromSlug(slug, title);
  const sig = getProblemSignature(fnName);

  // 1. JAVA (LeetCode / GeeksForGeeks standard class Solution)
  if (lang === 'java') {
    return `class Solution {
    public ${sig.javaRet} ${fnName}(${sig.javaParams}) {
        // code here
        
    }
}`;
  }

  // 2. C++ / CPP
  if (lang === 'cpp' || lang === 'c++') {
    return `class Solution {
public:
    ${sig.cppRet} ${fnName}(${sig.cppParams}) {
        // code here
        
    }
};`;
  }

  // 3. PYTHON / PYTHON3
  if (lang === 'python' || lang === 'python3' || lang === 'py') {
    return `class Solution:
    def ${fnName}(${sig.pyParams}) -> ${sig.pyRet}:
        # code here
        pass`;
  }

  // 4. JAVASCRIPT
  if (lang === 'javascript' || lang === 'js' || lang === 'node') {
    return `/**
 * @param {any} ${sig.jsParams}
 * @return {any}
 */
class Solution {
    ${fnName}(${sig.jsParams}) {
        // code here
        
    }
}`;
  }

  // 5. TYPESCRIPT
  if (lang === 'typescript' || lang === 'ts') {
    return `class Solution {
    ${fnName}(${sig.tsParams}): ${sig.tsRet} {
        // code here
        return null as any;
    }
}`;
  }

  // 6. C LANGUAGE (GFG User function Template for C)
  if (lang === 'c') {
    return `// User function Template for C

${sig.cRet || 'int'} ${fnName}(${sig.cParams || 'int* arr, int n'}) {
    // code here
    
}`;
  }

  // 7. C#
  if (lang === 'csharp' || lang === 'c#' || lang === 'cs') {
    return `public class Solution {
    public ${sig.javaRet} ${fnName}(${sig.javaParams}) {
        // code here
        
    }
}`;
  }

  // 8. GO / GOLANG
  if (lang === 'go' || lang === 'golang') {
    return `func ${fnName}(${sig.goParams || 'arr []int'}) ${sig.goRet || 'int'} {
    // code here
    
}`;
  }

  // 9. RUST
  if (lang === 'rust' || lang === 'rs') {
    return `impl Solution {
    pub fn ${fnName}(${sig.tsParams.replace(/: number/g, ': i32')}) -> ${sig.tsRet === 'number' ? 'i32' : '()'} {
        // code here
        
    }
}`;
  }

  // 10. KOTLIN
  if (lang === 'kotlin' || lang === 'kt') {
    return `class Solution {
    fun ${fnName}(nums: IntArray, target: Int): IntArray {
        // code here
        return intArrayOf()
    }
}`;
  }

  // 11. PHP
  if (lang === 'php') {
    return `class Solution {
    function ${fnName}($nums, $target) {
        // code here
        return [];
    }
}`;
  }

  // 12. SWIFT
  if (lang === 'swift') {
    return `class Solution {
    func ${fnName}(_ nums: [Int], _ target: Int) -> [Int] {
        // code here
        return []
    }
}`;
  }

  // 13. RUBY
  if (lang === 'ruby' || lang === 'rb') {
    const rubyFnName = fnName.replace(/[A-Z]/g, (letter) => '_' + letter.toLowerCase());
    return `class Solution
    def ${rubyFnName}(nums, target)
        # code here
        []
    end
end`;
  }

  // 14. DART
  if (lang === 'dart') {
    return `class Solution {
  List<int> ${fnName}(List<int> nums, int target) {
    // code here
    return [];
  }
}`;
  }

  // Fallback default
  return `class Solution {
    // code here
}`;
}
