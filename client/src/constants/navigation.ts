import { ROUTES } from './routes';
import { NavItem } from '../types';

export const EXPLORE_NAV_ITEMS: NavItem[] = [
  {
    label: 'NEC Compiler',
    path: ROUTES.COMPILER,
    icon: 'Terminal',
    badge: 'Cloud IDE',
    description: 'Write, compile and run Python, Java, C++, JS, and SQL in your browser with zero setup.',
  },
  {
    label: 'Quizzes',
    path: ROUTES.QUIZZES,
    icon: 'HelpCircle',
    badge: 'Interactive',
    description: 'Test your knowledge across algorithms, frontend, backend & full-stack tracks.',
  },
  {
    label: 'Projects',
    path: ROUTES.PROJECTS,
    icon: 'FolderGit2',
    badge: 'Real-world',
    description: 'Production-ready open source projects to build and elevate your portfolio.',
  },
  {
    label: 'NEC Code Battle',
    path: ROUTES.DUELS,
    icon: 'Swords',
    badge: 'Free Entry',
    description: 'Free entry DSA coding duels with a 15-min countdown clock. First to pass all test cases wins coins!',
  },
  {
    label: 'NEC Prime Battle',
    path: ROUTES.PRIME_DUELS,
    icon: 'Crown',
    badge: 'Staked',
    description: 'Stake NEC Coins (min 50) in multiplayer battles. 10% platform pool, winners take all coins!',
  },
  {
    label: 'Saved Problem Lists',
    path: ROUTES.BOOKMARKS,
    icon: 'Bookmark',
    badge: 'Lists',
    description: 'Access your curated Favorites, Revise Later, Hard Questions, and custom collections.',
  },
];

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: 'Courses', path: ROUTES.COURSES },
  { label: 'Tutorials', path: ROUTES.TUTORIALS },
  { label: 'Practice', path: ROUTES.PRACTICE },
  { label: 'Saved Lists', path: ROUTES.BOOKMARKS },
  { label: 'Rewards Store', path: ROUTES.REWARDS },
  {
    label: 'Explore',
    path: ROUTES.EXPLORE,
    children: EXPLORE_NAV_ITEMS,
  },
  { label: 'About', path: ROUTES.ABOUT },
];

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'LayoutDashboard' },
  { label: 'My Learning', path: ROUTES.MY_LEARNING, icon: 'BookOpen' },
  { label: 'Bookmarks & Lists', path: ROUTES.BOOKMARKS, icon: 'Bookmark', badge: 'Saved' },
  { label: 'Weekly Contest', path: ROUTES.CONTEST, icon: 'Trophy' },
  { label: 'Monthly Contest', path: ROUTES.MONTHLY_CONTEST, icon: 'Award', badge: '1800🪙' },
  { label: 'NEC Code Battle', path: ROUTES.DUELS, icon: 'Swords', badge: 'Free Entry' },
  { label: 'NEC Prime Battle', path: ROUTES.PRIME_DUELS, icon: 'Crown', badge: '👑 Staked' },
  { label: 'Rewards Store', path: ROUTES.REWARDS, icon: 'ShoppingBag' },
  { label: 'Certificates', path: ROUTES.CERTIFICATES, icon: 'Award' },
  { label: 'Achievements', path: ROUTES.ACHIEVEMENTS, icon: 'Trophy' },
  { label: 'DSA Practice', path: ROUTES.PRACTICE, icon: 'Code2' },
  { label: 'Quizzes', path: ROUTES.QUIZZES, icon: 'HelpCircle' },
  { label: 'Projects', path: ROUTES.PROJECTS, icon: 'FolderGit2' },
  { label: 'Tutorials', path: ROUTES.TUTORIALS, icon: 'FileText' },
  { label: 'Notifications', path: ROUTES.NOTIFICATIONS, icon: 'Bell' },
  { label: 'Profile', path: ROUTES.PROFILE, icon: 'User' },
];

export interface AdminNavGroup {
  name: string;
  items: NavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    name: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: ROUTES.ADMIN, icon: 'LayoutDashboard' },
      { label: 'Analytics', path: ROUTES.ADMIN_ANALYTICS, icon: 'BarChart3' },
    ],
  },
  {
    name: 'CONTENT',
    items: [
      { label: 'Courses', path: ROUTES.ADMIN_COURSES, icon: 'BookOpen' },
      { label: 'Modules', path: ROUTES.ADMIN_MODULES, icon: 'Layers' },
      { label: 'Lessons', path: ROUTES.ADMIN_LESSONS, icon: 'Video' },
      { label: 'Tutorials', path: ROUTES.ADMIN_TUTORIALS, icon: 'FileText' },
      { label: 'Projects', path: ROUTES.ADMIN_PROJECTS, icon: 'FolderGit2' },
      { label: 'Footer Links', path: ROUTES.ADMIN_FOOTER, icon: 'Footprints' },
    ],
  },
  {
    name: 'ASSESSMENT',
    items: [
      { label: 'NEC POTD', path: ROUTES.ADMIN_POTD, icon: 'Flame', badge: 'Daily' },
      { label: 'NEC Top 150', path: ROUTES.ADMIN_TOP_150, icon: 'Target', badge: 'Curated' },
      { label: 'Monthly Contest', path: ROUTES.ADMIN_MONTHLY_CONTEST, icon: 'Award', badge: '1800🪙' },
      { label: 'Weekly Contest', path: ROUTES.ADMIN_CONTEST, icon: 'Trophy', badge: '100🪙' },
      { label: 'NEC Code Battles', path: ROUTES.ADMIN_DUELS, icon: 'Swords', badge: 'Free' },
      { label: 'NEC Prime Battles', path: ROUTES.ADMIN_PRIME_DUELS, icon: 'Crown', badge: '🪙 10% Cut' },
      { label: 'DSA Problems', path: ROUTES.ADMIN_PROBLEMS, icon: 'Code2' },
      { label: 'Quizzes', path: ROUTES.ADMIN_QUIZZES, icon: 'HelpCircle' },
    ],
  },
  {
    name: 'USERS',
    items: [
      { label: 'Students', path: ROUTES.ADMIN_STUDENTS, icon: 'Users' },
      { label: 'Certificates', path: ROUTES.ADMIN_CERTIFICATES, icon: 'Award' },
      { label: 'Achievements', path: ROUTES.ADMIN_ACHIEVEMENTS, icon: 'Trophy' },
    ],
  },
  {
    name: 'ENGAGEMENT',
    items: [
      { label: 'Careers & Hiring', path: ROUTES.ADMIN_CAREERS, icon: 'Briefcase', badge: 'Hiring' },
      { label: 'Announcements', path: ROUTES.ADMIN_ANNOUNCEMENTS, icon: 'Megaphone' },
      { label: 'Notifications', path: ROUTES.ADMIN_NOTIFICATIONS, icon: 'Bell' },
      { label: 'Mentors', path: ROUTES.ADMIN_MENTORS, icon: 'GraduationCap' },
      { label: 'Sub Admins', path: ROUTES.ADMIN_SUB_ADMINS, icon: 'ShieldCheck', badge: 'Delegates' },
      { label: 'Testimonials', path: ROUTES.ADMIN_TESTIMONIALS, icon: 'MessageSquareQuote' },
      { label: 'FAQs', path: ROUTES.ADMIN_FAQS, icon: 'HelpCircle' },
    ],
  },
  {
    name: 'COMMERCE & REWARDS',
    items: [
      { label: 'NEC Pro One', path: ROUTES.ADMIN_PRO_ONE, icon: 'Crown', badge: 'VIP' },
      { label: 'Rewards & Store', path: ROUTES.ADMIN_REWARDS, icon: 'Gift', badge: 'Swag' },
      { label: 'Payments & Offers', path: ROUTES.ADMIN_PAYMENTS, icon: 'CreditCard' },
    ],
  },
  {
    name: 'SYSTEM & GOVERNANCE',
    items: [
      { label: 'Anti-Cheat Review Center', path: ROUTES.ADMIN_ANTI_CHEAT, icon: 'ShieldAlert', badge: '🛡️ Proctor' },
      { label: 'Server & Execution Health', path: ROUTES.ADMIN_HEALTH, icon: 'Activity', badge: 'Live' },
      { label: 'Settings', path: ROUTES.ADMIN_SETTINGS, icon: 'Settings' },
      { label: 'Audit Logs', path: ROUTES.ADMIN_AUDIT_LOGS, icon: 'ShieldCheck' },
    ],
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export const getAdminNavGroups = (role?: string): AdminNavGroup[] => {
  if (role === 'sub_admin') {
    return [
      {
        name: 'CONTENT',
        items: [
          { label: 'Courses', path: ROUTES.ADMIN_COURSES, icon: 'BookOpen' },
          { label: 'Modules', path: ROUTES.ADMIN_MODULES, icon: 'Layers' },
          { label: 'Lessons', path: ROUTES.ADMIN_LESSONS, icon: 'Video' },
          { label: 'Tutorials', path: ROUTES.ADMIN_TUTORIALS, icon: 'FileText' },
          { label: 'Projects', path: ROUTES.ADMIN_PROJECTS, icon: 'FolderGit2' },
        ],
      },
      {
        name: 'ASSESSMENT',
        items: [
          { label: 'NEC POTD', path: ROUTES.ADMIN_POTD, icon: 'Flame', badge: 'Daily' },
          { label: 'NEC Top 150', path: ROUTES.ADMIN_TOP_150, icon: 'Target', badge: 'Curated' },
          { label: 'Monthly Contest', path: ROUTES.ADMIN_MONTHLY_CONTEST, icon: 'Award', badge: '1800🪙' },
          { label: 'Weekly Contest', path: ROUTES.ADMIN_CONTEST, icon: 'Trophy', badge: '100🪙' },
          { label: 'DSA Problems', path: ROUTES.ADMIN_PROBLEMS, icon: 'Code2' },
          { label: 'Quizzes', path: ROUTES.ADMIN_QUIZZES, icon: 'HelpCircle' },
        ],
      },
      {
        name: 'COMMUNITY & CONTENT',
        items: [
          { label: 'Community Feed', path: ROUTES.COMMUNITY, icon: 'FileText', badge: 'Moderate' },
          { label: 'Announcements', path: ROUTES.ADMIN_ANNOUNCEMENTS, icon: 'Megaphone' },
          { label: 'Mentors', path: ROUTES.ADMIN_MENTORS, icon: 'GraduationCap' },
          { label: 'Testimonials', path: ROUTES.ADMIN_TESTIMONIALS, icon: 'MessageSquareQuote' },
          { label: 'FAQs', path: ROUTES.ADMIN_FAQS, icon: 'HelpCircle' },
        ],
      },
    ];
  }
  return ADMIN_NAV_GROUPS;
};
