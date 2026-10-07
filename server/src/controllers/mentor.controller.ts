import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Mentor } from '../models/mentor.model';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { AuditLog } from '../models/auditLog.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';
import { config } from '../config/env';

const DEFAULT_MENTORS = [
  {
    name: 'Sandip Kr Verma',
    role: 'Founder & Principal Engineering Mentor',
    exCompanies: ['NextEra Coders', 'Tech Forward'],
    image: '/images/sandip_verma.jpg',
    quoteTitle: 'Transforming Learners into Industry Leaders.',
    quoteBody:
      'From startups to tech giants, "We bridge the gap between learning and doing". Through real-world challenges, personalized mentorship, and a thriving community, we empower developers to ship products that matter. Excellence is the only standard.',
    signature: 'Sandip Kr Verma',
    experience: 'Tech Lead & Mentor',
    studentsMentored: '100k+ Learners',
    placements: '500+ Tier-1 Offers',
    rating: '4.98 / 5.0',
    email: 'sandip@nexteracoders.com',
    bio: 'Founder of NextEra Coders. Specializes in advanced Data Structures & Algorithms, High-Throughput Distributed Systems, and full-stack production architecture. Has mentored over 100,000 engineers to land top-tier tech roles.',
    skills: ['Data Structures & Algorithms', 'System Design', 'React & Node.js', 'Distributed Systems', 'TypeScript', 'Competitive Programming'],
    courses: ['Full Stack Web Development & System Design', 'Mastering Data Structures & Algorithms with Java & C++'],
    isPublished: true,
    order: 1,
  },
  {
    name: 'Naveen Kumar',
    role: 'Co-Founder & Technical Architect',
    exCompanies: ['NextEra Coders', 'Tech Forward'],
    image: '/images/naveen_kumar.jpg',
    quoteTitle: 'From Syntax Confusion to High-Scale Mastery.',
    quoteBody:
      'True engineering maturity comes from solving hard algorithmic problems and designing resilient distributed backends. We break down complex computer science concepts into clear, memorable mental models that last a lifetime.',
    signature: 'Naveen Kumar',
    experience: 'Systems Architect',
    studentsMentored: '80k+ Engineers',
    placements: 'Top Tech Offers',
    rating: '4.95 / 5.0',
    email: 'naveen@nexteracoders.com',
    bio: 'Co-Founder & Technical Architect at NextEra Coders. Expert in backend infrastructure, cloud-native deployments, low-level design patterns, and algorithmic problem-solving.',
    skills: ['Backend Architecture', 'Go & Python', 'Database Optimization', 'Kubernetes & Docker', 'DSA Patterns'],
    courses: ['High-Performance Backend Engineering', 'Algorithmic Problem Solving Bootcamp'],
    isPublished: true,
    order: 2,
  },
];

// Helper to format mentor payload
const formatMentorResponse = (m: any, currentUserId?: string) => {
  const followersList = m.followers || [];
  const followersCount = Array.isArray(followersList) ? followersList.length : 0;
  const isFollowing = currentUserId
    ? followersList.some((f: any) => (f._id ? f._id.toString() : f.toString()) === currentUserId)
    : false;

  return {
    id: m._id.toString(),
    name: m.name,
    role: m.role,
    exCompanies: m.exCompanies || [],
    image: m.image,
    quoteTitle: m.quoteTitle,
    quoteBody: m.quoteBody,
    signature: m.signature || m.name,
    experience: m.experience || '5+ Yrs',
    studentsMentored: m.studentsMentored || '100k+ Learners',
    placements: m.placements || 'Top Offers',
    rating: m.rating || '4.95 / 5.0',
    email: m.email || '',
    phone: m.phone || '',
    bio: m.bio || '',
    skills: m.skills || [],
    courses: m.courses || [],
    followersCount,
    isFollowing,
    socialLinks: m.socialLinks || {},
    isPublished: m.isPublished,
    order: m.order,
    userId: m.userId ? m.userId.toString() : undefined,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
};

// @desc    Get published mentors for public website
// @route   GET /api/mentors
// @access  Public
export const getPublicMentors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = (req as any).user?._id?.toString();

    // Clean up any dummy mentors that are not Sandip or Naveen
    await Mentor.deleteMany({
      name: { $nin: ['Sandip Kr Verma', 'Naveen Kumar'] },
    });

    let mentors = await Mentor.find({ isPublished: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Auto-seed default mentors if DB is empty
    if (mentors.length === 0) {
      const count = await Mentor.countDocuments();
      if (count === 0) {
        await Mentor.insertMany(DEFAULT_MENTORS);
        mentors = await Mentor.find({ isPublished: true })
          .sort({ order: 1, createdAt: 1 })
          .lean();
      }
    }

    ApiResponse.success(
      res,
      'Mentors retrieved successfully',
      {
        mentors: mentors.map((m) => formatMentorResponse(m, currentUserId)),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single mentor details (Public/Student view)
// @route   GET /api/mentors/:id
// @access  Public (Optional auth for isFollowing)
export const getMentorById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?._id?.toString();

    let mentor: any = null;
    if (Types.ObjectId.isValid(id)) {
      mentor = await Mentor.findById(id).lean();
    }

    if (!mentor) {
      // Try finding by name or order or slug
      mentor = await Mentor.findOne({
        $or: [
          { name: new RegExp(id.replace(/-/g, ' '), 'i') },
          { email: id.toLowerCase() },
        ],
      }).lean();
    }

    if (!mentor) {
      throw ApiError.notFound('Mentor not found');
    }

    // Fetch courses taught by this mentor
    let courses: any[] = [];
    try {
      courses = await Course.find({
        $or: [
          { 'instructor.name': new RegExp(mentor.name, 'i') },
          { title: { $in: mentor.courses || [] } },
        ],
        isPublished: true,
      })
        .select('title slug description thumbnail level category rating originalPrice proPrice freePrice isProAvailable')
        .limit(6)
        .lean();
      
      // If mentor has no linked courses in DB yet, fallback to featured courses
      if (courses.length === 0) {
        courses = await Course.find({ isPublished: true })
          .select('title slug description thumbnail level category rating originalPrice proPrice freePrice isProAvailable')
          .limit(3)
          .lean();
      }
    } catch {
      courses = [];
    }

    ApiResponse.success(
      res,
      'Mentor retrieved successfully',
      {
        mentor: formatMentorResponse(mentor, currentUserId),
        courses,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Follow or Unfollow a mentor
// @route   POST /api/mentors/:id/follow
// @access  Private (Authenticated User)
export const toggleFollowMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Please login to follow mentors');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid mentor ID');
    }

    const mentor = await Mentor.findById(id);
    if (!mentor) {
      throw ApiError.notFound('Mentor not found');
    }

    const currentUserId = user._id;
    const isAlreadyFollowing = (mentor.followers || []).some(
      (f: any) => f.toString() === currentUserId.toString()
    );

    let nextFollowState: boolean;
    if (isAlreadyFollowing) {
      // Unfollow
      mentor.followers = (mentor.followers || []).filter(
        (f: any) => f.toString() !== currentUserId.toString()
      );
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: mentor._id },
      });
      nextFollowState = false;
    } else {
      // Follow
      if (!mentor.followers) {
        mentor.followers = [];
      }
      mentor.followers.push(currentUserId as any);
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: mentor._id },
      });
      nextFollowState = true;
    }

    await mentor.save();

    const followersCount = mentor.followers.length;
    ApiResponse.success(
      res,
      nextFollowState ? `You are now following ${mentor.name}!` : `You have unfollowed ${mentor.name}.`,
      {
        isFollowing: nextFollowState,
        followersCount,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in mentor profile
// @route   GET /api/mentors/me
// @access  Private (Mentor / Admin)
export const getMentorMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    let mentor: any = null;
    if (user.mentorProfileId) {
      mentor = await Mentor.findById(user.mentorProfileId).lean();
    }

    if (!mentor) {
      mentor = await Mentor.findOne({
        $or: [{ userId: user._id }, { email: user.email.toLowerCase() }],
      }).lean();
    }

    // Auto-create or link if user is mentor and has no profile yet
    if (!mentor && (user.role === 'mentor' || user.role === 'admin')) {
      const created = await Mentor.create({
        name: user.name,
        role: 'Engineering Mentor & Instructor',
        email: user.email.toLowerCase(),
        phone: user.phone || '',
        bio: user.bio || 'Passionate engineering mentor at NextEra Coders.',
        skills: user.skills || ['Full Stack', 'DSA', 'System Design'],
        image: user.profileImage || '',
        quoteTitle: 'Empowering Next-Generation Coders',
        quoteBody: 'Mentoring engineers with structured, hands-on architectures and real-world thinking.',
        signature: user.name,
        userId: user._id,
        isPublished: true,
      });

      await User.findByIdAndUpdate(user._id, { mentorProfileId: created._id });
      mentor = created.toObject();
    }

    if (!mentor) {
      throw ApiError.notFound('Mentor profile not found');
    }

    ApiResponse.success(
      res,
      'Mentor profile retrieved',
      {
        mentor: formatMentorResponse(mentor, user._id.toString()),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged-in mentor profile
// @route   PUT /api/mentors/me
// @access  Private (Mentor / Admin)
export const updateMentorMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    let mentor = await Mentor.findOne({
      $or: [{ userId: user._id }, { _id: user.mentorProfileId }, { email: user.email.toLowerCase() }],
    });

    if (!mentor) {
      throw ApiError.notFound('Mentor profile not found');
    }

    const {
      name,
      role,
      bio,
      skills,
      phone,
      image,
      exCompanies,
      quoteTitle,
      quoteBody,
      signature,
      experience,
      socialLinks,
    } = req.body;

    if (name) mentor.name = name.trim();
    if (role) mentor.role = role.trim();
    if (bio !== undefined) mentor.bio = bio.trim();
    if (phone !== undefined) mentor.phone = phone.trim();
    if (image) mentor.image = image.trim();
    if (quoteTitle) mentor.quoteTitle = quoteTitle.trim();
    if (quoteBody) mentor.quoteBody = quoteBody.trim();
    if (signature) mentor.signature = signature.trim();
    if (experience) mentor.experience = experience.trim();
    if (socialLinks) mentor.socialLinks = { ...mentor.socialLinks, ...socialLinks };
    if (Array.isArray(skills)) {
      mentor.skills = skills.map((s: any) => String(s).trim()).filter(Boolean);
    }
    if (Array.isArray(exCompanies)) {
      mentor.exCompanies = exCompanies.map((c: any) => String(c).trim()).filter(Boolean);
    }

    await mentor.save();

    // Sync to linked User model
    await User.findByIdAndUpdate(user._id, {
      $set: {
        name: mentor.name,
        profileImage: mentor.image || user.profileImage,
        bio: mentor.bio,
        skills: mentor.skills,
        phone: mentor.phone,
      },
    });

    ApiResponse.success(
      res,
      'Mentor profile updated successfully',
      {
        mentor: formatMentorResponse(mentor, user._id.toString()),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Change password for logged-in mentor
// @route   PUT /api/mentors/me/password
// @access  Private (Mentor)
export const changeMentorPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Both current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw ApiError.badRequest('New password must be at least 8 characters long');
    }

    // Verify current password
    const userWithPw = await User.findById(user._id).select('+password');
    if (!userWithPw || !userWithPw.password) {
      throw ApiError.badRequest('Account has no password set. Please use forgot password.');
    }

    const isMatch = await bcrypt.compare(currentPassword, userWithPw.password);
    if (!isMatch) {
      throw ApiError.badRequest('Incorrect current password');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    userWithPw.password = hashedPassword;
    await userWithPw.save();

    // Also update mentor model password field if linked
    if (user.mentorProfileId) {
      await Mentor.findByIdAndUpdate(user.mentorProfileId, { password: hashedPassword });
    }

    ApiResponse.success(res, 'Password updated successfully', undefined, 200);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN CONTROLLER FUNCTIONS
// ==========================================

// @desc    Admin: Get all mentors
// @route   GET /api/admin/mentors
// @access  Private (Admin)
export const adminGetMentors = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Clean up any dummy mentors that are not Sandip or Naveen
    await Mentor.deleteMany({
      name: { $nin: ['Sandip Kr Verma', 'Naveen Kumar'] },
    });

    let mentors = await Mentor.find().sort({ order: 1, createdAt: 1 }).lean();

    if (mentors.length === 0) {
      const count = await Mentor.countDocuments();
      if (count === 0) {
        await Mentor.insertMany(DEFAULT_MENTORS);
        mentors = await Mentor.find().sort({ order: 1, createdAt: 1 }).lean();
      }
    }

    ApiResponse.success(
      res,
      'Admin mentors retrieved',
      {
        mentors: mentors.map((m) => formatMentorResponse(m)),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get single mentor dossier by ID
// @route   GET /api/admin/mentors/:id
// @access  Private (Admin)
export const adminGetMentorById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid mentor ID');
    }

    const mentor: any = await Mentor.findById(id).lean();
    if (!mentor) {
      throw ApiError.notFound('Mentor not found');
    }

    // Fetch recent followers
    let recentFollowers: any[] = [];
    if (mentor.followers && mentor.followers.length > 0) {
      recentFollowers = await User.find({ _id: { $in: mentor.followers } })
        .select('name email profileImage role college createdAt')
        .limit(20)
        .lean();
    }

    // Fetch linked user account
    let linkedUser: any = null;
    if (mentor.userId) {
      linkedUser = await User.findById(mentor.userId)
        .select('name email role isActive lastActivityDate createdAt')
        .lean();
    } else if (mentor.email) {
      linkedUser = await User.findOne({ email: mentor.email.toLowerCase() })
        .select('name email role isActive lastActivityDate createdAt')
        .lean();
    }

    // Fetch mentor's courses
    let courses: any[] = [];
    try {
      courses = await Course.find({
        $or: [
          { 'instructor.name': new RegExp(mentor.name, 'i') },
          { title: { $in: mentor.courses || [] } },
        ],
      })
        .select('title slug level category isPublished originalPrice proPrice')
        .lean();
    } catch {
      courses = [];
    }

    ApiResponse.success(
      res,
      'Mentor dossier retrieved',
      {
        mentor: formatMentorResponse(mentor),
        recentFollowers,
        linkedUser,
        courses,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create mentor
// @route   POST /api/admin/mentors
// @access  Private (Admin)
export const adminCreateMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      role,
      exCompanies,
      image,
      quoteTitle,
      quoteBody,
      signature,
      experience,
      studentsMentored,
      placements,
      rating,
      email,
      phone,
      bio,
      skills,
      courses,
      socialLinks,
      isPublished,
      order,
    } = req.body;

    if (!name || !role || !quoteTitle || !quoteBody) {
      throw ApiError.badRequest('Name, role, quote title, and quote body are required');
    }

    if (!email || !email.trim()) {
      throw ApiError.badRequest('Mentor email is required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw ApiError.badRequest('Please provide a valid mentor email address');
    }

    if (!phone || !phone.trim()) {
      throw ApiError.badRequest('Mentor phone number is required');
    }

    const rawPhone = phone.trim();
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    if (digits.length < 5) {
      throw ApiError.badRequest('Phone number must contain at least 5 digits to generate password');
    }

    const first5Digits = digits.slice(0, 5);
    const generatedPassword = `NEC@mentor${first5Digits}`;

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    const mentor = await Mentor.create({
      name: name.trim(),
      role: role.trim(),
      exCompanies: Array.isArray(exCompanies)
        ? exCompanies.filter((c: any) => typeof c === 'string' && c.trim()).map((c: string) => c.trim())
        : [],
      image: image?.trim() || '',
      quoteTitle: quoteTitle.trim(),
      quoteBody: quoteBody.trim(),
      signature: signature?.trim() || name.trim(),
      experience: experience?.trim() || '5+ Yrs',
      studentsMentored: studentsMentored?.trim() || '100k+ Learners',
      placements: placements?.trim() || 'Top Offers',
      rating: rating?.trim() || '4.95 / 5.0',
      email: cleanEmail,
      phone: rawPhone,
      bio: bio?.trim() || '',
      skills: Array.isArray(skills) ? skills.map((s: any) => String(s).trim()).filter(Boolean) : [],
      courses: Array.isArray(courses) ? courses.map((c: any) => String(c).trim()).filter(Boolean) : [],
      password: hashedPassword,
      socialLinks: socialLinks || {},
      isPublished: typeof isPublished === 'boolean' ? isPublished : true,
      order: typeof order === 'number' ? order : 0,
    });

    // Create or link User account with mentor role
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      user.role = 'mentor';
      user.phone = rawPhone;
      user.mentorProfileId = mentor._id;
      if (!user.name) user.name = mentor.name;
      if (mentor.image) user.profileImage = mentor.image;
      if (mentor.bio) user.bio = mentor.bio;
      if (mentor.skills?.length) user.skills = mentor.skills;
      user.password = generatedPassword; // Mongoose pre-save hook will hash with salt 12
      await user.save();
      mentor.userId = user._id;
      await mentor.save();
    } else {
      const newUser = await User.create({
        name: mentor.name,
        email: cleanEmail,
        phone: rawPhone,
        password: generatedPassword, // Mongoose pre-save hook will hash with salt 12
        role: 'mentor',
        profileImage: mentor.image || '',
        bio: mentor.bio || '',
        skills: mentor.skills || [],
        mentorProfileId: mentor._id,
      });
      mentor.userId = newUser._id;
      await mentor.save();
    }

    // Send Congratulatory Welcome Email with Credentials to the mentor
    const clientBaseUrl = process.env.CLIENT_URL || config.clientUrl || 'http://localhost:5173';
    try {
      await emailService.sendMentorWelcomeEmail({
        mentorName: mentor.name,
        mentorEmail: cleanEmail,
        mentorPhone: rawPhone,
        role: mentor.role,
        assignedPassword: generatedPassword,
        loginUrl: `${clientBaseUrl}/login`,
        profileUrl: `${clientBaseUrl}/mentors/${mentor._id}`,
        skills: mentor.skills,
        exCompanies: mentor.exCompanies,
        quoteTitle: mentor.quoteTitle,
      });
      logger.info(`[MENTOR WELCOME EMAIL] Sent to ${cleanEmail} with credentials (PW: ${generatedPassword})`);
    } catch (mailErr: any) {
      logger.error(`[MENTOR WELCOME EMAIL ERROR] Failed to send email to ${cleanEmail}: ${mailErr?.message || mailErr}`);
    }

    if (req.user) {
      await AuditLog.create({
        adminId: req.user._id,
        action: 'CREATE',
        resourceType: 'MENTOR',
        resourceId: mentor._id.toString(),
        resourceTitle: `${mentor.name} (${cleanEmail})`,
      });
    }

    ApiResponse.success(
      res,
      `Mentor created successfully! Auto-generated login password: ${generatedPassword}. Welcome email dispatched to ${cleanEmail}.`,
      {
        mentor: formatMentorResponse(mentor),
        credentials: {
          email: cleanEmail,
          phone: rawPhone,
          generatedPassword,
          loginUrl: `${clientBaseUrl}/login`,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update mentor
// @route   PUT /api/admin/mentors/:id
// @access  Private (Admin)
export const adminUpdateMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid mentor ID');
    }

    if (req.body.exCompanies && Array.isArray(req.body.exCompanies)) {
      req.body.exCompanies = req.body.exCompanies
        .filter((c: any) => typeof c === 'string' && c.trim())
        .map((c: string) => c.trim());
    }

    if (req.body.skills && Array.isArray(req.body.skills)) {
      req.body.skills = req.body.skills
        .filter((s: any) => typeof s === 'string' && s.trim())
        .map((s: string) => s.trim());
    }

    if (req.body.courses && Array.isArray(req.body.courses)) {
      req.body.courses = req.body.courses
        .filter((c: any) => typeof c === 'string' && c.trim())
        .map((c: string) => c.trim());
    }

    // Password handling
    if (req.body.password && req.body.password.trim()) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password.trim(), salt);
    } else {
      delete req.body.password;
    }

    const mentor = await Mentor.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!mentor) {
      throw ApiError.notFound('Mentor not found');
    }

    // Sync with linked User
    if (mentor.email) {
      const linkedUser = await User.findOne({
        $or: [{ _id: mentor.userId }, { email: mentor.email.toLowerCase() }],
      });

      if (linkedUser) {
        linkedUser.name = mentor.name;
        linkedUser.role = 'mentor';
        linkedUser.mentorProfileId = mentor._id;
        if (mentor.image) linkedUser.profileImage = mentor.image;
        if (mentor.bio) linkedUser.bio = mentor.bio;
        if (mentor.skills) linkedUser.skills = mentor.skills;
        if (mentor.phone) linkedUser.phone = mentor.phone;
        if (req.body.password) linkedUser.password = req.body.password;
        await linkedUser.save();
        if (!mentor.userId) {
          mentor.userId = linkedUser._id;
          await mentor.save();
        }
      }
    }

    if (req.user) {
      const action = req.body.isPublished !== undefined ? (req.body.isPublished ? 'PUBLISH' : 'UNPUBLISH') : 'UPDATE';
      await AuditLog.create({
        adminId: req.user._id,
        action,
        resourceType: 'MENTOR',
        resourceId: mentor._id.toString(),
        resourceTitle: mentor.name,
      });
    }

    ApiResponse.success(res, 'Mentor updated successfully', { mentor: formatMentorResponse(mentor) }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Reset mentor password
// @route   POST /api/admin/mentors/:id/password
// @access  Private (Admin)
export const adminResetMentorPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid mentor ID');
    }

    if (!password || password.trim().length < 8) {
      throw ApiError.badRequest('Password must be at least 8 characters long');
    }

    const mentor = await Mentor.findById(id);
    if (!mentor) {
      throw ApiError.notFound('Mentor not found');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    mentor.password = hashedPassword;
    await mentor.save();

    // Also update linked user password bypassing double-hashing
    if (mentor.userId || mentor.email) {
      await User.updateOne(
        { $or: [{ _id: mentor.userId }, { email: mentor.email?.toLowerCase() }] },
        { $set: { password: hashedPassword } }
      );
    }

    if (req.user) {
      await AuditLog.create({
        adminId: req.user._id,
        action: 'UPDATE',
        resourceType: 'MENTOR',
        resourceId: mentor._id.toString(),
        resourceTitle: `${mentor.name} (Password Reset)`,
      });
    }

    ApiResponse.success(res, 'Mentor password updated successfully', undefined, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete mentor
// @route   DELETE /api/admin/mentors/:id
// @access  Private (Admin)
export const adminDeleteMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid mentor ID');
    }

    const mentor = await Mentor.findByIdAndDelete(id);

    if (!mentor) {
      throw ApiError.notFound('Mentor not found');
    }

    if (req.user) {
      await AuditLog.create({
        adminId: req.user._id,
        action: 'DELETE',
        resourceType: 'MENTOR',
        resourceId: mentor._id.toString(),
        resourceTitle: mentor.name,
      });
    }

    ApiResponse.success(res, 'Mentor deleted successfully', undefined, 200);
  } catch (error) {
    next(error);
  }
};
