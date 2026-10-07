export interface AdminKPIs {
  totalStudents: number;
  newStudentsThirtyDays: number;
  activeStudentsSevenDays: number;
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  totalQuizzes: number;
  totalProblems: number;
  totalProjects: number;
  totalTutorials: number;
  totalCertificates: number;
}

export interface AdminActivityItem {
  id: string;
  type: 'REGISTRATION' | 'ENROLLMENT' | 'CERTIFICATE' | 'QUIZ' | 'DSA';
  title: string;
  description: string;
  user?: {
    name: string;
    email?: string;
    profileImage?: string;
  };
  target?: {
    title: string;
    link?: string;
  };
  timestamp: string;
}

export interface AdminDashboardData {
  kpis: AdminKPIs;
  recentActivity: AdminActivityItem[];
}

export interface TimeSeriesPoint {
  date: string;
  students: number;
  enrollments: number;
  completions: number;
  quizAttempts: number;
  quizPassed: number;
  dsaSubmissions: number;
  dsaAccepted: number;
  certificates: number;
}

export interface AdminAnalyticsData {
  timeframe: string;
  days: number;
  timeSeries: TimeSeriesPoint[];
  topContent: {
    courses: Array<{
      id: string;
      title: string;
      slug: string;
      category: string;
      level: string;
      totalEnrollments: number;
    }>;
    problems: Array<{
      id: string;
      title: string;
      slug: string;
      difficulty: string;
      category: string;
      totalSubmissions: number;
      totalAccepted: number;
      acceptanceRate: number;
    }>;
    quizzes: Array<{
      id: string;
      title: string;
      slug: string;
      passingScore: number;
      totalAttempts: number;
    }>;
    tutorials: Array<{
      id: string;
      title: string;
      slug: string;
      category: string;
      views: number;
      readingTime: string;
    }>;
  };
}

export interface AdminUnlockedCouponItem {
  code: string;
  discount: number;
  title: string;
  unlockedAt: string;
}

export interface AdminSwagOrderItem {
  id: string;
  rewardId: string;
  rewardTitle: string;
  coinsCost: number;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
  orderedAt: string;
  trackingNumber: string;
}

export interface AdminStudentItem {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  role: string;
  college?: string;
  bio: string;
  skills: string[];
  github: string;
  linkedin: string;
  isActive: boolean;
  isPro?: boolean;
  subscription?: {
    plan?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    amount?: number;
    paymentId?: string;
  };
  points: number;
  learningStreak: number;
  longestStreak: number;
  totalLearningTime: number;
  unlockedCoupons?: AdminUnlockedCouponItem[];
  unlockedCourses?: string[];
  swagOrders?: AdminSwagOrderItem[];
  enrolledCoursesCount: number;
  certificatesCount: number;
  lastActivityDate?: string;
  createdAt: string;
}

export interface AdminStudentDossier {
  student: {
    id: string;
    name: string;
    email: string;
    profileImage: string;
    role: string;
    college?: string;
    bio: string;
    skills: string[];
    github: string;
    linkedin: string;
    isActive: boolean;
    isPro?: boolean;
    subscription?: {
      plan?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      amount?: number;
      paymentId?: string;
    };
    points: number;
    learningStreak: number;
    longestStreak: number;
    lastActivityDate?: string;
    totalLearningTime: number;
    unlockedCoupons?: AdminUnlockedCouponItem[];
    unlockedCourses?: string[];
    swagOrders?: AdminSwagOrderItem[];
    createdAt: string;
  };
  enrollments: Array<{
    id: string;
    courseId?: string;
    course: {
      id: string;
      title: string;
      slug: string;
      thumbnail: string;
      category: string;
      level: string;
    } | null;
    tier?: 'free' | 'pro';
    progress: number;
    completedLessonsCount: number;
    completedAt?: string;
    enrolledAt: string;
  }>;
  quizAttempts: Array<{
    id: string;
    quiz: {
      id: string;
      title: string;
      slug: string;
      passingScore: number;
    } | null;
    score: number;
    percentage: number;
    passed: boolean;
    timeTaken: number;
    completedAt: string;
  }>;
  submissions: Array<{
    id: string;
    problem: {
      id: string;
      title: string;
      slug: string;
      difficulty: string;
      category: string;
    } | null;
    language: string;
    status: string;
    runtime: number;
    memory: number;
    createdAt: string;
  }>;
  certificates: Array<{
    id: string;
    certificateId: string;
    courseName: string;
    issueDate: string;
    verificationUrl: string;
    certificateUrl?: string;
  }>;
  achievements: Array<{
    id: string;
    achievement: {
      id: string;
      name: string;
      description: string;
      icon: string;
      category: string;
      points: number;
    } | null;
    unlockedAt: string;
  }>;
  pointTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
  paymentRequests?: Array<{
    id: string;
    type: 'course' | 'pro_plan';
    courseTitle?: string;
    planId?: string;
    amount: number;
    transactionId: string;
    paymentMethod: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    reviewedAt?: string;
    createdAt: string;
  }>;
}

export interface AdminModuleItem {
  id: string;
  title: string;
  description: string;
  order: number;
  course: { id: string; title: string; slug: string } | null;
  lessonCount: number;
  createdAt: string;
}

export interface AdminLessonItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  order: number;
  videoUrl: string;
  thumbnail?: string;
  isFree: boolean;
  isPublished: boolean;
  notes: string;
  resources: Array<{ title: string; url: string; type: string }>;
  course: { id: string; title: string; slug: string } | null;
  module: { id: string; title: string; order: number } | null;
  createdAt: string;
}

export interface AdminAnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: 'GENERAL' | 'COURSE' | 'IMPORTANT' | 'MAINTENANCE' | 'EVENT';
  link?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdBy: { name: string; email: string } | null;
  createdAt: string;
}

export interface AdminFAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
}

export interface AdminTestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  isPublished: boolean;
  order: number;
  createdAt: string;
}

export interface AdminMentorItem {
  id: string;
  name: string;
  role: string;
  exCompanies: string[];
  image: string;
  quoteTitle: string;
  quoteBody: string;
  signature: string;
  experience: string;
  studentsMentored: string;
  placements: string;
  rating: string;
  email?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  courses?: string[];
  followersCount?: number;
  isFollowing?: boolean;
  userId?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    x?: string;
    facebook?: string;
    github?: string;
    youtube?: string;
  };
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminMentorFollower {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  profileImage?: string;
  role: string;
  college?: string;
  createdAt: string;
}

export interface AdminMentorLinkedCourse {
  title: string;
  slug: string;
  level: string;
  category: string;
  isPublished: boolean;
  originalPrice: number;
  proPrice: number;
}

export interface AdminMentorDossier {
  mentor: AdminMentorItem;
  recentFollowers: AdminMentorFollower[];
  linkedUser?: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastActivityDate?: string;
    createdAt: string;
  };
  courses: AdminMentorLinkedCourse[];
}

export interface PlatformLocation {
  id?: string;
  title: string;
  badge?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  phone?: string;
  email?: string;
  mapUrl?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface AdminPlatformSettings {
  platformName: string;
  tagline: string;
  contactEmail: string;
  contactPhone?: string;
  logoUrl?: string;
  socialLinks: {
    github?: string;
    twitter?: string;
    x?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  locations?: PlatformLocation[];
  maintenanceMode: boolean;
  defaultPagination: number;
}

export interface AdminAuditLogItem {
  id: string;
  admin: {
    id: string;
    name: string;
    email: string;
    profileImage: string;
  } | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceTitle?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemHealthMetrics {
  server: {
    cpuUsagePercent: number;
    coreCount: number;
    cpuModel: string;
    cpuSpeedMhz: number;
    loadAvg: number[];
    platform: string;
    arch: string;
    hostname: string;
    serverUptimeSeconds: number;
    processUptimeSeconds: number;
    nodeVersion: string;
    environment: string;
  };
  memory: {
    systemTotalBytes: number;
    systemFreeBytes: number;
    systemUsedBytes: number;
    systemUsagePercent: number;
    processRssBytes: number;
    processHeapTotalBytes: number;
    processHeapUsedBytes: number;
    processHeapUsagePercent: number;
    processExternalBytes: number;
  };
  judge0: {
    endpoint: string;
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
    dailyLimit: number;
    usedToday: number;
    remaining: number;
    remainingPercent: number;
    resetsAt: string;
    tier: string;
    localSandboxFallback: boolean;
    lastCheckedAt: string;
    rawMessage?: string;
  };
  executionThroughput: {
    submissionsLastMinute: number;
    submissionsLastFiveMinutes: number;
    submissionsLastHour: number;
    avgExecutionTimeMs: number;
    peakMemoryKb: number;
    activeQueueType: 'BULLMQ_REDIS' | 'IN_MEMORY_SAFE_MODE';
    timeSeries: Array<{
      minuteLabel: string;
      timestamp: number;
      total: number;
      accepted: number;
      failed: number;
    }>;
  };
  database: {
    status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
    latencyMs: number;
    collectionsCount: number;
  };
  timestamp: string;
}

export interface AdminSubAdminItem {
  id: string;
  name: string;
  email: string;
  role: 'sub_admin';
  profileImage: string;
  college?: string;
  bio?: string;
  skills?: string[];
  isActive: boolean;
  plainPassword?: string;
  appointedAt: string;
  appointedBy: string;
  initialRoleSource: 'student' | 'mentor' | 'direct';
  lastPasswordChangedAt?: string;
  createdAt: string;
  lastActivityDate?: string;
}

export interface AdminSubAdminsResponse {
  superAdmin: {
    name: string;
    email: string;
    role: string;
    isOwner: boolean;
    badge: string;
    profileImage: string;
  };
  subAdmins: AdminSubAdminItem[];
  totalCount: number;
  activeCount: number;
  availableMentors: Array<{
    id: string;
    name: string;
    role: string;
    image: string;
    exCompanies: string[];
  }>;
}
