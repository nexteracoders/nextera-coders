import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  EyeOff,
  Send,
  Radio,
  Mail,
  MessageSquare,
  Bell,
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
  RefreshCw,
  Award,
  Flame,
  UserX,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminAnnouncementItem } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../utils/cn';

interface RetentionStats {
  totalInactive: number;
  eligibleForBlast: number;
  recentlyReminded: number;
  withPhoneCount: number;
  sampleStudents: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    college: string;
    learningStreak: number;
    daysInactive: number;
    lastActiveDate: string;
    remindedRecently: boolean;
    lastRetentionSentAt?: string;
  }>;
}

const PRESET_TEMPLATES = [
  {
    id: 'weekly_contest',
    name: '🏆 Sunday Weekly Contest Live',
    title: 'Sunday Weekly Contest is Now Live!',
    type: 'EVENT',
    link: '/contests',
    audience: 'all' as const,
    message:
      'The Sunday Weekly Contest is officially live on NextEra Coders! Jump into the arena, solve the two algorithmic challenges, and climb the live global leaderboard. Real-time anti-cheat is active.',
  },
  {
    id: 'certificate_ready',
    name: '🎓 Course Certificate Claim',
    title: 'Your Verified Course Certificate is Ready to Claim!',
    type: 'COURSE',
    link: '/certificates',
    audience: 'all' as const,
    message:
      'Congratulations! If you have completed your enrolled course curriculum and milestones, your verified honors certificate is now available to download and add to your LinkedIn profile.',
  },
  {
    id: 'potd_alert',
    name: '⚡ Daily Problem of the Day Sprint',
    title: 'New Problem of the Day Released (+50 Coins Bounty)',
    type: 'GENERAL',
    link: '/problems',
    audience: 'all' as const,
    message:
      "Today's Problem of the Day is live! Maintain your learning streak and collect +50 bonus coins towards the official NextEra Coders Swag Store. Can you solve it on your first submission?",
  },
  {
    id: 'major_feature',
    name: '🚀 Platform Feature Upgrade',
    title: 'Major Upgrade: Real-Time Anti-Cheat & 1vs1 Code Duels',
    type: 'IMPORTANT',
    link: '/explore',
    audience: 'all' as const,
    message:
      'We have launched major updates to the platform including 1vs1 Real-Time Code Duels, Anti-Cheat contest monitoring, and interactive DSA tutorial tracks. Check out what is new today!',
  },
];

export const AdminAnnouncementsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  // Active Tab: 'announcements' | 'broadcast' | 'retention'
  const [activeTab, setActiveTab] = useState<'announcements' | 'broadcast' | 'retention'>('announcements');

  // Announcements Table State
  const [announcements, setAnnouncements] = useState<AdminAnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Single Modal State (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AdminAnnouncementItem | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<string>('GENERAL');
  const [link, setLink] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<AdminAnnouncementItem | null>(null);

  // Broadcast Hub State
  const [broadcastTitle, setBroadcastTitle] = useState('Sunday Weekly Contest is Now Live!');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'The Sunday Weekly Contest is officially live on NextEra Coders! Jump into the arena, solve the two algorithmic challenges, and climb the live global leaderboard. Real-time anti-cheat is active.'
  );
  const [broadcastType, setBroadcastType] = useState('EVENT');
  const [broadcastLink, setBroadcastLink] = useState('/contests');
  const [broadcastChannels, setBroadcastChannels] = useState<string[]>(['in_app', 'email', 'whatsapp']);
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'pro' | 'inactive'>('all');
  const [broadcasting, setBroadcasting] = useState(false);
  const [previewTab, setPreviewTab] = useState<'in_app' | 'email' | 'whatsapp'>('email');

  // 10-Day Retention Hub State
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [blastingRetention, setBlastingRetention] = useState(false);
  const [retentionConfirmOpen, setRetentionConfirmOpen] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (activeTab === 'retention') {
      fetchRetentionStats();
    }
  }, [activeTab]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAnnouncements();
      setAnnouncements(res.announcements || []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRetentionStats = async () => {
    try {
      setRetentionLoading(true);
      const res = await adminService.getInactiveRetentionStats();
      setRetentionStats(res);
    } catch (err: any) {
      toastError(err?.message || 'Failed to fetch inactive retention statistics');
    } finally {
      setRetentionLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setMessage('');
    setType('GENERAL');
    setLink('');
    setIsPublished(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (ann: AdminAnnouncementItem) => {
    setEditingAnnouncement(ann);
    setTitle(ann.title);
    setMessage(ann.message);
    setType(ann.type);
    setLink(ann.link || '');
    setIsPublished(ann.isPublished);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setSaving(true);
      if (editingAnnouncement) {
        await adminService.updateAnnouncement(editingAnnouncement.id, {
          title,
          message,
          type,
          link,
          isPublished,
        });
        success('Announcement updated successfully');
      } else {
        await adminService.createAnnouncement({
          title,
          message,
          type,
          link,
          isPublished,
        });
        success('Announcement created and published');
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (ann: AdminAnnouncementItem) => {
    try {
      await adminService.publishAnnouncement(ann.id);
      success(`Announcement ${ann.isPublished ? 'unpublished' : 'published'} successfully`);
      fetchAnnouncements();
    } catch (err: any) {
      toastError(err?.message || 'Failed to update publish state');
    }
  };

  const handleDelete = async () => {
    if (!deletingAnnouncement) return;
    try {
      await adminService.deleteAnnouncement(deletingAnnouncement.id);
      success('Announcement deleted');
      fetchAnnouncements();
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete announcement');
    }
  };

  // Channel Toggle Helper
  const toggleChannel = (ch: string) => {
    if (broadcastChannels.includes(ch)) {
      if (broadcastChannels.length === 1) {
        toastError('At least one broadcast channel must be selected');
        return;
      }
      setBroadcastChannels(broadcastChannels.filter((c) => c !== ch));
    } else {
      setBroadcastChannels([...broadcastChannels, ch]);
    }
  };

  // Preset Template Loader
  const handleSelectTemplate = (templateId: string) => {
    const tpl = PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setBroadcastTitle(tpl.title);
    setBroadcastMessage(tpl.message);
    setBroadcastType(tpl.type);
    setBroadcastLink(tpl.link);
    setBroadcastAudience(tpl.audience);
    success(`Loaded preset: "${tpl.name}"`);
  };

  // Multi-Channel Broadcast Blast Execution
  const handleExecuteBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toastError('Please provide both title and message for broadcast');
      return;
    }

    try {
      setBroadcasting(true);
      const res = await adminService.broadcastAnnouncement({
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType,
        link: broadcastLink,
        channels: broadcastChannels,
        targetAudience: broadcastAudience,
      });

      success(
        `🎉 Broadcast initiated to ${res.totalAudience} students! (In-App: ${res.delivered.inApp}, Email: ${res.delivered.email}, WhatsApp: ${res.delivered.whatsapp})`
      );
      fetchAnnouncements();
    } catch (err: any) {
      toastError(err?.message || 'Failed to dispatch broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  // 10-Day Retention Blast Execution
  const handleExecuteRetentionBlast = async () => {
    try {
      setBlastingRetention(true);
      setRetentionConfirmOpen(false);
      const res = await adminService.triggerInactiveRetentionBlast();
      success(
        `🚀 Comeback blast dispatched to ${res.eligibleCount} inactive students! (Email: ${res.delivered.email}, WhatsApp: ${res.delivered.whatsapp})`
      );
      fetchRetentionStats();
    } catch (err: any) {
      toastError(err?.message || 'Failed to trigger retention blast');
    } finally {
      setBlastingRetention(false);
    }
  };

  const columns: Column<AdminAnnouncementItem>[] = [
    {
      header: 'Announcement',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{row.title}</span>
            <AdminStatusBadge status={row.type} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{row.message}</p>
          {row.link && (
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-500 mt-1 font-mono">
              <ExternalLink className="w-3 h-3" /> {row.link}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => <AdminStatusBadge status={row.isPublished} />,
    },
    {
      header: 'Created By',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {row.createdBy?.name || 'Administrator'}
        </span>
      ),
    },
    {
      header: 'Date',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(row.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleTogglePublish(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={row.isPublished ? 'Unpublish' : 'Publish sitewide'}
          >
            {row.isPublished ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Globe className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Announcement"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setDeletingAnnouncement(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Announcement"
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
        title="Announcements & Notification Broadcasts"
        description="Unified hub for sitewide alerts, Email broadcasts, WhatsApp message blasts, and 10-day student retention automation."
        breadcrumbs={[{ label: 'Announcements & Broadcasts' }]}
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setActiveTab('broadcast')}
              variant={activeTab === 'broadcast' ? 'primary' : 'outline'}
              className="gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Multi-Channel Blast</span>
            </Button>
            <Button
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
              className="w-full sm:w-auto shrink-0 shadow-md shadow-indigo-500/20"
            >
              New Announcement
            </Button>
          </div>
        }
      />

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('announcements')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer',
            activeTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Bell className="w-4 h-4" />
          <span>Announcements Table</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/20">
            {announcements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer',
            activeTab === 'broadcast'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Send className="w-4 h-4" />
          <span>Multi-Channel Broadcast Blast</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black uppercase tracking-wider">
            Email + WhatsApp
          </span>
        </button>

        <button
          onClick={() => setActiveTab('retention')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer',
            activeTab === 'retention'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>10-Day Inactive Retention Engine</span>
          {retentionStats && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
              {retentionStats.eligibleForBlast} Eligible
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ANNOUNCEMENTS MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-4 animate-fade-in">
          <AdminDataTable
            columns={columns}
            data={announcements}
            loading={loading}
            emptyTitle="No announcements created yet"
            emptyDescription="Create an announcement to broadcast important platform news to student feeds."
            emptyAction={
              <Button onClick={handleOpenCreate} size="md" className="shadow-md shadow-indigo-500/20">
                <Plus className="w-4 h-4 stroke-[2.5] mr-1.5" />
                <span>Create Announcement</span>
              </Button>
            }
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MULTI-CHANNEL BROADCAST CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left Column: Form & Options */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span>Multi-Channel Broadcast Blast</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Dispatch one high-priority message across Email, WhatsApp, and In-App feeds simultaneously.
                  </p>
                </div>
              </div>

              {/* Quick Preset Templates */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  ⚡ Quick Preset Templates (1-Click Auto Fill)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {tpl.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {tpl.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleExecuteBroadcast} className="space-y-4 pt-2">
                {/* Channel Selectors */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Select Broadcast Delivery Channels *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* In-App */}
                    <div
                      onClick={() => toggleChannel('in_app')}
                      className={cn(
                        'p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1.5',
                        broadcastChannels.includes('in_app')
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                      )}
                    >
                      <Bell className="w-5 h-5" />
                      <span className="text-xs">In-App Feed</span>
                      <span className="text-[10px] font-mono opacity-80">Instant Socket</span>
                    </div>

                    {/* Email */}
                    <div
                      onClick={() => toggleChannel('email')}
                      className={cn(
                        'p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1.5',
                        broadcastChannels.includes('email')
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                      )}
                    >
                      <Mail className="w-5 h-5" />
                      <span className="text-xs">Email Broadcast</span>
                      <span className="text-[10px] font-mono opacity-80">SMTP Delivery</span>
                    </div>

                    {/* WhatsApp */}
                    <div
                      onClick={() => toggleChannel('whatsapp')}
                      className={cn(
                        'p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1.5',
                        broadcastChannels.includes('whatsapp')
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                      )}
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-xs">WhatsApp Direct</span>
                      <span className="text-[10px] font-mono opacity-80">Cloud / Twilio</span>
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all', label: 'All Students', icon: Users },
                      { id: 'pro', label: 'Pro Members Only', icon: Award },
                      { id: 'inactive', label: 'Inactive (10+ Days)', icon: Clock },
                    ].map((aud) => {
                      const Icon = aud.icon;
                      return (
                        <button
                          key={aud.id}
                          type="button"
                          onClick={() => setBroadcastAudience(aud.id as any)}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                            broadcastAudience === aud.id
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{aud.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Broadcast Title *
                  </label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                    placeholder="e.g. Sunday Weekly Contest is Now Live!"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Link & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Platform CTA Link
                    </label>
                    <input
                      type="text"
                      value={broadcastLink}
                      onChange={(e) => setBroadcastLink(e.target.value)}
                      placeholder="/contests or /problems"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Type / Tag
                    </label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="EVENT">Event / Contest</option>
                      <option value="COURSE">Course & Certificate</option>
                      <option value="IMPORTANT">Important Alert</option>
                      <option value="GENERAL">General News</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Message Body *
                  </label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Type the message to be sent via Email, WhatsApp, and In-App notification..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={broadcasting}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className={cn('w-4 h-4', broadcasting && 'animate-spin')} />
                    <span>
                      {broadcasting
                        ? 'Broadcasting across selected channels...'
                        : `Launch Blast to ${broadcastAudience.toUpperCase()} (${broadcastChannels.length} Channels)`}
                    </span>
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Live Multi-Channel Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Live Channel Simulator</span>
                </h4>
                {/* Preview Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('in_app')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer',
                      previewTab === 'in_app'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    In-App
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('email')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer',
                      previewTab === 'email'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('whatsapp')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer',
                      previewTab === 'whatsapp'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Preview 1: In-App Feed Notification Card */}
              {previewTab === 'in_app' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-indigo-500/20 text-indigo-500">
                      <Bell className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {broadcastTitle || 'Announcement Title'}
                      </div>
                      <div className="text-[10px] text-slate-500">Just now • Broadcast Notification</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                    {broadcastMessage || 'Announcement message preview...'}
                  </p>
                  {broadcastLink && (
                    <div className="text-[11px] text-indigo-500 font-bold flex items-center gap-1 pt-1">
                      <span>Action Link: {broadcastLink}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>
              )}

              {/* Preview 2: Branded HTML Email */}
              {previewTab === 'email' && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 text-slate-100 text-xs shadow-md">
                  <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 p-4 text-center">
                    <div className="font-black text-sm uppercase tracking-wider text-white">NEXTERA CODERS</div>
                    <div className="text-[10px] text-indigo-100">Official Student Broadcast</div>
                  </div>
                  <div className="p-4 space-y-3 bg-slate-900">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold uppercase">
                      📢 {broadcastType}
                    </span>
                    <div className="text-xs font-bold text-white">Hi Rahul Sharma,</div>
                    <div className="text-sm font-black text-sky-400">{broadcastTitle}</div>
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11.5px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {broadcastMessage}
                    </div>
                    <div className="text-center pt-1">
                      <span className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-md">
                        View Announcement ➔
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-950 text-center text-[10px] text-slate-500 border-t border-slate-800">
                    NextEra Coders Academy • Sent via verified SMTP
                  </div>
                </div>
              )}

              {/* Preview 3: WhatsApp Chat Bubble */}
              {previewTab === 'whatsapp' && (
                <div className="rounded-xl p-4 bg-[#0b141a] border border-[#202c33] text-xs font-sans space-y-3 shadow-md">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#202c33]">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                      NEC
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#e9edef]">NextEra Coders Official</div>
                      <div className="text-[10px] text-emerald-400">Verified Business Account</div>
                    </div>
                  </div>

                  {/* WhatsApp Chat Bubble */}
                  <div className="max-w-[90%] bg-[#005c4b] text-[#e9edef] p-3 rounded-xl rounded-tl-none shadow-sm space-y-2">
                    <div className="font-bold text-emerald-200">📢 *NextEra Coders Alert* 🚀</div>
                    <div className="text-[11px] font-bold text-white">*{broadcastTitle}*</div>
                    <div className="text-[11px] text-[#d1d7db] whitespace-pre-wrap leading-relaxed">
                      {broadcastMessage}
                    </div>
                    {broadcastLink && (
                      <div className="text-[10.5px] text-[#53bdeb] pt-1">
                        🔗 *Jump In:* https://nexteracoders.com{broadcastLink}
                      </div>
                    )}
                    <div className="text-[9px] text-[#8696a0] text-right">10:42 AM ✓✓</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 10-DAY INACTIVE RETENTION ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'retention' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Inactive */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-500">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {retentionLoading ? '...' : retentionStats?.totalInactive ?? 0}
                </div>
                <div className="text-xs text-slate-500 font-medium">Inactive Students (10+ Days)</div>
              </div>
            </div>

            {/* Eligible for Blast */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {retentionLoading ? '...' : retentionStats?.eligibleForBlast ?? 0}
                </div>
                <div className="text-xs text-slate-500 font-medium">Ready for Comeback Blast</div>
              </div>
            </div>

            {/* WhatsApp Ready */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-teal-500/10 text-teal-500">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {retentionLoading ? '...' : retentionStats?.withPhoneCount ?? 0}
                </div>
                <div className="text-xs text-slate-500 font-medium">With WhatsApp Phone</div>
              </div>
            </div>

            {/* In Cooldown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {retentionLoading ? '...' : retentionStats?.recentlyReminded ?? 0}
                </div>
                <div className="text-xs text-slate-500 font-medium">In 7-Day Cooldown</div>
              </div>
            </div>
          </div>

          {/* Action Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-bold text-xs">
                  Automated Student Retention
                </span>
                <span className="text-xs text-slate-400 font-mono">Cooldown: 1 blast / 7 days per student</span>
              </div>
              <h4 className="text-base font-bold text-white">
                Re-engage Inactive Students via Email & WhatsApp
              </h4>
              <p className="text-xs text-slate-300 max-w-2xl">
                Send a personalized, encouraging reminder highlighting today's Daily Coding Challenge (POTD), upcoming Sunday Weekly Contest, and streak recovery incentives.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={fetchRetentionStats}
                disabled={retentionLoading}
                className="gap-1.5"
              >
                <RefreshCw className={cn('w-4 h-4', retentionLoading && 'animate-spin')} />
                <span>Refresh</span>
              </Button>

              <Button
                type="button"
                onClick={() => setRetentionConfirmOpen(true)}
                disabled={blastingRetention || !retentionStats || retentionStats.eligibleForBlast === 0}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold gap-2 shadow-lg shadow-indigo-500/25"
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Trigger 10-Day Comeback Blast ({retentionStats?.eligibleForBlast ?? 0})</span>
              </Button>
            </div>
          </div>

          {/* Inactive Students Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Sample Inactive Students (10+ Days)</span>
              </div>
              <span className="text-xs text-slate-500">
                Showing top 20 longest inactive students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Days Inactive</th>
                    <th className="py-3 px-4">Previous Streak</th>
                    <th className="py-3 px-4">WhatsApp Phone</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {retentionLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Loading inactive students retention data...
                      </td>
                    </tr>
                  ) : !retentionStats || retentionStats.sampleStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        🎉 All students are actively learning! Zero students inactive for 10+ days.
                      </td>
                    </tr>
                  ) : (
                    retentionStats.sampleStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{s.name}</div>
                          <div className="text-[11px] text-slate-500">{s.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {s.college || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            {s.daysInactive} days ago
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {s.learningStreak > 0 ? (
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Flame className="w-3.5 h-3.5" /> {s.learningStreak} days
                            </span>
                          ) : (
                            <span className="text-slate-400">0 days</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {s.phone ? (
                            <span className="font-mono text-emerald-500 font-bold">
                              +{s.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400">No phone</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {s.remindedRecently ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
                              ⏳ Reminded Recently
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                              🟢 Eligible for Blast
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Retention Blast Confirmation Modal */}
          {retentionConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Confirm 10-Day Retention Blast
                    </h3>
                    <p className="text-xs text-slate-500">
                      Targeting {retentionStats?.eligibleForBlast} eligible students
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p>
                    This action will dispatch personalized <strong>Email</strong>, <strong>WhatsApp</strong>, and <strong>In-App</strong> re-engagement reminders to all students who have been inactive for 10+ days.
                  </p>
                  <p className="text-amber-500 font-semibold">
                    🛡️ Students who received a reminder in the past 7 days are automatically excluded to prevent spam.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setRetentionConfirmOpen(false)}
                    disabled={blastingRetention}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExecuteRetentionBlast}
                    disabled={blastingRetention}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    {blastingRetention ? 'Sending Blast...' : 'Yes, Dispatch Blast'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT ANNOUNCEMENT MODAL */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingAnnouncement ? 'Edit Announcement' : 'Create & Broadcast Announcement'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Scheduled Platform Maintenance"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Announcement Category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GENERAL">General Notice</option>
                    <option value="COURSE">Course Update</option>
                    <option value="IMPORTANT">Important Alert</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="EVENT">Live Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="/courses or /dsa"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Detailed announcement message broadcast to student feeds..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ann-publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="ann-publish"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Publish & Broadcast notification to active student feeds immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>
                    {saving
                      ? 'Saving...'
                      : editingAnnouncement
                      ? 'Save Changes'
                      : 'Create Announcement'}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Announcement?"
        itemName={deletingAnnouncement?.title}
        description="Permanently delete this announcement record from the CMS."
      />
    </div>
  );
};
