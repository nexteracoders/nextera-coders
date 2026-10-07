export interface LearnerReview {
  id: string;
  name: string;
  role: string;
  company: string;
  avatarText: string;
  avatarBg: string;
  category: 'Full-Stack' | 'DSA' | 'System Design' | 'Career Transition';
  course: string;
  outcome: string;
  rating: number;
  date: string;
  quote: string;
}

export const LEARNERS_FEEDBACK_DATA: LearnerReview[] = [
  // ROW 1 DATA
  {
    id: 'lr-1',
    name: 'Aman Srivastava',
    role: 'SDE-1',
    company: 'Microsoft',
    avatarText: 'AS',
    avatarBg: 'from-blue-600 to-indigo-600',
    category: 'DSA',
    course: 'DSA Problem Ladder',
    outcome: '🎯 Placed at Microsoft',
    rating: 5,
    date: '2 days ago',
    quote:
      'The pattern-based approach for Dynamic Programming and Graphs completely changed my problem-solving speed. I cleared all 4 technical rounds with ease!',
  },
  {
    id: 'lr-2',
    name: 'Priyanka Sharma',
    role: 'Frontend Engineer',
    company: 'Razorpay',
    avatarText: 'PS',
    avatarBg: 'from-emerald-500 to-teal-600',
    category: 'Full-Stack',
    course: 'Full-Stack Web Mastery',
    outcome: '🚀 150% Salary Hike',
    rating: 5,
    date: '3 days ago',
    quote:
      'The focus on clean code, TypeScript types, and React performance optimization is unmatched. Built 3 production projects during the cohort that impressed interviewers.',
  },
  {
    id: 'lr-3',
    name: 'Rajat Kulkarni',
    role: 'Software Engineer',
    company: 'Amazon',
    avatarText: 'RK',
    avatarBg: 'from-amber-500 to-orange-600',
    category: 'System Design',
    course: 'System Design & Distributed Systems',
    outcome: '⭐ SDE-2 Offer',
    rating: 5,
    date: '5 days ago',
    quote:
      'Designing rate limiters, caching layers, and message queues went from intimidating to second nature. The mentor feedback on architectural trade-offs was gold.',
  },
  {
    id: 'lr-4',
    name: 'Snehal Deshmukh',
    role: 'Full-Stack Developer',
    company: 'Swiggy',
    avatarText: 'SD',
    avatarBg: 'from-purple-600 to-pink-600',
    category: 'Full-Stack',
    course: 'Next.js & Node.js Production Track',
    outcome: '💼 22 LPA Offer',
    rating: 5,
    date: '1 week ago',
    quote:
      'No superficial toy apps here. We built full enterprise auth, multi-tenant databases, and WebSockets. Truly the highest quality coding platform in India.',
  },
  {
    id: 'lr-5',
    name: 'Karthik Raja',
    role: 'Software Developer',
    company: 'Oracle',
    avatarText: 'KR',
    avatarBg: 'from-rose-500 to-red-600',
    category: 'DSA',
    course: 'Advanced Algorithms & Concurrency',
    outcome: '💡 Solved 400+ LeetCode',
    rating: 5,
    date: '1 week ago',
    quote:
      'The interactive scripts and live compiler made testing edge cases seamless. The mentor explanations of memory heaps and call stacks are phenomenal.',
  },
  {
    id: 'lr-6',
    name: 'Ananya Roy',
    role: 'Associate SDE',
    company: 'Atlassian',
    avatarText: 'AR',
    avatarBg: 'from-cyan-500 to-blue-600',
    category: 'Career Transition',
    course: 'Beginner to Professional Roadmap',
    outcome: '🎓 Non-CS to Tier-1 Tech',
    rating: 5,
    date: '2 weeks ago',
    quote:
      'Coming from a non-CS background, I used to feel overwhelmed. NextEra Coders gave me the exact step-by-step roadmap and 1-on-1 mentorship I needed.',
  },
  {
    id: 'lr-7',
    name: 'Vivek Chawla',
    role: 'Backend Engineer',
    company: 'Flipkart',
    avatarText: 'VC',
    avatarBg: 'from-indigo-600 to-violet-700',
    category: 'Full-Stack',
    course: 'Database Internals & Microservices',
    outcome: '🎯 Cracked Flipkart SDE',
    rating: 5,
    date: '2 weeks ago',
    quote:
      'PostgreSQL indexing, connection pooling, and Docker deployments were taught in depth. You actually learn how things run in production.',
  },

  // ROW 2 DATA
  {
    id: 'lr-8',
    name: 'Deepak Mehrotra',
    role: 'Platform Engineer',
    company: 'Uber',
    avatarText: 'DM',
    avatarBg: 'from-amber-600 to-yellow-600',
    category: 'System Design',
    course: 'High-Throughput Backend Systems',
    outcome: '🚀 Placed at Uber',
    rating: 5,
    date: '3 days ago',
    quote:
      'The mentorship directly bridges theory with production reality. We simulated distributed caching and Kafka streams. Totally worth every minute.',
  },
  {
    id: 'lr-9',
    name: 'Megha Singhania',
    role: 'Software Engineer',
    company: 'Adobe',
    avatarText: 'MS',
    avatarBg: 'from-pink-500 to-rose-600',
    category: 'DSA',
    course: 'DSA Interview Accelerator',
    outcome: '⭐ Adobe Tech Round Cleared',
    rating: 5,
    date: '4 days ago',
    quote:
      'Two pointers, sliding window, and backtracking patterns are explained so clearly. I never have to memorize another algorithm again.',
  },
  {
    id: 'lr-10',
    name: 'Tarun Varma',
    role: 'Full Stack Engineer',
    company: 'Zomato',
    avatarText: 'TV',
    avatarBg: 'from-emerald-600 to-green-600',
    category: 'Full-Stack',
    course: 'MERN & Next.js Architecture',
    outcome: '💼 18 LPA Full-Stack',
    rating: 5,
    date: '6 days ago',
    quote:
      'The NEC Compiler and script documentation let me learn concepts on the go and run code snippets directly in my browser. Brilliant UI & experience!',
  },
  {
    id: 'lr-11',
    name: 'Nisha Pillai',
    role: 'DevOps & Cloud SDE',
    company: 'Informatica',
    avatarText: 'NP',
    avatarBg: 'from-violet-600 to-purple-700',
    category: 'Career Transition',
    course: 'Cloud & Distributed Engineering',
    outcome: '🎉 120% Career Growth',
    rating: 5,
    date: '1 week ago',
    quote:
      'Mentors don’t just teach syntax; they teach problem-solving intuition, trade-off analysis, and system resilience. An absolute game-changer.',
  },
  {
    id: 'lr-12',
    name: 'Aditya Sen',
    role: 'Software Developer',
    company: 'Salesforce',
    avatarText: 'AS',
    avatarBg: 'from-cyan-600 to-teal-600',
    category: 'DSA',
    course: 'Graph Theory & Dynamic Programming',
    outcome: '🎯 SDE Offer at Salesforce',
    rating: 5,
    date: '1 week ago',
    quote:
      'I went from struggling on medium LeetCode questions to confidently explaining time complexity in Salesforce engineering interviews.',
  },
  {
    id: 'lr-13',
    name: 'Kavita Menon',
    role: 'Senior React Developer',
    company: 'Paytm',
    avatarText: 'KM',
    avatarBg: 'from-blue-500 to-cyan-600',
    category: 'Full-Stack',
    course: 'React Performance & Internals',
    outcome: '⭐ Senior Developer Promotion',
    rating: 5,
    date: '2 weeks ago',
    quote:
      'Learned React fibers, reconciliation internals, and custom hooks architecture. My team was blown away by our app’s performance improvement.',
  },
  {
    id: 'lr-14',
    name: 'Gaurav Bhatia',
    role: 'SDE-2',
    company: 'PhonePe',
    avatarText: 'GB',
    avatarBg: 'from-indigo-500 to-blue-700',
    category: 'System Design',
    course: 'Distributed Ledger & Payments Architecture',
    outcome: '💼 Top Tier Fintech Placement',
    rating: 5,
    date: '2 weeks ago',
    quote:
      'The real-world fintech and distributed systems architecture module was mind-blowing. Hands down the best engineering community in the country.',
  },
];
