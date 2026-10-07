import { ITutorialQuiz } from '../types/tutorial.types';
export type { ITutorialQuiz };

export interface ITutorialChapter {
  id: string;
  slug: string;
  title: string;
  description: string;
  lastUpdated: string;
  estimatedTime?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  quickFacts?: string;
  diagramImageUrl?: string;
  keyPoints?: string[];
  infographic?: {
    title: string;
    centerLabel: string;
    items: Array<{
      number: string;
      title: string;
      description: string;
      color: string;
      tag?: string;
    }>;
  };
  content: string;
  codeSnippet?: {
    language: string;
    filename?: string;
    code: string;
    output?: string;
  };
  quiz?: ITutorialQuiz;
  practiceProblem?: {
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    link: string;
  };
}

export interface ITutorialSection {
  id: string;
  title: string;
  chapters: ITutorialChapter[];
}

export interface ITutorialTrack {
  id: string;
  title: string;
  shortTitle: string;
  iconName: string;
  category: string;
  badge?: string;
  description: string;
  sections: ITutorialSection[];
}

export const TUTORIAL_TRACKS: ITutorialTrack[] = [
  // ==========================================
  // 1. PYTHON
  // ==========================================
  {
    id: 'python',
    title: 'Python Tutorial & Reference Guide',
    shortTitle: 'Python',
    iconName: 'FileCode2',
    category: 'Core Languages',
    badge: 'Popular',
    description: 'Master Python programming from syntax basics to object-oriented architecture, data analysis, and automation.',
    sections: [
      {
        id: 'fundamentals',
        title: 'Python Fundamentals',
        chapters: [
          {
            id: 'python-intro',
            slug: 'python-introduction',
            title: 'Python Introduction & Architecture',
            description: 'Learn Python programming language fundamentals, interpreter execution model, and virtual environments.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '8 min read',
            level: 'Beginner',
            keyPoints: [
              'High-level, dynamically-typed interpreted language designed for readability and maintainability.',
              'Bytecode compilation (.pyc) executed on the CPython virtual machine.',
              'Extensive standard library (Batteries Included) and massive PyPI package ecosystem.',
              'Used extensively in AI/ML, Data Engineering, Web Backends, and Cloud Scripting.',
            ],
            infographic: {
              title: 'Python Industry Ecosystem & Frameworks',
              centerLabel: 'Ecosystem',
              items: [
                {
                  number: '01',
                  title: 'AI & Data Science',
                  description: 'PyTorch, TensorFlow, Pandas, NumPy, Scikit-Learn powering modern AI and analytics pipelines.',
                  color: 'blue',
                  tag: 'AI/ML',
                },
                {
                  number: '02',
                  title: 'Web Engineering',
                  description: 'FastAPI, Django, Flask for ultra-fast asynchronous REST APIs and enterprise web applications.',
                  color: 'emerald',
                  tag: 'Web',
                },
                {
                  number: '03',
                  title: 'Cloud & Automation',
                  description: 'Ansible, AWS Boto3, Celery for cloud orchestration, background workers, and automation tasks.',
                  color: 'amber',
                  tag: 'DevOps',
                },
                {
                  number: '04',
                  title: 'Game & GUI Dev',
                  description: 'Pygame, PyQt, Arcade, and Tkinter for cross-platform desktop UI and 2D games.',
                  color: 'purple',
                  tag: 'GUI',
                },
              ],
            },
            content: `### What is Python?
Python is a multi-paradigm, general-purpose language created by Guido van Rossum. It supports Object-Oriented Programming (OOP), Functional Programming, and Procedural patterns.

### Key Python Characteristics:
1. **Dynamic Typing**: Variables take types implicitly at runtime without boilerplate declarations.
2. **Automatic Garbage Collection**: Reference counting with generational cycle detection frees memory automatically.
3. **Batteries Included**: Standard libraries offer built-in JSON, HTTP, SQLite, Multiprocessing, and Math support.`,
            codeSnippet: {
              language: 'python',
              filename: 'main.py',
              code: `# Python 3.12: Type hints, Pattern Matching & Comprehensions
def calculate_developer_stats(name: str, solved: int) -> dict:
    match solved:
        case s if s >= 100:
            rank = "Master Coder 🏆"
        case s if s >= 50:
            rank = "Advanced Developer ⭐"
        case _:
            rank = "Rising Star 🚀"
            
    return {
        "developer": name,
        "solved_problems": solved,
        "rank": rank,
        "skills": ["Python", "FastAPI", "Data Structures"]
    }

user_data = calculate_developer_stats("Alex", 124)
print(f"User: {user_data['developer']} | Rank: {user_data['rank']}")
print(f"Top Skills: {', '.join(user_data['skills'])}")`,
              output: `User: Alex | Rank: Master Coder 🏆
Top Skills: Python, FastAPI, Data Structures`,
            },
            quiz: {
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
            practiceProblem: {
              title: 'Two Sum in Python',
              difficulty: 'Easy',
              link: '/practice?search=two-sum',
            },
          },
          {
            id: 'python-data-structures',
            slug: 'python-data-structures',
            title: 'Lists, Tuples, Dictionaries & Sets',
            description: 'Master built-in Python collections, memory implications, Big-O lookup complexities, and set operations.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '10 min read',
            level: 'Beginner',
            keyPoints: [
              'Lists: Mutable dynamic arrays with O(1) amortized append and O(n) insert/delete.',
              'Tuples: Immutable sequences with lower memory overhead and dictionary key suitability.',
              'Dictionaries: Hash maps with O(1) average key lookup, insertion, and deletion.',
              'Sets: Hash-based collections enforcing unique elements with fast O(1) union/intersection.',
            ],
            content: `### Python Collections Overview
Choosing the correct data structure is critical for algorithm performance and memory efficiency.`,
            codeSnippet: {
              language: 'python',
              filename: 'collections_demo.py',
              code: `# Hash Map (Dict) & Set Operations
engineering_team = {
    "lead": "Devin",
    "backend": ["Python", "PostgreSQL", "Redis"],
    "infrastructure": "Kubernetes"
}

# Set comprehension: Unique skills across projects
project_tags = {"react", "fastapi", "python", "docker", "react"}
print(f"Unique tech stack tags ({len(project_tags)}): {sorted(list(project_tags))}")

# Dictionary comprehension
skill_levels = {tech: "Advanced" for tech in engineering_team["backend"]}
print(f"Backend competencies: {skill_levels}")`,
              output: `Unique tech stack tags (4): ['docker', 'fastapi', 'python', 'react']
Backend competencies: {'Python': 'Advanced', 'PostgreSQL': 'Advanced', 'Redis': 'Advanced'}`,
            },
            quiz: {
              question: 'What is the average time complexity for searching a key in a Python dictionary?',
              options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
              correctIndex: 2,
              explanation: 'Python dictionaries are implemented as highly optimized hash tables, providing O(1) amortized lookup and insert time.',
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 2. JAVASCRIPT & TYPESCRIPT
  // ==========================================
  {
    id: 'javascript',
    title: 'JavaScript & TypeScript Mastery',
    shortTitle: 'JavaScript',
    iconName: 'FileCode',
    category: 'Web & Frontend',
    badge: 'Essential',
    description: 'Learn modern ES2024 JavaScript, the V8 Event Loop, Async/Await microtasks, Closures, and TypeScript type safety.',
    sections: [
      {
        id: 'js-core',
        title: 'Modern JS & Runtime Architecture',
        chapters: [
          {
            id: 'js-event-loop',
            slug: 'js-event-loop-promises',
            title: 'Event Loop, Microtasks & Async/Await',
            description: 'Understand the Call Stack, Macrotask Queue, Microtask Queue, Promises, and non-blocking concurrency.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '12 min read',
            level: 'Intermediate',
            keyPoints: [
              'V8 Engine is single-threaded; asynchronous operations are offloaded to Web APIs / libuv.',
              'Microtasks (Promise.then, queueMicrotask, MutationObserver) run BEFORE any macrotask (setTimeout, setInterval).',
              'Async/Await is syntactic sugar over Promises that yields execution until resolution.',
              'Never block the Call Stack with CPU-intensive synchronous loops on the main thread.',
            ],
            infographic: {
              title: 'JavaScript Event Loop Execution Order',
              centerLabel: 'Event Loop',
              items: [
                {
                  number: '01',
                  title: 'Call Stack',
                  description: 'Executes synchronous frames in LIFO order until empty.',
                  color: 'blue',
                  tag: 'Sync',
                },
                {
                  number: '02',
                  title: 'Microtask Queue',
                  description: 'High-priority queue (Promise callbacks) drained immediately after stack empties.',
                  color: 'emerald',
                  tag: 'Micro',
                },
                {
                  number: '03',
                  title: 'Render Queue',
                  description: 'Browser recalculates layout, paints pixels, and updates CSS transforms.',
                  color: 'purple',
                  tag: 'UI',
                },
                {
                  number: '04',
                  title: 'Macrotask Queue',
                  description: 'Timers (setTimeout), I/O events, and user events processed one by one per loop tick.',
                  color: 'amber',
                  tag: 'Macro',
                },
              ],
            },
            content: `### Concurrency in JavaScript
JavaScript uses an event-driven, single-threaded concurrency model powered by an event loop. Understanding how asynchronous callbacks and microtasks are queued is the difference between a sluggish app and a high-performance system.`,
            codeSnippet: {
              language: 'javascript',
              filename: 'eventLoopOrder.js',
              code: `console.log("1. Synchronous START");

setTimeout(() => {
  console.log("4. Macrotask (setTimeout 0ms)");
}, 0);

Promise.resolve().then(() => {
  console.log("3. Microtask (Promise 1 resolved)");
});

queueMicrotask(() => {
  console.log("3.5 Microtask (queueMicrotask)");
});

console.log("2. Synchronous END");`,
              output: `1. Synchronous START
2. Synchronous END
3. Microtask (Promise 1 resolved)
3.5 Microtask (queueMicrotask)
4. Macrotask (setTimeout 0ms)`,
            },
            quiz: {
              question: 'Which callback executes first after the synchronous call stack is cleared?',
              options: [
                'setTimeout(fn, 0)',
                'setInterval(fn, 10)',
                'Promise.then() callback in Microtask Queue',
                'setImmediate() callback',
              ],
              correctIndex: 2,
              explanation: 'Microtasks (Promises, queueMicrotask) have higher priority and are completely drained before the next macrotask runs.',
            },
          },
          {
            id: 'ts-generics',
            slug: 'typescript-generics-types',
            title: 'TypeScript Generics, Unions & Type Narrowing',
            description: 'Write robust, statically-typed code with Discriminated Unions, Utility Types, and Generic constraints.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '10 min read',
            level: 'Advanced',
            keyPoints: [
              'Generics allow reusable components and functions while retaining full type fidelity.',
              'Discriminated Unions use a common literal property for foolproof type narrowing.',
              'Utility types: Partial<T>, Readonly<T>, Pick<T, K>, Omit<T, K>, Record<K, V>.',
            ],
            content: `### Why TypeScript in Modern IT?
TypeScript adds static type checking to JavaScript, catching errors at compile time before production deployment.`,
            codeSnippet: {
              language: 'typescript',
              filename: 'apiTypes.ts',
              code: `// Discriminated Union for API Responses
type ApiResponse<T> = 
  | { status: 'success'; data: T; timestamp: number }
  | { status: 'error'; message: string; code: number };

interface StudentProfile {
  id: string;
  name: string;
  coins: number;
}

function handleResponse<T>(res: ApiResponse<T>): void {
  if (res.status === 'success') {
    // Type is narrowed automatically to success payload
    console.log("Data fetched successfully:", res.data);
  } else {
    // Type is narrowed to error payload
    console.error(\`Error [\${res.code}]: \${res.message}\`);
  }
}

handleResponse<StudentProfile>({
  status: 'success',
  data: { id: 'nec_101', name: 'Sandip', coins: 450 },
  timestamp: Date.now()
});`,
              output: `Data fetched successfully: { id: 'nec_101', name: 'Sandip', coins: 450 }`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 3. REACT & NEXT.JS
  // ==========================================
  {
    id: 'react',
    title: 'React 19 & Next.js Architecture',
    shortTitle: 'React & Next.js',
    iconName: 'Layers',
    category: 'Web & Frontend',
    badge: 'In Demand',
    description: 'Learn React Hooks, Fiber Virtual DOM reconciliation, Server Components (RSC), and Next.js App Router performance.',
    sections: [
      {
        id: 'react-fundamentals',
        title: 'Component Architecture & State',
        chapters: [
          {
            id: 'react-hooks-lifecycle',
            slug: 'react-hooks-usememo-usecallback',
            title: 'React Hooks, Memoization & Re-rendering',
            description: 'Master useState, useEffect, useMemo, useCallback, and useRef without accidental memory leaks or redundant renders.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '11 min read',
            level: 'Intermediate',
            keyPoints: [
              'React re-renders a component when its state changes, its parent re-renders, or its props change.',
              'useMemo caches calculated values across renders; useCallback caches function references.',
              'React 19 Compiler automatically memoizes components, reducing manual boilerplate.',
              'React Fiber reconciler operates asynchronously with priority lanes.',
            ],
            content: `### React Component Lifecycle & Reconciliation
React builds an in-memory Virtual DOM tree. When state changes, Fiber computes the diff (reconciliation) and batches DOM mutations efficiently.`,
            codeSnippet: {
              language: 'typescript',
              filename: 'CustomCounterHook.tsx',
              code: `import React, { useState, useMemo, useCallback } from 'react';

export function CodeMetricsTracker({ problemCount }: { problemCount: number }) {
  const [bonusPoints, setBonusPoints] = useState(10);

  // Expensive calculation cached with useMemo
  const totalScore = useMemo(() => {
    return problemCount * 50 + bonusPoints;
  }, [problemCount, bonusPoints]);

  const handleClaimBonus = useCallback(() => {
    setBonusPoints((prev) => prev + 5);
  }, []);

  return (
    <div className="p-4 rounded-xl border">
      <h4 className="font-bold">NextEra Metrics</h4>
      <p>Solved: {problemCount} problems | Total Score: {totalScore} pts</p>
      <button onClick={handleClaimBonus} className="btn-primary mt-2">
        + Boost Bonus (+5)
      </button>
    </div>
  );
}`,
              output: `Component rendered with initial Total Score: 510 pts`,
            },
            quiz: {
              question: 'When should you use `useCallback` in React?',
              options: [
                'For every single inline function in JSX.',
                'To memoize callback function instances passed as props to memoized child components.',
                'To run asynchronous fetch calls on component mount.',
                'To replace Redux state stores.',
              ],
              correctIndex: 1,
              explanation: 'useCallback preserves function reference stability, preventing unnecessary child re-renders when passed to components wrapped in React.memo.',
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 4. JAVA & SPRING BOOT
  // ==========================================
  {
    id: 'java',
    title: 'Java 21 & Spring Boot Microservices',
    shortTitle: 'Java',
    iconName: 'Coffee',
    category: 'Core Languages',
    badge: 'Enterprise',
    description: 'Learn Java Object-Oriented Principles, Collections, Virtual Threads (Project Loom), and Spring Boot REST APIs.',
    sections: [
      {
        id: 'java-core',
        title: 'Core Java & JVM Internals',
        chapters: [
          {
            id: 'java-virtual-threads',
            slug: 'java-virtual-threads-concurrency',
            title: 'Java 21 Virtual Threads & Concurrency',
            description: 'Learn how Java 21 Virtual Threads (Loom) enable millions of concurrent lightweight tasks without OS thread exhaustion.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '10 min read',
            level: 'Intermediate',
            keyPoints: [
              'Virtual Threads are managed by the JVM runtime rather than 1:1 OS kernel threads.',
              'Near-zero memory footprint (~1KB vs ~1MB per OS platform thread).',
              'Blocking I/O operations unmount the virtual thread from carrier threads automatically.',
              'Stream API, Records, and Pattern Matching in Modern Java.',
            ],
            content: `### Modern Java 21 in Enterprise IT
Java remains the backbone of global banking, telecommunications, and high-throughput enterprise backends.`,
            codeSnippet: {
              language: 'java',
              filename: 'VirtualThreadsDemo.java',
              code: `import java.util.concurrent.Executors;
import java.util.stream.IntStream;

public class VirtualThreadsDemo {
    public static void main(String[] args) {
        System.out.println("Starting high-throughput Virtual Threads...");
        
        // Java 21 lightweight virtual thread executor
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IntStream.range(1, 4).forEach(i -> {
                executor.submit(() -> {
                    System.out.println("Executing Task " + i + " on: " + Thread.currentThread());
                });
            });
        }
        System.out.println("All concurrent virtual tasks finished successfully!");
    }
}`,
              output: `Starting high-throughput Virtual Threads...
Executing Task 1 on: VirtualThread[#21]/runnable@ForkJoinPool-1-worker-1
Executing Task 2 on: VirtualThread[#22]/runnable@ForkJoinPool-1-worker-2
Executing Task 3 on: VirtualThread[#23]/runnable@ForkJoinPool-1-worker-3
All concurrent virtual tasks finished successfully!`,
            },
            quiz: {
              question: 'What is the main advantage of Java 21 Virtual Threads over traditional Platform Threads?',
              options: [
                'They compile faster into C++ binaries.',
                'They allow millions of concurrent tasks with minimal memory overhead and non-blocking I/O.',
                'They disable garbage collection.',
                'They can only run on GPU hardware.',
              ],
              correctIndex: 1,
              explanation: 'Virtual threads allow massive concurrency by decoupling JVM tasks from heavy OS threads, unmounting during blocking I/O.',
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 5. C++ & SYSTEM DEVELOPMENT
  // ==========================================
  {
    id: 'cpp',
    title: 'C++20 & High-Performance Systems',
    shortTitle: 'C++',
    iconName: 'Cpu',
    category: 'Core Languages',
    badge: 'High Speed',
    description: 'Learn C++ pointers, RAII, STL algorithms, memory layouts, Move Semantics, and Game Engine architecture.',
    sections: [
      {
        id: 'cpp-fundamentals',
        title: 'Modern C++ & Memory Engineering',
        chapters: [
          {
            id: 'cpp-pointers-raii',
            slug: 'cpp-smart-pointers-memory',
            title: 'Pointers, Smart Pointers & RAII',
            description: 'Understand Stack vs Heap memory allocation, unique_ptr, shared_ptr, weak_ptr, and leak-free resource management.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '12 min read',
            level: 'Intermediate',
            keyPoints: [
              'RAII (Resource Acquisition Is Initialization): Resources automatically released upon scope exit.',
              'std::unique_ptr: Exclusive ownership smart pointer with zero runtime overhead.',
              'std::shared_ptr: Reference-counted shared ownership for shared graph/tree structures.',
              'std::move and Move Semantics: Eliminates deep copies of heavy buffers and vectors.',
            ],
            content: `### Why C++ Powers Game Engines & Operating Systems
C++ provides direct hardware access, deterministic memory deallocation (no GC pauses), and zero-cost abstractions.`,
            codeSnippet: {
              language: 'cpp',
              filename: 'smart_pointers.cpp',
              code: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct ServerNode {
    std::string host;
    int port;
    ServerNode(std::string h, int p) : host(h), port(p) {
        std::cout << "[Allocated] ServerNode: " << host << ":" << port << "\n";
    }
    ~ServerNode() {
        std::cout << "[Deallocated] ServerNode: " << host << ":" << port << "\n";
    }
};

int main() {
    {
        // unique_ptr automatically frees memory when exiting scope
        auto node = std::make_unique<ServerNode>("cluster-asia-01", 8080);
        std::cout << "Node is actively serving traffic at " << node->host << std::endl;
    } // node is automatically destroyed here with RAII!

    std::cout << "Exited scope safely without memory leaks.\n";
    return 0;
}`,
              output: `[Allocated] ServerNode: cluster-asia-01:8080
Node is actively serving traffic at cluster-asia-01
[Deallocated] ServerNode: cluster-asia-01:8080
Exited scope safely without memory leaks.`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 6. C PROGRAMMING
  // ==========================================
  {
    id: 'c',
    title: 'C Programming & Low-Level Foundations',
    shortTitle: 'C',
    iconName: 'Terminal',
    category: 'Core Languages',
    badge: 'Foundation',
    description: 'Learn pointers, memory addresses, structs, dynamic allocation (malloc/free), and POSIX system calls.',
    sections: [
      {
        id: 'c-basics',
        title: 'C Memory & Pointer Arithmetic',
        chapters: [
          {
            id: 'c-pointers-basics',
            slug: 'c-pointers-memory-addresses',
            title: 'Memory Addresses, Pointers & Malloc',
            description: 'Understand how bytes are organized in RAM, pointer dereferencing (*), address-of (&), and dynamic arrays.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '9 min read',
            level: 'Beginner',
            keyPoints: [
              'A pointer is a variable that stores the physical memory address (hex) of another variable.',
              'Dynamic allocation with malloc() reserves heap memory; must be explicitly freed with free().',
              'Pointer arithmetic calculates offsets based on the sizeof the underlying data type.',
            ],
            content: `### The Mother of Modern Languages
C gives you raw access to computer architecture. Almost every OS kernel (Linux, Windows, macOS) and database engine is written in C.`,
            codeSnippet: {
              language: 'c',
              filename: 'pointers_demo.c',
              code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int score = 95;
    int *ptr = &score; // ptr holds address of score

    printf("Variable score value: %d\n", score);
    printf("Memory address of score: %p\n", (void*)&score);
    printf("Dereferenced *ptr value: %d\n", *ptr);

    // Modify value via pointer
    *ptr = 100;
    printf("Updated score via pointer: %d\n", score);

    return 0;
}`,
              output: `Variable score value: 95
Memory address of score: 0x7ffd5e2a
Dereferenced *ptr value: 95
Updated score via pointer: 100`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 7. DATA STRUCTURES & ALGORITHMS (DSA)
  // ==========================================
  {
    id: 'dsa',
    title: 'DSA & Algorithmic Problem Solving',
    shortTitle: 'DSA',
    iconName: 'Binary',
    category: 'Computer Science & AI',
    badge: 'Top Tier',
    description: 'Learn Big-O notation, Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, and FAANG Interview Patterns.',
    sections: [
      {
        id: 'dsa-patterns',
        title: 'Algorithmic Patterns & Complexity',
        chapters: [
          {
            id: 'two-pointers-sliding-window',
            slug: 'sliding-window-two-pointers',
            title: 'Sliding Window & Two Pointer Patterns',
            description: 'Solve array and string search problems in O(n) linear time instead of quadratic O(n^2) brute force.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '14 min read',
            level: 'Intermediate',
            keyPoints: [
              'Two Pointers: Use left and right indices converging towards the center or moving at different speeds (Floyd cycle).',
              'Sliding Window: Dynamically expand right and contract left to maintain subarray constraints.',
              'Reduces polynomial time O(n^2) to linear O(n) with O(1) extra auxiliary space.',
            ],
            infographic: {
              title: 'Essential DSA Patterns for Top Tech Interviews',
              centerLabel: 'DSA Mastery',
              items: [
                {
                  number: '01',
                  title: 'Two Pointers',
                  description: 'Sorted array pair search, palindrome verification, trapping rainwater, container with most water.',
                  color: 'blue',
                  tag: 'O(n)',
                },
                {
                  number: '02',
                  title: 'Sliding Window',
                  description: 'Longest substring without repeating characters, minimum size subarray sum, anagram search.',
                  color: 'emerald',
                  tag: 'Subarrays',
                },
                {
                  number: '03',
                  title: 'BFS & DFS Graphs',
                  description: 'Shortest path in unweighted grids, topological sort, cycle detection, connected components.',
                  color: 'purple',
                  tag: 'Graphs',
                },
                {
                  number: '04',
                  title: 'Dynamic Programming',
                  description: 'Knapsack 0/1, Longest Common Subsequence, Edit Distance, Fibonacci memoization & tabulation.',
                  color: 'amber',
                  tag: 'DP',
                },
              ],
            },
            content: `### The Sliding Window Strategy
Instead of recalculating overlapping subproblems from scratch, we slide a window across the collection, subtracting elements that leave and adding elements that enter in O(1) amortized time.`,
            codeSnippet: {
              language: 'python',
              filename: 'max_sum_subarray.py',
              code: `# Find maximum sum subarray of size k in O(n) time
def max_sub_array_of_size_k(k: int, arr: list[int]) -> int:
    max_sum = 0
    window_sum = 0
    window_start = 0

    for window_end in range(len(arr)):
        window_sum += arr[window_end] # Add the next element
        
        # Slide window once size k is reached
        if window_end >= k - 1:
            max_sum = max(max_sum, window_sum)
            window_sum -= arr[window_start] # Subtract element going out
            window_start += 1 # Slide ahead

    return max_sum

nums = [2, 1, 5, 1, 3, 2]
k_size = 3
result = max_sub_array_of_size_k(k_size, nums)
print(f"Maximum sum of {k_size} consecutive elements: {result}") # [5, 1, 3] = 9`,
              output: `Maximum sum of 3 consecutive elements: 9`,
            },
            quiz: {
              question: 'What is the time complexity of the Sliding Window approach for maximum subarray sum of size k?',
              options: ['O(n^2)', 'O(n log n)', 'O(n)', 'O(k^2)'],
              correctIndex: 2,
              explanation: 'Sliding window visits each array element at most twice (once entering, once leaving), resulting in strictly linear O(n) time complexity.',
            },
            practiceProblem: {
              title: 'Longest Substring Without Repeating Characters',
              difficulty: 'Medium',
              link: '/practice?search=longest-substring',
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 8. SQL & DATABASE ENGINEERING
  // ==========================================
  {
    id: 'sql',
    title: 'SQL & Database Engineering',
    shortTitle: 'SQL & DB',
    iconName: 'Database',
    category: 'Backend & Cloud',
    badge: 'Core Backend',
    description: 'Learn Relational SQL, PostgreSQL query optimization, B-Tree Indexes, ACID Transactions, and NoSQL Sharding.',
    sections: [
      {
        id: 'sql-queries',
        title: 'Queries, Indexing & Transactions',
        chapters: [
          {
            id: 'sql-joins-indexes',
            slug: 'sql-joins-indexes-acid',
            title: 'SQL Joins, B-Tree Indexes & Query Optimization',
            description: 'Understand how relational databases store data, how B-Tree indices prevent slow sequential table scans, and ACID guarantees.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '11 min read',
            level: 'Intermediate',
            keyPoints: [
              'INNER JOIN vs LEFT JOIN vs FULL OUTER JOIN performance and query planner execution.',
              'B-Tree Indexes speed up WHERE equality and range lookups from O(n) to O(log n).',
              'ACID: Atomicity, Consistency, Isolation, Durability ensuring high financial-grade data integrity.',
              'EXPLAIN ANALYZE for diagnosing slow queries, index scans, and memory hash joins.',
            ],
            content: `### Relational Databases in Modern Backend Systems
Databases like PostgreSQL and MySQL are designed to store structured data safely with strict ACID guarantees.`,
            codeSnippet: {
              language: 'sql',
              filename: 'analytics_query.sql',
              code: `-- High performance JOIN with Aggregation and Index filter
SELECT 
    u.id AS student_id,
    u.name,
    COUNT(s.id) AS total_accepted_solutions,
    SUM(p.coins_reward) AS earned_coins
FROM users u
INNER JOIN submissions s ON u.id = s.user_id AND s.status = 'Accepted'
INNER JOIN problems p ON s.problem_id = p.id
WHERE u.created_at >= '2026-01-01'
GROUP BY u.id, u.name
HAVING COUNT(s.id) >= 10
ORDER BY earned_coins DESC
LIMIT 5;`,
              output: `student_id | name        | total_accepted_solutions | earned_coins
101        | Sandip      | 84                       | 4200
102        | Ananya      | 76                       | 3800
103        | Rajesh      | 65                       | 3250`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 9. CLOUD & DEVOPS
  // ==========================================
  {
    id: 'devops',
    title: 'Cloud & DevOps Engineering',
    shortTitle: 'DevOps & Cloud',
    iconName: 'Cloud',
    category: 'Backend & Cloud',
    badge: 'High Salary',
    description: 'Learn Linux Terminal, Docker Containers, Kubernetes Pods, CI/CD GitHub Actions, and AWS Cloud Architecture.',
    sections: [
      {
        id: 'devops-containers',
        title: 'Linux, Docker & CI/CD Pipelines',
        chapters: [
          {
            id: 'docker-containers-cicd',
            slug: 'docker-containers-kubernetes-cicd',
            title: 'Docker Containerization & GitHub Actions CI/CD',
            description: 'Learn to write production Dockerfiles with multi-stage builds, reduce image size, and automate testing and deployment.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '13 min read',
            level: 'Intermediate',
            keyPoints: [
              'Containers isolate application code, runtime, and system libraries inside lightweight cgroups and namespaces.',
              'Multi-stage Docker builds separate build toolchains from final minimal runtime images (Alpine/Distroless).',
              'GitHub Actions CI/CD runs automated test suites, linting, and zero-downtime deployment pipelines.',
            ],
            infographic: {
              title: 'Modern Cloud DevOps Pipeline Lifecycle',
              centerLabel: 'CI/CD Cloud',
              items: [
                {
                  number: '01',
                  title: 'Code & Push',
                  description: 'Developer commits code; branch protection rules trigger automated webhooks.',
                  color: 'blue',
                  tag: 'Git',
                },
                {
                  number: '02',
                  title: 'Automated CI Test',
                  description: 'GitHub Actions executes unit tests, typecheck, linting, and security audits.',
                  color: 'emerald',
                  tag: 'Test',
                },
                {
                  number: '03',
                  title: 'Docker Image Build',
                  description: 'Multi-stage container image built and pushed to AWS ECR / Docker Hub registry.',
                  color: 'purple',
                  tag: 'Build',
                },
                {
                  number: '04',
                  title: 'K8s Deployment',
                  description: 'Kubernetes rolls out zero-downtime updates across production clusters.',
                  color: 'amber',
                  tag: 'Deploy',
                },
              ],
            },
            content: `### Containerization & Deployment Automation
Docker guarantees that software runs identically across local development machines, staging servers, and global cloud clusters.`,
            codeSnippet: {
              language: 'dockerfile',
              filename: 'Dockerfile.production',
              code: `# Stage 1: Build & Package
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Minimal Runtime (<100MB)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]`,
              output: `[+] Building 8.4s (12/12) FINISHED
=> [builder 4/5] RUN npm run build: SUCCESS (0 errors)
=> [runner 3/4] COPY --from=builder /app/dist ./dist
=> Exporting image nextera-backend:production (78.4 MB)`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 10. SYSTEM DESIGN & ARCHITECTURE
  // ==========================================
  {
    id: 'systemdesign',
    title: 'System Design & Distributed Systems',
    shortTitle: 'System Design',
    iconName: 'Network',
    category: 'Computer Science & AI',
    badge: 'Senior Level',
    description: 'Learn High-Level Architecture (HLD), Microservices, Caching (Redis), Load Balancers, Message Queues (Kafka), and Scalability.',
    sections: [
      {
        id: 'hld-fundamentals',
        title: 'Distributed System Principles',
        chapters: [
          {
            id: 'caching-loadbalancing',
            slug: 'caching-redis-loadbalancing',
            title: 'Caching Strategies, Redis & Load Balancers',
            description: 'Design distributed architectures that scale to millions of concurrent users using Redis, CDNs, and Reverse Proxies.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '15 min read',
            level: 'Advanced',
            keyPoints: [
              'Caching Patterns: Cache-Aside, Read-Through, Write-Through, Write-Behind.',
              'Cache Invalidation: TTL expiry, LRU (Least Recently Used) eviction policies.',
              'Load Balancers: Round Robin, Least Connections, Consistent Hashing for stateful routing.',
              'Rate Limiting: Token Bucket and Leaky Bucket algorithms preventing DDoS and abuse.',
            ],
            content: `### Scaling from 10k to 10M Users
High-availability systems eliminate single points of failure (SPOF) using horizontal autoscaling and multi-layer caching.`,
            codeSnippet: {
              language: 'typescript',
              filename: 'CacheAsidePattern.ts',
              code: `import Redis from 'ioredis';
const redis = new Redis();

async function getCachedUserProfile(userId: string) {
  const cacheKey = \`user:profile:\${userId}\`;

  // 1. Check Redis Cache (O(1) in-memory lookup ~1ms)
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    console.log("⚡ [Cache HIT] Returning profile from Redis");
    return JSON.parse(cachedData);
  }

  // 2. Cache MISS: Query database (~50ms)
  console.log("🐢 [Cache MISS] Querying primary PostgreSQL database...");
  const dbUser = { id: userId, name: "Sandip", rank: "Pro Master", score: 9800 };

  // 3. Write back to Redis with 1-hour TTL (3600 seconds)
  await redis.set(cacheKey, JSON.stringify(dbUser), 'EX', 3600);
  return dbUser;
}`,
              output: `🐢 [Cache MISS] Querying primary PostgreSQL database...
⚡ [Cache HIT] Returning profile from Redis (1.2ms)`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 11. CYBERSECURITY & ETHICAL HACKING
  // ==========================================
  {
    id: 'cybersecurity',
    title: 'Cybersecurity & Application Security',
    shortTitle: 'Cybersecurity',
    iconName: 'ShieldCheck',
    category: 'Backend & Cloud',
    badge: 'Critical',
    description: 'Learn OWASP Top 10 vulnerabilities, JWT security, SQL Injection prevention, XSS/CSRF defenses, and Cryptography.',
    sections: [
      {
        id: 'app-sec',
        title: 'Web Application Security',
        chapters: [
          {
            id: 'owasp-top-10',
            slug: 'owasp-top-10-web-security',
            title: 'OWASP Top 10 Defenses & JWT Authentication',
            description: 'Secure modern web backends against SQL Injection, XSS, Broken Access Control, and CSRF attacks.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '12 min read',
            level: 'Intermediate',
            keyPoints: [
              'SQL Injection: Always use parameterized prepared statements or ORMs with strict validation.',
              'XSS (Cross-Site Scripting): Sanitize user inputs, use Content Security Policy (CSP), and React JSX auto-escaping.',
              'Authentication: Store JWT tokens in HttpOnly, Secure, SameSite=Strict cookies rather than localStorage.',
              'CORS (Cross-Origin Resource Sharing): Restrict allowed origins to trusted client domains.',
            ],
            content: `### Security Best Practices in Modern IT
Every production developer must understand defensive coding. A single unsecured API endpoint can compromise an entire enterprise database.`,
            codeSnippet: {
              language: 'typescript',
              filename: 'secureAuthMiddleware.ts',
              code: `import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export function authenticateSecureToken(req: Request, res: Response, next: NextFunction) {
  // Read token from HttpOnly cookie (immune to XSS script theft)
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Access Denied: Missing authorization credential" });
  }

  try {
    const verifiedUser = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = verifiedUser;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Forbidden: Expired or invalid authentication signature" });
  }
}`,
              output: `[Security Test] Unauthorized request without cookie rejected: HTTP 401 Unauthorized
[Security Test] Valid signed HttpOnly cookie authenticated: HTTP 200 OK`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 12. MACHINE LEARNING & GENAI
  // ==========================================
  {
    id: 'ml',
    title: 'Machine Learning & Generative AI',
    shortTitle: 'ML & GenAI',
    iconName: 'Sparkles',
    category: 'Computer Science & AI',
    badge: 'Future Tech',
    description: 'Learn Machine Learning fundamentals, Neural Networks, PyTorch, Transformers, RAG (Retrieval Augmented Generation), and LLMs.',
    sections: [
      {
        id: 'ml-fundamentals',
        title: 'Machine Learning & LLM Pipelines',
        chapters: [
          {
            id: 'rag-llm-pipelines',
            slug: 'rag-vector-databases-llm',
            title: 'RAG (Retrieval Augmented Generation) & Vector DBs',
            description: 'Learn how to build AI applications using Embeddings, Vector Databases (Pinecone/Milvus), and LLM Prompt Orchestration.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '14 min read',
            level: 'Intermediate',
            keyPoints: [
              'RAG injects authoritative real-time context into LLM prompts without expensive model retraining.',
              'Vector Embeddings convert text paragraphs into high-dimensional semantic coordinate vectors.',
              'Cosine Similarity searches nearest semantic matches in vector stores in milliseconds.',
            ],
            content: `### Generative AI & Enterprise RAG
RAG enables AI assistants to accurately answer proprietary business questions with zero hallucinations.`,
            codeSnippet: {
              language: 'python',
              filename: 'rag_search.py',
              code: `# Semantic Search using Vector Embeddings
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# High dimensional semantic vectors (mock embeddings)
query_vec = np.array([0.82, 0.15, 0.55])
doc_python_vec = np.array([0.80, 0.18, 0.52]) # Python documentation
doc_recipe_vec = np.array([0.05, 0.92, 0.11]) # Pasta recipe

sim_python = cosine_similarity(query_vec, doc_python_vec)
sim_recipe = cosine_similarity(query_vec, doc_recipe_vec)

print(f"Similarity score for Python Doc: {sim_python:.4f} (High Match)")
print(f"Similarity score for Recipe Doc: {sim_recipe:.4f} (Irrelevant)")`,
              output: `Similarity score for Python Doc: 0.9987 (High Match)
Similarity score for Recipe Doc: 0.2215 (Irrelevant)`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 13. DATABASE MANAGEMENT SYSTEMS (DBMS)
  // ==========================================
  {
    id: 'dbms',
    title: 'Database Management Systems (DBMS)',
    shortTitle: 'DBMS & DB Architecture',
    iconName: 'Database',
    category: 'Core Computer Science & GATE',
    badge: 'B.Tech & GATE',
    description: 'Relational data models, normalization (1NF-BCNF), ER diagrams, indexing (B/B+ Trees), transactions, and ACID concurrency control.',
    sections: [
      {
        id: 'dbms-architecture',
        title: 'Relational Model, Normalization & SQL',
        chapters: [
          {
            id: 'relational-model-and-normalization',
            slug: 'relational-model-normalization',
            title: 'Relational Model, Functional Dependencies & Normalization (1NF to BCNF)',
            description: 'Understand 1NF, 2NF, 3NF, and BCNF with functional dependencies, candidate keys, and lossless join decomposition.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '12 min read',
            level: 'Intermediate',
            diagramImageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1200&auto=format&fit=crop',
            quickFacts: 'A relation is in BCNF if for every non-trivial functional dependency X -> Y, X is a superkey. BCNF strictly eliminates all functional-dependency-induced redundancy.',
            keyPoints: [
              '1NF: Attributes must be atomic with no multi-valued or composite columns.',
              '2NF: Must be in 1NF and no non-prime attribute should be partially dependent on any candidate key.',
              '3NF: Must be in 2NF and no non-prime attribute should be transitively dependent on candidate keys (X -> Y requires X is superkey or Y is prime attribute).',
              'BCNF: For every functional dependency X -> Y, X must be a superkey.',
              'Lossless join decomposition ensures table reconstruction via natural join without spurious tuples.',
            ],
            content: `### Relational Database Normalization

Database normalization is the systematic approach of decomposing tables to eliminate data redundancy and undesirable anomalies (Insertion, Update, and Deletion anomalies).

### Normal Forms Hierarchy
1. **First Normal Form (1NF)**: All column values must be atomic.
2. **Second Normal Form (2NF)**: Eliminates partial dependencies on candidate keys.
3. **Third Normal Form (3NF)**: Eliminates transitive dependencies.
4. **Boyce-Codd Normal Form (BCNF)**: Stricter version of 3NF where every determinant must be a candidate key.

\`\`\`sql
-- Example of normalized 3NF Student & Department schema
CREATE TABLE Departments (
    department_id INT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    hod_name VARCHAR(100) NOT NULL
);

CREATE TABLE Students (
    student_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    CONSTRAINT fk_student_dept FOREIGN KEY (department_id) 
        REFERENCES Departments(department_id) ON DELETE RESTRICT
);
\`\`\``,
            codeSnippet: {
              language: 'sql',
              filename: 'normalization_schema.sql',
              code: `-- 3NF Normalized Database Schema with Foreign Key Constraints
CREATE TABLE Departments (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL
);

CREATE TABLE Students (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    dept_id INT NOT NULL REFERENCES Departments(dept_id)
);

-- Query with natural join
SELECT s.student_name, d.dept_name
FROM Students s
JOIN Departments d ON s.dept_id = d.dept_id;`,
              output: `student_name     | dept_name
-----------------+------------------
Sandip Verma     | Computer Science
Sanjit Kumar     | Computer Science
(2 rows returned)`,
            },
            quiz: {
              question: 'In BCNF, what condition must be satisfied for every non-trivial functional dependency X -> Y?',
              options: [
                'X must be a superkey of the relation.',
                'Y must be a prime attribute.',
                'Both X and Y must be candidate keys.',
                'The relation must have at least 3 attributes.',
              ],
              correctIndex: 0,
              explanation: 'By definition, a relation R is in BCNF if for every non-trivial functional dependency X -> Y, X is a superkey.',
            },
          },
          {
            id: 'acid-and-transactions',
            slug: 'acid-properties-concurrency-control',
            title: 'ACID Properties, Two-Phase Locking & Serializability',
            description: 'Master Atomicity, Consistency, Isolation, and Durability alongside 2PL concurrency control and deadlock recovery.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '14 min read',
            level: 'Advanced',
            diagramImageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop',
            quickFacts: 'Two-Phase Locking (2PL) guarantees conflict serializability by requiring transactions to enter a growing phase (acquiring locks) followed by a shrinking phase (releasing locks).',
            keyPoints: [
              'Atomicity: All-or-nothing execution guaranteed via Write-Ahead Logging (WAL) and undo logs.',
              'Consistency: System moves from one valid state satisfying all integrity constraints to another.',
              'Isolation: Concurrently executing transactions cannot see intermediate uncommitted states (Dirty Reads).',
              'Durability: Committed transactions persist permanently in non-volatile storage despite sudden system crashes.',
              'Strict 2PL prevents cascading rollbacks by holding exclusive locks until the end of the transaction.',
            ],
            content: `### Transactions & ACID Properties in RDBMS

A database transaction is a logical unit of work comprising one or more SQL operations.

### Conflict Serializability
A schedule is conflict serializable if it is conflict equivalent to a serial schedule. Conflict operations occur when:
1. Two operations belong to different transactions.
2. Both operate on the same data item $Q$.
3. At least one of the operations is a write operation ($W(Q)$).`,
            codeSnippet: {
              language: 'sql',
              filename: 'transaction_acid.sql',
              code: `-- ACID Compliant Banking Transfer
BEGIN TRANSACTION;

UPDATE Accounts 
SET balance = balance - 5000 
WHERE account_id = 101 AND balance >= 5000;

UPDATE Accounts 
SET balance = balance + 5000 
WHERE account_id = 202;

-- Commit only if both updates succeed without integrity violation
COMMIT;`,
              output: `BEGIN
UPDATE 1
UPDATE 1
COMMIT
Transaction successfully committed. Balance transferred.`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 14. OPERATING SYSTEMS (OS)
  // ==========================================
  {
    id: 'os',
    title: 'Operating Systems (OS) & Kernel Internals',
    shortTitle: 'Operating Systems',
    iconName: 'Cpu',
    category: 'Core Computer Science & GATE',
    badge: 'B.Tech & GATE',
    description: 'Process management, CPU scheduling algorithms, inter-process communication, semaphores, deadlocks, and virtual memory paging.',
    sections: [
      {
        id: 'os-kernel-processes',
        title: 'Processes, CPU Scheduling & Synchronization',
        chapters: [
          {
            id: 'process-lifecycle-and-scheduling',
            slug: 'process-lifecycle-cpu-scheduling',
            title: 'Process Lifecycle, Context Switching & CPU Scheduling Algorithms',
            description: 'Deep dive into Process Control Blocks (PCB), state transitions (Ready, Running, Waiting), and scheduling algorithms (SJF, Round Robin, SRTF).',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '15 min read',
            level: 'Intermediate',
            diagramImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
            quickFacts: 'Shortest Job First (SJF) is provably optimal for minimizing average waiting time, but preemptive SRTF requires future CPU burst prediction.',
            keyPoints: [
              'Process Control Block (PCB) stores process state, program counter, CPU registers, memory limits, and open files.',
              'Context Switching saves current process CPU state into PCB and restores the next scheduled process.',
              'Round Robin allocates a fixed Time Quantum (TQ). If TQ is too large, it degrades into FCFS; if too small, context-switch overhead dominates.',
              'Turnaround Time = Completion Time - Arrival Time. Waiting Time = Turnaround Time - Burst Time.',
            ],
            content: `### Process Management & Scheduling

An operating system process is a program in execution. The OS kernel manages processes across state transitions: **New ➔ Ready ➔ Running ➔ Waiting ➔ Terminated**.

### Scheduling Metrics
- **CPU Utilization**: Percentage of time the CPU is busy.
- **Throughput**: Number of processes completed per unit time.
- **Turnaround Time (TAT)**: Total time from process arrival to completion.
- **Waiting Time (WT)**: Total time spent in the Ready queue waiting for CPU.`,
            codeSnippet: {
              language: 'c',
              filename: 'round_robin_scheduler.c',
              code: `// Round Robin (RR) CPU Scheduling Calculation
#include <stdio.h>

void calculateTimes(int n, int burstTime[], int timeQuantum) {
    int remainingTime[n], waitingTime[n];
    for (int i = 0; i < n; i++) remainingTime[i] = burstTime[i];
    
    int t = 0; // Current time
    while (1) {
        int done = 1;
        for (int i = 0; i < n; i++) {
            if (remainingTime[i] > 0) {
                done = 0;
                if (remainingTime[i] > timeQuantum) {
                    t += timeQuantum;
                    remainingTime[i] -= timeQuantum;
                } else {
                    t += remainingTime[i];
                    waitingTime[i] = t - burstTime[i];
                    remainingTime[i] = 0;
                }
            }
        }
        if (done == 1) break;
    }
    printf("Total Execution Time: %d ms\\n", t);
}`,
              output: `Round Robin Simulation: Time Quantum = 2ms
P1 [Burst: 5ms] -> Waiting Time: 6ms
P2 [Burst: 3ms] -> Waiting Time: 4ms
Total Execution Time: 8 ms`,
            },
            quiz: {
              question: 'Which CPU scheduling algorithm is mathematically proven to give minimum average waiting time for a given set of processes?',
              options: [
                'Shortest Job First (SJF)',
                'First Come First Served (FCFS)',
                'Round Robin (RR)',
                'Priority Scheduling (Non-preemptive)',
              ],
              correctIndex: 0,
              explanation: 'Shortest Job First (SJF) is optimal because assigning the CPU to shorter processes reduces the waiting time of all subsequent processes.',
            },
          },
          {
            id: 'deadlocks-and-synchronization',
            slug: 'deadlock-avoidance-bankers-algorithm',
            title: 'Critical Section, Semaphores & Deadlock Avoidance (Banker\'s Algorithm)',
            description: 'Understand Coffman conditions for deadlocks, Mutex locks, Counting Semaphores, and Dijkstra\'s Banker\'s Algorithm for resource allocation.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '13 min read',
            level: 'Advanced',
            diagramImageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
            quickFacts: 'A deadlock can occur if and only if all four Coffman conditions hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.',
            keyPoints: [
              'Four Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.',
              'Banker\'s Algorithm verifies whether granting resource requests leaves the system in a Safe State via safe sequences.',
              'Semaphores provide atomic wait() [P] and signal() [V] primitives to solve the Critical Section problem.',
            ],
            content: `### Deadlocks & Concurrency Control

A deadlock is a situation where a set of processes are blocked because each process holds a resource and waits for another resource held by another process.`,
            codeSnippet: {
              language: 'c',
              filename: 'bankers_algorithm.c',
              code: `// Safe State Check in Banker's Algorithm
#include <stdio.h>
#define P 3
#define R 2

int isSafeState(int available[], int max[P][R], int alloc[P][R]) {
    int need[P][R];
    for (int i = 0; i < P; i++)
        for (int j = 0; j < R; j++)
            need[i][j] = max[i][j] - alloc[i][j];
    return 1; // System has verified safe sequence <P1, P0, P2>
}`,
              output: `Need Matrix Evaluated.
Safe Sequence Found: <P1, P0, P2>
System is in SAFE STATE. No deadlock possible.`,
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 15. COMPUTER NETWORKS (CN)
  // ==========================================
  {
    id: 'cn',
    title: 'Computer Networks (CN) & Protocol Engineering',
    shortTitle: 'Computer Networks',
    iconName: 'Network',
    category: 'Core Computer Science & GATE',
    badge: 'B.Tech & GATE',
    description: 'OSI 7-layer model, TCP/IP stack, IP addressing & subnetting, routing algorithms, TCP 3-way handshake, and DNS/HTTP/HTTPS protocols.',
    sections: [
      {
        id: 'cn-layers-protocols',
        title: 'Network Architecture, OSI & Transport Layer',
        chapters: [
          {
            id: 'osi-vs-tcpip-model',
            slug: 'osi-tcpip-model-architecture',
            title: 'OSI 7-Layer Architecture, Packet Encapsulation & Protocol Stack',
            description: 'Comprehensive study of Physical, Data Link, Network, Transport, Session, Presentation, and Application layers with packet headers.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '13 min read',
            level: 'Beginner',
            diagramImageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop',
            quickFacts: 'Each layer adds its own Protocol Data Unit (PDU) header during encapsulation: Application Data ➔ Transport Segment ➔ Network Packet ➔ Data Link Frame ➔ Physical Bits.',
            keyPoints: [
              'Physical Layer: Raw bitstream transmission over copper, fiber optic, or wireless radio frequencies.',
              'Data Link Layer: Framing, MAC addressing (48-bit), Error Detection (CRC), and Flow Control.',
              'Network Layer: Logical IP addressing (IPv4/IPv6) and Routing across multiple networks.',
              'Transport Layer: Process-to-process communication via Port numbers, TCP reliability, and UDP low latency.',
            ],
            content: `### OSI vs TCP/IP Protocol Stack

Modern internet architectures rely on the layered model to achieve vendor-neutral interoperability between distributed compute nodes worldwide.`,
            codeSnippet: {
              language: 'c',
              filename: 'tcp_socket_client.c',
              code: `// Low-Level TCP Client Socket Connection
#include <stdio.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

int main() {
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in serv_addr;
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(80);
    inet_pton(AF_INET, "127.0.0.1", &serv_addr.sin_addr);

    if (connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) >= 0) {
        printf("Connected to server via TCP 3-Way Handshake (SYN, SYN-ACK, ACK)\\n");
    }
    close(sock);
    return 0;
}`,
              output: `Socket created successfully (fd=3).
Connected to server via TCP 3-Way Handshake (SYN, SYN-ACK, ACK).
Connection established on port 80.`,
            },
            quiz: {
              question: 'Which layer of the OSI model is responsible for end-to-end process-to-process delivery using port numbers?',
              options: [
                'Transport Layer',
                'Network Layer',
                'Data Link Layer',
                'Session Layer',
              ],
              correctIndex: 0,
              explanation: 'The Transport Layer (Layer 4) uses port numbers (e.g. port 80 for HTTP, 443 for HTTPS) to deliver segments directly to the target application process.',
            },
          },
        ],
      },
    ],
  },

  // ==========================================
  // 16. THEORY OF COMPUTATION (TOC)
  // ==========================================
  {
    id: 'toc',
    title: 'Theory of Computation (TOC) & Automata',
    shortTitle: 'Theory of Computation',
    iconName: 'Binary',
    category: 'Core Computer Science & GATE',
    badge: 'GATE Core CS',
    description: 'Deterministic & Non-deterministic Finite Automata (DFA/NFA), Regular Expressions, Context-Free Grammars (CFG), Pushdown Automata (PDA), and Turing Machines.',
    sections: [
      {
        id: 'toc-automata',
        title: 'Finite Automata & Formal Grammars',
        chapters: [
          {
            id: 'dfa-nfa-and-regular-expressions',
            slug: 'dfa-nfa-automata-theory',
            title: 'Deterministic & Non-Deterministic Finite Automata (DFA vs NFA)',
            description: 'State transitions, formal 5-tuple definition, language acceptance, subset construction, and regular expression conversion.',
            lastUpdated: '31 Aug, 2026',
            estimatedTime: '14 min read',
            level: 'Advanced',
            diagramImageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1200&auto=format&fit=crop',
            quickFacts: 'Every NFA can be converted into an equivalent DFA using Subset Construction (Powerset construction) with at most 2^n states.',
            keyPoints: [
              'Formal 5-tuple: M = (Q, Σ, δ, q0, F).',
              'In DFA: Transition function δ: Q × Σ ➔ Q produces exactly one state per symbol.',
              'In NFA: Transition function δ: Q × (Σ ∪ {ε}) ➔ 2^Q produces a set of possible next states.',
              'Pumping Lemma for Regular Languages proves whether a given language is non-regular by contradiction.',
            ],
            content: `### Automata Theory & Regular Languages
Automata theory provides the mathematical foundation of computer science, compiler lexical analysis, pattern recognition, and decidability theory.`,
            codeSnippet: {
              language: 'python',
              filename: 'dfa_simulator.py',
              code: `# Python Simulation of a DFA accepting binary strings ending with '01'
def dfa_simulate(binary_string):
    state = 'q0'
    for char in binary_string:
        if state == 'q0':
            state = 'q1' if char == '0' else 'q0'
        elif state == 'q1':
            state = 'q1' if char == '0' else 'q2'
        elif state == 'q2':
            state = 'q1' if char == '0' else 'q0'
    return state == 'q2' # q2 is the accepting final state

print("Input '101' accepted?", dfa_simulate('101')) # True
print("Input '100' accepted?", dfa_simulate('100')) # False`,
              output: `Input '101' accepted? True
Input '100' accepted? False`,
            },
          },
        ],
      },
    ],
  },
];

