import { TUTORIAL_TRACKS } from '../data/tutorialDocumentation';

export type ColorThemeKey =
  | 'purple'
  | 'cyan'
  | 'blue'
  | 'red'
  | 'indigo'
  | 'amber'
  | 'sky'
  | 'pink'
  | 'emerald'
  | 'rose'
  | 'slate';

export interface ColorThemeConfig {
  color: string;
  border: string;
  glow: string;
  textColor: string;
}

export const COLOR_THEMES: Record<ColorThemeKey, ColorThemeConfig> = {
  purple: {
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-500/40',
    glow: 'group-hover:shadow-purple-500/15',
    textColor: 'text-purple-500',
  },
  cyan: {
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    border: 'hover:border-cyan-500/40',
    glow: 'group-hover:shadow-cyan-500/15',
    textColor: 'text-cyan-500',
  },
  blue: {
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-500/40',
    glow: 'group-hover:shadow-blue-500/15',
    textColor: 'text-blue-500',
  },
  red: {
    color: 'bg-red-500/10 text-red-600 dark:text-red-400',
    border: 'hover:border-red-500/40',
    glow: 'group-hover:shadow-red-500/15',
    textColor: 'text-red-500',
  },
  indigo: {
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    border: 'hover:border-indigo-500/40',
    glow: 'group-hover:shadow-indigo-500/15',
    textColor: 'text-indigo-500',
  },
  amber: {
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-500/40',
    glow: 'group-hover:shadow-amber-500/15',
    textColor: 'text-amber-500',
  },
  sky: {
    color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    border: 'hover:border-sky-500/40',
    glow: 'group-hover:shadow-sky-500/15',
    textColor: 'text-sky-500',
  },
  pink: {
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    border: 'hover:border-pink-500/40',
    glow: 'group-hover:shadow-pink-500/15',
    textColor: 'text-pink-500',
  },
  emerald: {
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-500/40',
    glow: 'group-hover:shadow-emerald-500/15',
    textColor: 'text-emerald-500',
  },
  rose: {
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    border: 'hover:border-rose-500/40',
    glow: 'group-hover:shadow-rose-500/15',
    textColor: 'text-rose-500',
  },
  slate: {
    color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    border: 'hover:border-slate-500/40',
    glow: 'group-hover:shadow-slate-500/15',
    textColor: 'text-slate-500',
  },
};

export interface IHomeTutorialSubject {
  id: string;
  title: string;
  trackId: string;
  tag: string;
  description: string;
  iconName: string;
  theme: ColorThemeKey;
  showOnHome: boolean;
  autoCount: boolean;
  manualChapterCount?: number;
  order: number;
}

const STORAGE_KEY = 'nec_home_tutorial_subjects_v2';

// Standard base chapter counts for static tracks
const STATIC_TRACK_PRESET_COUNTS: Record<string, number> = {
  dsa: 14,
  react: 12,
  webdev: 12,
  javascript: 12,
  python: 10,
  java: 11,
  cpp: 10,
  c: 8,
  systemdesign: 9,
  devops: 8,
  ml: 8,
  sql: 8,
  cybersecurity: 7,
};

export const DEFAULT_HOME_TUTORIAL_SUBJECTS: IHomeTutorialSubject[] = [
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    trackId: 'dsa',
    tag: 'DSA & ALGORITHMS',
    description: 'Arrays, Linked Lists, Trees, Graphs, Dynamic Programming with full code examples and sandboxes.',
    iconName: 'Binary',
    theme: 'purple',
    showOnHome: true,
    autoCount: true,
    manualChapterCount: 14,
    order: 1,
  },
  {
    id: 'webdev',
    title: 'Web & Full-Stack Development',
    trackId: 'react',
    tag: 'REACT & NEXT.JS',
    description: 'HTML5, CSS3, Modern JavaScript ES6+, React Hooks, and Next.js full-stack architectures.',
    iconName: 'Layers',
    theme: 'cyan',
    showOnHome: true,
    autoCount: true,
    manualChapterCount: 12,
    order: 2,
  },
  {
    id: 'python',
    title: 'Python Programming',
    trackId: 'python',
    tag: 'PYTHON 3.12',
    description: 'Python syntax, OOP, scripting, data manipulation pipelines, and backend development.',
    iconName: 'FileCode2',
    theme: 'blue',
    showOnHome: true,
    autoCount: true,
    manualChapterCount: 10,
    order: 3,
  },
  {
    id: 'java',
    title: 'Java Enterprise Systems',
    trackId: 'java',
    tag: 'JAVA 21 & SPRING',
    description: 'Core Java, Collections, Multithreading, JVM architecture, and Spring Boot microservices.',
    iconName: 'Coffee',
    theme: 'red',
    showOnHome: true,
    autoCount: true,
    manualChapterCount: 11,
    order: 4,
  },
  {
    id: 'cpp',
    title: 'C++ & System Programming',
    trackId: 'cpp',
    tag: 'C++20 & STL',
    description: 'Pointers, memory management, OOP, STL containers, templates, and high-performance algorithms.',
    iconName: 'Cpu',
    theme: 'indigo',
    showOnHome: true,
    autoCount: true,
    manualChapterCount: 10,
    order: 5,
  },
  {
    id: 'systemdesign',
    title: 'System Design & Architecture',
    trackId: 'systemdesign',
    tag: 'HLD & LLD SYSTEMS',
    description: 'High-level design, caching, load balancing, sharding, microservices, and distributed pipelines.',
    iconName: 'Network',
    theme: 'amber',
    showOnHome: true,
    autoCount: true,
    manualChapterCount: 9,
    order: 6,
  },
  {
    id: 'devops',
    title: 'DevOps & Cloud Engineering',
    trackId: 'devops',
    tag: 'DOCKER, K8S & CI/CD',
    description: 'Linux systems, Docker containers, Kubernetes clusters, CI/CD automation, and cloud deployments.',
    iconName: 'Cloud',
    theme: 'sky',
    showOnHome: true,
    autoCount: true,
    manualChapterCount: 8,
    order: 7,
  },
  {
    id: 'ml',
    title: 'AI, ML & Generative AI',
    trackId: 'ml',
    tag: 'AI & NEURAL NETS',
    description: 'Machine learning fundamentals, deep learning, PyTorch models, LLM prompts, and GenAI.',
    iconName: 'Sparkles',
    theme: 'pink',
    showOnHome: true,
    autoCount: true,
    manualChapterCount: 8,
    order: 8,
  },
  {
    id: 'sql',
    title: 'SQL & Database Engineering',
    trackId: 'sql',
    tag: 'SQL & POSTGRES',
    description: 'Relational databases, indexing, query optimization, ACID transactions, and NoSQL engines.',
    iconName: 'Database',
    theme: 'emerald',
    showOnHome: false,
    autoCount: true,
    manualChapterCount: 8,
    order: 9,
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity & Ethical Hacking',
    trackId: 'cybersecurity',
    tag: 'INFOSEC & OWASP',
    description: 'Network security, cryptography, penetration testing, OWASP Top 10 vulnerabilities, and ethical hacking.',
    iconName: 'ShieldCheck',
    theme: 'rose',
    showOnHome: false,
    autoCount: true,
    manualChapterCount: 7,
    order: 10,
  },
  {
    id: 'javascript',
    title: 'JavaScript & TypeScript Mastery',
    trackId: 'javascript',
    tag: 'JS ES6+ & TS',
    description: 'Async/await, Event Loop, closures, TypeScript types, interfaces, and modern front-end tooling.',
    iconName: 'FileCode',
    theme: 'amber',
    showOnHome: false,
    autoCount: true,
    manualChapterCount: 12,
    order: 11,
  },
  {
    id: 'c',
    title: 'C Programming Fundamentals',
    trackId: 'c',
    tag: 'C LANGUAGE',
    description: 'Pointers, manual memory allocation, structs, system calls, and embedded programming fundamentals.',
    iconName: 'Terminal',
    theme: 'slate',
    showOnHome: false,
    autoCount: true,
    manualChapterCount: 8,
    order: 12,
  },
];

class HomeTutorialsService {
  private subjects: IHomeTutorialSubject[] = [];
  private listeners: Set<(subjects: IHomeTutorialSubject[]) => void> = new Set();

  constructor() {
    this.subjects = this.loadSubjects();
  }

  private loadSubjects(): IHomeTutorialSubject[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with any missing defaults if needed
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const merged = [...parsed];
          DEFAULT_HOME_TUTORIAL_SUBJECTS.forEach((def) => {
            if (!existingIds.has(def.id)) {
              merged.push(def);
            }
          });
          return merged;
        }
      }
    } catch (e) {
      console.error('Error loading home tutorial subjects', e);
    }
    this.saveToStorage(DEFAULT_HOME_TUTORIAL_SUBJECTS);
    return DEFAULT_HOME_TUTORIAL_SUBJECTS;
  }

  private saveToStorage(subjects: IHomeTutorialSubject[]) {
    this.subjects = subjects;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    } catch (e) {
      console.error('Error saving home tutorial subjects', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.subjects]));
  }

  public subscribe(listener: (subjects: IHomeTutorialSubject[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.subjects]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSubjects(): IHomeTutorialSubject[] {
    return [...this.subjects].sort((a, b) => a.order - b.order);
  }

  public getActiveHomeSubjects(): IHomeTutorialSubject[] {
    return this.subjects
      .filter((s) => s.showOnHome)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Dynamically calculates the chapter/module count for a subject track.
   * Counts both static chapters and dynamic tutorials created in the database.
   */
  public calculateChapterCount(subject: IHomeTutorialSubject, backendTutorials: any[] = []): number {
    if (!subject.autoCount && subject.manualChapterCount && subject.manualChapterCount > 0) {
      return subject.manualChapterCount;
    }

    const trackId = subject.trackId.toLowerCase();

    // 1. Check in static tracks
    let staticCount = 0;
    const staticTrack = TUTORIAL_TRACKS.find(
      (t) => t.id.toLowerCase() === trackId || (trackId === 'webdev' && (t.id === 'react' || t.id === 'javascript'))
    );

    if (staticTrack && Array.isArray(staticTrack.sections)) {
      staticTrack.sections.forEach((sec) => {
        if (Array.isArray(sec.chapters)) {
          staticCount += sec.chapters.length;
        }
      });
    }

    // 2. Count dynamic published chapters from backend
    let dynamicCount = 0;
    if (Array.isArray(backendTutorials) && backendTutorials.length > 0) {
      dynamicCount = backendTutorials.filter((bt) => {
        const btTrack = (bt.track || bt.category || '').toLowerCase();
        return btTrack === trackId || (trackId === 'webdev' && (btTrack === 'react' || btTrack === 'javascript'));
      }).length;
    }

    const totalCalculated = staticCount + dynamicCount;

    if (totalCalculated > 0) {
      return totalCalculated;
    }

    // 3. Fallback to preset count or manual count
    return STATIC_TRACK_PRESET_COUNTS[trackId] || subject.manualChapterCount || 8;
  }

  public saveSubject(subjectData: Partial<IHomeTutorialSubject> & { title: string; trackId: string }): IHomeTutorialSubject {
    const id = subjectData.id || subjectData.trackId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingIdx = this.subjects.findIndex((s) => s.id === id);

    const theme = subjectData.theme || 'purple';

    const fullSubject: IHomeTutorialSubject = {
      id,
      title: subjectData.title.trim(),
      trackId: subjectData.trackId.trim().toLowerCase(),
      tag: subjectData.tag?.trim() || `${subjectData.title.toUpperCase().slice(0, 15)}`,
      description:
        subjectData.description?.trim() ||
        `Master ${subjectData.title} with step-by-step documentation, interactive code, and practical exercises.`,
      iconName: subjectData.iconName || 'BookOpen',
      theme,
      showOnHome: subjectData.showOnHome !== false,
      autoCount: subjectData.autoCount !== false,
      manualChapterCount: subjectData.manualChapterCount ? Number(subjectData.manualChapterCount) : undefined,
      order: subjectData.order ?? (existingIdx >= 0 ? this.subjects[existingIdx].order : this.subjects.length + 1),
    };

    let updated: IHomeTutorialSubject[];
    if (existingIdx >= 0) {
      updated = [...this.subjects];
      updated[existingIdx] = fullSubject;
    } else {
      updated = [...this.subjects, fullSubject];
    }

    this.saveToStorage(updated);
    return fullSubject;
  }

  public toggleHomeVisibility(id: string): void {
    const updated = this.subjects.map((s) => (s.id === id ? { ...s, showOnHome: !s.showOnHome } : s));
    this.saveToStorage(updated);
  }

  public toggleAutoCount(id: string): void {
    const updated = this.subjects.map((s) => (s.id === id ? { ...s, autoCount: !s.autoCount } : s));
    this.saveToStorage(updated);
  }

  public moveSubject(id: string, direction: 'up' | 'down'): void {
    const list = [...this.subjects].sort((a, b) => a.order - b.order);
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const prev = list[index - 1];
      const current = list[index];
      const tempOrder = prev.order;
      prev.order = current.order;
      current.order = tempOrder;
      if (prev.order === current.order) {
        prev.order = index + 1;
        current.order = index;
      }
    } else if (direction === 'down' && index < list.length - 1) {
      const next = list[index + 1];
      const current = list[index];
      const tempOrder = next.order;
      next.order = current.order;
      current.order = tempOrder;
      if (next.order === current.order) {
        next.order = index + 1;
        current.order = index + 2;
      }
    }

    this.saveToStorage(list);
  }

  public deleteSubject(id: string): void {
    const updated = this.subjects.filter((s) => s.id !== id);
    this.saveToStorage(updated);
  }

  public resetToDefaults(): void {
    this.saveToStorage(DEFAULT_HOME_TUTORIAL_SUBJECTS);
  }
}

export const homeTutorialsService = new HomeTutorialsService();
