import React, { useState, useEffect } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { adminPaymentService } from '../../services/adminPayment.service';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { PRO_ONE_PLANS, ProOnePlanConfig } from '../../components/pro-one/ProOnePaymentModal';
import {
  Crown,
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminNecProOnePage: React.FC = () => {
  useDocumentTitle('NEC Pro One Governance — Admin Portal');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<ProOnePlanConfig[]>(PRO_ONE_PLANS);
  const [activePlanIdx, setActivePlanIdx] = useState<number>(1); // Default to Yearly
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Fetch current plans config from server
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminPaymentService.getPaymentSettings();
      if (data.proOnePlans && data.proOnePlans.length > 0) {
        setPlans(data.proOnePlans);
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Failed to fetch Pro One configuration. Using local defaults.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlanField = (
    field: keyof ProOnePlanConfig,
    value: string | number
  ) => {
    setPlans((prev) => {
      const next = [...prev];
      next[activePlanIdx] = {
        ...next[activePlanIdx],
        [field]: value,
      };
      return next;
    });
  };

  const handleAddFeature = () => {
    const text = newFeatureText.trim();
    if (!text) return;
    setPlans((prev) => {
      const next = [...prev];
      const curPlan = next[activePlanIdx];
      next[activePlanIdx] = {
        ...curPlan,
        features: [...curPlan.features, text],
      };
      return next;
    });
    setNewFeatureText('');
  };

  const handleUpdateFeature = (fIdx: number, text: string) => {
    setPlans((prev) => {
      const next = [...prev];
      const curPlan = next[activePlanIdx];
      const newFeatures = [...curPlan.features];
      newFeatures[fIdx] = text;
      next[activePlanIdx] = {
        ...curPlan,
        features: newFeatures,
      };
      return next;
    });
  };

  const handleDeleteFeature = (fIdx: number) => {
    setPlans((prev) => {
      const next = [...prev];
      const curPlan = next[activePlanIdx];
      next[activePlanIdx] = {
        ...curPlan,
        features: curPlan.features.filter((_, i) => i !== fIdx),
      };
      return next;
    });
  };

  const handleMoveFeature = (fIdx: number, direction: 'up' | 'down') => {
    setPlans((prev) => {
      const next = [...prev];
      const curPlan = next[activePlanIdx];
      const newFeatures = [...curPlan.features];
      const targetIdx = direction === 'up' ? fIdx - 1 : fIdx + 1;
      if (targetIdx < 0 || targetIdx >= newFeatures.length) return prev;

      const temp = newFeatures[fIdx];
      newFeatures[fIdx] = newFeatures[targetIdx];
      newFeatures[targetIdx] = temp;

      next[activePlanIdx] = {
        ...curPlan,
        features: newFeatures,
      };
      return next;
    });
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await adminPaymentService.updatePaymentSettings({
        proOnePlans: plans,
      });
      setMessage({
        type: 'success',
        text: 'NEC Pro One pricing, plan details & feature checklists saved successfully!',
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save changes. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all 3 plans to default pricing (₹399, ₹2,999, ₹5,999) and feature lists?')) {
      setPlans(PRO_ONE_PLANS);
      setMessage({
        type: 'success',
        text: 'Reset to standard defaults. Click "Save All Changes" to persist to database.',
      });
    }
  };

  const activePlan = plans[activePlanIdx] || plans[0];

  return (
    <div className="space-y-6 pb-16">
      <AdminPageHeader
        title="NEC Pro One Governance"
        description="Comprehensive CMS control over public membership plans, pricing, durations, badges, and 'This plan includes:' feature checklists."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Commerce & Rewards' },
          { label: 'NEC Pro One' },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/pro-one"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Live Page</span>
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAll}
              disabled={saving}
              className="text-xs flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
            </Button>
          </div>
        }
      />

      {/* Alert Banner */}
      {message && (
        <div
          className={cn(
            'p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-fadeIn',
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-sm">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <span>Loading Pro One settings...</span>
        </div>
      ) : (
        <>
          {/* Plan Switcher Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan, idx) => {
          const isSelected = activePlanIdx === idx;
          const isPro = plan.id === 'lifetime';
          return (
            <div
              key={plan.id}
              onClick={() => setActivePlanIdx(idx)}
              className={cn(
                'relative p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none text-left',
                isSelected
                  ? 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 hover:border-slate-300 dark:hover:border-dark-700'
              )}
            >
              {plan.badge && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-2 mb-1.5">
                <Crown
                  className={cn(
                    'w-4 h-4',
                    isPro ? 'text-purple-500' : 'text-amber-500'
                  )}
                />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {plan.name}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-slate-500">
                  {plan.id === 'lifetime' ? '3 Years' : plan.id}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  ₹{plan.price.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-sans">
                  {plan.durationLabel}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {plan.subtitle}
              </p>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{plan.features.length} Features included</span>
                {isSelected && (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 font-sans">
                    <Check className="w-3 h-3" /> Active Editor
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main CMS Editor + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Details & Feature List Editor */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Basic Information */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>Plan Identity & Labels ({activePlan.name})</span>
                </CardTitle>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300">
                  ID: {activePlan.id}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Plan Name"
                  value={activePlan.name}
                  onChange={(e) => handleUpdatePlanField('name', e.target.value)}
                  placeholder="e.g. Basic Plan, Plus Plan, Pro Plan"
                />

                <Input
                  label="Badge Label (Optional)"
                  value={activePlan.badge || ''}
                  onChange={(e) => handleUpdatePlanField('badge', e.target.value)}
                  placeholder="e.g. Popular, Recommended, Best Value"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Duration Label"
                  value={activePlan.durationLabel}
                  onChange={(e) => handleUpdatePlanField('durationLabel', e.target.value)}
                  placeholder="e.g. 1 month access, /month"
                />

                <Input
                  label="Billing Text"
                  value={activePlan.billingText}
                  onChange={(e) => handleUpdatePlanField('billingText', e.target.value)}
                  placeholder="e.g. 1 month access, ₹2,999 for 1 year, ₹5,999 for 3 years"
                />
              </div>

              <div>
                <Input
                  label="Subtitle Description"
                  value={activePlan.subtitle}
                  onChange={(e) => handleUpdatePlanField('subtitle', e.target.value)}
                  placeholder="e.g. Monthly paid plan, 1 year paid plan, 3 year paid plan."
                />
              </div>

              <div>
                <Input
                  label="Sub Price / Total Text (Shown under monthly price)"
                  value={activePlan.subPriceText || ''}
                  onChange={(e) => handleUpdatePlanField('subPriceText', e.target.value)}
                  placeholder="e.g. ₹399 total for 1 month, ₹2,999 for 1 year, ₹5,999 for 3 years"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Pricing Configuration */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-dark-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>Pricing & Discount Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={activePlan.price}
                    onChange={(e) => handleUpdatePlanField('price', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={activePlan.originalPrice}
                    onChange={(e) => handleUpdatePlanField('originalPrice', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3 py-2 text-sm font-mono font-medium text-slate-500 line-through focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                    Per Month Rate (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={activePlan.perMonthPrice || 0}
                    onChange={(e) => handleUpdatePlanField('perMonthPrice', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3 py-2 text-sm font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                    Save Percent (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={activePlan.savePercent || 0}
                    onChange={(e) => handleUpdatePlanField('savePercent', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3 py-2 text-sm font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. "This plan includes:" Features List CMS */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>'This plan includes:' Checklist CMS</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Add, edit, delete, or reorder the bullet points displayed on the pricing card.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {activePlan.features.length} Items
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Add New Feature Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="Type new feature (e.g. 'Unlimited Cloud AI Assistant', 'Mock Tests')..."
                  className="flex-1 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddFeature}
                  className="shrink-0 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </Button>
              </div>

              {/* Feature Items List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {activePlan.features.map((feature, fIdx) => (
                  <div
                    key={fIdx}
                    className="group flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 hover:border-slate-300 dark:hover:border-dark-700 transition-colors"
                  >
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={fIdx === 0}
                        onClick={() => handleMoveFeature(fIdx, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-dark-750"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={fIdx === activePlan.features.length - 1}
                        onClick={() => handleMoveFeature(fIdx, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-dark-750"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Step Index Badge */}
                    <span className="text-[11px] font-mono text-slate-400 shrink-0 w-5 text-center">
                      {fIdx + 1}.
                    </span>

                    {/* Feature Text Input */}
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleUpdateFeature(fIdx, e.target.value)}
                      className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-white dark:focus:bg-dark-900 px-2 py-1 rounded border border-transparent focus:border-amber-500 font-medium"
                    />

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteFeature(fIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                      title="Delete Feature"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Card Preview */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Live Card Preview
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Updates real-time as you type
            </span>
          </div>

          {/* Actual Card Render matching /pro-one */}
          <div
            className={cn(
              'rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative shadow-xl',
              activePlan.id === 'lifetime'
                ? 'bg-white dark:bg-dark-900 border-2 border-[#8b5cf6] dark:border-[#a855f7] shadow-purple-500/5'
                : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800'
            )}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between min-h-[46px]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {activePlan.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {activePlan.subtitle}
                  </p>
                </div>

                {activePlan.badge && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-[#f3e8ff] dark:bg-purple-950/70 text-[#7c3aed] dark:text-purple-300">
                    {activePlan.badge}
                  </span>
                )}
              </div>

              {/* Price Block */}
              <div className="mt-5 h-[62px] flex flex-col justify-end">
                {activePlan.id === 'monthly' ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
                      ₹{activePlan.price.toLocaleString()}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
                      {activePlan.durationLabel}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
                        ₹{(activePlan.perMonthPrice || 0).toLocaleString()}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
                        /month
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                      {activePlan.subPriceText || activePlan.billingText}
                    </p>
                  </div>
                )}
              </div>

              {/* Preview 1: Activate Membership (For non-members) */}
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  className={cn(
                    'w-full py-2.5 px-4 rounded-xl font-bold text-sm text-center shadow-xs',
                    activePlan.id === 'lifetime'
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[#e5e7eb] text-slate-900 dark:bg-dark-800 dark:text-slate-100'
                  )}
                >
                  Activate Membership
                </button>
                <div className="text-[10px] text-center text-slate-400">
                  (Shown to students without active membership)
                </div>
              </div>

              {/* Preview 2: Active Membership (For verified members) */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-800 space-y-2">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 shadow-md shadow-amber-500/25"
                >
                  <Crown className="w-4 h-4 fill-current text-slate-950" />
                  <span>Active Membership</span>
                </button>
                <div className="text-[10px] text-center text-amber-600 dark:text-amber-400 font-medium">
                  (Shown to verified Pro members with gold gradient)
                </div>
              </div>

              {/* "This plan includes:" Section */}
              <div className="mt-6 pt-1">
                <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3.5">
                  This plan includes:
                </div>

                <div className="space-y-2.5">
                  {activePlan.features.map((feature, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center gap-2.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-normal leading-snug"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
