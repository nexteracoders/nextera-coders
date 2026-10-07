import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { ROUTES } from '../../constants/routes';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must include uppercase, lowercase, and numbers'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { success } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormValues) => {
    if (!token) {
      setServerError('Reset token is missing or invalid.');
      return;
    }

    try {
      setLoading(true);
      setServerError(null);
      await authService.resetPassword({
        token,
        newPassword: data.password,
      });
      setIsSuccess(true);
      success('Password reset successfully. Please sign in.', 'Success');
    } catch (err: any) {
      setServerError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 px-4 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md space-y-6">
        <Card variant="elevated" className="border-slate-200 dark:border-dark-800 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Create a new secure password for your NextEra Coders account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {serverError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {isSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Password Updated
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Your password has been changed successfully.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full mt-2"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  Proceed to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pointer-events-auto text-slate-400 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="pointer-events-auto text-slate-400 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={loading}>
                  Reset Password
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 dark:border-dark-800 text-xs text-slate-600 dark:text-slate-400 pt-4">
            <Link to={ROUTES.LOGIN} className="text-brand-600 hover:underline font-semibold">
              Return to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
