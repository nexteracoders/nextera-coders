import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  CheckCircle2,
  Mail,
  MessageSquare,
  Sparkles,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Flame,
  Check,
  Smartphone,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import {
  adminBroadcastService,
  InactiveStudentItem,
  BroadcastLogItem,
} from '../../services/adminBroadcast.service';
import { adminService } from '../../services/admin.service';
import { cn } from '../../utils/cn';

interface PresetTemplate {
  key: string;
  name: string;
  badge: string;
  title: string;
  message: string;
  link: string;
  defaultChannels: ('email' | 'whatsapp' | 'in_app')[];
  description: string;
}

const BROADCAST_PRESETS: PresetTemplate[] = [
  {
    key: 'weekly_contest',
    name: 'New Weekly Contest is Live',
    badge: '⚔️ Contest Alert',
    title: '⚔️ This Sunday’s Weekly Contest is Now LIVE!',
    message:
      'Step into the arena! The new Weekly Contest is live right now on NextEra Coders. Compete with top peers across 4 algorithmic DSA challenges under live anti-cheat surveillance, climb the global leaderboard, and win coin bounties & honors.',
    link: '/weekly-contest',
    defaultChannels: ['email', 'whatsapp', 'in_app'],
    description: 'Instant notification blast to all students that the weekly contest has started.',
  },
  {
    key: 'certificate_ready',
    name: 'Course Certificate is Ready',
    badge: '🎓 Certificate Issued',
    title: '🎓 Congratulations! Your Verified Course Certificate is Ready',
    message:
      'Heartiest congratulations! You have completed your course track with distinction. Your official verified credential with tamper-proof Certificate ID has been generated. View and download your high-resolution certificate now and share your achievement on LinkedIn!',
    link: '/certificates',
    defaultChannels: ['email', 'whatsapp', 'in_app'],
    description: 'Congratulatory broadcast with direct certificate access and verification link.',
  },
  {
    key: 'inactive_comeback',
    name: '10-Day Come Back Reminder',
    badge: '⏰ Streak Reminder',
    title: '👋 We miss you at NextEra Coders! Jump back into code today',
    message:
      'Consistency is what turns coders into software engineers. Don’t let your learning streak pause! Solve today’s Daily Challenge, earn +50 bonus coins, and keep your algorithmic problem-solving sharp.',
    link: '/problems',
    defaultChannels: ['email', 'whatsapp', 'in_app'],
    description: 'Automated retention blast for students who haven’t visited in 10 or more days.',
  },
  {
    key: 'custom',
    name: 'Custom Important Announcement',
    badge: '📢 Platform Update',
    title: '📢 Important Update from NextEra Coders Academy',
    message:
      'We have rolled out new platform upgrades to accelerate your coding journey. Explore the latest features, improved compiler speeds, and community duels today!',
    link: '/announcements',
    defaultChannels: ['email', 'whatsapp', 'in_app'],
    description: 'Custom message blast across Email, WhatsApp, and in-app feeds.',
  },
];

export const AdminNotificationsPage: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  // Active Hub Tab: 'broadcast' | 'inactive' | 'logs'
  const [activeTab, setActiveTab] = useState<'broadcast' | 'inactive' | 'logs'>('broadcast');

  // Broadcast Composer State
  const [selectedPreset, setSelectedPreset] = useState<string>('weekly_contest');
  const [targetAudience, setTargetAudience] = useState<'all' | 'inactive_10_days' | 'single'>('all');
  const [selectedChannels, setSelectedChannels] = useState<('email' | 'whatsapp' | 'in_app')[]>([
    'email',
    'whatsapp',
    'in_app',
  ]);
  const [broadcastTitle, setBroadcastTitle] = useState<string>(BROADCAST_PRESETS[0].title);
  const [broadcastMessage, setBroadcastMessage] = useState<string>(BROADCAST_PRESETS[0].message);
  const [broadcastLink, setBroadcastLink] = useState<string>(BROADCAST_PRESETS[0].link);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResultModal, setSendResultModal] = useState<{
    recipientsTargeted: number;
    emailSuccessCount: number;
    whatsAppSuccessCount: number;
    inAppCount: number;
    whatsAppChatLinks: Array<{ name: string; phone: string; link: string }>;
  } | null>(null);

  // Inactive Students Tab State
  const [inactiveStudents, setInactiveStudents] = useState<InactiveStudentItem[]>([]);
  const [inactiveLoading, setInactiveLoading] = useState<boolean>(false);
  const [inactiveSearch, setInactiveSearch] = useState<string>('');
  const [isBlastingInactive, setIsBlastingInactive] = useState<boolean>(false);

  // Broadcast Delivery Logs State
  const [logs, setLogs] = useState<BroadcastLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logsPage, setLogsPage] = useState<number>(1);
  const [logsTotalPages, setLogsTotalPages] = useState<number>(1);

  // Fetch initial data
  useEffect(() => {
    fetchStudents();
    fetchInactiveStudents();
    fetchLogs(1);
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await adminService.getStudents({ limit: 150 });
      setStudents(res.students || []);
    } catch (err: any) {
      console.error('Failed to load students:', err);
    }
  };

  const fetchInactiveStudents = async () => {
    try {
      setInactiveLoading(true);
      const res = await adminBroadcastService.getInactiveStudents();
      setInactiveStudents(res.students || []);
    } catch (err: any) {
      console.error('Failed to load inactive students:', err);
    } finally {
      setInactiveLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      setLogsLoading(true);
      const res = await adminBroadcastService.getBroadcastLogs(page, 15);
      setLogs(res.logs || []);
      setLogsPage(res.pagination?.page || 1);
      setLogsTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load broadcast logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Apply Preset Template
  const handleSelectPreset = (presetKey: string) => {
    const p = BROADCAST_PRESETS.find((item) => item.key === presetKey);
    if (!p) return;
    setSelectedPreset(presetKey);
    setBroadcastTitle(p.title);
    setBroadcastMessage(p.message);
    setBroadcastLink(p.link);
    setSelectedChannels(p.defaultChannels);

    if (presetKey === 'inactive_comeback') {
      setTargetAudience('inactive_10_days');
    } else {
      setTargetAudience('all');
    }
  };

  // Channel Toggle
  const toggleChannel = (channel: 'email' | 'whatsapp' | 'in_app') => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length === 1) {
        toastError('At least one delivery channel must remain selected');
        return;
      }
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  // Handle Multi-Channel Broadcast Blast
  const handleDispatchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toastError('Please fill in both Announcement Title and Message');
      return;
    }
    if (targetAudience === 'single' && !selectedStudentId) {
      toastError('Please select a student recipient for single delivery');
      return;
    }

    try {
      setIsSending(true);
      const res = await adminBroadcastService.sendBroadcast({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        link: broadcastLink.trim() || undefined,
        channels: selectedChannels,
        targetAudience,
        targetUserId: targetAudience === 'single' ? selectedStudentId : undefined,
        presetKey: selectedPreset,
      });

      success('Broadcast Dispatched!', `Successfully delivered across ${selectedChannels.join(', ')}`);
      setSendResultModal({
        recipientsTargeted: res.recipientsTargeted,
        emailSuccessCount: res.emailSuccessCount,
        whatsAppSuccessCount: res.whatsAppSuccessCount,
        inAppCount: res.inAppCount,
        whatsAppChatLinks: res.whatsAppChatLinks || [],
      });
      fetchLogs(1);
      fetchInactiveStudents();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to dispatch broadcast');
    } finally {
      setIsSending(false);
    }
  };

  // 1-Click Blast to All Inactive Students
  const handleBlastInactive = async () => {
    if (inactiveStudents.length === 0) {
      info('No students currently inactive for 10+ days.');
      return;
    }

    try {
      setIsBlastingInactive(true);
      const res = await adminBroadcastService.blastInactiveStudents({
        channels: ['email', 'whatsapp', 'in_app'],
      });

      success(
        'Comeback Blast Dispatched!',
        `Sent to ${res.targetedCount} inactive students (${res.emailSuccessCount} emails dispatched, ${res.whatsAppCount} WhatsApp alerts delivered)`
      );

      setSendResultModal({
        recipientsTargeted: res.targetedCount,
        emailSuccessCount: res.emailSuccessCount,
        whatsAppSuccessCount: res.whatsAppCount,
        inAppCount: res.inAppCount,
        whatsAppChatLinks: res.whatsAppChatLinks || [],
      });
      fetchInactiveStudents();
      fetchLogs(1);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to dispatch comeback blast');
    } finally {
      setIsBlastingInactive(false);
    }
  };

  // Filtered Inactive Students
  const filteredInactiveStudents = inactiveStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(inactiveSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(inactiveSearch.toLowerCase()) ||
      s.college.toLowerCase().includes(inactiveSearch.toLowerCase()) ||
      s.phone.includes(inactiveSearch)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <AdminPageHeader
        title="Email & WhatsApp Notification Broadcast Hub"
        description="Dispatch instant platform announcement blasts, course certificate notifications, and 1-click re-engagement alerts to students inactive for 10+ days."
        breadcrumbs={[{ label: 'Notifications & Broadcast' }]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchInactiveStudents();
                fetchLogs(logsPage);
                info('Notification telemetry refreshed');
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inactive Students Alert */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              10+ Days Inactive Students
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-500">
                {inactiveStudents.length}
              </span>
              <span className="text-xs font-mono text-slate-500">Needs Comeback</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Email Channels Available */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Email Dispatch Engine
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-500">HTML Rich</span>
              <span className="text-xs font-mono text-emerald-500 font-bold">● Active</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        {/* WhatsApp Channel Available */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              WhatsApp Alert Engine
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-500">wa.me API</span>
              <span className="text-xs font-mono text-emerald-500 font-bold">● Ready</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Total Campaigns Logged */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Campaigns Dispatched
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-500">{logs.length}</span>
              <span className="text-xs font-mono text-slate-500">Logged</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'broadcast'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Send className="w-3.5 h-3.5" />
          <span>🚀 Multi-Channel Broadcast Blast</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inactive')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer relative',
            activeTab === 'inactive'
              ? 'bg-rose-500 text-white font-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>⏰ Inactive Students Alert (10+ Days)</span>
          {inactiveStudents.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
              {inactiveStudents.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white font-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>📜 Broadcast Delivery Logs</span>
        </button>
      </div>

      {/* TAB 1: MULTI-CHANNEL BROADCAST BLAST */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Presets */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick 1-Click Presets */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>One-Click Priority Announcement Presets</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Select Template</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BROADCAST_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleSelectPreset(p.key)}
                    className={cn(
                      'p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2',
                      selectedPreset === p.key
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/40'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {p.badge}
                      </span>
                      {selectedPreset === p.key && <Check className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {p.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Form */}
            <form onSubmit={handleDispatchBroadcast} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-amber-500" />
                  <span>Configure Multi-Channel Message</span>
                </h3>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Target Student Audience:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All Active Students' },
                    { id: 'inactive_10_days', label: '10+ Days Inactive' },
                    { id: 'single', label: 'Single Student' },
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setTargetAudience(aud.id as any)}
                      className={cn(
                        'py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all border text-center cursor-pointer',
                        targetAudience === aud.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>

                {targetAudience === 'single' && (
                  <div className="pt-2">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select a student...</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Channels Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Delivery Channels (Select All That Apply):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Email */}
                  <label
                    onClick={() => toggleChannel('email')}
                    className={cn(
                      'p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition-all',
                      selectedChannels.includes('email')
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    )}
                  >
                    <Mail className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-bold">Email Blast</div>
                      <div className="text-[10px] text-slate-400 font-mono">HTML Email</div>
                    </div>
                  </label>

                  {/* WhatsApp */}
                  <label
                    onClick={() => toggleChannel('whatsapp')}
                    className={cn(
                      'p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition-all',
                      selectedChannels.includes('whatsapp')
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    )}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-bold">WhatsApp</div>
                      <div className="text-[10px] text-slate-400 font-mono">wa.me Alert</div>
                    </div>
                  </label>

                  {/* In-App */}
                  <label
                    onClick={() => toggleChannel('in_app')}
                    className={cn(
                      'p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition-all',
                      selectedChannels.includes('in_app')
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    )}
                  >
                    <Bell className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-bold">In-App Feed</div>
                      <div className="text-[10px] text-slate-400 font-mono">Student Bell</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Announcement Title:</span>
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. ⚔️ This Sunday's Weekly Contest is Now LIVE!"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Message Body:</span>
                </label>
                <textarea
                  rows={5}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type the announcement details..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Action Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>CTA Action Link (Optional):</span>
                </label>
                <input
                  type="text"
                  value={broadcastLink}
                  onChange={(e) => setBroadcastLink(e.target.value)}
                  placeholder="/weekly-contest or /certificates"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Blast Button */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Disptaching Multi-Channel Blast...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>🚀 Dispatch Multi-Channel Broadcast Blast</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Dual Previews (Email & WhatsApp) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span>Live Email Template Preview</span>
                </h4>
                <span className="text-[10px] font-mono text-indigo-500 uppercase font-bold">HTML Render</span>
              </div>

              {/* Email Mockup Container */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden text-slate-200 shadow-inner">
                {/* Email Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-center text-white">
                  <span className="text-[11px] uppercase tracking-wider font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    Official Broadcast
                  </span>
                  <h4 className="font-black text-base mt-2">NextEra Coders</h4>
                  <p className="text-[11px] text-indigo-100 opacity-90">Next-Generation Engineering Academy</p>
                </div>

                {/* Email Body */}
                <div className="p-4 space-y-3 text-xs">
                  <p className="text-slate-400">
                    Hi <strong className="text-white">Student Name</strong>,
                  </p>
                  <h5 className="font-bold text-sm text-cyan-400 leading-snug">
                    {broadcastTitle || 'Announcement Title'}
                  </h5>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap text-[11px]">
                    {broadcastMessage || 'Announcement details will appear here...'}
                  </div>

                  {broadcastLink && (
                    <div className="text-center pt-2 pb-1">
                      <span className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-md">
                        🔗 Open on NextEra Coders ➔
                      </span>
                    </div>
                  )}
                </div>

                {/* Email Footer */}
                <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
                  © 2026 NextEra Coders. All rights reserved.
                </div>
              </div>
            </div>

            {/* WhatsApp Live Preview */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Live WhatsApp Message Preview</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold">wa.me Alert</span>
              </div>

              {/* WhatsApp Chat Bubble Mockup */}
              <div className="p-4 rounded-2xl bg-[#0b141a] border border-neutral-800 space-y-2">
                <div className="max-w-xs bg-[#005c4b] text-slate-100 rounded-2xl p-3 text-xs space-y-1.5 shadow-md ml-auto">
                  <div className="text-[11px] font-bold text-emerald-200">
                    📢 NextEra Coders Alert 🚀
                  </div>
                  <div className="text-slate-300">Hi Student,</div>
                  <div className="font-bold text-white">{broadcastTitle || 'Announcement Title'}</div>
                  <div className="text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {broadcastMessage || 'Announcement message preview...'}
                  </div>
                  {broadcastLink && (
                    <div className="text-[11px] text-cyan-300 font-mono break-all underline pt-1">
                      http://localhost:5173{broadcastLink}
                    </div>
                  )}
                  <div className="text-[9px] text-emerald-300 text-right pt-0.5">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INACTIVE STUDENTS (10+ DAYS) RETENTION */}
      {activeTab === 'inactive' && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 font-mono text-xs font-bold mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Automated Inactivity Radar</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {inactiveStudents.length} Students Inactive for 10+ Days
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                These students haven't participated in challenges, contests, or lessons in 10 or more days. Re-engage them now with one click to keep their problem-solving streak alive.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBlastInactive}
              disabled={isBlastingInactive || inactiveStudents.length === 0}
              className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isBlastingInactive ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Blasting Comeback Emails & Alerts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ 1-Click Come Back Blast ({inactiveStudents.length} Students)</span>
                </>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inactiveSearch}
                onChange={(e) => setInactiveSearch(e.target.value)}
                placeholder="Search by student name, email, college or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Inactive Students Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 font-bold">Student</th>
                    <th className="px-4 py-3 font-bold">Contact</th>
                    <th className="px-4 py-3 font-bold">Inactivity Duration</th>
                    <th className="px-4 py-3 font-bold">Past Streak</th>
                    <th className="px-4 py-3 font-bold">Last Retention Alert</th>
                    <th className="px-4 py-3 font-bold text-right">Quick Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {inactiveLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                        Scanning for inactive students...
                      </td>
                    </tr>
                  ) : filteredInactiveStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                        No inactive students match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredInactiveStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Student Name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{s.college || 'Student'}</div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3.5 font-mono text-[11px]">
                          <div className="text-slate-700 dark:text-slate-300">{s.email}</div>
                          <div className="text-slate-400">{s.phone || 'No phone'}</div>
                        </td>

                        {/* Days Inactive */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <Clock className="w-3 h-3" />
                            <span>{s.daysInactive} Days Inactive</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            Last: {new Date(s.lastActivityDate).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Past Streak */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-amber-500 font-bold font-mono text-[11px]">
                            <Flame className="w-3.5 h-3.5" />
                            <span>{s.learningStreak} Days Streak</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Best: {s.longestStreak} days
                          </span>
                        </td>

                        {/* Last Alert Sent */}
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                          {s.lastRetentionNotificationSentAt ? (
                            <span>
                              {new Date(s.lastRetentionNotificationSentAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Never Sent</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Direct Link */}
                            {s.whatsAppLink ? (
                              <a
                                href={s.whatsAppLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 transition-all"
                                title="Open Direct WhatsApp Chat with Comeback message pre-filled"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            ) : null}

                            {/* Direct Comeback Email */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await adminBroadcastService.sendBroadcast({
                                    title: '👋 We miss you at NextEra Coders! Jump back into code today',
                                    message: `Hi ${s.name}, you've been away for ${s.daysInactive} days. Your learning streak misses you! Jump back in today to keep your problem-solving sharp.`,
                                    link: '/problems',
                                    channels: ['email', 'in_app'],
                                    targetAudience: 'single',
                                    targetUserId: s.id,
                                    presetKey: 'inactive_comeback',
                                  });
                                  success(`Comeback email dispatched to ${s.name}!`);
                                  fetchInactiveStudents();
                                } catch (err: any) {
                                  toastError('Failed to send comeback email');
                                }
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Send direct email"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Email</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST DELIVERY LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 font-bold">Campaign / Title</th>
                    <th className="px-4 py-3 font-bold">Channels</th>
                    <th className="px-4 py-3 font-bold">Target Audience</th>
                    <th className="px-4 py-3 font-bold">Delivery Metrics</th>
                    <th className="px-4 py-3 font-bold">Dispatched By</th>
                    <th className="px-4 py-3 font-bold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                        Loading broadcast logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                        No broadcast campaigns have been dispatched yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white max-w-sm truncate">
                            {log.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm truncate">
                            {log.message}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {log.channels.map((ch) => (
                              <span
                                key={ch}
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
                                  ch === 'email'
                                    ? 'bg-indigo-500/15 text-indigo-400'
                                    : ch === 'whatsapp'
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-amber-500/15 text-amber-400'
                                )}
                              >
                                {ch}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                          {log.targetAudience === 'all'
                            ? 'All Active Students'
                            : log.targetAudience === 'inactive_10_days'
                            ? '10+ Days Inactive'
                            : 'Single Student'}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px]">
                          <div className="text-slate-900 dark:text-white font-bold">
                            {log.recipientCount} Recipients
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Emails: {log.emailSuccessCount} &bull; WhatsApp: {log.whatsAppLinksGenerated}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {log.triggeredByName || 'Admin'}
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {logsTotalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono">
                <span>
                  Page {logsPage} of {logsTotalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={logsPage <= 1 || logsLoading}
                    onClick={() => fetchLogs(logsPage - 1)}
                    className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={logsPage >= logsTotalPages || logsLoading}
                    onClick={() => fetchLogs(logsPage + 1)}
                    className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Broadcast Result Summary Modal */}
      {sendResultModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Broadcast Campaign Dispatched Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your announcement was published and dispatched across the selected communication channels.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">Recipients</span>
                <strong className="text-base text-slate-900 dark:text-white">
                  {sendResultModal.recipientsTargeted}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-indigo-400 block">Emails Sent</span>
                <strong className="text-base text-indigo-500">
                  {sendResultModal.emailSuccessCount}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block">WhatsApp Links</span>
                <strong className="text-base text-emerald-500">
                  {sendResultModal.whatsAppChatLinks.length}
                </strong>
              </div>
            </div>

            {/* WhatsApp Quick Open List */}
            {sendResultModal.whatsAppChatLinks.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  🟢 Ready WhatsApp Click-to-Chat Links:
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  {sendResultModal.whatsAppChatLinks.map((wa, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {wa.name} ({wa.phone})
                      </span>
                      <a
                        href={wa.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold font-mono flex items-center gap-1 shrink-0"
                      >
                        <span>Chat</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSendResultModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
