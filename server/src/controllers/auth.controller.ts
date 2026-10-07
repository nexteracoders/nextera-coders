import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUserDocument } from '../models/user.model';
import { Notification } from '../models/notification.model';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { config } from '../config/env';
import { logger } from '../utils/logger';

function sendAuthCookie(res: Response, user: IUserDocument): string {
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );

  const cookieOptions = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? ('none' as const) : ('lax' as const),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  res.cookie(config.cookieName, token, cookieOptions);
  return token;
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check if user with same email exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw ApiError.badRequest('An account with this email address already exists.', 'EMAIL_EXISTS');
    }

    // Always strictly set role to 'student'
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
    });

    await user.save();
    sendAuthCookie(res, user);

    // Trigger in-app welcome notification & welcome email
    Notification.create({
      userId: user._id,
      title: 'Welcome to NextEra Coders! 🚀',
      message: `Hello ${user.name}! Welcome to NextEra Coders. Explore 100+ Free Tutorials, Practice Problems, and Live Compilers to master tech skills!`,
      type: 'WELCOME',
      link: '/tutorials',
    }).catch((err) => logger.error(`[Notification Error] ${err.message}`));

    emailService.sendWelcomeLoginEmail({
      studentName: user.name,
      studentEmail: user.email,
      password: password,
      studentId: user._id.toString(),
      createdAt: user.createdAt,
      authProvider: 'password',
    }).catch((err) => logger.error(`[Welcome Email Error] ${err.message}`));

    // Notify Admins that a new student has registered
    notificationService.notifyAdmins({
      title: '🎓 New Student Registered!',
      message: `A new student has registered on NextEra Coders: ${user.name} (${user.email}).`,
      type: 'SYSTEM',
      link: '/admin/students',
      referenceType: 'STUDENT_REGISTRATION',
      referenceId: user._id.toString(),
    }).catch((err) => logger.error(`[Admin Notification Error] ${err.message}`));

    // By default, student follows NextEra Coders Administrator account
    try {
      const adminUser = await User.findOne({
        $or: [{ email: 'nexteracoders@gmail.com' }, { role: 'admin' }],
      }).sort({ role: 1 });
      if (adminUser && adminUser._id.toString() !== user._id.toString()) {
        await Promise.all([
          User.findByIdAndUpdate(user._id, { $addToSet: { following: adminUser._id } }),
          User.findByIdAndUpdate(adminUser._id, { $addToSet: { followers: user._id } }),
        ]);
        // Update local object so sanitized user reflects followingCount: 1
        user.following = [adminUser._id as any];
      }
    } catch (err: any) {
      logger.warn(`[Auto-Follow Admin] Notice: ${err.message}`);
    }

    ApiResponse.success(
      res,
      'Registration successful. Welcome to NextEra Coders!',
      { user: user.toSanitizedUser() },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Retrieve user including password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      throw ApiError.notFound(
        'Account not found with this email address. Please create a new account first.',
        'ACCOUNT_NOT_FOUND'
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized(
        'Incorrect password. Please enter the correct password or click "Forgot your password?" to reset it.',
        'WRONG_PASSWORD'
      );
    }

    sendAuthCookie(res, user);

    // If student, dispatch daily welcome in-app greeting notification asynchronously
    if (user.role === 'student') {
      Notification.create({
        userId: user._id,
        title: 'Welcome to NextEra Coders! 🚀',
        message: `Welcome back, ${user.name}! Your workspace is active. Ready to solve practice problems or continue tutorials?`,
        type: 'WELCOME',
        link: '/tutorials',
      }).catch((err) => logger.error(`[Notification Error] ${err.message}`));
    }

    ApiResponse.success(
      res,
      `Welcome back to NextEra Coders, ${user.name}!`,
      {
        user: user.toSanitizedUser(),
        welcomeMessage: `Welcome to NextEra Coders, ${user.name}! 🚀 Ready to code today?`,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

export const socialLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { provider = 'google', email, name, avatar, credential, code } = req.body;

    // Handle GitHub OAuth authorization code exchange
    if (provider === 'github' && code) {
      try {
        const githubClientId = process.env.GITHUB_CLIENT_ID || 'Iv23liVgPL4RNzMWQmNN';
        const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || '1ab0131cfa653320e392485a768da717384c1640';

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: githubClientId,
            client_secret: githubClientSecret,
            code,
          }),
        });

        const tokenData: any = await tokenRes.json();
        if (!tokenData.access_token) {
          throw new Error(tokenData.error_description || 'Failed to exchange authorization code with GitHub.');
        }

        const userRes = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'NextEra-Coders-Learning-App',
          },
        });

        const ghUser: any = await userRes.json();

        let ghEmail = ghUser.email;
        if (!ghEmail) {
          try {
            const emailsRes = await fetch('https://api.github.com/user/emails', {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'User-Agent': 'NextEra-Coders-Learning-App',
              },
            });
            const emails: any = await emailsRes.json();
            if (Array.isArray(emails)) {
              const primaryEmailObj =
                emails.find((e: any) => e.primary && e.verified) ||
                emails.find((e: any) => e.verified) ||
                emails[0];
              if (primaryEmailObj?.email) {
                ghEmail = primaryEmailObj.email;
              }
            }
          } catch (emailErr: any) {
            logger.warn(`[GitHub Email Fetch Warning]: ${emailErr.message}`);
          }
        }

        email = ghEmail || `${ghUser.login}@users.noreply.github.com`;
        name = ghUser.name || ghUser.login || 'GitHub Developer';
        avatar = ghUser.avatar_url || avatar;
        provider = 'github';
      } catch (ghErr: any) {
        logger.error(`[GitHub OAuth Error]: ${ghErr.message}`);
        throw ApiError.badRequest(ghErr.message || 'Could not authenticate with GitHub.', 'GITHUB_AUTH_FAILED');
      }
    }

    // Decode Google JWT ID token if provided by Google Identity Services (GSI)
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email) {
            email = payload.email;
            name = payload.name || name;
            avatar = payload.picture || avatar;
            provider = 'google';
          }
        }
      } catch (err: any) {
        logger.error(`[Google Token Decode Error]: ${err.message}`);
      }
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw ApiError.badRequest('A valid email address is required for social authentication.', 'EMAIL_REQUIRED');
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Create new student account automatically
      const generatedPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!';
      user = new User({
        name: name?.trim() || (provider === 'google' ? 'Google Developer' : 'GitHub Developer'),
        email: cleanEmail,
        password: generatedPassword,
        role: 'student',
        profileImage: avatar || '',
      });
      await user.save();

      // Send welcome in-app notification & welcome email
      Notification.create({
        userId: user._id,
        title: `Welcome to NextEra Coders via ${provider === 'google' ? 'Google' : 'GitHub'}! 🚀`,
        message: `Welcome ${user.name}! Your account has been connected with ${provider === 'google' ? 'Google' : 'GitHub'}. Explore free tutorials and compilers!`,
        type: 'WELCOME',
        link: '/tutorials',
      }).catch((err) => logger.error(`[Notification Error] ${err.message}`));

      emailService.sendWelcomeLoginEmail({
        studentName: user.name,
        studentEmail: user.email,
        studentId: user._id.toString(),
        createdAt: user.createdAt,
        authProvider: provider,
      }).catch((err) => logger.error(`[Welcome Email Error] ${err.message}`));

      // Notify Admins that a new student has registered via Google/GitHub
      notificationService.notifyAdmins({
        title: '🎓 New Student Registered!',
        message: `A new student has registered via ${provider === 'google' ? 'Google' : 'GitHub'}: ${user.name} (${user.email}).`,
        type: 'SYSTEM',
        link: '/admin/students',
        referenceType: 'STUDENT_REGISTRATION',
        referenceId: user._id.toString(),
      }).catch((err) => logger.error(`[Admin Notification Error] ${err.message}`));

      // By default, social login student follows NextEra Coders Administrator account
      try {
        const adminUser = await User.findOne({
          $or: [{ email: 'nexteracoders@gmail.com' }, { role: 'admin' }],
        }).sort({ role: 1 });
        if (adminUser && adminUser._id.toString() !== user._id.toString()) {
          await Promise.all([
            User.findByIdAndUpdate(user._id, { $addToSet: { following: adminUser._id } }),
            User.findByIdAndUpdate(adminUser._id, { $addToSet: { followers: user._id } }),
          ]);
          user.following = [adminUser._id as any];
        }
      } catch (err: any) {
        logger.warn(`[Auto-Follow Admin] Notice: ${err.message}`);
      }
    } else {
      // If user exists and social avatar was provided, sync real Google/GitHub profile picture
      if (avatar) {
        const shouldSyncAvatar =
          !user.profileImage ||
          user.profileImage === '/images/student_avatar.jpg' ||
          user.profileImage.includes('student_avatar') ||
          user.profileImage.includes('googleusercontent.com') ||
          user.profileImage.includes('avatars.githubusercontent.com');

        if (shouldSyncAvatar) {
          user.profileImage = avatar;
          await user.save();
        }
      }
    }

    sendAuthCookie(res, user);

    ApiResponse.success(
      res,
      `Successfully signed in with ${provider === 'google' ? 'Google' : 'GitHub'}!`,
      {
        user: user.toSanitizedUser(),
        welcomeMessage: `Welcome to NextEra Coders, ${user.name}! 🚀`,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? ('none' as const) : ('lax' as const),
    path: '/',
  });

  ApiResponse.success(res, 'Logged out successfully.', undefined, 200);
};

export const getMe = (req: Request, res: Response): void => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED');
  }

  ApiResponse.success(
    res,
    'Session verified.',
    { user: req.user.toSanitizedUser() },
    200
  );
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED');
    }

    const { currentPassword, newPassword } = req.body;

    // Fetch user with password field
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      throw ApiError.notFound('User account not found.', 'USER_NOT_FOUND');
    }

    if (currentPassword && typeof currentPassword === 'string' && currentPassword.trim()) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw ApiError.badRequest('Incorrect current password.', 'INVALID_CURRENT_PASSWORD');
      }
    }

    user.password = newPassword;
    if (user.role === 'sub_admin') {
      if (!user.subAdminCredential) {
        user.subAdminCredential = {
          appointedAt: new Date(),
          appointedBy: 'NextEra Coders Leadership',
          initialRoleSource: 'student',
        };
      }
      user.subAdminCredential.plainPassword = newPassword.trim();
      user.subAdminCredential.lastPasswordChangedAt = new Date();
    }
    await user.save();

    // Refresh auth cookie
    sendAuthCookie(res, user);

    ApiResponse.success(res, 'Password updated successfully.', undefined, 200);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (user) {
      // Generate 6-digit cryptographic numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

      // Set strictly 1-Minute expiry (60,000 ms)
      user.passwordResetOtp = hashedOtp;
      user.passwordResetOtpExpires = new Date(Date.now() + 60 * 1000); // 1 Minute
      await user.save();

      // Send OTP via Email
      await emailService.sendPasswordResetOtpEmail({
        studentName: user.name,
        studentEmail: user.email,
        otp,
        expiresMinutes: 1,
      });

      logger.info(`[FORGOT PASSWORD OTP] Email: ${user.email} | OTP: ${otp} (⏱️ Valid for 1 Minute / 60s)`);
    }

    ApiResponse.success(
      res,
      'A 6-digit verification code (OTP) has been sent to your email. It is valid for 1 minute.',
      {
        email: cleanEmail,
        expiresInSeconds: 60,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const hashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    const user = await User.findOne({
      email: cleanEmail,
    }).select('+passwordResetOtp +passwordResetOtpExpires');

    if (!user || !user.passwordResetOtp) {
      throw ApiError.badRequest('No active password reset request found for this email.', 'NO_RESET_REQUEST');
    }

    if (user.passwordResetOtpExpires && user.passwordResetOtpExpires < new Date()) {
      throw ApiError.badRequest('Verification code (OTP) has expired (1 minute limit). Please request a new OTP.', 'OTP_EXPIRED');
    }

    if (user.passwordResetOtp !== hashedOtp) {
      throw ApiError.badRequest('Invalid 6-digit verification code. Please check your email.', 'INVALID_OTP');
    }

    // Clear reset OTP fields
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    await user.save();

    // Authenticate user directly via cookie
    sendAuthCookie(res, user);

    ApiResponse.success(
      res,
      `Welcome back, ${user.name}! OTP verified successfully.`,
      {
        user: user.toSanitizedUser(),
        welcomeMessage: `Welcome back to NextEra Coders, ${user.name}! 🚀`,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp, token, newPassword } = req.body;

    let user;

    if (email && otp) {
      const cleanEmail = email.toLowerCase().trim();
      const hashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');

      user = await User.findOne({
        email: cleanEmail,
      }).select('+passwordResetOtp +passwordResetOtpExpires');

      if (!user || !user.passwordResetOtp) {
        throw ApiError.badRequest('No active password reset request found for this email.', 'NO_RESET_REQUEST');
      }

      if (user.passwordResetOtpExpires && user.passwordResetOtpExpires < new Date()) {
        throw ApiError.badRequest('Verification code (OTP) has expired (1 minute limit). Please request a new OTP.', 'OTP_EXPIRED');
      }

      if (user.passwordResetOtp !== hashedOtp) {
        throw ApiError.badRequest('Invalid 6-digit verification code. Please check your email.', 'INVALID_OTP');
      }

      user.password = newPassword;
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpires = undefined;
      await user.save();
    } else if (token) {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      });

      if (!user) {
        throw ApiError.badRequest('Password reset link is invalid or has expired.', 'INVALID_RESET_TOKEN');
      }

      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
    } else {
      throw ApiError.badRequest('Missing OTP or reset token.', 'MISSING_CREDENTIALS');
    }

    ApiResponse.success(
      res,
      'Password reset successful! You may now sign in with your new password.',
      undefined,
      200
    );
  } catch (error) {
    next(error);
  }
};
