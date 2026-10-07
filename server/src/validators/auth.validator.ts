import { z } from 'zod';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~])/;
export const PASSWORD_ERROR_MSG =
  'Password must be at least 8 characters and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol (@, #, $, %, etc.)';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address')
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(PASSWORD_REGEX, PASSWORD_ERROR_MSG),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address')
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters')
      .regex(PASSWORD_REGEX, PASSWORD_ERROR_MSG),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address')
      .toLowerCase(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address')
      .toLowerCase(),
    otp: z
      .string({ required_error: '6-digit OTP is required' })
      .trim()
      .length(6, 'OTP must be exactly 6 digits'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address').toLowerCase().optional(),
    otp: z.string().trim().length(6, 'OTP must be 6 digits').optional(),
    token: z.string().trim().optional(),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters')
      .regex(PASSWORD_REGEX, PASSWORD_ERROR_MSG),
  }).refine((data) => (data.email && data.otp) || data.token, {
    message: 'Either email and 6-digit OTP or reset token must be provided',
    path: ['otp'],
  }),
});
