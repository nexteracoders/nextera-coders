import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Crown,
  Award,
  Sliders,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import {
  ICertificateTemplateSettings,
  DEFAULT_CERTIFICATE_TEMPLATE,
} from '../../types/certificate.types';
import { adminService } from '../../services/admin.service';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';

interface CertificateTemplateCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: ICertificateTemplateSettings) => void;
}

export const CertificateTemplateCustomizerModal: React.FC<CertificateTemplateCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState<ICertificateTemplateSettings>(DEFAULT_CERTIFICATE_TEMPLATE);
  const [activeTab, setActiveTab] = useState<'branding' | 'headings' | 'freeTrack' | 'proTrack' | 'signatures'>('branding');
  const [previewTrack, setPreviewTrack] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplate();
    }
  }, [isOpen]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const tpl = await adminService.getCertificateTemplate();
      if (tpl) {
        setForm({
          ...DEFAULT_CERTIFICATE_TEMPLATE,
          ...tpl,
        });
      }
    } catch (err: any) {
      console.error('Failed to load certificate template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof ICertificateTemplateSettings, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await adminService.updateCertificateTemplate(form);
      success('Certificate template and format successfully updated for both Free & Pro tracks!', 'Template Saved');
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Failed to update certificate template', 'Save Error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setForm(DEFAULT_CERTIFICATE_TEMPLATE);
    setResetConfirm(false);
    success('Template format reset to official factory defaults. Click Save to persist.', 'Defaults Restored');
  };

  if (!isOpen) return null;

  const isFreePreview = previewTrack === 'free';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="relative w-full max-w-7xl h-[94vh] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-700 bg-slate-50/80 dark:bg-dark-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Customize Certificate Format
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase">
                  Free & NEC Pro Tracks
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Design and configure dynamic credential templates, watermarks, typography, and signatory authority.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: Dual-Pane Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          
          {/* LEFT COLUMN: Controls & Tabs (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 overflow-hidden">
            
            {/* Nav Tabs */}
            <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 overflow-x-auto no-scrollbar shrink-0 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('branding')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
                  activeTab === 'branding'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Branding</span>
              </button>

              <button
                onClick={() => setActiveTab('headings')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
                  activeTab === 'headings'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Headings</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('freeTrack');
                  setPreviewTrack('free');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
                  activeTab === 'freeTrack'
                    ? 'bg-white dark:bg-dark-700 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Free Track</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('proTrack');
                  setPreviewTrack('pro');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
                  activeTab === 'proTrack'
                    ? 'bg-white dark:bg-dark-700 text-amber-700 dark:text-amber-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>NEC Pro</span>
              </button>

              <button
                onClick={() => setActiveTab('signatures')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
                  activeTab === 'signatures'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-rose-500" />
                <span>Signatures & Seal</span>
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {/* Dynamic Synchronization & Empty Field Guidance Banner */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">100% Dynamic & Real-Time Sync:</span>
                  <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                    Aap jo bhi customize karenge wo <strong>User Side</strong>, <strong>Admin Preview</strong> aur <strong>PDF Download/Email</strong> sabhi jagah dynamically update hoga. Agar aap kisi text box ko <strong>khali (blank)</strong> chhod denge, to wo field certificate par show nahi hoga.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                  <span className="text-xs">Loading certificate template settings...</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: BRANDING & LOGOS */}
                  {activeTab === 'branding' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-xs text-amber-800 dark:text-amber-300">
                        <strong>Official Asset Notice:</strong> The official 3D NEC Favicon (<code className="font-mono text-[11px]">/images/nec-favicon.png</code>) is used by default as the prestigious transparent crest and subtle watermark.
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span>Header Logo URL</span>
                          <span className="text-[10px] text-slate-400 font-mono">PNG / SVG / WebP</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={form.headerLogoUrl}
                            onChange={(e) => handleFieldChange('headerLogoUrl', e.target.value)}
                            placeholder="/images/nec-favicon.png"
                            className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={form.headerLogoUrl || '/images/nec-favicon.png'}
                              alt="Header Logo"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/nec-favicon.png';
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span>Watermark Crest Logo URL</span>
                          <span className="text-[10px] text-slate-400 font-mono">Center Background</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={form.watermarkLogoUrl}
                            onChange={(e) => handleFieldChange('watermarkLogoUrl', e.target.value)}
                            placeholder="/images/nec-favicon.png"
                            className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={form.watermarkLogoUrl || '/images/nec-favicon.png'}
                              alt="Watermark Logo"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/nec-favicon.png';
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-bold text-slate-800 dark:text-slate-200">
                            Watermark Opacity: <span className="font-mono text-amber-600 font-bold">{Math.round((form.watermarkOpacity ?? 0.12) * 100)}%</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">Recommended: 10% - 15%</span>
                        </div>
                        <input
                          type="range"
                          min="0.01"
                          max="0.30"
                          step="0.01"
                          value={form.watermarkOpacity ?? 0.12}
                          onChange={(e) => handleFieldChange('watermarkOpacity', parseFloat(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Organization / Issuer Name
                        </label>
                        <input
                          type="text"
                          value={form.organizationName}
                          onChange={(e) => handleFieldChange('organizationName', e.target.value)}
                          placeholder="NextEra Coders Academy (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Registry Subtext / Tagline
                        </label>
                        <input
                          type="text"
                          value={form.organizationSubtext}
                          onChange={(e) => handleFieldChange('organizationSubtext', e.target.value)}
                          placeholder="Official Credential & Verification Registry (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: HEADINGS & PRESENTATION */}
                  {activeTab === 'headings' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Certificate Primary Title
                        </label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          placeholder="Certificate of Achievement (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-[10px] text-slate-400">
                          Rendered in luxury serif <em>Playfair Display / Cinzel</em> bold heading.
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Presentation Subtitle / Lead-in Text
                        </label>
                        <input
                          type="text"
                          value={form.subtitle}
                          onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                          placeholder="This is proudly presented to (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-[10px] text-slate-400">
                          Displayed with dual gold divider lines above recipient student name.
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-dark-800/60 rounded-2xl border border-slate-200 dark:border-dark-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Recipient Name Typography</span>
                        </div>
                        <p>
                          Student names are rendered in prestigious grand calligraphy cursive script (<em>Great Vibes</em> / <em>Alex Brush</em>), ensuring royal aesthetic and high legibility.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FREE TRACK FORMAT */}
                  {activeTab === 'freeTrack' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                        <div>
                          <strong>Free Track Customization:</strong> Configure badges, descriptions, and conferral terms specifically for community / free course graduation credentials.
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Free Track Badge Label
                        </label>
                        <input
                          type="text"
                          value={form.freeTrackBadge}
                          onChange={(e) => handleFieldChange('freeTrackBadge', e.target.value)}
                          placeholder="NextEra Open Academy • Verified Completion (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Free Course Completion Description (Above Course Name)
                        </label>
                        <textarea
                          rows={3}
                          value={form.freeTrackDescription}
                          onChange={(e) => handleFieldChange('freeTrackDescription', e.target.value)}
                          placeholder="for having successfully demonstrated coding competency and successfully completing the free"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Free Track Honors & Legal Statement (Below Course Name)
                        </label>
                        <textarea
                          rows={3}
                          value={form.freeHonorsStatement}
                          onChange={(e) => handleFieldChange('freeHonorsStatement', e.target.value)}
                          placeholder="Conferred under the NextEra Open Engineering Initiative upon demonstrating rigorous coding competency and foundational mastery (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 4: NEC PRO TRACK FORMAT */}
                  {activeTab === 'proTrack' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <Crown className="w-4 h-4 shrink-0 text-amber-600 fill-current mt-0.5" />
                        <div>
                          <strong>NEC Pro Track Customization:</strong> Configure premium distinction badges, comprehensive mastery descriptions, and fellowship honors for Pro graduates.
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          NEC Pro Track Badge Label
                        </label>
                        <input
                          type="text"
                          value={form.proTrackBadge}
                          onChange={(e) => handleFieldChange('proTrackBadge', e.target.value)}
                          placeholder="NextEra Pro Specialization • Verified Honors Track (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          NEC Pro Completion Description (Above Course Name)
                        </label>
                        <textarea
                          rows={3}
                          value={form.proTrackDescription}
                          onChange={(e) => handleFieldChange('proTrackDescription', e.target.value)}
                          placeholder="for successfully mastering all curriculum modules, architecture benchmarks, and hands-on engineering projects in"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          NEC Pro Honors & Recognition Statement (Below Course Name)
                        </label>
                        <textarea
                          rows={3}
                          value={form.proHonorsStatement}
                          onChange={(e) => handleFieldChange('proHonorsStatement', e.target.value)}
                          placeholder="Conferred under the NextEra Advanced Engineering Fellowship with verified production architecture, live code review, and honors standing (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 5: SIGNATURES & OFFICIAL SEAL */}
                  {activeTab === 'signatures' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Authorized Signatory Full Name
                        </label>
                        <input
                          type="text"
                          value={form.signatoryName}
                          onChange={(e) => handleFieldChange('signatoryName', e.target.value)}
                          placeholder="Sandip Kumar Verma (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Authorized Signatory Title
                        </label>
                        <input
                          type="text"
                          value={form.signatoryTitle}
                          onChange={(e) => handleFieldChange('signatoryTitle', e.target.value)}
                          placeholder="Founder & Chief Mentor (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Signature Cursive Text
                        </label>
                        <input
                          type="text"
                          value={form.signatorySignatureText}
                          onChange={(e) => handleFieldChange('signatorySignatureText', e.target.value)}
                          placeholder="Sandip Kr Verma (leave blank to hide)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Optional Signature PNG Image URL (Leave blank to use cursive text)
                        </label>
                        <input
                          type="text"
                          value={form.signatureImageUrl || ''}
                          onChange={(e) => handleFieldChange('signatureImageUrl', e.target.value)}
                          placeholder="/images/founder-signature.png"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-dark-700 space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          3D Embossed Medal Seal
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              Seal Top Text
                            </label>
                            <input
                              type="text"
                              value={form.sealTopText}
                              onChange={(e) => handleFieldChange('sealTopText', e.target.value)}
                              placeholder="OFFICIAL (leave blank to hide)"
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              Seal Bottom Text
                            </label>
                            <input
                              type="text"
                              value={form.sealBottomText}
                              onChange={(e) => handleFieldChange('sealBottomText', e.target.value)}
                              placeholder="SEAL (leave blank to hide)"
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Seal Subtext / Ribbon Label
                          </label>
                          <input
                            type="text"
                            value={form.sealSubtext}
                            onChange={(e) => handleFieldChange('sealSubtext', e.target.value)}
                            placeholder="Verified Credential (leave blank to hide)"
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 bg-slate-50 dark:bg-dark-800/80 border-t border-slate-200 dark:border-dark-700 flex items-center justify-between shrink-0">
              {resetConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Reset all?</span>
                  <button
                    onClick={handleResetToDefaults}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setResetConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Factory Defaults</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Format Changes</span>
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-Time Live Preview Pane (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-100 dark:bg-dark-950 overflow-hidden">
            
            {/* Preview Track Switcher Bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-200/70 dark:bg-dark-800/80 border-b border-slate-300 dark:border-dark-700 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Real-Time Live Certificate Preview
                </span>
              </div>

              {/* Free vs Pro Track Switcher */}
              <div className="flex items-center p-1 bg-white/80 dark:bg-dark-900 rounded-xl border border-slate-300 dark:border-dark-700">
                <button
                  onClick={() => setPreviewTrack('free')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewTrack === 'free'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Free Track</span>
                </button>
                <button
                  onClick={() => setPreviewTrack('pro')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewTrack === 'pro'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  <span>NEC Pro Track</span>
                </button>
              </div>
            </div>

            {/* Live Certificate Card Rendering (Scaled to fit viewport comfortably) */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex items-center justify-center">
              <div className="w-full max-w-[760px] aspect-[1.414/1] bg-[#FCFBF7] text-slate-900 rounded-2xl shadow-xl border border-[#D4AF37]/70 relative overflow-hidden select-none p-4 sm:p-6 text-center flex flex-col justify-between space-y-2">
                
                {/* Dual hairline gold borders */}
                <div className="absolute inset-1.5 border-[1px] border-[#D4AF37]/60 pointer-events-none z-0" />
                <div className="absolute inset-2.5 border-[0.5px] border-[#0B192C]/20 pointer-events-none z-0" />

                {/* 1. TOP-LEFT CORNER DELICATE LUXURY ACCENT (Larger Deep Navy & Rich Gold) */}
                <div className="absolute top-0 left-0 w-28 sm:w-36 h-28 sm:h-36 pointer-events-none z-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,0 L140,0 C100,45 65,80 35,115 C10,145 0,200 0,200 Z" fill="#0B192C" />
                    <path d="M0,0 L95,0 C70,35 45,65 20,95 C5,120 0,160 0,160 Z" fill="#1E3E62" />
                    <path d="M140,0 C100,45 65,80 35,115 C10,145 0,200 0,200 L0,190 C0,190 10,140 35,110 C65,75 100,40 136,0 Z" fill="#D4AF37" />
                    <path d="M95,0 C70,35 45,65 20,95 C5,120 0,160 0,160 L0,152 C0,152 5,115 20,90 C45,60 70,30 92,0 Z" fill="#F59E0B" />
                  </svg>
                </div>

                {/* 2. BOTTOM-RIGHT CORNER DELICATE LUXURY ACCENT (Larger Deep Navy & Rich Gold) */}
                <div className="absolute bottom-0 right-0 w-24 sm:w-32 h-24 sm:h-32 pointer-events-none z-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M200,200 L60,200 C100,155 135,120 165,85 C190,55 200,0 200,0 Z" fill="#0B192C" />
                    <path d="M200,200 L105,200 C130,165 155,135 180,105 C195,80 200,40 200,40 Z" fill="#1E3E62" />
                    <path d="M60,200 C100,155 135,120 165,85 C190,55 200,0 200,0 L200,10 C200,10 190,60 165,90 C135,125 100,160 64,200 Z" fill="#D4AF37" />
                    <path d="M105,200 C130,165 155,135 180,105 C195,80 200,40 200,40 L200,48 C200,48 195,85 180,110 C155,140 130,170 108,200 Z" fill="#F59E0B" />
                  </svg>
                </div>

                {/* Background Watermark (Clearly Visible Authentic Crest, No Washout Invert Filter) */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 select-none transition-opacity"
                  style={{ opacity: form.watermarkOpacity ?? 0.12 }}
                >
                  <img
                    src={form.watermarkLogoUrl || '/images/nec-favicon.png'}
                    alt="Watermark"
                    className="w-56 sm:w-64 h-auto object-contain drop-shadow-xs"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/nec-favicon.png';
                    }}
                  />
                </div>

                {/* Top Header: Logo, Organization, and Track Badge */}
                <div className="relative z-10 flex items-center justify-between border-b border-[#D4AF37]/35 pb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Official Brand Logo (Favicon directly without container box, enlarged) */}
                    <img
                      src={form.headerLogoUrl || '/images/nec-favicon.png'}
                      alt="Logo"
                      className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-md shrink-0 select-none"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/nec-favicon.png';
                      }}
                    />
                    <div className="text-left border-l-2 border-[#D4AF37]/70 pl-2.5">
                      {form.organizationName?.trim() && (
                        <span className="text-[11px] sm:text-xs font-serif font-black tracking-wider text-[#0B192C] uppercase block">
                          {form.organizationName}
                        </span>
                      )}
                      {form.organizationSubtext?.trim() && (
                        <span className="block text-[8px] font-mono text-[#B45309] font-bold uppercase">
                          {form.organizationSubtext}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isFreePreview && form.freeTrackBadge?.trim() && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[8.5px] font-mono font-bold tracking-wider uppercase">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{form.freeTrackBadge}</span>
                      </div>
                    )}
                    {!isFreePreview && form.proTrackBadge?.trim() && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-400 text-amber-950 text-[8.5px] font-mono font-black tracking-wider uppercase">
                        <Crown className="w-3 h-3 text-amber-700 fill-current" />
                        <span>{form.proTrackBadge}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate Title & Subtitle */}
                <div className="relative z-10 space-y-0.5 pt-0.5">
                  {form.title?.trim() && (
                    <h3
                      className="text-lg sm:text-xl font-black text-[#0B192C] tracking-wide"
                      style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Cinzel Decorative', Georgia, serif" }}
                    >
                      {form.title}
                    </h3>
                  )}
                  {form.subtitle?.trim() && (
                    <div className="flex items-center justify-center gap-2 py-0.5">
                      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                      <span className="text-[10px] font-serif italic text-slate-600">
                        {form.subtitle}
                      </span>
                      <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]" />
                    </div>
                  )}
                </div>

                {/* Recipient Student Name (Classic Elegant Calligraphy Cursive Font matching Founder Signature) */}
                <div className="relative z-10 py-0.5">
                  <h2
                    className="text-2xl sm:text-3xl md:text-4xl font-normal text-[#0B192C] tracking-wide select-none"
                    style={{
                      fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                      textShadow: '0 1px 3px rgba(11, 25, 44, 0.08)',
                      lineHeight: 1.2,
                    }}
                  >
                    Tamradhwaj Pandey
                  </h2>
                  <div className="w-44 sm:w-56 h-[1.5px] mx-auto mt-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                </div>

                {/* Conferral Description & Course Name */}
                <div className="relative z-10 max-w-lg mx-auto space-y-0.5">
                  {isFreePreview && form.freeTrackDescription?.trim() && (
                    <p className="text-[10px] sm:text-[11px] text-slate-700 leading-tight">
                      {form.freeTrackDescription}
                    </p>
                  )}
                  {!isFreePreview && form.proTrackDescription?.trim() && (
                    <p className="text-[10px] sm:text-[11px] text-slate-700 leading-tight">
                      {form.proTrackDescription}
                    </p>
                  )}
                  <h4 className="text-sm sm:text-base font-black text-[#1E3E62] tracking-tight">
                    {isFreePreview ? 'Full-Stack Web Development Course' : 'Full-Stack Web Development Mastery'}
                  </h4>
                  {isFreePreview && form.freeHonorsStatement?.trim() && (
                    <p className="text-[8.5px] sm:text-[9.5px] text-slate-500 italic max-w-md mx-auto leading-tight">
                      {form.freeHonorsStatement}
                    </p>
                  )}
                  {!isFreePreview && form.proHonorsStatement?.trim() && (
                    <p className="text-[8.5px] sm:text-[9.5px] text-slate-500 italic max-w-md mx-auto leading-tight">
                      {form.proHonorsStatement}
                    </p>
                  )}
                </div>

                {/* Footer: QR Code, 3D Scalloped Gold Medal Seal & Signature */}
                <div className="relative z-10 pt-2 border-t border-[#D4AF37]/35 grid grid-cols-3 items-center gap-2 text-left">
                  {/* QR Box */}
                  <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="w-10 h-10 bg-slate-50 rounded-md border border-slate-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-mono font-bold text-emerald-700 uppercase">
                        Verified
                      </span>
                      <span className="block text-[7px] font-mono text-slate-500 truncate max-w-[90px]">
                        NEC-CERT-2026-LIVE
                      </span>
                    </div>
                  </div>

                  {/* 2. AUTHENTIC 3D SCALLOPED GOLD ROSETTE MEDAL WITH GOLD SILK RIBBON TAILS */}
                  <div className="flex flex-col items-center justify-center my-0 select-none">
                    <div className="relative flex flex-col items-center">
                      <svg
                        viewBox="0 0 120 125"
                        className="w-16 h-18 sm:w-18 sm:h-20 filter drop-shadow-md overflow-visible"
                      >
                        <defs>
                          <linearGradient id="modalGoldRibbonL" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#CA8A04" />
                            <stop offset="35%" stopColor="#FDE047" />
                            <stop offset="70%" stopColor="#EAB308" />
                            <stop offset="100%" stopColor="#854D0E" />
                          </linearGradient>

                          <linearGradient id="modalGoldRibbonR" x1="1" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#CA8A04" />
                            <stop offset="35%" stopColor="#FDE047" />
                            <stop offset="70%" stopColor="#EAB308" />
                            <stop offset="100%" stopColor="#854D0E" />
                          </linearGradient>

                          <radialGradient id="modalRosetteGoldGrad" cx="35%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#FEF9C3" />
                            <stop offset="25%" stopColor="#FDE047" />
                            <stop offset="60%" stopColor="#EAB308" />
                            <stop offset="85%" stopColor="#CA8A04" />
                            <stop offset="100%" stopColor="#78350F" />
                          </radialGradient>

                          <linearGradient id="modalOuterBevelGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FEF08A" />
                            <stop offset="50%" stopColor="#CA8A04" />
                            <stop offset="100%" stopColor="#78350F" />
                          </linearGradient>

                          <radialGradient id="modalSunburstCoreGrad" cx="42%" cy="38%" r="62%">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                            <stop offset="15%" stopColor="#FEF9C3" />
                            <stop offset="45%" stopColor="#FACC15" />
                            <stop offset="75%" stopColor="#EAB308" />
                            <stop offset="92%" stopColor="#B45309" />
                            <stop offset="100%" stopColor="#78350F" />
                          </radialGradient>

                          <filter id="modalMedalDropShadow" x="-15%" y="-15%" width="130%" height="130%">
                            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#78350F" floodOpacity="0.35" />
                          </filter>
                        </defs>

                        {/* Layer 1: Left Gold Silk Ribbon Tail with Swallowtail V-notch */}
                        <path
                          d="M 44 55 L 24 108 L 38 96 L 50 110 L 53 55 Z"
                          fill="url(#modalGoldRibbonL)"
                          stroke="#854D0E"
                          strokeWidth="0.8"
                          strokeLinejoin="round"
                        />

                        {/* Layer 2: Right Gold Silk Ribbon Tail with Swallowtail V-notch */}
                        <path
                          d="M 67 55 L 70 110 L 82 96 L 96 108 L 76 55 Z"
                          fill="url(#modalGoldRibbonR)"
                          stroke="#854D0E"
                          strokeWidth="0.8"
                          strokeLinejoin="round"
                        />

                        {/* Layer 3: 24-Petal Scalloped Rosette Outer Medallion Rim */}
                        <path
                          d="M 100.65 54.65 Q 108.00 60.00, 100.65 65.35 Q 106.36 72.42, 97.88 75.69 Q 101.57 84.00, 92.53 84.96 Q 93.94 93.94, 84.96 92.53 Q 84.00 101.57, 75.69 97.88 Q 72.42 106.36, 65.35 100.65 Q 60.00 108.00, 54.65 100.65 Q 47.58 106.36, 44.31 97.88 Q 36.00 101.57, 35.04 92.53 Q 26.06 93.94, 27.47 84.96 Q 18.43 84.00, 22.12 75.69 Q 13.64 72.42, 19.35 65.35 Q 12.00 60.00, 19.35 54.65 Q 13.64 47.58, 22.12 44.31 Q 18.43 36.00, 27.47 35.04 Q 26.06 26.06, 35.04 27.47 Q 36.00 18.43, 44.31 22.12 Q 47.58 13.64, 54.65 19.35 Q 60.00 12.00, 65.35 19.35 Q 72.42 13.64, 75.69 22.12 Q 84.00 18.43, 84.96 27.47 Q 93.94 26.06, 92.53 35.04 Q 101.57 36.00, 97.88 44.31 Q 106.36 47.58, 100.65 54.65 Z"
                          fill="url(#modalRosetteGoldGrad)"
                          stroke="#92400E"
                          strokeWidth="1.2"
                          filter="url(#modalMedalDropShadow)"
                        />

                        {/* Layer 4: Outer Coin-Edge Bevel Ring */}
                        <circle cx="60" cy="60" r="39" fill="url(#modalOuterBevelGrad)" stroke="#78350F" strokeWidth="1" />

                        {/* Layer 5: Inner Recessed Groove & Dashed Filigree Ring */}
                        <circle cx="60" cy="60" r="35" fill="none" stroke="#78350F" strokeWidth="1.2" strokeDasharray="2.5,1.5" />

                        {/* Layer 6: Polished Sunburst Radial Metallic Core */}
                        <circle cx="60" cy="60" r="32" fill="url(#modalSunburstCoreGrad)" stroke="#92400E" strokeWidth="0.8" />

                        {/* Layer 7: Dynamic Embossed Text inside Seal */}
                        <text
                          x="60"
                          y="51"
                          textAnchor="middle"
                          fontSize="8"
                          fontFamily="sans-serif"
                          fontWeight="900"
                          letterSpacing="1.2"
                          fill="#78350F"
                        >
                          {form.sealTopText?.trim() || 'NEC'}
                        </text>

                        <text
                          x="60"
                          y="60"
                          textAnchor="middle"
                          fontSize="7"
                          fill="#92400E"
                        >
                          ★
                        </text>

                        <text
                          x="60"
                          y="71"
                          textAnchor="middle"
                          fontSize="7.5"
                          fontFamily="sans-serif"
                          fontWeight="800"
                          letterSpacing="1"
                          fill="#78350F"
                        >
                          {form.sealBottomText?.trim() || '2026'}
                        </text>
                      </svg>

                      {/* Verified Credential Gold Plaque Banner (Render only if non-empty) */}
                      {form.sealSubtext?.trim() && (
                        <div className="mt-1 z-10 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border border-amber-400/80 shadow-xs">
                          <span className="text-[7.5px] font-mono font-black text-[#78350F] uppercase tracking-wider block">
                            {form.sealSubtext}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="text-right space-y-0.5">
                    <div className="h-7 flex items-end justify-end">
                      {form.signatureImageUrl?.trim() ? (
                        <img
                          src={form.signatureImageUrl}
                          alt={form.signatoryName || 'Signature'}
                          className="max-h-7 object-contain"
                        />
                      ) : form.signatorySignatureText?.trim() ? (
                        <span
                          className="text-xl text-[#0B192C] italic select-none"
                          style={{ fontFamily: "'Great Vibes', 'Alex Brush', cursive" }}
                        >
                          {form.signatorySignatureText}
                        </span>
                      ) : null}
                    </div>
                    {(form.signatorySignatureText?.trim() || form.signatureImageUrl?.trim() || form.signatoryName?.trim()) && (
                      <div className="w-28 h-[1px] bg-[#0B192C]/40 ml-auto" />
                    )}
                    {form.signatoryName?.trim() && (
                      <span className="block text-[9px] font-bold text-[#0B192C]">
                        {form.signatoryName}
                      </span>
                    )}
                    {form.signatoryTitle?.trim() && (
                      <span className="block text-[7.5px] font-mono text-slate-600 uppercase">
                        {form.signatoryTitle}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
