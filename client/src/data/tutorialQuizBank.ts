import { ITutorialQuiz, TUTORIAL_TRACKS } from './tutorialDocumentation';

export interface IQuizBankItem extends ITutorialQuiz {
  id?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

// ============================================================================
// TOPIC SPECIFIC QUESTION BANKS (Each having 10+ verified interview questions)
// ============================================================================

export const QUIZ_BANK_DATA: Record<string, IQuizBankItem[]> = {
  // --------------------------------------------------------------------------
  // DSA: Sliding Window & Two Pointers
  // --------------------------------------------------------------------------
  'sliding-window': [
    {
      question: 'What is the primary advantage of the Sliding Window technique over brute-force nested loops in subarray problems?',
      options: [
        'It converts O(N^2) quadratic time complexity into O(N) linear time by reusing overlapping subproblem state.',
        'It eliminates space complexity to O(log N).',
        'It sorts the input array automatically before processing.',
        'It works only for non-contiguous subsequences.',
      ],
      correctIndex: 0,
      explanation: 'Sliding Window maintains a running window sum/state by adding the incoming right element and subtracting the outgoing left element, achieving O(N) linear time.',
    },
    {
      question: 'In the Two-Pointer technique for finding a target sum in a sorted array, what should you do if current_sum > target?',
      options: [
        'Increment the left pointer (left++)',
        'Decrement the right pointer (right--)',
        'Reset both pointers to the center',
        'Sort the array again in reverse',
      ],
      correctIndex: 1,
      explanation: 'Because the array is sorted in ascending order, decrementing the right pointer reduces the sum towards the target.',
    },
    {
      question: 'What is the time and space complexity of finding the Longest Substring Without Repeating Characters using Sliding Window with a Hash Set/Map?',
      options: [
        'Time: O(N^2), Space: O(N)',
        'Time: O(N), Space: O(min(N, M)) where M is the charset size',
        'Time: O(N log N), Space: O(1)',
        'Time: O(N!), Space: O(N)',
      ],
      correctIndex: 1,
      explanation: 'Each character is visited at most twice (by left and right pointers), giving O(N) time and O(min(N, M)) auxiliary space.',
    },
    {
      question: 'What is Floyd’s Cycle-Finding Algorithm (Tortoise and Hare) commonly used for?',
      options: [
        'Sorting linked lists in linear time',
        'Detecting cycles and loop start points in a linked list in O(N) time and O(1) space',
        'Finding minimum spanning trees in a graph',
        'Computing fast Fourier transforms',
      ],
      correctIndex: 1,
      explanation: 'Floyds Two-Pointer algorithm moves slow by 1 step and fast by 2 steps to detect cycles without any hash set memory overhead.',
    },
    {
      question: 'When should you choose a Dynamic Sized Sliding Window over a Fixed Size Sliding Window?',
      options: [
        'When the problem requires subarrays of exactly length k',
        'When the window size depends on satisfying an optimal condition (e.g. sum >= S or at most k distinct elements)',
        'Only when the array has negative numbers',
        'When sorting the array is impossible',
      ],
      correctIndex: 1,
      explanation: 'Dynamic sliding window expands right until a condition is met or violated, then contracts left to find the minimum/maximum valid length.',
    },
    {
      question: 'Can the standard Sliding Window with two pointers be applied directly to find the Maximum Subarray Sum with negative numbers?',
      options: [
        'Yes, sliding window works identically with negative numbers',
        'No, negative numbers break monotonicity so Kadane’s Algorithm or Prefix Sums + Hash Map must be used',
        'Yes, but only if the array is sorted first',
        'No, negative numbers are not allowed in any array algorithms',
      ],
      correctIndex: 1,
      explanation: 'Negative numbers invalidate window expansion monotonicity (adding an element might decrease the sum), so Kadane algorithm or prefix sum hash maps are needed.',
    },
    {
      question: 'In the "Container With Most Water" problem, why do we move the pointer pointing to the shorter height?',
      options: [
        'Because moving the taller line can never increase the area as width decreases and height is bounded by the shorter line',
        'Because the shorter line is always indexed at zero',
        'It is an arbitrary choice with no algorithmic reason',
        'Because moving the taller line increases the width',
      ],
      correctIndex: 0,
      explanation: 'Area is bounded by min(h[l], h[r]) * (r - l). Moving the taller pointer only decreases width without any possibility of increasing the constraining height.',
    },
    {
      question: 'What is the time complexity of the 3Sum problem using the Sorting + Two Pointers approach?',
      options: [
        'O(N^3)',
        'O(N log N)',
        'O(N^2)',
        'O(N)',
      ],
      correctIndex: 2,
      explanation: 'Sorting takes O(N log N). Then iterating each element and running two pointers takes O(N) per iteration, resulting in O(N^2) total time.',
    },
    {
      question: 'Which of the following problems is best solved using Fast and Slow pointers?',
      options: [
        'Finding the middle node of a singly linked list in a single pass',
        'Binary search on a 2D matrix',
        'Inverting a binary tree',
        'Breadth-first search on a directed graph',
      ],
      correctIndex: 0,
      explanation: 'When fast pointer moves 2 steps and slow pointer moves 1 step, slow reaches exactly the middle when fast reaches the end.',
    },
    {
      question: 'In Minimum Window Substring (Hard), what data structure is most effective for tracking target character frequencies in the current window?',
      options: [
        'A Stack',
        'A Hash Map or direct frequency array (int[128]) with a matched counter',
        'A Binary Search Tree',
        'A Priority Queue / Min Heap',
      ],
      correctIndex: 1,
      explanation: 'A frequency hash map or direct array allows O(1) checks for character counts, avoiding re-scanning the string on each window contraction.',
    },
  ],

  // --------------------------------------------------------------------------
  // PYTHON FUNDAMENTALS & DATA STRUCTURES
  // --------------------------------------------------------------------------
  'python': [
    {
      question: 'Which of the following is true about Python memory management?',
      options: [
        'Manual memory deallocation using free() is mandatory.',
        'Python uses reference counting combined with a generational cycle detector.',
        'Variables are fixed to memory locations statically at compile time.',
        'Python does not support dynamic object allocation.',
      ],
      correctIndex: 1,
      explanation: 'Python primarily uses reference counting for immediate cleanup and a generational garbage collector to resolve cyclic references.',
    },
    {
      question: 'What is the average time complexity for searching a key in a Python dictionary?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
      correctIndex: 2,
      explanation: 'Python dictionaries are implemented as highly optimized hash tables, providing O(1) amortized lookup and insert time.',
    },
    {
      question: 'What is the Global Interpreter Lock (GIL) in CPython?',
      options: [
        'A security lock preventing unauthorized network requests',
        'A mutex that allows only one native thread to execute Python bytecodes at a time',
        'A compiler optimization that speeds up multi-threaded loops',
        'A database lock for SQLite connections',
      ],
      correctIndex: 1,
      explanation: 'The GIL ensures thread safety by preventing multiple threads from executing CPython bytecodes concurrently in memory.',
    },
    {
      question: 'What is the difference between a Python list and a tuple?',
      options: [
        'Lists are mutable; tuples are immutable and hashable if their elements are immutable.',
        'Tuples can only store numbers; lists can store strings.',
        'Lists have lower memory consumption than tuples.',
        'Tuples cannot be indexed or sliced.',
      ],
      correctIndex: 0,
      explanation: 'Tuples are immutable, which gives them lower memory overhead and makes them valid dictionary keys and set members.',
    },
    {
      question: 'What does the `yield` keyword do in a Python function?',
      options: [
        'Terminates the program with an error code',
        'Pauses function execution and returns a generator object yielding values on demand',
        'Converts a function into an asynchronous coroutine',
        'Forces Python to allocate memory on the heap',
      ],
      correctIndex: 1,
      explanation: 'The `yield` keyword turns a function into a generator, producing values lazily without keeping the entire sequence in memory.',
    },
    {
      question: 'What is the output of `[x * 2 for x in range(5) if x % 2 == 0]` in Python?',
      options: [
        '[0, 4, 8]',
        '[0, 2, 4, 6, 8]',
        '[2, 6]',
        '[0, 1, 2, 3, 4]',
      ],
      correctIndex: 0,
      explanation: 'Range(5) produces 0, 1, 2, 3, 4. Even numbers are 0, 2, 4. Multiplying by 2 gives [0, 4, 8].',
    },
    {
      question: 'How does Python handle default mutable arguments like `def append_to(item, target=[])`?',
      options: [
        'A new list is created on every function invocation',
        'The default list is instantiated once at function definition time and shared across calls',
        'Python raises a SyntaxError at compile time',
        'The list is automatically cleared after function exit',
      ],
      correctIndex: 1,
      explanation: 'Default arguments are evaluated once when the function is defined, causing mutable objects like lists to persist modifications across calls.',
    },
    {
      question: 'Which built-in module should be used for high-performance array manipulations and CPU-bound parallel execution?',
      options: ['math and sys', 'multiprocessing and numpy', 'os and shutil', 'threading and turtle'],
      correctIndex: 1,
      explanation: 'The `multiprocessing` module bypasses the GIL by spawning separate processes, and NumPy provides vectorized C-level array speed.',
    },
    {
      question: 'What is the purpose of `__slots__` in a Python class?',
      options: [
        'To allow dynamic addition of attributes at runtime',
        'To restrict class attributes, eliminate `__dict__`, and dramatically reduce memory footprint',
        'To create slot machines in game development',
        'To enforce private variable encapsulation',
      ],
      correctIndex: 1,
      explanation: '__slots__ prevents the creation of dynamic __dict__ per instance, optimizing memory for millions of object instances.',
    },
    {
      question: 'What is the time complexity of the `.sort()` or `sorted()` method in Python?',
      options: [
        'O(N^2) using Quicksort',
        'O(N log N) using Timsort (adaptive merge and insertion sort)',
        'O(N) using Radix sort',
        'O(log N) using Binary sort',
      ],
      correctIndex: 1,
      explanation: 'Python uses Timsort, an adaptive stable sorting algorithm with O(N) best case and O(N log N) average and worst case.',
    },
  ],

  // --------------------------------------------------------------------------
  // JAVASCRIPT & TYPESCRIPT
  // --------------------------------------------------------------------------
  'javascript': [
    {
      question: 'In the JavaScript Event Loop, which queue takes priority after the Call Stack becomes empty?',
      options: [
        'Macrotask Queue (setTimeout, setInterval)',
        'Microtask Queue (Promise callbacks, queueMicrotask)',
        'Rendering Queue (requestAnimationFrame)',
        'I/O Callback Queue (fs.readFile)',
      ],
      correctIndex: 1,
      explanation: 'The Microtask Queue is completely drained immediately after the Call Stack empties, before any macrotask is executed.',
    },
    {
      question: 'What is the output of `console.log(typeof null)` in JavaScript?',
      options: ['"null"', '"undefined"', '"object"', '"boolean"'],
      correctIndex: 2,
      explanation: 'Due to a legacy bug in the initial JavaScript implementation where object type tags were 000, `typeof null` returns "object".',
    },
    {
      question: 'What is a closure in JavaScript?',
      options: [
        'A syntax construct for closing HTML tags',
        'A function that retains access to its lexical scope even when executed outside that scope',
        'A method to stop memory leaks in Node.js',
        'A strict mode directive',
      ],
      correctIndex: 1,
      explanation: 'A closure is the combination of a function bundled together with references to its surrounding lexical state (variables).',
    },
    {
      question: 'What is the difference between `==` and `===` in JavaScript?',
      options: [
        '`==` compares values with type coercion; `===` strictly checks both value and type without coercion.',
        '`===` is used only for comparing objects.',
        '`==` is faster than `===` because it skips type checks.',
        'They are completely identical in modern ECMAScript.',
      ],
      correctIndex: 0,
      explanation: '`===` checks strict equality without implicit type conversion, preventing unexpected bugs like `"" == 0`.',
    },
    {
      question: 'In TypeScript, what is the difference between `unknown` and `any`?',
      options: [
        '`any` disables all type checking; `unknown` is type-safe and requires type narrowing before performing operations.',
        '`unknown` can only store string values.',
        '`any` is deprecated in modern TypeScript.',
        '`unknown` does not support union types.',
      ],
      correctIndex: 0,
      explanation: '`unknown` represents any value but forces developers to use type checks (typeof, instanceof) before accessing properties or calling it.',
    },
    {
      question: 'What will `[1, 2, 3] + [4, 5, 6]` evaluate to in JavaScript?',
      options: [
        '[1, 2, 3, 4, 5, 6]',
        '"1,2,34,5,6"',
        'NaN',
        'TypeError',
      ],
      correctIndex: 1,
      explanation: 'The `+` operator coerces arrays into strings ("1,2,3" and "4,5,6") and concatenates them into "1,2,34,5,6".',
    },
    {
      question: 'What does `Promise.allSettled()` do compared to `Promise.all()`?',
      options: [
        'Rejects immediately if any promise fails',
        'Waits for all promises to settle (either fulfilled or rejected) and returns an array of result objects',
        'Runs only the first promise that resolves',
        'Executes promises in sequential order instead of parallel',
      ],
      correctIndex: 1,
      explanation: '`Promise.allSettled()` never short-circuits on rejection, returning outcomes for every promise.',
    },
    {
      question: 'How do you prevent an object from having new properties added while allowing modification of existing ones in JavaScript?',
      options: ['Object.freeze()', 'Object.seal()', 'Object.preventExtensions()', 'Object.lock()'],
      correctIndex: 1,
      explanation: 'Object.seal() prevents adding or deleting properties, but existing writable properties can still be modified. (Object.freeze makes it completely read-only).',
    },
    {
      question: 'What is the purpose of TypeScript Generics?',
      options: [
        'To generate random dummy data for unit tests',
        'To create reusable components and functions that work over a variety of types while retaining type safety',
        'To compile TypeScript to WebAssembly',
        'To automatically serialize JSON responses',
      ],
      correctIndex: 1,
      explanation: 'Generics (e.g. `Array<T>`, `Promise<T>`) enable flexible, reusable functions and classes without losing static type checking.',
    },
    {
      question: 'What does the `debouncing` technique achieve in front-end performance?',
      options: [
        'Delays function execution until a specified delay has elapsed since the last time the event was triggered',
        'Executes a function at a fixed rate regardless of event triggers',
        'Compresses JavaScript assets before transmission',
        'Encrypts API tokens in localStorage',
      ],
      correctIndex: 0,
      explanation: 'Debouncing ensures heavy operations (e.g. search suggestions, resize handlers) only fire once after the user stops typing or triggering events.',
    },
  ],

  // --------------------------------------------------------------------------
  // REACT & NEXT.JS
  // --------------------------------------------------------------------------
  'react': [
    {
      question: 'What is the primary purpose of the `useCallback` hook in React?',
      options: [
        'To cache the return value of an expensive calculation',
        'To memoize a callback function instance between renders to prevent unnecessary child re-renders',
        'To execute a function right before DOM layout occurs',
        'To subscribe to WebSocket connections',
      ],
      correctIndex: 1,
      explanation: '`useCallback` caches a function definition between renders, useful when passing callbacks to optimized child components relying on reference equality.',
    },
    {
      question: 'What is the difference between React Server Components (RSC) and standard Client Components in Next.js?',
      options: [
        'RSC render exclusively on the server, have zero client bundle impact, and can access backend databases directly.',
        'Client Components cannot use CSS styles.',
        'RSC support useState and useEffect hooks directly.',
        'Next.js only supports client-side rendering.',
      ],
      correctIndex: 0,
      explanation: 'Server components execute on the server with zero client JavaScript bundle size, while Client components (`"use client"`) handle browser interactivity.',
    },
    {
      question: 'Why should you never modify state directly like `state.count = 5` in React?',
      options: [
        'React freezes state objects using Object.freeze()',
        'Direct mutations bypass React scheduler and will not trigger a component re-render',
        'It causes an immediate memory leak in the browser',
        'It alters the virtual DOM without browser permission',
      ],
      correctIndex: 1,
      explanation: 'React compares previous and new state by reference. Direct mutation does not trigger the reconciliation pipeline or re-render.',
    },
    {
      question: 'What is the Virtual DOM in React and why is it used?',
      options: [
        'A browser extension that optimizes DOM trees',
        'A lightweight in-memory JavaScript representation of the real DOM used for batching and efficient diffing',
        'A direct C++ binding to the V8 engine',
        'A CSS rendering engine',
      ],
      correctIndex: 1,
      explanation: 'React diffs the Virtual DOM (Reconciliation) and computes the minimal set of real DOM mutations needed, improving UI performance.',
    },
    {
      question: 'When does the cleanup function returned by `useEffect` run?',
      options: [
        'Only when the browser tab is closed',
        'Before the component unmounts and before re-running the effect on dependency change',
        'Immediately after initial render completes',
        'Every time the user clicks on the page',
      ],
      correctIndex: 1,
      explanation: 'The cleanup function executes before the effect runs again (to clean up subscriptions/timers) and when the component unmounts.',
    },
    {
      question: 'What does the `key` prop do when rendering lists in React?',
      options: [
        'Encrypts the element data for security',
        'Helps React identify which items have changed, been added, or been removed during reconciliation',
        'Assigns a database primary key to the DOM node',
        'Applies CSS keyframe animations',
      ],
      correctIndex: 1,
      explanation: 'Keys provide stable identity across renders, allowing React to match existing DOM nodes and minimize unnecessary remounts.',
    },
    {
      question: 'What problem does the `useRef` hook solve that `useState` does not?',
      options: [
        'useRef stores mutable values without causing component re-renders when updated',
        'useRef allows storing asynchronous Promise instances',
        'useRef works only with SVG canvas graphics',
        'useRef encrypts state data in memory',
      ],
      correctIndex: 0,
      explanation: 'Updating a ref (`ref.current = value`) does not trigger a re-render, making it ideal for timers, DOM node access, and previous values.',
    },
    {
      question: 'In Next.js App Router, how do you handle metadata like page title and description for SEO?',
      options: [
        'By manually injecting document.title in useEffect',
        'By exporting a static `metadata` object or dynamic `generateMetadata` function from page.tsx',
        'By creating an external index.html file in the public directory',
        'By writing a custom Webpack plugin',
      ],
      correctIndex: 1,
      explanation: 'Next.js provides built-in SEO metadata support via `export const metadata = { title: "..." }` or `generateMetadata()`.',
    },
    {
      question: 'What is React Context designed for?',
      options: [
        'Replacing relational databases like PostgreSQL',
        'Passing data through the component tree without having to pass props down manually at every level (Prop Drilling)',
        'Managing local component form inputs',
        'Handling multi-threaded background workers',
      ],
      correctIndex: 1,
      explanation: 'React Context provides global or scoped state sharing (e.g. theme, auth user, language) without prop drilling through intermediate components.',
    },
    {
      question: 'What is the purpose of React Suspense?',
      options: [
        'To pause execution and terminate infinite loops',
        'To display a fallback UI (e.g. skeleton or spinner) while child components load asynchronous data or code',
        'To handle unhandled JavaScript exceptions',
        'To freeze the user interface during payment processing',
      ],
      correctIndex: 1,
      explanation: 'Suspense lets components wait for something (like code splitting or data fetching) before rendering, showing an accessible fallback UI in the interim.',
    },
  ],

  // --------------------------------------------------------------------------
  // SQL & DATABASES
  // --------------------------------------------------------------------------
  'sql': [
    {
      question: 'What is the key difference between `WHERE` and `HAVING` in SQL?',
      options: [
        '`WHERE` filters rows before aggregation; `HAVING` filters aggregated groups after `GROUP BY`.',
        '`HAVING` is only supported in MySQL and not PostgreSQL.',
        '`WHERE` can only be used with primary keys.',
        'They are identical aliases for the same operation.',
      ],
      correctIndex: 0,
      explanation: '`WHERE` filters individual table rows prior to grouping, whereas `HAVING` applies conditions to grouped aggregate results (e.g. COUNT(*) > 5).',
    },
    {
      question: 'What does an `INNER JOIN` return in SQL?',
      options: [
        'All records from the left table and matched from the right',
        'Only records that have matching values in both joined tables',
        'The Cartesian product of all rows',
        'All rows from both tables including nulls',
      ],
      correctIndex: 1,
      explanation: 'An INNER JOIN selects rows that satisfy the join condition in both tables.',
    },
    {
      question: 'What are ACID properties in database transactions?',
      options: [
        'Atomicity, Consistency, Isolation, Durability',
        'Authentication, Cipher, Integrity, Defense',
        'Asynchronous, Cached, Indexed, Distributed',
        'Allocation, Clustering, IOPS, Defragmentation',
      ],
      correctIndex: 0,
      explanation: 'ACID guarantees reliable transactions: Atomicity (all-or-nothing), Consistency (rules preserved), Isolation (concurrent safety), Durability (persisted).',
    },
    {
      question: 'Why are B-Trees or B+Trees preferred for database table indexes over Binary Search Trees?',
      options: [
        'B-Trees have high fan-out, shallow depth, and minimize slow disk I/O block reads',
        'Binary Search Trees cannot store numeric data',
        'B-Trees eliminate the need for foreign keys',
        'B-Trees only work in memory without disk storage',
      ],
      correctIndex: 0,
      explanation: 'B+Trees have many keys per node (fanout of hundreds), allowing searching through millions of rows in only 3-4 disk block seeks.',
    },
    {
      question: 'What is the danger of `SELECT *` in production web applications?',
      options: [
        'It crashes the SQL database instantly',
        'It transfers unnecessary data over the network, increases memory usage, and prevents index-only scans (covering indexes)',
        'It prevents other users from inserting new rows',
        'It deletes unindexed rows automatically',
      ],
      correctIndex: 1,
      explanation: 'Querying all columns forces full row fetches, defeating covering index optimizations and causing network/memory bloat.',
    },
    {
      question: 'What is a SQL Injection vulnerability and how is it mitigated?',
      options: [
        'Malicious SQL concatenated into raw queries; mitigated using Parameterized Queries / Prepared Statements',
        'A hardware failure mitigated with RAID arrays',
        'A network DDoS attack mitigated with Cloudflare',
        'A memory buffer overflow mitigated with Rust',
      ],
      correctIndex: 0,
      explanation: 'Parameterized queries treat user input strictly as literals rather than executable SQL code, preventing SQL injection completely.',
    },
    {
      question: 'What does `EXPLAIN ANALYZE` do in PostgreSQL?',
      options: [
        'Shows query execution plan, estimated costs, and actual runtime execution times for each scan/join node',
        'Automatically rewrites the query to be 10x faster',
        'Backs up the database to S3',
        'Deletes duplicate rows in the table',
      ],
      correctIndex: 0,
      explanation: '`EXPLAIN ANALYZE` executes the statement and displays exact time spent on Sequential Scans, Index Scans, Hash Joins, and buffer usage.',
    },
    {
      question: 'What is database Normalization (up to 3NF)?',
      options: [
        'Organizing relational tables to minimize data redundancy and eliminate update/delete anomalies',
        'Converting SQL tables into NoSQL MongoDB documents',
        'Partitioning data across 3 separate server regions',
        'Compressing table files to save disk space',
      ],
      correctIndex: 0,
      explanation: 'Normalization divides large tables and links them with relationships to eliminate duplicate data and prevent inconsistencies.',
    },
    {
      question: 'What is the purpose of a Database Index?',
      options: [
        'To speed up data retrieval operations on a database table at the cost of additional storage and slower writes',
        'To encrypt passwords stored in user tables',
        'To automatically generate primary keys',
        'To convert SQL databases into graph databases',
      ],
      correctIndex: 0,
      explanation: 'Indexes create fast lookup data structures (like B-trees) enabling O(log N) queries instead of O(N) full table sequential scans.',
    },
    {
      question: 'What does `UNION ALL` do compared to `UNION` in SQL?',
      options: [
        '`UNION ALL` combines results and keeps duplicates (faster); `UNION` performs a sort/hash to remove duplicate rows.',
        '`UNION ALL` only joins integer columns.',
        '`UNION` is always faster than `UNION ALL`.',
        'They are exact synonyms in ANSI SQL.',
      ],
      correctIndex: 0,
      explanation: '`UNION` deduplicates the combined dataset which requires an expensive sort/unique step. `UNION ALL` simply concatenates result sets.',
    },
  ],

  // --------------------------------------------------------------------------
  // C++ & STL
  // --------------------------------------------------------------------------
  'cpp': [
    {
      question: 'What is the difference between `std::vector` and `std::list` in C++?',
      options: [
        '`std::vector` is a contiguous dynamic array with O(1) random access; `std::list` is a doubly-linked list with O(1) insertion/deletion once positioned.',
        '`std::list` allows O(1) random index access via `list[i]`.',
        '`std::vector` cannot be resized at runtime.',
        '`std::list` has better CPU cache locality than `std::vector`.',
      ],
      correctIndex: 0,
      explanation: '`std::vector` stores elements in contiguous memory giving superior cache locality and O(1) indexing. `std::list` has node pointers with pointer chasing overhead.',
    },
    {
      question: 'What does the RAII (Resource Acquisition Is Initialization) idiom ensure in C++?',
      options: [
        'Resources (memory, file handles, sockets) are tied to object lifetime and automatically released in destructors when leaving scope.',
        'All variables are initialized to zero at compile time.',
        'Pointers are automatically converted to integers.',
        'Programs run without needing a main function.',
      ],
      correctIndex: 0,
      explanation: 'RAII guarantees exception-safe resource cleanup because destructors are deterministically called when an object goes out of scope.',
    },
    {
      question: 'What is the difference between `std::unique_ptr` and `std::shared_ptr` in modern C++?',
      options: [
        '`unique_ptr` has exclusive ownership with zero overhead; `shared_ptr` maintains reference counting for shared ownership.',
        '`shared_ptr` is faster than `unique_ptr`.',
        '`unique_ptr` can be copied with the `=` assignment operator.',
        '`shared_ptr` can never cause circular reference memory leaks.',
      ],
      correctIndex: 0,
      explanation: '`unique_ptr` cannot be copied (move-only) and has zero runtime overhead. `shared_ptr` uses an atomic control block for reference counting.',
    },
    {
      question: 'What is a move constructor and `std::move` in C++11?',
      options: [
        'A mechanism to transfer ownership of resources from an rvalue object without expensive deep copying',
        'A method to animate graphical windows across monitors',
        'A keyword for moving code between namespaces',
        'An instruction to relocate memory between CPU cores',
      ],
      correctIndex: 0,
      explanation: 'Move semantics (`std::move` casts to rvalue reference `T&&`) allow stealing internal pointers/buffers from temporary objects without allocation.',
    },
    {
      question: 'What is the time complexity of searching for an element in `std::map` vs `std::unordered_map` in C++?',
      options: [
        '`std::map`: O(log N) (Red-Black Tree); `std::unordered_map`: O(1) average (Hash Table)',
        '`std::map`: O(1); `std::unordered_map`: O(log N)',
        '`std::map`: O(N); `std::unordered_map`: O(N^2)',
        'Both are always O(1) worst-case',
      ],
      correctIndex: 0,
      explanation: '`std::map` is ordered and backed by a self-balancing Red-Black BST (O(log N)). `std::unordered_map` uses hashing for O(1) average lookup.',
    },
    {
      question: 'What does the `virtual` keyword before a member function do in C++?',
      options: [
        'Enables dynamic dispatch (runtime polymorphism) via the Virtual Method Table (vtable)',
        'Compiles the function into machine code virtually without execution',
        'Makes the function private to the class',
        'Allows the function to be called without an object instance',
      ],
      correctIndex: 0,
      explanation: 'Declaring a function `virtual` tells the compiler to resolve calls dynamically at runtime based on the actual object type using a vtable.',
    },
    {
      question: 'Why should a base class destructor always be declared `virtual` if derived classes are deleted via base pointers?',
      options: [
        'To prevent undefined behavior and ensure derived class destructors are properly invoked, preventing resource leaks',
        'To speed up memory allocation',
        'It is required by the C++ syntax compiler',
        'To prevent copying of the base class',
      ],
      correctIndex: 0,
      explanation: 'Without a virtual destructor, deleting a derived object via a base pointer `Base* ptr = new Derived(); delete ptr;` only invokes the base destructor, leaking derived resources.',
    },
    {
      question: 'What is `std::string_view` in C++17 and why is it useful?',
      options: [
        'A non-owning view of a string buffer that eliminates allocations and copies during string slicing and parsing',
        'A GUI widget for rendering text on screen',
        'An encrypted string type for secure storage',
        'A multithreaded string buffer with mutex locks',
      ],
      correctIndex: 0,
      explanation: '`std::string_view` holds a pointer and length to an existing character sequence, avoiding expensive `std::string` heap allocations.',
    },
    {
      question: 'What is the output of `sizeof(int*)` on a 64-bit operating system in C++?',
      options: ['4 bytes', '8 bytes', '16 bytes', '2 bytes'],
      correctIndex: 1,
      explanation: 'On a 64-bit architecture, memory addresses are 64 bits wide, meaning any pointer (`int*`, `char*`, `void*`) is 8 bytes.',
    },
    {
      question: 'What is the purpose of `constexpr` in C++?',
      options: [
        'Instructs the compiler to evaluate functions or values at compile-time whenever possible, resulting in zero runtime cost',
        'Forces variables to be stored in the CPU cache',
        'Prevents variables from being modified in multi-threaded code',
        'Creates constant expressions for CSS styling',
      ],
      correctIndex: 0,
      explanation: '`constexpr` enables compile-time computations, moving work from runtime to compilation time and enabling true constants for array bounds and templates.',
    },
  ],

  // --------------------------------------------------------------------------
  // GENERAL FALLBACK QUESTIONS (High Yield CS & Software Engineering Concepts)
  // --------------------------------------------------------------------------
  'general': [
    {
      question: 'What does the CAP Theorem state for distributed data stores?',
      options: [
        'A distributed system can guarantee at most two of Consistency, Availability, and Partition Tolerance simultaneously.',
        'Computers, Algorithms, and Protocols must scale linearly.',
        'All database queries must finish within 100ms.',
        'Caching, Asynchrony, and Pipelining are required for microservices.',
      ],
      correctIndex: 0,
      explanation: 'Under network partitions (P), a distributed system must choose between remaining Consistent (C) or Available (A).',
    },
    {
      question: 'What is the primary difference between TCP and UDP protocols?',
      options: [
        'TCP is connection-oriented, reliable, and ordered; UDP is connectionless, faster, with no packet delivery guarantees.',
        'UDP is only used for text messages.',
        'TCP is wireless; UDP is wired.',
        'UDP guarantees packet ordering while TCP drops duplicate packets.',
      ],
      correctIndex: 0,
      explanation: 'TCP uses three-way handshakes and acknowledgments for reliable transmission. UDP broadcasts packets quickly without retransmission overhead.',
    },
    {
      question: 'What is the role of a Reverse Proxy (such as Nginx or Envoy)?',
      options: [
        'Sits in front of backend web servers to handle load balancing, SSL termination, caching, and rate limiting',
        'Compresses hard drive partitions',
        'Compiles backend source code to binary',
        'Scans codebases for syntax errors',
      ],
      correctIndex: 0,
      explanation: 'Reverse proxies intercept incoming client traffic and forward requests to private backend server instances, offering security and scalability.',
    },
    {
      question: 'What is the time complexity of Binary Search on a sorted array of size N?',
      options: ['O(log N)', 'O(N)', 'O(1)', 'O(N log N)'],
      correctIndex: 0,
      explanation: 'Binary search halves the search space at each iteration, resulting in O(log N) time.',
    },
    {
      question: 'What is the function of a Redis in-memory data store in modern system architecture?',
      options: [
        'High-performance distributed caching, session storage, and pub/sub message brokering with sub-millisecond latency',
        'Cold storage for long-term database backups',
        'Rendering 3D models in WebGL',
        'Managing cloud billing accounts',
      ],
      correctIndex: 0,
      explanation: 'Redis keeps data in RAM for lightning-fast reads/writes, shielding primary relational databases from high traffic loads.',
    },
    {
      question: 'What does Docker containerization provide compared to traditional Virtual Machines (VMs)?',
      options: [
        'Containers share the host OS kernel and are lightweight, starting in milliseconds with low memory overhead.',
        'Containers run a full guest operating system with a hypervisor.',
        'Containers cannot run Linux applications on Windows.',
        'Containers provide hardware-level emulation of CPU chips.',
      ],
      correctIndex: 0,
      explanation: 'Containers virtualize at the OS level using Linux cgroups and namespaces, avoiding the heavy hypervisor and guest OS overhead of VMs.',
    },
    {
      question: 'What is the difference between Symmetric and Asymmetric Encryption?',
      options: [
        'Symmetric encryption uses a single shared secret key; Asymmetric uses a public-private key pair (e.g. RSA, ECC).',
        'Asymmetric encryption is 1000x faster than symmetric encryption.',
        'Symmetric encryption does not require mathematical algorithms.',
        'Asymmetric encryption cannot be used in HTTPS.',
      ],
      correctIndex: 0,
      explanation: 'Symmetric encryption (AES) uses one key for both encryption and decryption. Asymmetric encryption uses public keys to encrypt and private keys to decrypt.',
    },
    {
      question: 'What is the purpose of Database Sharding?',
      options: [
        'Horizontally partitioning data across multiple physical database instances based on a shard key to scale writes and storage',
        'Converting database rows into CSV files',
        'Deleting outdated rows automatically',
        'Encrypting columns containing sensitive data',
      ],
      correctIndex: 0,
      explanation: 'Sharding distributes large datasets across multiple machines, overcoming single-node CPU, memory, and disk capacity limits.',
    },
    {
      question: 'What is the Big-O Space Complexity of Merge Sort?',
      options: [
        'O(N) auxiliary space needed for merging temporary subarrays',
        'O(1) in-place space',
        'O(N^2)',
        'O(log N)',
      ],
      correctIndex: 0,
      explanation: 'Standard Merge Sort allocates auxiliary array buffers of size N during the merge step, requiring O(N) additional memory.',
    },
    {
      question: 'What is CORS (Cross-Origin Resource Sharing) in web browsers?',
      options: [
        'A browser security mechanism that uses HTTP headers to restrict resources from being requested by a different origin/domain',
        'A technique for speeding up CSS animations',
        'A protocol for wireless Bluetooth communication',
        'A database clustering mechanism',
      ],
      correctIndex: 0,
      explanation: 'CORS prevents malicious websites from making unauthorized requests to your API on behalf of authenticated users via browser Same-Origin Policy.',
    },
  ],
};

// ============================================================================
// CUSTOM QUIZ OVERRIDES (ADMIN CONTROL) & QUIZ CATALOG ACCESS
// ============================================================================

const CUSTOM_QUIZZES_STORAGE_KEY = 'nec_custom_chapter_quizzes';

export interface ICustomChapterQuizRecord {
  questions: ITutorialQuiz[];
  timeLimitSeconds: number;
  lastUpdated: string;
}

export interface IChapterAssessmentSummary {
  id: string;
  trackId: string;
  trackTitle: string;
  trackShortTitle?: string;
  trackCategory?: string;
  trackIconName?: string;
  chapterId: string;
  chapterSlug: string;
  chapterTitle: string;
  title: string;
  description: string;
  timeLimit: number; // in minutes (e.g. 5)
  timeLimitSeconds: number;
  totalQuestions: number; // 10 questions
  passingScore: number; // 70%
  link: string;
  level?: string;
  isCustomized?: boolean;
}

export function getCustomChapterQuiz(chapterId: string): ICustomChapterQuizRecord | null {
  try {
    const raw = localStorage.getItem(CUSTOM_QUIZZES_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[chapterId] || null;
  } catch {
    return null;
  }
}

export function saveCustomChapterQuiz(
  chapterId: string,
  questions: ITutorialQuiz[],
  timeLimitSeconds: number = 300
): void {
  try {
    const raw = localStorage.getItem(CUSTOM_QUIZZES_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[chapterId] = {
      questions,
      timeLimitSeconds,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(CUSTOM_QUIZZES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save custom chapter quiz', e);
  }
}

export function resetCustomChapterQuiz(chapterId: string): void {
  try {
    const raw = localStorage.getItem(CUSTOM_QUIZZES_STORAGE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[chapterId];
    localStorage.setItem(CUSTOM_QUIZZES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to reset custom chapter quiz', e);
  }
}

export function getChapterQuizTimeLimit(chapterId?: string): number {
  if (chapterId) {
    const custom = getCustomChapterQuiz(chapterId);
    if (custom && custom.timeLimitSeconds > 0) {
      return custom.timeLimitSeconds;
    }
  }
  return 300; // default 5 minutes (300s)
}

/**
 * Returns at least 10 rich questions for any given tutorial chapter and track.
 * Ensures the user's requirement: "minimum 10 question do or time 5 min ka hona chaiye"
 * Checks admin-customized questions first.
 */
export function getChapterQuizQuestions(
  chapterId?: string,
  trackId?: string,
  baseQuiz?: ITutorialQuiz
): ITutorialQuiz[] {
  // 0. Check custom admin override first
  if (chapterId) {
    const custom = getCustomChapterQuiz(chapterId);
    if (custom && custom.questions && custom.questions.length > 0) {
      return custom.questions;
    }
  }

  const result: ITutorialQuiz[] = [];
  const seenQuestions = new Set<string>();

  // 1. Include base quiz question if defined
  if (baseQuiz && baseQuiz.question) {
    result.push(baseQuiz);
    seenQuestions.add(baseQuiz.question.trim().toLowerCase());
  }

  // 2. Resolve matching topic bank
  const trackKey = (trackId || '').toLowerCase();
  const chapterKey = (chapterId || '').toLowerCase();

  let targetList: IQuizBankItem[] = [];

  if (chapterKey.includes('sliding') || chapterKey.includes('two-pointer') || trackKey === 'dsa') {
    targetList = QUIZ_BANK_DATA['sliding-window'] || [];
  } else if (trackKey === 'python' || chapterKey.includes('python')) {
    targetList = QUIZ_BANK_DATA['python'] || [];
  } else if (trackKey === 'javascript' || trackKey === 'typescript' || chapterKey.includes('js') || chapterKey.includes('loop')) {
    targetList = QUIZ_BANK_DATA['javascript'] || [];
  } else if (trackKey === 'react' || chapterKey.includes('react') || chapterKey.includes('next')) {
    targetList = QUIZ_BANK_DATA['react'] || [];
  } else if (trackKey === 'sql' || chapterKey.includes('sql') || chapterKey.includes('db')) {
    targetList = QUIZ_BANK_DATA['sql'] || [];
  } else if (trackKey === 'cpp' || chapterKey.includes('cpp')) {
    targetList = QUIZ_BANK_DATA['cpp'] || [];
  } else {
    // Fallback to DSA or general bank
    targetList = [...(QUIZ_BANK_DATA['sliding-window'] || []), ...(QUIZ_BANK_DATA['general'] || [])];
  }

  // Add questions from targeted bank
  for (const q of targetList) {
    const key = q.question.trim().toLowerCase();
    if (!seenQuestions.has(key)) {
      seenQuestions.add(key);
      result.push({
        question: q.question,
        options: [...q.options],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      });
    }
  }

  // 3. If still less than 10, backfill from general bank
  if (result.length < 10) {
    const fallbackList = QUIZ_BANK_DATA['general'] || [];
    for (const q of fallbackList) {
      const key = q.question.trim().toLowerCase();
      if (!seenQuestions.has(key)) {
        seenQuestions.add(key);
        result.push({
          question: q.question,
          options: [...q.options],
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        });
      }
      if (result.length >= 10) break;
    }
  }

  // Always return at least 10 questions
  return result.slice(0, 10);
}

/**
 * Returns all Chapter Assessment summaries across all tutorial tracks for display in Quizzes page and Admin.
 */
export function getAllChapterAssessments(): IChapterAssessmentSummary[] {
  const list: IChapterAssessmentSummary[] = [];

  TUTORIAL_TRACKS.forEach((track) => {
    track.sections.forEach((section) => {
      section.chapters.forEach((chapter) => {
        const timeLimitSec = getChapterQuizTimeLimit(chapter.id);
        const questions = getChapterQuizQuestions(chapter.id, track.id, chapter.quiz);
        const custom = getCustomChapterQuiz(chapter.id);

        list.push({
          id: `chapter-assessment-${track.id}-${chapter.id}`,
          trackId: track.id,
          trackTitle: track.title,
          trackShortTitle: track.shortTitle,
          trackCategory: track.category,
          trackIconName: track.iconName,
          chapterId: chapter.id,
          chapterSlug: chapter.slug || chapter.id,
          chapterTitle: chapter.title,
          title: `${chapter.title} Assessment`,
          description: chapter.description || `10-question technical interview assessment covering ${chapter.title} in ${track.title}.`,
          timeLimit: Math.round(timeLimitSec / 60),
          timeLimitSeconds: timeLimitSec,
          totalQuestions: questions.length,
          passingScore: 70,
          link: `/tutorials?track=${track.id}&chapter=${chapter.slug || chapter.id}#chapter-quiz`,
          level: chapter.level || 'Intermediate',
          isCustomized: !!(custom && custom.questions && custom.questions.length > 0),
        });
      });
    });
  });

  return list;
}

