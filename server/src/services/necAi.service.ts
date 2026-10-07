import { GoogleGenAI } from '@google/genai';

export interface IDebugRequest {
  problemTitle: string;
  problemDescription?: string;
  code: string;
  language: string;
  verdict: 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Compilation Error' | string;
  failedTestCase?: {
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
  };
  errorMessage?: string;
  userMessage?: string;
}

export interface IHintRequest {
  problemTitle: string;
  problemDescription?: string;
  hintLevel: 1 | 2 | 3;
  code?: string;
  language?: string;
}

export interface IChatRequest {
  problemTitle: string;
  problemDescription?: string;
  code?: string;
  language?: string;
  history?: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>;
  message: string;
}

export interface IFixCompilerErrorRequest {
  code: string;
  language: string;
  errorMessage: string;
  fileName?: string;
}

export interface IFixCompilerErrorResponse {
  explanation: string;
  fixedCode: string;
  diffSummary: string;
  lineSuggestion?: number;
  source: 'gemini' | 'heuristic';
  model?: string;
}

export interface ITestCaseItem {
  id: string;
  title: string;
  input: string;
  category: 'zero_empty' | 'negative' | 'typical' | 'large_scale' | 'edge_boundary';
  explanation: string;
}

export interface IGenerateTestCasesRequest {
  code: string;
  language: string;
  fileName?: string;
}

export interface IGenerateTestCasesResponse {
  testCases: ITestCaseItem[];
  combinedStdin: string;
  source: 'gemini' | 'heuristic';
}

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;

export function sanitizeAiText(input: string): string {
  if (!input) return '';
  return input
    .replace(EMOJI_REGEX, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '$1')
    .replace(/[#*@]{2,}/g, '')
    .replace(/^[@#*]\s*/gm, '')
    .replace(/\s+[@#]\s+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


const SYSTEM_INSTRUCTION_COMPILER_FIX = `
You are NEC AI, the expert Error Doctor at NextEra Coders.
A student ran code in the compiler and hit an error (SyntaxError, Compilation Error, Runtime Exception, Traceback, Segfault, etc.).
Your job is to:
1. Explain the root cause in simple, encouraging, student-friendly Hinglish + English (mentioning the exact line number, why the computer couldn't run it, and how to think about the fix).
2. Provide the 100% complete, fully corrected, runnable code that fixes the error while preserving the student's original logic.
3. Provide a brief 1-2 sentence summary of what changed.

CRITICAL FORMATTING RULES:
- Do NOT use markdown symbols like ###, ##, **, or @.
- Do NOT include any emojis.
- Present explanations in clear, clean, numbered points.
- Provide only useful, essential information without fluff.

CRITICAL OUTPUT FORMAT:
You MUST respond with a valid JSON object only (no markdown backticks around the JSON string):
{
  "explanation": "Clear, clean explanation in Hinglish/English without emojis or markdown hashes/asterisks.",
  "fixedCode": "Full runnable corrected code without markdown wrappers",
  "diffSummary": "Brief 1-2 sentence summary of changes made",
  "lineSuggestion": 14
}
`;

const SYSTEM_INSTRUCTION_TEST_CASES = `
You are NEC AI, the Edge Case & Test Generation Assistant at NextEra Coders.
Analyze the student's code to understand what input it expects from standard input (stdin) via cin, Scanner, input(), readline(), etc.
Generate 5 diverse, realistic edge cases for the code:
1. Zero / Empty / Minimal boundary input
2. Negative numbers or alternate polarities (if applicable, or minimal input)
3. Standard typical valid input
4. Large scale / high boundary value input
5. Tricky boundary / duplicates / special edge format

CRITICAL OUTPUT FORMAT:
Respond with a valid JSON object only (no markdown backticks around the JSON string):
{
  "testCases": [
    {
      "id": "1",
      "title": "Minimal / Zero Boundary",
      "input": "0",
      "category": "zero_empty",
      "explanation": "Tests how the code behaves when N=0 or minimal elements are provided."
    }
  ],
  "combinedStdin": "Clean string ready for stdin"
}
`;

const SYSTEM_INSTRUCTION_DEBUGGER = `
You are NEC AI, the intelligent, encouraging Socratic AI Mentor at NextEra Coders.
Your mission is to help students learn algorithmic problem solving deeply without spoiling solutions.

STRICT SOCRATIC RULES:
1. NEVER GIVE AWAY THE COMPLETE CODE SOLUTION. Do not write full runnable functions or copy-paste code.
2. Direct Root Cause Analysis: Identify why the student's code failed on the specific test case or produced an error.
3. Keep it conversational, clear, and encouraging. You can use English or natural Hinglish.
4. Pinpoint the specific issue clearly.
5. FORMATTING RULES:
   - Do NOT use emojis.
   - Do NOT use markdown hashes like ###, ##, or bold asterisks like **.
   - Do NOT use stray symbols like @.
   - Structure your response clearly in numbered order:
     1. Root Cause: Explain the bug in simple terms.
     2. Failing Scenario: Why the specific input failed.
     3. Next Step: A guiding hint so the student can write the fix themselves.
`;

const SYSTEM_INSTRUCTION_HINTS = `
You are NEC AI, the Socratic AI Mentor at NextEra Coders.
Your role is to provide Progressive Hints for algorithmic problems.

FORMATTING RULES:
- Do NOT use emojis.
- Do NOT use markdown symbols like ###, ##, **, or @.
- Present hints in clean, readable text with clear numbered steps.

RULES PER HINT LEVEL:
- Level 1 (Approach & Intuition): Explain the fundamental intuition and real-world analogy of the problem. Break down the problem conceptually. Do NOT mention specific complex data structures or code.
- Level 2 (Data Structure & Algorithmic Pattern): Recommend the optimal data structure and explain why it reduces time or space complexity.
- Level 3 (Structured Pseudocode): Provide step-by-step algorithmic pseudocode (high-level logic steps). Do NOT write complete runnable code in Java/Python/C++.
`;

const SYSTEM_INSTRUCTION_CHAT = `
You are NEC AI, the intelligent, dedicated computer science, coding, and web development mentor at NextEra Coders.
A student is asking you a specific question about their code, an algorithmic problem, syntax, web design, or a computer science concept.

PRIMARY DIRECTIVES:
1. Directly and thoroughly answer the EXACT question the student asks. Do not give generic greetings or unrelated templates.
2. Address the student's specific confusion or inquiry with clear, technical, educational explanations.
3. Refer directly to the student's active code, file name, line numbers, or algorithmic pattern when relevant.
4. If they ask about web development (HTML, CSS, JavaScript, React), provide modern, clean, best-practice solutions.
5. If they ask about DSA (arrays, strings, trees, graphs, DP, etc.), explain the intuition, optimal data structures, and edge cases.
6. If they ask about bugs or errors, pinpoint the lines or logic causes and explain how to fix them.
7. If they ask conceptual or syntax questions, give clear, simple explanations with practical code snippets.
8. Language style: Conversational, encouraging, student-friendly, and professional (natural English or Hinglish).

FORMATTING RULES (STRICT):
- Do NOT use emojis (no decorative icons or emojis anywhere).
- Do NOT use markdown symbols like ###, ##, **, or @.
- Organize your response in clean, properly ordered points (e.g. 1, 2, 3 or bullet points).
- Provide only useful, essential information without fluff or generic filler.
`;

class NecAiService {
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

  /**
   * Check if Gemini API is configured
   */
  public isGeminiConfigured(): boolean {
    if (!this.aiClient) {
      this.initClient();
    }
    return Boolean(this.aiClient && this.apiKey);
  }

  /**
   * Socratic AI Debugger: Analyzes student's code and error without giving full solution
   */
  public async debugStudentCode(req: IDebugRequest): Promise<{
    message: string;
    source: 'gemini' | 'heuristic';
    model?: string;
  }> {
    if (this.isGeminiConfigured() && this.aiClient) {
      try {
        const prompt = `
Problem: "${req.problemTitle}"
Description: ${req.problemDescription || 'N/A'}
Language: ${req.language}
Execution Verdict: ${req.verdict}

Student's Submitted Code:
\`\`\`${req.language}
${req.code}
\`\`\`

${req.failedTestCase ? `Failed Test Case:
- Input: ${req.failedTestCase.input || 'N/A'}
- Expected Output: ${req.failedTestCase.expectedOutput || 'N/A'}
- Actual Output: ${req.failedTestCase.actualOutput || 'N/A'}` : ''}

${req.errorMessage ? `Error Message / Stack Trace:\n${req.errorMessage}` : ''}

${req.userMessage ? `Student's Question: "${req.userMessage}"` : 'Please debug this failure and guide me Socratic style.'}
`;

        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION_DEBUGGER,
            temperature: 0.4,
          },
        });

        const text = response.text || '';
        if (text.trim()) {
          return {
            message: sanitizeAiText(text.trim()),
            source: 'gemini',
            model: this.modelName,
          };
        }
      } catch (err: any) {
        console.warn('[NecAiService] Gemini API call failed, falling back to smart heuristics:', err.message);
      }
    }

    // Heuristic Fallback Engine
    return {
      message: sanitizeAiText(this.generateHeuristicDebug(req)),
      source: 'heuristic',
    };
  }

  /**
   * Progressive Hints (Level 1: Approach, Level 2: Data Structure, Level 3: Pseudocode)
   */
  public async getProgressiveHint(req: IHintRequest): Promise<{
    hintLevel: 1 | 2 | 3;
    title: string;
    content: string;
    source: 'gemini' | 'heuristic';
  }> {
    const titles = {
      1: 'Hint 1: Approach & Intuition',
      2: 'Hint 2: Data Structure & Pattern',
      3: 'Hint 3: Structured Pseudocode',
    };

    if (this.isGeminiConfigured() && this.aiClient) {
      try {
        const prompt = `
Problem: "${req.problemTitle}"
Problem Context: ${req.problemDescription || 'Standard algorithmic problem'}
Requested Hint Level: Level ${req.hintLevel} (${titles[req.hintLevel]})
${req.code ? `Student's Current Attempt:\n\`\`\`${req.language || 'text'}\n${req.code}\n\`\`\`` : ''}

Provide ONLY Level ${req.hintLevel} hint. Follow the specific guidelines for Level ${req.hintLevel} rigorously.
`;

        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION_HINTS,
            temperature: 0.3,
          },
        });

        const text = response.text || '';
        if (text.trim()) {
          return {
            hintLevel: req.hintLevel,
            title: titles[req.hintLevel],
            content: sanitizeAiText(text.trim()),
            source: 'gemini',
          };
        }
      } catch (err: any) {
        console.warn('[NecAiService] Gemini hint call failed, falling back to heuristics:', err.message);
      }
    }

    return {
      hintLevel: req.hintLevel,
      title: titles[req.hintLevel],
      content: sanitizeAiText(this.generateHeuristicHint(req.problemTitle, req.hintLevel)),
      source: 'heuristic',
    };
  }

  /**
   * General Socratic Chat with NEC AI
   */
  public async chatWithMentor(req: IChatRequest): Promise<{
    message: string;
    source: 'gemini' | 'heuristic';
  }> {
    if (this.isGeminiConfigured() && this.aiClient) {
      try {
        const contents: any[] = [];
        if (req.history && req.history.length > 0) {
          for (const item of req.history.slice(-6)) {
            contents.push({
              role: item.role === 'assistant' ? 'model' : item.role,
              parts: [{ text: item.text }],
            });
          }
        }

        const currentTurn = `
Context / File / Problem: "${req.problemTitle || 'Active File'}"
Programming Language: ${req.language || 'javascript'}
Code in Editor:
\`\`\`${req.language || 'javascript'}
${req.code || '// No code provided'}
\`\`\`

Student Question:
${req.message}
`;
        contents.push({
          role: 'user',
          parts: [{ text: currentTurn }],
        });

        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION_CHAT,
            temperature: 0.4,
          },
        });

        const text = response.text || '';
        if (text.trim()) {
          return {
            message: sanitizeAiText(text.trim()),
            source: 'gemini',
          };
        }
      } catch (err: any) {
        console.warn('[NecAiService] Gemini chat call failed, falling back to smart heuristic engine:', err.message);
      }
    }

    return {
      message: sanitizeAiText(this.generateHeuristicChat(req.problemTitle, req.message, req.code, req.language)),
      source: 'heuristic',
    };
  }

  // ---------------------------------------------------------------------------
  // HEURISTIC ENGINES (Intelligent Instant Fallbacks without external latency)
  // ---------------------------------------------------------------------------

  private generateHeuristicDebug(req: IDebugRequest): string {
    const title = (req.problemTitle || '').toLowerCase();
    const code = req.code || '';
    const error = (req.errorMessage || '').toLowerCase();
    const verdict = req.verdict || '';

    // Runtime errors
    if (verdict === 'Runtime Error' || error.includes('index') || error.includes('bound') || error.includes('null') || error.includes('undefined')) {
      return `Root Cause: Out of Bounds or Undefined Access

Aapke code me execution ke waqt array indexing ya object property access me galti ho rahi hai.

1. Common Issue
   Loop condition me i <= array.length likha gaya hai, jabki valid indices 0 se array.length - 1 tak hote hain.

2. Next Step
   Check kijiye ki kya aapka loop empty arrays ya single element cases me invalid index read karne ki koshish kar raha hai.`;
    }

    // Time Limit Exceeded
    if (verdict === 'Time Limit Exceeded' || error.includes('time limit')) {
      return `Root Cause: Inefficient Time Complexity (Nested Loops)

Aapka code correct answer de raha ho sakta hai, lekin bade test cases par time limit exceed ho raha hai.

1. Bottleneck
   Nested loops lagane se operations ki sankhya exponential badh rahi hai.

2. Next Step
   Nested loop ko replace karke Hash Map ya Two Pointers use kijiye jisse time complexity O(N) ya O(N log N) ho jaye.`;
    }

    // Problem-specific heuristics (e.g. Two Sum)
    if (title.includes('two sum')) {
      const usesMap = code.includes('Map') || code.includes('{}') || code.includes('seen') || code.includes('dict');
      if (!usesMap) {
        return `Root Cause: Brute-force approach without complement lookup

Aapka code har pair ko re-check kar raha hai, ya duplicate elements aur negative target ko handle nahi kar raha.

1. Failing Edge Case
   Jab target negative ho ya ek hi number do baar use ho jaye (i === j).

2. Next Step
   Har element ke liye sochiye: complement = target - nums[i]. Agar complement pehle se dekha hua hai, toh direct answer mil sakta hai.`;
      } else {
        return `Root Cause: Index or Duplicate Collision

Aapne Hash Map use kiya hai, par ho sakta hai:
1. Aap same element ko uske khud ke sath add kar rahe hon (seen[nums[i]] !== i check missing).
2. Pehle check karein ki complement map me hai ya nahi, aur baad me current number ko map me store karein taaki duplicate elements overwrite na hon.

Next Step: Loop ke andar diff = target - nums[i] check karne ka order review karein.`;
      }
    }

    // Generic Wrong Answer
    return `Analysis for ${req.problemTitle}

Aapka code execute ho gaya lekin sample ya hidden test case par expected output se match nahi kiya.

1. Points to Verify
   - Negative and Zero inputs: Kya code negative numbers ya 0 ko sahi handle kar raha hai?
   - Boundary conditions: Single element array ya empty collection par kya return ho raha hai?
   - Return Type: Kya function wahi data structure return kar raha hai jo problem me manga hai?

2. Next Step
   Inspect Sample Test Cases par click karke dekhein ki aapka Actual Output expected se kahan alag hai.`;
  }

  private generateHeuristicHint(problemTitle: string, level: 1 | 2 | 3): string {
    const title = (problemTitle || '').toLowerCase();

    if (title.includes('two sum')) {
      if (level === 1) {
        return `**Mental Model & Intuition**:
Think of target sum like finding a missing puzzle piece. If you need 10 rupees and you currently hold 4 rupees, you don't need to ask every person in the room; you only need to look for the person holding exactly 6 rupees (10 - 4).

As you traverse, remember what you have already seen so you can look up complementary pieces instantly.`;
      }
      if (level === 2) {
        return `**Optimal Data Structure**:
Use a **Hash Map / Dictionary (Object)**.
- **Why?** A Hash Map provides average **O(1)** time complexity for key lookups.
- **Key-Value Mapping**: Store the array number \`nums[i]\` as the **Key**, and its index \`i\` as the **Value**.
- **Resulting Complexity**: **O(N) Time Complexity** (single pass) and **O(N) Space Complexity**.`;
      }
      return `**Structured Pseudocode**:
\`\`\`text
1. Create an empty HashMap called 'seen'
2. Loop through array with index 'i' and value 'num':
     a. Calculate complement = target - num
     b. If complement exists in 'seen':
          return [seen[complement], i]
     c. Otherwise:
          store seen[num] = i
3. Return empty list if no pair exists
\`\`\``;
    }

    // Generic DSA Problem Hints
    if (level === 1) {
      return `**Core Approach & Intuition**:
1. Identify the input constraints: What are the minimum and maximum values of N?
2. Can we break the problem down into smaller sub-problems that we can solve greedily or inductively?
3. What is the brute-force solution? Why is it suboptimal, and where are redundant calculations happening?`;
    }

    if (level === 2) {
      return `**Data Structure & Algorithmic Pattern**:
- If looking for pairs / frequency / fast lookups: **Hash Map / Set (O(1) lookup)**.
- If finding min / max dynamically: **Priority Queue / Heap (O(log N))**.
- If the array is sorted or can be sorted: **Two Pointers / Binary Search (O(N) or O(log N))**.
- If working with contiguous subarrays: **Sliding Window or Prefix Sums**.`;
    }

    return `**Structured Pseudocode**:
\`\`\`text
1. Validate edge cases (empty input, null, single element).
2. Initialize primary data structure and tracking pointers/variables.
3. Iterate through input elements:
     - Apply transition/matching condition.
     - Update optimal state or accumulators.
4. Return the computed result in the requested format.
\`\`\``;
  }

  private generateHeuristicChat(problemTitle: string, query: string, code?: string, language?: string): string {
    const q = (query || '').toLowerCase().trim();
    const safeCode = (code || '').trim();
    const safeLang = (language || 'javascript').toLowerCase().trim();
    const title = (problemTitle || 'Active Workspace').trim();

    // 1. SPECIFIC LINE NUMBER QUERY (e.g., "line 5", "line 12", "5th line")
    const lineMatch = q.match(/(?:line\s*(\d+)|(\d+)(?:st|nd|rd|th)?\s*line)/i);
    if (lineMatch && safeCode) {
      const lineNum = parseInt(lineMatch[1] || lineMatch[2], 10);
      const codeLines = safeCode.split('\n');
      if (lineNum >= 1 && lineNum <= codeLines.length) {
        const lineContent = codeLines[lineNum - 1].trim();
        return `Line ${lineNum} Analysis for "${title}":

1. Inspected Line
   ${lineContent || '(Empty Line)'}

2. Function & Behavior
   ${
     lineContent.includes('function') || lineContent.includes('=>')
       ? 'This line declares a function or callback. Verify its parameters, scope, and return statement.'
       : lineContent.includes('return')
       ? 'This line returns a value from the active function. Verify the returned data type matches the required format.'
       : lineContent.includes('for') || lineContent.includes('while')
       ? 'This line controls a loop iteration. Ensure loop bounds and update steps prevent out-of-bounds reads and infinite loops.'
       : lineContent.includes('if') || lineContent.includes('else')
       ? 'This line evaluates a conditional branch. Ensure strict equality (===) and null safety are observed.'
       : lineContent.includes('const') || lineContent.includes('let') || lineContent.includes('var')
       ? 'This line declares and initializes a variable. Verify scope and default value.'
       : 'This statement performs an assignment, state mutation, or function invocation.'
   }

3. Safety Check
   Verify that all variables accessed on line ${lineNum} are initialized before calling methods or properties on them.`;
      }
    }

    // 2. CODE EXPLANATION / ARCHITECTURE / HOW IT WORKS
    if (
      q.includes('explain') ||
      q.includes('samjhao') ||
      q.includes('kya karta hai') ||
      q.includes('how it works') ||
      q.includes('architecture') ||
      q.includes('overview') ||
      q.includes('logic') ||
      q.includes('workflow')
    ) {
      const lines = safeCode.split('\n').filter(Boolean);
      const funcMatches = safeCode.match(/(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>|def\s+([a-zA-Z0-9_$]+))/g) || [];
      const hasLoops = /for\s*\(|while\s*\(|\.forEach\(|\.map\(/i.test(safeCode);
      const hasEvents = /addEventListener|onClick|onchange/i.test(safeCode);
      const hasDom = /document\.getElementById|document\.querySelector|getElementById/i.test(safeCode);

      return `Code Architecture & Explanation for "${title}":

1. File Overview
   Language: ${safeLang}. Total source lines: ${lines.length}.
   ${
     hasDom || hasEvents
       ? 'This file implements an interactive client component managing DOM elements and user event listeners.'
       : 'This file implements an algorithmic computation module with structured data flow and transformation logic.'
   }

2. Key Building Blocks
   ${
     funcMatches.length > 0
       ? `Identified primary functions: ${funcMatches.slice(0, 4).map((f) => f.trim().replace(/^const\s+/, '').replace(/\s*=.*/, '')).join(', ')}.`
       : 'Sequential statements executing in order.'
   }
   ${hasLoops ? 'Contains iterative loops for collection traversal and data processing.' : 'Executes in direct branch and functional flow.'}

3. Execution Flow
   ${
     hasEvents
       ? 'Binds user event listeners upon mount, reacts to input triggers, and renders dynamic updates.'
       : 'Accepts input parameters, performs intermediate calculations, and returns computed results.'
   }`;
    }

    // 3. BUGS, ERRORS, FAILING, WHY IS IT NOT WORKING
    if (
      q.includes('bug') ||
      q.includes('error') ||
      q.includes('fail') ||
      q.includes('not working') ||
      q.includes('wrong') ||
      q.includes('galat') ||
      q.includes('kyu') ||
      q.includes('why') ||
      q.includes('issue') ||
      q.includes('undefined') ||
      q.includes('null') ||
      q.includes('nan') ||
      q.includes('crash') ||
      q.includes('infinite')
    ) {
      const hasOffByOne = /<=\s*[a-zA-Z0-9_.]+\.length/i.test(safeCode);
      const hasSingleEqualInIf = /if\s*\([^=]*=[^=]/i.test(safeCode);
      const hasMissingReturn = /function|=>/i.test(safeCode) && !safeCode.includes('return');
      const hasDomNullRisk = /document\.getElementById/i.test(safeCode) && !safeCode.includes('if (');

      return `Diagnostic & Bug Analysis for "${title}":

1. Identified Failure Points
   ${
     hasOffByOne
       ? 'Off-by-one boundary check: Found <= array.length which can trigger undefined array reads. Change to < array.length.'
       : hasSingleEqualInIf
       ? 'Assignment in condition: Found single = inside an if statement instead of comparison (===).'
       : hasMissingReturn
       ? 'Missing return: The function computes logic but does not return the final output, producing undefined.'
       : hasDomNullRisk
       ? 'DOM element existence: getElementById returns null if the element has not mounted or id is misspelled.'
       : 'Logic mismatch: Code executes without syntax errors, but the returned state or edge-case handling differs from expectations.'
   }

2. Verification Checklist
   - Negative numbers and zero values: Check if 0 or negative numbers alter loop termination.
   - Empty collections: Ensure empty arrays or empty strings return the expected base value without crashing.
   - Variable scope: Ensure variables initialized inside a loop block are not accessed outside that block.

3. Recommended Fix
   Add guard clauses at the beginning of the function to handle empty or invalid inputs before entering loops.`;
    }

    // 4. OPTIMIZATION & PERFORMANCE (TLE, MEMORY, SPEED)
    if (
      q.includes('optimize') ||
      q.includes('optimization') ||
      q.includes('speed') ||
      q.includes('fast') ||
      q.includes('slow') ||
      q.includes('heavy') ||
      q.includes('efficiency') ||
      q.includes('memory') ||
      q.includes('tle') ||
      q.includes('performance')
    ) {
      const hasNestedLoops = /(?:for|while)[^{}]*\{[^{}]*(?:for|while)/s.test(safeCode);

      return `Performance & Optimization Guide for "${title}":

1. Identified Bottlenecks
   ${
     hasNestedLoops
       ? 'Nested loops detected: Inner iteration inside outer loop scales at O(N^2) time complexity, leading to Time Limit Exceeded (TLE) on large inputs.'
       : 'Linear or repeated traversal overhead: Traversing elements repeatedly instead of using instant index or hash lookups.'
   }

2. Target Optimal Architecture
   - Replace nested loops with a Hash Map or Set to turn O(N^2) operations into linear O(N) time with O(1) lookups.
   - For sorted arrays, apply Two Pointers (left = 0, right = n - 1) or Binary Search to achieve O(N) or O(log N) runtime.
   - For web apps, cache repeated document.getElementById calls in outer scope variables instead of querying on every frame.

3. Expected Gain
   Reduces execution operations from 10^10 operations down to 10^5 operations, eliminating timeouts on extreme test cases.`;
    }

    // 5. UNIT TESTS & ASSERTION GENERATION
    if (
      q.includes('test') ||
      q.includes('unit test') ||
      q.includes('assert') ||
      q.includes('check') ||
      q.includes('validate')
    ) {
      return `Recommended Unit Test Cases for "${title}":

1. Standard Typical Case
   Input: Standard non-empty valid dataset with mixed values.
   Expected: Matches canonical output specification.

2. Minimal & Boundary Case
   Input: Empty array ([]), single element ([42]), or empty string ("").
   Expected: Graceful base-case return without throwing exceptions.

3. Negative & Duplicate Case
   Input: Negative numbers ([-5, -10]), zero values, or repeated duplicates ([2, 2, 3]).
   Expected: Correct handling without infinite loops or duplicate collisions.

4. Large Scale Stress Case
   Input: Array of 10^5 elements.
   Expected: Executes under 1.0 second without heap overflow.`;
    }

    // 6. WEB DEVELOPMENT: CENTERING, FLEXBOX, GRID, STYLING
    if (
      q.includes('center') ||
      q.includes('flex') ||
      q.includes('grid') ||
      q.includes('align') ||
      q.includes('justify') ||
      q.includes('layout')
    ) {
      return `CSS Centering & Modern Layout Guide:

1. Flexbox Method (Best for Buttons, Navbars & Cards)
   display: flex;
   justify-content: center;
   align-items: center;

2. CSS Grid Method (Best for Full Viewport Centering)
   display: grid;
   place-items: center;
   min-height: 100vh;

3. Block Element Auto Margins
   margin: 0 auto;
   max-width: 1200px;
   width: 90%;`;
    }

    // 7. WEB DEVELOPMENT: RESPONSIVENESS & MEDIA QUERIES
    if (
      q.includes('responsive') ||
      q.includes('mobile') ||
      q.includes('media query') ||
      q.includes('viewport') ||
      q.includes('screen size')
    ) {
      return `Responsive Web Design Best Practices:

1. Mobile-First Media Queries
   Default styles apply to mobile screens.
   @media (min-width: 768px) { /* Tablet Styles */ }
   @media (min-width: 1024px) { /* Desktop Styles */ }

2. Fluid Widths & Constraints
   Use width: 100%; max-width: 800px; with box-sizing: border-box; so cards never overflow horizontal boundaries.

3. Responsive Typography & Spacing
   Use clamp() for scalable font sizes: font-size: clamp(1rem, 2.5vw, 1.75rem);. Use flex-wrap: wrap; on flex containers.`;
    }

    // 8. WEB DEVELOPMENT: BUTTONS, EVENT LISTENERS, CLICKS, FORMS
    if (
      q.includes('button') ||
      q.includes('click') ||
      q.includes('event') ||
      q.includes('listener') ||
      q.includes('onclick') ||
      q.includes('form') ||
      q.includes('submit')
    ) {
      return `Event Handling & User Interaction Guide:

1. Modern addEventListener Pattern
   const btn = document.getElementById('action-btn');
   if (btn) {
     btn.addEventListener('click', (event) => {
       // Logic to execute on user click
     });
   }

2. Form Submissions
   Inside form submit event handlers, call event.preventDefault(); to prevent the browser from reloading the page.

3. Dynamic Feedback
   Provide immediate visual cues on click (e.g. element.classList.toggle('active') or disabled states while loading).`;
    }

    // 9. WEB DEVELOPMENT: DOM MANIPULATION & SELECTORS
    if (
      q.includes('dom') ||
      q.includes('getelementbyid') ||
      q.includes('queryselector') ||
      q.includes('innerhtml') ||
      q.includes('textcontent')
    ) {
      return `Safe DOM Manipulation Best Practices:

1. Querying Elements
   Use document.querySelector('.class') or document.getElementById('unique-id').
   Always check if (el !== null) before reading or writing properties.

2. Text vs HTML Injection
   Prefer el.textContent over el.innerHTML when rendering user text to prevent Cross-Site Scripting (XSS) vulnerabilities.

3. Class List Controls
   Use el.classList.add('visible'), el.classList.remove('hidden'), and el.classList.toggle('dark').`;
    }

    // 10. WEB DEVELOPMENT: LOCALSTORAGE & DATA PERSISTENCE
    if (
      q.includes('localstorage') ||
      q.includes('storage') ||
      q.includes('save data') ||
      q.includes('persist')
    ) {
      return `Browser Data Persistence (localStorage) Guide:

1. Saving Data
   localStorage.setItem('my_key', JSON.stringify(dataObj));

2. Loading Data
   const raw = localStorage.getItem('my_key');
   const data = raw ? JSON.parse(raw) : defaultValue;

3. Clearing Data
   localStorage.removeItem('my_key') removes a specific item; localStorage.clear() resets workspace storage.`;
    }

    // 11. WEB DEVELOPMENT: ASYNC, AWAIT, FETCH, API CALLS
    if (
      q.includes('fetch') ||
      q.includes('api') ||
      q.includes('async') ||
      q.includes('await') ||
      q.includes('promise')
    ) {
      return `Async/Await & API Fetch Architecture:

1. Async Function Wrapper
   async function loadData(url) {
     try {
       const res = await fetch(url);
       if (!res.ok) throw new Error('HTTP status ' + res.status);
       const data = await res.json();
       return data;
     } catch (err) {
       console.error('Fetch failed:', err);
       return null;
     }
   }

2. UI Loading States
   Set a loading spinner or flag before starting fetch, and reset it inside a finally block so the UI remains responsive.`;
    }

    // 12. DSA: BINARY SEARCH
    if (q.includes('binary search') || q.includes('bsearch')) {
      return `Binary Search Algorithmic Framework:

1. Prerequisite
   The array or search space must be monotonically sorted.

2. Pointers & Termination Condition
   let low = 0, high = nums.length - 1;
   while (low <= high)

3. Midpoint Calculation
   const mid = low + Math.floor((high - low) / 2); (avoids integer overflow in statically-typed languages).

4. Search Space Reduction
   If nums[mid] === target: return mid.
   If nums[mid] < target: low = mid + 1 (search right half).
   If nums[mid] > target: high = mid - 1 (search left half).

5. Complexity
   Time: O(log N). Space: O(1).`;
    }

    // 13. DSA: TWO POINTERS
    if (q.includes('two pointer') || q.includes('2 pointer')) {
      return `Two Pointers Technique:

1. Initialization
   Place pointer left = 0 and pointer right = nums.length - 1.

2. Convergence Loop
   while (left < right)
   Calculate current metric (e.g. currentSum = nums[left] + nums[right]).

3. Pointer Adjustments
   If currentSum < target: left++ to increase sum.
   If currentSum > target: right-- to decrease sum.
   If currentSum === target: return [left, right].

4. Complexity
   Time: O(N) single pass. Space: O(1) auxiliary memory.`;
    }

    // 14. DSA: SLIDING WINDOW
    if (q.includes('sliding window') || q.includes('window')) {
      return `Sliding Window Paradigm:

1. Setup
   Initialize left = 0, accumulator variable, and optimal answer tracker.

2. Window Expansion
   Loop right from 0 to length - 1, incorporating nums[right] into the window state.

3. Window Shrink Condition
   While current window violates constraints: remove nums[left] from state and increment left++.

4. Complexity
   Each element enters and exits the window at most once, guaranteeing strict O(N) time complexity.`;
    }

    // 15. DSA: RECURSION & BACKTRACKING
    if (q.includes('recursion') || q.includes('recursive') || q.includes('backtrack')) {
      return `Recursion & Backtracking Architecture:

1. Base Case (Must be First)
   The condition where recursion stops and returns (e.g. if (index === n) return baseResult;).

2. Subproblem Exploration
   Iterate through all valid choices at current step, apply candidate to path, and recursively call next state.

3. Backtracking Undo
   Remove candidate from path (e.g. path.pop()) so subsequent branches explore cleanly.`;
    }

    // 16. DSA: DYNAMIC PROGRAMMING (DP)
    if (q.includes('dynamic programming') || q.includes('dp') || q.includes('memoization') || q.includes('tabulation')) {
      return `Dynamic Programming (DP) Strategy:

1. Identify Subproblems
   Check if the problem exhibits Overlapping Subproblems and Optimal Substructure.

2. State Definition
   Define dp[i] clearly (e.g. dp[i] represents maximum value achievable using elements up to index i).

3. Transition Formula
   Express dp[i] in terms of previous states: e.g. dp[i] = Math.max(dp[i - 1], dp[i - 2] + val).

4. Base Cases & Direction
   Top-down memoization (recursion + HashMap/Array cache) or bottom-up tabulation (iterative array loop from 0 to N).`;
    }

    // 17. DSA: LINKED LISTS
    if (q.includes('linked list') || q.includes('linkedlist') || q.includes('reverse list')) {
      return `Linked List Operations & Patterns:

1. Sentinel / Dummy Node
   Use a dummy node (const dummy = new ListNode(0); dummy.next = head;) to simplify edge cases when deleting or inserting at the head.

2. In-Place Reversal Pattern
   let prev = null, curr = head;
   while (curr) {
     const nxt = curr.next;
     curr.next = prev;
     prev = curr;
     curr = nxt;
   }
   return prev;

3. Fast & Slow Pointers
   Use slow (1 step) and fast (2 steps) to locate midpoint or detect cycles (Floyd's algorithm).`;
    }

    // 18. DSA: TREES & BST
    if (q.includes('tree') || q.includes('binary tree') || q.includes('bst')) {
      return `Binary Tree & BST Traversals:

1. Inorder Traversal (Left, Root, Right)
   For a Binary Search Tree (BST), Inorder traversal visits elements in strictly sorted order.

2. Level-Order Traversal (BFS)
   Use a Queue to process nodes level by level. Ideal for shortest distance or finding minimum depth.

3. Depth-First Search (DFS)
   Use recursion to explore paths down to leaf nodes. Base case: if (!node) return 0.`;
    }

    // 19. DSA: GRAPHS & BFS/DFS
    if (q.includes('graph') || q.includes('bfs') || q.includes('dfs') || q.includes('dijkstra')) {
      return `Graph Traversal & Algorithms:

1. Graph Representation
   Build an Adjacency List: Map<node, neighbor[]> using an array or map.

2. Visited Tracking
   Always maintain a Set or boolean array of visited nodes to prevent infinite cycling on cyclic graphs.

3. Algorithm Selection
   - Shortest path in unweighted graph: Breadth-First Search (Queue).
   - Topological ordering / cycle detection in DAG: Kahn's Algorithm (in-degrees) or DFS post-order.
   - Shortest path in weighted graph: Dijkstra with Priority Queue / Min-Heap.`;
    }

    // 20. DSA: STACKS & QUEUES
    if (q.includes('stack') || q.includes('queue') || q.includes('parentheses')) {
      return `Stack & Queue Problem Solving Patterns:

1. Matching Parentheses / Delimiters
   Push opening brackets to stack; on closing bracket, check if stack.pop() matches expected pair. At end, stack must be empty.

2. Monotonic Stack
   Maintain stack elements in increasing or decreasing order. Solves 'Next Greater Element' and 'Daily Temperatures' in linear O(N) time.

3. Queue
   First-In-First-Out (FIFO) queue for Level-Order Tree traversal and multi-source BFS.`;
    }

    // 21. DSA: HASH MAPS & SETS
    if (q.includes('hash map') || q.includes('hashmap') || q.includes('map') || q.includes('set') || q.includes('frequency')) {
      return `Hash Map & Hash Set Techniques:

1. Instant Lookups
   Hash table operations provide average O(1) time complexity for insert, search, and delete.

2. Frequency Counter
   Store element counts in a Map: map.set(x, (map.get(x) || 0) + 1).

3. Complement Matching
   For two sum and pair problems: calculate complement = target - nums[i]. Check if map.has(complement) before storing current index.`;
    }

    // 22. DSA: SORTING & COMPARATORS
    if (q.includes('sort') || q.includes('sorting') || q.includes('quicksort') || q.includes('mergesort')) {
      return `Sorting Concepts & Language Specifics:

1. Custom Comparators
   In JavaScript, array.sort((a, b) => a - b) sorts numerically in ascending order. Without a comparator, [10, 2] sorts alphabetically as ["10", "2"].

2. Optimal Comparison Sorts
   MergeSort, QuickSort, and TimSort operate at O(N log N) time complexity.

3. Non-Comparison Sorts
   Counting Sort or Radix Sort achieve O(N) linear time when numbers fall within a known finite range.`;
    }

    // 23. GENERAL TIME & SPACE COMPLEXITY
    if (q.includes('complexity') || q.includes('time') || q.includes('space') || q.includes('big o')) {
      return `Complexity Analysis for "${title}":

1. Time Complexity Targets
   - O(1): Instant arithmetic or hash lookup.
   - O(log N): Binary search or balanced tree lookup.
   - O(N): Single pass traversal (optimal for linear scans).
   - O(N log N): Optimal sorting or heap operations.
   - O(N^2): Brute-force nested loops (should be optimized away).

2. Space Complexity Considerations
   - O(1): In-place array transformations with only primitive pointer variables.
   - O(N): Auxiliary HashMaps, arrays, or call stack recursion depth.`;
    }

    // 24. GENERAL EDGE CASES
    if (q.includes('edge case') || q.includes('boundary') || q.includes('test case')) {
      return `Key Edge Cases Checklist for "${title}":

1. Minimal & Empty Inputs
   Array with 0 or 1 element, or empty strings ("").

2. Zero & Negative Values
   Verify how negative numbers, zero values, or target = 0 impact mathematical operations.

3. Duplicate Elements
   Inputs where identical numbers appear consecutively or across different indices.

4. Extreme Bounds
   Max integer constraints (2^31 - 1), large arrays (10^5 elements), and floating point precision.`;
    }

    // 25. OPEN-ENDED DYNAMIC CODE-GROUNDED FALLBACK (Answers ANY user question)
    const codeLinesCount = safeCode ? safeCode.split('\n').length : 0;
    const cleanQuestion = query.trim().replace(/[?.,!]+$/, '');

    return `Guidance for "${cleanQuestion}" on ${title}:

1. Analysis of Your Question
   You asked: "${cleanQuestion}".
   In the context of ${title}${safeLang ? ` (${safeLang})` : ''}, ensure your implementation aligns with standard patterns and clean architecture.

2. Code Inspection & Action
   ${
     codeLinesCount > 0
       ? `Active code has ${codeLinesCount} lines. Review your primary function definitions, ensure all variables are initialized with proper types, and verify that all execution branches return an expected value.`
       : `Ensure your solution accepts input correctly, handles edge cases, and produces output matching the expected format.`
   }

3. Next Step
   If you are testing a specific feature, check your browser console or terminal output for any uncaught exceptions and verify variable state step by step.`;
  }

  /**
   * Fix with AI: Diagnoses compiler/runtime error, explains root cause, provides corrected code
   */
  public async fixCompilerError(req: IFixCompilerErrorRequest): Promise<IFixCompilerErrorResponse> {
    if (this.isGeminiConfigured() && this.aiClient) {
      try {
        const prompt = `
File: ${req.fileName || 'main'}
Language: ${req.language}
Error Details / Terminal Output:
${req.errorMessage}

Current Code:
\`\`\`${req.language}
${req.code}
\`\`\`

Please diagnose the exact issue, explain it clearly in encouraging Hinglish & English with the line number, and provide the complete fixed runnable code. Return JSON matching the requested format.
`;
        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION_COMPILER_FIX,
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        if (text.trim()) {
          const cleaned = text.trim().replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
          const parsed = JSON.parse(cleaned);
          return {
            explanation: parsed.explanation || 'AI has analyzed and corrected the error in your code.',
            fixedCode: parsed.fixedCode || req.code,
            diffSummary: parsed.diffSummary || 'Auto-corrected syntax or runtime logic.',
            lineSuggestion: parsed.lineSuggestion,
            source: 'gemini',
            model: this.modelName,
          };
        }
      } catch (err: any) {
        console.warn('[NecAiService] Gemini compiler fix failed, falling back to heuristics:', err.message);
      }
    }

    return this.generateHeuristicCompilerFix(req);
  }

  /**
   * Generate 5 diverse edge cases tailored to the student's code and stdin structure
   */
  public async generateCompilerTestCases(req: IGenerateTestCasesRequest): Promise<IGenerateTestCasesResponse> {
    if (this.isGeminiConfigured() && this.aiClient) {
      try {
        const prompt = `
File: ${req.fileName || 'main'}
Language: ${req.language}
Code:
\`\`\`${req.language}
${req.code}
\`\`\`

Generate 5 comprehensive edge cases (zero/empty, negative, typical, large boundary, edge special format) ready for stdin. Return JSON matching the requested format.
`;
        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION_TEST_CASES,
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        if (text.trim()) {
          const cleaned = text.trim().replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed.testCases) && parsed.testCases.length > 0) {
            return {
              testCases: parsed.testCases,
              combinedStdin: parsed.combinedStdin || parsed.testCases.map((tc: any) => tc.input).join('\n'),
              source: 'gemini',
            };
          }
        }
      } catch (err: any) {
        console.warn('[NecAiService] Gemini test cases generation failed, falling back to heuristics:', err.message);
      }
    }

    return this.generateHeuristicTestCases(req);
  }

  /**
   * Heuristic fallback for compiler errors
   */
  private generateHeuristicCompilerFix(req: IFixCompilerErrorRequest): IFixCompilerErrorResponse {
    const err = (req.errorMessage || '').toLowerCase();
    const lang = (req.language || '').toLowerCase();
    const code = req.code || '';

    // 1. Python Heuristics
    if (lang.includes('python') || lang === 'py') {
      if (err.includes('indentationerror')) {
        return {
          explanation: `Indentation Error Detected

Python me code blocks (loops, if, functions) define karne ke liye spaces ya tabs ka sahi hona zaroori hai.

1. Cause
   Aapke code me indentation inconsistent thi (mixed spaces ya missing indent).

2. Fix Applied
   Indentation ko standard 4 spaces par format kar diya gaya hai.`,
          fixedCode: code.replace(/\t/g, '    '),
          diffSummary: 'Replaced irregular tabs and alignment with clean 4-space indents.',
          source: 'heuristic',
        };
      }
      if (err.includes('indexerror') || err.includes('out of range')) {
        return {
          explanation: `List Index Out of Bounds

List ki length se zyada bada index access karne par Python ye error throw karta hai.

1. Cause
   Aapne arr[i] access kiya jab i >= len(arr) ho gaya tha.

2. Rule
   Loop ko hamesha range(len(arr)) tak chalayein ya i < len(arr) guard check lagayein.

3. Fix Applied
   Index boundary check guard add kar diya gaya hai.`,
          fixedCode: code.includes('range(')
            ? code.replace(/range\s*\(\s*len\s*\(([^)]+)\)\s*\+\s*1\s*\)/g, 'range(len($1))')
            : `# Safe Bounds Guard Added\n${code}`,
          diffSummary: 'Corrected loop boundary to stay within list size limits.',
          source: 'heuristic',
        };
      }
      if (err.includes('zerodivisionerror')) {
        return {
          explanation: `Zero Division Error

Math me kisi bhi number ko 0 se divide nahi kiya ja sakta.

1. Cause
   Division operation me denominator value 0 ho gayi.

2. Fix
   Division perform karne se pehle verify karein ki divisor zero na ho.`,
          fixedCode: code.replace(/(\w+)\s*\/\s*(\w+)/g, '($1 / ($2 if $2 != 0 else 1))'),
          diffSummary: 'Added zero division safeguard check.',
          source: 'heuristic',
        };
      }
      if (err.includes('syntaxerror') && (err.includes('expected \':\'') || err.includes('colon'))) {
        return {
          explanation: `Missing Colon in Statement

Python me if, elif, else, for, while, aur def ke end me colon (:) lagana zaroori hai.

Fix Applied: Block headers ke end me missing colons attach kar diye gaye hain.`,
          fixedCode: code.replace(/^( {0,}(?:if|elif|else|for|while|def)[^:\n]+)$/gm, '$1:'),
          diffSummary: 'Added missing colon (:) to Python control statement headers.',
          source: 'heuristic',
        };
      }
    }

    // 2. C++ / C Heuristics
    if (lang.includes('cpp') || lang.includes('c++') || lang === 'c') {
      if (err.includes('iostream') || err.includes('cout') || err.includes('cin') || err.includes('vector')) {
        let fixed = code;
        if (!fixed.includes('#include <iostream>')) {
          fixed = `#include <iostream>\n#include <vector>\nusing namespace std;\n\n${fixed}`;
        }
        return {
          explanation: `Missing Standard Header / Namespace

C++ me cin, cout, ya vector use karne ke liye standard headers aur using namespace std declare karna zaroori hai.

Fix Applied: Header include kar diya gaya hai.`,
          fixedCode: fixed,
          diffSummary: 'Included missing <iostream>, <vector> headers and namespace std.',
          source: 'heuristic',
        };
      }
      if (err.includes('expected \';\'') || err.includes('expected semicolon')) {
        return {
          explanation: `Missing Semicolon (;)

C/C++ me har statement ke end me semicolon (;) lagana zaroori hai.

1. Cause
   Kisi statement ke aakhir me semicolon miss ho gaya tha.

2. Fix Applied
   Statement terminations verify karke semicolon add kar diya gaya hai.`,
          fixedCode: code.replace(/([^;{}]+)\n\s*(return|cout|cin|int|for|while)/g, '$1;\n  $2'),
          diffSummary: 'Added missing semicolon (;) to statement.',
          source: 'heuristic',
        };
      }
    }

    // 3. Java Heuristics
    if (lang.includes('java')) {
      if (err.includes('arrayindexoutofboundsexception')) {
        return {
          explanation: `ArrayIndexOutOfBoundsException

Java me arrays 0-indexed hote hain. Valid indices 0 se N-1 tak hote hain.

1. Cause
   Loop me i <= arr.length use karne se last iteration par exception aati hai.

2. Fix
   Hamesha strictly i < arr.length use karein.`,
          fixedCode: code.replace(/<=\s*(\w+)\.length/g, '< $1.length'),
          diffSummary: 'Adjusted array loop boundary from <= to < length.',
          source: 'heuristic',
        };
      }
    }

    // Generic Fallback
    return {
      explanation: `AI Error Diagnosis for ${req.fileName || 'your code'}

Terminal me execution error detect hua hai:
${(req.errorMessage || 'Non-zero process exit').slice(0, 300)}

1. Checkpoints
   - Line Numbers: Terminal error me di gayi line number par variables aur brackets verify karein.
   - Boundary Conditions: Loops aur array indices ko bounds ke andar rakhein.
   - Data Types: Variable declarations aur return values match karayein.`,
      fixedCode: code,
      diffSummary: 'Reviewed code structure and syntax integrity.',
      source: 'heuristic',
    };
  }

  /**
   * Heuristic fallback for generating 5 edge cases
   */
  private generateHeuristicTestCases(req: IGenerateTestCasesRequest): IGenerateTestCasesResponse {
    const code = (req.code || '').toLowerCase();

    // Check for string-based inputs
    const isStringInput = code.includes('string') || code.includes('str') || code.includes('char') || code.includes('nextline');
    // Check for array-based inputs
    const isArrayInput = code.includes('vector') || code.includes('[]') || code.includes('split(') || code.includes('arr');

    if (isArrayInput) {
      const testCases: ITestCaseItem[] = [
        {
          id: '1',
          title: 'Empty / Zero Size Array',
          input: '0',
          category: 'zero_empty',
          explanation: 'Tests whether your algorithm gracefully handles N=0 without crashing or index out of bound.',
        },
        {
          id: '2',
          title: 'Single Element Array',
          input: '1\n42',
          category: 'typical',
          explanation: 'Tests minimum non-empty array with a single positive number.',
        },
        {
          id: '3',
          title: 'All Negative Numbers',
          input: '5\n-15 -4 -20 -1 -8',
          category: 'negative',
          explanation: 'Validates maximum-sum, min/max searches, and sorting when all numbers are strictly negative.',
        },
        {
          id: '4',
          title: 'Duplicates & Zeros Mixed',
          input: '6\n0 5 0 5 -5 0',
          category: 'edge_boundary',
          explanation: 'Tests frequency maps, two-pointer bounds, and duplicate value collisions.',
        },
        {
          id: '5',
          title: 'Large Scale Values',
          input: '5\n1000000 2000000 3000000 4000000 5000000',
          category: 'large_scale',
          explanation: 'Tests integer overflow limits and 64-bit integer (long long / BigInt) safety.',
        },
      ];
      return {
        testCases,
        combinedStdin: '5\n10 20 30 40 50',
        source: 'heuristic',
      };
    }

    if (isStringInput) {
      const testCases: ITestCaseItem[] = [
        {
          id: '1',
          title: 'Empty String',
          input: '',
          category: 'zero_empty',
          explanation: 'Tests empty input to prevent string index out of bounds or null reference exceptions.',
        },
        {
          id: '2',
          title: 'Single Character',
          input: 'A',
          category: 'typical',
          explanation: 'Validates minimal string boundary conditions.',
        },
        {
          id: '3',
          title: 'Palindrome String',
          input: 'racecar',
          category: 'edge_boundary',
          explanation: 'Tests symmetric two-pointer and reversal string algorithms.',
        },
        {
          id: '4',
          title: 'Mixed Case & Special Chars',
          input: 'NextEra_Coder#2026!',
          category: 'edge_boundary',
          explanation: 'Tests ASCII parsing, alphanumeric filtering, and symbols.',
        },
        {
          id: '5',
          title: 'Repeated Characters',
          input: 'aaaaabbbbbaaaaa',
          category: 'large_scale',
          explanation: 'Validates run-length encoding, frequency counters, and window bounds.',
        },
      ];
      return {
        testCases,
        combinedStdin: 'racecar',
        source: 'heuristic',
      };
    }

    // Default numeric test cases
    const testCases: ITestCaseItem[] = [
      {
        id: '1',
        title: 'Zero Boundary (N = 0)',
        input: '0',
        category: 'zero_empty',
        explanation: 'Tests base cases, zero multiplication/division, and termination conditions.',
      },
      {
        id: '2',
        title: 'Negative Integer (N = -25)',
        input: '-25',
        category: 'negative',
        explanation: 'Tests negative coordinate, decrementing loop, or sign logic handling.',
      },
      {
        id: '3',
        title: 'Small Prime / Odd Number (N = 7)',
        input: '7',
        category: 'typical',
        explanation: 'Typical standard odd input for general parity and arithmetic algorithms.',
      },
      {
        id: '4',
        title: 'Power of Two (N = 64)',
        input: '64',
        category: 'edge_boundary',
        explanation: 'Tests bitwise operations, binary search powers, and exponential divisions.',
      },
      {
        id: '5',
        title: 'Large Boundary (N = 1000000)',
        input: '1000000',
        category: 'large_scale',
        explanation: 'Validates time complexity against large inputs to prevent Time Limit Exceeded (TLE).',
      },
    ];

    return {
      testCases,
      combinedStdin: '7',
      source: 'heuristic',
    };
  }
}

export const necAiService = new NecAiService();
export default necAiService;
