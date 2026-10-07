import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  EyeOff,
  Star,
  Sparkles,
  ShieldCheck,
  Users,
  Award,
  UserCheck,
  ExternalLink,
  Mail,
  Phone,
  Copy,
  Check,
  Upload,
  Link2,
  X,
  Camera,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminMentorItem } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { compressImageFile } from '../../utils/imageUpload';

export const AdminMentorsPage: React.FC = () => {
  const [mentors, setMentors] = useState<AdminMentorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: toastSuccess, error: toastError } = useToast();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<AdminMentorItem | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [exCompaniesStr, setExCompaniesStr] = useState('');
  const [image, setImage] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteBody, setQuoteBody] = useState('');
  const [signature, setSignature] = useState('');
  const [experience, setExperience] = useState('10+ Yrs Tech Lead');
  const [studentsMentored, setStudentsMentored] = useState('1M+ Learners');
  const [placements, setPlacements] = useState('500+ Tier-1 Offers');
  const [rating, setRating] = useState('4.98 / 5.0');
  const [order, setOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  // Created Credentials Modal State
  const [createdCredentials, setCreatedCredentials] = useState<{
    mentorName: string;
    email: string;
    phone: string;
    generatedPassword: string;
    loginUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMentor, setDeletingMentor] = useState<AdminMentorItem | null>(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const res = await adminService.getMentors();
      setMentors(res.mentors || []);
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
    } finally {
      setLoading(false);
    }
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
      setImageInputMode('upload');
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

  const handleOpenCreate = () => {
    setEditingMentor(null);
    setName('');
    setRole('');
    setEmail('');
    setPhone('');
    setExCompaniesStr('Amazon, Microsoft');
    setImage('/images/mentor_lead.jpg');
    setImageInputMode('upload');
    setQuoteTitle('Transforming Learners into Industry Leaders.');
    setQuoteBody(
      'From startups to tech giants, "We bridge the gap between learning and doing". Through real-world challenges, personalized mentorship, and a thriving community, we empower developers to ship products that matter.'
    );
    setSignature('');
    setExperience('10+ Yrs Tech Lead');
    setStudentsMentored('1M+ Learners');
    setPlacements('500+ Tier-1 Offers');
    setRating('4.98 / 5.0');
    setOrder(mentors.length + 1);
    setIsPublished(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (m: AdminMentorItem) => {
    setEditingMentor(m);
    setName(m.name);
    setRole(m.role);
    setEmail(m.email || '');
    setPhone(m.phone || '');
    setExCompaniesStr((m.exCompanies || []).join(', '));
    setImage(m.image || '');
    setImageInputMode(m.image?.startsWith('data:image') ? 'upload' : 'url');
    setQuoteTitle(m.quoteTitle || '');
    setQuoteBody(m.quoteBody || '');
    setSignature(m.signature || m.name);
    setExperience(m.experience || '10+ Yrs');
    setStudentsMentored(m.studentsMentored || '1M+ Learners');
    setPlacements(m.placements || '500+ Offers');
    setRating(m.rating || '4.98 / 5.0');
    setOrder(m.order || 1);
    setIsPublished(m.isPublished);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !quoteTitle.trim() || !quoteBody.trim()) {
      toastError('Please fill in all required fields marked with *');
      return;
    }
    if (!email.trim()) {
      toastError('Mentor email address is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toastError('Please enter a valid email address');
      return;
    }
    if (!phone.trim()) {
      toastError('Mentor phone number is required');
      return;
    }
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 5) {
      toastError('Phone number must contain at least 5 digits to generate password');
      return;
    }

    try {
      setSaving(true);
      const exCompanies = exCompaniesStr
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const payload: Partial<AdminMentorItem> = {
        name: name.trim(),
        role: role.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        exCompanies,
        image: image.trim(),
        quoteTitle: quoteTitle.trim(),
        quoteBody: quoteBody.trim(),
        signature: signature.trim() || name.trim(),
        experience: experience.trim(),
        studentsMentored: studentsMentored.trim(),
        placements: placements.trim(),
        rating: rating.trim(),
        order: Number(order) || 1,
        isPublished,
      };

      if (editingMentor) {
        await adminService.updateMentor(editingMentor.id, payload);
        toastSuccess('Mentor profile updated successfully!');
      } else {
        const res = await adminService.createMentor(payload);
        toastSuccess('Mentor profile created! Welcome email dispatched.');
        if (res.credentials) {
          setCreatedCredentials({
            mentorName: payload.name || name,
            email: res.credentials.email,
            phone: res.credentials.phone,
            generatedPassword: res.credentials.generatedPassword,
            loginUrl: res.credentials.loginUrl || '/login',
          });
        }
      }

      setModalOpen(false);
      fetchMentors();
    } catch (err: any) {
      console.error('Failed to save mentor:', err);
      toastError(err.response?.data?.message || 'Failed to save mentor');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (m: AdminMentorItem) => {
    try {
      await adminService.updateMentor(m.id, { isPublished: !m.isPublished });
      fetchMentors();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingMentor) return;
    try {
      await adminService.deleteMentor(deletingMentor.id);
      fetchMentors();
    } catch (err) {
      console.error('Failed to delete mentor:', err);
    }
  };

  const columns: Column<AdminMentorItem>[] = [
    {
      header: 'Mentor',
      render: (row) => (
        <Link
          to={`/admin/mentors/${row.id}`}
          className="flex items-center gap-3 group hover:opacity-95 transition-opacity"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 group-hover:border-brand-500 transition-colors">
            {row.image ? (
              <img
                src={row.image}
                alt={row.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              row.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition-colors">
                {row.name}
              </p>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.role}</p>
            {row.email && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>{row.email}</span>
                {row.phone && <span className="text-slate-600 dark:text-slate-400">• {row.phone}</span>}
              </p>
            )}
            {row.signature && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5">Signature: ~ {row.signature}</p>
            )}
          </div>
        </Link>
      ),
    },
    {
      header: 'Ex-Companies',
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.exCompanies && row.exCompanies.length > 0 ? (
            row.exCompanies.map((comp) => (
              <span
                key={comp}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                ex-{comp}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">None</span>
          )}
        </div>
      ),
    },
    {
      header: 'Key Metrics',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span>{row.studentsMentored}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>{row.placements}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
            <Star className="w-3 h-3 fill-current" />
            <span>{row.rating}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Quote Preview',
      render: (row) => (
        <div className="max-w-xs space-y-0.5">
          <p className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate">{row.quoteTitle}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">"{row.quoteBody}"</p>
        </div>
      ),
    },
    {
      header: 'Order',
      render: (row) => (
        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          #{row.order || 0}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <AdminStatusBadge status={row.isPublished} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/admin/mentors/${row.id}`}
            className="p-1.5 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors cursor-pointer"
            title="View Full Profile Dossier"
          >
            <UserCheck className="w-4 h-4" />
          </Link>
          <Link
            to={`/mentors/${row.id}`}
            target="_blank"
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="View Public Profile"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <Link
            to="/admin/sub-admins"
            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
            title="Appoint or Manage as Sub-Admin"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleTogglePublish(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={row.isPublished ? 'Unpublish Mentor' : 'Publish Mentor'}
          >
            {row.isPublished ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Mentor"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setDeletingMentor(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Mentor"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Meet Your Mentors & Leadership CMS"
        description="Manage instructor profiles, background credentials, industry experiences, and inspirational quotes displayed on the public website."
        breadcrumbs={[{ label: 'Mentors' }]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/admin/sub-admins">
              <Button
                variant="outline"
                className="w-full sm:w-auto shrink-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
              >
                Sub Admins Module
              </Button>
            </Link>
            <Button
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
              className="w-full sm:w-auto shrink-0 shadow-md shadow-amber-500/20"
            >
              Add Mentor
            </Button>
          </div>
        }
      />

      <AdminDataTable
        columns={columns}
        data={mentors}
        loading={loading}
        emptyTitle="No mentors registered yet"
        emptyDescription="Add expert mentors and leaders to display in the homepage showcase."
        emptyAction={
          <Button onClick={handleOpenCreate} size="md" className="shadow-md shadow-amber-500/20">
            <Plus className="w-4 h-4 stroke-[2.5] mr-1.5" />
            <span>Add Mentor</span>
          </Button>
        }
      />

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 flex items-start justify-center pt-8 sm:pt-14 pb-16 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-auto sm:my-0 animate-scale-up">
            {/* Modal Sticky Header */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingMentor ? 'Edit Mentor Profile' : 'Add New Mentor Profile'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Manage mentor credentials, bio, profile photo and homepage highlight quotes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4.5 overflow-y-auto max-h-[calc(88vh-140px)]">
                {/* Row 1: Name & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mentor Full Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g., Lakshay Kumar"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Designation / Role <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      placeholder="e.g., Founder & Principal Engineering Mentor"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Row 1.5: Email & Phone (Mandatory with star mark) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Mentor Email Address <span className="text-rose-500 font-bold">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">Login & Welcome Mail</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="e.g., mentor@nexteracoders.com"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Phone Number <span className="text-rose-500 font-bold">*</span></span>
                      <span className="text-[10px] text-emerald-500 font-bold font-mono">Password Seed</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="e.g., 9876543210"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Password Generation Preview Banner */}
                {!editingMentor && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-brand-500/10 to-indigo-500/10 border border-emerald-500/30 text-xs text-slate-700 dark:text-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Auto-Generated Mentor Password Formula:</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Format: <code className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono font-bold">NEC@mentor{'<'}mobile start 5 digits{'>'}</code>.
                      Mentor will receive this in their congratulatory welcome email and can change it after logging in.
                    </p>
                    {phone.replace(/\D/g, '').length >= 5 ? (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Generated Password:</span>
                        <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
                          NEC@mentor{(phone.replace(/\D/g, '').length === 12 && phone.replace(/\D/g, '').startsWith('91') ? phone.replace(/\D/g, '').slice(2, 7) : (phone.replace(/\D/g, '').length === 11 && phone.replace(/\D/g, '').startsWith('0') ? phone.replace(/\D/g, '').slice(1, 6) : phone.replace(/\D/g, '').slice(0, 5)))}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-medium">✓ Will be emailed upon submit</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-500 italic">
                        Type at least 5 digits in Phone Number to view password preview.
                      </p>
                    )}
                  </div>
                )}

                {/* Ex-Companies */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ex-Companies (comma separated)
                  </label>
                  <input
                    type="text"
                    value={exCompaniesStr}
                    onChange={(e) => setExCompaniesStr(e.target.value)}
                    placeholder="e.g., Amazon, Microsoft, Google"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Mentor Profile Photo Section (Device Upload + URL Mode) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Mentor Profile Photo
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Upload directly from your device or specify an image URL
                      </p>
                    </div>

                    {/* Mode switcher tabs */}
                    <div className="flex items-center bg-slate-200/80 dark:bg-slate-900/80 p-0.5 rounded-lg text-xs font-medium border border-slate-300/50 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                          imageInputMode === 'upload'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Device</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                          imageInputMode === 'url'
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

                    {/* Mode Controls */}
                    <div className="flex-1 w-full space-y-2">
                      {imageInputMode === 'upload' ? (
                        <div className="space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={imageUploading}
                              onClick={() => fileInputRef.current?.click()}
                              leftIcon={<Upload className="w-4 h-4 text-amber-500" />}
                              className="bg-white dark:bg-slate-900 border-amber-500/40 text-slate-800 dark:text-slate-100 hover:bg-amber-500/10 cursor-pointer shadow-xs"
                            >
                              {imageUploading ? 'Optimizing Photo...' : image ? 'Choose Different Photo' : 'Browse Photo from Device'}
                            </Button>
                            {image && (
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Photo Loaded
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Supports PNG, JPG, JPEG & WebP. Automatically compressed for lightning-fast loading (max 10MB).
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="/images/mentor_lead.jpg or https://images.unsplash.com/..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
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

                {/* Row 3: Quote Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Inspiring Headline / Quote Title *
                  </label>
                  <input
                    type="text"
                    value={quoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    required
                    placeholder="e.g., Transforming Learners into Industry Leaders."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Row 4: Quote Body */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mentorship Philosophy & Body Text *
                  </label>
                  <textarea
                    value={quoteBody}
                    onChange={(e) => setQuoteBody(e.target.value)}
                    required
                    rows={3}
                    placeholder="Share the mentor's vision, philosophy, and real-world approach..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Row 5: Signature & Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Signature Text
                    </label>
                    <input
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="e.g., Lakshay Kumar"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Experience Badge
                    </label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g., 10+ Yrs Tech Lead"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Row 6: Stats & Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Students Mentored
                    </label>
                    <input
                      type="text"
                      value={studentsMentored}
                      onChange={(e) => setStudentsMentored(e.target.value)}
                      placeholder="e.g., 1M+ Learners"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Placements Count
                    </label>
                    <input
                      type="text"
                      value={placements}
                      onChange={(e) => setPlacements(e.target.value)}
                      placeholder="e.g., 500+ Tier-1 Offers"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rating Score
                    </label>
                    <input
                      type="text"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      placeholder="e.g., 4.98 / 5.0"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Row 7: Order & Publish */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                      min={1}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 sm:pt-5">
                    <input
                      type="checkbox"
                      id="mentor-publish"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="mentor-publish" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Display mentor in homepage carousel
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Fields marked with <span className="text-rose-500 font-bold">*</span> are required
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : editingMentor ? 'Save Changes' : 'Add Mentor'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Mentor Profile?"
        itemName={deletingMentor?.name}
        description="Permanently remove this mentor from the leadership showcase."
      />
      {/* Created Credentials Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Mentor Onboarded Successfully! 🎉
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                <strong>{createdCredentials.mentorName}</strong> has been added to the mentor catalog. A welcome email with login instructions has been dispatched.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Mentor Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{createdCredentials.mentorName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Login Email</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{createdCredentials.email}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Phone</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{createdCredentials.phone}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Initial Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                    {createdCredentials.generatedPassword}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.generatedPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    title="Copy Password"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                The mentor can log in immediately at <strong>{createdCredentials.loginUrl}</strong> using this email and password, and change their password anytime in their profile.
              </span>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => setCreatedCredentials(null)}
            >
              Done & Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
