export interface ProjectTrack {
  title: string;
  techStack: string[];
  level: 'Intermediate' | 'Advanced' | 'Beginner';
  description: string;
  keyFeatures: string[];
}

export const PROJECTS_DATA: ProjectTrack[] = [
  {
    title: 'EdTech Course & Video Platform',
    techStack: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Tailwind'],
    level: 'Advanced',
    description: 'Multi-role learning platform featuring secure cookie authentication, curriculum viewer, and student metrics.',
    keyFeatures: ['Role-based access control', 'HTTP-only auth cookies', 'Modular course curriculum viewer'],
  },
  {
    title: 'Real-Time DSA Problem Arena',
    techStack: ['React', 'Express', 'WebSockets', 'Tailwind'],
    level: 'Advanced',
    description: 'Interactive coding environment with automated test suites, problem difficulty categorization, and leaderboards.',
    keyFeatures: ['Code execution simulated sandbox', 'Test runner feedback', 'Difficulty filtering'],
  },
  {
    title: 'Developer Portfolio & CMS Hub',
    techStack: ['React 18', 'Redux Toolkit', 'Tailwind CSS', 'TypeScript'],
    level: 'Intermediate',
    description: 'Dynamic portfolio showcase with markdown-supported blog, project gallery, and interactive theme switcher.',
    keyFeatures: ['Light/dark theme engine', 'Responsive design primitives', 'Clean state management'],
  },
  {
    title: 'RESTful API & Identity Gateway',
    techStack: ['Express', 'TypeScript', 'Mongoose', 'Helmet', 'Zod'],
    level: 'Intermediate',
    description: 'Production backend template with rate limiting, Zod schema validation, and structured error responses.',
    keyFeatures: ['Centralized error handling', 'Zod request validation', 'Automated seed scripts'],
  },
];
