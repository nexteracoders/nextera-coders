import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './db';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { Module } from '../models/module.model';
import { Lesson } from '../models/lesson.model';
import { Enrollment } from '../models/enrollment.model';
import { CodingProblem } from '../models/problem.model';
import { Quiz } from '../models/quiz.model';
import { Project } from '../models/project.model';
import { Tutorial } from '../models/tutorial.model';
import { Achievement } from '../models/achievement.model';
import { FAQ } from '../models/faq.model';
import { Testimonial } from '../models/testimonial.model';
import { Announcement } from '../models/announcement.model';
import { PlatformSettings } from '../models/settings.model';
import { dsaProblemsData } from '../data/dsaProblems.data';
import { logger } from '../utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedCoursesData = [
  {
    title: 'Full-Stack TypeScript & React Architecture',
    slug: 'fullstack-typescript-react-architecture',
    shortDescription: 'Architect and deploy production web applications with React 18, Vite, TypeScript, Tailwind, and Node.js.',
    description: 'A comprehensive, engineering-grade curriculum covering modular frontend patterns, atomic UI design systems, custom hooks, Redux Toolkit, and secure Express backends.',
    category: 'Full-Stack Development',
    level: 'Intermediate',
    duration: '24 Hours',
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
      bio: 'Founder of NextEra Coders. Specializes in advanced Data Structures & Algorithms, High-Throughput Distributed Systems, and full-stack production architecture.',
    },
    tags: ['React', 'TypeScript', 'Tailwind', 'Node.js', 'Express'],
    requirements: ['Solid understanding of JavaScript basics', 'Familiarity with HTML and CSS', 'Basic command line experience'],
    whatYouWillLearn: [
      'Architect enterprise React applications with strict TypeScript configuration',
      'Build reusable atomic UI design system primitives',
      'Implement secure cookie-based JWT authentication and role authorization',
      'Deploy full-stack applications with production optimizations',
    ],
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: Foundations & Architecture Setup',
        description: 'Monorepos, TypeScript strict mode, and atomic component primitives.',
        order: 1,
        lessons: [
          {
            title: '1.1 Monorepo Full-Stack Architecture',
            description: 'Structuring client and server with unified build tooling.',
            videoUrl: 'https://www.youtube.com/watch?v=sample1',
            duration: '18 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
          {
            title: '1.2 Atomic UI Primitives & Design Tokens',
            description: 'Building Button, Input, Card, Badge, and Modal components with Tailwind.',
            videoUrl: 'https://www.youtube.com/watch?v=sample2',
            duration: '22 mins',
            isFree: false,
            isPublished: true,
            order: 2,
          },
        ],
      },
      {
        title: 'Module 2: State Management & Route Guards',
        description: 'Redux Toolkit, custom auth hooks, and role-based route protection.',
        order: 2,
        lessons: [
          {
            title: '2.1 Redux Toolkit Slices & Async Thunks',
            description: 'Managing global auth and theme state with type safety.',
            videoUrl: 'https://www.youtube.com/watch?v=sample3',
            duration: '25 mins',
            isFree: false,
            isPublished: true,
            order: 1,
          },
          {
            title: '2.2 Protected & Role-Based Route Guards',
            description: 'Enforcing client-side student vs admin access seamlessly.',
            videoUrl: 'https://www.youtube.com/watch?v=sample4',
            duration: '15 mins',
            isFree: false,
            isPublished: true,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'Data Structures & Algorithms Mastery',
    slug: 'data-structures-algorithms-mastery',
    shortDescription: 'Master 250+ standard coding interview problems organized strictly by algorithmic patterns.',
    description: 'Stop memorizing solutions. This course breaks down core patterns: Sliding Window, Two Pointers, Fast & Slow Pointers, Tree Traversals, Graphs, and Dynamic Programming.',
    category: 'DSA',
    level: 'All Levels',
    duration: '36 Hours',
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
      bio: 'Founder of NextEra Coders. Specializes in advanced Data Structures & Algorithms, High-Throughput Distributed Systems, and full-stack production architecture.',
    },
    tags: ['DSA', 'Algorithms', 'Interview Prep', 'Optimization'],
    requirements: ['Any programming language (JavaScript, Python, Java, or C++)', 'Basic understanding of loops and arrays'],
    whatYouWillLearn: [
      'Identify algorithmic patterns in unseen problem statements',
      'Optimize time and space complexity with formal Big-O proofs',
      'Master Dynamic Programming state transitions and tabulation',
      'Excel in FAANG/MANG technical coding interviews',
    ],
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: Array & String Patterns',
        description: 'Two Pointers, Sliding Window, Prefix Sums, and Hash Maps.',
        order: 1,
        lessons: [
          {
            title: '1.1 Two Pointer Convergence Technique',
            description: 'Solving Two Sum II, Trapping Rain Water, and 3Sum efficiently.',
            videoUrl: 'https://www.youtube.com/watch?v=sample5',
            duration: '30 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
          {
            title: '1.2 Variable-Length Sliding Window',
            description: 'Longest Substring Without Repeating Characters and Minimum Window Substring.',
            videoUrl: 'https://www.youtube.com/watch?v=sample6',
            duration: '28 mins',
            isFree: false,
            isPublished: true,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'Backend Systems: Express, MongoDB & Security',
    slug: 'backend-systems-express-mongodb',
    shortDescription: 'Design production REST APIs with HTTP-only cookies, Mongoose indexing, rate limiting, and Zod.',
    description: 'Learn real-world server engineering: Helmet security, CORS configurations, centralized error handling, database connection pooling, and automated seed workflows.',
    category: 'Backend Development',
    level: 'Intermediate',
    duration: '20 Hours',
    instructor: {
      name: 'Naveen Kumar',
      role: 'Co-Founder & Technical Architect',
      bio: 'Co-Founder & Technical Architect at NextEra Coders. Expert in backend infrastructure, cloud-native deployments, low-level design patterns, and algorithmic problem-solving.',
    },
    tags: ['Express', 'Node.js', 'MongoDB', 'Mongoose', 'Security'],
    requirements: ['Basic JavaScript knowledge', 'Node.js installed on your machine'],
    whatYouWillLearn: [
      'Implement secure HTTP-Only cookie JWT session management',
      'Structure clean Express architectures with Routes, Controllers, and Services',
      'Perform compound database indexing and query explain plans in MongoDB',
      'Apply rate limiting, CORS policies, and Helmet headers',
    ],
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: Authentication & Session Security',
        description: 'bcrypt hashing, JWT cookies, and role middleware.',
        order: 1,
        lessons: [
          {
            title: '1.1 Password Hashing & Salt Rounds',
            description: 'Why bcrypt 12 rounds is the industry baseline.',
            videoUrl: 'https://www.youtube.com/watch?v=sample7',
            duration: '16 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
          {
            title: '1.2 Cookie-Based JWT Auth Middleware',
            description: 'Preventing XSS and CSRF with SameSite and HTTP-only cookies.',
            videoUrl: 'https://www.youtube.com/watch?v=sample8',
            duration: '24 mins',
            isFree: false,
            isPublished: true,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'System Design (HLD + LLD) for FAANG & Unicorns',
    slug: 'system-design-masterclass-hld-lld',
    shortDescription: 'Master High-Level and Low-Level Design: Load balancers, caching, Kafka, distributed transactions, and design patterns.',
    description: 'Cracking senior engineering interviews requires deep systems mastery. Learn how to architect Twitter, Uber, Netflix, WhatsApp, and Google Drive from scratch with real scale calculations.',
    category: 'Backend Development',
    level: 'Advanced',
    duration: '45 Hours',
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
      bio: 'Founder of NextEra Coders. Specializes in advanced Data Structures & Algorithms, High-Throughput Distributed Systems, and full-stack production architecture.',
    },
    tags: ['System Design', 'HLD', 'LLD', 'Scalability', 'Microservices', 'Kafka'],
    requirements: ['Experience with at least one backend language', 'Basic understanding of databases and networking'],
    whatYouWillLearn: [
      'Design fault-tolerant distributed systems handling millions of QPS',
      'Master CAP theorem, PACELC, consistent hashing, and database sharding',
      'Implement Low-Level Design patterns (SOLID, Factory, Observer, Strategy, Rate Limiter)',
      'Ace FAANG/MANG Staff & Senior Software Engineer design rounds',
    ],
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: High-Level Architecture Core Primitives',
        description: 'Load balancing, DNS routing, CDNs, and multi-region replication.',
        order: 1,
        lessons: [
          {
            title: '1.1 Capacity Estimation & Back-of-the-Envelope Math',
            description: 'Calculating QPS, storage, memory, and bandwidth requirements accurately.',
            videoUrl: 'https://www.youtube.com/watch?v=sample_sd1',
            duration: '25 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
          {
            title: '1.2 Consistent Hashing & Distributed Caching with Redis',
            description: 'Cache-aside, write-through, write-back, and cache eviction policies.',
            videoUrl: 'https://www.youtube.com/watch?v=sample_sd2',
            duration: '32 mins',
            isFree: false,
            isPublished: true,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'Generative AI, LLMs & Multi-Agent Systems Masterclass',
    slug: 'genai-llm-langchain-mastery',
    shortDescription: 'Build autonomous AI agents, RAG pipelines, LangChain integrations, and vector embeddings with Gemini & OpenAI.',
    description: 'Learn to build production-ready AI applications: Retrieval Augmented Generation (RAG), fine-tuning models, agentic workflows, memory systems, and multimodal AI.',
    category: 'Full-Stack Development',
    level: 'Intermediate',
    duration: '38 Hours',
    instructor: {
      name: 'Naveen Kumar',
      role: 'Co-Founder & Technical Architect',
      bio: 'Co-Founder & Technical Architect at NextEra Coders. Expert in backend infrastructure, cloud-native deployments, low-level design patterns, and algorithmic problem-solving.',
    },
    tags: ['GenAI', 'LLM', 'LangChain', 'Python', 'Gemini', 'OpenAI', 'RAG'],
    requirements: ['Basic Python or JavaScript knowledge', 'Curiosity to build modern AI agents'],
    whatYouWillLearn: [
      'Build end-to-end RAG pipelines with Pinecone, ChromaDB, and LangChain',
      'Implement autonomous multi-agent systems with tool calling',
      'Fine-tune open-weights models (Llama 3, Gemma) on custom domain datasets',
      'Deploy low-latency AI backends with FastAPI and streaming responses',
    ],
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: Prompt Engineering & LLM APIs',
        description: 'Structured JSON outputs, temperature, tokens, and system prompts.',
        order: 1,
        lessons: [
          {
            title: '1.1 LLM Fundamentals & Function Calling',
            description: 'Connecting LLMs to real-world APIs and external database tools.',
            videoUrl: 'https://www.youtube.com/watch?v=sample_ai1',
            duration: '22 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    title: 'Next.js 15 & MERN Pro Career Accelerator',
    slug: 'nextjs-fullstack-ai-accelerator',
    shortDescription: 'Build ultra-fast, server-rendered SaaS platforms with Next.js 15 App Router, Server Actions, Stripe, and Redis.',
    description: 'The ultimate production curriculum for modern full-stack web engineering. Learn Server Components, optimistic UI, WebSockets, background queues, and cloud deployment.',
    category: 'Full-Stack Development',
    level: 'All Levels',
    duration: '40 Hours',
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
      bio: 'Founder of NextEra Coders. Specializes in advanced Data Structures & Algorithms, High-Throughput Distributed Systems, and full-stack production architecture.',
    },
    tags: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Stripe', 'Redis'],
    requirements: ['JavaScript/TypeScript familiarity', 'Basic React knowledge'],
    whatYouWillLearn: [
      'Master Next.js 15 App Router, Server Actions, and Streaming SSR',
      'Implement multi-tier subscription payments with Stripe Webhooks',
      'Build real-time collaborative applications with WebSockets and Redis Pub/Sub',
      'Deploy on Vercel and AWS with automated CI/CD pipelines',
    ],
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: Next.js 15 Server-First Architecture',
        description: 'RSC vs Client Components, parallel routes, and intercepted routes.',
        order: 1,
        lessons: [
          {
            title: '1.1 Next.js 15 App Router In-Depth',
            description: 'Streaming, Suspense boundaries, and performance optimization.',
            videoUrl: 'https://www.youtube.com/watch?v=sample_next1',
            duration: '28 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    title: 'Modern HTML5 & Responsive CSS3 Foundations',
    slug: 'html5-css3-modern-web-foundations',
    shortDescription: '100% Free interactive starter: Semantic HTML5, Flexbox, CSS Grid, animations, and responsive web design.',
    description: 'Start your coding journey with modern web foundations. Master clean semantic structure, mobile-first responsive layouts, CSS variables, and modern UI styling from scratch.',
    category: 'Full-Stack Development',
    level: 'Beginner',
    duration: '14 Hours',
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
      bio: 'Founder of NextEra Coders. Specializes in advanced Data Structures & Algorithms, High-Throughput Distributed Systems, and full-stack production architecture.',
    },
    tags: ['HTML5', 'CSS3', 'Flexbox', 'CSS Grid', 'Responsive Design'],
    requirements: ['No prior programming experience needed', 'A web browser and code editor'],
    whatYouWillLearn: [
      'Write semantic, accessible HTML5 for SEO and screen readers',
      'Build complex responsive layouts with CSS Flexbox & Grid',
      'Create smooth CSS transitions, keyframe animations, and micro-interactions',
      'Deploy your live portfolio website to GitHub Pages & Vercel for free',
    ],
    originalPrice: 0,
    proPrice: 0,
    freePrice: 0,
    isProAvailable: false,
    isIncludedInMembership: false,
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: Semantic HTML & Document Architecture',
        description: 'Semantic tags, forms, accessibility (a11y), and media elements.',
        order: 1,
        lessons: [
          {
            title: '1.1 Modern Semantic HTML5 Tags',
            description: 'Header, nav, main, section, article, and footer semantics.',
            videoUrl: 'https://www.youtube.com/watch?v=sample_free1',
            duration: '18 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
          {
            title: '1.2 Accessible Forms & Input Validation',
            description: 'Building accessible inputs, labels, and validation states.',
            videoUrl: 'https://www.youtube.com/watch?v=sample_free2',
            duration: '20 mins',
            isFree: true,
            isPublished: true,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'JavaScript Fundamentals & DOM Manipulation',
    slug: 'javascript-essentials-for-beginners',
    shortDescription: '100% Free: Master core JavaScript, ES6+ syntax, asynchronous programming, APIs, and DOM manipulation.',
    description: 'The definitive free JavaScript crash course. Learn variables, functions, closures, promises, async/await, array methods, and event handling by building real browser projects.',
    category: 'JavaScript',
    level: 'Beginner',
    duration: '18 Hours',
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
      bio: 'Founder of NextEra Coders. Specializes in advanced Data Structures & Algorithms, High-Throughput Distributed Systems, and full-stack production architecture.',
    },
    tags: ['JavaScript', 'ES6', 'DOM', 'Async/Await', 'Fetch API'],
    requirements: ['Basic HTML & CSS knowledge'],
    whatYouWillLearn: [
      'Master modern ES6+ features: destructuring, rest/spread, arrow functions, modules',
      'Manipulate the DOM dynamically and handle user input events',
      'Fetch data from external REST APIs using async/await and promises',
      'Understand closures, execution contexts, and event loops',
    ],
    originalPrice: 0,
    proPrice: 0,
    freePrice: 0,
    isProAvailable: false,
    isIncludedInMembership: false,
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: Core Syntax & Data Structures',
        description: 'Variables, data types, control flow, functions, and arrays.',
        order: 1,
        lessons: [
          {
            title: '1.1 ES6+ Modern JavaScript Syntax',
            description: 'Let, const, arrow functions, template literals, and destructuring.',
            videoUrl: 'https://www.youtube.com/watch?v=sample_js1',
            duration: '22 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    title: 'Python Programming Essentials for Absolute Beginners',
    slug: 'python-programming-fundamentals',
    shortDescription: '100% Free: Learn Python programming from scratch with clean syntax, data structures, and automation scripts.',
    description: 'Learn Python the right way. Covers numbers, strings, lists, dictionaries, functions, OOP basics, file handling, and writing mini automation tools with zero setup.',
    category: 'Python',
    level: 'Beginner',
    duration: '16 Hours',
    instructor: {
      name: 'Naveen Kumar',
      role: 'Co-Founder & Technical Architect',
      bio: 'Co-Founder & Technical Architect at NextEra Coders. Expert in backend infrastructure, cloud-native deployments, low-level design patterns, and algorithmic problem-solving.',
    },
    tags: ['Python', 'Automation', 'Beginner', 'OOP', 'Scripts'],
    requirements: ['No prior programming background required'],
    whatYouWillLearn: [
      'Write clean, readable Pythonic code following PEP 8 guidelines',
      'Master core data structures: lists, tuples, sets, and dictionaries',
      'Implement Object-Oriented Programming (OOP) with classes and inheritance',
      'Automate daily tasks with Python scripts and file operations',
    ],
    originalPrice: 0,
    proPrice: 0,
    freePrice: 0,
    isProAvailable: false,
    isIncludedInMembership: false,
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: Python Basics & Control Structures',
        description: 'Syntax, operators, conditionals, loops, and custom functions.',
        order: 1,
        lessons: [
          {
            title: '1.1 Python Setup & First Script',
            description: 'Running Python scripts, REPL, and basic IO operations.',
            videoUrl: 'https://www.youtube.com/watch?v=sample_py1',
            duration: '18 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    title: 'Git & GitHub Collaboration Mastery',
    slug: 'git-github-collaboration-mastery',
    shortDescription: '100% Free: Master version control, branching workflows, pull requests, merge conflict resolution, and open-source contributions.',
    description: 'Become proficient with industry Git workflows. Learn commits, branching, rebasing, stash, merge conflict resolution, GitHub actions basics, and contributing to open-source.',
    category: 'Full-Stack Development',
    level: 'All Levels',
    duration: '10 Hours',
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
      bio: 'Founder of NextEra Coders. Specializes in advanced Data Structures & Algorithms, High-Throughput Distributed Systems, and full-stack production architecture.',
    },
    tags: ['Git', 'GitHub', 'Open Source', 'Version Control', 'CI/CD'],
    requirements: ['Basic computer and terminal familiarity'],
    whatYouWillLearn: [
      'Master Git commands: commit, branch, merge, rebase, cherry-pick, and stash',
      'Resolve complex merge conflicts with confidence',
      'Open professional Pull Requests and perform code reviews on GitHub',
      'Contribute to open-source projects using fork and upstream workflows',
    ],
    originalPrice: 0,
    proPrice: 0,
    freePrice: 0,
    isProAvailable: false,
    isIncludedInMembership: false,
    isFeatured: true,
    isPublished: true,
    modules: [
      {
        title: 'Module 1: Version Control Essentials',
        description: 'Repositories, staging area, commit history, and branches.',
        order: 1,
        lessons: [
          {
            title: '1.1 Git Architecture & Core Commands',
            description: 'Understanding working tree, staging index, and HEAD pointer.',
            videoUrl: 'https://www.youtube.com/watch?v=sample_git1',
            duration: '20 mins',
            isFree: true,
            isPublished: true,
            order: 1,
          },
        ],
      },
    ],
  },
];

export async function seedDatabase() {
  try {
    await connectDB();
    logger.info('Running NextEra Coders Database Seeder (Phase 4)...');

    // 1. Seed Master Super Admin Account (Owner: nexteracoders@gmail.com)
    const masterEmail = 'nexteracoders@gmail.com';
    const masterPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@NextEra2026!';
    let masterUser = await User.findOne({ email: masterEmail });

    if (!masterUser) {
      masterUser = await User.create({
        name: 'NextEra Coders (Founder & Owner)',
        email: masterEmail,
        password: masterPassword,
        role: 'admin',
        bio: 'Chief Platform Architect & Original Owner of NextEra Coders.',
        skills: ['TypeScript', 'Express', 'React', 'MongoDB', 'System Design'],
      });
      logger.info(`[Seed] Created Master Super Admin account: ${masterEmail}`);
    } else {
      masterUser.role = 'admin';
      await masterUser.save();
      logger.info(`[Seed] Verified Master Super Admin account: ${masterEmail}`);
    }

    const adminUser = masterUser;

    // Optional secondary seed admin
    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@nexteracoders.com';
    if (adminEmail !== masterEmail) {
      let secondaryAdmin = await User.findOne({ email: adminEmail });
      if (!secondaryAdmin) {
        await User.create({
          name: 'Platform Administrator',
          email: adminEmail,
          password: masterPassword,
          role: 'admin',
          bio: 'Administrative assistant account.',
        });
      }
    }

    // 2. Seed Demo Student Account
    const studentEmail = process.env.STUDENT_SEED_EMAIL || 'student@nexteracoders.com';
    const studentPassword = process.env.STUDENT_SEED_PASSWORD || 'Student@NextEra2026!';
    let studentUser = await User.findOne({ email: studentEmail });

    if (!studentUser) {
      studentUser = await User.create({
        name: 'Alex Johnson',
        email: studentEmail,
        password: studentPassword,
        role: 'student',
        bio: 'Aspiring Full-Stack Software Engineer mastering MERN and DSA.',
        skills: ['JavaScript', 'HTML5', 'CSS3', 'React basics'],
        learningStreak: 7,
        points: 450,
      });
      logger.info(`[Seed] Created initial Student account: ${studentEmail}`);
    }

    // 3. Seed Courses, Modules & Lessons (Clean refresh)
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Enrollment.deleteMany({});
    logger.info('[Seed] Cleaned previous courses, modules, and lessons for fresh seeding.');

    for (const cData of seedCoursesData) {
      const coursePayload: any = {
        title: cData.title,
        slug: cData.slug,
        shortDescription: cData.shortDescription,
        description: cData.description,
        category: cData.category,
        level: cData.level,
        duration: cData.duration,
        instructor: cData.instructor,
        tags: cData.tags,
        requirements: cData.requirements,
        whatYouWillLearn: cData.whatYouWillLearn,
        originalPrice: (cData as any).originalPrice !== undefined ? (cData as any).originalPrice : 9999,
        proPrice: (cData as any).proPrice !== undefined ? (cData as any).proPrice : 1999,
        freePrice: (cData as any).freePrice !== undefined ? (cData as any).freePrice : 0,
        isProAvailable: (cData as any).isProAvailable !== undefined ? (cData as any).isProAvailable : true,
        isIncludedInMembership: (cData as any).isIncludedInMembership !== undefined ? (cData as any).isIncludedInMembership : true,
        isFeatured: cData.isFeatured,
        isPublished: cData.isPublished,
      };

      const course = await Course.create(coursePayload);
      logger.info(`[Seed] Created course: ${cData.title} (Published: ${cData.isPublished}, Pro: ${coursePayload.isProAvailable})`);

      // Seed modules and lessons
      for (const mData of cData.modules) {
        const mod = await Module.create({
          courseId: course._id,
          title: mData.title,
          description: mData.description,
          order: mData.order,
        });

        for (const lData of mData.lessons) {
          await Lesson.create({
            courseId: course._id,
            moduleId: mod._id,
            title: lData.title,
            description: lData.description,
            videoUrl: lData.videoUrl || '',
            duration: lData.duration,
            isFree: lData.isFree,
            isPublished: lData.isPublished,
            order: lData.order,
          });
        }
      }
    }

    // 4. Seed initial enrollment for demo student in first course
    const firstPublishedCourse = await Course.findOne({ isPublished: true });
    if (firstPublishedCourse && studentUser) {
      const existingEnrollment = await Enrollment.findOne({
        userId: studentUser._id,
        courseId: firstPublishedCourse._id,
      });
      if (!existingEnrollment) {
        await Enrollment.create({
          userId: studentUser._id,
          courseId: firstPublishedCourse._id,
          progress: 25,
          completedLessons: [],
        });
        logger.info(`[Seed] Enrolled demo student in: ${firstPublishedCourse.title}`);
      }
    }

    // 5. Seed Coding Problems with Topics & YouTube Tutorials
    const seedProblems = [
      {
        title: 'Two Sum',
        slug: 'two-sum',
        description:
          'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        difficulty: 'Easy',
        category: 'Arrays',
        youtubeUrl: 'https://www.youtube.com/watch?v=KLlXCFG5TnA',
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.',
        ],
        examples: [
          {
            input: '[2,7,11,15]\n9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
          },
          {
            input: '[3,2,4]\n6',
            output: '[1,2]',
            explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
          },
        ],
        hints: [
          'A really brute force way would be to search for all possible pairs of numbers but that would be slow.',
          'Try using a Hash Map to record complement values in O(n) time.',
        ],
        starterCode: {
          javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
          python: `def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i
    return []`,
        },
        solution: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
        testCases: [
          { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]', hidden: false },
          { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]', hidden: false },
          { input: 'nums = [3,3], target = 6', expectedOutput: '[0,1]', hidden: false },
          { input: 'nums = [-3,4,3,90], target = 0', expectedOutput: '[0,2]', hidden: true },
          { input: 'nums = [-10,-5,-3,7,15], target = 10', expectedOutput: '[1,4]', hidden: true },
        ],
        expectedComplexity: { time: 'O(n)', space: 'O(n)' },
        isPublished: true,
        order: 1,
      },
      {
        title: 'Valid Parentheses',
        slug: 'valid-parentheses',
        description:
          'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
        difficulty: 'Easy',
        category: 'Stack',
        youtubeUrl: 'https://www.youtube.com/watch?v=WTzjTskDFMg',
        constraints: [
          '1 <= s.length <= 10^4',
          's consists of parentheses only "()[]{}"',
        ],
        examples: [
          {
            input: '"()"',
            output: 'true',
            explanation: 'The brackets match correctly.',
          },
          {
            input: '"()[]{}"',
            output: 'true',
            explanation: 'All brackets are properly balanced.',
          },
          {
            input: '"(]"',
            output: 'false',
            explanation: 'Mismatched bracket types.',
          },
        ],
        hints: [
          'Use a stack to track open brackets.',
          'When you encounter a closing bracket, check if it matches the top of your stack.',
        ],
        starterCode: {
          javascript: `function solution(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char in map) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
          python: `def solution(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack`,
        },
        solution: `function solution(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char in map) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
        testCases: [
          { input: '"()"', expectedOutput: 'true', hidden: false },
          { input: '"()[]{}"', expectedOutput: 'true', hidden: false },
          { input: '"(]"', expectedOutput: 'false', hidden: false },
          { input: '"([)]"', expectedOutput: 'false', hidden: true },
          { input: '"{[]}"', expectedOutput: 'true', hidden: true },
        ],
        expectedComplexity: { time: 'O(n)', space: 'O(n)' },
        isPublished: true,
        order: 2,
      },
      {
        title: 'Binary Search',
        slug: 'binary-search',
        description:
          'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
        difficulty: 'Easy',
        category: 'Binary Search',
        youtubeUrl: 'https://www.youtube.com/watch?v=s4D9ydZScWQ',
        constraints: [
          '1 <= nums.length <= 10^4',
          '-10^4 < nums[i], target < 10^4',
          'All integers in nums are unique.',
          'nums is sorted in ascending order.',
        ],
        examples: [
          {
            input: '[-1,0,3,5,9,12]\n9',
            output: '4',
            explanation: '9 exists in nums and its index is 4',
          },
          {
            input: '[-1,0,3,5,9,12]\n2',
            output: '-1',
            explanation: '2 does not exist in nums so return -1',
          },
        ],
        hints: [
          'Initialize left = 0 and right = nums.length - 1.',
          'Calculate mid = Math.floor((left + right) / 2) and narrow the search range.',
        ],
        starterCode: {
          javascript: `function solution(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
        },
        testCases: [
          { input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4', hidden: false },
          { input: '[-1,0,3,5,9,12]\n2', expectedOutput: '-1', hidden: false },
          { input: '[5]\n5', expectedOutput: '0', hidden: true },
        ],
        expectedComplexity: { time: 'O(log n)', space: 'O(1)' },
        isPublished: true,
        order: 3,
      },
      {
        title: 'Maximum Subarray (Kadane Algorithm)',
        slug: 'maximum-subarray',
        description:
          'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nThis classic optimization problem is commonly solved using Kadane\'s algorithm.',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        youtubeUrl: 'https://www.youtube.com/watch?v=5WZl3MMT0Eg',
        constraints: [
          '1 <= nums.length <= 10^5',
          '-10^4 <= nums[i] <= 10^4',
        ],
        examples: [
          {
            input: '[-2,1,-3,4,-1,2,1,-5,4]',
            output: '6',
            explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
          },
          {
            input: '[1]',
            output: '1',
            explanation: 'The subarray [1] has the largest sum 1.',
          },
        ],
        hints: [
          'Keep a running current sum and a max sum.',
          'If current sum becomes negative, reset it to 0.',
        ],
        starterCode: {
          javascript: `function solution(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}`,
        },
        testCases: [
          { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', hidden: false },
          { input: '[1]', expectedOutput: '1', hidden: false },
          { input: '[5,4,-1,7,8]', expectedOutput: '23', hidden: true },
        ],
        expectedComplexity: { time: 'O(n)', space: 'O(1)' },
        isPublished: true,
        order: 4,
      },
      {
        title: 'Valid Anagram',
        slug: 'valid-anagram',
        description:
          'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word formed by rearranging the letters of a different word, typically using all the original letters exactly once.',
        difficulty: 'Easy',
        category: 'Strings',
        youtubeUrl: 'https://www.youtube.com/watch?v=9UtInBqnCgA',
        constraints: [
          '1 <= s.length, t.length <= 5 * 10^4',
          's and t consist of lowercase English letters.',
        ],
        examples: [
          { input: '"anagram"\n"nagaram"', output: 'true', explanation: 'All letters match in frequency.' },
          { input: '"rat"\n"car"', output: 'false', explanation: 'Letters mismatch.' },
        ],
        hints: ['Count the frequencies of characters in both strings.'],
        starterCode: {
          javascript: `function solution(s, t) {
  if (s.length !== t.length) return false;
  const count = {};
  for (let c of s) count[c] = (count[c] || 0) + 1;
  for (let c of t) {
    if (!count[c]) return false;
    count[c]--;
  }
  return true;
}`,
        },
        testCases: [
          { input: '"anagram"\n"nagaram"', expectedOutput: 'true', hidden: false },
          { input: '"rat"\n"car"', expectedOutput: 'false', hidden: false },
          { input: '"a"\n"ab"', expectedOutput: 'false', hidden: true },
        ],
        expectedComplexity: { time: 'O(n)', space: 'O(1)' },
        isPublished: true,
        order: 5,
      },
      {
        title: 'Reverse Linked List',
        slug: 'reverse-linked-list',
        description:
          'Given the head of a singly linked list represented as an array of node values, return the reversed list.\n\nInput array format: `[1,2,3,4,5]` -> Output: `[5,4,3,2,1]`.',
        difficulty: 'Easy',
        category: 'Linked List',
        youtubeUrl: 'https://www.youtube.com/watch?v=G0_I-ZF0S38',
        constraints: [
          'The number of nodes in the list is the range [0, 5000].',
          '-5000 <= Node.val <= 5000',
        ],
        examples: [
          { input: '[1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'Reversed order.' },
          { input: '[1,2]', output: '[2,1]', explanation: 'Reversed order.' },
        ],
        hints: ['Maintain three pointers: prev, curr, and next.'],
        starterCode: {
          javascript: `function solution(head) {
  return head.reverse();
}`,
        },
        testCases: [
          { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', hidden: false },
          { input: '[1,2]', expectedOutput: '[2,1]', hidden: false },
          { input: '[]', expectedOutput: '[]', hidden: true },
        ],
        expectedComplexity: { time: 'O(n)', space: 'O(1)' },
        isPublished: true,
        order: 6,
      },
      {
        title: 'Invert Binary Tree',
        slug: 'invert-binary-tree',
        description:
          'Given the root of a binary tree represented as level-order array, invert the tree, and return its level-order array representation.',
        difficulty: 'Easy',
        category: 'Trees',
        youtubeUrl: 'https://www.youtube.com/watch?v=OnSn2XEQ4MY',
        constraints: [
          'The number of nodes in the tree is in the range [0, 100].',
          '-100 <= Node.val <= 100',
        ],
        examples: [
          { input: '[4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]', explanation: 'Subtrees are recursively mirrored.' },
        ],
        hints: ['Swap left and right children recursively.'],
        starterCode: {
          javascript: `function solution(root) {
  // Return inverted tree
  if (!root || root.length === 0) return [];
  return root;
}`,
        },
        testCases: [
          { input: '[4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]', hidden: false },
          { input: '[2,1,3]', expectedOutput: '[2,3,1]', hidden: false },
        ],
        expectedComplexity: { time: 'O(n)', space: 'O(h)' },
        isPublished: true,
        order: 7,
      },
    ];

    const allSeedProblems = [...seedProblems, ...dsaProblemsData];
    const uniqueSlugs = new Set<string>();
    for (const prob of allSeedProblems) {
      if (uniqueSlugs.has(prob.slug)) continue;
      uniqueSlugs.add(prob.slug);

      const existingProb = await CodingProblem.findOne({ slug: prob.slug });
      if (!existingProb) {
        await CodingProblem.create(prob);
        logger.info(`[Seed] Created CodingProblem: ${prob.title} (${prob.difficulty})`);
      } else {
        await CodingProblem.updateOne(
          { slug: prob.slug },
          {
            $set: {
              title: prob.title,
              category: prob.category,
              difficulty: prob.difficulty,
              description: prob.description,
              constraints: prob.constraints,
              examples: prob.examples,
              hints: prob.hints,
              testCases: prob.testCases,
              starterCode: prob.starterCode,
              expectedComplexity: prob.expectedComplexity,
              solution: prob.solution,
              isPublished: prob.isPublished,
              order: prob.order,
            },
          }
        );
      }
    }

    // 6. Seed Quizzes
    const firstCourse = await Course.findOne({ slug: 'fullstack-typescript-react-architecture' });
    const seedQuizzes = [
      {
        title: 'React Fundamentals & Component State',
        slug: 'react-fundamentals-component-state',
        description: 'Test your understanding of React 18 component lifecycle, state hooks, virtual DOM, and props passing.',
        courseId: firstCourse?._id,
        passingScore: 70,
        timeLimit: 10,
        isPublished: true,
        questions: [
          {
            question: 'What hook should you use to run side effects like subscriptions or manual DOM manipulations in a functional component?',
            options: ['useState', 'useEffect', 'useMemo', 'useRef'],
            correctAnswer: 'useEffect',
            explanation: 'useEffect is designed for handling side effects such as data fetching, timers, or subscribing to external stores.',
            marks: 1,
            order: 1,
          },
          {
            question: 'What is the primary benefit of React Virtual DOM?',
            options: [
              'It replaces standard JavaScript engines',
              'It minimizes expensive real DOM manipulations through batch reconciliation',
              'It provides built-in CSS styling',
              'It automatically handles database connections',
            ],
            correctAnswer: 'It minimizes expensive real DOM manipulations through batch reconciliation',
            explanation: 'The Virtual DOM keeps a lightweight representation in memory and computes minimal diffs before applying changes to the actual DOM.',
            marks: 1,
            order: 2,
          },
          {
            question: 'Which of the following describes unidirectional data flow in React?',
            options: [
              'Data is passed downwards from parent to child via props',
              'Child components directly modify parent state without callbacks',
              'All state is globally accessible without providers',
              'CSS styles flow automatically between sibling elements',
            ],
            correctAnswer: 'Data is passed downwards from parent to child via props',
            explanation: 'React enforces one-way data binding where parents pass props down and children notify parents via callback functions.',
            marks: 1,
            order: 3,
          },
          {
            question: 'What rule must you follow when using React Hooks?',
            options: [
              'Hooks can only be called inside loops or conditional if-statements',
              'Hooks must be called only at the top level of React function components',
              'Hooks cannot be used in custom functions',
              'You can only use one hook per component',
            ],
            correctAnswer: 'Hooks must be called only at the top level of React function components',
            explanation: 'Hooks rely on call order consistency across renders, so they must never be called inside loops, conditions, or nested functions.',
            marks: 1,
            order: 4,
          },
        ],
      },
      {
        title: 'TypeScript Generics & Utility Types',
        slug: 'typescript-generics-utility-types',
        description: 'Assess your knowledge of type parameters, Pick, Omit, Partial, keyof constraints, and conditional types.',
        passingScore: 75,
        timeLimit: 15,
        isPublished: true,
        questions: [
          {
            question: 'Which built-in utility type creates a type by picking all properties from Type and then removing Keys?',
            options: ['Pick<Type, Keys>', 'Omit<Type, Keys>', 'Exclude<UnionType, ExcludedMembers>', 'Partial<Type>'],
            correctAnswer: 'Omit<Type, Keys>',
            explanation: 'Omit<T, K> constructs a new type by picking all properties from T and then omitting keys specified in K.',
            marks: 1,
            order: 1,
          },
          {
            question: 'What does the "keyof" operator produce when applied to an interface?',
            options: [
              'An array of values',
              'A string or numeric literal union of its property keys',
              'A runtime object map',
              'A TypeScript enum',
            ],
            correctAnswer: 'A string or numeric literal union of its property keys',
            explanation: 'keyof T produces a union of literal string/number names corresponding to known keys of type T.',
            marks: 1,
            order: 2,
          },
        ],
      },
      {
        title: 'Backend API Security & Auth Principles (Draft)',
        slug: 'backend-api-security-draft',
        description: 'Draft quiz covering CORS, CSRF, JWT tokens, and SQL/NoSQL injections.',
        passingScore: 80,
        timeLimit: 10,
        isPublished: false, // DRAFT QUIZ FOR TESTING DRAFT VISIBILITY
        questions: [
          {
            question: 'Why should sensitive JWT tokens be stored in HTTP-only cookies instead of localStorage?',
            options: [
              'HTTP-only cookies cannot be accessed by clientside JavaScript, mitigating XSS attacks',
              'Cookies are faster than localStorage',
              'localStorage cannot store strings longer than 100 characters',
              'Browsers block all network requests if localStorage is used',
            ],
            correctAnswer: 'HTTP-only cookies cannot be accessed by clientside JavaScript, mitigating XSS attacks',
            explanation: 'The httpOnly flag prevents document.cookie access from malicious injected scripts.',
            marks: 1,
            order: 1,
          },
        ],
      },
    ];

    for (const qData of seedQuizzes) {
      const existingQ = await Quiz.findOne({ slug: qData.slug });
      if (!existingQ) {
        await Quiz.create(qData);
        logger.info(`[Seed] Created Quiz: ${qData.title} (Published: ${qData.isPublished})`);
      }
    }

    // 7. Seed Projects
    const seedProjects = [
      {
        title: 'Full-Stack EdTech Learning Management Platform',
        slug: 'fullstack-edtech-learning-platform',
        description: 'Build an engineering-grade educational platform with React 18, TypeScript, Express, MongoDB, and an online code execution sandbox.',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
        difficulty: 'Advanced',
        category: 'MERN',
        technologies: ['React 18', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Docker'],
        requirements: [
          'Solid understanding of React state management and hooks',
          'Experience building RESTful APIs with Node.js and Express',
          'Knowledge of MongoDB schema design and indexing',
        ],
        features: [
          'Interactive video player with lesson completion tracking',
          'In-browser coding sandbox with multi-language execution',
          'Quiz system with timer countdowns and automated grading',
          'Admin CMS for course, quiz, and challenge management',
        ],
        learningOutcomes: [
          'Master full-stack TypeScript monorepo architecture',
          'Implement secure isolated code sandboxes with execution bounds',
          'Design scalable database schemas with compound indexes',
        ],
        githubUrl: 'https://github.com/nexteracoders/nextera-learning-platform',
        demoUrl: 'https://learn.nexteracoders.com',
        isPublished: true,
        order: 1,
      },
      {
        title: 'Real-Time Collaborative Code Editor & Canvas',
        slug: 'realtime-collaborative-code-editor',
        description: 'Design a web-based collaborative IDE with WebSockets, syntax highlighting, and live cursor tracking across peers.',
        thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=60',
        difficulty: 'Intermediate',
        category: 'React',
        technologies: ['React', 'TypeScript', 'WebSockets', 'Tailwind CSS', 'Node.js'],
        requirements: ['Basic understanding of WebSockets or event emitters', 'React functional components'],
        features: [
          'Multi-user concurrent editing with Operational Transformation / CRDTs',
          'Real-time presence indicators and peer cursor avatars',
          'Live syntax parsing and code execution',
        ],
        learningOutcomes: [
          'Understand real-time WebSocket protocol handling',
          'Handle conflict resolution in shared text buffers',
        ],
        githubUrl: 'https://github.com/nexteracoders/collab-code-editor',
        demoUrl: 'https://editor.nexteracoders.com',
        isPublished: true,
        order: 2,
      },
      {
        title: 'High-Throughput Task Queue & Rate Limiter Service',
        slug: 'task-queue-rate-limiter-service',
        description: 'Construct a resilient distributed backend microservice featuring token bucket rate limiting, Redis caching, and job retries.',
        thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        difficulty: 'Advanced',
        category: 'Node.js',
        technologies: ['Node.js', 'Express', 'Redis', 'TypeScript', 'Jest'],
        requirements: ['Node.js fundamentals', 'Basic Redis understanding'],
        features: [
          'Sliding window & token bucket rate limiting middleware',
          'Dead letter queues (DLQ) with exponential backoff retries',
          'Prometheus metrics export and latency healthchecks',
        ],
        learningOutcomes: [
          'Mitigate DDoS attacks and prevent server saturation',
          'Design fail-safe background worker architectures',
        ],
        githubUrl: 'https://github.com/nexteracoders/task-queue-service',
        demoUrl: '',
        isPublished: true,
        order: 3,
      },
      {
        title: 'E-Commerce Microservices Engine (Draft)',
        slug: 'ecommerce-microservices-draft',
        description: 'Draft project for multi-tenant cart, catalog, and checkout services.',
        thumbnail: '',
        difficulty: 'Advanced',
        category: 'MERN',
        technologies: ['Node.js', 'Express', 'MongoDB'],
        requirements: ['Draft requirements'],
        features: ['Draft features'],
        learningOutcomes: ['Draft learning outcomes'],
        isPublished: false, // DRAFT FOR TESTING
        order: 4,
      },
    ];

    for (const pData of seedProjects) {
      const existingP = await Project.findOne({ slug: pData.slug });
      if (!existingP) {
        await Project.create(pData);
        logger.info(`[Seed] Created Project: ${pData.title} (Published: ${pData.isPublished})`);
      }
    }

    // 8. Seed Tutorials / Articles
    const seedTutorials = [
      {
        title: 'A Deep Dive into React 18 Concurrent Features & Transitions',
        slug: 'react-18-concurrent-features-transitions',
        excerpt: 'Understand how useTransition, useDeferredValue, and concurrent rendering allow React to interrupt rendering for urgent user inputs.',
        content: `## Introduction to Concurrent React

React 18 marks a fundamental milestone in the evolution of clientside rendering. Prior to React 18, rendering was a synchronous, uninterrupted process. Once React started rendering an update, nothing could interrupt it until the DOM was fully committed.

### The Problem with Long Renders

In data-heavy dashboards or complex search filters, re-rendering large component trees could freeze the UI thread, causing sluggish input responsiveness and dropped frames.

\`\`\`tsx
import React, { useState, useTransition } from 'react';

export const SearchList = () => {
  const [input, setInput] = useState('');
  const [list, setList] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Urgent update: reflect typed character immediately
    setInput(e.target.value);

    // Non-urgent transition update: calculate heavy filtered list
    startTransition(() => {
      const items = Array.from({ length: 10000 }, (_, i) => \`\${e.target.value} item \${i}\`);
      setList(items);
    });
  };

  return (
    <div className="space-y-4">
      <input value={input} onChange={handleChange} placeholder="Type to filter..." />
      {isPending && <p>Filtering list in background...</p>}
      <ul>
        {list.slice(0, 20).map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
};
\`\`\`

### Summary & Takeaways

1. **useTransition** separates high-priority updates (typing, clicking) from background rendering.
2. **useDeferredValue** defers expensive re-renders without managing explicit transition state.
3. Keep the user experience snappy by avoiding blocking main-thread calculations.`,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
        category: 'React',
        tags: ['React', 'Performance', 'Concurrent', 'Frontend'],
        author: adminUser._id,
        isPublished: true,
      },
      {
        title: 'Mastering MongoDB Compound Indexes & Query Performance',
        slug: 'mastering-mongodb-compound-indexes',
        excerpt: 'Learn the Equality, Sort, Range (ESR) rule to design compound indexes that transform slow collection scans into sub-millisecond lookups.',
        content: `## Why Indexing Matters

In production databases, query performance makes or breaks user experience. As collections grow past millions of documents, unindexed queries result in catastrophic **COLLSCAN** (collection scans) that lock CPU cores and drain memory.

### The ESR Rule (Equality, Sort, Range)

When constructing compound indexes, always order index keys following the ESR principle:

1. **Equality (E)**: Fields queried with exact matching (\`status: 'active'\`, \`userId: 123\`).
2. **Sort (S)**: Fields used for sorting order (\`createdAt: -1\`).
3. **Range (R)**: Fields queried with range operators like \`$gt\`, \`$lt\`, \`$in\`, or \`$regex\`.

\`\`\`javascript
// Optimal compound index following ESR:
// Query: { courseId: id, isPublished: true, price: { $gte: 50 } }.sort({ createdAt: -1 })
// Index:
db.courses.createIndex({ courseId: 1, isPublished: 1, createdAt: -1, price: 1 });
\`\`\`

### Analyzing with \`explain("executionStats")\`

Always verify that your query achieves **IXSCAN** and that \`totalDocsExamined\` closely matches \`nReturned\`. If \`totalDocsExamined\` is substantially higher, your index is not covering the query efficiently.`,
        thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
        category: 'Backend',
        tags: ['MongoDB', 'Database', 'Performance', 'Indexing'],
        author: adminUser._id,
        isPublished: true,
      },
      {
        title: 'Draft Article on Microservices Networking (Draft)',
        slug: 'draft-microservices-networking',
        excerpt: 'Unpublished draft notes on gRPC and service mesh.',
        content: 'Draft tutorial content...',
        thumbnail: '',
        category: 'Architecture',
        tags: ['Draft', 'Architecture'],
        author: adminUser._id,
        isPublished: false, // DRAFT FOR TESTING DRAFT VISIBILITY
      },
    ];

    for (const tData of seedTutorials) {
      const existingT = await Tutorial.findOne({ slug: tData.slug });
      if (!existingT) {
        await Tutorial.create(tData);
        logger.info(`[Seed] Created Tutorial: ${tData.title} (Published: ${tData.isPublished})`);
      }
    }

    // ==========================================
    // 5.5. SEED DSA CODING PROBLEMS
    // ==========================================
    const seedProblemsData = [
      {
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: 'Easy',
        category: 'Arrays & Hashing',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' }
        ],
        testCases: [
          { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', hidden: false },
          { input: '[3,2,4], 6', expectedOutput: '[1,2]', hidden: false },
          { input: '[3,3], 6', expectedOutput: '[0,1]', hidden: true }
        ],
        starterCode: {
          javascript: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
          python: 'class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in seen:\n                return [seen[diff], i]\n            seen[n] = i\n        return []',
          java: 'import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                return new int[] { map.get(diff), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}',
          cpp: '#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> map;\n        for (int i = 0; i < nums.size(); ++i) {\n            int diff = target - nums[i];\n            if (map.count(diff)) return {map[diff], i};\n            map[nums[i]] = i;\n        }\n        return {};\n    }\n};'
        },
        supportedLanguages: ['javascript', 'python', 'java', 'cpp'],
        expectedComplexity: { time: 'O(N)', space: 'O(N)' },
        isPublished: true,
        order: 1
      },
      {
        title: 'Maximum and Minimum Element in an Array',
        slug: 'maximum-and-minimum-element-in-an-array',
        difficulty: 'Easy',
        category: 'Arrays',
        description: 'Given an array nums of size N, find the maximum and minimum elements in the array using minimum comparisons.',
        constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
        examples: [
          { input: 'nums = [3, 5, 4, 1, 9]', output: '[1, 9]', explanation: 'Min is 1, max is 9.' }
        ],
        testCases: [
          { input: '[3, 5, 4, 1, 9]', expectedOutput: '[1, 9]', hidden: false },
          { input: '[22, 14, 8, 17, 35, 3]', expectedOutput: '[3, 35]', hidden: false }
        ],
        starterCode: {
          javascript: 'function findMinMax(nums) {\n  let min = nums[0], max = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    if (nums[i] < min) min = nums[i];\n    if (nums[i] > max) max = nums[i];\n  }\n  return [min, max];\n}',
          python: 'class Solution:\n    def findMinMax(self, nums: list[int]) -> list[int]:\n        return [min(nums), max(nums)]',
          java: 'class Solution {\n    public int[] findMinMax(int[] nums) {\n        int min = nums[0], max = nums[0];\n        for (int x : nums) {\n            if (x < min) min = x;\n            if (x > max) max = x;\n        }\n        return new int[]{min, max};\n    }\n}',
          cpp: '#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> findMinMax(vector<int>& nums) {\n        int mn = nums[0], mx = nums[0];\n        for (int x : nums) { mn = min(mn, x); mx = max(mx, x); }\n        return {mn, mx};\n    }\n};'
        },
        supportedLanguages: ['javascript', 'python', 'java', 'cpp'],
        expectedComplexity: { time: 'O(N)', space: 'O(1)' },
        isPublished: true,
        order: 2
      },
      {
        title: 'Reverse the Array',
        slug: 'reverse-the-array',
        difficulty: 'Easy',
        category: 'Arrays',
        description: 'Given an array nums, reverse the array in-place.',
        constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
        examples: [
          { input: 'nums = [1, 2, 3, 4, 5]', output: '[5, 4, 3, 2, 1]', explanation: 'Reversed order.' }
        ],
        testCases: [
          { input: '[1, 2, 3, 4, 5]', expectedOutput: '[5, 4, 3, 2, 1]', hidden: false },
          { input: '[4, 5, 1, 2]', expectedOutput: '[2, 1, 5, 4]', hidden: false }
        ],
        starterCode: {
          javascript: 'function reverseArray(nums) {\n  let l = 0, r = nums.length - 1;\n  while (l < r) {\n    [nums[l], nums[r]] = [nums[r], nums[l]];\n    l++; r--;\n  }\n  return nums;\n}',
          python: 'class Solution:\n    def reverseArray(self, nums: list[int]) -> list[int]:\n        nums.reverse()\n        return nums',
          java: 'class Solution {\n    public int[] reverseArray(int[] nums) {\n        int i = 0, j = nums.length - 1;\n        while (i < j) {\n            int t = nums[i]; nums[i] = nums[j]; nums[j] = t; i++; j--;\n        }\n        return nums;\n    }\n}',
          cpp: '#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> reverseArray(vector<int>& nums) {\n        reverse(nums.begin(), nums.end());\n        return nums;\n    }\n};'
        },
        supportedLanguages: ['javascript', 'python', 'java', 'cpp'],
        expectedComplexity: { time: 'O(N)', space: 'O(1)' },
        isPublished: true,
        order: 3
      },
      {
        title: 'Maximum Subarray',
        slug: 'maximum-subarray',
        difficulty: 'Medium',
        category: 'Arrays',
        description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum using Kadane\'s Algorithm.',
        constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
        examples: [
          { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' }
        ],
        testCases: [
          { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', hidden: false },
          { input: '[5,4,-1,7,8]', expectedOutput: '23', hidden: false }
        ],
        starterCode: {
          javascript: 'function maxSubArray(nums) {\n  let maxSum = nums[0], curSum = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    curSum = Math.max(nums[i], curSum + nums[i]);\n    maxSum = Math.max(maxSum, curSum);\n  }\n  return maxSum;\n}',
          python: 'class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        max_s = cur_s = nums[0]\n        for x in nums[1:]:\n            cur_s = max(x, cur_s + x)\n            max_s = max(max_s, cur_s)\n        return max_s',
          java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        int max = nums[0], cur = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            cur = Math.max(nums[i], cur + nums[i]);\n            max = Math.max(max, cur);\n        }\n        return max;\n    }\n}',
          cpp: '#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        int mx = nums[0], cur = nums[0];\n        for (size_t i = 1; i < nums.size(); ++i) {\n            cur = max(nums[i], cur + nums[i]);\n            mx = max(mx, cur);\n        }\n        return mx;\n    }\n};'
        },
        supportedLanguages: ['javascript', 'python', 'java', 'cpp'],
        expectedComplexity: { time: 'O(N)', space: 'O(1)' },
        isPublished: true,
        order: 4
      },
      {
        title: 'Trapping Rain Water',
        slug: 'trapping-rain-water',
        difficulty: 'Hard',
        category: 'Arrays',
        description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
        constraints: ['1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
        examples: [
          { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: '6 units of rain water trapped.' }
        ],
        testCases: [
          { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6', hidden: false },
          { input: '[4,2,0,3,2,5]', expectedOutput: '9', hidden: false }
        ],
        starterCode: {
          javascript: 'function trap(height) {\n  let l = 0, r = height.length - 1, lMax = 0, rMax = 0, water = 0;\n  while (l < r) {\n    if (height[l] < height[r]) {\n      if (height[l] >= lMax) lMax = height[l];\n      else water += lMax - height[l];\n      l++;\n    } else {\n      if (height[r] >= rMax) rMax = height[r];\n      else water += rMax - height[r];\n      r--;\n    }\n  }\n  return water;\n}',
          python: 'class Solution:\n    def trap(self, height: list[int]) -> int:\n        l, r = 0, len(height) - 1\n        l_max = r_max = water = 0\n        while l < r:\n            if height[l] < height[r]:\n                if height[l] >= l_max: l_max = height[l]\n                else: water += l_max - height[l]\n                l += 1\n            else:\n                if height[r] >= r_max: r_max = height[r]\n                else: water += r_max - height[r]\n                r -= 1\n        return water',
          java: 'class Solution {\n    public int trap(int[] height) {\n        int l = 0, r = height.length - 1, lMax = 0, rMax = 0, ans = 0;\n        while (l < r) {\n            if (height[l] < height[r]) {\n                if (height[l] >= lMax) lMax = height[l];\n                else ans += lMax - height[l];\n                l++;\n            } else {\n                if (height[r] >= rMax) rMax = height[r];\n                else ans += rMax - height[r];\n                r--;\n            }\n        }\n        return ans;\n    }\n}',
          cpp: '#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        int l = 0, r = height.size() - 1, lMax = 0, rMax = 0, ans = 0;\n        while (l < r) {\n            if (height[l] < height[r]) {\n                if (height[l] >= lMax) lMax = height[l];\n                else ans += lMax - height[l];\n                l++;\n            } else {\n                if (height[r] >= rMax) rMax = height[r];\n                else ans += rMax - height[r];\n                r--;\n            }\n        }\n        return ans;\n    }\n};'
        },
        supportedLanguages: ['javascript', 'python', 'java', 'cpp'],
        expectedComplexity: { time: 'O(N)', space: 'O(1)' },
        isPublished: true,
        order: 5
      },
      {
        title: 'Valid Palindrome',
        slug: 'valid-palindrome',
        difficulty: 'Easy',
        category: 'Strings',
        description: 'Given a string s, return true if it is a palindrome, or false otherwise.',
        constraints: ['1 <= s.length <= 2 * 10^5'],
        examples: [
          { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' }
        ],
        testCases: [
          { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', hidden: false },
          { input: '"race a car"', expectedOutput: 'false', hidden: false }
        ],
        starterCode: {
          javascript: 'function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}',
          python: 'class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        clean = [c.lower() for c in s if c.isalnum()]\n        return clean == clean[::-1]',
          java: 'class Solution {\n    public boolean isPalindrome(String s) {\n        int i = 0, j = s.length() - 1;\n        while (i < j) {\n            while (i < j && !Character.isLetterOrDigit(s.charAt(i))) i++;\n            while (i < j && !Character.isLetterOrDigit(s.charAt(j))) j--;\n            if (Character.toLowerCase(s.charAt(i)) != Character.toLowerCase(s.charAt(j))) return false;\n            i++; j--;\n        }\n        return true;\n    }\n}',
          cpp: '#include <string>\n#include <cctype>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isPalindrome(string s) {\n        int i = 0, j = s.size() - 1;\n        while (i < j) {\n            while (i < j && !isalnum(s[i])) i++;\n            while (i < j && !isalnum(s[j])) j--;\n            if (tolower(s[i]) != tolower(s[j])) return false;\n            i++; j--;\n        }\n        return true;\n    }\n};'
        },
        supportedLanguages: ['javascript', 'python', 'java', 'cpp'],
        expectedComplexity: { time: 'O(N)', space: 'O(1)' },
        isPublished: true,
        order: 6
      },
      {
        title: 'Number of Islands',
        slug: 'number-of-islands',
        difficulty: 'Medium',
        category: 'Graphs',
        description: 'Given an m x n 2D binary grid grid which represents a map of 1s (land) and 0s (water), return the number of islands.',
        constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300'],
        examples: [
          { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1', explanation: '1 connected island.' }
        ],
        testCases: [
          { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1', hidden: false },
          { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3', hidden: false }
        ],
        starterCode: {
          javascript: 'function numIslands(grid) {\n  if (!grid || !grid.length) return 0;\n  let count = 0, m = grid.length, n = grid[0].length;\n  function dfs(r, c) {\n    if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] !== "1") return;\n    grid[r][c] = "0";\n    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);\n  }\n  for (let r = 0; r < m; r++) {\n    for (let c = 0; c < n; c++) {\n      if (grid[r][c] === "1") { count++; dfs(r, c); }\n    }\n  }\n  return count;\n}',
          python: 'class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        if not grid: return 0\n        m, n, count = len(grid), len(grid[0]), 0\n        def dfs(r, c):\n            if r < 0 or c < 0 or r >= m or c >= n or grid[r][c] != "1": return\n            grid[r][c] = "0"\n            dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)\n        for r in range(m):\n            for c in range(n):\n                if grid[r][c] == "1":\n                    count += 1; dfs(r, c)\n        return count',
          java: 'class Solution {\n    public int numIslands(char[][] grid) {\n        if (grid == null || grid.length == 0) return 0;\n        int count = 0, m = grid.length, n = grid[0].length;\n        for (int r = 0; r < m; r++) {\n            for (int c = 0; c < n; c++) {\n                if (grid[r][c] == \'1\') {\n                    count++; dfs(grid, r, c, m, n);\n                }\n            }\n        }\n        return count;\n    }\n    private void dfs(char[][] grid, int r, int c, int m, int n) {\n        if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] != \'1\') return;\n        grid[r][c] = \'0\';\n        dfs(grid, r + 1, c, m, n); dfs(grid, r - 1, c, m, n);\n        dfs(grid, r, c + 1, m, n); dfs(grid, r, c - 1, m, n);\n    }\n}',
          cpp: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        if (grid.empty()) return 0;\n        int count = 0, m = grid.size(), n = grid[0].size();\n        for (int r = 0; r < m; r++) {\n            for (int c = 0; c < n; c++) {\n                if (grid[r][c] == \'1\') { count++; dfs(grid, r, c, m, n); }\n            }\n        }\n        return count;\n    }\n    void dfs(vector<vector<char>>& grid, int r, int c, int m, int n) {\n        if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] != \'1\') return;\n        grid[r][c] = \'0\';\n        dfs(grid, r + 1, c, m, n); dfs(grid, r - 1, c, m, n);\n        dfs(grid, r, c + 1, m, n); dfs(grid, r, c - 1, m, n);\n    }\n};'
        },
        supportedLanguages: ['javascript', 'python', 'java', 'cpp'],
        expectedComplexity: { time: 'O(M * N)', space: 'O(M * N)' },
        isPublished: true,
        order: 7
      }
    ];

    for (const prob of seedProblemsData) {
      const existingProb = await CodingProblem.findOne({ slug: prob.slug });
      if (!existingProb) {
        await CodingProblem.create(prob);
        logger.info(`[Seed] Created Coding Problem: ${prob.title}`);
      }
    }

    // ==========================================
    // 6. SEED ACHIEVEMENTS
    // ==========================================
    const seedAchievements = [
      {
        name: 'First Course',
        slug: 'first-course',
        description: 'Successfully complete your first course on NextEra Coders.',
        icon: 'GraduationCap',
        category: 'Courses',
        requirementType: 'FIRST_COURSE',
        requirementValue: 1,
        points: 100,
        isActive: true,
      },
      {
        name: 'Course Master',
        slug: 'course-master',
        description: 'Complete 3 full-length engineering courses.',
        icon: 'Award',
        category: 'Courses',
        requirementType: 'COURSE_COMPLETED',
        requirementValue: 3,
        points: 300,
        isActive: true,
      },
      {
        name: 'First Problem',
        slug: 'first-problem',
        description: 'Get your first accepted DSA coding submission.',
        icon: 'Code',
        category: 'DSA',
        requirementType: 'FIRST_PROBLEM',
        requirementValue: 1,
        points: 50,
        isActive: true,
      },
      {
        name: 'DSA Beginner',
        slug: 'dsa-beginner',
        description: 'Solve 5 distinct coding practice problems.',
        icon: 'Zap',
        category: 'DSA',
        requirementType: 'PROBLEMS_SOLVED',
        requirementValue: 5,
        points: 100,
        isActive: true,
      },
      {
        name: '10 Problems Solved',
        slug: '10-problems-solved',
        description: 'Solve 10 distinct algorithmic problems.',
        icon: 'Flame',
        category: 'DSA',
        requirementType: 'PROBLEMS_SOLVED',
        requirementValue: 10,
        points: 200,
        isActive: true,
      },
      {
        name: 'DSA Explorer',
        slug: 'dsa-explorer',
        description: 'Solve 25 coding challenges across algorithmic topics.',
        icon: 'Compass',
        category: 'DSA',
        requirementType: 'PROBLEMS_SOLVED',
        requirementValue: 25,
        points: 500,
        isActive: true,
      },
      {
        name: '50 Problems Solved',
        slug: '50-problems-solved',
        description: 'Solve 50 distinct algorithmic problems.',
        icon: 'Trophy',
        category: 'DSA',
        requirementType: 'PROBLEMS_SOLVED',
        requirementValue: 50,
        points: 1000,
        isActive: true,
      },
      {
        name: '100 Problems Solved',
        slug: '100-problems-solved',
        description: 'Master the 100 problem coding milestone.',
        icon: 'Crown',
        category: 'DSA',
        requirementType: 'PROBLEMS_SOLVED',
        requirementValue: 100,
        points: 2000,
        isActive: true,
      },
      {
        name: 'First Quiz',
        slug: 'first-quiz',
        description: 'Complete and submit your first knowledge assessment.',
        icon: 'CheckCircle',
        category: 'Quizzes',
        requirementType: 'FIRST_QUIZ',
        requirementValue: 1,
        points: 50,
        isActive: true,
      },
      {
        name: 'Quiz Master',
        slug: 'quiz-master',
        description: 'Complete 5 quiz assessments.',
        icon: 'CheckCheck',
        category: 'Quizzes',
        requirementType: 'FIRST_QUIZ',
        requirementValue: 5,
        points: 250,
        isActive: true,
      },
      {
        name: 'Perfect Score',
        slug: 'perfect-score',
        description: 'Score a perfect 100% on any assessment.',
        icon: 'Sparkles',
        category: 'Quizzes',
        requirementType: 'PERFECT_SCORE',
        requirementValue: 1,
        points: 150,
        isActive: true,
      },
      {
        name: 'Learning Consistency',
        slug: 'learning-consistency',
        description: 'Maintain a 3-day active learning streak.',
        icon: 'Calendar',
        category: 'Consistency',
        requirementType: 'STREAK_DAYS',
        requirementValue: 3,
        points: 75,
        isActive: true,
      },
      {
        name: '7 Day Streak',
        slug: '7-day-streak',
        description: 'Learn code for 7 consecutive days.',
        icon: 'Flame',
        category: 'Consistency',
        requirementType: 'STREAK_DAYS',
        requirementValue: 7,
        points: 200,
        isActive: true,
      },
      {
        name: '30 Day Streak',
        slug: '30-day-streak',
        description: 'Master a 30-day coding habit.',
        icon: 'Flame',
        category: 'Consistency',
        requirementType: 'STREAK_DAYS',
        requirementValue: 30,
        points: 1000,
        isActive: true,
      },
      {
        name: 'XP Hunter',
        slug: 'xp-hunter',
        description: 'Earn 500 total platform experience points.',
        icon: 'Target',
        category: 'Learning',
        requirementType: 'POINTS_EARNED',
        requirementValue: 500,
        points: 100,
        isActive: true,
      },
    ];

    for (const aData of seedAchievements) {
      const existingA = await Achievement.findOne({ slug: aData.slug });
      if (!existingA) {
        await Achievement.create(aData);
        logger.info(`[Seed] Created Achievement: ${aData.name} (${aData.category})`);
      }
    }

    // ==========================================
    // 7. SEED FAQS
    // ==========================================
    const seedFaqs = [
      {
        question: 'How do NextEra Coders certificates work?',
        answer: 'Upon completing 100% of required lessons and passing assessments in a course, our backend issues a digitally verified certificate featuring a unique cryptographically traceable Certificate ID and public verification URL.',
        category: 'Certificates',
        order: 1,
        isPublished: true,
      },
      {
        question: 'Are all coding challenges executed in a secure environment?',
        answer: 'Yes. All student code is executed inside isolated Docker execution sandboxes with strict memory, CPU, and network timeouts to ensure high security and reliability.',
        category: 'DSA & Code Execution',
        order: 2,
        isPublished: true,
      },
      {
        question: 'Can I access course materials on mobile devices?',
        answer: 'Absolutely. NextEra Coders is built with an engineering-grade responsive design system supporting desktop, tablet, and mobile browsers with dark and light theme options.',
        category: 'General',
        order: 3,
        isPublished: true,
      },
      {
        question: 'How does the learning streak calculation work?',
        answer: 'Your learning streak counts consecutive UTC calendar days of active learning. Completing lessons, submitting DSA solutions, or finishing quizzes counts towards extending your daily habit.',
        category: 'Gamification',
        order: 4,
        isPublished: true,
      },
    ];

    for (const fData of seedFaqs) {
      const existingF = await FAQ.findOne({ question: fData.question });
      if (!existingF) {
        await FAQ.create(fData);
        logger.info(`[Seed] Created FAQ: ${fData.question}`);
      }
    }

    // ==========================================
    // 8. SEED TESTIMONIALS
    // ==========================================
    const seedTestimonials = [
      {
        name: 'Sarah Jenkins',
        role: 'Frontend Engineer',
        company: 'Stripe',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        content: 'The architectural rigor in NextEra Coders is unmatched. Going beyond syntax to understand atomic component design and state machine patterns accelerated my career transition.',
        rating: 5,
        order: 1,
        isPublished: true,
      },
      {
        name: 'Rahul Sharma',
        role: 'Full-Stack Developer',
        company: 'Razorpay',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        content: 'Solving DSA problems structured by algorithmic patterns alongside full-stack system design tracks gave me the confidence to crack top-tier technical interviews.',
        rating: 5,
        order: 2,
        isPublished: true,
      },
      {
        name: 'Elena Rostova',
        role: 'Backend Architect',
        company: 'Fintech Scaleup',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'Clean code, real sandbox code evaluation, and verifiable certificates. NextEra Coders sets the gold standard for developer education.',
        rating: 5,
        order: 3,
        isPublished: true,
      },
    ];

    for (const tData of seedTestimonials) {
      const existingT = await Testimonial.findOne({ name: tData.name });
      if (!existingT) {
        await Testimonial.create(tData);
        logger.info(`[Seed] Created Testimonial: ${tData.name}`);
      }
    }

    // ==========================================
    // 9. SEED ANNOUNCEMENTS
    // ==========================================
    const existingAnnounce = await Announcement.findOne({ title: 'Welcome to NextEra Coders Learning Platform' });
    if (!existingAnnounce && adminUser) {
      await Announcement.create({
        title: 'Welcome to NextEra Coders Learning Platform',
        message: 'Explore our comprehensive tracks in React Architecture, Node.js Backends, Data Structures & Algorithms, and Real-World Full-Stack Blueprints.',
        type: 'GENERAL',
        link: '/courses',
        isPublished: true,
        createdBy: adminUser._id,
      });
      logger.info('[Seed] Created Welcome Announcement');
    }

    // ==========================================
    // 10. SEED PLATFORM SETTINGS
    // ==========================================
    const existingSettings = await PlatformSettings.findOne();
    if (!existingSettings) {
      await PlatformSettings.create({
        platformName: 'NextEra Coders Learning',
        tagline: 'Learn. Code. Build. Grow.',
        contactEmail: 'support@nexteracoders.com',
        logoUrl: '',
        socialLinks: {
          github: 'https://github.com/nexteracoders',
          twitter: 'https://x.com/nexteracoders',
          x: 'https://x.com/nexteracoders',
          linkedin: 'https://linkedin.com/company/nexteracoders',
          instagram: 'https://instagram.com/nexteracoders',
          youtube: 'https://youtube.com/@nexteracoders',
        },
        locations: [
          {
            id: 'loc-noida-hq',
            title: 'Corporate & Innovation Hub',
            badge: 'HQ Hub',
            address: 'A-143, 6th Floor, Sovereign Corporate Tower, Sector-136',
            city: 'Noida',
            state: 'Uttar Pradesh',
            pincode: '201305',
            country: 'India',
            phone: '+91 98765 43210',
            email: 'contact@nexteracoders.com',
            mapUrl: 'https://maps.google.com/?q=Sector+136+Noida+Uttar+Pradesh',
            isPrimary: true,
            isActive: true,
          },
          {
            id: 'loc-bangalore-campus',
            title: 'Registered Tech Campus',
            badge: 'Tech Park',
            address: 'Tower K, Innovation Enclave, Outer Ring Road',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560103',
            country: 'India',
            phone: '+91 98765 43211',
            email: 'blr@nexteracoders.com',
            mapUrl: 'https://maps.google.com/?q=Outer+Ring+Road+Bangalore+Karnataka',
            isPrimary: false,
            isActive: true,
          },
        ],
        maintenanceMode: false,
        defaultPagination: 12,
      });
      logger.info('[Seed] Created Platform Settings');
    }

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
