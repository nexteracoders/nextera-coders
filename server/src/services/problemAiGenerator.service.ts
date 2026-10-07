import { GoogleGenAI } from '@google/genai';
import { ProblemDifficulty } from '../models/problem.model';

export interface IGeneratedProblem {
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  category: string;
  companies: string[];
  description: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  hints: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
    hidden: boolean;
  }>;
  expectedComplexity: {
    time: string;
    space: string;
  };
  starterCode: {
    javascript: string;
    typescript: string;
    python: string;
    java: string;
    cpp: string;
    c: string;
    csharp: string;
  };
  solution?: string;
  supportedLanguages: string[];
  isPublished: boolean;
}

export interface IGenerateProblemParams {
  titleOrUrl: string;
  difficulty?: ProblemDifficulty;
  category?: string;
}

// Convert slug to clean Title Case
function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Convert title to URL slug
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse Topic Name or Problem Title input
export function parseProblemInput(input: string): { title: string; slug: string } {
  let cleaned = input.trim();

  // If someone passed a slug like "find-pair-with-given-sum"
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/i.test(cleaned)) {
    const slug = cleaned.toLowerCase();
    return {
      slug,
      title: slugToTitle(slug),
    };
  }

  // Treat as original human title or topic name
  const slug = titleToSlug(cleaned);
  return {
    title: cleaned,
    slug,
  };
}

// Convert slug or title to camelCase function name
function toCamelCase(str: string): string {
  return str
    .replace(/[-_ ]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toLowerCase());
}

export class ProblemAiGeneratorService {
  private aiClient: GoogleGenAI | null = null;
  private apiKey: string | null = null;
  private modelName: string = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash';

  constructor() {
    this.initClient();
  }

  private initClient() {
    const key = process.env.GEMINI_API_KEY?.trim();
    this.modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash';
    if (key && key !== '') {
      this.apiKey = key;
      this.aiClient = new GoogleGenAI({ apiKey: key });
    } else {
      this.aiClient = null;
      this.apiKey = null;
    }
  }

  private isGeminiAvailable(): boolean {
    if (!this.aiClient) {
      this.initClient();
    }
    return Boolean(this.aiClient && this.apiKey);
  }

  /**
   * Main entry point: Generate a complete coding problem from Topic Name or Problem Title
   */
  public async generateProblem(params: IGenerateProblemParams): Promise<IGeneratedProblem> {
    const { title, slug } = parseProblemInput(params.titleOrUrl);

    if (this.isGeminiAvailable() && this.aiClient) {
      try {
        const generated = await this.generateWithGemini(title, slug, params.difficulty, params.category);
        if (generated) {
          return generated;
        }
      } catch (err: any) {
        console.warn('[ProblemAiGenerator] Gemini generation failed, falling back to smart heuristic generator:', err.message);
      }
    }

    // Fallback: Smart heuristic algorithmic synthesis
    return this.generateHeuristicFallback(title, slug, params.difficulty, params.category);
  }

  /**
   * Call Gemini 2.5 Flash to generate structured problem JSON
   */
  private async generateWithGemini(
    title: string,
    slug: string,
    preferredDifficulty?: ProblemDifficulty,
    preferredCategory?: string
  ): Promise<IGeneratedProblem | null> {
    if (!this.aiClient) return null;

    const systemPrompt = `You are the Lead DSA Problem Creator and Curriculum Architect for NextEra Coders.
Your job is to design a 100% original, rigorous, production-ready coding challenge based strictly on the provided DSA topic name or problem title.

Output MUST BE ONLY valid JSON matching this exact structure without markdown backticks or commentary:
{
  "title": "${title}",
  "slug": "${slug}",
  "difficulty": "Easy" | "Medium" | "Hard",
  "category": "Arrays" | "Strings" | "Linked List" | "Trees" | "Graphs" | "Dynamic Programming" | "Two Pointers" | "Stack" | "Binary Search" | "Heap" | "Greedy" | "Backtracking" | "Math",
  "companies": ["Google", "Amazon", "Microsoft", "Meta"],
  "description": "Comprehensive markdown problem description. Include clear explanation, problem statement, input/output specifications.",
  "constraints": ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      "input": "nums = [3,2,4], target = 6",
      "output": "[1,2]",
      "explanation": "nums[1] + nums[2] == 6."
    }
  ],
  "hints": [
    "A brute force approach would search all pairs...",
    "Can you use a hash map to store complements in O(n) time?",
    "Check if target - current element already exists in the dictionary."
  ],
  "testCases": [
    { "input": "[2,7,11,15]\\n9", "expectedOutput": "[0,1]", "hidden": false },
    { "input": "[3,2,4]\\n6", "expectedOutput": "[1,2]", "hidden": false },
    { "input": "[3,3]\\n6", "expectedOutput": "[0,1]", "hidden": true },
    { "input": "[-1,-2,-3,-4,-5]\\n-8", "expectedOutput": "[2,4]", "hidden": true },
    { "input": "[1000000000,2000000000]\\n3000000000", "expectedOutput": "[0,1]", "hidden": true }
  ],
  "expectedComplexity": {
    "time": "O(n)",
    "space": "O(n)"
  },
  "starterCode": {
    "javascript": "/**\\n * @param {number[]} nums\\n * @param {number} target\\n * @return {number[]}\\n */\\nfunction twoSum(nums, target) {\\n    // Write your code here\\n}",
    "typescript": "function twoSum(nums: number[], target: number): number[] {\\n    // Write your code here\\n    return [];\\n}",
    "python": "class Solution:\\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\\n        # Write your code here\\n        pass",
    "java": "class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        // Write your code here\\n        return new int[]{};\\n    }\\n}",
    "cpp": "class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        // Write your code here\\n        return {};\\n    }\\n};",
    "c": "/**\\n * Note: The returned array must be malloced, assume caller calls free().\\n */\\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\\n    // Write your code here\\n    *returnSize = 0;\\n    return NULL;\\n}",
    "csharp": "public class Solution {\\n    public int[] TwoSum(int[] nums, int target) {\\n        // Write your code here\\n        return new int[0];\\n    }\\n}"
  },
  "solution": "// Clean reference solution code",
  "supportedLanguages": ["javascript", "typescript", "python", "java", "cpp", "c", "csharp"],
  "isPublished": true
}`;

    const userPrompt = `Create a DSA problem for: "${title}".
Target Slug: "${slug}".
${preferredDifficulty ? `Preferred Difficulty: ${preferredDifficulty}.` : ''}
${preferredCategory ? `Preferred Category: ${preferredCategory}.` : ''}

CRITICAL REQUIREMENTS:
1. Include at least 2 public test cases and at least 4 hidden edge test cases (e.g. empty/single item, negative numbers, extreme constraints, duplicates).
2. The starterCode must have valid function signatures across all 7 languages (JS, TS, Python, Java, C++, C, C#).
3. Output MUST BE strictly pure JSON with no markdown wrapping.`;

    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    if (!text) return null;

    // Clean any accidental markdown quotes
    const cleanedJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      title: parsed.title || title,
      slug: parsed.slug || slug,
      difficulty: (['Easy', 'Medium', 'Hard'].includes(parsed.difficulty) ? parsed.difficulty : preferredDifficulty || 'Medium') as ProblemDifficulty,
      category: parsed.category || preferredCategory || 'Algorithms',
      companies: Array.isArray(parsed.companies) && parsed.companies.length ? parsed.companies : ['Google', 'Amazon', 'Microsoft', 'TCS'],
      description: parsed.description || `Given the problem requirements, implement an optimal solution for ${title}.`,
      constraints: Array.isArray(parsed.constraints) && parsed.constraints.length ? parsed.constraints : ['1 <= n <= 10^5'],
      examples: Array.isArray(parsed.examples) && parsed.examples.length ? parsed.examples : [
        { input: 'Sample Input', output: 'Sample Output', explanation: 'Initial example case' },
      ],
      hints: Array.isArray(parsed.hints) && parsed.hints.length ? parsed.hints : [
        'Consider the time and space complexity trade-offs.',
        'Can a hash map or two-pointer technique help?',
      ],
      testCases: Array.isArray(parsed.testCases) && parsed.testCases.length ? parsed.testCases : [
        { input: '1', expectedOutput: '1', hidden: false },
        { input: '2', expectedOutput: '2', hidden: false },
        { input: '100', expectedOutput: '100', hidden: true },
      ],
      expectedComplexity: {
        time: parsed.expectedComplexity?.time || 'O(n)',
        space: parsed.expectedComplexity?.space || 'O(1)',
      },
      starterCode: {
        javascript: parsed.starterCode?.javascript || '',
        typescript: parsed.starterCode?.typescript || '',
        python: parsed.starterCode?.python || '',
        java: parsed.starterCode?.java || '',
        cpp: parsed.starterCode?.cpp || '',
        c: parsed.starterCode?.c || '',
        csharp: parsed.starterCode?.csharp || '',
      },
      solution: parsed.solution || '',
      supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp'],
      isPublished: true,
    };
  }

  /**
   * Smart Algorithmic Fallback Generator (Runs instantly if Gemini is offline / key missing)
   */
  public generateHeuristicFallback(
    title: string,
    slug: string,
    difficulty: ProblemDifficulty = 'Medium',
    category: string = 'Algorithms'
  ): IGeneratedProblem {
    const fnName = toCamelCase(slug || title);
    const capitalizedFn = fnName.charAt(0).toUpperCase() + fnName.slice(1);

    // Common category detection from title
    const lower = title.toLowerCase();
    let detectedCategory = category;
    let detectedDifficulty = difficulty;

    if (lower.includes('tree') || lower.includes('bst')) detectedCategory = 'Trees';
    else if (lower.includes('graph') || lower.includes('island') || lower.includes('path')) detectedCategory = 'Graphs';
    else if (lower.includes('string') || lower.includes('anagram') || lower.includes('palindrome')) detectedCategory = 'Strings';
    else if (lower.includes('list') || lower.includes('linked')) detectedCategory = 'Linked List';
    else if (lower.includes('sum') || lower.includes('array') || lower.includes('subarray')) detectedCategory = 'Arrays';
    else if (lower.includes('dp') || lower.includes('climb') || lower.includes('profit') || lower.includes('coin')) detectedCategory = 'Dynamic Programming';
    else if (lower.includes('search') || lower.includes('binary')) detectedCategory = 'Binary Search';

    if (lower.includes('hard') || lower.includes('median') || lower.includes('trapping') || lower.includes('shortest path')) {
      detectedDifficulty = 'Hard';
    } else if (lower.includes('two sum') || lower.includes('climbing') || lower.includes('reverse') || lower.includes('palindrome') || lower.includes('anagram')) {
      detectedDifficulty = 'Easy';
    }

    return {
      title,
      slug,
      difficulty: detectedDifficulty,
      category: detectedCategory,
      companies: ['Amazon', 'Google', 'Microsoft', 'TCS', 'Adobe'],
      description: `### Problem Description
Given the input specifications for **${title}**, write an optimal algorithm to solve the problem efficiently.

Ensure that your implementation handles edge cases such as empty inputs, boundary values, and performance constraints.

### Input Format
- Standard input array or values according to the function parameters.

### Output Format
- Return the expected result value or data structure.`,
      constraints: [
        '1 <= n <= 10^5',
        '-10^9 <= value <= 10^9',
        'All input elements fit within standard 32-bit or 64-bit integer ranges.',
      ],
      examples: [
        {
          input: 'input = [1, 2, 3, 4, 5]',
          output: 'result = [1, 2, 3, 4, 5]',
          explanation: `Demonstration of ${title} with standard positive integers.`,
        },
        {
          input: 'input = [2, 4, 6]',
          output: 'result = [2, 4, 6]',
          explanation: 'Even inputs boundary check.',
        },
      ],
      hints: [
        'Understand the base case and the fundamental constraints first.',
        `Identify whether an in-place transformation or auxiliary data structure (like a HashMap or Two Pointers) is optimal for ${detectedCategory}.`,
        'Keep time complexity within acceptable execution limits (typically O(n) or O(n log n)).',
      ],
      testCases: [
        { input: '[1, 2, 3, 4, 5]', expectedOutput: '[1, 2, 3, 4, 5]', hidden: false },
        { input: '[2, 4, 6]', expectedOutput: '[2, 4, 6]', hidden: false },
        { input: '[]', expectedOutput: '[]', hidden: true },
        { input: '[0]', expectedOutput: '[0]', hidden: true },
        { input: '[-10, -5, 0, 5, 10]', expectedOutput: '[-10, -5, 0, 5, 10]', hidden: true },
        { input: '[1000000, 2000000]', expectedOutput: '[1000000, 2000000]', hidden: true },
      ],
      expectedComplexity: {
        time: detectedCategory === 'Binary Search' ? 'O(log n)' : detectedDifficulty === 'Hard' ? 'O(n log n)' : 'O(n)',
        space: 'O(1)',
      },
      starterCode: {
        javascript: `/**\n * @param {any} input\n * @return {any}\n */\nfunction ${fnName}(input) {\n    // Write your code here\n    \n}`,
        typescript: `function ${fnName}(input: any): any {\n    // Write your code here\n    \n}`,
        python: `class Solution:\n    def ${fnName}(self, input: any) -> any:\n        # Write your code here\n        pass`,
        java: `class Solution {\n    public Object ${fnName}(Object input) {\n        // Write your code here\n        return null;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    void ${fnName}() {\n        // Write your code here\n    }\n};`,
        c: `// User function Template for C\n\nvoid ${fnName}() {\n    // Write your code here\n}`,
        csharp: `public class Solution {\n    public void ${capitalizedFn}() {\n        // Write your code here\n    }\n}`,
      },
      solution: `// Solution approach for ${title}\n// Time Complexity: O(n)\n// Space Complexity: O(1)`,
      supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp'],
      isPublished: true,
    };
  }
}

export const problemAiGeneratorService = new ProblemAiGeneratorService();
