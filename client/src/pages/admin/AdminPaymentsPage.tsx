import React, { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  adminPaymentService,
  CouponItem,
  CouponInput,
} from '../../services/adminPayment.service';
import {
  PaymentConfig,
  FestivalOffer,
  ProOnePricing,
  PaymentRequestItem,
} from '../../services/payment.service';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import {
  X,
  CreditCard,
  QrCode,
  Sparkles,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Save,
  Check,
  Building2,
  Tag,
  Gift,
  Maximize2,
  Copy,
  Mail,
  EyeOff,
  Lock,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import defaultUpiQr from '../../assets/upi-qr.jpg';

import { SmtpSettings } from '../../services/payment.service';

type ActiveTab = 'requests' | 'gateways' | 'offers' | 'pricing' | 'email';

export const AdminPaymentsPage: React.FC = () => {
  useDocumentTitle('Payments, Gateways & Offer Control — Admin Portal');

  const [activeTab, setActiveTab] = useState<ActiveTab>('requests');
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Settings state
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    upiId: 'sandipkrvirat@okaxis',
    upiReceiverName: 'Sandip Kumar (NextEra Coders)',
    qrImageUrl: '/images/upi-qr.jpg',
    bankName: 'HDFC Bank / Axis Bank',
    accountNumber: '50200089123456',
    ifscCode: 'HDFC0001234',
    accountHolder: 'Sandip Kumar (NextEra Coders)',
    enabledMethods: {
      upiQr: true,
      upiApps: true,
      cards: true,
      netbanking: true,
      emi: true,
    },
  });

  const [festivalOffer, setFestivalOffer] = useState<FestivalOffer>({
    isActive: false,
    title: 'Festive Developer Celebration Offer',
    description: 'Get an extra flat 20% off on all Pro Courses & Pro One Yearly Pass!',
    discountPercent: 20,
    bannerText: '🎉 Special Festival Offer: Extra 20% OFF with code FESTIVAL20',
    couponCode: 'FESTIVAL20',
  });

  const [proOnePricing, setProOnePricing] = useState<ProOnePricing>({
    monthlyPrice: 399,
    yearlyPrice: 2999,
    lifetimePrice: 5999,
    originalMonthlyPrice: 999,
    originalYearlyPrice: 9999,
    originalLifetimePrice: 14999,
  });

  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    fromName: 'NextEra Coders',
    fromEmail: 'noreply@nexteracoders.com',
  });
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [requestsCounts, setRequestsCounts] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalRevenue?: number;
  }>({ total: 0, pending: 0, approved: 0, rejected: 0, totalRevenue: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequestItem | null>(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Coupons state
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState<CouponInput>({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: 20,
    minOrderValue: 0,
    maxUses: 500,
    isActive: true,
  });

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4500);
  };

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const data = await adminPaymentService.getPaymentSettings();
      if (data.paymentConfig) setPaymentConfig(data.paymentConfig);
      if (data.festivalOffer) setFestivalOffer(data.festivalOffer);
      if (data.proOnePricing) setProOnePricing(data.proOnePricing);
      if (data.smtpSettings) setSmtpSettings(data.smtpSettings);
    } catch {
      // Fallback
    }
  }, []);

  // Fetch payment requests
  const fetchRequests = useCallback(async () => {
    try {
      const res = await adminPaymentService.getPaymentRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setRequests(res.data || []);
      if (res.counts) setRequestsCounts(res.counts);
    } catch {
      // Fallback
    }
  }, [statusFilter, searchQuery]);

  // Fetch coupons
  const fetchCoupons = useCallback(async () => {
    try {
      const res = await adminPaymentService.getCoupons();
      setCoupons(res.data || []);
    } catch {
      // Fallback
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSettings(), fetchRequests(), fetchCoupons()]);
    setLoading(false);
  }, [fetchSettings, fetchRequests, fetchCoupons]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Save Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await adminPaymentService.updatePaymentSettings({
        paymentConfig,
        festivalOffer,
        proOnePricing,
        smtpSettings,
      });
      showNotification('success', 'Payment gateways, QR config, offers, and Gmail SMTP settings saved successfully!');
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Approve Request
  const handleApproveRequest = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await adminPaymentService.approvePaymentRequest(id);
      showNotification('success', res.message || '🎉 Payment approved! Student Pro access activated and congratulations email delivered.');
      fetchRequests();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Request
  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await adminPaymentService.rejectPaymentRequest(selectedRequest._id, rejectionReason);
      showNotification('success', 'Payment request rejected with notification sent to student.');
      setRejectModalOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue) return;

    try {
      await adminPaymentService.createCoupon(couponForm);
      showNotification('success', `Coupon ${couponForm.code.toUpperCase()} created successfully!`);
      setCouponModalOpen(false);
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percent',
        discountValue: 20,
        minOrderValue: 0,
        maxUses: 500,
        isActive: true,
      });
      fetchCoupons();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to create coupon');
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await adminPaymentService.deleteCoupon(id);
      showNotification('success', 'Coupon deleted successfully');
      fetchCoupons();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  // Toggle Coupon Active Status
  const handleToggleCoupon = async (coupon: CouponItem) => {
    try {
      await adminPaymentService.updateCoupon(coupon._id, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to update coupon');
    }
  };

  // Test Email States
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTarget.trim()) {
      showNotification('error', 'Please enter a target email address');
      return;
    }
    try {
      setTestEmailLoading(true);
      const res = await adminPaymentService.testEmail(testEmailTarget.trim());
      if (res.success) {
        showNotification('success', res.message || 'Test email dispatched successfully! Check inbox/spam.');
        setTestEmailModalOpen(false);
      } else {
        showNotification('error', res.message || 'Failed to send test email');
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'SMTP Connection Error. Check SMTP_USER & SMTP_PASS in server/.env');
    } finally {
      setTestEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments, Gateways & Offer Control"
        description="Manage QR payment verification requests, custom UPI gateways, festival discounts, coupons, and Pro One membership pricing."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Mail className="w-4 h-4 text-brand-500" />}
              onClick={() => setTestEmailModalOpen(true)}
            >
              Test Email Delivery
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />}
              onClick={loadAll}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={savingSettings}
              onClick={handleSaveSettings}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      {message && (
        <div
          className={cn(
            'p-4 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in',
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Total Revenue</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              ₹{(requestsCounts.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {requestsCounts.approved} approved transactions
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <DollarSign className="w-5 h-5" />
          </div>
        </Card>

        <Card variant="elevated" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Total Submissions</div>
            <div className="text-2xl font-black text-brand-500 mt-1 font-mono">
              {requestsCounts.total || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">All student payment requests</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
            <CreditCard className="w-5 h-5" />
          </div>
        </Card>

        <Card variant="elevated" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Pending Manual Review</div>
            <div className="text-2xl font-bold text-amber-500 mt-1 font-mono">{requestsCounts.pending}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting verification</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card variant="elevated" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Active Offers &amp; Coupons</div>
            <div className="text-2xl font-bold text-violet-500 mt-1 font-mono">
              {coupons.filter((c) => c.isActive).length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {festivalOffer.isActive ? `${festivalOffer.discountPercent}% OFF Live` : 'No Active Offer'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
            <Tag className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-dark-800 space-x-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer',
            activeTab === 'requests'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <Clock className="w-4 h-4" />
          <span>Verification Requests</span>
          {requestsCounts.pending > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-mono font-bold">
              {requestsCounts.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gateways')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer',
            activeTab === 'gateways'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <QrCode className="w-4 h-4" />
          <span>QR Code & Gateways</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer',
            activeTab === 'offers'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Festival Offers & Coupons</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer',
            activeTab === 'pricing'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pro One & Fee Pricing</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer',
            activeTab === 'email'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <Mail className="w-4 h-4" />
          <span>Email & Gmail Delivery</span>
        </button>
      </div>

      {/* TAB 1: Payment Verification Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search UTR, student, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                    : 'bg-slate-100 dark:bg-dark-850 text-slate-600 dark:text-slate-400'
                )}
              >
                All ({requestsCounts.total})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-dark-850 text-slate-600 dark:text-slate-400'
                )}
              >
                Pending ({requestsCounts.pending})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                  statusFilter === 'approved'
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'bg-slate-100 dark:bg-dark-850 text-slate-600 dark:text-slate-400'
                )}
              >
                Approved ({requestsCounts.approved})
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                  statusFilter === 'rejected'
                    ? 'bg-red-500 text-white font-bold'
                    : 'bg-slate-100 dark:bg-dark-850 text-slate-600 dark:text-slate-400'
                )}
              >
                Rejected ({requestsCounts.rejected})
              </button>
            </div>
          </div>

          <Card variant="elevated" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-dark-850 border-b border-slate-200 dark:border-dark-800 text-slate-500 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Student Details</th>
                    <th className="p-3.5">Item / Plan</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">UTR / Transaction ID</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No payment verification requests found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-850/50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{req.userName}</div>
                          <div className="text-[11px] text-slate-400">{req.userEmail}</div>
                          {req.payerUpiId && (
                            <div className="text-[10px] font-mono text-brand-500 mt-0.5">
                              UPI: {req.payerUpiId}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
                              req.type === 'pro_one'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                            )}
                          >
                            {req.type === 'pro_one' ? `Pro One (${req.planId || 'Yearly'})` : 'Pro Course'}
                          </span>
                          <div className="font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                            {req.courseTitle || 'NEC Pro One All-Access Pass'}
                          </div>
                          {req.notes && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 italic line-clamp-1 bg-slate-100 dark:bg-dark-800 px-1.5 py-0.5 rounded">
                              "{req.notes}"
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm font-mono">
                            ₹{req.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{req.paymentMethod}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-dark-850 font-mono font-bold text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-dark-800 select-all">
                            {req.transactionId}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase inline-flex items-center gap-1',
                              req.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : req.status === 'rejected'
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                            )}
                          >
                            {req.status === 'approved' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : req.status === 'rejected' ? (
                              <XCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>{req.status}</span>
                          </span>
                          {req.rejectionReason && (
                            <div className="text-[10px] text-red-400 mt-1 line-clamp-1">
                              {req.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-400 font-mono">
                          {new Date(req.createdAt).toLocaleDateString()} <br />
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => {
                              setSelectedRequest(req);
                              setProofModalOpen(true);
                            }}
                            title="View Full Details & Proof"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {req.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-[11px]"
                                leftIcon={<Check className="w-3 h-3" />}
                                isLoading={actionLoading}
                                onClick={() => handleApproveRequest(req._id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-red-500 hover:bg-red-500/10 border-red-500/30 text-[11px]"
                                leftIcon={<XCircle className="w-3 h-3" />}
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setRejectModalOpen(true);
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Gateways & Payment Controls */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs font-bold uppercase">
                    <QrCode className="w-4 h-4" />
                    <span>Fallback UPI ID & Direct Bank Details</span>
                  </div>
                  <CardTitle className="text-base font-bold">Manual Backup UPI Configuration</CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Business UPI ID (VPA) *
                    </label>
                    <Input
                      value={paymentConfig.upiId}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, upiId: e.target.value })
                      }
                      placeholder="e.g. nexteracoders@okaxis"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Displayed on all QR payment modals for student scanning.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Receiver Business Name *
                    </label>
                    <Input
                      value={paymentConfig.upiReceiverName}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, upiReceiverName: e.target.value })
                      }
                      placeholder="e.g. NextEra Coders Foundation"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Appears on the student's UPI payment confirmation screen.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Custom QR Image URL (Optional)
                  </label>
                  <Input
                    value={paymentConfig.qrImageUrl}
                    onChange={(e) =>
                      setPaymentConfig({ ...paymentConfig, qrImageUrl: e.target.value })
                    }
                    placeholder="https://example.com/my-custom-upi-qr.png"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Leave blank to auto-generate crisp vector QR codes with your UPI ID.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs font-bold uppercase">
                  <Building2 className="w-4 h-4" />
                  <span>Direct Bank NEFT / IMPS Details</span>
                </div>
                <CardTitle className="text-base font-bold">Bank Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Bank Name
                    </label>
                    <Input
                      value={paymentConfig.bankName}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, bankName: e.target.value })
                      }
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Account Holder Name
                    </label>
                    <Input
                      value={paymentConfig.accountHolder}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, accountHolder: e.target.value })
                      }
                      placeholder="e.g. NextEra Coders Edtech Private Limited"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Account Number
                    </label>
                    <Input
                      value={paymentConfig.accountNumber}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, accountNumber: e.target.value })
                      }
                      placeholder="e.g. 50200089123456"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      IFSC Code
                    </label>
                    <Input
                      value={paymentConfig.ifscCode}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, ifscCode: e.target.value })
                      }
                      placeholder="e.g. HDFC0001234"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs font-bold uppercase">
                  <CreditCard className="w-4 h-4" />
                  <span>Enabled Payment Methods</span>
                </div>
                <CardTitle className="text-base font-bold">Checkout Gateway Toggles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'upiQr', label: 'UPI QR Code (Manual Scan & Review)', desc: 'Instant QR display with admin UTR review flow' },
                    { key: 'upiApps', label: '1-Tap UPI Apps', desc: 'GPay, PhonePe, Paytm, BHIM, Cred app deep links' },
                    { key: 'cards', label: 'Credit & Debit Cards', desc: 'Visa, Mastercard, RuPay card gateway' },
                    { key: 'netbanking', label: 'Net Banking', desc: 'Top 50+ Indian banks net banking' },
                    { key: 'emi', label: 'No-Cost EMI Options', desc: '3, 6, 12 months installment plans' },
                  ].map((method) => {
                    const isChecked = paymentConfig.enabledMethods[method.key as keyof typeof paymentConfig.enabledMethods];
                    return (
                      <label
                        key={method.key}
                        className={cn(
                          'p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors',
                          isChecked
                            ? 'bg-brand-500/5 border-brand-500/30'
                            : 'bg-slate-50 dark:bg-dark-850 border-slate-200 dark:border-dark-800 opacity-60'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setPaymentConfig({
                              ...paymentConfig,
                              enabledMethods: {
                                ...paymentConfig.enabledMethods,
                                [method.key]: e.target.checked,
                              },
                            })
                          }
                          className="mt-1 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{method.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{method.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Preview Column */}
          <div>
            <Card variant="elevated" className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-brand-500" />
                  <span>Student Checkout QR Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <div
                  onClick={() => setIsQrZoomed(true)}
                  className="relative group p-4 bg-white rounded-2xl border-2 border-slate-200 dark:border-dark-700 shadow-md cursor-zoom-in hover:border-brand-500 hover:shadow-xl transition-all"
                  title="Click to expand QR in full screen"
                >
                  <img
                    src={paymentConfig.qrImageUrl || defaultUpiQr}
                    alt="Custom Admin QR"
                    className="w-48 h-48 object-contain rounded-xl group-hover:scale-[1.02] transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultUpiQr;
                    }}
                  />

                  {/* Zoom Overlay */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[1px]">
                    <Maximize2 className="w-6 h-6 stroke-[2.5]" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950/80 px-2 py-0.5 rounded-md">
                      Click to Expand
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                    {paymentConfig.upiReceiverName}
                  </div>
                  <div className="text-[11px] font-mono text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 inline-block">
                    UPI: {paymentConfig.upiId}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  leftIcon={<Save className="w-4 h-4" />}
                  isLoading={savingSettings}
                  onClick={handleSaveSettings}
                >
                  Save Gateway Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      )}

      {/* TAB 3: Festival Offers & Coupons */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {/* Festival Offer Control Box */}
          <Card variant="elevated" className="border-2 border-amber-500/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-500 font-mono text-xs font-bold uppercase">
                  <Gift className="w-4 h-4" />
                  <span>Site-Wide Festival Offer Banner</span>
                </div>
                <CardTitle className="text-lg font-extrabold mt-1">Festival Discount & Announcement</CardTitle>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={festivalOffer.isActive}
                  onChange={(e) =>
                    setFestivalOffer({ ...festivalOffer, isActive: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-dark-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-3 text-xs font-bold text-slate-900 dark:text-slate-100">
                  {festivalOffer.isActive ? 'BANNER LIVE' : 'DISABLED'}
                </span>
              </label>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Festival Title *
                  </label>
                  <Input
                    value={festivalOffer.title}
                    onChange={(e) =>
                      setFestivalOffer({ ...festivalOffer, title: e.target.value })
                    }
                    placeholder="e.g. Diwali Tech Super Sale"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Discount Percentage (%) *
                  </label>
                  <Input
                    type="number"
                    value={festivalOffer.discountPercent}
                    onChange={(e) =>
                      setFestivalOffer({
                        ...festivalOffer,
                        discountPercent: Number(e.target.value),
                      })
                    }
                    placeholder="e.g. 20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Associated Coupon Code *
                  </label>
                  <Input
                    value={festivalOffer.couponCode}
                    onChange={(e) =>
                      setFestivalOffer({
                        ...festivalOffer,
                        couponCode: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. FESTIVAL20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Top Header Announcement Banner Text *
                </label>
                <Input
                  value={festivalOffer.bannerText}
                  onChange={(e) =>
                    setFestivalOffer({ ...festivalOffer, bannerText: e.target.value })
                  }
                  placeholder="e.g. 🎉 Special Festival Offer: Extra 20% OFF with code FESTIVAL20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Offer Description & Perks
                </label>
                <Input
                  value={festivalOffer.description}
                  onChange={(e) =>
                    setFestivalOffer({ ...festivalOffer, description: e.target.value })
                  }
                  placeholder="e.g. Get an extra flat 20% off on all Pro Courses & Pro One Yearly Pass!"
                />
              </div>

              {festivalOffer.isActive && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Banner Preview: {festivalOffer.bannerText}</span>
                  </div>
                  <span className="font-mono px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold text-[10px]">
                    LIVE NOW
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-dark-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ✨ <strong>Dynamic Checkout Display:</strong> When active, this festival offer will automatically show right at the <em>Apply Coupon</em> box across Course and Pro One checkout modals. When disabled, it is immediately hidden.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                  isLoading={savingSettings}
                  onClick={handleSaveSettings}
                  className="shrink-0"
                >
                  Save Festival Offer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Coupons Management Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Coupon Codes Hub</h3>
                <p className="text-xs text-slate-500">
                  Create, toggle, and configure custom discount codes for checkout.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setCouponModalOpen(true)}
              >
                Create New Coupon
              </Button>
            </div>

            <Card variant="elevated" className="overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-dark-850 border-b border-slate-200 dark:border-dark-800 text-slate-500 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Coupon Code</th>
                    <th className="p-3.5">Discount Value</th>
                    <th className="p-3.5">Min Order</th>
                    <th className="p-3.5">Uses Count</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No custom coupons created yet. Default promo codes (PROONE50, SAVE1000) are active as fallbacks.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-850/50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-mono font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                            {c.code}
                          </div>
                          {c.description && <div className="text-[11px] text-slate-400 mt-0.5">{c.description}</div>}
                        </td>
                        <td className="p-3.5">
                          <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100">
                            {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {c.minOrderValue ? `₹${c.minOrderValue}` : 'No Min'}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {c.usedCount} / {c.maxUses}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleCoupon(c)}
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer',
                              c.isActive
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-slate-200 text-slate-500 dark:bg-dark-800'
                            )}
                          >
                            {c.isActive ? 'Active' : 'Paused'}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeleteCoupon(c._id)}
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: Pro One & Fee Pricing */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-2 text-amber-500 font-mono text-xs font-bold uppercase">
                <DollarSign className="w-4 h-4" />
                <span>Global Pro One Membership Pricing Control</span>
              </div>
              <CardTitle className="text-base font-bold">Pro One Membership Subscription Tiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Yearly Plan */}
                <div className="p-5 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-500 text-sm">Plus Plan (1 Year - Featured)</span>
                    <span className="text-[10px] font-mono bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-extrabold">
                      70% OFF
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Current Price (₹) *
                    </label>
                    <Input
                      type="number"
                      value={proOnePricing.yearlyPrice}
                      onChange={(e) =>
                        setProOnePricing({
                          ...proOnePricing,
                          yearlyPrice: Number(e.target.value),
                        })
                      }
                      placeholder="2999"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Original Strikethrough Price (₹) *
                    </label>
                    <Input
                      type="number"
                      value={proOnePricing.originalYearlyPrice}
                      onChange={(e) =>
                        setProOnePricing({
                          ...proOnePricing,
                          originalYearlyPrice: Number(e.target.value),
                        })
                      }
                      placeholder="9999"
                    />
                  </div>
                </div>

                {/* Monthly Plan */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-850 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Basic Plan (Monthly)</span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Current Price (₹) *
                    </label>
                    <Input
                      type="number"
                      value={proOnePricing.monthlyPrice}
                      onChange={(e) =>
                        setProOnePricing({
                          ...proOnePricing,
                          monthlyPrice: Number(e.target.value),
                        })
                      }
                      placeholder="399"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Original Strikethrough Price (₹) *
                    </label>
                    <Input
                      type="number"
                      value={proOnePricing.originalMonthlyPrice}
                      onChange={(e) =>
                        setProOnePricing({
                          ...proOnePricing,
                          originalMonthlyPrice: Number(e.target.value),
                        })
                      }
                      placeholder="999"
                    />
                  </div>
                </div>

                {/* 3 Years Plan */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-850 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Pro Plan (3 Years)</span>
                    <span className="text-[10px] font-mono bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-extrabold">
                      Popular
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Current Price (₹) *
                    </label>
                    <Input
                      type="number"
                      value={proOnePricing.lifetimePrice}
                      onChange={(e) =>
                        setProOnePricing({
                          ...proOnePricing,
                          lifetimePrice: Number(e.target.value),
                        })
                      }
                      placeholder="5999"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Original Strikethrough Price (₹) *
                    </label>
                    <Input
                      type="number"
                      value={proOnePricing.originalLifetimePrice}
                      onChange={(e) =>
                        setProOnePricing({
                          ...proOnePricing,
                          originalLifetimePrice: Number(e.target.value),
                        })
                      }
                      placeholder="14999"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                  isLoading={savingSettings}
                  onClick={handleSaveSettings}
                >
                  Save Pricing Adjustments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: Email & Gmail SMTP Delivery Control */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Main Credentials Card */}
          <Card variant="elevated">
            <CardHeader className="border-b border-slate-200 dark:border-dark-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Gmail SMTP Email Delivery Settings</CardTitle>
                    <p className="text-xs text-slate-500">
                      Configure your Gmail account credentials to send automated approval & congratulations emails to students upon payment verification.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                  isLoading={savingSettings}
                  onClick={handleSaveSettings}
                >
                  Save Email Settings
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <span>Gmail Address (SMTP User) *</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. nexteracoders@gmail.com"
                    value={smtpSettings.user}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    The official Gmail address used to authenticate and deliver emails.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                    <span>Google 16-character App Password *</span>
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="text-brand-500 hover:text-brand-400 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showSmtpPass ? 'Hide' : 'Show'}</span>
                    </button>
                  </label>
                  <div className="relative">
                    <Input
                      type={showSmtpPass ? 'text' : 'password'}
                      placeholder="e.g. abcd efgh ijkl mnop"
                      value={smtpSettings.pass}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                      required
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Generate this from Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Sender Brand Display Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="NextEra Coders"
                    value={smtpSettings.fromName}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Appears in the student's inbox as the sender (e.g. &quot;NextEra Coders&quot;).
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    SMTP Host & Port (Default Gmail)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      value={smtpSettings.host || 'smtp.gmail.com'}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                    <Input
                      type="number"
                      value={smtpSettings.port || 465}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, port: Number(e.target.value) })}
                      placeholder="465"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Host: smtp.gmail.com | Port: 465 (SSL/TLS Secure)
                  </span>
                </div>
              </div>

              {/* Live Test Trigger Row */}
              <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Live Test Outbound Email</div>
                    <div className="text-[11px] text-slate-500">
                      Send a real congratulation email with full HTML design to verify credentials.
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Mail className="w-4 h-4 text-brand-500" />}
                  onClick={() => setTestEmailModalOpen(true)}
                >
                  Send Live Test Email
                </Button>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                  isLoading={savingSettings}
                  onClick={handleSaveSettings}
                >
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guide Card on How to Generate App Password */}
          <Card variant="elevated" className="border border-brand-500/20 bg-slate-50/50 dark:bg-dark-900/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-500 font-bold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>How to generate a Google 16-character App Password (30-second guide):</span>
                </div>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-500 hover:text-brand-400 font-semibold flex items-center gap-1"
                >
                  <span>Open Google App Passwords</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-800 space-y-1">
                  <div className="font-mono font-bold text-brand-500">Step 1</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Enable 2-Step Verification</div>
                  <p className="text-[11px] text-slate-500">Ensure 2-Step Verification is ON in your Google Account Security.</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-800 space-y-1">
                  <div className="font-mono font-bold text-brand-500">Step 2</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Open App Passwords</div>
                  <p className="text-[11px] text-slate-500">Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-brand-500 underline">Google App Passwords</a>.</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-800 space-y-1">
                  <div className="font-mono font-bold text-brand-500">Step 3</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Create New App Password</div>
                  <p className="text-[11px] text-slate-500">Enter App Name as &quot;NextEra Coders&quot; and click <strong>Create</strong>.</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-800 space-y-1">
                  <div className="font-mono font-bold text-brand-500">Step 4</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Paste & Save</div>
                  <p className="text-[11px] text-slate-500">Copy the 16-character code into the box above and click Save Email Settings.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proof & Details Modal */}
      {selectedRequest && (
        <Modal
          isOpen={proofModalOpen}
          onClose={() => {
            setProofModalOpen(false);
            setSelectedRequest(null);
          }}
          title="Payment Verification Details"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-850 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-dark-800">
                <span className="text-slate-500">Status:</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px]',
                    selectedRequest.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : selectedRequest.status === 'rejected'
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  )}
                >
                  {selectedRequest.status}
                </span>
              </div>
              <div><span className="text-slate-500">Student:</span> <strong className="text-slate-900 dark:text-slate-100">{selectedRequest.userName}</strong> ({selectedRequest.userEmail})</div>
              <div><span className="text-slate-500">Plan / Course:</span> <strong className="text-brand-600 dark:text-brand-400">{selectedRequest.courseTitle || (selectedRequest.type === 'pro_one' ? `NEC Pro One All-Access (${selectedRequest.planId || 'Yearly'})` : 'Pro Course')}</strong></div>
              <div><span className="text-slate-500">Amount:</span> <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">₹{selectedRequest.amount.toLocaleString()}</strong> via {selectedRequest.paymentMethod}</div>
              <div><span className="text-slate-500">UTR / Ref:</span> <span className="font-mono font-bold text-brand-500 select-all">{selectedRequest.transactionId}</span></div>
              {selectedRequest.payerUpiId && <div><span className="text-slate-500">Payer UPI ID:</span> <span className="font-mono">{selectedRequest.payerUpiId}</span></div>}
              {selectedRequest.notes && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <span className="font-bold text-[10px] uppercase block">Student Message / Note:</span>
                  "{selectedRequest.notes}"
                </div>
              )}
              {selectedRequest.rejectionReason && (
                <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                  <span className="font-bold text-[10px] uppercase block">Rejection Reason:</span>
                  {selectedRequest.rejectionReason}
                </div>
              )}
            </div>

            {selectedRequest.screenshotUrl ? (
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-500">Attached Payment Proof:</div>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-dark-800">
                  <img
                    src={selectedRequest.screenshotUrl}
                    alt="Proof"
                    className="w-full h-auto max-h-80 object-contain bg-slate-950"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs bg-slate-100 dark:bg-dark-900 rounded-xl">
                No screenshot attachment provided with this submission. Verify UTR in bank statement.
              </div>
            )}

            {selectedRequest.status === 'pending' && (
              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-dark-800">
                <Button
                  variant="primary"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold"
                  onClick={() => {
                    setProofModalOpen(false);
                    handleApproveRequest(selectedRequest._id);
                  }}
                  isLoading={actionLoading}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Activate Access
                </Button>
                <Button
                  variant="outline"
                  className="text-red-500 hover:bg-red-500/10 border-red-500/30"
                  onClick={() => {
                    setProofModalOpen(false);
                    setRejectModalOpen(true);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {selectedRequest && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => {
            setRejectModalOpen(false);
            setSelectedRequest(null);
          }}
          title="Reject Payment Request"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Please enter the reason for rejecting UTR <strong>{selectedRequest.transactionId}</strong>.
              This reason will be sent as a notification to the student.
            </p>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Transaction ID not found in bank statement, or Amount mismatch"
                rows={3}
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedRequest(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-500 text-white"
                isLoading={actionLoading}
                onClick={handleRejectRequest}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Coupon Modal */}
      <Modal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title="Create New Coupon Code"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Coupon Code *
            </label>
            <Input
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. SUMMER50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Discount Type *
              </label>
              <select
                value={couponForm.discountType}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    discountType: e.target.value as 'percent' | 'flat',
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 focus:outline-none focus:border-brand-500"
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Discount Value *
              </label>
              <Input
                type="number"
                value={couponForm.discountValue}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })
                }
                placeholder="20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Min Order Value (₹)
              </label>
              <Input
                type="number"
                value={couponForm.minOrderValue}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, minOrderValue: Number(e.target.value) })
                }
                placeholder="0"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Max Usage Limit
              </label>
              <Input
                type="number"
                value={couponForm.maxUses}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })
                }
                placeholder="500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Description (Optional)
            </label>
            <Input
              value={couponForm.description}
              onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
              placeholder="e.g. Special promo code for summer batch students"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setCouponModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create Coupon
            </Button>
          </div>
        </form>
      </Modal>

      {/* Fullscreen Blurred QR Lightbox Overlay */}
      {isQrZoomed && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsQrZoomed(false)}
        >
          <div
            className="relative bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center max-w-sm sm:max-w-md w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsQrZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Official Business QR
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                NextEra Coders UPI Gateway
              </div>
            </div>

            {/* Large Crisp QR Code */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xl flex flex-col items-center mb-4">
              <img
                src={paymentConfig.qrImageUrl || defaultUpiQr}
                alt="Official UPI QR Fullscreen"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultUpiQr;
                }}
              />
            </div>

            {/* UPI Details & Copy */}
            <div className="w-full bg-slate-50 dark:bg-dark-850 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-1.5 text-center">
              <div className="text-[11px] text-slate-500 font-mono">Business UPI ID</div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-sm select-all">
                  {paymentConfig.upiId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentConfig.upiId);
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-dark-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-400">
                Receiver: {paymentConfig.upiReceiverName}
              </div>
            </div>

            {/* Helper text */}
            <p className="text-[11px] text-slate-400 text-center mt-3">
              GPay • PhonePe • Paytm • BHIM • Cred • Any UPI App
            </p>
            <div className="text-[10px] text-slate-400 mt-1">
              Click anywhere outside or press X to close
            </div>
          </div>
        </div>
      )}

      {/* Test Email Delivery Modal */}
      {testEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Test Email Delivery</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Send a test congratulatory email via Gmail SMTP</p>
                </div>
              </div>
              <button
                onClick={() => setTestEmailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Recipient Email Address
                </label>
                <Input
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  A real Pro Access Approval email with full HTML design will be delivered to this address.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                <div className="font-bold">⚠️ Gmail SMTP Checklist:</div>
                <div>1. In <code>server/.env</code> set: <code>SMTP_USER=yourgmail@gmail.com</code></div>
                <div>2. Set <code>SMTP_PASS=your_16_char_app_password</code> (generated from Google Account &gt; Security &gt; 2FA &gt; App Passwords)</div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTestEmailModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={testEmailLoading}
                  leftIcon={<Mail className="w-4 h-4" />}
                >
                  {testEmailLoading ? 'Sending Test Email...' : 'Send Test Email'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
