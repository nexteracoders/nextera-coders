import api from './api';
import {
  PaymentConfig,
  FestivalOffer,
  ProOnePricing,
  PaymentRequestItem,
  SmtpSettings,
  ProOnePlanItem,
} from './payment.service';

export interface CouponItem {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponInput {
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number;
  isActive?: boolean;
  expiresAt?: string;
}

export interface PaymentRequestsResponse {
  data: PaymentRequestItem[];
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalRevenue?: number;
  };
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminPaymentSettingsResponse {
  paymentConfig: PaymentConfig;
  festivalOffer: FestivalOffer;
  proOnePricing: ProOnePricing;
  proOnePlans?: ProOnePlanItem[];
  smtpSettings?: SmtpSettings;
}

export const adminPaymentService = {
  getPaymentSettings: async (): Promise<AdminPaymentSettingsResponse> => {
    const response = await api.get<{
      success: boolean;
      data: AdminPaymentSettingsResponse;
    }>('/admin/payments/settings');
    return response.data.data;
  },

  updatePaymentSettings: async (data: {
    paymentConfig?: Partial<PaymentConfig>;
    festivalOffer?: Partial<FestivalOffer>;
    proOnePricing?: Partial<ProOnePricing>;
    proOnePlans?: ProOnePlanItem[];
    smtpSettings?: Partial<SmtpSettings>;
  }): Promise<{
    paymentConfig: PaymentConfig;
    festivalOffer: FestivalOffer;
    proOnePricing: ProOnePricing;
    proOnePlans?: ProOnePlanItem[];
    smtpSettings?: SmtpSettings;
  }> => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: {
        paymentConfig: PaymentConfig;
        festivalOffer: FestivalOffer;
        proOnePricing: ProOnePricing;
        proOnePlans?: ProOnePlanItem[];
        smtpSettings?: SmtpSettings;
      };
    }>('/admin/payments/settings', data);
    return response.data.data;
  },

  getCoupons: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: CouponItem[]; meta: any }> => {
    const response = await api.get<{
      success: boolean;
      data: CouponItem[];
      meta: any;
    }>('/admin/payments/coupons', { params });
    return response.data;
  },

  createCoupon: async (data: CouponInput): Promise<CouponItem> => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: CouponItem;
    }>('/admin/payments/coupons', data);
    return response.data.data;
  },

  updateCoupon: async (id: string, data: Partial<CouponInput>): Promise<CouponItem> => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: CouponItem;
    }>(`/admin/payments/coupons/${id}`, data);
    return response.data.data;
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await api.delete(`/admin/payments/coupons/${id}`);
  },

  getPaymentRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaymentRequestsResponse> => {
    const response = await api.get<{
      success: boolean;
      data: PaymentRequestItem[];
      counts: any;
      meta: any;
    }>('/admin/payments/requests', { params });
    return {
      data: response.data.data,
      counts: response.data.counts,
      meta: response.data.meta,
    };
  },

  approvePaymentRequest: async (id: string): Promise<{ data: PaymentRequestItem; message: string; emailResult?: any }> => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: PaymentRequestItem;
      emailResult?: any;
    }>(`/admin/payments/requests/${id}/approve`);
    return {
      data: response.data.data,
      message: response.data.message,
      emailResult: response.data.emailResult,
    };
  },

  rejectPaymentRequest: async (id: string, rejectionReason?: string): Promise<PaymentRequestItem> => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: PaymentRequestItem;
    }>(`/admin/payments/requests/${id}/reject`, { rejectionReason });
    return response.data.data;
  },

  testEmail: async (targetEmail?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{
      success: boolean;
      message: string;
    }>('/admin/payments/test-email', { targetEmail });
    return response.data;
  },
};
