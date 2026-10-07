export interface ICertificateCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  category?: string;
  level?: string;
  duration?: string;
  instructor?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export interface ICertificate {
  id: string;
  certificateId: string;
  studentName: string;
  courseName: string;
  courseCategory?: string;
  trackType?: 'free' | 'pro';
  grade?: string;
  course?: ICertificateCourse | null;
  issueDate: string;
  verificationUrl: string;
  certificateUrl: string;
  createdAt: string;
}

export interface ICertificateListResponse {
  certificates: ICertificate[];
}

export type CertificateItem = ICertificate;

export interface ICertificateVerifyResponse {
  verified: boolean;
  certificateId?: string;
  studentName?: string;
  courseName?: string;
  courseCategory?: string;
  trackType?: 'free' | 'pro';
  grade?: string;
  issueDate?: string;
}

export interface ICertificateTemplateSettings {
  headerLogoUrl: string;
  watermarkLogoUrl: string;
  watermarkOpacity: number;
  title: string;
  subtitle: string;
  organizationName: string;
  organizationSubtext: string;
  freeTrackBadge: string;
  freeTrackDescription: string;
  freeHonorsStatement: string;
  proTrackBadge: string;
  proTrackDescription: string;
  proHonorsStatement: string;
  signatoryName: string;
  signatoryTitle: string;
  signatorySignatureText: string;
  signatureImageUrl?: string;
  sealTopText: string;
  sealBottomText: string;
  sealSubtext: string;
}

export const DEFAULT_CERTIFICATE_TEMPLATE: ICertificateTemplateSettings = {
  headerLogoUrl: '/images/nec-favicon.png',
  watermarkLogoUrl: '/images/nec-favicon.png',
  watermarkOpacity: 0.12,
  title: 'Certificate of Achievement',
  subtitle: 'This is proudly presented to',
  organizationName: 'NextEra Coders Academy',
  organizationSubtext: 'Official Credential & Verification Registry',
  freeTrackBadge: 'NextEra Open Academy • Verified Completion',
  freeTrackDescription: 'for having successfully demonstrated coding competency and successfully completing the free',
  freeHonorsStatement: 'Conferred under the NextEra Open Engineering Initiative upon demonstrating rigorous coding competency and foundational mastery.',
  proTrackBadge: 'NextEra Pro Specialization • Verified Honors Track',
  proTrackDescription: 'for successfully mastering all curriculum modules, architecture benchmarks, and hands-on engineering projects in',
  proHonorsStatement: 'Conferred under the NextEra Advanced Engineering Fellowship with verified production architecture, live code review, and honors standing.',
  signatoryName: 'Sandip Kumar Verma',
  signatoryTitle: 'Founder & Chief Mentor',
  signatorySignatureText: 'Sandip Kr Verma',
  signatureImageUrl: '',
  sealTopText: 'NEC',
  sealBottomText: '2026',
  sealSubtext: 'Verified Credential',
};

