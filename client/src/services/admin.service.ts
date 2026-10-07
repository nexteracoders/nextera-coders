import { api } from './api';
import {
  AdminDashboardData,
  AdminAnalyticsData,
  AdminStudentItem,
  AdminStudentDossier,
  AdminModuleItem,
  AdminLessonItem,
  AdminAnnouncementItem,
  AdminFAQItem,
  AdminTestimonialItem,
  AdminMentorItem,
  AdminMentorDossier,
  AdminPlatformSettings,
  AdminAuditLogItem,
  SystemHealthMetrics,
  AdminSubAdminItem,
  AdminSubAdminsResponse,
} from '../types/admin.types';
import { ICertificateTemplateSettings } from '../types/certificate.types';

export const adminService = {
  // Dashboard & Analytics
  async getDashboard(): Promise<AdminDashboardData> {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  },

  async getAnalytics(timeframe: string = '30d'): Promise<AdminAnalyticsData> {
    const response = await api.get(`/admin/analytics?timeframe=${timeframe}`);
    return response.data.data;
  },

  // Student Management
  async getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{
    students: AdminStudentItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    const response = await api.get(`/admin/students?${query.toString()}`);
    return response.data.data;
  },

  async getStudentById(id: string): Promise<AdminStudentDossier> {
    const response = await api.get(`/admin/students/${id}`);
    return response.data.data;
  },

  async updateStudentStatus(id: string, isActive: boolean): Promise<any> {
    const response = await api.patch(`/admin/students/${id}/status`, { isActive });
    return response.data.data;
  },

  async updateStudentSubscription(
    id: string,
    payload: {
      action: 'grant' | 'extend' | 'revoke';
      plan?: 'monthly' | 'yearly' | 'lifetime';
      customEndDate?: string;
    }
  ): Promise<any> {
    const response = await api.put(`/admin/students/${id}/subscription`, payload);
    return response.data.data;
  },

  async enrollStudentInCourse(
    id: string,
    payload: {
      courseId: string;
      tier?: 'free' | 'pro';
    }
  ): Promise<any> {
    const response = await api.post(`/admin/students/${id}/enroll`, payload);
    return response.data.data;
  },

  async removeStudentEnrollment(id: string, enrollmentId: string): Promise<any> {
    const response = await api.delete(`/admin/students/${id}/enrollments/${enrollmentId}`);
    return response.data.data;
  },

  async updateStudentProfile(
    id: string,
    payload: {
      name?: string;
      email?: string;
      role?: 'student' | 'admin' | 'sub_admin';
      profileImage?: string;
      college?: string;
      bio?: string;
      skills?: string[];
      github?: string;
      linkedin?: string;
      points?: number;
      learningStreak?: number;
      isActive?: boolean;
      newPassword?: string;
    }
  ): Promise<any> {
    const response = await api.put(`/admin/students/${id}/profile`, payload);
    return response.data.data;
  },

  async adjustStudentCoins(
    id: string,
    payload: {
      amount: number;
      mode: 'add' | 'deduct' | 'set';
      reason?: string;
      email?: string;
      userEmail?: string;
      name?: string;
      userName?: string;
    }
  ): Promise<any> {
    const response = await api.put(`/admin/students/${id}/coins`, payload);
    return response.data.data;
  },

  async adjustStudentStreak(
    id: string,
    payload: {
      streak: number;
      claimedToday?: boolean;
      email?: string;
      userEmail?: string;
      name?: string;
      userName?: string;
    }
  ): Promise<any> {
    const response = await api.put(`/admin/students/${id}/streak`, payload);
    return response.data.data;
  },

  async updateSwagOrderStatus(
    orderId: string,
    payload: {
      status: 'Processing' | 'Shipped' | 'Delivered';
      trackingNumber?: string;
      studentEmail?: string;
      studentId?: string;
    }
  ): Promise<any> {
    const response = await api.put(`/admin/swag-orders/${orderId}/status`, payload);
    return response.data.data;
  },

  async grantStudentPerk(
    id: string,
    payload: {
      type: 'coupon' | 'course';
      title?: string;
      discountPercent?: number;
      couponCode?: string;
      courseSlug?: string;
      email?: string;
      userEmail?: string;
      name?: string;
      userName?: string;
    }
  ): Promise<any> {
    const response = await api.post(`/admin/students/${id}/perks`, payload);
    return response.data.data;
  },

  async createStudentSwagOrder(
    id: string,
    payload: {
      rewardTitle: string;
      coinsCost: number;
      fullName?: string;
      phone?: string;
      address?: string;
      city?: string;
      pincode?: string;
      email?: string;
      userEmail?: string;
      name?: string;
      userName?: string;
    }
  ): Promise<any> {
    const response = await api.post(`/admin/students/${id}/swag-order`, payload);
    return response.data.data;
  },

  // Module Management
  async getModules(courseId?: string): Promise<{ modules: AdminModuleItem[] }> {
    const url = courseId ? `/admin/modules?courseId=${courseId}` : '/admin/modules';
    const response = await api.get(url);
    return response.data.data;
  },

  async createModule(data: {
    courseId: string;
    title: string;
    description?: string;
    order?: number;
  }): Promise<any> {
    const response = await api.post('/admin/modules', data);
    return response.data.data;
  },

  async updateModule(id: string, data: any): Promise<any> {
    const response = await api.put(`/admin/modules/${id}`, data);
    return response.data.data;
  },

  async deleteModule(id: string): Promise<any> {
    const response = await api.delete(`/admin/modules/${id}`);
    return response.data;
  },

  async reorderModule(id: string, newOrder: number): Promise<any> {
    const response = await api.patch(`/admin/modules/${id}/reorder`, { newOrder });
    return response.data.data;
  },

  // Lesson Management
  async getLessons(params?: {
    courseId?: string;
    moduleId?: string;
    search?: string;
  }): Promise<{ lessons: AdminLessonItem[] }> {
    const query = new URLSearchParams();
    if (params?.courseId) query.append('courseId', params.courseId);
    if (params?.moduleId) query.append('moduleId', params.moduleId);
    if (params?.search) query.append('search', params.search);

    const response = await api.get(`/admin/lessons?${query.toString()}`);
    return response.data.data;
  },

  async createLesson(data: any): Promise<any> {
    const response = await api.post('/admin/lessons', data);
    return response.data.data;
  },

  async updateLesson(id: string, data: any): Promise<any> {
    const response = await api.put(`/admin/lessons/${id}`, data);
    return response.data.data;
  },

  async deleteLesson(id: string): Promise<any> {
    const response = await api.delete(`/admin/lessons/${id}`);
    return response.data;
  },

  async publishLesson(id: string): Promise<any> {
    const response = await api.patch(`/admin/lessons/${id}/publish`);
    return response.data.data;
  },

  async unpublishLesson(id: string): Promise<any> {
    const response = await api.patch(`/admin/lessons/${id}/unpublish`);
    return response.data.data;
  },

  async reorderLesson(id: string, newOrder: number): Promise<any> {
    const response = await api.patch(`/admin/lessons/${id}/reorder`, { newOrder });
    return response.data.data;
  },

  // Announcements
  async getAnnouncements(): Promise<{ announcements: AdminAnnouncementItem[] }> {
    const response = await api.get('/admin/announcements');
    return response.data.data;
  },

  async createAnnouncement(data: {
    title: string;
    message: string;
    type?: string;
    link?: string;
    isPublished?: boolean;
  }): Promise<any> {
    const response = await api.post('/admin/announcements', data);
    return response.data.data;
  },

  async updateAnnouncement(id: string, data: any): Promise<any> {
    const response = await api.put(`/admin/announcements/${id}`, data);
    return response.data.data;
  },

  async deleteAnnouncement(id: string): Promise<any> {
    const response = await api.delete(`/admin/announcements/${id}`);
    return response.data;
  },

  async publishAnnouncement(id: string): Promise<any> {
    const response = await api.patch(`/admin/announcements/${id}/publish`);
    return response.data.data;
  },

  async broadcastAnnouncement(data: {
    title: string;
    message: string;
    type?: string;
    link?: string;
    channels: string[];
    targetAudience: 'all' | 'pro' | 'inactive';
  }): Promise<{
    totalAudience: number;
    delivered: { inApp: number; email: number; whatsapp: number };
    channels: string[];
    targetAudience: string;
  }> {
    const response = await api.post('/admin/announcements/broadcast', data);
    return response.data.data;
  },

  async getInactiveRetentionStats(): Promise<{
    totalInactive: number;
    eligibleForBlast: number;
    recentlyReminded: number;
    withPhoneCount: number;
    sampleStudents: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      college: string;
      learningStreak: number;
      daysInactive: number;
      lastActiveDate: string;
      remindedRecently: boolean;
      lastRetentionSentAt?: string;
    }>;
  }> {
    const response = await api.get('/admin/announcements/inactive-stats');
    return response.data.data;
  },

  async triggerInactiveRetentionBlast(): Promise<{
    eligibleCount: number;
    delivered: { inApp: number; email: number; whatsapp: number };
  }> {
    const response = await api.post('/admin/announcements/inactive-blast');
    return response.data.data;
  },

  // FAQs
  async getFaqs(): Promise<{ faqs: AdminFAQItem[] }> {
    const response = await api.get('/admin/faqs');
    return response.data.data;
  },

  async createFaq(data: {
    question: string;
    answer: string;
    category?: string;
    order?: number;
    isPublished?: boolean;
  }): Promise<any> {
    const response = await api.post('/admin/faqs', data);
    return response.data.data;
  },

  async updateFaq(id: string, data: any): Promise<any> {
    const response = await api.put(`/admin/faqs/${id}`, data);
    return response.data.data;
  },

  async deleteFaq(id: string): Promise<any> {
    const response = await api.delete(`/admin/faqs/${id}`);
    return response.data;
  },

  // Testimonials
  async getTestimonials(): Promise<{ testimonials: AdminTestimonialItem[] }> {
    const response = await api.get('/admin/testimonials');
    return response.data.data;
  },

  async createTestimonial(data: {
    name: string;
    role: string;
    company?: string;
    avatar?: string;
    content: string;
    rating?: number;
    isPublished?: boolean;
    order?: number;
  }): Promise<any> {
    const response = await api.post('/admin/testimonials', data);
    return response.data.data;
  },

  async updateTestimonial(id: string, data: any): Promise<any> {
    const response = await api.put(`/admin/testimonials/${id}`, data);
    return response.data.data;
  },

  async deleteTestimonial(id: string): Promise<any> {
    const response = await api.delete(`/admin/testimonials/${id}`);
    return response.data;
  },

  // Mentors
  async getMentors(): Promise<{ mentors: AdminMentorItem[] }> {
    const response = await api.get('/admin/mentors');
    return response.data.data;
  },

  async getMentorById(id: string): Promise<AdminMentorDossier> {
    const response = await api.get(`/admin/mentors/${id}`);
    return response.data.data;
  },

  async createMentor(data: Partial<AdminMentorItem>): Promise<any> {
    const response = await api.post('/admin/mentors', data);
    return response.data.data;
  },

  async updateMentor(id: string, data: Partial<AdminMentorItem>): Promise<any> {
    const response = await api.put(`/admin/mentors/${id}`, data);
    return response.data.data;
  },

  async resetMentorPassword(id: string, password: string): Promise<any> {
    const response = await api.post(`/admin/mentors/${id}/password`, { password });
    return response.data;
  },

  async deleteMentor(id: string): Promise<any> {
    const response = await api.delete(`/admin/mentors/${id}`);
    return response.data;
  },

  // Settings
  async getSettings(): Promise<{ settings: AdminPlatformSettings }> {
    const response = await api.get('/admin/settings');
    return response.data.data;
  },

  async updateSettings(data: Partial<AdminPlatformSettings>): Promise<any> {
    const response = await api.put('/admin/settings', data);
    return response.data.data;
  },

  // Achievements
  async getAchievements(): Promise<{ achievements: any[] }> {
    const response = await api.get('/admin/achievements');
    return response.data.data;
  },

  async createAchievement(data: any): Promise<any> {
    const response = await api.post('/admin/achievements', data);
    return response.data.data;
  },

  async updateAchievement(id: string, data: any): Promise<any> {
    const response = await api.put(`/admin/achievements/${id}`, data);
    return response.data.data;
  },

  // Certificates
  async getCertificates(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    certificates: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await api.get(`/admin/certificates?${query.toString()}`);
    return response.data.data;
  },

  // Certificate Template Format Customization
  async getCertificateTemplate(): Promise<ICertificateTemplateSettings> {
    const response = await api.get('/admin/certificates/template');
    return response.data.data.template;
  },

  async updateCertificateTemplate(templateData: Partial<ICertificateTemplateSettings>): Promise<ICertificateTemplateSettings> {
    const response = await api.put('/admin/certificates/template', templateData);
    return response.data.data.template;
  },

  // Audit Logs
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
  }): Promise<{
    logs: AdminAuditLogItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.action) query.append('action', params.action);
    if (params?.resourceType) query.append('resourceType', params.resourceType);

    const response = await api.get(`/admin/audit-logs?${query.toString()}`);
    return response.data.data;
  },

  // Server & Execution Health Dashboard
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    const response = await api.get('/admin/health/metrics');
    return response.data.data;
  },

  async testJudge0Ping(): Promise<{
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
    rawMessage?: string;
  }> {
    const response = await api.post('/admin/health/test-judge0');
    return response.data.data;
  },

  // Sub-Admins Management & Password Access (Master Admin Only)
  async getSubAdmins(): Promise<AdminSubAdminsResponse> {
    const response = await api.get('/admin/sub-admins');
    return response.data.data;
  },

  async appointSubAdmin(payload: {
    email: string;
    name?: string;
    password?: string;
    college?: string;
    bio?: string;
    profileImage?: string;
    source?: 'student' | 'mentor' | 'direct';
  }): Promise<{ subAdmin: AdminSubAdminItem }> {
    const response = await api.post('/admin/sub-admins', payload);
    return response.data.data;
  },

  async updateSubAdminPassword(
    id: string,
    newPassword: string
  ): Promise<{ subAdminId: string; plainPassword: string }> {
    const response = await api.put(`/admin/sub-admins/${id}/password`, { newPassword });
    return response.data.data;
  },

  async demoteSubAdmin(id: string): Promise<any> {
    const response = await api.delete(`/admin/sub-admins/${id}`);
    return response.data.data;
  },
};
