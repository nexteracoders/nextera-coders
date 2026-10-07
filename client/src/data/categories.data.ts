export interface Category {
  id: string;
  title: string;
  description: string;
  iconName: string;
  tag: string;
  courseCount: number;
  slug: string;
}

export const CATEGORIES_DATA: Category[] = [
  {
    id: 'fullstack',
    title: 'Full-Stack Web Development',
    description: 'Master modern frontend, scalable APIs, database architecture, and end-to-end deployment.',
    iconName: 'Layers',
    tag: 'Flagship Track',
    courseCount: 6,
    slug: 'fullstack',
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    description: 'Master problem patterns from arrays and trees to graph algorithms and dynamic programming.',
    iconName: 'Cpu',
    tag: 'Core Mastery',
    courseCount: 4,
    slug: 'dsa',
  },
  {
    id: 'backend',
    title: 'Backend Systems & Microservices',
    description: 'Build enterprise-grade Node.js, Express, distributed caches, and event-driven architectures.',
    iconName: 'Server',
    tag: 'Systems',
    courseCount: 5,
    slug: 'backend',
  },
  {
    id: 'react',
    title: 'React & Frontend Architecture',
    description: 'Hooks, performance optimization, Redux Toolkit, Tailwind CSS, and Next.js foundations.',
    iconName: 'Code2',
    tag: 'Frontend',
    courseCount: 5,
    slug: 'react',
  },
  {
    id: 'typescript',
    title: 'Modern TypeScript Engineering',
    description: 'Type theory, advanced generics, strict design patterns, and enterprise code hygiene.',
    iconName: 'Terminal',
    tag: 'Language',
    courseCount: 3,
    slug: 'typescript',
  },
  {
    id: 'python',
    title: 'Python for Developers',
    description: 'Idiomatic Python, algorithmic problem solving, scripting, and backend API engineering.',
    iconName: 'Binary',
    tag: 'Language',
    courseCount: 4,
    slug: 'python',
  },
  {
    id: 'java',
    title: 'Java & Object-Oriented Design',
    description: 'Robust OOP principles, design patterns, collections framework, and JVM fundamentals.',
    iconName: 'Boxes',
    tag: 'Enterprise',
    courseCount: 3,
    slug: 'java',
  },
  {
    id: 'projects',
    title: 'Production Project Blueprints',
    description: 'Build portfolio-defining SaaS platforms, multi-tenant databases, and real-time collaboration apps.',
    iconName: 'FolderGit2',
    tag: 'Portfolio',
    courseCount: 8,
    slug: 'projects',
  },
];
