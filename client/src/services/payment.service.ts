import api from './api';

export interface PaymentConfig {
  upiId: string;
  upiReceiverName: string;
  qrImageUrl: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  enabledMethods: {
    upiQr: boolean;
    upiApps: boolean;
    cards: boolean;
    netbanking: boolean;
    emi: boolean;
  };
}

export interface FestivalOffer {
  isActive: boolean;
  title: string;
  description: string;
  discountPercent: number;
  bannerText: string;
  couponCode: string;
  expiresAt?: string;
}

export interface ProOnePricing {
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
  originalMonthlyPrice: number;
  originalYearlyPrice: number;
  originalLifetimePrice: number;
}

export interface SmtpSettings {
  service: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface ProOnePlanItem {
  id: 'monthly' | 'yearly' | 'lifetime';
  name: string;
  subtitle: string;
  badge?: string;
  originalPrice: number;
  price: number;
  perMonthPrice: number;
  durationLabel: string;
  billingText: string;
  subPriceText?: string;
  savePercent: number;
  features: string[];
}

export interface ActiveCouponInfo {
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValue?: number;
}

export interface PublicPaymentData {
  paymentConfig: PaymentConfig;
  festivalOffer: FestivalOffer;
  proOnePricing: ProOnePricing;
  proOnePlans?: ProOnePlanItem[];
  activeCoupons?: ActiveCouponInfo[];
  smtpSettings?: SmtpSettings;
}

export interface PaymentRequestSubmission {
  type: 'course' | 'pro_one';
  courseId?: string;
  courseTitle?: string;
  planId?: 'monthly' | 'yearly' | 'lifetime';
  amount: number;
  paymentMethod: string;
  transactionId: string;
  payerUpiId?: string;
  screenshotUrl?: string;
  notes?: string;
  userName?: string;
  userEmail?: string;
}

export interface PaymentRequestItem {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'course' | 'pro_one';
  courseId?: string;
  courseTitle?: string;
  planId?: 'monthly' | 'yearly' | 'lifetime';
  amount: number;
  paymentMethod: string;
  transactionId: string;
  payerUpiId?: string;
  screenshotUrl?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationResult {
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
}

export const paymentService = {
  getPublicPaymentConfig: async (): Promise<PublicPaymentData> => {
    const response = await api.get<{ success: boolean; data: PublicPaymentData }>('/payments/config');
    return response.data.data;
  },

  validateCoupon: async (code: string, amount: number): Promise<CouponValidationResult> => {
    const response = await api.post<{ success: boolean; data: CouponValidationResult }>(
      '/payments/coupons/validate',
      { code, amount }
    );
    return response.data.data;
  },

  submitPaymentRequest: async (data: PaymentRequestSubmission): Promise<PaymentRequestItem> => {
    const response = await api.post<{ success: boolean; data: PaymentRequestItem }>(
      '/payments/requests',
      data
    );
    return response.data.data;
  },

  getMyPaymentRequests: async (): Promise<PaymentRequestItem[]> => {
    const response = await api.get<{ success: boolean; data: PaymentRequestItem[] }>(
      '/payments/my-requests'
    );
    return response.data.data;
  },
};
