import { apiClient } from './api';

export interface IJobPosition {
  id: string;
  title: string;
  department: 'Engineering' | 'Curriculum & Content' | 'AI & ML' | 'Product & Design' | 'DevRel & Community' | 'Marketing' | 'Operations';
  roleType: 'Job' | 'Internship' | 'Part-time' | 'Contract';
  location: string;
  experience: string;
  salaryOrStipend: string;
  tags: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  isHot?: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export interface IInterviewDetails {
  interviewDate: string;
  interviewTime: string;
  interviewMode?: string;
  mode?: string;
  meetingLink: string;
  panelists: string;
  roundType: string;
  duration?: string;
  agendaOrNotes?: string;
  agendaNotes?: string;
  scheduledAt?: string;
}

export interface ICandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  department: string;
  roleType: string;
  fullName: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  experienceYears: string;
  coverNote?: string;
  resumeFileName: string;
  resumeFileSize?: string;
  resumeBase64OrUrl: string;
  status: 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Offered' | 'Hired' | 'Rejected';
  adminRating?: number;
  adminNotes?: string;
  interviewDetails?: IInterviewDetails;
  appliedAt: string;
}

const JOBS_STORAGE_KEY = 'nec_careers_jobs_v2';
const APPS_STORAGE_KEY = 'nec_careers_applications_v2';

export const DEFAULT_JOBS: IJobPosition[] = [
  {
    id: 'fs-senior-eng',
    title: 'Senior Full-Stack Engineer (React 19 / Node / WebAssembly)',
    department: 'Engineering',
    roleType: 'Job',
    location: 'Remote (Global / India)',
    experience: '3 - 6 Years',
    salaryOrStipend: '₹18 LPA – ₹32 LPA + ESOPs',
    tags: ['React 19', 'TypeScript', 'Node.js', 'MongoDB', 'WebAssembly', 'Monaco'],
    description: 'Lead the architecture of our high-speed in-browser code execution sandbox, live IDE compiler, and multi-tenant real-time learning modules.',
    responsibilities: [
      'Architect and scale the NextEra in-browser compiler using WebAssembly and microservices.',
      'Optimize frontend performance, Core Web Vitals, and real-time state management.',
      'Build robust REST & GraphQL APIs with high throughput and low latency.',
      'Collaborate closely with product designers and curriculum engineers to craft delightful user flows.',
    ],
    requirements: [
      'Strong proficiency in TypeScript, modern React, Node.js, and distributed systems.',
      'Experience with code sandboxes, Monaco Editor, or compiler AST pipelines is a huge plus.',
      'Proven track record of shipping performant full-stack web applications to thousands of users.',
    ],
    isHot: true,
    isActive: true,
    order: 1,
    createdAt: '2026-08-15',
  },
  {
    id: 'dsa-curriculum-lead',
    title: 'DSA & Competitive Programming Lead Architect',
    department: 'Curriculum & Content',
    roleType: 'Job',
    location: 'Remote (India)',
    experience: '2 - 5 Years',
    salaryOrStipend: '₹14 LPA – ₹24 LPA',
    tags: ['C++', 'Java', 'Python', 'Algorithms', 'LeetCode', 'Codeforces'],
    description: 'Design world-class algorithmic problem sets, interactive hints, video breakdowns, and structured DSA learning tracks for millions of ambitious developers.',
    responsibilities: [
      'Author structured problem explanations, time-complexity breakdowns, and edge-case test suites.',
      'Create interactive algorithmic animations and architecture diagrams.',
      'Review and curate weekly coding contest challenges and editorial solutions.',
      'Mentor and guide students through live community masterclasses and doubt clearance sessions.',
    ],
    requirements: [
      'Strong competitive programming background (Knight/Guardian on LeetCode or Candidate Master on Codeforces).',
      'Ability to explain complex graph, tree, and dynamic programming concepts in an intuitive, beginner-friendly manner.',
      'Excellent written English and programming fluency in C++, Java, and Python.',
    ],
    isHot: true,
    isActive: true,
    order: 2,
    createdAt: '2026-08-18',
  },
  {
    id: 'ai-ml-systems-eng',
    title: 'AI & LLM Sandbox Systems Engineer',
    department: 'AI & ML',
    roleType: 'Job',
    location: 'Remote',
    experience: '2 - 4 Years',
    salaryOrStipend: '₹16 LPA – ₹28 LPA + Equity',
    tags: ['Python', 'PyTorch', 'Gemini API', 'LangChain', 'Vector DBs', 'RAG'],
    description: 'Build NextEra AI Tutor, automated code feedback generation, intelligent test-case generators, and generative AI developer playgrounds.',
    responsibilities: [
      'Develop low-latency AI agent pipelines for real-time code reviews and debugging hints.',
      'Build vector embeddings and retrieval systems over our 50,000+ developer documentation chapters.',
      'Evaluate model hallucinations, response latencies, and token cost optimization.',
    ],
    requirements: [
      'Hands-on experience with LLM APIs, function calling, structured outputs, and prompt chaining.',
      'Strong Python foundations with FastAPI, LangChain/LlamaIndex, and Vector Databases (Pinecone/Chroma/Qdrant).',
      'Solid mathematical understanding of machine learning algorithms.',
    ],
    isHot: true,
    isActive: true,
    order: 3,
    createdAt: '2026-08-20',
  },
  {
    id: 'devops-infra-eng',
    title: 'DevOps & Cloud Infrastructure Engineer',
    department: 'Engineering',
    roleType: 'Job',
    location: 'Remote (India)',
    experience: '3 - 5 Years',
    salaryOrStipend: '₹15 LPA – ₹26 LPA',
    tags: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'CI/CD', 'Terraform'],
    description: 'Scale our cloud infrastructure, secure isolated container runners for untrusted code execution, and maintain 99.99% uptime for our global platform.',
    responsibilities: [
      'Manage Kubernetes clusters executing thousands of simultaneous isolated code sandbox runs.',
      'Automate CI/CD deployment pipelines with zero-downtime releases.',
      'Implement proactive monitoring, Prometheus/Grafana alerting, and DDoS mitigation.',
    ],
    requirements: [
      'Extensive experience with Linux kernel namespaces, cgroups, Docker, and container security.',
      'Familiarity with AWS/GCP cloud environments and Infrastructure as Code (Terraform).',
    ],
    isActive: true,
    order: 4,
    createdAt: '2026-08-22',
  },
  {
    id: 'product-designer-uiux',
    title: 'Lead Product Designer (UI/UX & Micro-interactions)',
    department: 'Product & Design',
    roleType: 'Job',
    location: 'Remote',
    experience: '2 - 5 Years',
    salaryOrStipend: '₹12 LPA – ₹22 LPA',
    tags: ['Figma', 'Design Systems', 'Micro-interactions', 'Tailwind', 'Motion'],
    description: 'Own the visual identity, dark-mode ergonomics, interactive component states, and learning experience across web and mobile surfaces.',
    responsibilities: [
      'Design sleek, developer-friendly interfaces, dark themes, and glassmorphic dashboards.',
      'Create high-fidelity interactive prototypes and design system component tokens in Figma.',
      'Conduct user testing with students and developers to refine usability.',
    ],
    requirements: [
      'Portfolio showcasing exceptional visual craft, typography, and developer-tool designs.',
      'Deep understanding of responsive web layout constraints and modern CSS capabilities.',
    ],
    isActive: true,
    order: 5,
    createdAt: '2026-08-25',
  },
  {
    id: 'tech-educator-creator',
    title: 'Technical Video Creator & Developer Educator',
    department: 'DevRel & Community',
    roleType: 'Job',
    location: 'Remote / Hybrid (Noida/Bangalore)',
    experience: '1 - 3 Years',
    salaryOrStipend: '₹10 LPA – ₹18 LPA',
    tags: ['YouTube', 'Video Editing', 'Python', 'Web Dev', 'Public Speaking'],
    description: 'Produce engaging YouTube tutorials, project walkthroughs, and developer shorts that inspire and educate hundreds of thousands of coders.',
    responsibilities: [
      'Script, record, and edit high-production tutorial videos and live coding streams.',
      'Engage with our Discord community of 25,000+ coders and host weekly live doubt sessions.',
    ],
    requirements: [
      'Charismatic communication skills with a knack for breaking down complex tech simply.',
      'Experience with screen recording, OBS, Premiere Pro/DaVinci Resolve.',
    ],
    isActive: true,
    order: 6,
    createdAt: '2026-08-28',
  },
  {
    id: 'swe-intern-2026',
    title: 'Software Engineering Intern (Full-Stack / AI)',
    department: 'Engineering',
    roleType: 'Internship',
    location: 'Remote (India / Global)',
    experience: 'College Student / Fresher',
    salaryOrStipend: '₹30,000 – ₹45,000 / month (PPO Opportunity)',
    tags: ['React', 'JavaScript', 'Python', 'Tailwind', 'Git'],
    description: 'Work directly alongside senior engineers shipping real production features to tens of thousands of active developers.',
    responsibilities: [
      'Build new UI components, interactive quiz features, and coding challenge sandboxes.',
      'Write end-to-end tests and maintain documentation for developer APIs.',
    ],
    requirements: [
      'Strong problem-solving skills and passion for web development or AI.',
      'Personal GitHub projects or active competitive coding profile.',
    ],
    isHot: true,
    isActive: true,
    order: 7,
    createdAt: '2026-09-01',
  },
  {
    id: 'react-intern-2026',
    title: 'Frontend & UI Engineering Intern',
    department: 'Engineering',
    roleType: 'Internship',
    location: 'Remote',
    experience: 'College Student / Fresher',
    salaryOrStipend: '₹25,000 – ₹35,000 / month',
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Figma to Code'],
    description: 'Design and code ultra-responsive UI components, interactive algorithm visualizations, and modern landing sections.',
    responsibilities: [
      'Develop modular React components with high accessibility and sleek micro-animations.',
      'Fix UI bugs and improve mobile responsiveness across all platform pages.',
    ],
    requirements: [
      'Knowledge of React, ES6+, Tailwind CSS, and Git.',
      'Attention to visual detail and UI polish.',
    ],
    isHot: false,
    isActive: true,
    order: 8,
    createdAt: '2026-09-02',
  },
];

export const INITIAL_SAMPLE_APPLICATIONS: ICandidateApplication[] = [
  {
    id: 'app-101',
    jobId: 'swe-intern-2026',
    jobTitle: 'Software Engineering Intern (Full-Stack / AI)',
    department: 'Engineering',
    roleType: 'Internship',
    fullName: 'Rohan Mehta',
    email: 'rohan.mehta@example.com',
    phone: '+91 98765 12345',
    linkedin: 'https://linkedin.com/in/rohanmehta-dev',
    github: 'https://github.com/rohan-codes',
    experienceYears: 'Final Year B.Tech CSE',
    coverNote: 'Built a full-stack code compiler project and won 2 college hackathons. Very excited to contribute to NextEra Coders!',
    resumeFileName: 'Rohan_Mehta_Resume_2026.pdf',
    resumeFileSize: '1.2 MB',
    resumeBase64OrUrl: 'https://example.com/resumes/rohan_mehta.pdf',
    status: 'Shortlisted',
    adminRating: 5,
    adminNotes: 'Strong GitHub portfolio with real React projects. Schedule technical interview round.',
    appliedAt: '2026-09-03T10:15:00.000Z',
  },
  {
    id: 'app-102',
    jobId: 'fs-senior-eng',
    jobTitle: 'Senior Full-Stack Engineer (React 19 / Node / WebAssembly)',
    department: 'Engineering',
    roleType: 'Job',
    fullName: 'Ananya Sharma',
    email: 'ananya.sharma@example.com',
    phone: '+91 98111 22334',
    linkedin: 'https://linkedin.com/in/ananya-sharma-tech',
    github: 'https://github.com/ananya-fullstack',
    experienceYears: '4.5 Years',
    coverNote: 'Ex-Senior Engineer at FinTech SaaS. Deep experience scaling React 18/19 state machines and WebAssembly sandboxes.',
    resumeFileName: 'Ananya_Sharma_CV.pdf',
    resumeFileSize: '850 KB',
    resumeBase64OrUrl: 'https://example.com/resumes/ananya_sharma.pdf',
    status: 'Interview Scheduled',
    adminRating: 5,
    adminNotes: 'Excellent experience with Monaco editor and WASM. System design round on Sept 8.',
    appliedAt: '2026-09-02T14:30:00.000Z',
  },
  {
    id: 'app-103',
    jobId: 'dsa-curriculum-lead',
    jobTitle: 'DSA & Competitive Programming Lead Architect',
    department: 'Curriculum & Content',
    roleType: 'Job',
    fullName: 'Vikramaditya Roy',
    email: 'vikram.roy@example.com',
    phone: '+91 99887 65432',
    linkedin: 'https://linkedin.com/in/vikram-roy-dsa',
    github: 'https://github.com/vikram-algo',
    experienceYears: '3 Years',
    coverNote: 'Knight on LeetCode (Rating 2150+). Solved 1200+ problems across dynamic programming, trees, and graphs.',
    resumeFileName: 'Vikramaditya_Roy_Resume.pdf',
    resumeFileSize: '1.4 MB',
    resumeBase64OrUrl: 'https://example.com/resumes/vikram_roy.pdf',
    status: 'Under Review',
    adminRating: 4,
    adminNotes: 'Review LeetCode profile and problem authoring sample.',
    appliedAt: '2026-09-04T09:00:00.000Z',
  },
];

class CareersService {
  private jobs: IJobPosition[] = [];
  private applications: ICandidateApplication[] = [];
  private jobListeners: Set<(jobs: IJobPosition[]) => void> = new Set();
  private appListeners: Set<(apps: ICandidateApplication[]) => void> = new Set();

  constructor() {
    this.jobs = this.loadJobs();
    this.applications = this.loadApplications();
    // Eagerly fetch latest applications from backend server
    this.fetchApplicationsFromServer();
  }

  // ---------------------------------------------------------------------------
  // Jobs Store
  // ---------------------------------------------------------------------------
  private loadJobs(): IJobPosition[] {
    try {
      const cached = localStorage.getItem(JOBS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading jobs from storage', e);
    }
    this.saveJobsToStorage(DEFAULT_JOBS);
    return DEFAULT_JOBS;
  }

  private saveJobsToStorage(jobs: IJobPosition[]) {
    this.jobs = jobs;
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch (e) {
      console.error('Error saving jobs to storage', e);
    }
    this.notifyJobs();
  }

  private notifyJobs() {
    this.jobListeners.forEach((l) => l([...this.jobs]));
  }

  public subscribeJobs(listener: (jobs: IJobPosition[]) => void): () => void {
    this.jobListeners.add(listener);
    listener([...this.jobs]);
    return () => {
      this.jobListeners.delete(listener);
    };
  }

  public getJobs(): IJobPosition[] {
    return [...this.jobs].sort((a, b) => a.order - b.order);
  }

  public getActiveJobs(): IJobPosition[] {
    return this.jobs.filter((j) => j.isActive).sort((a, b) => a.order - b.order);
  }

  public saveJob(jobData: Partial<IJobPosition> & { title: string; department: string }): IJobPosition {
    const id = jobData.id || `job-${Date.now()}`;
    const existingIdx = this.jobs.findIndex((j) => j.id === id);

    const fullJob: IJobPosition = {
      id,
      title: jobData.title.trim(),
      department: (jobData.department as any) || 'Engineering',
      roleType: (jobData.roleType as any) || 'Job',
      location: jobData.location?.trim() || 'Remote (India / Global)',
      experience: jobData.experience?.trim() || '2 - 4 Years',
      salaryOrStipend: jobData.salaryOrStipend?.trim() || 'Competitive Package',
      tags: Array.isArray(jobData.tags) && jobData.tags.length > 0 ? jobData.tags : ['Engineering', 'Tech'],
      description: jobData.description?.trim() || 'Exciting opportunity to build developer products at NextEra Coders.',
      responsibilities: Array.isArray(jobData.responsibilities) && jobData.responsibilities.length > 0 ? jobData.responsibilities : ['Ship clean code', 'Collaborate across teams'],
      requirements: Array.isArray(jobData.requirements) && jobData.requirements.length > 0 ? jobData.requirements : ['Strong fundamentals', 'Passion for learning'],
      isHot: !!jobData.isHot,
      isActive: jobData.isActive !== false,
      order: jobData.order ?? (existingIdx >= 0 ? this.jobs[existingIdx].order : this.jobs.length + 1),
      createdAt: jobData.createdAt || new Date().toISOString().split('T')[0],
    };

    let updated: IJobPosition[];
    if (existingIdx >= 0) {
      updated = [...this.jobs];
      updated[existingIdx] = fullJob;
    } else {
      updated = [...this.jobs, fullJob];
    }

    this.saveJobsToStorage(updated);
    return fullJob;
  }

  public toggleJobActive(id: string): void {
    const updated = this.jobs.map((j) => (j.id === id ? { ...j, isActive: !j.isActive } : j));
    this.saveJobsToStorage(updated);
  }

  public reorderJob(id: string, direction: 'up' | 'down'): void {
    const list = [...this.jobs].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((j) => j.id === id);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const prev = list[idx - 1];
      const curr = list[idx];
      const temp = prev.order;
      prev.order = curr.order;
      curr.order = temp;
      if (prev.order === curr.order) {
        prev.order = idx + 1;
        curr.order = idx;
      }
    } else if (direction === 'down' && idx < list.length - 1) {
      const next = list[idx + 1];
      const curr = list[idx];
      const temp = next.order;
      next.order = curr.order;
      curr.order = temp;
      if (next.order === curr.order) {
        next.order = idx + 1;
        curr.order = idx + 2;
      }
    }

    this.saveJobsToStorage(list);
  }

  public deleteJob(id: string): void {
    const updated = this.jobs.filter((j) => j.id !== id);
    this.saveJobsToStorage(updated);
  }

  public resetJobsToDefaults(): void {
    this.saveJobsToStorage(DEFAULT_JOBS);
  }

  // ---------------------------------------------------------------------------
  // Applications Store & Server Synchronization
  // ---------------------------------------------------------------------------
  private loadApplications(): ICandidateApplication[] {
    try {
      const cached = localStorage.getItem(APPS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading applications from storage', e);
    }
    this.saveApplicationsToStorage(INITIAL_SAMPLE_APPLICATIONS);
    return INITIAL_SAMPLE_APPLICATIONS;
  }

  private saveApplicationsToStorage(apps: ICandidateApplication[]) {
    this.applications = apps;
    try {
      localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.error('Error saving applications to storage', e);
    }
    this.notifyApplications();
  }

  private notifyApplications() {
    this.appListeners.forEach((l) => l([...this.applications]));
  }

  public subscribeApplications(listener: (apps: ICandidateApplication[]) => void): () => void {
    this.appListeners.add(listener);
    listener([...this.applications]);
    return () => {
      this.appListeners.delete(listener);
    };
  }

  public getApplications(): ICandidateApplication[] {
    return [...this.applications].sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }

  /**
   * Fetch Real Candidate Applications directly from MongoDB backend API
   */
  public async fetchApplicationsFromServer(): Promise<ICandidateApplication[]> {
    try {
      const res = await apiClient.get<{ success: boolean; data: any[] }>('/careers/applications');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const serverApps: ICandidateApplication[] = res.data.data.map((item: any) => ({
          id: item.id || item._id?.toString() || `app-${Date.now()}`,
          jobId: item.jobId,
          jobTitle: item.jobTitle,
          department: item.department || 'Engineering',
          roleType: item.roleType || 'Job',
          fullName: item.fullName,
          email: item.email,
          phone: item.phone,
          linkedin: item.linkedin,
          github: item.github,
          experienceYears: item.experienceYears || '1+ Years',
          coverNote: item.coverNote,
          resumeFileName: item.resumeFileName || 'Resume.pdf',
          resumeFileSize: item.resumeFileSize || '1.0 MB',
          resumeBase64OrUrl: item.resumeBase64OrUrl || '',
          status: item.status || 'Under Review',
          adminRating: item.adminRating,
          adminNotes: item.adminNotes,
          interviewDetails: item.interviewDetails,
          appliedAt: item.appliedAt || item.createdAt || new Date().toISOString(),
        }));

        // Merge server apps with local cache without losing data
        const map = new Map<string, ICandidateApplication>();
        
        // 1. First add server applications
        serverApps.forEach((app) => {
          map.set(app.id, app);
        });

        // 2. Also keep any existing local items if not already on server
        this.applications.forEach((app) => {
          if (!map.has(app.id)) {
            map.set(app.id, app);
          }
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        );

        this.saveApplicationsToStorage(merged);
        console.log(`[CAREERS SERVICE] Synced ${merged.length} applications from backend.`);
        return merged;
      }
    } catch (err) {
      console.warn('[CAREERS SERVICE] Failed to fetch applications from server (using local fallback):', err);
    }
    return this.applications;
  }

  public async submitApplication(appData: {
    jobId: string;
    jobTitle: string;
    department?: string;
    roleType?: string;
    fullName: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    experienceYears?: string;
    coverNote?: string;
    resumeFileName: string;
    resumeFileSize?: string;
    resumeBase64OrUrl: string;
  }): Promise<ICandidateApplication> {
    const tempId = `app-${Date.now()}`;
    let newApp: ICandidateApplication = {
      id: tempId,
      jobId: appData.jobId,
      jobTitle: appData.jobTitle,
      department: appData.department || 'Engineering',
      roleType: appData.roleType || 'Job',
      fullName: appData.fullName.trim(),
      email: appData.email.trim(),
      phone: appData.phone.trim(),
      linkedin: appData.linkedin?.trim(),
      github: appData.github?.trim(),
      experienceYears: appData.experienceYears?.trim() || '1+ Years',
      coverNote: appData.coverNote?.trim(),
      resumeFileName: appData.resumeFileName.trim(),
      resumeFileSize: appData.resumeFileSize || '1.0 MB',
      resumeBase64OrUrl: appData.resumeBase64OrUrl,
      status: 'Under Review',
      appliedAt: new Date().toISOString(),
    };

    // Pre-save optimistically to local cache
    const updated = [newApp, ...this.applications.filter((a) => a.id !== tempId)];
    this.saveApplicationsToStorage(updated);

    // Persist to MongoDB Server & Send Admin In-App Notification + Confirmation Email
    try {
      const res = await apiClient.post('/careers/apply', {
        ...newApp,
      });
      if (res.data?.data?.application) {
        const serverApp = res.data.data.application;
        newApp = {
          ...newApp,
          id: serverApp.id || serverApp._id?.toString() || newApp.id,
          interviewDetails: serverApp.interviewDetails,
        };
        const refreshed = [newApp, ...this.applications.filter((a) => a.id !== tempId && a.id !== newApp.id)];
        this.saveApplicationsToStorage(refreshed);
      }
      console.log('[CAREERS SERVICE] ✅ Application persisted to MongoDB & notifications dispatched:', res.data);
    } catch (err) {
      console.warn('[CAREERS SERVICE] Backend submit fallback (client-side saved):', err);
    }

    return newApp;
  }

  public async updateApplicationStatus(
    id: string,
    status: ICandidateApplication['status'],
    adminNotes?: string,
    adminRating?: number
  ): Promise<void> {
    let targetApp: ICandidateApplication | undefined;

    const updated = this.applications.map((app) => {
      if (app.id === id) {
        targetApp = {
          ...app,
          status,
          adminNotes: adminNotes !== undefined ? adminNotes : app.adminNotes,
          adminRating: adminRating !== undefined ? adminRating : app.adminRating,
        };
        return targetApp;
      }
      return app;
    });

    this.saveApplicationsToStorage(updated);

    // Sync status change with MongoDB backend
    try {
      await apiClient.patch(`/careers/applications/${id}/status`, {
        status,
        adminNotes,
        adminRating,
        sendEmail: false,
      });
    } catch (err) {
      console.warn(`[CAREERS SERVICE] Backend status update fallback:`, err);
    }

    // If status changed to Shortlisted or Rejected, trigger automated email notification
    if (targetApp) {
      if (status === 'Shortlisted') {
        this.dispatchCareerEmail(targetApp, 'shortlisted', adminNotes);
      } else if (status === 'Rejected') {
        this.dispatchCareerEmail(targetApp, 'rejected');
      }
    }
  }

  /**
   * Schedule Candidate Interview, Update State & Dispatch Branded Email Invitation
   */
  public async scheduleCandidateInterview(
    id: string,
    details: IInterviewDetails,
    sendEmail: boolean = true
  ): Promise<{ success: boolean; message: string; application?: ICandidateApplication }> {
    let targetApp: ICandidateApplication | undefined;

    const updated = this.applications.map((app) => {
      if (app.id === id) {
        targetApp = {
          ...app,
          status: 'Interview Scheduled',
          interviewDetails: {
            ...details,
            scheduledAt: new Date().toISOString(),
          },
        };
        return targetApp;
      }
      return app;
    });

    this.saveApplicationsToStorage(updated);

    try {
      const res = await apiClient.post(`/careers/applications/${id}/schedule-interview`, {
        ...details,
        sendEmail,
      });
      console.log('[CAREERS SERVICE] ✅ Interview scheduled & invitation email dispatched:', res.data);
      return {
        success: true,
        message: `Interview scheduled on ${details.interviewDate} at ${details.interviewTime}. Official invitation email delivered to candidate!`,
        application: targetApp,
      };
    } catch (err: any) {
      console.warn('[CAREERS SERVICE] Backend schedule-interview endpoint fallback:', err);
      // Fallback manual email dispatch
      if (targetApp && sendEmail) {
        this.dispatchCareerEmail(targetApp, 'interview', details.agendaOrNotes, details);
      }
      return {
        success: true,
        message: `Interview scheduled on ${details.interviewDate} at ${details.interviewTime}. (Sandbox Logged)`,
        application: targetApp,
      };
    }
  }

  public async dispatchCareerEmail(
    app: ICandidateApplication,
    type: 'submitted' | 'shortlisted' | 'interview' | 'rejected',
    customNotes?: string,
    interviewData?: IInterviewDetails
  ): Promise<{ success: boolean; message: string }> {
    try {
      const activeInterview = interviewData || app.interviewDetails;
      const response = await apiClient.post('/careers/notify-email', {
        type,
        applicationId: app.id,
        candidateName: app.fullName,
        candidateEmail: app.email,
        jobTitle: app.jobTitle,
        department: app.department,
        roleType: app.roleType,
        resumeFileName: app.resumeFileName,
        experienceYears: app.experienceYears,
        adminNotes: customNotes !== undefined ? customNotes : app.adminNotes,
        interviewDate: activeInterview?.interviewDate,
        interviewTime: activeInterview?.interviewTime,
        interviewMode: activeInterview?.interviewMode,
        meetingLink: activeInterview?.meetingLink,
        panelists: activeInterview?.panelists,
        roundType: activeInterview?.roundType,
        duration: activeInterview?.duration,
        agendaOrNotes: activeInterview?.agendaOrNotes || customNotes,
      });
      console.log(`[CAREERS EMAIL] ✅ Sent ${type} email to ${app.email}:`, response.data);
      return { success: true, message: `Email (${type}) successfully delivered to ${app.email}` };
    } catch (error: any) {
      console.warn(`[CAREERS EMAIL WARNING] Error calling notify-email endpoint:`, error);
      return {
        success: false,
        message: `Email logged to console (SMTP sandbox): ${error.message || 'Notification queued'}`,
      };
    }
  }

  public async deleteApplication(id: string): Promise<void> {
    const updated = this.applications.filter((a) => a.id !== id);
    this.saveApplicationsToStorage(updated);

    try {
      await apiClient.delete(`/careers/applications/${id}`);
    } catch (err) {
      console.warn(`[CAREERS SERVICE] Backend delete application fallback:`, err);
    }
  }
}

export const careersService = new CareersService();
