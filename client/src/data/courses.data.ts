export interface CoursePreview {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  category: string;
  duration: string;
  lessonsCount: number;
  instructor: {
    name: string;
    role: string;
  };
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  tags: string[];
  originalPrice?: number;
  proPrice?: number;
  freePrice?: number;
}

export const POPULAR_COURSES_DATA: CoursePreview[] = [
  {
    id: 'c1',
    title: 'Full-Stack TypeScript & React Architecture',
    slug: 'fullstack-typescript-react',
    description: 'Architect and deploy production web applications with React 18, Vite, TypeScript, Tailwind, and Node.js.',
    level: 'Intermediate',
    category: 'Full-Stack',
    duration: '24 Hours',
    lessonsCount: 48,
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
    },
    rating: 4.9,
    reviewsCount: 342,
    featured: true,
    tags: ['React', 'TypeScript', 'Tailwind', 'Node.js'],
    originalPrice: 9999,
    proPrice: 1999,
    freePrice: 0,
  },
  {
    id: 'c2',
    title: 'Data Structures & Algorithms Mastery',
    slug: 'dsa-mastery-interviews',
    description: 'A comprehensive, pattern-based curriculum covering 250+ standard problems for engineering interviews.',
    level: 'All Levels',
    category: 'DSA',
    duration: '36 Hours',
    lessonsCount: 72,
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
    },
    rating: 4.95,
    reviewsCount: 520,
    featured: true,
    tags: ['Algorithms', 'Data Structures', 'Interviews', 'Optimization'],
    originalPrice: 9999,
    proPrice: 1499,
    freePrice: 0,
  },
  {
    id: 'c3',
    title: 'Backend Engineering: Express, MongoDB & Microservices',
    slug: 'backend-express-mongodb-microservices',
    description: 'Design secure, scalable REST APIs with JWT cookies, rate limiting, Mongoose data modeling, and caching.',
    level: 'Intermediate',
    category: 'Backend',
    duration: '20 Hours',
    lessonsCount: 38,
    instructor: {
      name: 'Naveen Kumar',
      role: 'Co-Founder & Technical Architect',
    },
    rating: 4.88,
    reviewsCount: 280,
    featured: true,
    tags: ['Express', 'MongoDB', 'Authentication', 'Security'],
    originalPrice: 9999,
    proPrice: 2499,
    freePrice: 0,
  },
  {
    id: 'c4',
    title: 'Modern JavaScript & TypeScript Fundamentals',
    slug: 'modern-javascript-typescript',
    description: 'Deep dive into closures, asynchronous event loops, prototypes, ESNext features, and strict TypeScript types.',
    level: 'Beginner',
    category: 'JavaScript',
    duration: '16 Hours',
    lessonsCount: 32,
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
    },
    rating: 4.92,
    reviewsCount: 195,
    featured: false,
    tags: ['JavaScript', 'TypeScript', 'Async/Await', 'ESNext'],
    originalPrice: 9999,
    proPrice: 999,
    freePrice: 0,
  },
  {
    id: 'c5',
    title: 'Building Enterprise Portfolio Projects with MERN',
    slug: 'enterprise-mern-projects',
    description: 'Build and ship 3 production SaaS applications with role-based access, payment pipelines, and deployment.',
    level: 'Advanced',
    category: 'Projects',
    duration: '28 Hours',
    lessonsCount: 56,
    instructor: {
      name: 'Sandip Kr Verma',
      role: 'Founder & Principal Engineering Mentor',
    },
    rating: 4.91,
    reviewsCount: 210,
    featured: true,
    tags: ['MERN', 'SaaS', 'Stripe', 'Docker'],
    originalPrice: 9999,
    proPrice: 3999,
    freePrice: 0,
  },
  {
    id: 'c6',
    title: 'Python for Problem Solving & Algorithmic Design',
    slug: 'python-algorithms-problem-solving',
    description: 'Learn idiomatic Python 3, object-oriented concepts, and clean algorithmic problem decomposition.',
    level: 'Beginner',
    category: 'Python',
    duration: '18 Hours',
    lessonsCount: 36,
    instructor: {
      name: 'Naveen Kumar',
      role: 'Co-Founder & Technical Architect',
    },
    rating: 4.87,
    reviewsCount: 165,
    featured: false,
    tags: ['Python', 'DSA', 'OOP', 'Problem Solving'],
    originalPrice: 9999,
    proPrice: 1299,
    freePrice: 0,
  },
];
