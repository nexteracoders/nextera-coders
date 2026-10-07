import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { Mentor } from '../models/mentor.model';
import { auditLogService } from '../services/auditLog.service';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { generateSubAdminPassword, isSubAdminPasswordFormat } from '../utils/credentialGenerator';

const SUPER_ADMIN_EMAIL = 'nexteracoders@gmail.com';

// @desc    Get all Sub-Admins roster & Master Super Admin info
// @route   GET /api/admin/sub-admins
// @access  Protected (Super Admin Only)
export const getAdminSubAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const caller = req.user!;
    if (caller.role !== 'admin') {
      throw ApiError.forbidden('Only Master Platform Admin (nexteracoders@gmail.com) can access Sub-Admin management.', 'FORBIDDEN_OWNER_ONLY');
    }

    // 1. Fetch Master Super Admin
    let superAdminUser = await User.findOne({ email: SUPER_ADMIN_EMAIL.toLowerCase() });
    if (!superAdminUser) {
      superAdminUser = await User.findOne({ role: 'admin' });
    }

    // 2. Fetch all Sub-Admins
    const subAdmins = await User.find({ role: 'sub_admin' })
      .select('+password')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with clear details
    const formattedSubAdmins = subAdmins.map((u: any) => {
      let plain = u.subAdminCredential?.plainPassword;
      if (!plain || !isSubAdminPasswordFormat(plain)) {
        plain = generateSubAdminPassword();
        const salt = bcrypt.genSaltSync(12);
        const hashed = bcrypt.hashSync(plain, salt);
        User.findByIdAndUpdate(u._id, {
          $set: {
            password: hashed,
            'subAdminCredential.plainPassword': plain,
            'subAdminCredential.appointedAt': u.subAdminCredential?.appointedAt || u.createdAt || new Date(),
            'subAdminCredential.appointedBy': u.subAdminCredential?.appointedBy || 'NextEra Coders Leadership',
            'subAdminCredential.lastPasswordChangedAt': new Date(),
          },
        }).exec().catch(() => {});
      }

      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        profileImage: u.profileImage || '',
        college: u.college || '',
        bio: u.bio || '',
        skills: u.skills || [],
        isActive: u.isActive !== false,
        plainPassword: plain,
        appointedAt: u.subAdminCredential?.appointedAt || u.createdAt,
        appointedBy: u.subAdminCredential?.appointedBy || 'NextEra Coders Leadership',
        initialRoleSource: u.subAdminCredential?.initialRoleSource || 'student',
        lastPasswordChangedAt: u.subAdminCredential?.lastPasswordChangedAt,
        createdAt: u.createdAt,
        lastActivityDate: u.lastActivityDate,
      };
    });

    // 3. Fetch candidates from Mentors to ease promotion
    const mentors = await Mentor.find({ isPublished: true }).select('name role image exCompanies quoteTitle').lean();

    ApiResponse.success(
      res,
      'Sub-Admins retrieved successfully',
      {
        superAdmin: {
          name: superAdminUser?.name || 'NextEra Coders Leadership',
          email: superAdminUser?.email || SUPER_ADMIN_EMAIL,
          role: 'admin',
          isOwner: true,
          badge: 'Master Platform Owner & Super Admin',
          profileImage: superAdminUser?.profileImage || '',
        },
        subAdmins: formattedSubAdmins,
        totalCount: formattedSubAdmins.length,
        activeCount: formattedSubAdmins.filter((s) => s.isActive).length,
        availableMentors: mentors.map((m: any) => ({
          id: m._id.toString(),
          name: m.name,
          role: m.role,
          image: m.image,
          exCompanies: m.exCompanies,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Appoint or Promote a Student/Mentor to Sub-Admin
// @route   POST /api/admin/sub-admins
// @access  Protected (Super Admin Only)
export const appointSubAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const caller = req.user!;
    if (caller.role !== 'admin') {
      throw ApiError.forbidden('Only Master Platform Admin can appoint Sub-Admins.', 'FORBIDDEN_OWNER_ONLY');
    }

    const {
      email,
      name,
      password,
      college,
      bio,
      profileImage,
      source = 'student',
    } = req.body;

    if (!email || !email.trim()) {
      throw ApiError.badRequest('Sub-Admin email is required', 'EMAIL_REQUIRED');
    }

    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw ApiError.badRequest('The owner account nexteracoders@gmail.com is already Master Admin and cannot be a sub-admin.');
    }

    const hasExplicitPassword = Boolean(password && password.trim().length >= 6);
    let user = await User.findOne({ email: cleanEmail });
    let finalPlainPassword = '';

    if (user) {
      if (user.role === 'admin') {
        throw ApiError.badRequest('User is already Super Admin');
      }

      user.role = 'sub_admin';

      // Always ensure Sub-Admin password follows required NEC@...SubAdmin format
      if (hasExplicitPassword && isSubAdminPasswordFormat(password)) {
        finalPlainPassword = password.trim();
      } else {
        finalPlainPassword = generateSubAdminPassword();
      }

      // Assign plain password; UserSchema pre-save hook will hash it once with 12 salt rounds
      user.password = finalPlainPassword;

      if (name && name.trim()) user.name = name.trim();
      if (college !== undefined) user.college = college.trim();
      if (bio !== undefined) user.bio = bio.trim();
      if (profileImage !== undefined) user.profileImage = profileImage.trim();

      user.subAdminCredential = {
        plainPassword: finalPlainPassword,
        appointedAt: new Date(),
        appointedBy: caller.name || 'NextEra Coders Leadership',
        lastPasswordChangedAt: new Date(),
        initialRoleSource: source || 'student',
      };

      await user.save();
    } else {
      finalPlainPassword = (hasExplicitPassword && isSubAdminPasswordFormat(password))
        ? password.trim()
        : generateSubAdminPassword();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(finalPlainPassword, salt);

      user = await User.create({
        name: name?.trim() || 'Sub Admin',
        email: cleanEmail,
        password: hashedPassword,
        role: 'sub_admin',
        college: college?.trim() || 'NextEra Technical Delegate',
        bio: bio?.trim() || 'Official NextEra Coders Sub-Admin & Content Curator.',
        profileImage: profileImage?.trim() || '',
        subAdminCredential: {
          plainPassword: finalPlainPassword,
          appointedAt: new Date(),
          appointedBy: caller.name || 'NextEra Coders Leadership',
          lastPasswordChangedAt: new Date(),
          initialRoleSource: source || 'direct',
        },
      });
    }

    // Trigger Notification & Email with assigned password
    emailService
      .sendSubAdminAppointmentEmail({
        userName: user.name,
        userEmail: user.email,
        assignedPassword: finalPlainPassword,
        assignedByAdminName: caller.name || 'NextEra Coders (Platform Owner)',
      })
      .catch((err) => logger.error(`[Sub-Admin Email] ${err.message}`));

    notificationService
      .createNotification({
        userId: user._id.toString(),
        title: '🎉 Promoted to Sub-Admin (Content Delegate)!',
        message: `Welcome aboard ${user.name}! You now have Sub-Admin authority to create, manage, and moderate content, DSA problems, and community posts.`,
        type: 'ANNOUNCEMENT',
        link: '/admin/courses',
      })
      .catch(() => {});

    await auditLogService.recordLog({
      adminId: caller._id,
      action: 'UPDATE',
      resourceType: 'STUDENT',
      resourceId: user._id.toString(),
      resourceTitle: user.name,
      metadata: { action: 'APPOINT_SUB_ADMIN', email: user.email, source, passwordPreserved: !hasExplicitPassword },
    });

    ApiResponse.success(
      res,
      `Sub-Admin appointed successfully! User can login with their normal existing password.`,
      {
        subAdmin: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          college: user.college,
          bio: user.bio,
          plainPassword: finalPlainPassword,
          appointedAt: user.subAdminCredential?.appointedAt,
          appointedBy: user.subAdminCredential?.appointedBy,
          initialRoleSource: user.subAdminCredential?.initialRoleSource,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update Sub-Admin Password (Owner Master Control)
// @route   PUT /api/admin/sub-admins/:id/password
// @access  Protected (Super Admin Only)
export const updateSubAdminPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const caller = req.user!;
    if (caller.role !== 'admin') {
      throw ApiError.forbidden('Only Master Platform Admin can reset Sub-Admin passwords.', 'FORBIDDEN_OWNER_ONLY');
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters long', 'INVALID_PASSWORD_LENGTH');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid Sub-Admin user ID format');
    }

    const subAdmin = await User.findById(id);
    if (!subAdmin) {
      throw ApiError.notFound('Sub-Admin user not found');
    }

    if (subAdmin.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw ApiError.forbidden('Master Super Admin password cannot be altered through Sub-Admin portal.');
    }

    const trimmedPassword = newPassword.trim();
    // Assign plain password; UserSchema pre-save hook will hash it cleanly
    subAdmin.password = trimmedPassword;

    if (!subAdmin.subAdminCredential) {
      subAdmin.subAdminCredential = {
        appointedAt: subAdmin.createdAt,
        appointedBy: 'NextEra Coders',
      };
    }

    subAdmin.subAdminCredential.plainPassword = trimmedPassword;
    subAdmin.subAdminCredential.lastPasswordChangedAt = new Date();

    await subAdmin.save();

    await auditLogService.recordLog({
      adminId: caller._id,
      action: 'UPDATE',
      resourceType: 'STUDENT',
      resourceId: subAdmin._id.toString(),
      resourceTitle: subAdmin.name,
      metadata: { action: 'SUB_ADMIN_PASSWORD_RESET', email: subAdmin.email },
    });

    ApiResponse.success(
      res,
      `Password for ${subAdmin.name} (${subAdmin.email}) updated successfully!`,
      {
        subAdminId: subAdmin._id.toString(),
        plainPassword: trimmedPassword,
        lastPasswordChangedAt: subAdmin.subAdminCredential.lastPasswordChangedAt,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Demote a Sub-Admin back to Student
// @route   DELETE /api/admin/sub-admins/:id
// @access  Protected (Super Admin Only)
export const demoteSubAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const caller = req.user!;
    if (caller.role !== 'admin') {
      throw ApiError.forbidden('Only Master Platform Admin can revoke Sub-Admin access.', 'FORBIDDEN_OWNER_ONLY');
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid user ID format');
    }

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw ApiError.forbidden('Master Platform Owner cannot be demoted.');
    }

    user.role = 'student';
    user.subAdminCredential = undefined;
    await user.save();

    await auditLogService.recordLog({
      adminId: caller._id,
      action: 'UPDATE',
      resourceType: 'STUDENT',
      resourceId: user._id.toString(),
      resourceTitle: user.name,
      metadata: { action: 'REVOKE_SUB_ADMIN_ACCESS', email: user.email },
    });

    ApiResponse.success(
      res,
      `${user.name} has been revoked of Sub-Admin privileges and returned to Student role.`,
      { userId: user._id.toString(), role: user.role },
      200
    );
  } catch (error) {
    next(error);
  }
};
