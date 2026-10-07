import { api } from './api';

export interface InactiveStudentItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  learningStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  daysInactive: number;
  lastRetentionNotificationSentAt: string | null;
  whatsAppLink: string | null;
}

export interface BroadcastLogItem {
  _id: string;
  title: string;
  message: string;
  channels: ('email' | 'whatsapp' | 'in_app')[];
  targetAudience: 'all' | 'inactive_10_days' | 'single';
  recipientCount: number;
  emailSuccessCount: number;
  whatsAppLinksGenerated: number;
  inAppCount: number;
  triggeredByName: string;
  presetKey?: string;
  createdAt: string;
}

export interface BroadcastPayload {
  title: string;
  message: string;
  link?: string;
  channels: ('email' | 'whatsapp' | 'in_app')[];
  targetAudience: 'all' | 'inactive_10_days' | 'single';
  targetUserId?: string;
  presetKey?: string;
}

export interface BlastInactivePayload {
  channels?: ('email' | 'whatsapp' | 'in_app')[];
  customMessage?: string;
}

class AdminBroadcastService {
  /**
   * Get list of students inactive for 10 or more days
   */
  public async getInactiveStudents(): Promise<{
    students: InactiveStudentItem[];
    totalInactive: number;
  }> {
    const res = await api.get('/admin/broadcast/inactive-students');
    return res.data?.data || res.data;
  }

  /**
   * 1-Click Multi-Channel Comeback Blast to all inactive students
   */
  public async blastInactiveStudents(payload?: BlastInactivePayload): Promise<{
    targetedCount: number;
    emailSuccessCount: number;
    whatsAppCount: number;
    inAppCount: number;
    whatsAppChatLinks: Array<{ name: string; phone: string; link: string }>;
  }> {
    const res = await api.post('/admin/broadcast/blast-inactive', payload || {});
    return res.data?.data || res.data;
  }

  /**
   * Send multi-channel announcement broadcast (Email, WhatsApp, In-App)
   */
  public async sendBroadcast(payload: BroadcastPayload): Promise<{
    log: BroadcastLogItem;
    recipientsTargeted: number;
    emailSuccessCount: number;
    whatsAppSuccessCount: number;
    inAppCount: number;
    whatsAppChatLinks: Array<{ name: string; phone: string; link: string }>;
  }> {
    const res = await api.post('/admin/broadcast/send', payload);
    return res.data?.data || res.data;
  }

  /**
   * Get past broadcast delivery logs
   */
  public async getBroadcastLogs(page = 1, limit = 20): Promise<{
    logs: BroadcastLogItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const res = await api.get('/admin/broadcast/logs', { params: { page, limit } });
    return res.data?.data || res.data;
  }
}

export const adminBroadcastService = new AdminBroadcastService();
