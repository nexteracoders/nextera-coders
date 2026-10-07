import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { ROUTES } from '../../constants/routes';
import {
  Mail,
  ArrowLeft,
  KeyRound,
  Timer,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const forgotOtpSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits'),
});

type ForgotOtpFormValues = z.infer<typeof forgotOtpSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp_verify'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { verifyOtpLogin } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ForgotOtpFormValues>({
    resolver: zodResolver(forgotOtpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  // 1-Minute Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, otpTimer]);

  const handleSendOtp = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setServerError('Please enter a valid registered email address');
      return;
    }

    try {
      setSendingOtp(true);
      setServerError(null);
      setValue('email', emailInput.trim());

      await authService.sendForgotOtp(emailInput.trim());

      setStep('otp_verify');
      setOtpTimer(60); // 1 Minute
      setIsTimerActive(true);
      success(`A 6-digit verification code has been sent to ${emailInput}. Valid for 1 minute.`, 'OTP Dispatched');
    } catch (err: any) {
      setServerError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (isTimerActive && otpTimer > 0) return;
    await handleSendOtp();
  };

  const onVerifyOtpSubmit = async (data: ForgotOtpFormValues) => {
    if (otpTimer === 0 && !isTimerActive) {
      setServerError('Verification code (OTP) has expired (1 minute limit). Please click "Resend OTP".');
      return;
    }

    try {
      setVerifying(true);
      setServerError(null);

      const user = await verifyOtpLogin({
        email: data.email,
        otp: data.otp,
      });

      success(`Welcome back, ${user.name}! Signed in successfully.`, 'Verification Successful');
      
      // Navigate to admin or student dashboard based on role
      const targetRoute = user.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      navigate(targetRoute, { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Invalid or expired OTP. Please check the code in your email.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 px-4 flex items-center justify-center min-h-[calc(100vh-16rem)] font-sans">
      <div className="w-full max-w-md space-y-6">
        <Card variant="elevated" className="border-slate-200 dark:border-dark-800 shadow-xl overflow-hidden relative">
          
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 'email' ? 'Forgot Password' : 'Enter 6-Digit OTP'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {step === 'email'
                ? 'Enter your account email to receive a 1-Minute secure verification code.'
                : `Enter the 6-digit OTP sent to ${emailInput} to sign in directly.`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {serverError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {step === 'email' ? (
              <div className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                />

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Timer className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>
                    <strong>Strict 1-Minute Security Limit:</strong> For your protection, the 6-digit code will expire exactly 60 seconds after dispatch.
                  </span>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  onClick={handleSendOtp}
                  isLoading={sendingOtp}
                >
                  Send 1-Minute OTP
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onVerifyOtpSubmit)} className="space-y-4">
                {/* 1-Minute Countdown Timer Banner */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <Timer className={cn('w-4 h-4', otpTimer < 15 ? 'text-rose-500 animate-spin' : 'text-emerald-500')} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      OTP Validity:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded font-bold',
                        otpTimer > 15
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse'
                      )}
                    >
                      {`00:${otpTimer.toString().padStart(2, '0')}`}
                    </span>

                    <button
                      type="button"
                      disabled={isTimerActive && otpTimer > 0}
                      onClick={handleResendOtp}
                      className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Resend
                    </button>
                  </div>
                </div>

                {/* 6-Digit OTP */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    6-Digit Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="123456"
                    className="w-full text-center tracking-[10px] font-mono text-xl font-bold py-2.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    {...register('otp')}
                  />
                  {errors.otp?.message && (
                    <p className="text-[11px] text-rose-500">{errors.otp.message}</p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Verifying this OTP logs you in directly. You can update your password anytime from your <strong>Profile &gt; Security</strong> settings.
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  isLoading={verifying}
                >
                  Verify OTP & Sign In
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 dark:border-dark-800 text-xs text-slate-600 dark:text-slate-400 pt-4">
            <Link to={ROUTES.LOGIN} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
