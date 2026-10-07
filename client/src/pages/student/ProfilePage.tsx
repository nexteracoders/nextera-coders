import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MentorSelfProfileView } from '../../components/profile/MentorSelfProfileView';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { authService } from '../../services/auth.service';
import { paymentService, PaymentRequestItem } from '../../services/payment.service';
import { learningService } from '../../services/learning.service';
import { IEnrolledCourseCard } from '../../types/learning.types';
import { ROUTES } from '../../constants/routes';
import { MembershipBadge } from '../../components/common/MembershipBadge';
import { sundayContestService } from '../../services/contest.service';
import { coinService } from '../../services/coin.service';
import { postService } from '../../services/post.service';
import { PostItem } from '../../types/post.types';
import {
  Lock,
  MessageSquare,
  ExternalLink,
  Star,
  Trash2,
  Plus,
  Github,
  Linkedin,
  AlertCircle,
  Eye,
  EyeOff,
  Crown,
  ArrowRight,
  BookOpen,
  Receipt,
  Camera,
  Trophy,
  Flame,
  Award,
  Calendar,
  ChevronRight,
  GraduationCap,
  Edit3,
  Settings as SettingsIcon,
  FileCode,
  ShieldCheck,
  Zap,
  Sparkles,
  Check,
  FileText,
  UserPlus,
  UserCheck,
  Users,
  HelpCircle,
  Upload,
  Repeat,
  ShieldAlert,
  Terminal,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ActivityHeatmap } from '../../components/profile/ActivityHeatmap';

// Profile form validation schema
const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  college: z.string().max(120, 'College name too long').optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  skills: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  profileImage: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Password form validation schema (Direct password update for authenticated users)
const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and numbers'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

// Fast client-side image compression for device photo uploads
const compressImageFile = (file: File, maxDim = 800, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to parse image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};


const getInitials = (name?: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser, updateProfile, changePassword, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Determine if viewing own profile or someone else's public profile
  const isSelf = !userId || userId === 'me' || (currentUser && currentUser.id === userId);

  // If mentor viewing their own profile, render dedicated MentorSelfProfileView
  if (isSelf && (currentUser?.role === 'mentor' || (currentUser as any)?.mentorProfileId)) {
    return <MentorSelfProfileView />;
  }

  // Displayed profile user data
  const [profileUser, setProfileUser] = useState<any>(currentUser || null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState<'coding' | 'overview' | 'edit' | 'plans' | 'security' | 'posts' | 'subadmin'>('coding');
  
  // Student Posts & Reviews State
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  const [loadingUserPosts, setLoadingUserPosts] = useState(false);

  // Problems difficulty filter (controlled by dropdown or clicking donut/legend)
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  // Interactive loading animation for Donut Chart on page load / tab switch
  const [isDonutLoaded, setIsDonutLoaded] = useState(false);
  const [animatedSolvedCount, setAnimatedSolvedCount] = useState(0);

  useEffect(() => {
    setIsDonutLoaded(false);
    setAnimatedSolvedCount(0);
    const timer = setTimeout(() => {
      setIsDonutLoaded(true);
    }, 280);
    return () => clearTimeout(timer);
  }, [activeTab]);
  
  // Modals & Dual Photo 3D Flip state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [modalPhoto1, setModalPhoto1] = useState<string>('');
  const [modalPhoto2, setModalPhoto2] = useState<string>('');
  const [modalAutoFlip, setModalAutoFlip] = useState<boolean>(false);
  const [isAvatarFlipped, setIsAvatarFlipped] = useState(false);
  const [previewFlipped, setPreviewFlipped] = useState(false);

  // Interactive Explanatory Modals
  const [isScoreFormulaModalOpen, setIsScoreFormulaModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardCollege, setLeaderboardCollege] = useState('');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Followers & Following Modals
  const [socialModalType, setSocialModalType] = useState<'followers' | 'following' | null>(null);
  const [socialUsersList, setSocialUsersList] = useState<any[]>([]);
  const [loadingSocialList, setLoadingSocialList] = useState(false);

  // Security Form States
  const [showCurrentSubAdminPw, setShowCurrentSubAdminPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Data fetching states
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestItem[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<IEnrolledCourseCard[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Live Connected Coin Wallet for Real Balance & Click Redirect
  const [userWallet, setUserWallet] = useState(() => coinService.getState());
  useEffect(() => {
    const unsub = coinService.subscribe(setUserWallet);
    return () => unsub();
  }, []);

  // Live Connected Coding Profile Data
  const [codingStats, setCodingStats] = useState({
    codingScore: 0,
    totalProblemsSolved: 0,
    difficultyBreakdown: { school: 0, basic: 0, easy: 0, medium: 0, hard: 0 },
    necDailyStreak: 0,
    longestNecStreak: 0,
    necProblemsSolved: 0,
    instituteRank: 1,
    articlesPublished: 0,
    totalSubmissionsInYear: 0,
    submissionDateMap: {} as Record<string, number>,
    recentSolvedProblems: [] as any[],
  });

  // Load Profile and Coding Data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const targetId = userId && userId !== 'me' ? userId : 'me';

        // 1. If viewing another student, fetch public profile
        if (!isSelf && userId) {
          try {
            const res = await authService.getPublicProfile(targetId);
            if (res?.user) {
              setProfileUser(res.user);
              setIsFollowing(Boolean(res.user.isFollowing));
            }
            if (res?.codingStats) {
              setCodingStats({
                codingScore: res.codingStats.codingScore ?? 0,
                totalProblemsSolved: res.codingStats.totalProblemsSolved ?? 0,
                difficultyBreakdown: res.codingStats.difficultyBreakdown || { school: 0, basic: 0, easy: 0, medium: 0, hard: 0 },
                necDailyStreak: res.codingStats.necDailyStreak ?? 0,
                longestNecStreak: res.codingStats.longestNecStreak ?? 0,
                necProblemsSolved: res.codingStats.necProblemsSolved ?? 0,
                instituteRank: res.codingStats.instituteRank ?? 1,
                articlesPublished: res.codingStats.articlesPublished ?? 0,
                totalSubmissionsInYear: res.codingStats.totalSubmissionsInYear ?? 0,
                submissionDateMap: res.codingStats.submissionDateMap || {},
                recentSolvedProblems: Array.isArray(res.codingStats.recentSolvedProblems) ? res.codingStats.recentSolvedProblems : [],
              });
            }
            return;
          } catch (apiErr) {
            console.warn('Public profile API call failed, attempting contest coder fallback:', apiErr);
            const coder = sundayContestService.getCoderProfile(targetId);
            if (coder) {
              const savedFollowing = JSON.parse(localStorage.getItem(`nextera:following:${coder.userId}`) || 'false');
              const easyCount = coder.totalSolved?.easy || 0;
              const medCount = coder.totalSolved?.medium || 0;
              const hardCount = coder.totalSolved?.hard || 0;
              const totalSolved = easyCount + medCount + hardCount;
              setProfileUser({
                id: coder.userId,
                name: coder.name,
                email: `${coder.username}@nextera.edu`,
                profileImage: coder.avatar,
                college: coder.college,
                bio: coder.bio,
                skills: coder.skills?.join(', ') || '',
                github: coder.github,
                linkedin: coder.linkedin,
                role: 'STUDENT',
                isPro: false,
                followersCount: savedFollowing ? 1 : 0,
                followingCount: 0,
                isFollowing: savedFollowing,
                isSelf: false,
              });
              setIsFollowing(savedFollowing);
              setCodingStats({
                codingScore: coder.globalRating || 0,
                totalProblemsSolved: totalSolved,
                difficultyBreakdown: { school: 0, basic: 0, easy: easyCount, medium: medCount, hard: hardCount },
                necDailyStreak: coder.streak || 0,
                longestNecStreak: coder.streak || 0,
                necProblemsSolved: totalSolved,
                instituteRank: coder.rank || 1,
                articlesPublished: 0,
                totalSubmissionsInYear: totalSolved,
                submissionDateMap: {},
                recentSolvedProblems: [],
              });
              return;
            }
          }
        }

        // 2. If viewing own profile, use currentUser and fetch coding profile
        setProfileUser(currentUser);
        const stats = await authService.getCodingProfile();
        if (stats) {
          setCodingStats({
            codingScore: typeof stats.codingScore === 'number' ? stats.codingScore : (currentUser?.points || 0),
            totalProblemsSolved: typeof stats.totalProblemsSolved === 'number' ? stats.totalProblemsSolved : 0,
            difficultyBreakdown: stats.difficultyBreakdown || { school: 0, basic: 0, easy: 0, medium: 0, hard: 0 },
            necDailyStreak: typeof stats.necDailyStreak === 'number' ? stats.necDailyStreak : (currentUser?.learningStreak || 0),
            longestNecStreak: typeof stats.longestNecStreak === 'number' ? stats.longestNecStreak : (currentUser?.longestStreak || 0),
            necProblemsSolved: typeof stats.necProblemsSolved === 'number' ? stats.necProblemsSolved : 0,
            instituteRank: typeof stats.instituteRank === 'number' ? stats.instituteRank : 1,
            articlesPublished: typeof stats.articlesPublished === 'number' ? stats.articlesPublished : 0,
            totalSubmissionsInYear: typeof stats.totalSubmissionsInYear === 'number' ? stats.totalSubmissionsInYear : 0,
            submissionDateMap: stats.submissionDateMap || {},
            recentSolvedProblems: Array.isArray(stats.recentSolvedProblems) ? stats.recentSolvedProblems : [],
          });
        }
      } catch {
        if (currentUser) {
          setProfileUser(currentUser);
          setCodingStats((prev) => ({
            ...prev,
            codingScore: currentUser.points || 0,
            necDailyStreak: currentUser.learningStreak || 0,
            longestNecStreak: currentUser.longestStreak || 0,
          }));
        }
      }

      // 3. Fetch Payment Orders (Own profile only)
      if (isSelf) {
        try {
          setLoadingPayments(true);
          const reqs = await paymentService.getMyPaymentRequests();
          setPaymentRequests(reqs);
        } catch {
          // non-fatal
        } finally {
          setLoadingPayments(false);
        }

        // 4. Fetch Enrolled Courses
        try {
          setLoadingCourses(true);
          const res = await learningService.getMyEnrollments({ status: 'all', limit: 12 });
          setEnrolledCourses(res.enrollments);
        } catch {
          // non-fatal
        } finally {
          setLoadingCourses(false);
        }
      }
    };

    loadProfileData();
  }, [userId, isSelf, currentUser]);

  // Fetch posts published by this profile student
  const fetchUserPosts = useCallback(async () => {
    const targetUserId = profileUser?.id || profileUser?._id || currentUser?._id;
    if (!targetUserId) return;
    try {
      setLoadingUserPosts(true);
      const res = await postService.getPosts({ authorId: targetUserId });
      setUserPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to load user posts:', err);
    } finally {
      setLoadingUserPosts(false);
    }
  }, [profileUser?.id, profileUser?._id, currentUser?._id]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchUserPosts();
    }
  }, [activeTab, fetchUserPosts]);

  const handleDeleteUserPost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postService.deletePost(postId);
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));
      success('Post removed');
    } catch (err) {
      console.error('Failed to delete post:', err);
      toastError('Failed to delete post');
    }
  };

  // Helper to safely format skills array or string
  const formatSkillsToString = (skillsInput: any): string => {
    if (Array.isArray(skillsInput)) return skillsInput.join(', ');
    if (typeof skillsInput === 'string' && skillsInput.trim()) return skillsInput;
    return 'C++, Python, JavaScript, React, Node.js, DSA';
  };

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || 'Sandip Kumar Verma',
      college: currentUser?.college || 'Ramgarh Engineering College',
      bio: currentUser?.bio || 'Aspiring Software Engineer & Problem Solver mastering DSA, Full-Stack and System Design on NextEra Coders.',
      skills: formatSkillsToString(currentUser?.skills),
      github: currentUser?.github || 'https://github.com',
      linkedin: currentUser?.linkedin || 'https://linkedin.com',
      profileImage: currentUser?.profileImage && currentUser.profileImage !== '/images/student_avatar.jpg' ? currentUser.profileImage : '',
    },
  });

  useEffect(() => {
    if (currentUser && isSelf) {
      setProfileValue('name', currentUser.name || '');
      setProfileValue('college', currentUser.college || 'Ramgarh Engineering College');
      setProfileValue('bio', currentUser.bio || '');
      setProfileValue('skills', formatSkillsToString(currentUser.skills));
      setProfileValue('github', currentUser.github || '');
      setProfileValue('linkedin', currentUser.linkedin || '');
      setProfileValue('profileImage', currentUser.profileImage && currentUser.profileImage !== '/images/student_avatar.jpg' ? currentUser.profileImage : '');
    }
  }, [currentUser, isSelf, setProfileValue]);

  const {
    register: registerPw,
    handleSubmit: handlePwSubmit,
    reset: resetPwForm,
    formState: { errors: pwErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  // Follow / Unfollow Action
  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toastError('Please log in to follow students.', 'Login Required');
      navigate(ROUTES.LOGIN);
      return;
    }
    if (!profileUser?.id) return;
    try {
      setFollowLoading(true);
      const res = await authService.toggleFollowUser(profileUser.id);
      setIsFollowing(res.isFollowing);
      setProfileUser((prev: any) => ({
        ...prev,
        followersCount: res.followersCount,
      }));
      localStorage.setItem(`nextera:following:${profileUser.id}`, JSON.stringify(res.isFollowing));
      success(res.isFollowing ? `You are now following ${profileUser.name}!` : `Unfollowed ${profileUser.name}.`);
    } catch {
      // Local fallback for smooth follow/unfollow toggle
      const nextFollowState = !isFollowing;
      setIsFollowing(nextFollowState);
      localStorage.setItem(`nextera:following:${profileUser.id}`, JSON.stringify(nextFollowState));
      setProfileUser((prev: any) => ({
        ...prev,
        followersCount: Math.max(0, (prev?.followersCount || 100) + (nextFollowState ? 1 : -1)),
        isFollowing: nextFollowState,
      }));
      success(nextFollowState ? `You are now following ${profileUser.name}!` : `Unfollowed ${profileUser.name}.`);
    } finally {
      setFollowLoading(false);
    }
  };

  // Open Followers or Following List Modal
  const handleOpenSocialModal = async (type: 'followers' | 'following') => {
    const targetId = isSelf ? 'me' : profileUser?.id;
    if (!targetId) return;
    try {
      setSocialModalType(type);
      setLoadingSocialList(true);
      if (type === 'followers') {
        const res = await authService.getUserFollowers(targetId);
        setSocialUsersList(res.followers || []);
      } else {
        const res = await authService.getUserFollowing(targetId);
        setSocialUsersList(res.following || []);
      }
    } catch {
      // Fallback mock students list from contest leaderboard
      const lb = sundayContestService.getConfig().leaderboard || [];
      const fallbackList = lb
        .filter((c) => c.userId !== targetId)
        .slice(0, 5)
        .map((c) => ({
          id: c.userId,
          name: c.name,
          email: `${c.username}@nextera.edu`,
          profileImage: c.avatar,
          college: c.college,
          points: c.globalRating,
          role: 'STUDENT',
          isPro: true,
        }));
      setSocialUsersList(fallbackList);
    } finally {
      setLoadingSocialList(false);
    }
  };

  // Open Institute Leaderboard Modal
  const handleOpenInstituteLeaderboard = async () => {
    try {
      setIsLeaderboardModalOpen(true);
      setLoadingLeaderboard(true);
      const res = await authService.getInstituteLeaderboard();
      setLeaderboardCollege(res.collegeName || profileUser?.college || 'Institute');
      setLeaderboardData(res.leaderboard || []);
    } catch {
      setLeaderboardData([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Active Dual Photos for the profile card
  const userPhoto1 = useMemo(() => {
    const p1 = profileUser?.profileImages?.[0] || profileUser?.profileImage;
    return p1 && p1.trim() !== '' && p1 !== '/images/student_avatar.jpg' ? p1 : '';
  }, [profileUser]);

  const userPhoto2 = useMemo(() => {
    const p2 = profileUser?.profileImages?.[1];
    return p2 && p2.trim() !== '' && p2 !== '/images/student_avatar.jpg' ? p2 : '';
  }, [profileUser]);

  const canFlip = Boolean(userPhoto1 && userPhoto2);
  const isAutoFlipActive = Boolean(profileUser?.autoFlipAvatar && canFlip);

  // Profile avatar 3D rotation interval (when active)
  useEffect(() => {
    if (!isAutoFlipActive) {
      setIsAvatarFlipped(false);
      return;
    }
    const interval = setInterval(() => {
      setIsAvatarFlipped((prev) => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, [isAutoFlipActive]);

  // Modal preview 3D flip interval
  useEffect(() => {
    if (!modalAutoFlip || !modalPhoto1 || !modalPhoto2) {
      setPreviewFlipped(false);
      return;
    }
    const interval = setInterval(() => {
      setPreviewFlipped((prev) => !prev);
    }, 2800);
    return () => clearInterval(interval);
  }, [modalAutoFlip, modalPhoto1, modalPhoto2]);

  const openAvatarModal = () => {
    setModalPhoto1(userPhoto1);
    setModalPhoto2(userPhoto2);
    setModalAutoFlip(Boolean(profileUser?.autoFlipAvatar));
    setIsAvatarModalOpen(true);
  };

  const handleFileUpload = async (slot: 1 | 2, file: File) => {
    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }
    try {
      const compressed = await compressImageFile(file, 800, 0.85);
      if (slot === 1) {
        setModalPhoto1(compressed);
      } else {
        setModalPhoto2(compressed);
        setModalAutoFlip(true);
      }
      success(`Photo ${slot} uploaded from device!`);
    } catch (err: any) {
      toastError(err.message || 'Failed to process image file');
    }
  };

  const handleMultiFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 2);
    if (list.length === 0) {
      toastError('Please select image files (PNG, JPG, WebP)');
      return;
    }
    try {
      if (list[0]) {
        const p1 = await compressImageFile(list[0], 800, 0.85);
        setModalPhoto1(p1);
      }
      if (list[1]) {
        const p2 = await compressImageFile(list[1], 800, 0.85);
        setModalPhoto2(p2);
        setModalAutoFlip(true);
      }
      success(`${list.length} photo(s) uploaded successfully!`);
    } catch (err: any) {
      toastError('Failed to process image files');
    }
  };

  const handleSavePhotos = async () => {
    try {
      setSavingAvatar(true);
      const photos = [modalPhoto1, modalPhoto2].filter(Boolean);
      const primary = photos[0] || '';
      const autoFlip = Boolean(modalAutoFlip && photos.length >= 2);

      await updateProfile({
        profileImage: primary,
        profileImages: photos,
        autoFlipAvatar: autoFlip,
      });

      setProfileUser((prev: any) => ({
        ...prev,
        profileImage: primary,
        profileImages: photos,
        autoFlipAvatar: autoFlip,
      }));

      setProfileValue('profileImage', primary);

      success(
        autoFlip
          ? 'Dual photos saved with 3D Flip Sync active! Your profile photo will now flip dynamically.'
          : 'Profile photo updated successfully!',
        'Photos Saved'
      );
      setIsAvatarModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to save photos');
    } finally {
      setSavingAvatar(false);
    }
  };

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      const skillsArray = data.skills
        ? data.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      await updateProfile({
        name: data.name,
        college: data.college,
        bio: data.bio,
        skills: skillsArray,
        github: data.github,
        linkedin: data.linkedin,
        profileImage: data.profileImage,
      });

      success('Profile details updated successfully!', 'Profile Saved');
      setActiveTab('coding');
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile');
    }
  };



  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      setPwSubmitting(true);
      setPwError(null);
      await changePassword({
        newPassword: data.newPassword,
      });
      success('Password updated successfully!', 'Security Updated');
      resetPwForm();
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password');
    } finally {
      setPwSubmitting(false);
    }
  };

  const isProMember = Boolean(
    profileUser &&
    profileUser.isPro &&
    profileUser.subscription?.plan &&
    profileUser.subscription?.status === 'active' &&
    (!profileUser.subscription.endDate || new Date(profileUser.subscription.endDate) > new Date())
  );

  // Aggregated comprehensive solved problems list (Normal DSA + Daily Streak + Weekly Contest)
  const allSolvedProblems = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    // 1. Real accepted problems from backend coding stats
    if (codingStats.recentSolvedProblems && codingStats.recentSolvedProblems.length > 0) {
      codingStats.recentSolvedProblems.forEach((p) => {
        if (!seen.has(p.slug)) {
          seen.add(p.slug);
          list.push({
            id: p.id,
            title: p.title,
            slug: p.slug,
            difficulty: p.difficulty || 'Medium',
            timeAgo: p.timeAgo || 'Solved recently',
            source: 'DSA Practice',
            category: (p as any).category || 'DSA',
          });
        }
      });
    }

    // 2. Solved Weekly Contest Problems
    try {
      const contestCfg = typeof sundayContestService?.getConfig === 'function' ? sundayContestService.getConfig() : null;
      const userKey = profileUser?.id || (profileUser as any)?._id || 'guest';
      const solvedNums = typeof (sundayContestService as any)?.getUserSolvedProblemNumbers === 'function'
        ? (sundayContestService as any).getUserSolvedProblemNumbers(userKey)
        : [];
      if (Array.isArray(solvedNums) && solvedNums.length > 0 && Array.isArray(contestCfg?.problems)) {
        contestCfg.problems
          .filter((cp: any) => solvedNums.includes(cp.number))
          .forEach((cp: any) => {
            if (!seen.has(cp.slug)) {
              seen.add(cp.slug);
              list.unshift({
                id: cp.id,
                title: cp.title,
                slug: cp.slug,
                difficulty: cp.difficulty,
                timeAgo: 'Contest #42',
                source: 'Weekly Contest',
                category: 'Contest',
              });
            }
          });
      }
    } catch {}

    // 3. Solved Daily Streak Problem if claimed/solved today
    try {
      const dailyProb = typeof (sundayContestService as any)?.getDailyStreakProblem === 'function'
        ? (sundayContestService as any).getDailyStreakProblem()
        : null;
      const isTodayClaimed =
        (typeof (coinService as any)?.isTodaySolved === 'function' && (coinService as any).isTodaySolved()) ||
        (typeof (coinService as any)?.getState === 'function' && (coinService as any).getState()?.claimedToday);
      if (isTodayClaimed && dailyProb && !seen.has(dailyProb.slug)) {
        seen.add(dailyProb.slug);
        list.unshift({
          id: dailyProb.id,
          title: dailyProb.title,
          slug: dailyProb.slug,
          difficulty: dailyProb.difficulty,
          timeAgo: 'Today',
          source: 'Daily Streak',
          category: 'Daily Challenge',
        });
      }
    } catch {}

    return list;
  }, [codingStats.recentSolvedProblems, profileUser]);

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    if (difficultyFilter === 'All') return allSolvedProblems;
    return allSolvedProblems.filter((p) => p.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
  }, [difficultyFilter, allSolvedProblems]);

  // Calculate dynamic multi-color circular SVG donut segments (Easy, Medium, Hard)
  const bd = codingStats.difficultyBreakdown || { school: 0, basic: 0, easy: 0, medium: 0, hard: 0 };
  const easyCount = bd.easy ?? 0;
  const medCount = bd.medium ?? 0;
  const hardCount = bd.hard ?? 0;
  const actualTotal = easyCount + medCount + hardCount;

  // Gradual count-up animation synced with donut circle filling (smooth 2.2s duration)
  useEffect(() => {
    if (!isDonutLoaded) {
      setAnimatedSolvedCount(0);
      return;
    }
    let startTime: number | null = null;
    const duration = 2200; // 2.2 seconds gradual, smooth loading
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // smooth ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedSolvedCount(Math.round(eased * actualTotal));
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isDonutLoaded, actualTotal]);

  const circumference = 251.33; // 2 * Math.PI * 40

  const donutSegments = useMemo(() => {
    const rawSegments = [
      { name: 'Easy' as const, count: easyCount, color: '#00B8A3', label: 'Easy' },
      { name: 'Medium' as const, count: medCount, color: '#FFC01E', label: 'Medium' },
      { name: 'Hard' as const, count: hardCount, color: '#FF375F', label: 'Hard' },
    ];

    let currentOffset = 0;
    return rawSegments.map((seg) => {
      const segLength = actualTotal > 0 ? (seg.count / actualTotal) * circumference : 0;
      const strokeDasharray = isDonutLoaded && actualTotal > 0
        ? `${Math.max(0, segLength)} ${circumference}`
        : `0 ${circumference}`;
      const strokeDashoffset = isDonutLoaded ? -currentOffset : 0;
      if (actualTotal > 0) {
        currentOffset += segLength;
      }
      return {
        ...seg,
        strokeDasharray,
        strokeDashoffset,
        percentage: actualTotal > 0 ? Math.round((seg.count / actualTotal) * 100) : 0,
      };
    });
  }, [actualTotal, easyCount, medCount, hardCount, isDonutLoaded]);

  // Handler for clicking breakdown difficulty in overview
  const handleDifficultyClick = (diff: 'Easy' | 'Medium' | 'Hard') => {
    setDifficultyFilter(diff);
    // Smooth scroll to breakdown section
    const el = document.getElementById('problems-breakdown-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* 🧭 Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <Link to={ROUTES.EXPLORE} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          Explore
        </Link>
        <span className="text-slate-300 dark:text-dark-700">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-semibold">
          {isSelf ? 'My Profile' : `${profileUser?.name || 'Student'}'s Profile`}
        </span>
      </div>

      {/* 👤 TOP PROFILE HEADER CARD */}
      <div
        className={cn(
          'rounded-3xl bg-white dark:bg-dark-900 border p-6 sm:p-8 shadow-xs relative overflow-hidden transition-all',
          profileUser?.role === 'sub_admin'
            ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 via-white to-white dark:via-dark-900 dark:to-dark-900 shadow-lg shadow-emerald-500/5'
            : 'border-slate-200/90 dark:border-dark-800'
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Avatar & Main Profile Information */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            
            {/* 3D Flip Profile Avatar */}
            <div
              className={cn(
                'relative shrink-0 group select-none',
                canFlip && 'cursor-pointer'
              )}
              onClick={() => {
                if (canFlip) setIsAvatarFlipped((prev) => !prev);
              }}
              title={
                canFlip
                  ? isAutoFlipActive
                    ? '3D Flip Sync Active (Click to flip)'
                    : 'Dual Photo (Click to flip)'
                  : undefined
              }
            >
              {/* Circular Animated Line in NEC Favicon Colors on Mouse Over */}
              <svg
                className="absolute -inset-1.5 sm:-inset-2 w-[calc(100%+12px)] sm:w-[calc(100%+16px)] h-[calc(100%+12px)] sm:h-[calc(100%+16px)] pointer-events-none z-20 -rotate-90"
                viewBox="0 0 100 100"
              >
                <defs>
                  <linearGradient id="necProfileRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="35%" stopColor="#06B6D4" />
                    <stop offset="70%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="url(#necProfileRingGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: '289',
                  }}
                  className="[stroke-dashoffset:289] group-hover:[stroke-dashoffset:0] transition-all duration-700 ease-out opacity-0 group-hover:opacity-100 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]"
                />
              </svg>

              {/* 3D Perspective Card Container */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full relative"
                style={{ perspective: '800px' }}
              >
                <div
                  className="w-full h-full rounded-full transition-transform duration-700 relative"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isAvatarFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Front Face (Photo 1 or Initials) */}
                  <div
                    className={cn(
                      'absolute inset-0 w-full h-full rounded-full overflow-hidden shadow-md',
                      profileUser?.role === 'sub_admin'
                        ? 'ring-4 ring-emerald-500/80 shadow-emerald-500/30'
                        : 'ring-4 ring-slate-100 dark:ring-dark-800'
                    )}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {userPhoto1 ? (
                      <img
                        src={userPhoto1}
                        alt={profileUser?.name || 'Student'}
                        className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold font-mono shadow-md">
                        {getInitials(profileUser?.name)}
                      </div>
                    )}
                  </div>

                  {/* Back Face (Photo 2) */}
                  <div
                    className={cn(
                      'absolute inset-0 w-full h-full rounded-full overflow-hidden shadow-md',
                      profileUser?.role === 'sub_admin'
                        ? 'ring-4 ring-emerald-400/80'
                        : 'ring-4 ring-brand-500/50 dark:ring-brand-400/50'
                    )}
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    {userPhoto2 ? (
                      <img
                        src={userPhoto2}
                        alt={`${profileUser?.name || 'Student'} (Dual)`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold font-mono shadow-md">
                        {getInitials(profileUser?.name)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3D Flip Sync Active Badge indicator */}
              {isAutoFlipActive && (
                <div
                  className="absolute -top-1 -right-1 p-1 rounded-full bg-brand-600 text-white shadow-sm ring-2 ring-white dark:ring-dark-900 animate-pulse"
                  title="3D Flip Sync Active"
                >
                  <Repeat className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              )}

              {/* Camera Button (if self - elevated above the circle with z-30 and ring) */}
              {isSelf && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAvatarModal();
                  }}
                  className="absolute bottom-0.5 right-0.5 z-30 p-2 rounded-full bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 shadow-lg ring-2 ring-white dark:ring-dark-900 hover:bg-slate-50 dark:hover:bg-dark-750 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title="Upload Photos & 3D Flip Sync"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Name & Academic Meta */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profileUser?.name || 'Sandip Kumar Verma'}
                </h1>
                {isProMember && <MembershipBadge size="sm" />}
                {profileUser?.role === 'admin' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-mono font-bold shadow-xs">
                    👑 Master Admin (Owner)
                  </span>
                )}
                {profileUser?.role === 'sub_admin' && (
                  <div className="relative group/subadmin cursor-help">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-extrabold shadow-sm shadow-emerald-500/10 animate-pulse">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>🛡️ Sub-Admin Delegate</span>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </span>

                    {/* Interactive hover tooltip card */}
                    <div className="absolute left-0 top-full mt-2 w-72 p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-white text-xs shadow-2xl opacity-0 pointer-events-none group-hover/subadmin:opacity-100 group-hover/subadmin:pointer-events-auto transition-all z-40 space-y-1.5 backdrop-blur-md">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verified NextEra Sub-Administrator</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Official platform delegate entrusted with course curriculum curation, DSA challenge verification, and community moderation.
                      </p>
                      <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Appointed Authority</span>
                        <span className="text-emerald-400 font-bold">NextEra Coders Core</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{profileUser?.college || 'Ramgarh Engineering College'}</span>
              </div>

              {/* Followers, Following & Social Links (GitHub + LinkedIn) */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-600 dark:text-brand-400 font-semibold pt-0.5">
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('followers')}
                  className="hover:underline cursor-pointer flex items-center gap-1 font-bold"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{profileUser?.followersCount || 0} Followers</span>
                </button>
                <span className="text-slate-300 dark:text-dark-700">•</span>
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('following')}
                  className="hover:underline cursor-pointer flex items-center gap-1 font-bold"
                >
                  <span>{profileUser?.followingCount || 0} Following</span>
                </button>
                
                {/* GitHub Social Icon */}
                <span className="text-slate-300 dark:text-dark-700">•</span>
                {profileUser?.github ? (
                  <a
                    href={profileUser.github.startsWith('http') ? profileUser.github : `https://${profileUser.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors inline-flex items-center gap-1"
                    title="Visit GitHub Profile"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                ) : isSelf ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors inline-flex items-center gap-1"
                    title="Add GitHub Profile Link"
                  >
                    <Github className="w-4 h-4 opacity-50" />
                  </button>
                ) : null}

                {/* LinkedIn Social Icon */}
                {profileUser?.linkedin ? (
                  <a
                    href={profileUser.linkedin.startsWith('http') ? profileUser.linkedin : `https://${profileUser.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors inline-flex items-center gap-1"
                    title="Visit LinkedIn Profile"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                ) : isSelf ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                    title="Add LinkedIn Profile Link"
                  >
                    <Linkedin className="w-4 h-4 opacity-50" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons (Coins Badge / Follow / Edit Profile / Settings) */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {/* 🪙 Live NEC Coins Badge (Click to open Rewards Store) */}
            <Link
              to={ROUTES.REWARDS}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-400/10 dark:hover:bg-amber-400/20 border border-amber-500/30 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 transition-all hover:scale-105 active:scale-95 shadow-sm group/coins cursor-pointer shrink-0"
              title="Click to visit NEC Rewards Store & Redeem Swags"
            >
              <span className="text-lg leading-none animate-bounce">🪙</span>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-75 leading-tight">NEC Coins</span>
                <span className="text-sm sm:text-base font-extrabold font-mono tracking-tight leading-tight text-amber-800 dark:text-amber-200">
                  {(isSelf ? (userWallet?.coins ?? currentUser?.points ?? 0) : (profileUser?.points ?? codingStats.codingScore ?? 0)).toLocaleString()}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover/coins:opacity-100 group-hover/coins:translate-x-0.5 transition-all ml-0.5" />
            </Link>

            {!isSelf ? (
              <Button
                variant={isFollowing ? 'outline' : 'primary'}
                size="md"
                disabled={followLoading}
                onClick={handleToggleFollow}
                leftIcon={isFollowing ? <UserCheck className="w-4 h-4 text-emerald-500" /> : <UserPlus className="w-4 h-4" />}
                className="rounded-xl font-bold shadow-xs cursor-pointer"
              >
                {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow Student'}
              </Button>
            ) : (
              <>
                {profileUser?.role === 'sub_admin' && (
                  <Link
                    to={ROUTES.ADMIN}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                    title="Open NextEra Sub-Admin Management Studio"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Studio</span>
                  </Link>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('edit')}
                  leftIcon={<Edit3 className="w-4 h-4" />}
                  className="rounded-xl font-bold shadow-2xs cursor-pointer"
                >
                  Edit Profile
                </Button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
                  title="Account Security Settings"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('plans')}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 text-amber-600 dark:text-amber-400 transition-colors shadow-2xs cursor-pointer"
                  title="Membership & Plans"
                >
                  <Crown className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-3 border-t border-slate-100 dark:border-dark-800 mt-6 pt-4 overflow-x-auto">
          {/* Sub-Admin Delegation Tab (Prestige module visible whenever profile is sub_admin) */}
          {profileUser?.role === 'sub_admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('subadmin')}
              className={cn(
                'px-4 py-2 text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer rounded-lg flex items-center gap-1.5',
                activeTab === 'subadmin'
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/30 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500'
                  : 'text-emerald-700/90 hover:text-emerald-600 dark:text-emerald-400/90 dark:hover:text-emerald-300 bg-emerald-500/5'
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Sub-Admin Scope</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-mono font-black uppercase">
                Officer
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('coding')}
            className={cn(
              'px-4 py-2 text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer rounded-lg',
              activeTab === 'coding'
                ? 'text-emerald-600 dark:text-emerald-400 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500 dark:after:bg-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            Coding Score
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-4 py-2 text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer rounded-lg',
              activeTab === 'overview'
                ? 'text-brand-600 dark:text-brand-400 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            Overview & Tracks
          </button>

          {/* Pro & Membership Tab (Public for all visitors to promote NextEra memberships & courses) */}
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={cn(
              'px-4 py-2 text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer rounded-lg flex items-center gap-1.5',
              activeTab === 'plans'
                ? 'text-amber-600 dark:text-amber-400 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>{isSelf ? 'Pro & Billing' : 'Pro & Plans'}</span>
          </button>

          {isSelf && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={cn(
                  'px-4 py-2 text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer rounded-lg',
                  activeTab === 'edit'
                    ? 'text-brand-600 dark:text-brand-400 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                Edit Profile
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={cn(
                  'px-4 py-2 text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer rounded-lg',
                  activeTab === 'security'
                    ? 'text-brand-600 dark:text-brand-400 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                Security
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={cn(
                  'px-4 py-2 text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer rounded-lg flex items-center gap-1.5',
                  activeTab === 'posts'
                    ? 'text-brand-600 dark:text-brand-400 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
                <span>Posts & Reviews</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 TAB 1: CODING SCORE (100% Workable & Interactive) */}
      {/* ========================================================================= */}
      {activeTab === 'coding' && (
        <div className="space-y-6">
          
          {/* ROW 1: Donut Progress Chart + Coding Score Metrics + NEC Daily Streak Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* CARD 1 (Col 4): Problems Overview with Clickable Circular Donut Chart */}
            <div className="md:col-span-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Problems Overview
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Click to filter</span>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-center justify-center gap-6 my-auto py-2">
                {/* Dynamic Multi-Segment SVG Donut Progress Chart (Interactive) */}
                <div
                  className="relative w-44 h-44 shrink-0 flex items-center justify-center cursor-pointer group"
                  title="Click segments or legend to filter problems"
                >
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-100 dark:stroke-dark-800"
                      strokeWidth="10"
                      fill="transparent"
                    />

                    {/* Render Each Difficulty Segment in its own Distinct Color */}
                    {donutSegments.map((seg) =>
                      seg.count > 0 ? (
                        <circle
                          key={seg.name}
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={seg.color}
                          strokeWidth="10"
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          fill="transparent"
                          className="hover:opacity-80 hover:stroke-[12px] cursor-pointer"
                          style={{
                            transition: 'stroke-dasharray 2.2s cubic-bezier(0.2, 0.8, 0.25, 1), stroke-dashoffset 2.2s cubic-bezier(0.2, 0.8, 0.25, 1), stroke-width 0.2s ease',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDifficultyClick(seg.name);
                          }}
                        >
                          <title>{seg.label}: {seg.count} Solved ({seg.percentage}%)</title>
                        </circle>
                      ) : null
                    )}
                  </svg>
                  
                  {/* Donut Center Count (Live Gradual Count-Up Animation) */}
                  <div
                    onClick={() => handleDifficultyClick('Easy')}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-transform"
                  >
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                      {isDonutLoaded ? animatedSolvedCount : 0}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                      Problems<br />Solved
                    </span>
                  </div>
                </div>

                {/* Breakdown Legend Chips (Clickable Filters: Easy, Medium, Hard) */}
                <div className="space-y-2.5 w-full max-w-[190px] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleDifficultyClick('Easy')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer border',
                      difficultyFilter === 'Easy'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                        : 'border-slate-100 dark:border-dark-800 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00B8A3] shadow-[0_0_6px_rgba(0,184,163,0.6)] inline-block" />
                      <span>Easy</span>
                    </span>
                    <span className="font-mono text-[#00B8A3] font-bold">({easyCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDifficultyClick('Medium')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer border',
                      difficultyFilter === 'Medium'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                        : 'border-slate-100 dark:border-dark-800 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FFC01E] shadow-[0_0_6px_rgba(255,192,30,0.6)] inline-block" />
                      <span>Medium</span>
                    </span>
                    <span className="font-mono text-[#FFC01E] font-bold">({medCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDifficultyClick('Hard')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer border',
                      difficultyFilter === 'Hard'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                        : 'border-slate-100 dark:border-dark-800 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF375F] shadow-[0_0_6px_rgba(255,55,95,0.6)] inline-block" />
                      <span>Hard</span>
                    </span>
                    <span className="font-mono text-[#FF375F] font-bold">({hardCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 2 (Col 5): Interactive Metrics (Coding Score, Problems Solved, Institute Rank, Articles) */}
            <div className="md:col-span-5 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-5 shadow-xs flex flex-col justify-between gap-3">
              
              {/* Metric Row 1: Coding Score (Clickable Explanation Modal) */}
              <div
                onClick={() => setIsScoreFormulaModalOpen(true)}
                className="relative overflow-hidden flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-dark-850/60 border border-slate-100 dark:border-dark-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer group shadow-2xs"
                title="Click to see how Coding Score is calculated"
              >
                {/* Interactive Animated Top Lining */}
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 w-0 group-hover:w-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(16,185,129,0.8)]" />

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                    &lt;/&gt;
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block">
                      Coding Score
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <HelpCircle className="w-3 h-3" /> View formula & breakdown
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-3.5 py-1 rounded-full bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-700 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 shadow-2xs">
                    {codingStats.codingScore}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Metric Row 2: Problems Solved (Click to practice) */}
              <Link
                to={ROUTES.PRACTICE}
                className="relative overflow-hidden flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-dark-850/60 border border-slate-100 dark:border-dark-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all group cursor-pointer shadow-2xs"
              >
                {/* Interactive Animated Top Lining */}
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 w-0 group-hover:w-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.8)]" />

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                    &lt;/&gt;
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block">
                      Problems Solved
                    </span>
                    <span className="text-[10px] text-slate-400">Open DSA practice suite</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-3.5 py-1 rounded-full bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-700 text-sm font-mono font-bold text-slate-900 dark:text-white shadow-2xs">
                    {codingStats.totalProblemsSolved}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Metric Row 3: Institute Rank (Clickable Leaderboard Modal) */}
              <div
                onClick={handleOpenInstituteLeaderboard}
                className="relative overflow-hidden flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-dark-850/60 border border-slate-100 dark:border-dark-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all cursor-pointer group shadow-2xs"
                title="Click to view college leaderboard"
              >
                {/* Interactive Animated Top Lining */}
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-400 w-0 group-hover:w-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(168,85,247,0.8)]" />

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors block">
                      Institute Rank
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">
                      {profileUser?.college || 'College Rank'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-3.5 py-1 rounded-full bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-700 text-sm font-mono font-bold text-purple-600 dark:text-purple-400 shadow-2xs">
                    #{codingStats.instituteRank}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Metric Row 4: Articles Published (Click to tutorials) */}
              <Link
                to={ROUTES.TUTORIALS}
                className="relative overflow-hidden flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-dark-850/60 border border-slate-100 dark:border-dark-800 hover:border-amber-300 dark:hover:border-amber-800 transition-all group cursor-pointer shadow-2xs"
              >
                {/* Interactive Animated Top Lining */}
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400 w-0 group-hover:w-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(245,158,11,0.8)]" />

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors block">
                      Articles Published
                    </span>
                    <span className="text-[10px] text-slate-400">Explore technical tutorials</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-3.5 py-1 rounded-full bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-700 text-sm font-mono font-bold text-slate-900 dark:text-white shadow-2xs">
                    {codingStats.articlesPublished}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>

            {/* CARD 3 (Col 3): NEC Daily Streak & Solved Problems */}
            <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
              
              {/* Glowing NEC Daily Streak Banner */}
              <div className="relative overflow-hidden group rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-lg shadow-orange-500/20 flex items-center gap-3">
                {/* Interactive Animated Top Lining */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-yellow-300 via-white to-amber-200 w-0 group-hover:w-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.9)]" />

                <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black tracking-tight block">
                    {codingStats.necDailyStreak} Day NEC Daily Streak
                  </span>
                  <span className="text-[11px] text-white/80 font-medium">Keep coding daily!</span>
                </div>
              </div>

              {/* Longest NEC Streak Metric */}
              <div className="relative overflow-hidden group rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-5 shadow-xs flex-1 flex flex-col justify-center transition-all hover:border-orange-300 dark:hover:border-orange-800">
                {/* Interactive Animated Top Lining */}
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-orange-500 via-amber-400 to-rose-400 w-0 group-hover:w-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(249,115,22,0.8)]" />

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Longest NEC Streak:</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {codingStats.longestNecStreak} Days
                </div>
              </div>

              {/* NEC Problems Solved Metric */}
              <div className="relative overflow-hidden group rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-5 shadow-xs flex-1 flex flex-col justify-center transition-all hover:border-emerald-300 dark:hover:border-emerald-800">
                {/* Interactive Animated Top Lining */}
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-teal-400 w-0 group-hover:w-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(6,182,212,0.8)]" />

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>NEC Problems Solved:</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {codingStats.necProblemsSolved}
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Submissions Heatmap Calendar (365-Day Activity Grid & Monthly Matrix) */}
          <ActivityHeatmap
            submissionDateMap={codingStats.submissionDateMap || {}}
            totalSubmissionsInYear={codingStats.totalSubmissionsInYear || 0}
            currentStreak={codingStats.necDailyStreak || 0}
            longestStreak={codingStats.longestNecStreak || 0}
            year={2026}
          />

          {/* ROW 3: Problems Breakdown List (Functioning Navigation & Anchor) */}
          <div id="problems-breakdown-section" className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 shadow-xs space-y-4">
            
            {/* Header & Difficulty Dropdown Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-dark-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Problems Breakdown
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {filteredProblems.length} Problems ({difficultyFilter})
                    </span>
                  </div>
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as any)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-2xs"
                >
                  <option value="All">All Submissions</option>
                  <option value="Easy">Easy Problems</option>
                  <option value="Medium">Medium Problems</option>
                  <option value="Hard">Hard Problems</option>
                </select>
              </div>
            </div>

            {/* Solved Problem Rows with Direct Route Navigation */}
            {filteredProblems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No solved problems found under '{difficultyFilter}' filter.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredProblems.map((problem) => (
                  <div
                    key={problem.id}
                    onClick={() => navigate(`/dsa/${problem.slug}`)}
                    className="flex items-center justify-between p-3.5 px-4 rounded-2xl border border-slate-200/80 dark:border-dark-800 hover:border-brand-500/40 dark:hover:border-brand-500/40 hover:bg-slate-50/80 dark:hover:bg-dark-850/60 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap sm:flex-nowrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                        {problem.title}
                      </span>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {problem.source === 'Weekly Contest' && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold shrink-0 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            🏆 Contest
                          </span>
                        )}
                        {problem.source === 'Daily Streak' && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ⚡ Streak
                          </span>
                        )}

                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0',
                            problem.difficulty === 'Easy'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : problem.difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : problem.difficulty === 'Hard'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                          )}
                        >
                          {problem.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-medium">
                        {problem.timeAgo}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.PRACTICE)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="rounded-xl font-bold"
              >
                Solve More DSA Practice Problems
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📚 TAB 2: OVERVIEW & ENROLLED COURSES */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                About & Bio
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {profileUser?.bio || 'Aspiring Software Engineer mastering Data Structures, Full-Stack Development and System Architecture.'}
              </p>
            </div>

            {/* Skills Badges */}
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tech Stack & Core Competencies
              </h4>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(profileUser?.skills) && profileUser.skills.length > 0
                  ? profileUser.skills
                  : typeof profileUser?.skills === 'string' && profileUser.skills.trim()
                  ? profileUser.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
                  : ['C++', 'Python', 'JavaScript', 'React', 'Node.js', 'Algorithms', 'System Design']
                ).map((skill: string) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          {isSelf && (
            <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Enrolled Learning Tracks
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track your ongoing lessons and project completion progress.
                  </p>
                </div>
                <Link to={ROUTES.MY_LEARNING}>
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View All
                  </Button>
                </Link>
              </div>

              {loadingCourses ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading courses...</div>
              ) : enrolledCourses.length === 0 ? (
                <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-dark-800 rounded-2xl">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No active course enrollments yet
                  </p>
                  <Link to={ROUTES.COURSES}>
                    <Button variant="primary" size="sm" className="mt-2">
                      Browse Courses Catalog
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledCourses.map((enr) => (
                    <div
                      key={enr.enrollmentId}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-dark-800 hover:border-brand-500/50 transition-colors space-y-3"
                    >
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {enr.course.title}
                      </h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>Progress</span>
                          <span>{enr.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${enr.progress}%` }}
                          />
                        </div>
                      </div>
                      <Link to={`/learn/${enr.course.slug}`} className="block">
                        <Button variant="outline" size="sm" className="w-full font-bold">
                          Continue Learning
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ TAB 3: EDIT PROFILE FORM */}
      {/* ========================================================================= */}
      {activeTab === 'edit' && isSelf && (
        <Card className="rounded-3xl border-slate-200/90 dark:border-dark-800">
          <CardHeader>
            <CardTitle className="text-xl font-extrabold">Edit Profile Information</CardTitle>
            <CardDescription>
              Update your personal details, academic institution, and developer social links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  placeholder="Your Full Name"
                  error={profileErrors.name?.message}
                  {...registerProfile('name')}
                />

                <Input
                  label="College / Institute Name"
                  placeholder="e.g. Ramgarh Engineering College"
                  error={profileErrors.college?.message}
                  {...registerProfile('college')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  About / Bio
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Share a short summary about your learning journey..."
                  {...registerProfile('bio')}
                />
                {profileErrors.bio && (
                  <p className="text-xs text-rose-500 mt-1">{profileErrors.bio.message}</p>
                )}
              </div>

              <Input
                label="Skills (comma separated)"
                placeholder="C++, Python, JavaScript, React, Node.js, DSA"
                error={profileErrors.skills?.message}
                {...registerProfile('skills')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="GitHub Profile URL"
                  placeholder="https://github.com/username"
                  error={profileErrors.github?.message}
                  {...registerProfile('github')}
                />
                <Input
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/username"
                  error={profileErrors.linkedin?.message}
                  {...registerProfile('linkedin')}
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isProfileSubmitting}
                  className="rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {isProfileSubmitting ? 'Saving Changes...' : 'Save Profile Details'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setActiveTab('coding')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 👑 TAB 4: ULTRA-PREMIUM PRO & BILLINGS SUITE (PUBLIC PROMOTION & SOCIAL PROOF) */}
      {/* ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          
          {/* 1. LUXURY METALLIC VIP MEMBERSHIP PASS CARD */}
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 shadow-2xl bg-gradient-to-br from-slate-900 via-dark-900 to-black text-white border border-amber-500/30">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/15 via-brand-500/10 to-transparent blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              
              <div className="space-y-4 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 tracking-wider uppercase">
                    <Crown className="w-3.5 h-3.5" /> NextEra VIP Pass
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {isProMember ? 'Active NEC Pro Member' : 'Verified Student Tier'}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                    {profileUser?.name || 'Sandip Kumar Verma'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
                    {profileUser?.email} • Member ID: NEC-2026-{(profileUser?.id || '8849').slice(-6).toUpperCase()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white/10 text-white backdrop-blur-xs border border-white/10">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Unlimited Cloud IDE
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white/10 text-white backdrop-blur-xs border border-white/10">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> 50+ Tech Cohorts
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white/10 text-white backdrop-blur-xs border border-white/10">
                    <Award className="w-3.5 h-3.5 text-sky-400" /> ISO Certifications
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white/10 text-white backdrop-blur-xs border border-white/10">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> 1-on-1 Mentor Reviews
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-start md:items-end gap-4 w-full md:w-auto">
                <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-left md:text-right space-y-1 w-full md:w-56">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                    Membership Status
                  </span>
                  <span className="text-lg font-black text-amber-300 block">
                    {isProMember ? 'PRO ALL-ACCESS' : 'FREE STUDENT'}
                  </span>
                  <span className="text-[11px] text-slate-300 block font-mono">
                    {isProMember
                      ? profileUser?.subscription?.endDate
                        ? `Valid until ${new Date(profileUser.subscription.endDate).toLocaleDateString()}`
                        : 'Valid Pro Access'
                      : 'Upgrade to unlock all features'}
                  </span>
                </div>

                <Link to={ROUTES.PRO_ONE} className="w-full md:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full md:w-auto bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 border border-amber-300/40 cursor-pointer"
                    rightIcon={<Sparkles className="w-4 h-4 text-slate-950" />}
                  >
                    {isProMember ? 'Manage Pro Membership' : 'Upgrade to Pro Pass'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* 2. THREE-TIER VIP PLAN COMPARISON CARDS */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Available Membership Plans
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select the plan that accelerates your engineering career.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 self-start sm:self-center">
                ⚡ 100% Refund Guarantee
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* PLAN 1: Basic Monthly */}
              <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 shadow-xs flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">Basic Plan</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">1 Month Access</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    ₹399 <span className="text-xs text-slate-400 font-normal line-through">₹999</span> <span className="text-xs text-slate-400 font-normal">/ month</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Flexible monthly access to all courses, DSA sheets and live compiler.
                  </p>
                  
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-dark-800 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>All Course Access (DSA + more)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Core CS Subjects & Quizzes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>AI Support with 25K/day Tokens</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Quick In-Browser Compiler</span>
                    </div>
                  </div>
                </div>

                <Link to={ROUTES.PRO_ONE} className="block w-full">
                  <Button variant="outline" size="sm" className="w-full rounded-xl font-bold cursor-pointer">
                    Choose Monthly Plan
                  </Button>
                </Link>
              </div>

              {/* PLAN 2: Plus 1-Year (Featured) */}
              <div className="relative rounded-3xl bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-950/30 dark:via-dark-900 dark:to-dark-900 border-2 border-amber-500/80 p-6 shadow-xl flex flex-col justify-between space-y-5">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                  Save 70% • 1-Year Pass
                </span>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">Plus Plan</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">₹250/mo</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    ₹2,999 <span className="text-xs text-slate-400 font-normal line-through">₹9,999</span> <span className="text-xs text-slate-400 font-normal">/ year</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comprehensive full-stack & DSA career roadmap with verifiable certificates.
                  </p>
                  
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-dark-800 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>All 50+ Interactive Courses Unlocked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>500+ Curated SDE Problem Sheet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>System Design (HLD & LLD) Blueprints</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Verified Certificates with QR Verification</span>
                    </div>
                  </div>
                </div>

                <Link to={ROUTES.PRO_ONE} className="block w-full">
                  <Button variant="primary" size="md" className="w-full rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md cursor-pointer">
                    Choose 1-Year Plan
                  </Button>
                </Link>
              </div>

              {/* PLAN 3: Pro 3-Years */}
              <div className="rounded-3xl bg-white dark:bg-dark-900 border-2 border-purple-500/50 p-6 shadow-xl shadow-purple-500/5 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">Pro Plan</span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">Popular • 3 Years</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    ₹5,999 <span className="text-xs text-slate-400 font-normal line-through">₹14,999</span> <span className="text-xs text-slate-400 font-normal">/ 3 years</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    3 full years of unlimited access across courses, interviews, and senior mentor support.
                  </p>
                  
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-dark-800 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>3 Years Complete Platform Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>Unlimited Cloud AI & Compiler</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>1-on-1 Direct Resume & Code Reviews</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>Priority Hiring & Partner Referrals</span>
                    </div>
                  </div>
                </div>

                <Link to={ROUTES.PRO_ONE} className="block w-full">
                  <Button variant="outline" size="md" className="w-full rounded-xl font-bold border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 cursor-pointer">
                    Choose 3-Year Pass
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* 3. SOCIAL PROOF & PLATFORM PROMOTION (VISITORS) OR INVOICES (SELF) */}
          {isSelf ? (
            <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-dark-800 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-brand-500" />
                    <span>Billing History & Official Invoices</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    View and verify all your transaction receipts and payment requests.
                  </p>
                </div>

                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 self-start sm:self-center">
                  Currency: INR (₹)
                </span>
              </div>

              {loadingPayments ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading billing records...</div>
              ) : paymentRequests.length === 0 ? (
                <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-dark-800 rounded-2xl">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No billing history found
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    When you purchase a Pro plan or enroll in paid cohort tracks, your receipts and tax invoices will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-dark-800 text-[11px] font-mono text-slate-400 uppercase">
                        <th className="pb-3 font-semibold">Item & Plan</th>
                        <th className="pb-3 font-semibold">Amount</th>
                        <th className="pb-3 font-semibold">Transaction / UTR</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                      {paymentRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-slate-50/60 dark:hover:bg-dark-850/60 transition-colors">
                          <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white">
                            {req.planId ? `${req.planId.toUpperCase()} Pro Plan` : (req.courseTitle || 'Course Purchase')}
                          </td>
                          <td className="py-3.5 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                            ₹{req.amount}
                          </td>
                          <td className="py-3.5 pr-4 font-mono text-slate-500 dark:text-slate-400">
                            {req.transactionId || req.payerUpiId || 'N/A'}
                          </td>
                          <td className="py-3.5 pr-4 text-slate-500 dark:text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5">
                            <Badge
                              variant={
                                req.status === 'approved'
                                  ? 'success'
                                  : req.status === 'rejected'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {req.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 shadow-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-dark-900 text-white border border-brand-500/30">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                    <Sparkles className="w-3.5 h-3.5" /> NextEra Pro Certified Network
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Unlock All Courses & Unlimited Cloud IDE like {profileUser?.name || 'Top Coders'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                    Join over 10,000+ ambitious students learning full-stack, mastering data structures, and getting placed at top tech product companies.
                  </p>
                </div>

                <Link to={ROUTES.PRO_ONE} className="shrink-0 w-full md:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/25 border-none cursor-pointer"
                    rightIcon={<Sparkles className="w-4 h-4 text-slate-950" />}
                  >
                    Join NextEra Pro 🚀
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔒 TAB 5: SECURITY (Change Password) */}
      {/* ========================================================================= */}
      {activeTab === 'security' && isSelf && (
        <div className="space-y-6">
          {/* Sub-Admin Current Active Password Viewer */}
          {currentUser?.role === 'sub_admin' && (
            <Card className="rounded-3xl border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-50 to-emerald-500/5 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Your Current Sub-Admin Password
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        OFFICER ACCESS
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      This is your active assigned login credential. You can view or copy it anytime, or change it below.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/30 shadow-xs w-full sm:w-auto justify-between sm:justify-start">
                  <div className="font-mono text-xs">
                    <span className="text-slate-400 text-[9px] block uppercase font-bold">Current Password</span>
                    <span className="font-bold text-slate-900 dark:text-white select-all">
                      {showCurrentSubAdminPw
                        ? (currentUser.subAdminCredential?.plainPassword || '••••••••')
                        : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => setShowCurrentSubAdminPw(!showCurrentSubAdminPw)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title={showCurrentSubAdminPw ? 'Hide Password' : 'Show Password'}
                    >
                      {showCurrentSubAdminPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const pw = currentUser.subAdminCredential?.plainPassword;
                        if (pw) {
                          navigator.clipboard.writeText(pw);
                          success('Sub-Admin password copied to clipboard!');
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Copy Password"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="rounded-3xl border-slate-200/90 dark:border-dark-800">
            <CardHeader>
              <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-500" />
                <span>Change Account Password</span>
              </CardTitle>
              <CardDescription>
                Set a new secure password for your account. Ensure your password has at least 8 characters including uppercase, lowercase, and numbers.
              </CardDescription>
            </CardHeader>
          <CardContent>
            <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
              {pwError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              <Input
                label="New Password"
                type={showNewPw ? 'text' : 'password'}
                placeholder="Enter new password"
                error={pwErrors.newPassword?.message}
                {...registerPw('newPassword')}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Input
                label="Confirm New Password"
                type={showConfirmPw ? 'text' : 'password'}
                placeholder="Re-enter new password"
                error={pwErrors.confirmNewPassword?.message}
                {...registerPw('confirmNewPassword')}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={pwSubmitting}
                className="w-full rounded-xl font-bold mt-2"
              >
                {pwSubmitting ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💬 TAB 6: POSTS & REVIEWS */}
      {/* ========================================================================= */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Action Header Card */}
          <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-mono font-bold">
                <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                <span>NextEra Community & Posts</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Student Community Posts & Reviews
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Browse student reviews, programming doubts with attached screenshots, and project showcases on our dedicated community feed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to={ROUTES.COMMUNITY}>
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Community Hub</span>
                </Button>
              </Link>
              <Link to={ROUTES.COMMUNITY}>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-white text-brand-700 hover:bg-white/90 border-0 font-extrabold rounded-xl flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Post / Review</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Posts List for this student */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isSelf ? 'My Published Posts' : `${profileUser?.name || 'Student'}'s Posts`}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400">
                  {userPosts.length}
                </span>
              </h3>
            </div>

            {loadingUserPosts ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Loading posts...
              </div>
            ) : userPosts.length === 0 ? (
              <Card className="rounded-3xl border-slate-200/90 dark:border-dark-800 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-500 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No community posts yet
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Share your experience with courses, ask coding problems with screenshots, or review features!
                </p>
                <div className="pt-2">
                  <Link to={ROUTES.COMMUNITY}>
                    <Button variant="primary" size="sm" className="rounded-xl font-bold">
                      Explore & Create First Post
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={
                            post.category === 'review'
                              ? 'warning'
                              : post.category === 'problem'
                              ? 'danger'
                              : post.category === 'project'
                              ? 'info'
                              : 'default'
                          }
                          className="text-xs font-bold"
                        >
                          {post.category === 'review' && <Star className="w-3 h-3 mr-1 fill-current" />}
                          {post.category.toUpperCase()}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">{post.createdAt}</span>
                      </div>

                      {post.category === 'review' && post.rating && (
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= post.rating! ? 'fill-current' : 'text-slate-300 dark:text-dark-700'}`}
                            />
                          ))}
                          <span className="font-bold text-amber-500 ml-1 font-mono">{post.rating}.0</span>
                        </div>
                      )}

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {post.content}
                      </p>

                      {post.images && post.images.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          {post.images.slice(0, 3).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Attachment"
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-dark-700"
                            />
                          ))}
                          {post.images.length > 3 && (
                            <span className="text-xs text-slate-400 font-mono">+{post.images.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span>❤️ {post.likesCount}</span>
                        <span>💬 {post.commentsCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`${ROUTES.COMMUNITY}#post-${post.id}`}
                          className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                        >
                          View in Feed &rarr;
                        </Link>
                        {isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUserPost(post.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ TAB: SUB-ADMIN DELEGATION & REPUTATION PORTFOLIO */}
      {/* ========================================================================= */}
      {activeTab === 'subadmin' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Delegation Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 shadow-xl text-white">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center">
                    <ShieldCheck className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-black tracking-wider uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Official Platform Sub-Admin
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-mono font-bold">
                      Tier 1 Delegated Officer
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {profileUser?.name} — Delegated Administrative Authority
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    This user holds verified Sub-Administrator credentials authorized directly by{' '}
                    <strong className="text-emerald-400 font-bold">NextEra Coders Core (Owner: nexteracoders@gmail.com)</strong>. 
                    They curate curriculum tracks, evaluate DSA problem submissions, and guide student success.
                  </p>
                </div>
              </div>

              {/* Status and Action Badge */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto">
                <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-emerald-500/30 flex items-center gap-2.5 shadow-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-mono text-slate-400">Security Clearance</p>
                    <p className="text-xs font-bold text-emerald-300">Delegated Sandbox Active</p>
                  </div>
                </div>

                {isSelf && (
                  <Link
                    to={ROUTES.ADMIN}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <span>Launch Admin Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Officer Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-[10px] font-mono uppercase text-slate-400">Governance Scope</p>
                <p className="text-sm font-black text-white mt-0.5">Content & Community</p>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-[10px] font-mono uppercase text-slate-400">Review Integrity</p>
                <p className="text-sm font-black text-emerald-400 mt-0.5">99.8% Verified</p>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-[10px] font-mono uppercase text-slate-400">Platform Credentials</p>
                <p className="text-sm font-black text-teal-300 mt-0.5">NextEra Certified</p>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-[10px] font-mono uppercase text-slate-400">Root Access</p>
                <p className="text-sm font-black text-amber-400 mt-0.5">Strictly Guarded</p>
              </div>
            </div>
          </div>

          {/* If isSelf: Quick Studio Stations */}
          {isSelf && (
            <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Sub-Admin Studio Fast Track
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">One-click administrative jumps</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Link
                  to={ROUTES.ADMIN_COURSES}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center group cursor-pointer"
                >
                  <BookOpen className="w-6 h-6 mx-auto text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Courses & Tracks</p>
                  <p className="text-[10px] text-slate-500">Curate lessons</p>
                </Link>

                <Link
                  to={ROUTES.ADMIN_PROBLEMS}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center group cursor-pointer"
                >
                  <FileCode className="w-6 h-6 mx-auto text-teal-600 dark:text-teal-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">DSA Problem Bank</p>
                  <p className="text-[10px] text-slate-500">Testcases & ratings</p>
                </Link>

                <Link
                  to={ROUTES.ADMIN_CONTEST}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center group cursor-pointer"
                >
                  <Trophy className="w-6 h-6 mx-auto text-amber-500 mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Coding Contests</p>
                  <p className="text-[10px] text-slate-500">Live competitions</p>
                </Link>

                <Link
                  to={ROUTES.COMMUNITY}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center group cursor-pointer"
                >
                  <MessageSquare className="w-6 h-6 mx-auto text-blue-500 mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Community Feeds</p>
                  <p className="text-[10px] text-slate-500">Posts & moderation</p>
                </Link>

                <Link
                  to={ROUTES.ADMIN_MENTORS}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center group cursor-pointer"
                >
                  <Users className="w-6 h-6 mx-auto text-purple-500 mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Mentor Directory</p>
                  <p className="text-[10px] text-slate-500">Guide faculty</p>
                </Link>
              </div>
            </div>
          )}

          {/* Two-Column Breakdown: Authorized Scope vs Strict Platform Boundaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Authorized Modules */}
            <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-dark-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Authorized Administrative Capabilities
                  </h3>
                  <p className="text-xs text-slate-500">Delegated responsibilities entrusted to this Sub-Admin</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Curriculum & Lesson Studio Management
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Can create, edit, and organize courses, modules, lessons, tutorials, and project tasks across NextEra tech tracks.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      DSA Challenge & Testcase Authoring
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Can publish new coding problems, write automated test cases, and verify algorithm test vectors.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Contests & Competitive Sprints
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Can schedule Sunday contests, create speed quizzes, and supervise live participant scoreboards.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Community Moderation & Mentorship
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Enforces student code of conduct, pins constructive discussions, and reviews mentor listings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Security Boundaries (Exclusively Super Admin) */}
            <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-dark-800">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Platform Security & Owner Guardrails
                  </h3>
                  <p className="text-xs text-slate-500">
                    Strictly isolated for NextEra Coders Owner (<span className="font-mono text-emerald-600 dark:text-emerald-400">nexteracoders@gmail.com</span>)
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Zero Access to Financial & Payment Gateways
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Sub-Admins cannot view revenue, bank credentials, refund requests, or payment orders.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Cannot Appoint or Demote Other Admins
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      The Sub-Admins module is completely hidden. Only the Master Owner can appoint, view passwords, or revoke access.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      System Settings, Health & Audit Logs Locked
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Platform maintenance mode, anti-cheat controls, environment configurations, and audit trails remain exclusive to the Owner.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Continuous Owner Oversight
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Every modification made by Sub-Admins is recorded in real-time audit logs directly monitored by NextEra Coders Executive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📸 MODAL: UPLOAD PHOTOS & 3D FLIP SYNC */}
      {/* ========================================================================= */}
      {isAvatarModalOpen && isSelf && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-500" />
                <span>Upload Profile Photos</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Dual Photo Upload Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* SLOT 1 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850/50 flex flex-col items-center justify-center text-center relative group min-h-[170px]">
                  <span className="text-[11px] font-mono font-bold uppercase text-brand-600 dark:text-brand-400 mb-2">
                    Photo 1 (Primary)
                  </span>
                  {modalPhoto1 ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={modalPhoto1}
                        alt="Photo 1"
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-brand-500 shadow-sm"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <label className="text-[11px] font-bold text-brand-600 hover:underline cursor-pointer">
                          Change
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(1, e.target.files[0]);
                            }}
                          />
                        </label>
                        <span className="text-slate-300 dark:text-dark-700">•</span>
                        <button
                          type="button"
                          onClick={() => setModalPhoto1('')}
                          className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full py-2">
                      <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Upload from PC
                      </span>
                      <span className="text-[10px] text-slate-400">
                        JPG, PNG or WebP
                      </span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(1, e.target.files[0]);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* SLOT 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850/50 flex flex-col items-center justify-center text-center relative group min-h-[170px]">
                  <span className="text-[11px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400 mb-2">
                    Photo 2 (Flip Sync)
                  </span>
                  {modalPhoto2 ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={modalPhoto2}
                        alt="Photo 2"
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-500 shadow-sm"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <label className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer">
                          Change
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(2, e.target.files[0]);
                            }}
                          />
                        </label>
                        <span className="text-slate-300 dark:text-dark-700">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setModalPhoto2('');
                            setModalAutoFlip(false);
                          }}
                          className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full py-2">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Upload 2nd Photo
                      </span>
                      <span className="text-[10px] text-slate-400">
                        For 3D Flip Sync
                      </span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(2, e.target.files[0]);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Multi-photo file dropzone (if user wants to select both at once) */}
              {(!modalPhoto1 || !modalPhoto2) && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files) handleMultiFiles(e.dataTransfer.files);
                  }}
                  className="p-3 rounded-2xl border border-dashed border-slate-200 dark:border-dark-700 text-center hover:border-brand-500 transition-colors"
                >
                  <label className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer block">
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      Click here to browse 2 photos at once
                    </span>{' '}
                    or drag & drop from PC
                    <input
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleMultiFiles(e.target.files);
                      }}
                    />
                  </label>
                </div>
              )}

              {/* 3D Flip Sync Activation Option */}
              <div
                className={cn(
                  'p-4 rounded-2xl border transition-all flex items-center justify-between gap-4',
                  modalPhoto1 && modalPhoto2
                    ? 'bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-transparent border-brand-500/30'
                    : 'bg-slate-50/70 dark:bg-dark-850/70 border-slate-200/80 dark:border-dark-800 opacity-70'
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Repeat className={cn('w-4 h-4', modalAutoFlip ? 'text-brand-600 dark:text-brand-400 animate-spin' : 'text-slate-400')} style={{ animationDuration: '6s' }} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Active 3D Flip Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {modalPhoto1 && modalPhoto2
                      ? 'Flip animation automatically rotates between your 2 photos on your profile.'
                      : 'Upload both Photo 1 and Photo 2 to activate 3D Flip Sync.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!modalPhoto1 || !modalPhoto2}
                  onClick={() => setModalAutoFlip(!modalAutoFlip)}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 disabled:cursor-not-allowed',
                    modalAutoFlip && modalPhoto1 && modalPhoto2
                      ? 'bg-brand-600'
                      : 'bg-slate-300 dark:bg-dark-700'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                      modalAutoFlip && modalPhoto1 && modalPhoto2 ? 'right-0.5' : 'left-0.5'
                    )}
                  />
                </button>
              </div>

              {/* Live Mini 3D Preview (when 2 photos are present) */}
              {modalPhoto1 && modalPhoto2 && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-100 dark:border-dark-800 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Live 3D Flip Preview
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {modalAutoFlip ? 'Flipping continuously every few seconds' : 'Static (Flip sync is turned off)'}
                    </span>
                  </div>

                  <div
                    className="w-12 h-12 rounded-full relative cursor-pointer"
                    style={{ perspective: '400px' }}
                    onClick={() => setPreviewFlipped((p) => !p)}
                    title="Click to test flip"
                  >
                    <div
                      className="w-full h-full rounded-full transition-transform duration-700 relative"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: previewFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      <div
                        className="absolute inset-0 w-full h-full rounded-full overflow-hidden ring-2 ring-brand-500 shadow-sm"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <img src={modalPhoto1} alt="Preview 1" className="w-full h-full object-cover" />
                      </div>
                      <div
                        className="absolute inset-0 w-full h-full rounded-full overflow-hidden ring-2 ring-purple-500 shadow-sm"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <img src={modalPhoto2} alt="Preview 2" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-dark-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAvatarModalOpen(false)}
                  disabled={savingAvatar}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSavePhotos}
                  disabled={savingAvatar || (!modalPhoto1 && !modalPhoto2)}
                  className="rounded-xl font-bold"
                >
                  {savingAvatar ? 'Saving...' : 'Save Photos'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 MODAL 1: HOW CODING SCORE IS CALCULATED */}
      {/* ========================================================================= */}
      {isScoreFormulaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Coding Score Calculation Formula</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsScoreFormulaModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <span className="text-xs font-mono font-black block uppercase tracking-wider">Formula</span>
                <p className="text-xs font-mono font-bold mt-1">
                  Coding Score = (Solved Basic × 10) + (Easy × 20) + (Medium × 40) + (Hard × 80) + (Daily Streak × 10) + (Articles × 25) + Bonus XP
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white">Point Distribution Weights:</h4>
                <div className="space-y-2 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-dark-850">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">🟢 Easy DSA Problems</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">+20 Points each</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-dark-850">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">🟡 Medium DSA Problems</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">+40 Points each</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-dark-850">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">🔴 Hard DSA Problems</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">+80 Points each</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-dark-850">
                    <span className="font-semibold text-orange-600 dark:text-orange-400">🔥 NEC Daily Learning Streak</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">+10 Points / Day</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-dark-850">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">📝 Published Tutorial Article</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">+25 Points each</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsScoreFormulaModalOpen(false)}
                className="w-full rounded-xl font-bold"
              >
                Got It!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏆 MODAL 2: INSTITUTE LEADERBOARD */}
      {/* ========================================================================= */}
      {isLeaderboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span>Institute Leaderboard</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {leaderboardCollege || 'Ramgarh Engineering College'} Top Students
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaderboardModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {loadingLeaderboard ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading institute standings...</div>
              ) : leaderboardData.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No students found from this institute yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboardData.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => {
                        setIsLeaderboardModalOpen(false);
                        navigate(`/profile/${student.id}`);
                      }}
                      className={cn(
                        'flex items-center justify-between p-3 px-4 rounded-2xl border transition-all cursor-pointer group',
                        student.isCurrentUser
                          ? 'bg-purple-500/10 border-purple-500/40'
                          : 'bg-white dark:bg-dark-850/70 border-slate-100 dark:border-dark-800 hover:border-brand-500/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'w-6 text-center font-mono font-black text-xs',
                          student.rank === 1 ? 'text-amber-500 text-sm' : student.rank === 2 ? 'text-slate-400 text-sm' : student.rank === 3 ? 'text-amber-700 text-sm' : 'text-slate-500'
                        )}>
                          {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : `#${student.rank}`}
                        </span>

                        {student.profileImage && student.profileImage !== '/images/student_avatar.jpg' ? (
                          <img
                            src={student.profileImage}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 dark:ring-dark-800"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px] font-mono shrink-0 ring-2 ring-slate-100 dark:ring-dark-800">
                            {getInitials(student.name)}
                          </div>
                        )}

                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors block">
                            {student.name} {student.isCurrentUser && '(You)'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            🔥 {student.learningStreak}d streak
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-bold text-xs">
                          {student.points} pts
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 MODAL 3: FOLLOWERS & FOLLOWING LIST */}
      {/* ========================================================================= */}
      {socialModalType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" />
                <span>{socialModalType === 'followers' ? 'Followers' : 'Following Students'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSocialModalType(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {loadingSocialList ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading student list...</div>
              ) : socialUsersList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {socialModalType === 'followers' ? 'No followers yet.' : 'Not following any students yet.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {socialUsersList.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => {
                        setSocialModalType(null);
                        navigate(`/profile/${st.id}`);
                      }}
                      className="flex items-center justify-between p-3 px-4 rounded-2xl border border-slate-100 dark:border-dark-800 hover:border-brand-500/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        {st.profileImage && st.profileImage !== '/images/student_avatar.jpg' ? (
                          <img
                            src={st.profileImage}
                            alt={st.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-dark-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs font-mono shrink-0 ring-2 ring-slate-100 dark:ring-dark-800">
                            {getInitials(st.name)}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors block">
                            {st.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[180px] block">
                            {st.college || 'Engineering Institute'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                          {st.points} pts
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
