import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Building2,
  Globe,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  Mail,
  Navigation,
  Compass,
  Shield,
  Lock,
  KeyRound,
  AlertCircle,
  UserCheck,
  Key,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { settingsService } from '../../services/settings.service';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import { AdminPlatformSettings, PlatformLocation } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Button } from '../../components/ui/Button';
import {
  XIcon,
  LinkedInIcon,
  InstagramIcon,
  YouTubeIcon,
  GitHubIcon,
  SocialLinksBar,
} from '../../components/common/SocialIcons';

type TabType = 'social' | 'locations' | 'brand' | 'operations' | 'security';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('social');
  const [settings, setSettings] = useState<AdminPlatformSettings>({
    platformName: 'NextEra Coders Learning',
    tagline: 'Learn. Code. Build. Grow.',
    contactEmail: 'support@nexteracoders.com',
    contactPhone: '+91 98765 43210',
    logoUrl: '',
    socialLinks: {
      github: 'https://github.com/nexteracoders',
      x: 'https://x.com/nexteracoders',
      twitter: 'https://x.com/nexteracoders',
      linkedin: 'https://linkedin.com/company/nexteracoders',
      instagram: 'https://instagram.com/nexteracoders',
      youtube: 'https://youtube.com/@nexteracoders',
    },
    locations: [
      {
        id: 'loc-noida-hq',
        title: 'Corporate & Innovation Hub',
        badge: 'HQ Hub',
        address: 'A-143, 6th Floor, Sovereign Corporate Tower, Sector-136',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201305',
        country: 'India',
        phone: '+91 98765 43210',
        email: 'contact@nexteracoders.com',
        mapUrl: 'https://maps.google.com/?q=Sector+136+Noida+Uttar+Pradesh',
        isPrimary: true,
        isActive: true,
      },
      {
        id: 'loc-bangalore-campus',
        title: 'Registered Tech Campus',
        badge: 'Tech Park',
        address: 'Tower K, Innovation Enclave, Outer Ring Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560103',
        country: 'India',
        phone: '+91 98765 43211',
        email: 'blr@nexteracoders.com',
        mapUrl: 'https://maps.google.com/?q=Outer+Ring+Road+Bangalore+Karnataka',
        isPrimary: false,
        isActive: true,
      },
    ],
    maintenanceMode: false,
    defaultPagination: 12,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Admin Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Location modal / edit states
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocIndex, setEditingLocIndex] = useState<number | null>(null);
  const [locationForm, setLocationForm] = useState<PlatformLocation>({
    title: '',
    badge: 'Office',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    email: '',
    mapUrl: '',
    isPrimary: false,
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSettings();
      if (res.settings) {
        setSettings({
          platformName: res.settings.platformName || 'NextEra Coders Learning',
          tagline: res.settings.tagline || 'Learn. Code. Build. Grow.',
          contactEmail: res.settings.contactEmail || 'support@nexteracoders.com',
          contactPhone: res.settings.contactPhone || '+91 98765 43210',
          logoUrl: res.settings.logoUrl || '',
          socialLinks: {
            github: res.settings.socialLinks?.github ?? 'https://github.com/nexteracoders',
            x: res.settings.socialLinks?.x ?? res.settings.socialLinks?.twitter ?? 'https://x.com/nexteracoders',
            twitter: res.settings.socialLinks?.x ?? res.settings.socialLinks?.twitter ?? 'https://x.com/nexteracoders',
            linkedin: res.settings.socialLinks?.linkedin ?? 'https://linkedin.com/company/nexteracoders',
            instagram: res.settings.socialLinks?.instagram ?? 'https://instagram.com/nexteracoders',
            youtube: res.settings.socialLinks?.youtube ?? 'https://youtube.com/@nexteracoders',
          },
          locations:
            res.settings.locations && res.settings.locations.length > 0
              ? res.settings.locations
              : [
                  {
                    id: 'loc-noida-hq',
                    title: 'Corporate & Innovation Hub',
                    badge: 'HQ Hub',
                    address: 'A-143, 6th Floor, Sovereign Corporate Tower, Sector-136',
                    city: 'Noida',
                    state: 'Uttar Pradesh',
                    pincode: '201305',
                    country: 'India',
                    phone: '+91 98765 43210',
                    email: 'contact@nexteracoders.com',
                    mapUrl: 'https://maps.google.com/?q=Sector+136+Noida+Uttar+Pradesh',
                    isPrimary: true,
                    isActive: true,
                  },
                  {
                    id: 'loc-bangalore-campus',
                    title: 'Registered Tech Campus',
                    badge: 'Tech Park',
                    address: 'Tower K, Innovation Enclave, Outer Ring Road',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    pincode: '560103',
                    country: 'India',
                    phone: '+91 98765 43211',
                    email: 'blr@nexteracoders.com',
                    mapUrl: 'https://maps.google.com/?q=Outer+Ring+Road+Bangalore+Karnataka',
                    isPrimary: false,
                    isActive: true,
                  },
                ],
          maintenanceMode: !!res.settings.maintenanceMode,
          defaultPagination: res.settings.defaultPagination || 12,
        });
      }
    } catch (err) {
      console.error('Failed to fetch platform settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setSuccess(false);

      // Make sure twitter and x are synced for compatibility
      const payload: AdminPlatformSettings = {
        ...settings,
        socialLinks: {
          ...settings.socialLinks,
          twitter: settings.socialLinks.x || settings.socialLinks.twitter,
          x: settings.socialLinks.x || settings.socialLinks.twitter,
        },
      };

      await adminService.updateSettings(payload);
      settingsService.clearCache();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Failed to save settings. Please check your network.');
    } finally {
      setSaving(false);
    }
  };

  // Location CRUD handlers
  const handleOpenAddLocation = () => {
    setEditingLocIndex(null);
    setLocationForm({
      id: `loc-${Date.now()}`,
      title: '',
      badge: 'Hub',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      phone: '',
      email: '',
      mapUrl: '',
      isPrimary: (settings.locations?.length || 0) === 0,
      isActive: true,
    });
    setLocationModalOpen(true);
  };

  const handleOpenEditLocation = (index: number) => {
    const loc = settings.locations?.[index];
    if (!loc) return;
    setEditingLocIndex(index);
    setLocationForm({ ...loc });
    setLocationModalOpen(true);
  };

  const handleSaveLocationForm = () => {
    if (!locationForm.title.trim() || !locationForm.address.trim()) {
      alert('Please fill in at least the Title and Address for this location.');
      return;
    }

    const currentLocations = [...(settings.locations || [])];

    if (locationForm.isPrimary) {
      currentLocations.forEach((loc) => {
        loc.isPrimary = false;
      });
    }

    if (editingLocIndex !== null) {
      currentLocations[editingLocIndex] = locationForm;
    } else {
      currentLocations.push(locationForm);
    }

    setSettings({ ...settings, locations: currentLocations });
    setLocationModalOpen(false);
  };

  const handleDeleteLocation = (index: number) => {
    if (!confirm('Are you sure you want to remove this office location?')) return;
    const currentLocations = [...(settings.locations || [])];
    currentLocations.splice(index, 1);
    if (currentLocations.length > 0 && !currentLocations.some((l) => l.isPrimary)) {
      currentLocations[0].isPrimary = true;
    }
    setSettings({ ...settings, locations: currentLocations });
  };

  const handleSetPrimaryLocation = (index: number) => {
    const currentLocations = (settings.locations || []).map((loc, i) => ({
      ...loc,
      isPrimary: i === index,
    }));
    setSettings({ ...settings, locations: currentLocations });
  };

  const handleToggleLocationActive = (index: number) => {
    const currentLocations = [...(settings.locations || [])];
    currentLocations[index].isActive = !currentLocations[index].isActive;
    setSettings({ ...settings, locations: currentLocations });
  };

  // Admin Change Password Handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~])/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol (@, #, $, %, etc.).'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.changePassword({
        currentPassword: currentPassword.trim() ? currentPassword.trim() : undefined,
        newPassword: newPassword.trim(),
      });
      setPasswordSuccess('Password updated successfully! Your admin credentials have been securely refreshed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(''), 6000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update password. Please check your current password.';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
      <AdminPageHeader
        title="Platform Governance & Site Settings"
        description="Manage official brand identity, social channels (X, LinkedIn, etc.), corporate hubs/campuses, and platform maintenance."
        breadcrumbs={[{ label: 'Settings' }]}
        action={
          <Button
            onClick={() => handleSave()}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </Button>
        }
      />

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Settings Saved & Published Successfully!</p>
              <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90">
                All social media channels, office locations, and platform configurations are live.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300">
            Live Synced
          </span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto custom-scrollbar shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'social'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Social Media Hub</span>
          <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-slate-950/10 dark:bg-slate-950/20 font-mono">
            5
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('locations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'locations'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Offices & Hub Locations</span>
          <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-slate-950/10 dark:bg-slate-950/20 font-mono">
            {settings.locations?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'brand'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Brand & Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'operations'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Operational Controls</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Admin Security & Password</span>
        </button>
      </div>

      {/* TAB 1: SOCIAL MEDIA HUB */}
      {activeTab === 'social' && (
        <div className="space-y-6 animate-fade-in">
          {/* Live Interactive Preview Card */}
          <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-100/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Live Brand Colored Social Media Preview</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Icons are prominently styled in their authentic brand colors by default, with dynamic glow & scale on hover!
                </p>
              </div>
              <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto">
                <Eye className="w-3.5 h-3.5" />
                <span>Footer & About Live Render</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Public Icons Bar:</span>
                <SocialLinksBar socialLinks={settings.socialLinks} size="lg" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono italic">
                *Brand colors are permanently active & glow on hover
              </p>
            </div>
          </div>

          {/* Social Channels Config Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Active Social Channels & Community Endpoints
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Paste official destination URLs. Leave empty to hide an icon from the public site.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* X (Twitter) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center border border-white/20 shadow-md shadow-slate-900/40">
                      <XIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        X (formerly Twitter)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Official Geometric X Logo
                      </span>
                    </div>
                  </div>
                  {settings.socialLinks?.x && (
                    <a
                      href={settings.socialLinks.x}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/50 hover:bg-black hover:text-white text-slate-600 dark:text-slate-300 text-xs transition-colors flex items-center gap-1"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={settings.socialLinks?.x || settings.socialLinks?.twitter || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      socialLinks: {
                        ...settings.socialLinks,
                        x: e.target.value,
                        twitter: e.target.value,
                      },
                    })
                  }
                  placeholder="https://x.com/nexteracoders"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* LinkedIn */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 hover:border-[#0A66C2]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center shadow-md shadow-[#0A66C2]/30">
                      <LinkedInIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">LinkedIn</span>
                      <span className="text-[10px] text-sky-500 dark:text-sky-400 font-mono">
                        Professional Royal Blue
                      </span>
                    </div>
                  </div>
                  {settings.socialLinks?.linkedin && (
                    <a
                      href={settings.socialLinks.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/50 hover:bg-[#0A66C2] hover:text-white text-slate-600 dark:text-slate-300 text-xs transition-colors flex items-center gap-1"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={settings.socialLinks?.linkedin || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      socialLinks: {
                        ...settings.socialLinks,
                        linkedin: e.target.value,
                      },
                    })
                  }
                  placeholder="https://linkedin.com/company/nexteracoders"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0A66C2] font-mono"
                />
              </div>

              {/* Instagram */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 hover:border-pink-500/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md shadow-pink-500/30">
                      <InstagramIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Instagram</span>
                      <span className="text-[10px] text-pink-500 dark:text-pink-400 font-mono">
                        Sunset Gradient
                      </span>
                    </div>
                  </div>
                  {settings.socialLinks?.instagram && (
                    <a
                      href={settings.socialLinks.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/50 hover:bg-pink-600 hover:text-white text-slate-600 dark:text-slate-300 text-xs transition-colors flex items-center gap-1"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={settings.socialLinks?.instagram || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      socialLinks: {
                        ...settings.socialLinks,
                        instagram: e.target.value,
                      },
                    })
                  }
                  placeholder="https://instagram.com/nexteracoders"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>

              {/* YouTube */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 hover:border-red-500/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FF0000] text-white flex items-center justify-center shadow-md shadow-red-500/30">
                      <YouTubeIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">YouTube</span>
                      <span className="text-[10px] text-red-500 dark:text-red-400 font-mono">
                        Official Red (#FF0000)
                      </span>
                    </div>
                  </div>
                  {settings.socialLinks?.youtube && (
                    <a
                      href={settings.socialLinks.youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/50 hover:bg-red-600 hover:text-white text-slate-600 dark:text-slate-300 text-xs transition-colors flex items-center gap-1"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={settings.socialLinks?.youtube || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      socialLinks: {
                        ...settings.socialLinks,
                        youtube: e.target.value,
                      },
                    })
                  }
                  placeholder="https://youtube.com/@nexteracoders"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              {/* GitHub */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#24292e] text-white flex items-center justify-center shadow-md shadow-slate-900/40">
                      <GitHubIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        GitHub Organization
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Open Source Hub</span>
                    </div>
                  </div>
                  {settings.socialLinks?.github && (
                    <a
                      href={settings.socialLinks.github}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/50 hover:bg-slate-900 hover:text-white text-slate-600 dark:text-slate-300 text-xs transition-colors flex items-center gap-1"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={settings.socialLinks?.github || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      socialLinks: {
                        ...settings.socialLinks,
                        github: e.target.value,
                      },
                    })
                  }
                  placeholder="https://github.com/nexteracoders"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OFFICE & CAMPUS LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Corporate Headquarters, Hubs & Campuses</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure primary corporate headquarters, regional tech hubs, and innovation centers. These appear in the website footer and contact pages.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleOpenAddLocation}
              leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 w-full sm:w-auto shrink-0 cursor-pointer"
            >
              Add New Location
            </Button>
          </div>

          {/* Locations Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(settings.locations || []).map((loc, idx) => (
              <div
                key={loc.id || idx}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  loc.isPrimary
                    ? 'bg-gradient-to-br from-amber-50/50 via-white to-amber-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border-amber-500/40 shadow-xl shadow-amber-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar with Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{loc.title}</span>
                        {loc.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {loc.badge}
                          </span>
                        )}
                        {loc.isPrimary && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Primary HQ
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {loc.city}, {loc.state} ({loc.pincode})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditLocation(idx)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                        title="Edit Location"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(idx)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Address Text */}
                  <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="leading-relaxed">{loc.address}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {loc.city}, {loc.state} - {loc.pincode}, {loc.country || 'India'}
                      </p>
                    </div>
                  </div>

                  {/* Contact info */}
                  {(loc.phone || loc.email || loc.mapUrl) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                      {loc.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-amber-500" />
                          <span className="font-mono text-[11px]">{loc.phone}</span>
                        </div>
                      )}
                      {loc.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-amber-500" />
                          <span className="truncate text-[11px]">{loc.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-3 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    {loc.mapUrl ? (
                      <a
                        href={loc.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 font-mono hover:underline"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Google Maps</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">No Map URL</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!loc.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryLocation(idx)}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Make Primary HQ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleLocationActive(idx)}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        loc.isActive !== false
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {loc.isActive !== false ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state if no locations */}
          {(settings.locations?.length || 0) === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <MapPin className="w-10 h-10 text-slate-400 mx-auto animate-bounce" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Office Locations Configured</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Add your primary corporate headquarters or innovation centers to display on the platform.
              </p>
              <Button
                type="button"
                onClick={handleOpenAddLocation}
                className="bg-amber-500 text-slate-950 font-bold cursor-pointer"
              >
                Add First Location
              </Button>
            </div>
          )}

          {/* Location Preview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                Live Public Footer Location Output
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
              {(settings.locations || [])
                .filter((l) => l.isActive !== false)
                .map((loc, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {loc.title}:
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                        {loc.address}, {loc.city}, {loc.state} ({loc.pincode})
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRAND IDENTITY & CONTACT */}
      {activeTab === 'brand' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Brand Identity & Corporate Info
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure your primary company name, tagline, official contact email, and support numbers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Platform / Company Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Support & Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Support Helpline / WhatsApp Phone
              </label>
              <input
                type="text"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Logo URL (Optional)
              </label>
              <input
                type="url"
                value={settings.logoUrl || ''}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://your-domain.com/logo.png"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONAL CONTROLS */}
      {activeTab === 'operations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Operational & System Controls
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Platform emergency maintenance toggles and default listing pagination.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Maintenance Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                When enabled, public learners will see a friendly maintenance advisory screen.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Items per Page (Pagination)
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={settings.defaultPagination}
              onChange={(e) =>
                setSettings({ ...settings, defaultPagination: parseInt(e.target.value) || 12 })
              }
              className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN SECURITY & PASSWORD MANAGEMENT */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Admin Identity & Security Card */}
          <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border border-amber-500/25 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 shrink-0">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {user?.name || 'Platform Administrator'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                      Super Admin
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Active & Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                    {user?.email || 'admin@nexteracoders.com'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
                <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Zero-Trust Session Guard</span>
              </div>
            </div>

            {/* Quick Security Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Credential Status</span>
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Bcrypt Salted Hash (Secured)</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                  <span>Administrative Role</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Full Cluster Privileges</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                  <span>Session Type</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">HttpOnly Secure JWT</div>
              </div>
            </div>
          </div>

          {/* Main Password Change Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span>Change Super Admin Password</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Update your login password anytime. Once changed, your credentials will be instantly encrypted and refreshed.
              </p>
            </div>

            {/* Error Message */}
            {passwordError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Password Update Error</p>
                  <p>{passwordError}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {passwordSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-3 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Success!</p>
                  <p>{passwordSuccess}</p>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-5">
              {/* Current Password Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                  Current Password (Optional if initial setup)
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter strong new password"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Password Strength Requirements Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider">
                  Password Security Requirements:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <span className="text-xs">{newPassword.length >= 8 ? '✓' : '•'}</span>
                    <span>At least 8 characters length</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <span className="text-xs">{/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? '✓' : '•'}</span>
                    <span>Uppercase & lowercase letters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/\d/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <span className="text-xs">{/\d/.test(newPassword) ? '✓' : '•'}</span>
                    <span>At least 1 numeric digit (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <span className="text-xs">{/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(newPassword) ? '✓' : '•'}</span>
                    <span>Special character (@, #, $, %, etc.)</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end pt-2">
                <Button
                  type="submit"
                  disabled={passwordLoading || !newPassword || !confirmNewPassword}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Update Admin Password</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Save Actions Bar */}
      <div className="flex items-center justify-between p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl sticky bottom-4 z-20">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Changes will take effect immediately across all student and public portals upon saving.
        </div>
        <Button
          onClick={() => handleSave()}
          disabled={saving || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </Button>
      </div>

      {/* LOCATION ADD / EDIT MODAL */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <span>{editingLocIndex !== null ? 'Edit Office Location' : 'Add New Location'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hub / Campus Title *
                  </label>
                  <input
                    type="text"
                    value={locationForm.title}
                    onChange={(e) => setLocationForm({ ...locationForm, title: e.target.value })}
                    placeholder="e.g. Corporate & Innovation Hub"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Badge / Tag (e.g. HQ Hub, Campus)
                  </label>
                  <input
                    type="text"
                    value={locationForm.badge || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, badge: e.target.value })}
                    placeholder="e.g. HQ Hub"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Street Address *
                </label>
                <textarea
                  rows={2}
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  placeholder="e.g. A-143, 6th Floor, Sovereign Corporate Tower, Sector-136"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    placeholder="Noida"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State *</label>
                  <input
                    type="text"
                    value={locationForm.state}
                    onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                    placeholder="Uttar Pradesh"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={locationForm.pincode}
                    onChange={(e) => setLocationForm({ ...locationForm, pincode: e.target.value })}
                    placeholder="201305"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Helpline (Optional)
                  </label>
                  <input
                    type="text"
                    value={locationForm.phone || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={locationForm.email || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, email: e.target.value })}
                    placeholder="contact@nexteracoders.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Google Maps Directions Link (Optional)
                </label>
                <input
                  type="url"
                  value={locationForm.mapUrl || ''}
                  onChange={(e) => setLocationForm({ ...locationForm, mapUrl: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationForm.isPrimary}
                    onChange={(e) =>
                      setLocationForm({ ...locationForm, isPrimary: e.target.checked })
                    }
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Set as Primary Corporate HQ</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocationModalOpen(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveLocationForm}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                {editingLocIndex !== null ? 'Update Location' : 'Save Location'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
