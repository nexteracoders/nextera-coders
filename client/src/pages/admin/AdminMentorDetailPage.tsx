import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  Users,
  Award,
  BookOpen,
  Briefcase,
  Edit3,
  Key,
  Globe,
  EyeOff,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Linkedin,
  Twitter,
  Github,
  Youtube,
  Tag,
  Upload,
  Link2,
  Camera,
  Check,
  X,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminMentorDossier, AdminMentorItem } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { useToast } from '../../components/ui/Toast';
import { ROUTES } from '../../constants/routes';
import { compressImageFile } from '../../utils/imageUpload';

export const AdminMentorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [dossier, setDossier] = useState<AdminMentorDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'followers' | 'security'>('overview');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editExCompanies, setEditExCompanies] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editImageMode, setEditImageMode] = useState<'upload' | 'url'>('upload');
  const [editImageUploading, setEditImageUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [editQuoteTitle, setQuoteTitle] = useState('');
  const [editQuoteBody, setQuoteBody] = useState('');
  const [editSignature, setEditSignature] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editStudentsMentored, setEditStudentsMentored] = useState('');
  const [editPlacements, setEditPlacements] = useState('');
  const [editRating, setEditRating] = useState('');
  const [editOrder, setEditOrder] = useState<number>(1);
  const [editIsPublished, setEditIsPublished] = useState<boolean>(true);
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editYoutube, setEditYoutube] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Reset Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMentorDossier();
    }
  }, [id]);

  const fetchMentorDossier = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getMentorById(id);
      setDossier(data);
      populateEditForm(data.mentor);
    } catch (err: any) {
      console.error('Failed to fetch mentor dossier:', err);
      setError(err.response?.data?.message || 'Mentor not found');
    } finally {
      setLoading(false);
    }
  };

  const handleEditImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setEditImageUploading(true);
      const compressed = await compressImageFile(file, {
        maxDim: 800,
        quality: 0.85,
        maxSizeBytes: 10 * 1024 * 1024,
      });
      setEditImage(compressed);
      setEditImageMode('upload');
      toastSuccess('Mentor profile photo uploaded and optimized from device!');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      toastError(err.message || 'Failed to upload photo from device');
    } finally {
      setEditImageUploading(false);
      if (editFileInputRef.current) {
        editFileInputRef.current.value = '';
      }
    }
  };

  const populateEditForm = (mentor: AdminMentorItem) => {
    setEditName(mentor.name || '');
    setEditRole(mentor.role || '');
    setEditEmail(mentor.email || '');
    setEditPhone(mentor.phone || '');
    setEditBio(mentor.bio || '');
    setEditSkills((mentor.skills || []).join(', '));
    setEditExCompanies((mentor.exCompanies || []).join(', '));
    setEditImage(mentor.image || '');
    setEditImageMode(mentor.image?.startsWith('data:image') ? 'upload' : 'url');
    setQuoteTitle(mentor.quoteTitle || '');
    setQuoteBody(mentor.quoteBody || '');
    setEditSignature(mentor.signature || mentor.name || '');
    setEditExperience(mentor.experience || '5+ Yrs');
    setEditStudentsMentored(mentor.studentsMentored || '100k+ Learners');
    setEditPlacements(mentor.placements || 'Top Offers');
    setEditRating(mentor.rating || '4.95 / 5.0');
    setEditOrder(mentor.order || 1);
    setEditIsPublished(mentor.isPublished);
    setEditLinkedin(mentor.socialLinks?.linkedin || '');
    setEditTwitter(mentor.socialLinks?.twitter || mentor.socialLinks?.x || '');
    setEditGithub(mentor.socialLinks?.github || '');
    setEditYoutube(mentor.socialLinks?.youtube || '');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editName.trim() || !editRole.trim()) return;

    try {
      setSavingProfile(true);
      const exCompanies = editExCompanies
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const skills = editSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: Partial<AdminMentorItem> = {
        name: editName.trim(),
        role: editRole.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        bio: editBio.trim(),
        skills,
        exCompanies,
        image: editImage.trim(),
        quoteTitle: editQuoteTitle.trim(),
        quoteBody: editQuoteBody.trim(),
        signature: editSignature.trim(),
        experience: editExperience.trim(),
        studentsMentored: editStudentsMentored.trim(),
        placements: editPlacements.trim(),
        rating: editRating.trim(),
        order: Number(editOrder) || 1,
        isPublished: editIsPublished,
        socialLinks: {
          linkedin: editLinkedin.trim(),
          twitter: editTwitter.trim(),
          x: editTwitter.trim(),
          github: editGithub.trim(),
          youtube: editYoutube.trim(),
        },
      };

      await adminService.updateMentor(id, payload);
      toastSuccess('Mentor profile updated successfully');
      setEditModalOpen(false);
      fetchMentorDossier();
    } catch (err: any) {
      console.error('Failed to update mentor:', err);
      toastError(err.response?.data?.message || 'Failed to update mentor profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!id || !dossier?.mentor) return;
    try {
      const nextStatus = !dossier.mentor.isPublished;
      await adminService.updateMentor(id, { isPublished: nextStatus });
      toastSuccess(nextStatus ? 'Mentor published to website' : 'Mentor unpublished');
      fetchMentorDossier();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || newPassword.length < 8) {
      toastError('Password must be at least 8 characters long');
      return;
    }

    try {
      setSavingPassword(true);
      await adminService.resetMentorPassword(id, newPassword);
      toastSuccess('Mentor password has been reset successfully');
      setPasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteMentor = async () => {
    if (!id) return;
    try {
      await adminService.deleteMentor(id);
      toastSuccess('Mentor deleted successfully');
      navigate(ROUTES.ADMIN_MENTORS);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete mentor');
    } finally {
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !dossier?.mentor) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-rose-500 dark:text-rose-400 font-semibold mb-4">{error || 'Mentor not found'}</p>
        <Link
          to={ROUTES.ADMIN_MENTORS}
          className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Mentors Directory</span>
        </Link>
      </div>
    );
  }

  const mentor = dossier.mentor;
  const followers = dossier.recentFollowers || [];
  const courses = dossier.courses || [];
  const linkedUser = dossier.linkedUser;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <AdminPageHeader
        title={`${mentor.name}'s Profile Dossier`}
        description="Comprehensive mentor governance, pedagogy credentials, assigned courses, followers, and security controls."
        breadcrumbs={[{ label: 'Mentors', path: ROUTES.ADMIN_MENTORS }, { label: mentor.name }]}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to={`/mentors/${mentor.id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
              <span>Public Student View</span>
            </Link>

            <button
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Mentor Details</span>
            </button>

            <button
              onClick={() => setPasswordModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Reset Password</span>
            </button>

            <button
              onClick={handleTogglePublish}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {mentor.isPublished ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Unpublish</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Publish Live</span>
                </>
              )}
            </button>

            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        }
      />

      {/* Hero Overview Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 p-1 shrink-0 shadow-lg">
              <div className="w-full h-full rounded-[14px] bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-black text-2xl text-slate-700 dark:text-slate-200">
                {mentor.image ? (
                  <img
                    src={mentor.image}
                    alt={mentor.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  mentor.name.slice(0, 2).toUpperCase()
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {mentor.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Mentor</span>
                </span>
                <AdminStatusBadge status={mentor.isPublished} />
              </div>

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {mentor.role}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                {mentor.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-500" />
                    <span>{mentor.email}</span>
                  </span>
                )}
                {mentor.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{mentor.phone}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created {new Date(mentor.createdAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Ex-Companies Chips */}
          <div className="flex flex-col md:items-end gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Experience Background
            </span>
            <div className="flex flex-wrap gap-1.5 max-w-xs md:justify-end">
              {mentor.exCompanies && mentor.exCompanies.length > 0 ? (
                mentor.exCompanies.map((comp) => (
                  <span
                    key={comp}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    ex-{comp}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">NextEra Engineering Faculty</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Key Metrics Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Rating</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {mentor.rating || '4.95 / 5.0'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Learners</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {mentor.studentsMentored || '100k+'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-sky-500 mb-1">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Experience</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {mentor.experience || '5+ Yrs'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Placements</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {mentor.placements || 'Top Offers'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-purple-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Followers</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {mentor.followersCount || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Courses</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {courses.length}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Overview & Bio
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Courses Taught ({courses.length})
        </button>

        <button
          onClick={() => setActiveTab('followers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'followers'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Student Followers ({mentor.followersCount || 0})
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Security & Account
        </button>
      </div>

      {/* Tab 1: Overview & Bio */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Biography & Philosophy */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>Biography & Mentorship Philosophy</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {mentor.bio ||
                  'No extended biography provided yet. Edit this profile to share background, technical specializations, and engineering accomplishments.'}
              </p>
            </div>

            {/* Quote Spotlight Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Homepage Spotlight Quote
              </h3>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                "{mentor.quoteTitle}"
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                "{mentor.quoteBody}"
              </p>
              {mentor.signature && (
                <div className="pt-2 text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                  ~ {mentor.signature}
                </div>
              )}
            </div>

            {/* Skills & Domains of Expertise */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                <span>Technical Domains & Expertise</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {mentor.skills && mentor.skills.length > 0 ? (
                  mentor.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No specific skills listed. Edit profile to add skills.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Account Details & Social Links */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Contact & Account Details
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Official Email:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 break-all">
                    {mentor.email || 'Not configured'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Direct Phone:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {mentor.phone || 'Not configured'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Catalog Sort Order:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    #{mentor.order || 1}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Linked Platform Account:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {linkedUser ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active User ({linkedUser.role})</span>
                      </span>
                    ) : (
                      <span className="text-amber-500">Standalone Faculty Record</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media Profiles */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Public Social Links
              </h3>
              <div className="space-y-2">
                {mentor.socialLinks?.linkedin && (
                  <a
                    href={mentor.socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-sky-600" />
                    <span className="truncate">{mentor.socialLinks.linkedin}</span>
                  </a>
                )}
                {(mentor.socialLinks?.twitter || mentor.socialLinks?.x) && (
                  <a
                    href={mentor.socialLinks.twitter || mentor.socialLinks.x}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 transition-colors"
                  >
                    <Twitter className="w-4 h-4 text-sky-400" />
                    <span className="truncate">{mentor.socialLinks.twitter || mentor.socialLinks.x}</span>
                  </a>
                )}
                {mentor.socialLinks?.github && (
                  <a
                    href={mentor.socialLinks.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 transition-colors"
                  >
                    <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                    <span className="truncate">{mentor.socialLinks.github}</span>
                  </a>
                )}
                {mentor.socialLinks?.youtube && (
                  <a
                    href={mentor.socialLinks.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 transition-colors"
                  >
                    <Youtube className="w-4 h-4 text-rose-600" />
                    <span className="truncate">{mentor.socialLinks.youtube}</span>
                  </a>
                )}
                {!mentor.socialLinks?.linkedin &&
                  !mentor.socialLinks?.twitter &&
                  !mentor.socialLinks?.github &&
                  !mentor.socialLinks?.youtube && (
                    <p className="text-xs text-slate-400">No social links configured yet.</p>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Courses Taught */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Courses Authored or Taught by {mentor.name}
            </h3>
          </div>

          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, idx) => (
                <div
                  key={course.slug || idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 uppercase">
                        {course.category}
                      </span>
                      <AdminStatusBadge status={course.isPublished} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                      {course.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Level: {course.level}
                    </p>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-4">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      ₹{course.proPrice || course.originalPrice || 0}
                    </div>
                    <Link
                      to={`/courses/${course.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <span>View Course</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No courses linked yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Courses where this instructor's name matches will automatically appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Followers & Students */}
      {activeTab === 'followers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Students Following {mentor.name} ({mentor.followersCount || 0})
            </h3>
          </div>

          {followers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {followers.map((f, idx) => (
                <div
                  key={f.id || f._id || idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs">
                    {f.profileImage ? (
                      <img src={f.profileImage} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      f.name?.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {f.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{f.email}</p>
                    <span className="text-[10px] text-slate-400">
                      {f.college || 'Engineering Student'}
                    </span>
                  </div>
                  <Link
                    to={`/admin/students/${f.id || f._id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="View Student Dossier"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No followers yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Students can follow this mentor on their public profile.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Security & Account */}
      {activeTab === 'security' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span>Mentor Portal Access & Credentials</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mentors can log in via the regular NextEra login portal using their email and password to view their faculty profile, manage courses, and update teaching details.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Login Email:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {mentor.email || 'None configured'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Account Status:</span>
                <span className="text-emerald-500 font-bold">Enabled</span>
              </div>
            </div>

            <button
              onClick={() => setPasswordModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors cursor-pointer"
            >
              Set New Mentor Password
            </button>
          </div>
        </div>
      )}

      {/* Edit Mentor Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 flex items-start justify-center pt-8 sm:pt-14 pb-16 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto sm:my-0 animate-scale-up">
            {/* Modal Sticky Header */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Edit Mentor Profile
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Update dossier records, upload new profile photo, and adjust public credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4.5 overflow-y-auto max-h-[calc(88vh-140px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mentor Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Professional Role / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ex-Companies (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="NextEra Coders, Google, Microsoft"
                    value={editExCompanies}
                    onChange={(e) => setEditExCompanies(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                {/* Mentor Profile Photo Section with Device Upload & Web URL Modes */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Mentor Profile Photo
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Upload directly from device or specify an image URL
                      </p>
                    </div>

                    <div className="flex items-center bg-slate-200/80 dark:bg-slate-900/80 p-0.5 rounded-lg text-xs font-medium border border-slate-300/50 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setEditImageMode('upload')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                          editImageMode === 'upload'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Device</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditImageMode('url')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                          editImageMode === 'url'
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
                        {editImage ? (
                          <img
                            src={editImage}
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
                      {editImage && (
                        <button
                          type="button"
                          onClick={() => setEditImage('')}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-xs shadow-md transition-transform hover:scale-110 cursor-pointer"
                          title="Remove Photo"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      {editImageMode === 'upload' ? (
                        <div className="space-y-2">
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            onChange={handleEditImageFileUpload}
                            className="hidden"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={editImageUploading}
                              onClick={() => editFileInputRef.current?.click()}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-amber-500/40 text-slate-800 dark:text-slate-100 hover:bg-amber-500/10 cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5 text-amber-500" />
                              <span>{editImageUploading ? 'Compressing...' : editImage ? 'Change Photo from Device' : 'Browse Photo from Device'}</span>
                            </button>
                            {editImage && (
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
                            value={editImage}
                            onChange={(e) => setEditImage(e.target.value)}
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
                                onClick={() => setEditImage(p.url)}
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Skills & Domains (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="DSA, System Design, React, Node.js"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Extended Bio
                  </label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Signature Title
                  </label>
                  <input
                    type="text"
                    value={editSignature}
                    onChange={(e) => setEditSignature(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Rating
                    </label>
                    <input
                      type="text"
                      value={editRating}
                      onChange={(e) => setEditRating(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Learners
                    </label>
                    <input
                      type="text"
                      value={editStudentsMentored}
                      onChange={(e) => setEditStudentsMentored(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Experience
                    </label>
                    <input
                      type="text"
                      value={editExperience}
                      onChange={(e) => setEditExperience(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Placements
                    </label>
                    <input
                      type="text"
                      value={editPlacements}
                      onChange={(e) => setEditPlacements(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Spotlight Quote Title
                  </label>
                  <input
                    type="text"
                    value={editQuoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Spotlight Quote Body
                  </label>
                  <textarea
                    rows={2}
                    value={editQuoteBody}
                    onChange={(e) => setQuoteBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={editIsPublished}
                      onChange={(e) => setEditIsPublished(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Published on Live Website</span>
                  </label>
                </div>
              </div>

              {/* Actions Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  All profile changes reflect immediately on public pages
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {savingProfile ? 'Saving Changes...' : 'Save Mentor Profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Set New Mentor Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter a new password for {mentor.name}. This will update their login credentials immediately.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (min. 8 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer disabled:opacity-50"
                >
                  {savingPassword ? 'Resetting...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteMentor}
        title={`Delete Mentor "${mentor.name}"`}
        itemName={mentor.name}
        description="Are you sure you want to delete this mentor record? This action will remove the mentor from the catalog and platform."
      />
    </div>
  );
};
