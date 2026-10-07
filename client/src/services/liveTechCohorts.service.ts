export interface ILiveTechCohort {
  id: string;
  title: string;
  slug: string;
  badge: 'LIVE' | 'PRO' | 'UPCOMING' | 'FAST TRACK';
  rating: number;
  schedule: string;
  linkUrl?: string;
  instructor?: string;
  enrolledCount?: number;
  isActive: boolean;
  order: number;
}

const STORAGE_KEY = 'nec_live_tech_cohorts_v1';

export const DEFAULT_LIVE_COHORTS: ILiveTechCohort[] = [
  {
    id: 'data-analytics',
    title: 'Data Analytics Course with Python & SQL',
    slug: 'python-for-data-science',
    schedule: 'Starting from — Sept 5, 2026',
    badge: 'LIVE',
    rating: 4.8,
    linkUrl: '/courses/python-for-data-science',
    instructor: 'Naveen Kumar',
    enrolledCount: 1420,
    isActive: true,
    order: 1,
  },
  {
    id: 'java-backend',
    title: 'Java Backend & Spring Boot Microservices',
    slug: 'java-fullstack-mastery',
    schedule: 'Starting from — Sept 8, 2026',
    badge: 'LIVE',
    rating: 4.9,
    linkUrl: '/courses/java-fullstack-mastery',
    instructor: 'Naveen Kumar',
    enrolledCount: 1890,
    isActive: true,
    order: 2,
  },
  {
    id: 'dsa-system-design',
    title: 'DSA & System Design Masterclass',
    slug: 'dsa-mastery-course',
    schedule: 'Starting from — Sept 12, 2026',
    badge: 'PRO',
    rating: 4.9,
    linkUrl: '/courses/dsa-mastery-course',
    instructor: 'Sandip Kr Verma',
    enrolledCount: 2650,
    isActive: true,
    order: 3,
  },
  {
    id: 'fullstack-mern-next',
    title: 'Full-Stack Next.js 15 & AI SaaS Architecture',
    slug: 'full-stack-web-development',
    schedule: 'Starting from — Sept 18, 2026',
    badge: 'UPCOMING',
    rating: 4.9,
    linkUrl: '/courses/full-stack-web-development',
    instructor: 'Sandip Kr Verma',
    enrolledCount: 980,
    isActive: true,
    order: 4,
  },
];

class LiveTechCohortsService {
  private cohorts: ILiveTechCohort[] = [];
  private listeners: Set<(cohorts: ILiveTechCohort[]) => void> = new Set();

  constructor() {
    this.cohorts = this.loadCohorts();
  }

  private loadCohorts(): ILiveTechCohort[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading live tech cohorts', e);
    }
    this.saveToStorage(DEFAULT_LIVE_COHORTS);
    return DEFAULT_LIVE_COHORTS;
  }

  private saveToStorage(cohorts: ILiveTechCohort[]) {
    this.cohorts = cohorts;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
    } catch (e) {
      console.error('Error saving live tech cohorts', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.cohorts]));
  }

  public subscribe(listener: (cohorts: ILiveTechCohort[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.cohorts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getCohorts(): ILiveTechCohort[] {
    return [...this.cohorts];
  }

  public getActiveCohorts(): ILiveTechCohort[] {
    return this.cohorts
      .filter((c) => c.isActive)
      .sort((a, b) => a.order - b.order);
  }

  public saveCohort(cohortData: Partial<ILiveTechCohort> & { title: string; schedule: string }): ILiveTechCohort {
    const slug = cohortData.slug || cohortData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = cohortData.id || `cohort-${Date.now()}`;

    const existingIdx = this.cohorts.findIndex((c) => c.id === id);

    const fullCohort: ILiveTechCohort = {
      id,
      title: cohortData.title.trim(),
      slug,
      badge: cohortData.badge || 'LIVE',
      rating: Number(cohortData.rating) || 4.9,
      schedule: cohortData.schedule.trim(),
      linkUrl: cohortData.linkUrl || `/courses/${slug}`,
      instructor: cohortData.instructor || 'NextEra Expert',
      enrolledCount: Number(cohortData.enrolledCount) || 500,
      isActive: cohortData.isActive !== false,
      order: cohortData.order ?? (existingIdx >= 0 ? this.cohorts[existingIdx].order : this.cohorts.length + 1),
    };

    let updated: ILiveTechCohort[];
    if (existingIdx >= 0) {
      updated = [...this.cohorts];
      updated[existingIdx] = fullCohort;
    } else {
      updated = [...this.cohorts, fullCohort];
    }

    this.saveToStorage(updated);
    return fullCohort;
  }

  public deleteCohort(id: string): void {
    const updated = this.cohorts.filter((c) => c.id !== id);
    this.saveToStorage(updated);
  }

  public toggleActive(id: string): void {
    const updated = this.cohorts.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    this.saveToStorage(updated);
  }

  public resetToDefaults(): void {
    this.saveToStorage(DEFAULT_LIVE_COHORTS);
  }
}

export const liveTechCohortsService = new LiveTechCohortsService();
