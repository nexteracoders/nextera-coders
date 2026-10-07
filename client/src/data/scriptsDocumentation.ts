export type ScriptLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DocTopic {
  id: string;
  title: string;
  level: ScriptLevel;
  summary: string;
  concept: string;
  syntax: string;
  codeExample: string;
  expectedOutput: string;
  keyTakeaways: string[];
  bestPractices: string[];
  commonPitfalls: string[];
  compilerLanguage: string;
}

export interface DocSection {
  id: string;
  title: string;
  level: ScriptLevel;
  description: string;
  topics: DocTopic[];
}

export interface SubjectTrack {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  description: string;
  iconName: string;
  accentColor: string;
  version: string;
  compilerLanguage: string;
  sections: DocSection[];
}

export const SCRIPTS_DOCUMENTATION: SubjectTrack[] = [
  // ==========================================
  // JAVASCRIPT: COMPLETE BEGINNER TO ADVANCED
  // ==========================================
  {
    id: 'javascript',
    title: 'JavaScript Modern Complete Reference & Runtime',
    shortTitle: 'JavaScript (ES2024 / Node)',
    category: 'Web & Systems',
    description:
      'Master JavaScript from foundational runtime mechanics to modern ES2024 features, closures, event loop internals, asynchronous pipelines, and performance optimization.',
    iconName: 'Code',
    accentColor: '#F7DF1E',
    version: 'ECMAScript 2024 / V8 Engine',
    compilerLanguage: 'javascript',
    sections: [
      // ----------------------------------------
      // SECTION 1: BEGINNER FUNDAMENTALS
      // ----------------------------------------
      {
        id: 'js-fundamentals',
        title: '1. JavaScript Fundamentals (Beginner)',
        level: 'beginner',
        description: 'Core syntax, execution models, variables, operators, data types, and fundamental functions.',
        topics: [
          {
            id: 'js-engine-intro',
            title: 'JavaScript Engine & Execution Overview',
            level: 'beginner',
            summary: 'Understand how V8, JavaScript engines, the Call Stack, and JIT compilation parse and execute your code.',
            concept: `JavaScript is a high-level, single-threaded, garbage-collected, interpreted or Just-In-Time (JIT) compiled language with first-class functions and a non-blocking event loop runtime.

Under the hood:
1. **Parser & AST**: The engine parses raw text into an Abstract Syntax Tree (AST).
2. **Ignition (Interpreter)**: Converts AST into bytecode for fast initial execution.
3. **TurboFan (Optimizing Compiler)**: Profiles runtime types and compiles hot paths into optimized machine code.
4. **Call Stack**: Executes instructions sequentially following LIFO (Last-In, First-Out).
5. **Memory Heap**: Allocates and stores complex objects and function references.`,
            syntax: `// Standard console output and basic arithmetic
console.log("Hello, NextEra Coder!");`,
            codeExample: `// 1. JavaScript Engine Demo: Call Stack & Execution
function printPlatformInfo() {
  const platform = "NextEra Coders Learning Engine";
  const version = "ES2024 / Node.js Runtime";
  
  console.log("=== Platform Initialization ===");
  console.log("Target:", platform);
  console.log("Runtime Engine:", version);
  console.log("Thread Model: Single-Threaded Event-Driven");
}

function calculateEngineUptime(hours) {
  const seconds = hours * 3600;
  return \`\${hours} hours is equivalent to \${seconds.toLocaleString()} seconds\`;
}

printPlatformInfo();
console.log(calculateEngineUptime(24));
`,
            expectedOutput: `=== Platform Initialization ===
Target: NextEra Coders Learning Engine
Runtime Engine: ES2024 / Node.js Runtime
Thread Model: Single-Threaded Event-Driven
24 hours is equivalent to 86,400 seconds`,
            keyTakeaways: [
              'JavaScript runs on a single main thread backed by the V8 Call Stack and Memory Heap.',
              'Modern engines use JIT (Just-In-Time) compilation to achieve near-native execution speeds.',
              'Understanding single-threaded mechanics is vital for mastering asynchronous operations later.',
            ],
            bestPractices: [
              'Always enable strict mode ("use strict") or use modern ES modules which are strict by default.',
              'Avoid global variables that pollute the global window/globalThis namespace.',
            ],
            commonPitfalls: [
              'Assuming JavaScript is multi-threaded by default—all synchronous computations block the main UI thread.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-variables',
            title: 'Variables & Declarations: var vs let vs const',
            level: 'beginner',
            summary: 'Master the crucial differences between var, let, and const, including scope boundaries, hoisting, and Temporal Dead Zone (TDZ).',
            concept: `In JavaScript, variable declaration keyword determines **Scope**, **Reassignability**, and **Hoisting Behavior**:

- **\`const\` (Block Scoped)**: Cannot be reassigned. Must be initialized upon declaration. Objects declared with \`const\` can still have their internal properties mutated.
- **\`let\` (Block Scoped)**: Can be reassigned. Hoisted to the top of the block but stays in the **Temporal Dead Zone (TDZ)** until declaration line is reached.
- **\`var\` (Function Scoped)**: Legacy keyword. Hoisted with \`undefined\`. Leaks outside of \`if\` blocks and \`for\` loops. Avoid using \`var\` in modern codebases.`,
            syntax: `const immutableValue = 42;
let mutableCounter = 0;
// Avoid: var legacyVariable = "old";`,
            codeExample: `// Demonstration of Scope, Mutability & TDZ
const APP_CONFIG = {
  name: "NextEra Compiler",
  version: "2.0.0",
  features: ["Polyglot Runner", "Live Sandbox"]
};

// Object properties can be mutated even when declared with const:
APP_CONFIG.features.push("Interactive Docs");

console.log("Config Name:", APP_CONFIG.name);
console.log("Features Count:", APP_CONFIG.features.length);

// Block scoping with let:
let activeUsers = 100;
{
  let activeUsers = 500; // Local shadow
  console.log("Inside block activeUsers:", activeUsers);
}
console.log("Outside block activeUsers:", activeUsers);

// Mutating a let variable
activeUsers += 50;
console.log("Updated activeUsers:", activeUsers);
`,
            expectedOutput: `Config Name: NextEra Compiler
Features Count: 3
Inside block activeUsers: 500
Outside block activeUsers: 100
Updated activeUsers: 150`,
            keyTakeaways: [
              'Default to using `const` everywhere. Use `let` only when reassignment is strictly required.',
              '`let` and `const` prevent accidental variable leakage by enforcing block scope `{ ... }`.',
              'Declaring an object with `const` prevents reassigning the variable reference, not mutating its properties.',
            ],
            bestPractices: [
              'Never use `var` in modern JavaScript.',
              'Use `Object.freeze()` if you need true immutable objects with `const`.',
            ],
            commonPitfalls: [
              'Accessing a `let` or `const` variable before its line of declaration causes a ReferenceError due to TDZ.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-datatypes',
            title: 'Data Types & Primitives vs Reference Types',
            level: 'beginner',
            summary: 'Explore 7 primitive data types, Objects, dynamic typing, BigInt, Symbols, and memory storage models.',
            concept: `JavaScript data types are categorized into two fundamental groups:

### 1. Primitive Types (Passed by Value, Stored on the Stack)
- \`string\`, \`number\`, \`boolean\`, \`null\`, \`undefined\`, \`bigint\`, \`symbol\`
- Immutable: modifications return a new value rather than mutating the original memory address.

### 2. Reference Types (Passed by Reference, Stored on the Heap)
- \`Object\`, \`Array\`, \`Function\`, \`Date\`, \`Map\`, \`Set\`, etc.
- Variables hold a memory pointer/reference to the heap location. Copying copies the pointer, not the contents.`,
            syntax: `// Primitives
const name = "Alex";
const count = 42;
const isReady = true;
const uniqueId = Symbol("id");
const hugeNumber = 9007199254740991n;

// Reference
const user = { name: "Alex", score: 95 };`,
            codeExample: `// Primitive vs Reference memory behavior
console.log("=== 1. Primitive Copy (By Value) ===");
let a = 50;
let b = a; // Copy value 50
b = 100;
console.log("a:", a, "(unchanged)");
console.log("b:", b);

console.log("\\n=== 2. Reference Copy (By Pointer) ===");
const dev1 = { name: "Sandip", role: "Full Stack Engineer" };
const dev2 = dev1; // dev2 points to the SAME heap address
dev2.role = "Lead Architect";
console.log("dev1 role:", dev1.role, "(mutated via dev2 reference)");
console.log("dev2 role:", dev2.role);

console.log("\\n=== 3. Type Checks ===");
console.log("typeof 'NextEra':", typeof "NextEra");
console.log("typeof 123.45:", typeof 123.45);
console.log("typeof 9999999999999999n:", typeof 9999999999999999n);
console.log("typeof Symbol():", typeof Symbol());
console.log("typeof null:", typeof null, "(historical JS quirk)");
console.log("Array.isArray([]):", Array.isArray([]));
`,
            expectedOutput: `=== 1. Primitive Copy (By Value) ===
a: 50 (unchanged)
b: 100

=== 2. Reference Copy (By Pointer) ===
dev1 role: Lead Architect (mutated via dev2 reference)
dev2 role: Lead Architect

=== 3. Type Checks ===
typeof 'NextEra': string
typeof 123.45: number
typeof 9999999999999999n: bigint
typeof Symbol(): symbol
typeof null: object (historical JS quirk)
Array.isArray([]): true`,
            keyTakeaways: [
              'Primitives are immutable and passed by value; objects are mutable and passed by reference.',
              'Use `Array.isArray()` to check arrays since `typeof []` returns `"object"`.',
              '`typeof null === "object"` is a legacy JavaScript quirk preserved for backward compatibility.',
            ],
            bestPractices: [
              'Use structured clone `structuredClone(obj)` or spread operator `{ ...obj }` for safe object cloning.',
            ],
            commonPitfalls: [
              'Comparing two distinct objects with identical properties via `===` returns `false` because their memory references differ.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-operators',
            title: 'Operators, Type Coercion, Optional Chaining & Nullish Coalescing',
            level: 'beginner',
            summary: 'Understand strict vs loose equality, truthy/falsy evaluation, optional chaining (?.) and nullish coalescing (??).',
            concept: `Modern JavaScript provides expressive operators for safe attribute traversal and default fallbacks:

1. **Strict Equality (\`===\`) vs Loose (\`==\`)**:
   - \`===\` compares both type and value without implicit coercion.
   - \`==\` performs implicit type coercion (e.g., \`0 == false\` is true, \`"" == 0\` is true). Always prefer \`===\`.

2. **Truthy and Falsy Values**:
   - The 8 Falsy values in JS: \`false\`, \`0\`, \`-0\`, \`0n\`, \`""\`, \`null\`, \`undefined\`, \`NaN\`. Everything else is Truthy.

3. **Optional Chaining (\`?.\`)**:
   - Safely reads nested properties without throwing \`TypeError: Cannot read property of undefined\`.

4. **Nullish Coalescing (\`??\`) vs OR (\`||\`)**:
   - \`??\` returns the right operand ONLY when left is \`null\` or \`undefined\`.
   - \`||\` returns right operand for ANY falsy value (treating \`0\` or \`""\` as falsy).`,
            syntax: `// Optional Chaining & Nullish Coalescing
const street = user?.address?.street ?? "Street Not Provided";
const port = config.port ?? 3000;`,
            codeExample: `// Modern Operators Demonstration
const userProfile = {
  id: "USR-9821",
  name: "John Doe",
  preferences: {
    theme: "dark",
    notificationsCount: 0 // 0 is a valid number!
  }
};

// 1. Optional Chaining (?.)
const city = userProfile?.address?.city ?? "City Unknown";
console.log("User City:", city);

// 2. ?? (Nullish) vs || (Logical OR)
const orCount = userProfile.preferences.notificationsCount || 10;
const nullishCount = userProfile.preferences.notificationsCount ?? 10;

console.log("Using || fallback (wrongly overwrites 0):", orCount);
console.log("Using ?? fallback (correctly keeps 0):", nullishCount);

// 3. Logical Assignment Operators (??=, ||=, &&=)
const settings = { timeout: null, retries: 3 };
settings.timeout ??= 5000; // sets 5000 because timeout was null
settings.retries ??= 10;   // stays 3
console.log("Updated Settings:", settings);
`,
            expectedOutput: `User City: City Unknown
Using || fallback (wrongly overwrites 0): 10
Using ?? fallback (correctly keeps 0): 0
Updated Settings: { timeout: 5000, retries: 3 }`,
            keyTakeaways: [
              'Always use `===` and `!==` to prevent subtle bugs caused by type coercion.',
              'Use `??` when configuring default values for numbers and booleans where `0` or `false` are valid inputs.',
              'Combine `?.` and `??` for bulletproof property access in real-world API responses.',
            ],
            bestPractices: [
              'Avoid nested ternary expressions; use early returns (guard clauses) instead.',
            ],
            commonPitfalls: [
              'Using `||` instead of `??` can accidentally overwrite legitimate `0` or `""` values with defaults.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-functions',
            title: 'Functions: Declarations, Expressions & Arrow Functions',
            level: 'beginner',
            summary: 'Deep dive into function declarations, function expressions, arrow functions, default arguments, rest parameters, and lexical scope.',
            concept: `Functions are first-class citizens in JavaScript, meaning they can be stored in variables, passed as arguments, and returned from other functions.

### Function Types:
1. **Function Declaration**:
   \`\`\`js
   function add(a, b) { return a + b; }
   \`\`\`
   - Hoisted with definition to top of scope.
   - Has its own \`this\`, \`arguments\` object, and \`prototype\`.

2. **Function Expression**:
   \`\`\`js
   const multiply = function(a, b) { return a * b; };
   \`\`\`
   - Not hoisted with definition.

3. **Arrow Function (ES6)**:
   \`\`\`js
   const divide = (a, b) => a / b;
   \`\`\`
   - Shorter syntax, implicit return for single expressions.
   - **Lexical \`this\`**: Inherits \`this\` from the surrounding lexical scope.
   - Does not possess \`arguments\` object or \`prototype\`. Cannot be used as constructor (\`new\`).`,
            syntax: `// Rest parameters & default values
const calculateTotal = (taxRate = 0.08, ...prices) => {
  const subtotal = prices.reduce((sum, p) => sum + p, 0);
  return subtotal + (subtotal * taxRate);
};`,
            codeExample: `// Functions in JavaScript
// 1. Arrow function with implicit return and rest parameters
const sumAll = (...numbers) => numbers.reduce((acc, curr) => acc + curr, 0);

console.log("Sum of numbers (1..5):", sumAll(1, 2, 3, 4, 5));

// 2. Higher-Order Function (takes a function or returns one)
function createDiscountCalculator(discountPercent) {
  return function(price) {
    const discount = price * (discountPercent / 100);
    return price - discount;
  };
}

const tenPercentOff = createDiscountCalculator(10);
const vipTwentyOff = createDiscountCalculator(20);

console.log("Original Price: $100");
console.log("With 10% Discount: $" + tenPercentOff(100));
console.log("With 20% VIP Discount: $" + vipTwentyOff(100));

// 3. Arrow function concise mapping
const items = ["JavaScript", "TypeScript", "React", "Node.js"];
const upperLengths = items.map(item => ({ name: item, length: item.length }));
console.log("Mapped items:", upperLengths);
`,
            expectedOutput: `Sum of numbers (1..5): 15
Original Price: $100
With 10% Discount: $90
With 20% VIP Discount: $80
Mapped items: [
  { name: 'JavaScript', length: 10 },
  { name: 'TypeScript', length: 10 },
  { name: 'React', length: 5 },
  { name: 'Node.js', length: 7 }
]`,
            keyTakeaways: [
              'Arrow functions do not bind their own `this`; they capture the `this` value of the enclosing context.',
              'Rest parameter `(...args)` gathers all remaining arguments into a true JavaScript array.',
              'Default parameters are evaluated at call time from left to right.',
            ],
            bestPractices: [
              'Use arrow functions for callbacks, array iterations, and functional utilities.',
              'Use standard function declarations for top-level module APIs and object methods requiring dynamic `this`.',
            ],
            commonPitfalls: [
              'Trying to use `new` on an arrow function will throw `TypeError: ... is not a constructor`.',
            ],
            compilerLanguage: 'javascript',
          },
        ],
      },

      // ----------------------------------------
      // SECTION 2: INTERMEDIATE DATA STRUCTURES & PATTERNS
      // ----------------------------------------
      {
        id: 'js-intermediate',
        title: '2. Data Structures, Closures & Modern JS (Intermediate)',
        level: 'intermediate',
        description: 'Deep dive into Arrays, Objects, Closures, Lexical Scope, the this keyword, DOM events, and ES6+ patterns.',
        topics: [
          {
            id: 'js-arrays-mastery',
            title: 'Arrays Mastery & Modern Transformation Methods',
            level: 'intermediate',
            summary: 'Master map, filter, reduce, flatMap, find, some, every, and the new non-mutating methods (toSorted, toReversed, toSpliced).',
            concept: `Modern JavaScript arrays are dynamic lists with rich functional methods:

### Transformative Non-Mutating Methods:
- \`map(fn)\`: Produces a new array by transforming every element.
- \`filter(fn)\`: Returns elements satisfying the predicate condition.
- \`reduce(fn, init)\`: Accumulates elements into a single aggregated result (number, object, group).
- \`flatMap(fn)\`: Maps each element and flattens the result by 1 level.

### Modern ES2023 Non-Mutating Additions:
- \`toSorted()\`: Returns a sorted copy without mutating the original array.
- \`toReversed()\`: Returns a reversed copy without mutating the original.
- \`with(index, value)\`: Returns a copy with the element at index replaced.`,
            syntax: `const doubled = arr.map(x => x * 2);
const evens = arr.filter(x => x % 2 === 0);
const sum = arr.reduce((acc, curr) => acc + curr, 0);`,
            codeExample: `// Modern Array Methods & Data Aggregation
const transactions = [
  { id: 1, type: "income", amount: 1500, category: "Salary" },
  { id: 2, type: "expense", amount: 200, category: "Groceries" },
  { id: 3, type: "expense", amount: 50, category: "Coffee" },
  { id: 4, type: "income", amount: 350, category: "Freelance" },
  { id: 5, type: "expense", amount: 120, category: "Utilities" },
];

// 1. Calculate Net Balance using reduce
const balance = transactions.reduce((acc, t) => {
  return t.type === "income" ? acc + t.amount : acc - t.amount;
}, 0);

console.log("Total Net Balance: $" + balance);

// 2. Group expenses by category
const expenses = transactions
  .filter(t => t.type === "expense")
  .map(t => ({ category: t.category, cost: t.amount }));

console.log("Filtered Expenses:", expenses);

// 3. Immutably sort transactions by amount descending
const sortedByAmount = [...transactions].sort((a, b) => b.amount - a.amount);
console.log("Highest Transaction:", sortedByAmount[0].category, "($" + sortedByAmount[0].amount + ")");
`,
            expectedOutput: `Total Net Balance: $1480
Filtered Expenses: [
  { category: 'Groceries', cost: 200 },
  { category: 'Coffee', cost: 50 },
  { category: 'Utilities', cost: 120 }
]
Highest Transaction: Salary ($1500)`,
            keyTakeaways: [
              '`reduce` is one of the most powerful methods in JS, capable of implementing map, filter, grouping, and tallying in a single pass.',
              'Always provide an initial value to `reduce` to avoid runtime errors on empty arrays.',
            ],
            bestPractices: [
              'Avoid mutating arrays in place (e.g. `sort`, `reverse`, `splice`) when working in React/Redux architectures; copy first or use `toSorted()`.',
            ],
            commonPitfalls: [
              'Default `arr.sort()` converts numbers to strings before comparison, resulting in `[10, 2, 5].sort() === [10, 2, 5]`. Always provide a comparator `(a, b) => a - b`.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-objects-destructuring',
            title: 'Objects, Destructuring, Spread/Rest & Immutability',
            level: 'intermediate',
            summary: 'Work with Object static methods (entries, fromEntries, groupBy), nested destructuring, alias assignment, and shallow vs deep clones.',
            concept: `Objects are collections of key-value pairs.

### Key Concepts:
1. **Destructuring**: Unpacks values from arrays or properties from objects into distinct variables.
   - Property aliases: \`const { role: userRole } = user;\`
   - Default values: \`const { theme = 'dark' } = user;\`
2. **Spread Operator (\`...\`)**: Shallow copies object keys.
3. **\`Object.entries\` / \`Object.fromEntries\`**: Converts objects to \`[key, value]\` tuples and vice versa.
4. **Shallow vs Deep Copy**:
   - Shallow: \`{ ...obj }\` or \`Object.assign({}, obj)\` (nested objects share pointers).
   - Deep: \`structuredClone(obj)\` creates independent duplicates of all nested structures.`,
            syntax: `const { name, role = "Developer", address: { city } = {} } = user;
const clonedUser = structuredClone(user);`,
            codeExample: `// Object Manipulation, Destructuring & Cloning
const dev = {
  id: "DEV-101",
  name: "Sarah Connor",
  skills: ["JavaScript", "Node.js", "Docker"],
  stats: {
    contributions: 342,
    reputation: 4.9
  }
};

// 1. Nested Destructuring with Renaming & Defaults
const {
  name: devName,
  stats: { contributions },
  country = "India"
} = dev;

console.log(\`Developer: \${devName}, Contributions: \${contributions}, Country: \${country}\`);

// 2. Immutably updating nested properties using Spread
const updatedDev = {
  ...dev,
  skills: [...dev.skills, "TypeScript"],
  stats: {
    ...dev.stats,
    contributions: dev.stats.contributions + 1
  }
};

console.log("Original Skills:", dev.skills);
console.log("Updated Skills:", updatedDev.skills);
console.log("New Contribution Count:", updatedDev.stats.contributions);

// 3. Object.entries transformation
const scores = { math: 90, physics: 85, cs: 98 };
const scaledScores = Object.fromEntries(
  Object.entries(scores).map(([subject, score]) => [subject, Math.min(100, score + 2)])
);
console.log("Scaled Scores:", scaledScores);
`,
            expectedOutput: `Developer: Sarah Connor, Contributions: 342, Country: India
Original Skills: [ 'JavaScript', 'Node.js', 'Docker' ]
Updated Skills: [ 'JavaScript', 'Node.js', 'Docker', 'TypeScript' ]
New Contribution Count: 343
Scaled Scores: { math: 92, physics: 87, cs: 100 }`,
            keyTakeaways: [
              'Destructuring provides clean, self-documenting syntax for extracting nested data.',
              'Use `structuredClone()` for reliable deep copying of objects containing arrays, dates, and nested maps.',
            ],
            bestPractices: [
              'Always use immutable update patterns when writing reducer functions or React state transitions.',
            ],
            commonPitfalls: [
              '`JSON.parse(JSON.stringify(obj))` loses `Date` objects, `undefined`, and `Functions`. Use native `structuredClone()`.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-closures',
            title: 'Scope Chain & Closures in Depth',
            level: 'intermediate',
            summary: 'Understand lexical scoping, the scope chain, closure mechanics, data encapsulation, memoization, and currying.',
            concept: `A **Closure** is the combination of a function bundled together with references to its surrounding state (the **Lexical Environment**).

In simple terms: **A function remembers the variables from the scope where it was created, even when executed in a completely different scope.**

### Practical Applications:
1. **Data Encapsulation & Private Variables**: Creating modules with hidden internal state.
2. **Function Factories**: Generating tailored functions dynamically.
3. **Memoization**: Caching expensive function return values.
4. **Currying & Partial Application**: Converting a multi-argument function into a sequence of unary functions.`,
            syntax: `function createCounter() {
  let count = 0; // Private state
  return {
    increment: () => ++count,
    getValue: () => count
  };
}`,
            codeExample: `// 1. Closure for Private State Encapsulation
function createBankAccount(initialDeposit) {
  let balance = initialDeposit; // Private variable (cannot be accessed directly from outside)
  const transactionHistory = [\`Initial deposit: $\${initialDeposit}\`];

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Invalid deposit amount");
      balance += amount;
      transactionHistory.push(\`Deposited: $\${amount}\`);
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) return "Insufficient funds!";
      balance -= amount;
      transactionHistory.push(\`Withdrew: $\${amount}\`);
      return balance;
    },
    getBalance() {
      return balance;
    },
    getStatement() {
      return [...transactionHistory];
    }
  };
}

const account = createBankAccount(500);
account.deposit(250);
account.withdraw(100);

console.log("Current Balance:", "$" + account.getBalance());
console.log("Statement:", account.getStatement());

// 2. Closure for Memoization
function memoize(fn) {
  const cache = {};
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key] !== undefined) {
      console.log("(Fetching from cache for args:", args, ")");
      return cache[key];
    }
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}

const slowSquare = (n) => n * n;
const fastSquare = memoize(slowSquare);

console.log("First Call:", fastSquare(12));
console.log("Second Call:", fastSquare(12));
`,
            expectedOutput: `Current Balance: $650
Statement: [
  'Initial deposit: $500',
  'Deposited: $250',
  'Withdrew: $100'
]
First Call: 144
(Fetching from cache for args: [ 12 ] )
Second Call: 144`,
            keyTakeaways: [
              'Closures provide true encapsulation without needing ES6 class private syntax.',
              'Functions retain a reference to outer variables in memory as long as the closure exists.',
            ],
            bestPractices: [
              'Clean up event listeners or timers holding closures to prevent inadvertent memory leaks.',
            ],
            commonPitfalls: [
              'Creating closures inside tight loops without proper scoping can lead to unexpected shared state.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-this-binding',
            title: 'The "this" Keyword & Explicit Binding (call, apply, bind)',
            level: 'intermediate',
            summary: 'Uncover how this is evaluated at call time, how to explicitly bind it using call/apply/bind, and how arrow functions differ.',
            concept: `In JavaScript, the value of \`this\` depends entirely on **HOW** a function is invoked (at runtime call site), except for arrow functions which use **Lexical \`this\`**.

### 4 Rules of \`this\` Binding:
1. **Default Binding**: Standalone function invocation (\`fn()\`) -> \`globalThis\` (or \`undefined\` in strict mode).
2. **Implicit Binding**: Method call on an object (\`obj.fn()\`) -> \`obj\`.
3. **Explicit Binding**: Using \`call()\`, \`apply()\`, or \`bind()\` -> specified context object.
   - \`fn.call(context, arg1, arg2)\`: Calls function immediately with listed arguments.
   - \`fn.apply(context, [arg1, arg2])\`: Calls function immediately with array of arguments.
   - \`fn.bind(context, arg1)\`: Returns a new function permanently bound to the context.
4. **\`new\` Binding**: Constructor invocation (\`new Fn()\`) -> newly created instance object.
5. **Arrow Functions**: Ignores all 4 rules and inherits \`this\` from its enclosing lexical environment.`,
            syntax: `const boundFunction = originalFn.bind(customContext);
originalFn.call(customContext, arg1, arg2);
originalFn.apply(customContext, [arg1, arg2]);`,
            codeExample: `// "this" Binding Mechanics Demo
const teacher = {
  name: "Dr. Arvind",
  subject: "Computer Science",
  greet(greeting, punctuation) {
    return \`\${greeting}, I am \${this.name}, teaching \${this.subject}\${punctuation}\`;
  }
};

const student = {
  name: "Pooja",
  subject: "Algorithms"
};

// 1. Implicit Binding
console.log("Implicit:", teacher.greet("Hello", "!"));

// 2. Explicit Binding via .call()
console.log("Via .call():", teacher.greet.call(student, "Hi", "."));

// 3. Explicit Binding via .apply()
console.log("Via .apply():", teacher.greet.apply(student, ["Welcome", "!!"]));

// 4. Explicit Binding via .bind()
const studentGreet = teacher.greet.bind(student, "Namaste");
console.log("Via .bind():", studentGreet("!"));

// 5. Arrow Function Lexical Context vs Normal Function
const logger = {
  label: "AUDIT_LOG",
  normalFunc: function() {
    return \`Normal: \${this.label}\`;
  },
  arrowFunc: () => {
    // Inherits global/module this
    return \`Arrow: \${typeof this.label}\`;
  }
};

console.log(logger.normalFunc());
console.log(logger.arrowFunc());
`,
            expectedOutput: `Implicit: Hello, I am Dr. Arvind, teaching Computer Science!
Via .call(): Hi, I am Pooja, teaching Algorithms.
Via .apply(): Welcome, I am Pooja, teaching Algorithms!!
Via .bind(): Namaste, I am Pooja, teaching Algorithms!
Normal: AUDIT_LOG
Arrow: undefined`,
            keyTakeaways: [
              '`this` is dynamic and defined when the function is called, not when declared (unless using arrow functions).',
              '`bind` creates a permanent binding that cannot be overridden by subsequent `call` or `apply` calls.',
              'Arrow functions are ideal for callback functions passed to `setTimeout` or event listeners where you want to keep the outer `this`.',
            ],
            bestPractices: [
              'Do not use arrow functions for object methods if you need access to the object via `this`.',
            ],
            commonPitfalls: [
              'Extracting a method from an object (`const greet = obj.greet; greet()`) loses its implicit `this` binding.',
            ],
            compilerLanguage: 'javascript',
          },
        ],
      },

      // ----------------------------------------
      // SECTION 3: ADVANCED ARCHITECTURE & SYSTEMS
      // ----------------------------------------
      {
        id: 'js-advanced',
        title: '3. Asynchronous Internals, OOP & Advanced Engineering (Advanced)',
        level: 'advanced',
        description: 'The Event Loop, Promises, async/await, Prototypes & Classes, Web APIs, Streams, Memory Management, and Design Patterns.',
        topics: [
          {
            id: 'js-event-loop',
            title: 'The Event Loop, Microtasks & Macrotasks',
            level: 'advanced',
            summary: 'Master the V8 runtime queue priority: Call Stack -> Microtask Queue (Promises, queueMicrotask) -> Macrotask Queue (setTimeout, I/O).',
            concept: `The **Event Loop** is the concurrency model powering JavaScript's non-blocking I/O.

### The Execution Lifecycle:
1. **Call Stack**: Synchronous code executes first to completion (Run-to-completion model).
2. **Microtask Queue** (Highest Priority):
   - Handled immediately when Call Stack is empty, BEFORE rendering or macrotasks.
   - Includes: \`Promise.then / catch / finally\`, \`async/await\`, \`queueMicrotask()\`, \`MutationObserver\`.
   - The engine drains the **ENTIRE** microtask queue before moving to any macrotask.
3. **Macrotask Queue (Task Queue)**:
   - Includes: \`setTimeout\`, \`setInterval\`, \`setImmediate\`, I/O, UI rendering events.
   - One macrotask is processed per turn of the event loop.`,
            syntax: `// Priority comparison
console.log("Sync");
setTimeout(() => console.log("Macrotask"), 0);
Promise.resolve().then(() => console.log("Microtask"));`,
            codeExample: `// Event Loop Priority Execution Flow
console.log("1. Synchronous Start");

// Macrotask 1
setTimeout(() => {
  console.log("6. Timeout Callback (Macrotask Queue)");
}, 0);

// Microtask 1
Promise.resolve().then(() => {
  console.log("3. Promise Resolved 1 (Microtask Queue)");
}).then(() => {
  console.log("4. Promise Resolved 2 (Microtask Chained)");
});

// Microtask 2
queueMicrotask(() => {
  console.log("5. Explicit queueMicrotask (Microtask Queue)");
});

console.log("2. Synchronous End");
`,
            expectedOutput: `1. Synchronous Start
2. Synchronous End
3. Promise Resolved 1 (Microtask Queue)
4. Promise Resolved 2 (Microtask Chained)
5. Explicit queueMicrotask (Microtask Queue)
6. Timeout Callback (Macrotask Queue)`,
            keyTakeaways: [
              'All synchronous code finishes first.',
              'Microtasks run immediately after synchronous execution and ALWAYS drain completely before macrotasks execute.',
              '`setTimeout(fn, 0)` does not execute immediately; it waits until the stack and all microtasks are clear.',
            ],
            bestPractices: [
              'Use `queueMicrotask()` when you need asynchronous execution before UI re-render without the timer overhead of `setTimeout`.',
            ],
            commonPitfalls: [
              'An infinite loop in microtasks (e.g. recursive Promise resolution) will starve the Event Loop and freeze the UI thread.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-promises-async-await',
            title: 'Promises, Async/Await & Combinators (all, allSettled, race, any)',
            level: 'advanced',
            summary: 'Master Promise states, error handling, sequential vs parallel execution, and all 4 modern Promise combinators.',
            concept: `A **Promise** is an object representing the eventual completion (or failure) of an asynchronous operation.

### States:
- \`Pending\` -> \`Fulfilled\` (with value) OR \`Rejected\` (with reason).

### Modern Combinators:
1. **\`Promise.all([p1, p2])\`**: Fulfills when ALL fulfill; rejects immediately on the FIRST rejection (Fail-fast).
2. **\`Promise.allSettled([p1, p2])\`**: Waits for all to finish, returning \`{ status: 'fulfilled' | 'rejected', value/reason }\`. Never rejects.
3. **\`Promise.race([p1, p2])\`**: Settles as soon as the first promise settles (fulfills or rejects).
4. **\`Promise.any([p1, p2])\`**: Fulfills as soon as the first promise fulfills. Rejects only if ALL reject (\`AggregateError\`).`,
            syntax: `const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);
const results = await Promise.allSettled([task1(), task2()]);`,
            codeExample: `// Promise Combinators & Async/Await Demo
const delay = (ms, value, shouldFail = false) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      shouldFail ? reject(new Error(\`Failed: \${value}\`)) : resolve(value);
    }, ms);
  });

async function runAsyncOperations() {
  console.log("=== 1. Parallel Execution with Promise.all ===");
  const start = Date.now();
  
  const [fast, medium] = await Promise.all([
    delay(50, "Fast Service Data"),
    delay(80, "Medium Service Data")
  ]);
  
  console.log("Fetched:", fast, "&", medium);
  console.log(\`Execution time: \${Date.now() - start}ms (ran in parallel)\\n\`);

  console.log("=== 2. Resilient Execution with Promise.allSettled ===");
  const results = await Promise.allSettled([
    delay(20, "User Auth: SUCCESS"),
    delay(40, "Billing API", true), // Fails
    delay(30, "Analytics: SUCCESS")
  ]);

  results.forEach((res, i) => {
    if (res.status === "fulfilled") {
      console.log(\`Task \${i + 1}: ✓ \${res.value}\`);
    } else {
      console.log(\`Task \${i + 1}: ✗ \${res.reason.message}\`);
    }
  });
}

runAsyncOperations();
`,
            expectedOutput: `=== 1. Parallel Execution with Promise.all ===
Fetched: Fast Service Data & Medium Service Data
Execution time: ~80ms (ran in parallel)

=== 2. Resilient Execution with Promise.allSettled ===
Task 1: ✓ User Auth: SUCCESS
Task 2: ✗ Failed: Billing API
Task 3: ✓ Analytics: SUCCESS`,
            keyTakeaways: [
              'Use `Promise.all` when all operations are mutually dependent; use `Promise.allSettled` when partial success is acceptable.',
              '`async/await` is syntactic sugar over Promises, making asynchronous code read like synchronous logic.',
              'Always wrap `await` calls in `try...catch` blocks or attach `.catch()` handlers.',
            ],
            bestPractices: [
              'Do not execute independent promises sequentially with back-to-back `await`; trigger them in parallel with `Promise.all()`.',
            ],
            commonPitfalls: [
              'Forgetting that `async` functions always return a Promise, even if you return a plain primitive value.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-oop-prototypes',
            title: 'Prototypes, Prototype Chain & ES6 Classes with Private Fields',
            level: 'advanced',
            summary: 'Deep dive into prototypal inheritance, Object.create, ES6 class syntax, inheritance (extends/super), static methods, and #private fields.',
            concept: `JavaScript uses **Prototypal Inheritance** rather than classical inheritance. Every object has an internal \`[[Prototype]]\` link accessible via \`Object.getPrototypeOf(obj)\`.

### Modern ES6+ Classes:
- Classes are syntactic sugar over prototype chains.
- **Private Fields (\`#field\`)**: Enforced at the compiler/engine level. Inaccessible outside the class body.
- **Static Methods (\`static\`)**: Attached to the class constructor function itself, not to instances.
- **Inheritance (\`extends\` / \`super\`)\**: Passes prototype chain down to derived class.`,
            syntax: `class User {
  #passwordHash; // Private field
  constructor(username, password) {
    this.username = username;
    this.#passwordHash = this.#hash(password);
  }
  #hash(pwd) { return "hash_" + pwd; }
}`,
            codeExample: `// ES6 Classes with Encapsulation & Inheritance
class Account {
  #apiKey; // True Private Field (ES2022)
  static totalAccounts = 0;

  constructor(owner, initialBalance = 0, apiKey = "sec_default") {
    this.owner = owner;
    this.balance = initialBalance;
    this.#apiKey = apiKey;
    Account.totalAccounts++;
  }

  deposit(amount) {
    this.balance += amount;
    return this.balance;
  }

  // Private method
  #authenticate() {
    return this.#apiKey.startsWith("sec_");
  }

  transfer(targetAccount, amount) {
    if (!this.#authenticate()) throw new Error("Authentication failed");
    if (this.balance < amount) return "Insufficient funds";
    
    this.balance -= amount;
    targetAccount.deposit(amount);
    return \`Transferred $\${amount} to \${targetAccount.owner}. New balance: $\${this.balance}\`;
  }

  static getPlatformStats() {
    return \`Active System Accounts: \${Account.totalAccounts}\`;
  }
}

// Subclass / Inheritance
class PremiumAccount extends Account {
  constructor(owner, initialBalance, cashbackRate = 0.02) {
    super(owner, initialBalance, "sec_premium_tier");
    this.cashbackRate = cashbackRate;
  }

  deposit(amount) {
    const bonus = amount * this.cashbackRate;
    super.deposit(amount + bonus);
    console.log(\`[Cashback Applied] Bonus: $\${bonus}\`);
    return this.balance;
  }
}

const acc1 = new Account("Alice", 1000);
const acc2 = new PremiumAccount("Bob", 500, 0.05);

acc2.deposit(200); // 200 + 5% bonus = 210
console.log(acc1.transfer(acc2, 300));
console.log("Alice Balance: $" + acc1.balance);
console.log("Bob Balance: $" + acc2.balance);
console.log(Account.getPlatformStats());
`,
            expectedOutput: `[Cashback Applied] Bonus: $10
Transferred $300 to Bob. New balance: $700
Alice Balance: $700
Bob Balance: $1010
Active System Accounts: 2`,
            keyTakeaways: [
              'Private fields `#field` cannot be accessed, inspected, or deleted from outside the class instance.',
              '`super()` must be called in derived class constructors before accessing `this`.',
              'Static methods are called on the class itself (`Account.getPlatformStats()`), not on instances.',
            ],
            bestPractices: [
              'Favor composition over deep inheritance hierarchies.',
              'Use private fields (`#`) instead of naming conventions like `_privateVariable`.',
            ],
            commonPitfalls: [
              'Attempting to access `#field` dynamically via bracket notation `this["#field"]` will fail with syntax errors.',
            ],
            compilerLanguage: 'javascript',
          },
          {
            id: 'js-performance-memory',
            title: 'Memory Management, Garbage Collection & Optimization Patterns',
            level: 'advanced',
            summary: 'Learn how Mark-and-Sweep garbage collection works, avoiding memory leaks with WeakMap/WeakSet, debouncing, and throttling.',
            concept: `### 1. Memory Management & Garbage Collection
- Modern engines use **Mark-and-Sweep**: Root objects (global, call stack) are traversed; unreached memory is reclaimed.
- **WeakMap / WeakSet**: Hold "weak" object references that do not prevent garbage collection when the object has no other references.

### 2. Rate-Limiting Performance Utilities:
- **Debounce**: Delays execution until a specified quiet period has elapsed (search inputs, resize).
- **Throttle**: Guarantees execution at most once per specified time window (scroll handlers, game loops).`,
            syntax: `// Debounce implementation
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}`,
            codeExample: `// Debounce & Throttle Implementation Demo
function debounce(fn, delayMs) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delayMs);
  };
}

function throttle(fn, limitMs) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limitMs) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

// Simulation
console.log("=== Rate-Limiting Demonstration ===");

let searchQueries = [];
const executeSearch = (term) => {
  searchQueries.push(term);
  console.log("Executed Search for:", term);
};

const debouncedSearch = debounce(executeSearch, 100);

// Rapid keystrokes:
debouncedSearch("react");
debouncedSearch("react hooks");
debouncedSearch("react hooks guide"); // Only this final call executes after 100ms

setTimeout(() => {
  console.log("Debounce Test Completed. Total DB queries triggered:", searchQueries.length);
}, 200);
`,
            expectedOutput: `=== Rate-Limiting Demonstration ===
Executed Search for: react hooks guide
Debounce Test Completed. Total DB queries triggered: 1`,
            keyTakeaways: [
              'Debouncing consolidates multiple sequential calls into a single execution at the end of the idle window.',
              'Throttling enforces a steady, capped rate of execution regardless of trigger frequency.',
              'Use `WeakMap` for caching metadata associated with DOM nodes or objects without creating memory leaks.',
            ],
            bestPractices: [
              'Always clear timers, intervals, and observers in unmount / teardown lifecycles.',
            ],
            commonPitfalls: [
              'Attaching unthrottled event listeners to `window.onscroll` or `window.onresize` can cause severe UI frame drops.',
            ],
            compilerLanguage: 'javascript',
          },
        ],
      },
    ],
  },

  // ==========================================
  // PYTHON TRACK
  // ==========================================
  {
    id: 'python',
    title: 'Python 3 Modern Reference & Scripting',
    shortTitle: 'Python 3.12+',
    category: 'Backend & Data',
    description: 'Comprehensive Python scripting documentation covering data structures, list comprehensions, decorators, generators, OOP, and async IO.',
    iconName: 'Terminal',
    accentColor: '#3776AB',
    version: 'Python 3.12 Standard',
    compilerLanguage: 'python',
    sections: [
      {
        id: 'py-fundamentals',
        title: '1. Python Fundamentals & Data Structures',
        level: 'beginner',
        description: 'Variables, dynamic typing, lists, dictionaries, tuples, sets, and control structures.',
        topics: [
          {
            id: 'py-basics',
            title: 'Data Types, List Comprehensions & Dictionaries',
            level: 'beginner',
            summary: 'Master lists, dicts, unpacking, slicing, and idiomatic list/dict comprehensions in Python.',
            concept: `Python emphasizes clean readability and powerful built-in data structures.

Key Features:
- **List Comprehensions**: \`[x**2 for x in range(10) if x % 2 == 0]\`
- **Dictionary Comprehensions**: \`{k: v for k, v in zip(keys, values)}\`
- **F-Strings**: \`f"User {name} has {score} points"\`
- **Multiple Assignment & Unpacking**: \`a, *middle, b = [1, 2, 3, 4, 5]\``,
            syntax: `# Python List & Dict Comprehension
squares = [x**2 for x in range(10) if x % 2 == 0]
user_map = {u["id"]: u["name"] for u in users}`,
            codeExample: `# Python 3 Modern Scripting Demo
students = [
    {"name": "Aarav", "marks": 88, "track": "Full Stack"},
    {"name": "Diya", "marks": 94, "track": "AI/ML"},
    {"name": "Kabir", "marks": 76, "track": "Full Stack"},
    {"name": "Ananya", "marks": 99, "track": "Cloud"}
]

# 1. List Comprehension with Filter
top_scorers = [s["name"] for s in students if s["marks"] >= 90]
print(f"Top Scorers (>=90): {top_scorers}")

# 2. Dictionary Comprehension
grade_book = {s["name"]: ("A+" if s["marks"] >= 90 else "B") for s in students}
print(f"Grade Book: {grade_book}")

# 3. Unpacking
first, *middle, last = [10, 20, 30, 40, 50]
print(f"First: {first}, Middle items: {middle}, Last: {last}")
`,
            expectedOutput: `Top Scorers (>=90): ['Diya', 'Ananya']
Grade Book: {'Aarav': 'B', 'Diya': 'A+', 'Kabir': 'B', 'Ananya': 'A+'}
First: 10, Middle items: [20, 30, 40], Last: 50`,
            keyTakeaways: [
              'List and dictionary comprehensions are more concise and frequently faster than equivalent `for` loops.',
              'F-Strings `f"..."` evaluate expressions inline with formatting specifiers.',
            ],
            bestPractices: [
              'Use `.get(key, default)` when accessing dictionaries with nullable keys.',
            ],
            commonPitfalls: [
              'Using mutable default arguments like `def append_to(item, list=[])` persists state across calls. Use `list=None` instead.',
            ],
            compilerLanguage: 'python',
          },
        ],
      },
    ],
  },

  // ==========================================
  // TYPESCRIPT TRACK
  // ==========================================
  {
    id: 'typescript',
    title: 'TypeScript Type Systems & Generics',
    shortTitle: 'TypeScript 5.x',
    category: 'Type Safety & Architecture',
    description: 'Master strict type systems, generics, utility types (Partial, Omit, Pick), union narrowing, and type inference.',
    iconName: 'FileCode',
    accentColor: '#3178C6',
    version: 'TypeScript 5.7+',
    compilerLanguage: 'typescript',
    sections: [
      {
        id: 'ts-core',
        title: '1. Interfaces, Generics & Discriminated Unions',
        level: 'intermediate',
        description: 'Type aliases vs interfaces, generic constraints, keyof, and pattern matching.',
        topics: [
          {
            id: 'ts-generics',
            title: 'Generics, Constraints & Utility Types',
            level: 'intermediate',
            summary: 'Build reusable type-safe functions, generic repositories, and utility transformations.',
            concept: `Generics enable creating reusable components that operate over a variety of types while preserving complete type safety.

\`\`\`typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: string;
}
\`\`\``,
            syntax: `function wrapInEnvelope<T>(payload: T): { data: T; timestamp: number } {
  return { data: payload, timestamp: Date.now() };
}`,
            codeExample: `// TypeScript Generics & Type-Safe Result Handling
interface SuccessState<T> {
  status: "success";
  data: T;
}

interface ErrorState {
  status: "error";
  message: string;
  code: number;
}

type AsyncResult<T> = SuccessState<T> | ErrorState;

function handleResult<T>(result: AsyncResult<T>): string {
  // Discriminated union narrowing:
  if (result.status === "success") {
    return \`Success! Output: \${JSON.stringify(result.data)}\`;
  }
  return \`Error [\${result.code}]: \${result.message}\`;
}

console.log(handleResult({ status: "success", data: { userId: "U-123", credits: 500 } }));
console.log(handleResult({ status: "error", message: "Rate limit exceeded", code: 429 }));
`,
            expectedOutput: `Success! Output: {"userId":"U-123","credits":500}
Error [429]: Rate limit exceeded`,
            keyTakeaways: [
              'Discriminated unions with a common literal field (like `status`) allow TypeScript to narrow types automatically inside conditional branches.',
            ],
            bestPractices: [
              'Avoid using `any`; prefer `unknown` when the type is truly dynamic, then narrow it with type guards.',
            ],
            commonPitfalls: [
              'Using non-null assertion `!` indiscriminately bypasses compile-time checks and can cause runtime null exceptions.',
            ],
            compilerLanguage: 'typescript',
          },
        ],
      },
    ],
  },
];
