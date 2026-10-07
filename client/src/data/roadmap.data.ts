export interface RoadmapStep {
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  skills: string[];
}

export const ROADMAP_DATA: RoadmapStep[] = [
  {
    stepNumber: '01',
    title: 'Core Fundamentals',
    subtitle: 'Languages & Tooling',
    description: 'Master JavaScript/TypeScript semantics, terminal commands, Git version control, and core data types.',
    skills: ['JavaScript ESNext', 'TypeScript', 'Git & GitHub', 'Terminal & CLI'],
  },
  {
    stepNumber: '02',
    title: 'Frontend & UI Architecture',
    subtitle: 'Modern Component Systems',
    description: 'Build responsive, accessible user interfaces with React, state management with Redux, and Tailwind CSS design tokens.',
    skills: ['React 18', 'Redux Toolkit', 'Tailwind CSS', 'Accessible HTML5/CSS'],
  },
  {
    stepNumber: '03',
    title: 'Backend & Data Architecture',
    subtitle: 'Server & Security Layer',
    description: 'Implement secure Express servers, REST API conventions, Mongoose schema modeling, and cookie session security.',
    skills: ['Node.js & Express', 'MongoDB / Mongoose', 'JWT & Cookies', 'API Validation'],
  },
  {
    stepNumber: '04',
    title: 'Data Structures & Algorithms',
    subtitle: 'Problem Solving Mastery',
    description: 'Deconstruct algorithmic complexities, master essential problem patterns, and build optimized solutions.',
    skills: ['Arrays & HashMaps', 'Trees & Graphs', 'Dynamic Programming', 'Complexity Optimization'],
  },
  {
    stepNumber: '05',
    title: 'Production Projects',
    subtitle: 'Full-Stack Blueprints',
    description: 'Architect, test, and ship complete enterprise SaaS applications with real-world authentication and database workflows.',
    skills: ['Full-Stack Integration', 'State Management', 'Testing & Build Tools', 'Deployment'],
  },
  {
    stepNumber: '06',
    title: 'Career & Industry Readiness',
    subtitle: 'Technical Interviews & Growth',
    description: 'Develop technical communication, optimize your GitHub portfolio, and prepare for competitive engineering interviews.',
    skills: ['System Design Basics', 'Portfolio Presentation', 'Mock Technical Interviews', 'Career Growth'],
  },
];
