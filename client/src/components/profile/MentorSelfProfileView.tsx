import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Star,
  Users,
  BookOpen,
  Briefcase,
  Key,
  Edit3,
  ExternalLink,
  Mail,
  Phone,
  Sparkles,
  Eye,
  EyeOff,
  Tag,
  Share2,
  Upload,
  Link2,
  Camera,
  Check,
} from 'lucide-react';
import { mentorService, MentorItem, MentorCourseItem } from '../../services/mentor.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { Section } from '../ui/Section';
import { compressImageFile } from '../../utils/imageUpload';

export const MentorSelfProfileView: React.FC = () => {
  const { user: currentUser, updateProfile } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [mentor, setMentor] = useState<MentorItem | null>(null);
  const [courses, setCourses] = useState<MentorCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'followers' | 'edit' | 'security'>('overview');

  // Edit Profile Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [exCompanies, setExCompanies] = useState('');
  const [image, setImage] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteBody, setQuoteBody] = useState('');
  const [signature, setSignature] = useState('');
  const [experience, setExperience] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [youtube, setYoutube] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchMentorProfile();
  }, []);

  const fetchMentorProfile = async () => {
    try {
      setLoading(true);
      const res = await mentorService.getMentorMe();
      setMentor(res.mentor);
      populateForm(res.mentor);

      // Also fetch courses taught by this mentor
      if (res.mentor.id) {
        const publicRes = await mentorService.getMentorById(res.mentor.id);
        setCourses(publicRes.courses || []);
      }
    } catch (err: any) {
      console.error('Failed to load mentor self-profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (m: MentorItem) => {
    setName(m.name || currentUser?.name || '');
    setRole(m.role || 'Engineering Mentor & Instructor');
    setPhone(m.phone || currentUser?.phone || '');
    setBio(m.bio || currentUser?.bio || '');
    setSkills((m.skills || currentUser?.skills || []).join(', '));
    setExCompanies((m.exCompanies || []).join(', '));
    setImage(m.image || currentUser?.profileImage || '');
    setImageMode((m.image || currentUser?.profileImage || '').startsWith('data:image') ? 'upload' : 'url');
    setQuoteTitle(m.quoteTitle || '');
    setQuoteBody(m.quoteBody || '');
    setSignature(m.signature || m.name || '');
    setExperience(m.experience || '5+ Yrs');
    setLinkedin(m.socialLinks?.linkedin || currentUser?.linkedin || '');
    setTwitter(m.socialLinks?.twitter || m.socialLinks?.x || '');
    setGithub(m.socialLinks?.github || currentUser?.github || '');
    setYoutube(m.socialLinks?.youtube || '');
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const compressed = await compressImageFile(file, {
        maxDim: 800,
        quality: 0.85,
        maxSizeBytes: 10 * 1024 * 1024,
      });
      setImage(compressed);
      setImageMode('upload');
      toastSuccess('Mentor profile photo uploaded and optimized from device!');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      toastError(err.message || 'Failed to upload photo from device');
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Name is required');
      return;
    }

    try {
      setSavingProfile(true);
      const payload: Partial<MentorItem> = {
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        image: image.trim(),
        quoteTitle: quoteTitle.trim(),
        quoteBody: quoteBody.trim(),
        signature: signature.trim(),
        experience: experience.trim(),
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        exCompanies: exCompanies
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        socialLinks: {
          linkedin: linkedin.trim(),
          twitter: twitter.trim(),
          x: twitter.trim(),
          github: github.trim(),
          youtube: youtube.trim(),
        },
      };

      const res = await mentorService.updateMentorMe(payload);
      setMentor(res.mentor);
      try {
        if (updateProfile) {
          await updateProfile({
            name: res.mentor.name,
            profileImage: res.mentor.image,
            bio: res.mentor.bio,
            skills: res.mentor.skills,
          });
        }
      } catch {
        // Redux state sync fallback
      }
      toastSuccess('Mentor profile updated successfully!');
      setActiveTab('overview');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      toastError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New password and confirm password do not match');
      return;
    }

    try {
      setSavingPassword(true);
      await mentorService.changeMentorPassword(currentPassword, newPassword);
      toastSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('overview');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleShare = () => {
    if (!mentor) return;
    const url = `${window.location.origin}/mentors/${mentor.id}`;
    navigator.clipboard.writeText(url);
    toastSuccess('Public mentor link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading mentor dashboard...</p>
        </div>
      </div>
    );
  }

  const mentorData = mentor || ({} as MentorItem);

  return (
    <div className="min-h-screen pb-20 pt-6">
      <Section containerSize="xl">
        {/* Mentor Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-8 mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Profile Avatar */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 p-1 shrink-0 shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-slate-900 overflow-hidden flex items-center justify-center font-black text-3xl text-slate-200">
                  {mentorData.image ? (
                    <img
                      src={mentorData.image}
                      alt={mentorData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    (mentorData.name || currentUser?.name || 'M').slice(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              {/* Basic Details */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {mentorData.name || currentUser?.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Faculty & Mentor</span>
                  </span>
                </div>

                <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                  {mentorData.role || 'Engineering Mentor'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-500" />
                    <span>{mentorData.email || currentUser?.email}</span>
                  </span>
                  {mentorData.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{mentorData.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
              {mentorData.id && (
                <a
                  href={`/mentors/${mentorData.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                  <span>Public View</span>
                </a>
              )}

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                onClick={() => setActiveTab('edit')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Rating</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {mentorData.rating || '4.95 / 5.0'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Learners</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {mentorData.studentsMentored || '100k+'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1 text-sky-500 mb-1">
              <Briefcase className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Experience</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {mentorData.experience || '5+ Yrs'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Followers</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {mentorData.followersCount || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Courses</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {courses.length}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Overview & Philosophy
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'courses'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            My Courses ({courses.length})
          </button>

          <button
            onClick={() => setActiveTab('followers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'followers'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Student Followers ({mentorData.followersCount || 0})
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'edit'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Edit Profile
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Bio Card */}
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <span>Bio & Mentorship Vision</span>
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {mentorData.bio || 'Add your engineering bio and accomplishments in the Edit Profile tab.'}
                </p>
              </div>

              {/* Spotlight Quote Card */}
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 p-6 sm:p-8 shadow-xs space-y-2">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Featured Quote
                </h4>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  "{mentorData.quoteTitle || 'Transforming Learners into Industry Leaders.'}"
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  "{mentorData.quoteBody || 'Bridging the gap between learning and building high-impact tech.'}"
                </p>
                {mentorData.signature && (
                  <div className="pt-2 text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                    ~ {mentorData.signature}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Technical Domains & Socials */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-500" />
                  <span>Domains & Skills</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mentorData.skills && mentorData.skills.length > 0 ? (
                    mentorData.skills.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No skills listed yet.</p>
                  )}
                </div>
              </div>

              {/* Ex-companies */}
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Career Background
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {mentorData.exCompanies && mentorData.exCompanies.length > 0 ? (
                    mentorData.exCompanies.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        ex-{c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">NextEra Coders Faculty</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Courses */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              My Courses & Curricula ({courses.length})
            </h3>

            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course, idx) => (
                  <div
                    key={course.slug || idx}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 uppercase">
                        {course.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                        {course.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">Level: {course.level}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        ₹{course.proPrice || course.originalPrice || 0}
                      </span>
                      <a
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <span>View Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No courses currently assigned to your instructor profile.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Followers */}
        {activeTab === 'followers' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Students Following You ({mentorData.followersCount || 0})
            </h3>
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-base font-black text-slate-900 dark:text-white">{mentorData.followersCount || 0} Active Followers</p>
              <p className="text-xs text-slate-500 mt-1">
                Students follow you to receive alerts when you launch new courses or hold live problem walkthroughs.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Edit Profile */}
        {activeTab === 'edit' && (
          <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
              Edit Mentor Profile
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Experience (e.g. 10+ Yrs Tech Lead)
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ex-Companies (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="NextEra Coders, Google, Amazon"
                  value={exCompanies}
                  onChange={(e) => setExCompanies(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Skills & Specializations (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="DSA, System Design, React, Go"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Biography & Mentorship Philosophy
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              {/* Mentor Profile Photo Section with Device Upload & Web URL Modes */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Profile Photo
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload directly from your device or specify an image URL
                    </p>
                  </div>

                  <div className="flex items-center bg-slate-200/80 dark:bg-slate-900/80 p-0.5 rounded-lg text-xs font-medium border border-slate-300/50 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                        imageMode === 'upload'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                        imageMode === 'url'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Web URL</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Avatar Preview Box */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700 border-2 border-amber-500/40 shadow-inner flex items-center justify-center">
                      {image ? (
                        <img
                          src={image}
                          alt="Mentor Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/images/mentor_lead.jpg';
                          }}
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <Camera className="w-6 h-6 mx-auto mb-1 opacity-60" />
                          <span className="text-[10px] block font-medium">No Photo</span>
                        </div>
                      )}
                    </div>
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-xs shadow-md transition-transform hover:scale-110 cursor-pointer"
                        title="Remove Photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    {imageMode === 'upload' ? (
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/jpg"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={imageUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-amber-500/40 text-slate-800 dark:text-slate-100 hover:bg-amber-500/10 cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-500" />
                            <span>{imageUploading ? 'Compressing...' : image ? 'Change Photo from Device' : 'Browse Photo from Device'}</span>
                          </button>
                          {image && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Photo Loaded
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Supports PNG, JPG, JPEG & WebP. Automatically compressed for high performance (max 10MB).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          placeholder="/images/mentor_lead.jpg or https://..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-brand-500 font-mono"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400">Presets:</span>
                          {[
                            { label: 'Sandip Verma', url: '/images/sandip_verma.jpg' },
                            { label: 'Naveen Kumar', url: '/images/naveen_kumar.jpg' },
                            { label: 'Default Mentor', url: '/images/mentor_lead.jpg' },
                          ].map((p) => (
                            <button
                              key={p.url}
                              type="button"
                              onClick={() => setImage(p.url)}
                              className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/60 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-slate-600 dark:text-slate-300 font-mono cursor-pointer"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Spotlight Quote Title
                  </label>
                  <input
                    type="text"
                    value={quoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Signature Title
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Spotlight Quote Body
                </label>
                <textarea
                  rows={2}
                  value={quoteBody}
                  onChange={(e) => setQuoteBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GitHub Profile URL
                  </label>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 5: Security / Password Change */}
        {activeTab === 'security' && (
          <div className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span>Change Account Password</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Update your password to keep your mentor portal account secure.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (min 8 chars)
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingPassword ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Section>
    </div>
  );
};
