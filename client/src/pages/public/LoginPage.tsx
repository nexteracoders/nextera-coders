import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { authService } from '../../services/auth.service';
import { signInWithGoogle } from '../../config/googleAuth';
import { signInWithGitHub } from '../../config/githubAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ROUTES } from '../../constants/routes';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  KeyRound,
  RotateCcw,
  BookOpen,
  Code2,
  Timer,
  UserCheck,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotOtpSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotOtpFormValues = z.infer<typeof forgotOtpSchema>;

const LOGIN_ORBIT_ITEMS = [
  {
    label: '⚔️ NEC Battle',
    color: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
  },
  {
    label: '🚀 100+ Tracks',
    color: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  },
  {
    label: '⚡ Live IDE',
    color: 'border-cyan-500/40 text-cyan-600 dark:text-cyan-400',
  },
  {
    label: '🏆 Rewards',
    color: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  },
  {
    label: '🧠 150 DSA',
    color: 'border-brand-500/40 text-brand-600 dark:text-brand-400',
  },
];

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot Password with 1-Minute OTP States
  const [forgotStep, setForgotStep] = useState<'email' | 'otp_reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpTimer, setOtpTimer] = useState(60); // 60 seconds (1 minute)
  const [isOtpTimerActive, setIsOtpTimerActive] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpResetting, setOtpResetting] = useState(false);
  const [forgotServerError, setForgotServerError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);

  const { login, socialLogin, verifyOtpLogin, isLoading, error, clearError } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const redirectParam = searchParams.get('redirect');
  const from = redirectParam || (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.DASHBOARD;

  // Login Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Forgot Form
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    setValue: setForgotValue,
    formState: { errors: forgotErrors },
    reset: resetForgotForm,
  } = useForm<ForgotOtpFormValues>({
    resolver: zodResolver(forgotOtpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  // 1-Minute OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (isOtpTimerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setIsOtpTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isOtpTimerActive, otpTimer]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      clearError();
      const user = await login(data);
      
      // Welcome message toast celebration
      if (user.role === 'admin') {
        success('Super-Admin Control Center Unlocked!', 'Welcome Administrator');
        navigate(ROUTES.ADMIN);
      } else {
        success(
          `Welcome to NextEra Coders, ${user.name}! 🚀 Your student workspace is ready.`,
          'Sign In Successful'
        );
        navigate(from);
      }
    } catch {
      // Error handled by redux slice state
    }
  };

  // Step 1: Send 1-Minute Expiring OTP to User's Email
  const handleSendOtp = async () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotServerError('Please enter a valid email address');
      return;
    }

    try {
      setOtpSending(true);
      setForgotServerError(null);
      setForgotValue('email', forgotEmail.trim());

      await authService.sendForgotOtp(forgotEmail.trim());
      
      setForgotStep('otp_reset');
      setOtpTimer(60); // 1 Minute
      setIsOtpTimerActive(true);
      success(
        `A 6-digit OTP has been sent to ${forgotEmail}. It is valid for exactly 1 minute (60s).`,
        'OTP Sent'
      );
    } catch (err: any) {
      setForgotServerError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (isOtpTimerActive && otpTimer > 0) return;
    await handleSendOtp();
  };

  // Step 2: Verify OTP & Direct Sign In
  const onForgotResetSubmit = async (data: ForgotOtpFormValues) => {
    if (otpTimer === 0 && !isOtpTimerActive) {
      setForgotServerError('Verification code (OTP) has expired (1 minute limit). Please click "Resend OTP".');
      return;
    }

    try {
      setOtpResetting(true);
      setForgotServerError(null);

      const user = await verifyOtpLogin({
        email: data.email,
        otp: data.otp,
      });

      success(`Welcome back, ${user.name}! Signed in successfully.`, 'Verification Successful');
      setShowForgotModal(false);
      resetForgotForm();
      setForgotStep('email');

      const targetRoute = user.role === 'admin' ? ROUTES.ADMIN : from;
      navigate(targetRoute, { replace: true });
    } catch (err: any) {
      setForgotServerError(err.message || 'Invalid or expired OTP. Please check your email.');
    } finally {
      setOtpResetting(false);
    }
  };

  // Google Cloud Console Real Google Sign In Handler
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      clearError();
      const googleUser = await signInWithGoogle();
      if (!googleUser || !googleUser.email) {
        throw new Error('Google authentication did not return a valid email.');
      }

      const user = await socialLogin({
        provider: 'google',
        email: googleUser.email,
        name: googleUser.name || 'Google Developer',
        avatar: googleUser.avatar || undefined,
      });

      if (user.role === 'admin') {
        success('Super-Admin Control Center Unlocked!', 'Welcome Administrator');
        navigate(ROUTES.ADMIN);
      } else {
        success(
          `Welcome to NextEra Coders, ${user.name}! 🚀 Signed in with Google.`,
          'Sign In Successful'
        );
        navigate(from);
      }
    } catch (err: any) {
      if (
        err.message?.includes('closed') ||
        err.message?.includes('cancelled') ||
        err.message?.includes('popup_closed')
      ) {
        // User closed popup intentionally
        return;
      }
      if (err.message?.includes('blocked') || err.message?.includes('popup_blocked')) {
        toastError('Please allow browser popups to sign in with Google.', 'Popup Blocked');
        return;
      }
      toastError(err.message || 'Could not complete Google Sign-In.', 'Google Sign-In Failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGitHubLoginWithCode = async (code: string) => {
    try {
      setIsGitHubLoading(true);
      clearError();
      const user = await socialLogin({
        provider: 'github',
        code,
      });

      if (user.role === 'admin') {
        success('Super-Admin Control Center Unlocked!', 'Welcome Administrator');
        navigate(ROUTES.ADMIN);
      } else {
        success(
          `Welcome to NextEra Coders, ${user.name}! 🚀 Signed in with GitHub.`,
          'Sign In Successful'
        );
        navigate(from);
      }
    } catch (err: any) {
      toastError(err.message || 'Could not complete GitHub Sign-In.', 'GitHub Sign-In Failed');
    } finally {
      setIsGitHubLoading(false);
    }
  };

  // Direct redirect fallback listener (if user redirected back directly to login)
  useEffect(() => {
    const githubCode = searchParams.get('github_code');
    if (githubCode) {
      handleGitHubLoginWithCode(githubCode);
    }
  }, [searchParams]);

  // GitHub Real OAuth Sign In Handler
  const handleGitHubSignIn = async () => {
    try {
      setIsGitHubLoading(true);
      clearError();
      const { code } = await signInWithGitHub();
      if (!code) {
        throw new Error('No authorization code returned from GitHub.');
      }
      await handleGitHubLoginWithCode(code);
    } catch (err: any) {
      if (
        err.message?.includes('closed') ||
        err.message?.includes('cancelled') ||
        err.message?.includes('popup_closed')
      ) {
        // User closed popup intentionally
        return;
      }
      if (err.message?.includes('blocked') || err.message?.includes('popup_blocked')) {
        toastError('Please allow browser popups to sign in with GitHub.', 'Popup Blocked');
        return;
      }
      toastError(err.message || 'Could not complete GitHub Sign-In.', 'GitHub Sign-In Failed');
    } finally {
      setIsGitHubLoading(false);
    }
  };

  const isAccountNotFoundError =
    error &&
    (error.toLowerCase().includes('account not found') ||
      error.toLowerCase().includes('not found') ||
      error.toLowerCase().includes('no account') ||
      error.toLowerCase().includes('create a new account') ||
      error.toLowerCase().includes('create an account'));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100">
      
      {/* Container Grid (Split screen layout matching CodeHelp/NextEra style) */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Login Authentication Form                                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto space-y-4">
          
          {/* Compact Header */}
          <div className="flex items-center gap-2.5">
            <Link to={ROUTES.HOME} className="w-[52px] h-8 rounded-lg overflow-hidden bg-slate-950 border border-brand-500/30 flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0" title="Home">
              <video
                src="/favicon-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Login
            </h1>
          </div>

          {/* Server Error / Account Not Found Alert */}
          {error && (
            <div
              className={cn(
                'p-3 rounded-xl border text-xs flex flex-col gap-2 shadow-sm',
                isAccountNotFoundError
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
              )}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="font-semibold">{error}</span>
              </div>

              {/* Direct Prompt to Create Account when Account is not in DB */}
              {isAccountNotFoundError && (
                <div className="pt-1.5 border-t border-amber-200/70 dark:border-amber-800/70 flex items-center justify-between">
                  <span className="text-[11px] text-amber-800 dark:text-amber-300">
                    Account not found.
                  </span>
                  <Link
                    to={ROUTES.REGISTER}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Create account →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="mail@example.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                error={errors.email?.message}
                {...register('email')}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pointer-events-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
                className="rounded-xl"
              />
              
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotServerError(null);
                  }}
                  className="text-xs text-brand-600 hover:text-brand-500 dark:text-brand-400 font-medium hover:underline cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            {/* Login Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base shadow-md shadow-brand-500/25 transition-all cursor-pointer h-11"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Login
            </Button>
          </form>

          {/* Social Logins Divider */}
          <div className="relative flex items-center justify-center my-2.5">
            <div className="border-t border-slate-200 dark:border-dark-800 w-full" />
            <span className="bg-slate-50 dark:bg-dark-950 px-3 text-xs text-slate-400 font-mono uppercase whitespace-nowrap">
              Or
            </span>
            <div className="border-t border-slate-200 dark:border-dark-800 w-full" />
          </div>

          {/* Social Sign-In Buttons (Google & GitHub OAuth) */}
          <div className="space-y-2">
            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isGitHubLoading || isLoading}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-semibold flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-sm cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <svg className="w-5 h-5 group-hover:scale-105 transition-transform shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
            </button>

            {/* GitHub Sign-In */}
            <button
              type="button"
              onClick={handleGitHubSignIn}
              disabled={isGoogleLoading || isGitHubLoading || isLoading}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-semibold flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-sm cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGitHubLoading ? (
                <div className="w-5 h-5 border-2 border-slate-700 dark:border-slate-200 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <svg className="w-5 h-5 fill-current group-hover:scale-105 transition-transform shrink-0" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              )}
              <span>{isGitHubLoading ? 'Connecting GitHub Account...' : 'Continue with GitHub'}</span>
            </button>
          </div>

          {/* New User Link */}
          <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-1">
            <span>New user?</span>{' '}
            <Link
              to={ROUTES.REGISTER}
              className="font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400 hover:underline cursor-pointer"
            >
              Create account
            </Link>
          </div>

          <p className="text-center text-[11px] text-slate-400 leading-tight">
            By continuing, you agree to our{' '}
            <Link to="/about" className="underline hover:text-slate-600 dark:hover:text-slate-300">
              Terms & Privacy
            </Link>
          </p>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Compact Ambient Showcase Card                                */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 xl:col-span-7 hidden lg:block">
          <div className="relative rounded-3xl bg-gradient-to-br from-white/90 via-slate-50/70 to-emerald-50/40 dark:from-dark-900/90 dark:via-dark-900/60 dark:to-dark-950/90 border border-slate-200/90 dark:border-dark-800 p-6 shadow-xl space-y-4 overflow-hidden">
            
            {/* Ambient Background Glow Orbs */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header Text */}
            <div className="text-center space-y-1 relative z-10">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                NextEra Coders
              </span>
              <h2 className="text-xl xl:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Empower Your Coding Journey
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Continue streaks, solve pattern-based DSA, and code in real-time.
              </p>
            </div>

            {/* Orbit Illustration */}
            <div className="relative py-4 flex items-center justify-center select-none overflow-visible translate-x-2 sm:translate-x-3">
              <div className="relative w-80 h-72 sm:h-80 flex items-center justify-center">
                {/* Ambient Glows and Orbital Dashed Rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/15 via-emerald-400/20 to-brand-500/15 animate-pulse blur-3xl pointer-events-none" />
                <div className="absolute w-[200px] h-[200px] rounded-full border border-dashed border-brand-500/20 dark:border-brand-500/30 animate-spin-slow pointer-events-none" />
                <div className="absolute w-[290px] h-[290px] rounded-full border border-dashed border-emerald-500/35 dark:border-emerald-500/45 pointer-events-none shadow-[0_0_18px_rgba(16,185,129,0.15)]" />

                {/* Central Floating NEC Diamond with Extra Large High-Res Favicon Video */}
                <div className="relative z-20 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-cyan-400 via-emerald-400 to-teal-300 shadow-2xl shadow-emerald-500/35 flex items-center justify-center animate-float-diamond hover:scale-110 active:scale-95 transition-transform duration-500 cursor-pointer border-2 border-white/70 group/center">
                  <div className="transform -rotate-45 group-hover/center:scale-110 transition-transform flex items-center justify-center">
                    <div className="w-[86px] h-[50px] sm:w-[98px] sm:h-[56px] rounded-xl overflow-hidden bg-slate-950 border border-brand-500/30 flex items-center justify-center shadow-xl shadow-slate-950/40 shrink-0">
                      <video
                        src="/favicon-video.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        disablePictureInPicture
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Revolving Orbit Ring Container (5 Elements - 100% Upright & Actively Revolving) */}
                <div className="absolute w-[290px] h-[290px] rounded-full animate-orbit-spin pointer-events-none z-30">
                  {LOGIN_ORBIT_ITEMS.map((item, idx) => {
                    const positionAngle = idx * (360 / LOGIN_ORBIT_ITEMS.length); // 0, 72, 144, 216, 288

                    return (
                      <div
                        key={item.label}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          transform: `rotate(${positionAngle}deg)`,
                        }}
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                          {/* Counter-spin cancels outer ring rotation */}
                          <div className="animate-orbit-counter">
                            {/* Counter-angle cancels initial position angle so text is 100% perfectly horizontal */}
                            <div
                              style={{
                                transform: `rotate(-${positionAngle}deg)`,
                              }}
                            >
                              <div
                                className={cn(
                                  'p-1.5 px-3 rounded-xl bg-white/95 dark:bg-dark-850/95 backdrop-blur-md border text-[11px] font-mono font-bold whitespace-nowrap shadow-md hover:scale-110 transition-transform duration-150 cursor-pointer',
                                  item.color
                                )}
                              >
                                {item.label}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Compact Feature Cards */}
            <div className="grid grid-cols-2 gap-2.5 relative z-10">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-800 flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">12 Core Tracks</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Tutorials & Quizzes</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-800 flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Cloud Compiler</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Python, Java, C++</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL: 1-Minute Expiring OTP                              */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            
            {/* Ambient Header Glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {forgotStep === 'email' ? 'Forgot Password' : 'Enter 6-Digit OTP'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {forgotStep === 'email'
                      ? 'We will send a 1-Minute secure OTP to your email.'
                      : `Code sent to ${forgotEmail}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotServerError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error Display */}
            {forgotServerError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotServerError}</span>
              </div>
            )}

            {/* STEP 1: Enter Email to Send 1-Minute OTP */}
            {forgotStep === 'email' && (
              <div className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                />

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Timer className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>
                    <strong>Strict 1-Minute Security Limit:</strong> The 6-digit OTP will strictly expire in 60 seconds.
                  </span>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSendOtp}
                  isLoading={otpSending}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Send 1-Minute OTP
                </Button>
              </div>
            )}

            {/* STEP 2: Enter 6-Digit OTP & Reset Password */}
            {forgotStep === 'otp_reset' && (
              <form onSubmit={handleForgotSubmit(onForgotResetSubmit)} className="space-y-4">
                
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
                      disabled={isOtpTimerActive && otpTimer > 0}
                      onClick={handleResendOtp}
                      className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Resend
                    </button>
                  </div>
                </div>

                {/* 6-Digit OTP Input */}
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
                    {...registerForgot('otp')}
                  />
                  {forgotErrors.otp?.message && (
                    <p className="text-[11px] text-rose-500">{forgotErrors.otp.message}</p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Verifying this OTP logs you in directly. You can update your password anytime in <strong>Profile &gt; Security</strong> settings.
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  isLoading={otpResetting}
                >
                  Verify OTP & Sign In
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
