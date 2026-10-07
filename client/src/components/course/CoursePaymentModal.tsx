import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ICourse } from '../../types/course.types';
import {
  paymentService,
  PaymentConfig,
  FestivalOffer,
  ActiveCouponInfo,
} from '../../services/payment.service';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Sparkles,
  Tag,
  Copy,
  Check,
  Clock,
  QrCode,
  CreditCard,
  ArrowRight,
  ZoomIn,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface CoursePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: ICourse;
  onSuccess?: () => void;
}

type PaymentMethodType = 'upi' | 'card' | 'netbanking';

export const CoursePaymentModal: React.FC<CoursePaymentModalProps> = ({
  isOpen,
  onClose,
  course,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const originalPrice = course.originalPrice || 9999;
  const initialProPrice = course.proPrice || 1999;

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [festivalOffer, setFestivalOffer] = useState<FestivalOffer | null>(null);
  const [activeCoupons, setActiveCoupons] = useState<ActiveCouponInfo[]>([]);

  // Student Form Inputs (Strictly only essential fields)
  const [studentName, setStudentName] = useState(user?.name || '');
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [transactionId, setTransactionId] = useState('');

  // UI States
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTxId, setSubmittedTxId] = useState('');
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const qrHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleQrMouseEnter = () => {
    if (qrHoverTimeoutRef.current) {
      clearTimeout(qrHoverTimeoutRef.current);
      qrHoverTimeoutRef.current = null;
    }
    setIsQrZoomed(true);
  };

  const handleQrMouseLeave = () => {
    if (qrHoverTimeoutRef.current) {
      clearTimeout(qrHoverTimeoutRef.current);
    }
    qrHoverTimeoutRef.current = setTimeout(() => {
      setIsQrZoomed(false);
    }, 280);
  };

  useEffect(() => {
    return () => {
      if (qrHoverTimeoutRef.current) {
        clearTimeout(qrHoverTimeoutRef.current);
      }
    };
  }, []);

  // Load public payment config
  useEffect(() => {
    if (isOpen) {
      paymentService
        .getPublicPaymentConfig()
        .then((data) => {
          if (data.paymentConfig) {
            setPaymentConfig((prev) => ({ ...prev, ...data.paymentConfig }));
          }
          if (data.festivalOffer && data.festivalOffer.isActive) {
            setFestivalOffer(data.festivalOffer);
          } else {
            setFestivalOffer(null);
          }
          if (Array.isArray(data.activeCoupons)) {
            setActiveCoupons(data.activeCoupons);
          } else {
            setActiveCoupons([]);
          }
        })
        .catch(() => {
          // Fallback
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setAppliedCoupon(null);
      setAppliedCouponCode(null);
      setDiscountAmount(0);
      setCouponCode('');
      setTransactionId('');
      setSubmittedTxId('');
      setStudentName(user?.name || '');
      setStudentEmail(user?.email || '');
      setPaymentMethod('upi');
      if (qrHoverTimeoutRef.current) {
        clearTimeout(qrHoverTimeoutRef.current);
      }
      setIsQrZoomed(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const finalPrice = Math.max(0, initialProPrice - discountAmount);

  // Validate coupon via API
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    try {
      const res = await paymentService.validateCoupon(code, initialProPrice);
      setDiscountAmount(res.discountAmount);
      setCouponCode(res.code);
      setAppliedCouponCode(res.code);
      setAppliedCoupon(
        `${res.code} (${res.discountType === 'percent' ? `${res.discountValue}% OFF` : `₹${res.discountValue} OFF`})`
      );
      toastSuccess(`Coupon ${res.code} applied! Saved ₹${res.discountAmount.toLocaleString()}`, 'Discount Applied');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Invalid or expired coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedCouponCode(null);
    setDiscountAmount(0);
    setCouponCode('');
  };

  const otherAvailableCoupons = activeCoupons.filter(
    (c) =>
      !festivalOffer?.isActive ||
      c.code.toUpperCase() !== (festivalOffer.couponCode || '').toUpperCase()
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toastSuccess(`Copied: ${text}`, 'Copied to Clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Submit payment request for admin verification
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTxId = transactionId.trim();
    const cleanEmail = (studentEmail || user?.email || '').trim().toLowerCase();
    const cleanName = (studentName || user?.name || 'Student').trim();

    if (!cleanEmail) {
      toastError('Please enter your email address to link your Pro access.');
      return;
    }

    if (!cleanTxId || cleanTxId.length < 6) {
      toastError('Please enter a valid 12-digit UTR / Transaction Reference ID.');
      return;
    }

    try {
      setIsSubmitting(true);

      const methodLabel =
        paymentMethod === 'upi'
          ? 'UPI_QR'
          : paymentMethod === 'card'
          ? 'CARD'
          : 'NET_BANKING';

      await paymentService.submitPaymentRequest({
        type: 'course',
        courseId: course.id || (course as any)._id,
        courseTitle: course.title,
        amount: finalPrice,
        paymentMethod: methodLabel,
        transactionId: cleanTxId,
        userName: cleanName,
        userEmail: cleanEmail,
      });

      setSubmittedTxId(cleanTxId);
      setIsSubmitting(false);
      setIsSubmitted(true);
      toastSuccess('Payment request submitted! Admin will verify and activate your course.', 'Submitted');
      onSuccess?.();
    } catch (err: any) {
      setIsSubmitting(false);
      toastError(err.response?.data?.message || 'Failed to submit payment request. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-800 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Compact Header Bar */}
        <div className="px-5 py-3 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">Upgrade to NEC Pro</h3>
              <p className="text-[11px] text-white/80 line-clamp-1">{course.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State 1: Submitted Confirmation */}
        {isSubmitted ? (
          <div className="p-6 text-center space-y-4 animate-fade-in overflow-y-auto">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-bold border border-amber-500/30">
                ⏳ PENDING ADMIN VERIFICATION
              </span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white pt-1">
                Payment Request Received! 🎉
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Thank you, <strong>{studentName || 'Learner'}</strong>! Your payment request for <strong>{course.title}</strong> has been logged.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 max-w-sm mx-auto text-left space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">UTR / Ref ID:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400 select-all">{submittedTxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-emerald-600">₹{finalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Email:</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[170px]">{studentEmail}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <Button
                variant="primary"
                size="sm"
                className="font-bold bg-gradient-to-r from-brand-600 to-indigo-600 cursor-pointer flex items-center gap-1.5"
                onClick={() => {
                  onClose();
                  navigate('/profile');
                }}
              >
                <span>View Status in Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* State 2: Streamlined Payment & 3-Field Verification Form */
          <form onSubmit={handleSubmitPayment} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
            {/* Course Summary Card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{course.title}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Full Course Access</div>
              </div>
              <div className="text-right shrink-0">
                {discountAmount > 0 && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mr-1.5">
                    -₹{discountAmount.toLocaleString()}
                  </span>
                )}
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  ₹{finalPrice.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 line-through font-mono ml-1.5">
                  ₹{originalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Dynamic Festival / Coupon Offer Section at Coupon Input */}
            <div className="space-y-2 pt-0.5">
              {/* 1. Festival Offer Card (Rendered ONLY if admin turns ON festivalOffer.isActive) */}
              {festivalOffer?.isActive && (
                <div className="p-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border border-amber-500/40 text-xs space-y-1.5 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-[11px] min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                      <span className="truncate">{festivalOffer.title || 'Festival Special Offer'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-extrabold text-[10px] shrink-0 border border-amber-500/30">
                        {festivalOffer.discountPercent}% OFF
                      </span>
                    </div>

                    {appliedCouponCode === festivalOffer.couponCode ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" /> Applied
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(festivalOffer.couponCode)}
                        className="px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-mono text-[10px] shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                      >
                        Apply {festivalOffer.couponCode}
                      </button>
                    )}
                  </div>

                  {festivalOffer.description && (
                    <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-tight">
                      {festivalOffer.description}
                    </p>
                  )}
                </div>
              )}

              {/* 2. Coupon Input Bar */}
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="COUPON CODE"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    className="w-full pl-8 pr-2 py-1.5 text-xs font-mono uppercase font-bold rounded-lg border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100 placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
                {appliedCoupon ? (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="h-8 px-2.5 text-xs text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/40 cursor-pointer"
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    disabled={!couponCode.trim()}
                    onClick={() => handleApplyCoupon()}
                    className="h-8 px-3.5 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white cursor-pointer"
                  >
                    Apply
                  </Button>
                )}
              </div>

              {/* Applied Coupon Feedback */}
              {appliedCoupon && (
                <div className="p-1.5 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span>Coupon <strong>{appliedCoupon}</strong> active</span>
                  </div>
                  <span className="font-mono font-bold text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded">
                    -₹{discountAmount.toLocaleString()} Saved
                  </span>
                </div>
              )}

              {/* 3. Available Active Coupons (Configured by admin in CMS) */}
              {otherAvailableCoupons.length > 0 && !appliedCoupon && (
                <div className="pt-0.5 space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-brand-500" />
                    <span>Available Offers:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {otherAvailableCoupons.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleApplyCoupon(c.code)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-brand-50 dark:bg-dark-850 dark:hover:bg-brand-950/40 border border-slate-200 hover:border-brand-500/40 dark:border-dark-800 text-[10px] text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-all flex items-center gap-1 cursor-pointer"
                        title={c.description || `Click to apply ${c.code}`}
                      >
                        <span className="font-mono font-bold">{c.code}</span>
                        <span className="px-1 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[9px]">
                          {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>Select Payment Method:</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Zero Platform Fee</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-dark-800">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={cn(
                    'py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    paymentMethod === 'upi'
                      ? 'bg-white dark:bg-dark-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  )}
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    'py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    paymentMethod === 'card'
                      ? 'bg-white dark:bg-dark-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>Debit / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={cn(
                    'py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    paymentMethod === 'netbanking'
                      ? 'bg-white dark:bg-dark-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  )}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>NetBanking</span>
                </button>
              </div>

              {/* Method Details Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800">
                {paymentMethod === 'upi' && (
                  <div className="flex items-center gap-3">
                    {/* Compact QR Thumbnail with Hover Zoom to Center Screen */}
                    <div
                      className="relative shrink-0 p-1 bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer group/qr transition-all duration-200 hover:border-brand-500 hover:shadow-md"
                      onMouseEnter={handleQrMouseEnter}
                      onMouseLeave={handleQrMouseLeave}
                      onClick={() => setIsQrZoomed((prev) => !prev)}
                      title="Hover or click to view enlarged QR in center of screen"
                    >
                      <img
                        src={paymentConfig.qrImageUrl || '/images/upi-qr.jpg'}
                        alt="UPI QR"
                        className="w-24 h-24 object-contain rounded-lg transition-transform group-hover/qr:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-0.5 pointer-events-none">
                        <ZoomIn className="w-5 h-5 text-white drop-shadow-sm animate-pulse" />
                        <span className="bg-black/60 px-1.5 py-0.5 rounded text-[8.5px] font-mono">Hover to Zoom</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1.5 text-xs min-w-0">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">Pay to</span>
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {paymentConfig.upiReceiverName || 'Sandip Kumar (NextEra Coders)'}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">UPI ID</span>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs truncate select-all">
                            {paymentConfig.upiId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(paymentConfig.upiId, 'upi')}
                            className="p-1 px-1.5 rounded bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedKey === 'upi' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'upi' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Scan with GPay, PhonePe, Paytm or any UPI App
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-700/60 pb-1.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        Card Payment (Visa, MasterCard, RuPay)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Domestic & International</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                      Use your <strong>RuPay / Credit / Debit Card</strong> linked on Google Pay, PhonePe, Cred, or Paytm to pay directly to our official UPI handle:
                    </p>
                    <div className="p-2 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400 select-all">
                        {paymentConfig.upiId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(paymentConfig.upiId, 'card_upi')}
                        className="p-1 px-2 rounded bg-slate-100 dark:bg-dark-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'card_upi' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'card_upi' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center text-[11px] font-sans font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-dark-700/60 pb-1">
                      <span>Direct NEFT / IMPS Transfer</span>
                      <span className="text-[10px] font-normal text-slate-500">{paymentConfig.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans text-[11px]">A/C Number:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-brand-600 dark:text-brand-400 select-all">{paymentConfig.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentConfig.accountNumber, 'ac')}
                          className="p-0.5 px-1 rounded bg-white dark:bg-dark-900 border text-[9px] cursor-pointer"
                        >
                          {copiedKey === 'ac' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans text-[11px]">IFSC Code:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold select-all">{paymentConfig.ifscCode}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentConfig.ifscCode, 'ifsc')}
                          className="p-0.5 px-1 rounded bg-white dark:bg-dark-900 border text-[9px] cursor-pointer"
                        >
                          {copiedKey === 'ifsc' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-slate-500 font-sans text-[11px]">Beneficiary:</span>
                      <span className="font-sans text-[11px] font-medium text-slate-800 dark:text-slate-200">{paymentConfig.accountHolder}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Form (Only 3 essential fields) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Enter Transaction UTR for Admin Verification:</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 block mb-0.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 block mb-0.5">
                    Registered Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@gmail.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 block mb-0.5">
                  12-Digit Transaction ID (UTR) / Ref Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="12-digit UTR from GPay / PhonePe / Paytm / Bank"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  className="w-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded-lg border-2 border-brand-500/40 bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Submit Action */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full py-2.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              isLoading={isSubmitting}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Payment Request (₹{finalPrice.toLocaleString()})</span>
            </Button>
          </form>
        )}
      </div>

      {/* Full Middle-Screen QR Code Zoom Overlay on Hover / Click */}
      {isQrZoomed && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onMouseEnter={handleQrMouseEnter}
          onMouseLeave={handleQrMouseLeave}
          onClick={() => {
            if (qrHoverTimeoutRef.current) clearTimeout(qrHoverTimeoutRef.current);
            setIsQrZoomed(false);
          }}
        >
          <div
            className="relative p-5 sm:p-6 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-700 shadow-2xl max-w-xs sm:max-w-sm w-full text-center space-y-3.5 transform transition-transform animate-in zoom-in-95 duration-150"
            onMouseEnter={handleQrMouseEnter}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                if (qrHoverTimeoutRef.current) clearTimeout(qrHoverTimeoutRef.current);
                setIsQrZoomed(false);
              }}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[11px] font-mono font-bold">
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan & Pay ₹{finalPrice.toLocaleString()}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {paymentConfig.upiReceiverName || 'NextEra Coders'}
              </h3>
            </div>

            {/* Big High-Res QR Container */}
            <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-brand-500/40 shadow-inner flex items-center justify-center mx-auto w-56 h-56 sm:w-64 sm:h-64">
              <img
                src={paymentConfig.qrImageUrl || '/images/upi-qr.jpg'}
                alt="Enlarged UPI QR Code"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {/* UPI ID Quick Copy Pill */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 text-left">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">UPI ID</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs truncate block select-all">
                  {paymentConfig.upiId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(paymentConfig.upiId, 'upi_zoom')}
                className="px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
              >
                {copiedKey === 'upi_zoom' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'upi_zoom' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
              Move mouse away or click to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
