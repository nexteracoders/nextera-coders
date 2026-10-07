import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import {
  sundayContestService,
  SundayContestConfig,
  SundayContestProblem,
  TestCase,
  PRACTICE_PROBLEMS_CATALOG,
  PracticeProblemTemplate,
  CoderProfile,
} from '../../services/contest.service';
import {
  coinService,
  UserWalletRecord,
  SwagOrder,
} from '../../services/coin.service';
import { adminService } from '../../services/admin.service';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ROUTES } from '../../constants/routes';
import { getCleanStarterCode } from '../../utils/starterCode';
import {
  Trophy,
  Save,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Code2,
  BookOpen,
  Search,
  Flame,
  ArrowRight,
  X,
  Gift,
  Edit3,
  Tag,
  Coins,
  Package,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Shield,
  History,
  UserX,
  UserCheck,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminContestPage: React.FC = () => {
  useDocumentTitle('Weekly Contest, Coins & Swag Manager — NextEra Admin');
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  const [config, setConfig] = useState<SundayContestConfig>(sundayContestService.getConfig());
  
  // Primary Admin Tab: 'weekly' | 'daily' | 'coins' | 'swag' | 'anticheat'
  const [activeMainTab, setActiveMainTab] = useState<'weekly' | 'daily' | 'coins' | 'swag' | 'anticheat'>('weekly');

  // Anti-Cheat Inspection & Playback Modal State
  const [antiCheatParticipants, setAntiCheatParticipants] = useState<CoderProfile[]>(() =>
    sundayContestService.getAntiCheatParticipants()
  );
  const [antiCheatSearch, setAntiCheatSearch] = useState('');
  const [antiCheatStatusFilter, setAntiCheatStatusFilter] = useState<'all' | 'Clean' | 'Suspicious' | 'Flagged'>('all');
  const [antiCheatSwitchFilter, setAntiCheatSwitchFilter] = useState<'all' | 'has_switches' | 'high_switches'>('all');
  const [selectedStudentPlayback, setSelectedStudentPlayback] = useState<CoderProfile | null>(null);
  const [isPlaybackModalOpen, setIsPlaybackModalOpen] = useState(false);
  const [adminOverrideReason, setAdminOverrideReason] = useState('');

  // 0 = Q1, 1 = Q2, 2 = Daily Streak Problem
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [activeCodeLang, setActiveCodeLang] = useState<'javascript' | 'python' | 'java' | 'cpp' | 'typescript'>('java');

  // Practice Problem Import Modal State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Multi-User Wallets State for Admin
  const [userWallets, setUserWallets] = useState<UserWalletRecord[]>(coinService.getAllUserWallets());
  const [walletsSearch, setWalletsSearch] = useState('');

  // Coins Adjustment Modal State
  const [selectedUserForCoins, setSelectedUserForCoins] = useState<UserWalletRecord | null>(null);
  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false);
  const [coinsAmount, setCoinsAmount] = useState<number>(100);
  const [coinsMode, setCoinsMode] = useState<'add' | 'deduct' | 'set'>('add');
  const [coinsReason, setCoinsReason] = useState<string>('Contest bonus / Community reward');

  // Streak Adjustment Modal State
  const [selectedUserForStreak, setSelectedUserForStreak] = useState<UserWalletRecord | null>(null);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [streakValue, setStreakValue] = useState<number>(7);
  const [streakClaimedToday, setStreakClaimedToday] = useState<boolean>(true);

  // User Perks Inspection Modal State
  const [selectedUserPerks, setSelectedUserPerks] = useState<UserWalletRecord | null>(null);
  const [isPerksModalOpen, setIsPerksModalOpen] = useState(false);

  // Swag Orders State
  const [swagOrders, setSwagOrders] = useState<SwagOrder[]>(coinService.getAllSwagOrders());
  const [swagFilter, setSwagFilter] = useState<'all' | 'Processing' | 'Shipped' | 'Delivered'>('all');
  const [swagSearch, setSwagSearch] = useState('');
  const [editingSwagOrder, setEditingSwagOrder] = useState<SwagOrder | null>(null);
  const [isSwagModalOpen, setIsSwagModalOpen] = useState(false);
  const [swagStatusValue, setSwagStatusValue] = useState<'Processing' | 'Shipped' | 'Delivered'>('Processing');
  const [swagTrackingValue, setSwagTrackingValue] = useState('');

  // Grant Custom Perk Modal State
  const [isGrantPerkModalOpen, setIsGrantPerkModalOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantType, setGrantType] = useState<'coupon' | 'course'>('coupon');
  const [grantCouponTitle, setGrantCouponTitle] = useState('VIP 50% Community Discount');
  const [grantCouponDiscount, setGrantCouponDiscount] = useState(50);
  const [grantCourseSlug, setGrantCourseSlug] = useState('dsa-competitive-programming-masterclass');

  // Create Manual Swag Order Modal State
  const [isCreateSwagModalOpen, setIsCreateSwagModalOpen] = useState(false);
  const [swagStudentId, setSwagStudentId] = useState('');
  const [swagItemTitle, setSwagItemTitle] = useState('NextEra Official Pro Hoodie & Swag Kit');
  const [swagCost, setSwagCost] = useState(1200);
  const [swagRecipientName, setSwagRecipientName] = useState('');
  const [swagPhone, setSwagPhone] = useState('');
  const [swagAddress, setSwagAddress] = useState('');
  const [swagCity, setSwagCity] = useState('');
  const [swagPincode, setSwagPincode] = useState('');

  useEffect(() => {
    const unsub = sundayContestService.subscribe(setConfig);
    const unsubWallets = coinService.subscribeAdmin((wallets) => {
      setUserWallets(wallets);
      setSwagOrders(coinService.getAllSwagOrders());
    });

    // Auto-fetch real registered students from MongoDB and sync their wallets
    const loadRealStudents = async () => {
      try {
        const res = await adminService.getStudents({ limit: 100 });
        if (res && res.students && res.students.length > 0) {
          coinService.syncDatabaseStudents(res.students);
          setUserWallets(coinService.getAllUserWallets());
          setSwagOrders(coinService.getAllSwagOrders());
        }
      } catch (e) {
        console.error('Could not fetch real students for contest coins sync', e);
      }
    };
    loadRealStudents();

    return () => {
      unsub();
      unsubWallets();
    };
  }, [activeMainTab]);

  // Form handlers
  const handleConfigChange = (field: keyof SundayContestConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  // Get current active problem (Q1, Q2, or Daily Streak problem)
  const getCurrentActiveProblem = (): SundayContestProblem => {
    if (activeTab === 0) return config.problems[0];
    if (activeTab === 1) return config.problems[1];
    return config.dailyStreakProblem || sundayContestService.getDailyStreakProblem();
  };

  const currentProblem = getCurrentActiveProblem();

  const handleActiveProblemChange = (field: keyof SundayContestProblem, value: any) => {
    if (activeTab === 0 || activeTab === 1) {
      setConfig((prev) => {
        const updatedProblems = [...prev.problems];
        updatedProblems[activeTab] = {
          ...updatedProblems[activeTab],
          [field]: value,
        };
        return {
          ...prev,
          problems: updatedProblems,
        };
      });
    } else {
      // Daily Streak Problem
      setConfig((prev) => {
        const currentDaily = prev.dailyStreakProblem || sundayContestService.getDailyStreakProblem();
        return {
          ...prev,
          dailyStreakProblem: {
            ...currentDaily,
            [field]: value,
          },
        };
      });
    }
  };

  const handleStarterCodeChange = (lang: string, codeVal: string) => {
    if (activeTab === 0 || activeTab === 1) {
      setConfig((prev) => {
        const updatedProblems = [...prev.problems];
        const cur = updatedProblems[activeTab];
        updatedProblems[activeTab] = {
          ...cur,
          starterCode: {
            ...cur.starterCode,
            [lang]: codeVal,
          },
        };
        return {
          ...prev,
          problems: updatedProblems,
        };
      });
    } else {
      setConfig((prev) => {
        const cur = prev.dailyStreakProblem || sundayContestService.getDailyStreakProblem();
        return {
          ...prev,
          dailyStreakProblem: {
            ...cur,
            starterCode: {
              ...cur.starterCode,
              [lang]: codeVal,
            },
          },
        };
      });
    }
  };

  // Constraints Handlers for Active Problem
  const handleAddConstraint = () => {
    handleActiveProblemChange('constraints', [...currentProblem.constraints, '']);
  };

  const handleUpdateConstraint = (index: number, val: string) => {
    const next = [...currentProblem.constraints];
    next[index] = val;
    handleActiveProblemChange('constraints', next);
  };

  const handleRemoveConstraint = (index: number) => {
    const next = currentProblem.constraints.filter((_, i) => i !== index);
    handleActiveProblemChange('constraints', next);
  };

  // Sample Test Cases Handlers
  const handleAddSampleCase = () => {
    handleActiveProblemChange('sampleTestCases', [
      ...currentProblem.sampleTestCases,
      { input: '', expectedOutput: '', explanation: '' },
    ]);
  };

  const handleUpdateSampleCase = (index: number, field: keyof TestCase, val: string) => {
    const next = [...currentProblem.sampleTestCases];
    next[index] = { ...next[index], [field]: val };
    handleActiveProblemChange('sampleTestCases', next);
  };

  const handleRemoveSampleCase = (index: number) => {
    const next = currentProblem.sampleTestCases.filter((_, i) => i !== index);
    handleActiveProblemChange('sampleTestCases', next);
  };

  // Hidden Test Cases Handlers
  const handleAddHiddenCase = () => {
    handleActiveProblemChange('hiddenTestCases', [
      ...currentProblem.hiddenTestCases,
      { input: '', expectedOutput: '', explanation: '' },
    ]);
  };

  const handleUpdateHiddenCase = (index: number, field: keyof TestCase, val: string) => {
    const next = [...currentProblem.hiddenTestCases];
    next[index] = { ...next[index], [field]: val };
    handleActiveProblemChange('hiddenTestCases', next);
  };

  const handleRemoveHiddenCase = (index: number) => {
    const next = currentProblem.hiddenTestCases.filter((_, i) => i !== index);
    handleActiveProblemChange('hiddenTestCases', next);
  };

  // 1-Click Import from Practice Catalog
  const handleImportProblem = (template: PracticeProblemTemplate) => {
    if (activeTab === 0 || activeTab === 1) {
      const updated = sundayContestService.importProblemToContest(activeTab, template.id);
      setConfig(updated);
      success(`Imported "${template.title}" into Question #${activeTab + 1} successfully!`, 'Imported from Practice');
    } else {
      const updated = sundayContestService.setDailyStreakProblem(template.id);
      setConfig(updated);
      success(`Set "${template.title}" as today's Daily Streak Problem successfully!`, 'Daily Streak Updated');
    }
    setIsPickerOpen(false);
  };

  // ================= AUTO-PILOT TRIGGERS =================
  const handleAutoGenerateWeeklyPair = () => {
    const updated = sundayContestService.triggerManualWeeklyRotation();
    setConfig(updated);
    const q1 = updated.problems[0];
    const q2 = updated.problems[1];
    success(
      `Auto-generated balanced mixed difficulty pair: Q1 "${q1.title}" (${q1.difficulty}) + Q2 "${q2.title}" (${q2.difficulty})!`,
      'Contest Auto-Pilot'
    );
  };

  const handleAutoRotateDailyStreak = () => {
    const updated = sundayContestService.triggerManualDailyRotation();
    setConfig(updated);
    const potd = updated.dailyStreakProblem;
    success(
      `Rotated Daily Streak to next sequential problem: "${potd?.title}" (${potd?.difficulty}) from Top 150 / Practice Catalog!`,
      'Daily Streak Auto-Pilot'
    );
  };

  const handleToggleAutoPilot = () => {
    const currentEnabled = config.autoPilot?.enabled ?? true;
    const updated = sundayContestService.setAutoPilotSettings({ enabled: !currentEnabled });
    setConfig(updated);
    info(
      !currentEnabled
        ? 'Auto-Pilot enabled: Problems will automatically update daily & before weekly contests if admin has not set them.'
        : 'Auto-Pilot paused: Automatic problem updates are now suspended.',
      'Auto-Pilot Status'
    );
  };

  // Save All Changes with strict validation
  const handleSaveContest = () => {
    try {
      // Validate strict mixed difficulty rule for Weekly Contest
      if (
        config.problems[0] &&
        config.problems[1] &&
        config.problems[0].difficulty === config.problems[1].difficulty
      ) {
        toastError(
          `Weekly Contest Rule: Both Question 1 & Question 2 cannot have the same difficulty (${config.problems[0].difficulty}). Weekly contests strictly require mixed difficulties (e.g. Easy + Hard, Medium + Easy, Easy + Medium).`,
          'Mixed Difficulties Required'
        );
        return;
      }

      sundayContestService.updateConfig(config);
      success('NEC Weekly Contest Arena (2 Problems, 90-min Rules) & Daily Streak Problem updated successfully!', 'Saved ✓');
    } catch (e: any) {
      toastError(e.message || 'Failed to save contest settings');
    }
  };

  // ================= ADMIN COINS & STREAKS HANDLERS =================
  const handleOpenCoinsModal = (u: UserWalletRecord) => {
    setSelectedUserForCoins(u);
    setCoinsAmount(100);
    setCoinsMode('add');
    setCoinsReason('Contest bonus / Community reward');
    setIsCoinsModalOpen(true);
  };

  const handleSaveCoinsAdjustment = async () => {
    if (!selectedUserForCoins) return;
    try {
      await adminService.adjustStudentCoins(selectedUserForCoins.userId, {
        amount: coinsAmount,
        mode: coinsMode,
        reason: coinsReason,
        email: selectedUserForCoins.userEmail,
        userEmail: selectedUserForCoins.userEmail,
        name: selectedUserForCoins.userName,
        userName: selectedUserForCoins.userName,
      });

      const res = coinService.adminAdjustUserCoins(
        selectedUserForCoins.userId,
        coinsAmount,
        coinsMode,
        coinsReason
      );

      const studRes = await adminService.getStudents({ limit: 100 });
      if (studRes && studRes.students) {
        coinService.syncDatabaseStudents(studRes.students);
        setUserWallets(coinService.getAllUserWallets());
      }

      success(`Updated coins for ${selectedUserForCoins.userName}. New balance: ${res?.coins ?? coinsAmount}🪙`);
      setIsCoinsModalOpen(false);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update coins on server.');
    }
  };

  const handleOpenStreakModal = (u: UserWalletRecord) => {
    setSelectedUserForStreak(u);
    setStreakValue(u.dailyStreak);
    setStreakClaimedToday(u.claimedToday);
    setIsStreakModalOpen(true);
  };

  const handleSaveStreakAdjustment = async () => {
    if (!selectedUserForStreak) return;
    try {
      await adminService.adjustStudentStreak(selectedUserForStreak.userId, {
        streak: streakValue,
        claimedToday: streakClaimedToday,
        email: selectedUserForStreak.userEmail,
        userEmail: selectedUserForStreak.userEmail,
        name: selectedUserForStreak.userName,
        userName: selectedUserForStreak.userName,
      });

      const res = coinService.adminAdjustUserStreak(
        selectedUserForStreak.userId,
        streakValue,
        streakClaimedToday
      );

      const studRes = await adminService.getStudents({ limit: 100 });
      if (studRes && studRes.students) {
        coinService.syncDatabaseStudents(studRes.students);
        setUserWallets(coinService.getAllUserWallets());
      }

      success(`Updated daily streak for ${selectedUserForStreak.userName} to ${res?.dailyStreak ?? streakValue} days.`);
      setIsStreakModalOpen(false);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update streak on server.');
    }
  };

  const handleCreateManualSwagOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swagStudentId) {
      toastError('Please select a student to assign order.');
      return;
    }
    const targetStudent = userWallets.find((u) => u.userId === swagStudentId);
    try {
      await adminService.createStudentSwagOrder(swagStudentId, {
        rewardTitle: swagItemTitle,
        coinsCost: swagCost,
        fullName: swagRecipientName || targetStudent?.userName || 'Student Recipient',
        phone: swagPhone || '+91 9876543210',
        address: swagAddress || 'Campus Hostel / House Address',
        city: swagCity || 'New Delhi',
        pincode: swagPincode || '110001',
        email: targetStudent?.userEmail,
        userEmail: targetStudent?.userEmail,
        name: targetStudent?.userName,
        userName: targetStudent?.userName,
      });

      const order = coinService.adminCreateManualSwagOrder(swagStudentId, swagItemTitle, swagCost, {
        fullName: swagRecipientName || 'Student Recipient',
        phone: swagPhone || '+91 9876543210',
        address: swagAddress || 'Campus Hostel / House Address',
        city: swagCity || 'New Delhi',
        pincode: swagPincode || '110001',
      });

      const studRes = await adminService.getStudents({ limit: 100 });
      if (studRes && studRes.students) {
        coinService.syncDatabaseStudents(studRes.students);
        setUserWallets(coinService.getAllUserWallets());
        setSwagOrders(coinService.getAllSwagOrders());
      }

      success(`Created Swag Order #${order?.id || 'new'} with tracking ID ${order?.trackingNumber || 'assigned'}!`);
      setIsCreateSwagModalOpen(false);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create swag order on server.');
    }
  };

  const handleOpenPerksModal = (u: UserWalletRecord) => {
    setSelectedUserPerks(u);
    setIsPerksModalOpen(true);
  };

  // ================= ADMIN SWAG ORDERS HANDLERS =================
  const handleOpenSwagModal = (order: SwagOrder) => {
    setEditingSwagOrder(order);
    setSwagStatusValue(order.status);
    setSwagTrackingValue(order.trackingNumber || '');
    setIsSwagModalOpen(true);
  };

  const handleSaveSwagUpdate = async () => {
    if (!editingSwagOrder) return;
    try {
      await adminService.updateSwagOrderStatus(editingSwagOrder.id, {
        status: swagStatusValue,
        trackingNumber: swagTrackingValue,
        studentEmail: editingSwagOrder.phone, // fallback matching
      });

      coinService.adminUpdateSwagOrderStatus(
        editingSwagOrder.id,
        swagStatusValue,
        swagTrackingValue
      );

      const studRes = await adminService.getStudents({ limit: 100 });
      if (studRes && studRes.students) {
        coinService.syncDatabaseStudents(studRes.students);
        setUserWallets(coinService.getAllUserWallets());
        setSwagOrders(coinService.getAllSwagOrders());
      }

      if (swagStatusValue === 'Delivered') {
        success(`Order #${editingSwagOrder.id} marked as DELIVERED! Congratulatory delivery email has been sent to the student.`);
      } else {
        success(`Updated Order #${editingSwagOrder.id} status to ${swagStatusValue}.`);
      }
      setIsSwagModalOpen(false);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update swag order on server.');
    }
  };

  const handleGrantCustomPerk = async () => {
    if (!grantUserId) {
      toastError('Please select a student to grant perk.');
      return;
    }
    const target = userWallets.find((u) => u.userId === grantUserId);
    try {
      await adminService.grantStudentPerk(grantUserId, {
        type: grantType,
        title: grantCouponTitle,
        discountPercent: grantCouponDiscount,
        courseSlug: grantCourseSlug,
        email: target?.userEmail,
        userEmail: target?.userEmail,
        name: target?.userName,
        userName: target?.userName,
      });

      if (grantType === 'coupon') {
        coinService.adminGrantCoupon(grantUserId, grantCouponTitle, grantCouponDiscount);
        success(`Granted ${grantCouponDiscount}% coupon code to ${target?.userName || 'student'}!`);
      } else {
        coinService.adminGrantCourse(grantUserId, grantCourseSlug);
        success(`Granted free pro course access to ${target?.userName || 'student'}!`);
      }

      const studRes = await adminService.getStudents({ limit: 100 });
      if (studRes && studRes.students) {
        coinService.syncDatabaseStudents(studRes.students);
        setUserWallets(coinService.getAllUserWallets());
      }
      setIsGrantPerkModalOpen(false);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to grant perk on server.');
    }
  };

  const liveStatus = sundayContestService.getContestLiveStatus();

  // Filter Practice Catalog in Picker Modal
  const filteredCatalog = PRACTICE_PROBLEMS_CATALOG.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = selectedDifficulty === 'all' || p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    const matchesCat = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesDiff && matchesCat;
  });

  // Filter Wallets
  const filteredWallets = userWallets.filter((u) => {
    const term = walletsSearch.toLowerCase();
    return u.userName.toLowerCase().includes(term) || u.userEmail.toLowerCase().includes(term) || (u.college || '').toLowerCase().includes(term);
  });

  // Filter Swag Orders
  const filteredSwagOrders = swagOrders.filter((o) => {
    const matchesStatus = swagFilter === 'all' || o.status === swagFilter;
    const term = swagSearch.toLowerCase();
    const matchesSearch = o.fullName.toLowerCase().includes(term) || o.id.toLowerCase().includes(term) || o.city.toLowerCase().includes(term) || o.rewardTitle.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  // Filter Anti-Cheat Records
  const filteredAntiCheatList = antiCheatParticipants.filter((p) => {
    const term = antiCheatSearch.toLowerCase();
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.username && p.username.toLowerCase().includes(term)) ||
      (p.college && p.college.toLowerCase().includes(term)) ||
      (p.bio && p.bio.toLowerCase().includes(term));

    const status = p.antiCheat?.status || 'Clean';
    const matchesStatus = antiCheatStatusFilter === 'all' || status === antiCheatStatusFilter;

    const switches = p.antiCheat?.tabSwitchesCount || 0;
    const matchesSwitches =
      antiCheatSwitchFilter === 'all' ||
      (antiCheatSwitchFilter === 'has_switches' && switches > 0) ||
      (antiCheatSwitchFilter === 'high_switches' && switches >= 3);

    return matchesSearch && matchesStatus && matchesSwitches;
  });

  const handleAdminOverride = (
    userIdOrUsername: string,
    newStatus: 'Clean' | 'Suspicious' | 'Flagged',
    customReason?: string
  ) => {
    const successResult = sundayContestService.overrideAntiCheatStatus(
      userIdOrUsername,
      newStatus,
      customReason || adminOverrideReason
    );
    if (successResult) {
      const updated = sundayContestService.getAntiCheatParticipants();
      setAntiCheatParticipants(updated);
      setConfig(sundayContestService.getConfig());
      if (selectedStudentPlayback) {
        const found = updated.find(
          (p) => p.userId === selectedStudentPlayback.userId || p.username === selectedStudentPlayback.username
        );
        if (found) setSelectedStudentPlayback(found);
      }
      success(
        `Anti-cheat status updated to "${newStatus}"!`,
        'Status Overridden'
      );
      setAdminOverrideReason('');
    } else {
      toastError('Failed to update anti-cheat status.');
    }
  };

  // All Claimed Coupons across platform
  const allUnlockedCoupons: {
    userId: string;
    userName: string;
    userEmail: string;
    code: string;
    discount: number;
    title: string;
    unlockedAt: string;
  }[] = [];
  userWallets.forEach((u) => {
    (u.unlockedCoupons || []).forEach((c) => {
      allUnlockedCoupons.push({
        userId: u.userId,
        userName: u.userName,
        userEmail: u.userEmail,
        ...c,
      });
    });
  });
  allUnlockedCoupons.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. TOP ADMIN HEADER */}
      <AdminPageHeader
        title="NEC Contest, Coins & Swag Control Center"
        description="Comprehensive admin hub to manage Weekly Contests (Q1 & Q2), Daily Streaks, Student Coin Wallets, and Physical Swag Deliveries across the platform."
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.CONTEST)}
              leftIcon={<Eye className="w-4 h-4 text-amber-500" />}
              className="border-slate-300 dark:border-dark-700"
            >
              Preview Live Contest
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveContest}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
            >
              Publish Contest Changes
            </Button>
          </div>
        }
      />

      {/* 2. 4 PRIMARY ADMIN TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveMainTab('weekly');
            if (activeTab === 2) setActiveTab(0);
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all cursor-pointer border shrink-0',
            activeMainTab === 'weekly'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-700'
          )}
        >
          <Trophy className="w-4 h-4" />
          <span>Weekly Contest (Q1 & Q2)</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab('daily');
            setActiveTab(2);
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all cursor-pointer border shrink-0',
            activeMainTab === 'daily'
              ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20'
              : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-700'
          )}
        >
          <Flame className="w-4 h-4" />
          <span>Daily Streak Problem</span>
        </button>

        <button
          onClick={() => setActiveMainTab('coins')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all cursor-pointer border shrink-0',
            activeMainTab === 'coins'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-700'
          )}
        >
          <Coins className="w-4 h-4" />
          <span>Student Coins & Streaks ({userWallets.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('swag')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all cursor-pointer border shrink-0',
            activeMainTab === 'swag'
              ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/20'
              : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-700'
          )}
        >
          <Package className="w-4 h-4" />
          <span>Store Claims & Swag Delivery ({swagOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('anticheat')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all cursor-pointer border shrink-0',
            activeMainTab === 'anticheat'
              ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
              : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-700'
          )}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Anti-Cheat Review ({antiCheatParticipants.length})</span>
          {antiCheatParticipants.some((p) => p.antiCheat?.status === 'Flagged') && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-white text-rose-600 font-bold animate-pulse">
              {antiCheatParticipants.filter((p) => p.antiCheat?.status === 'Flagged').length} Alert
            </span>
          )}
        </button>
      </div>

      {/* ================= TAB 1 & TAB 2: CONTEST & DAILY STREAK PROBLEM EDITORS ================= */}
      {(activeMainTab === 'weekly' || activeMainTab === 'daily') && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Sunday Schedule & Duration Settings (Shown for Weekly Contest tab) */}
          {activeMainTab === 'weekly' && (
            <div className="space-y-6">
              {/* Automated Sunday Scheduler Notice Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Sparkles className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                        🤖 100% Automated Weekly Contest Scheduler
                      </h4>
                      <Badge variant="success" size="sm">Active (Every Sunday 00:00)</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Weekly Contest automatically goes live every Sunday at 00:00:00 without admin manual intervention. At Sunday midnight, round counter increments, solved problem state resets, and balanced mixed-difficulty problems auto-rotate seamlessly.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveMainTab('anticheat')}
                    leftIcon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
                    className="border-indigo-500/30 text-xs font-mono"
                  >
                    Anti-Cheat Review
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Status Card */}
              <Card variant="elevated" className="lg:col-span-4 border-amber-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" /> Contest Timing
                    </span>
                    <Badge variant={liveStatus.isLive ? 'success' : 'warning'} size="sm">
                      {liveStatus.isLive ? 'Live Arena Active' : 'Sunday Countdown'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold mt-2">
                    {liveStatus.isSunday ? '🟢 Live Today (Sunday)' : `⏳ Today is ${liveStatus.dayName}`}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Contest is live on Sundays for 90 minutes. Between Sundays, previous problems remain open for practice.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Force Live Toggle */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Force Live Mode (Testing)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Enables live contest arena on any day.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.isForceLive}
                      onChange={(e) => handleConfigChange('isForceLive', e.target.checked)}
                      className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Archive Practice Toggle */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Keep Open for Practice
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Old questions remain accessible in practice mode.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.isArchiveOpen}
                      onChange={(e) => handleConfigChange('isArchiveOpen', e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Contest Edition #</label>
                      <input
                        type="number"
                        value={config.contestNumber}
                        onChange={(e) => handleConfigChange('contestNumber', Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Winner Bounty (NEC Coins for 2/2 Solved)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🪙</span>
                        <input
                          type="number"
                          value={config.coinsPrize}
                          onChange={(e) => handleConfigChange('coinsPrize', Number(e.target.value))}
                          className="w-full h-9 px-3 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Sunday Date</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={config.sundayDate}
                          onChange={(e) => handleConfigChange('sundayDate', e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* General Contest Rules Card */}
              <Card variant="elevated" className="lg:col-span-8">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Contest Arena Title & Time Limit
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Coders must pass 100% test cases on both Question 1 & Question 2 in 90 minutes to claim the 100 NEC Coins bounty.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Contest Title
                    </label>
                    <input
                      type="text"
                      value={config.title}
                      onChange={(e) => handleConfigChange('title', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Contest Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={config.description}
                      onChange={(e) => handleConfigChange('description', e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Duration (Minutes)
                      </label>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          value={config.durationMinutes}
                          onChange={(e) => handleConfigChange('durationMinutes', Number(e.target.value))}
                          className="w-full h-9 px-3 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Contest Problem Slots
                      </label>
                      <div className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center">
                        2 Questions (Q1 & Q2) + Daily Problem
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

          {/* PROBLEM MANAGER CARD */}
          <Card variant="elevated" className="border-brand-500/30">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-4 h-4" /> {activeMainTab === 'daily' ? 'Daily Streak Problem' : 'Contest Problems Editor'}
                  </span>
                  <CardTitle className="text-xl font-bold mt-1">
                    {activeMainTab === 'daily' ? 'Configure Today’s Daily Coding Problem' : 'Configure Contest Questions (Q1 & Q2)'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select problems directly from the Practice Repository or customize titles, constraints, test cases, and starter code.
                  </CardDescription>
                </div>

                {/* Q1 / Q2 Tab Switcher (When in Weekly tab) */}
                {activeMainTab === 'weekly' && (
                  <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveTab(0)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5',
                        activeTab === 0
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-white'
                      )}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Question 1 ({config.problems[0]?.difficulty || 'Medium'})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab(1)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5',
                        activeTab === 1
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-white'
                      )}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Question 2 ({config.problems[1]?.difficulty || 'Hard'})</span>
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-0">
              
              {/* ================= AUTO-PILOT BANNER (WEEKLY CONTEST TAB) ================= */}
              {activeMainTab === 'weekly' && (
                <div className="space-y-3">
                  {config.problems[0]?.difficulty === config.problems[1]?.difficulty ? (
                    <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <div>
                          <span className="font-bold block">⚠️ Matching Difficulty Detected ({config.problems[0]?.difficulty})</span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-300">
                            Weekly Contest rules strictly require non-matching mixed difficulties (e.g. Easy + Hard, Medium + Easy). Both questions cannot be {config.problems[0]?.difficulty}.
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleAutoGenerateWeeklyPair}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs shrink-0 cursor-pointer"
                        leftIcon={<Zap className="w-3.5 h-3.5" />}
                      >
                        Auto-Fix Mixed Pair
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              Mixed Difficulty Validated: {config.problems[0]?.difficulty} (Q1) + {config.problems[1]?.difficulty} (Q2)
                            </span>
                            <Badge variant="success" size="sm">Rule Satisfied ✓</Badge>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {config.autoPilot?.weeklyAutoSource || 'Auto-Pilot mixed pairing active before contest start.'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAutoGenerateWeeklyPair}
                          className="text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                          Auto-Generate Next Pair
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= AUTO-PILOT BANNER (DAILY STREAK TAB) ================= */}
              {activeMainTab === 'daily' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-orange-500 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-orange-500" /> Daily Coding Streak Auto-Pilot
                      </span>
                      <Badge variant={config.autoPilot?.enabled ? 'success' : 'outline'} size="sm">
                        {config.autoPilot?.enabled ? 'Auto-Update Active' : 'Manual Only'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      If admin doesn't update today's problem, the system automatically advances to the next sequential problem from the Top 150 / Practice catalog every midnight.
                    </p>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Current Status: <strong className="text-orange-500">{config.autoPilot?.isDailyManualForToday ? '✍️ Admin Curated' : '🤖 Auto-Rotated Serial'}</strong>
                      {config.dailyStreakProblem?.sourceLabel && ` • ${config.dailyStreakProblem.sourceLabel}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={handleAutoRotateDailyStreak}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                    >
                      Rotate to Next Problem
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleToggleAutoPilot}
                      className="text-xs font-mono"
                    >
                      {config.autoPilot?.enabled ? 'Pause Auto-Pilot' : 'Enable Auto-Pilot'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Top Quick Actions Bar (1-Click Sync from Practice Catalog) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/10 via-amber-500/10 to-transparent border border-brand-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-brand-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Practice Repository Sync</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Import any standard problem from NextEra’s Practice Catalog with complete test cases, constraints, and 5 language starter templates in 1 click!
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsPickerOpen(true)}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold shrink-0 text-xs"
                >
                  Browse Practice Problems ({PRACTICE_PROBLEMS_CATALOG.length})
                </Button>
              </div>

              {/* Title, Difficulty, Points */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Problem Title
                  </label>
                  <input
                    type="text"
                    value={currentProblem.title}
                    onChange={(e) => handleActiveProblemChange('title', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Difficulty
                  </label>
                  <select
                    value={currentProblem.difficulty}
                    onChange={(e) => handleActiveProblemChange('difficulty', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Problem Points / Score
                  </label>
                  <input
                    type="number"
                    value={currentProblem.points}
                    onChange={(e) => handleActiveProblemChange('points', Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Problem Description Statement */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Problem Description (Markdown / HTML Supported)
                </label>
                <textarea
                  rows={6}
                  value={currentProblem.description}
                  onChange={(e) => handleActiveProblemChange('description', e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
                />
              </div>

              {/* Constraints Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-dark-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Constraints & Time Limits
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddConstraint}
                    leftIcon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
                    className="text-xs h-8 px-3 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 hover:border-brand-500/50 shadow-xs"
                  >
                    Add Constraint
                  </Button>
                </div>

                <div className="space-y-2">
                  {currentProblem.constraints.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={c}
                        onChange={(e) => handleUpdateConstraint(idx, e.target.value)}
                        placeholder="e.g. 1 <= nums.length <= 10^5"
                        className="flex-1 h-8 px-3 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs font-mono text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleRemoveConstraint(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Test Cases */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-dark-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Sample Visible Test Cases (Used for "Run Code")
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Visible in the problem description with explanation.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSampleCase}
                    leftIcon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
                    className="text-xs h-8 px-3 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 hover:border-brand-500/50 shadow-xs"
                  >
                    Add Sample Case
                  </Button>
                </div>

                <div className="space-y-3">
                  {currentProblem.sampleTestCases.map((tc, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold">Sample Case #{idx + 1}</span>
                        <button
                          onClick={() => handleRemoveSampleCase(idx)}
                          className="text-rose-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Input</label>
                        <textarea
                          rows={2}
                          value={tc.input}
                          onChange={(e) => handleUpdateSampleCase(idx, 'input', e.target.value)}
                          placeholder="nums = [2,7,11,15], target = 9"
                          className="w-full p-2 rounded-lg bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Expected Output</label>
                        <textarea
                          rows={1}
                          value={tc.expectedOutput}
                          onChange={(e) => handleUpdateSampleCase(idx, 'expectedOutput', e.target.value)}
                          placeholder="[0,1]"
                          className="w-full p-2 rounded-lg bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Explanation (Optional)</label>
                        <input
                          type="text"
                          value={tc.explanation || ''}
                          onChange={(e) => handleUpdateSampleCase(idx, 'explanation', e.target.value)}
                          placeholder="Because nums[0] + nums[1] == 9, we return [0, 1]."
                          className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hidden Evaluation Test Cases */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-dark-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Hidden Evaluation Test Cases (Evaluated on Submit)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Must pass 100% of these test cases to earn coins.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddHiddenCase}
                    leftIcon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
                    className="text-xs h-8 px-3 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 hover:border-brand-500/50 shadow-xs"
                  >
                    Add Hidden Case
                  </Button>
                </div>

                <div className="space-y-3">
                  {currentProblem.hiddenTestCases.map((tc, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold">Hidden Case #{idx + 1}</span>
                        <button
                          onClick={() => handleRemoveHiddenCase(idx)}
                          className="text-rose-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Input Argument(s)</label>
                          <input
                            type="text"
                            value={tc.input}
                            onChange={(e) => handleUpdateHiddenCase(idx, 'input', e.target.value)}
                            placeholder="e.g. [[0,0],[0,0]], 0"
                            className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-dark-950 border border-slate-300 dark:border-dark-700 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Expected Output</label>
                          <input
                            type="text"
                            value={tc.expectedOutput}
                            onChange={(e) => handleUpdateHiddenCase(idx, 'expectedOutput', e.target.value)}
                            placeholder="e.g. 2"
                            className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-dark-950 border border-slate-300 dark:border-dark-700 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Starter Code Templates in 5 Languages */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-dark-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Starter Code Templates (5 Languages)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Initial boilerplate code provided to students.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const meta = { title: currentProblem.title, slug: currentProblem.slug };
                        const langs: ('javascript' | 'typescript' | 'python' | 'java' | 'cpp')[] = ['javascript', 'typescript', 'python', 'java', 'cpp'];
                        langs.forEach((l) => {
                          handleStarterCodeChange(l, getCleanStarterCode(meta, l));
                        });
                        success('Auto-generated clean LeetCode & GFG starter templates for all 5 languages!', '⚡ Generated');
                      }}
                      leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                      className="text-xs h-8 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold"
                    >
                      ⚡ Auto-Generate LeetCode / GFG Format
                    </Button>

                    {/* Language Pills */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700">
                      {(['javascript', 'typescript', 'python', 'java', 'cpp'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveCodeLang(lang)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-mono transition-all capitalize cursor-pointer',
                            activeCodeLang === lang
                              ? 'bg-amber-500 text-slate-950 font-bold shadow'
                              : 'text-slate-600 dark:text-slate-400 hover:text-white'
                          )}
                        >
                          {lang === 'cpp' ? 'C++' : lang === 'python' ? 'Python3' : lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  rows={10}
                  value={currentProblem.starterCode[activeCodeLang] || ''}
                  onChange={(e) => handleStarterCodeChange(activeCodeLang, e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 3: STUDENT COINS & DAILY STREAKS CONTROL CENTER ================= */}
      {activeMainTab === 'coins' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Platform Coins */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Total Coins Issued</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {userWallets.reduce((acc, u) => acc + (u.coins || 0), 0)} 🪙
              </div>
              <div className="text-[11px] text-slate-400">Across {userWallets.length} students</div>
            </div>

            {/* Total Active Streaks */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-orange-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Active Daily Streaks</span>
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              </div>
              <div className="text-2xl font-black text-orange-400 font-mono">
                {userWallets.filter((u) => u.dailyStreak > 0).length} Coders
              </div>
              <div className="text-[11px] text-slate-400">Streak claimers today</div>
            </div>

            {/* Total Claimed Perks */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Store Perks Redeemed</span>
                <Gift className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {userWallets.reduce((acc, u) => acc + (u.unlockedCoupons?.length || 0) + (u.swagOrders?.length || 0), 0)}
              </div>
              <div className="text-[11px] text-slate-400">Coupons & merchandise claims</div>
            </div>

            {/* Swag Deliveries */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Physical Swag Orders</span>
                <Package className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono">
                {swagOrders.length} Shipments
              </div>
              <div className="text-[11px] text-slate-400">
                {swagOrders.filter((o) => o.status === 'Delivered').length} Delivered, {swagOrders.filter((o) => o.status === 'Processing').length} Processing
              </div>
            </div>

          </div>

          {/* Student Wallets Table Card */}
          <Card variant="elevated">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-400" /> Student Wallets & Streaks Management
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Inspect student coin balances, adjust coins with reason logs, modify daily streak counters, and view all unlocked store perks.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setGrantUserId(userWallets[0]?.userId || '');
                      setIsGrantPerkModalOpen(true);
                    }}
                    leftIcon={<Gift className="w-4 h-4" />}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
                  >
                    Grant Custom Perk
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or college..."
                  value={walletsSearch}
                  onChange={(e) => setWalletsSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Table */}
              <div className="rounded-xl border border-slate-200 dark:border-dark-800 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100 dark:bg-dark-900/90 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-dark-800 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">College</th>
                      <th className="py-3 px-4">Coins Balance</th>
                      <th className="py-3 px-4">Daily Streak</th>
                      <th className="py-3 px-4">Claimed Perks</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-800">
                    {filteredWallets.length > 0 ? (
                      filteredWallets.map((u) => (
                        <tr key={u.userId} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                          
                          {/* Student Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {u.avatar ? (
                                <img
                                  src={u.avatar}
                                  alt={u.userName}
                                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/30 shrink-0 shadow-xs"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                                  {u.userName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div
                                  onClick={() => u.userId !== 'user-current' && navigate(`/admin/students/${u.userId}`)}
                                  className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 hover:text-brand-400 cursor-pointer transition-colors"
                                >
                                  <span>{u.userName}</span>
                                  {u.userId === 'user-current' && (
                                    <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 text-[9px] font-mono">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">{u.userEmail}</div>
                              </div>
                            </div>
                          </td>

                          {/* College */}
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                            {u.college || '—'}
                          </td>

                          {/* Coins */}
                          <td className="py-3 px-4 font-mono font-bold text-amber-500 dark:text-amber-400">
                            <span className="text-sm">{u.coins}</span> 🪙
                          </td>

                          {/* Daily Streak */}
                          <td className="py-3 px-4 font-mono">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold text-[11px]">
                              <Flame className="w-3.5 h-3.5 fill-orange-400" />
                              <span>{u.dailyStreak} Days</span>
                              {u.claimedToday ? (
                                <span className="text-[9px] text-emerald-400 font-normal">(Claimed)</span>
                              ) : (
                                <span className="text-[9px] text-amber-400 font-normal">(Pending)</span>
                              )}
                            </div>
                          </td>

                          {/* Claimed Perks Count */}
                          <td className="py-3 px-4 font-mono text-slate-400">
                            <span className="text-white font-bold">
                              {(u.unlockedCoupons?.length || 0) + (u.swagOrders?.length || 0)}
                            </span> Perks ({u.unlockedCoupons?.length || 0} Coupons, {u.swagOrders?.length || 0} Swag)
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenCoinsModal(u)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                                title="Adjust Coins Balance"
                              >
                                🪙 +/- Coins
                              </button>

                              <button
                                onClick={() => handleOpenStreakModal(u)}
                                className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                                title="Edit Daily Streak"
                              >
                                🔥 Streak
                              </button>

                              <button
                                onClick={() => handleOpenPerksModal(u)}
                                className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                                title="Inspect Claimed Perks & Orders"
                              >
                                🎁 Perks
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          No students matched your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </CardContent>
          </Card>

        </div>
      )}

      {/* ================= TAB 4: STORE CLAIMS & SWAG DELIVERIES LOGISTICS MANAGER ================= */}
      {activeMainTab === 'swag' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Swag Logistics Header & Status Filters */}
          <Card variant="elevated">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-400" /> Physical Swag Orders & Courier Deliveries
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Track all physical merchandise orders placed with NEC Coins. Update fulfillment status (Processing ➔ Shipped ➔ Delivered) and assign tracking numbers.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSwagStudentId(userWallets[0]?.userId || '');
                      setSwagRecipientName(userWallets[0]?.userName || '');
                      setIsCreateSwagModalOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 rounded-xl flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Create Swag Order</span>
                  </Button>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['all', 'Processing', 'Shipped', 'Delivered'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setSwagFilter(st)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border',
                          swagFilter === st
                            ? 'bg-purple-500 text-white border-purple-400 shadow-sm'
                            : 'bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-dark-700'
                        )}
                      >
                        {st === 'all' ? `All (${swagOrders.length})` : `${st} (${swagOrders.filter((o) => o.status === st).length})`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search orders by Order ID, student name, city, or product title..."
                  value={swagSearch}
                  onChange={(e) => setSwagSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Swag Orders Table */}
              <div className="rounded-xl border border-slate-200 dark:border-dark-800 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100 dark:bg-dark-900/90 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-dark-800 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Order ID & Item</th>
                      <th className="py-3 px-4">Recipient & Contact</th>
                      <th className="py-3 px-4">Shipping Address (India)</th>
                      <th className="py-3 px-4">Coins Paid</th>
                      <th className="py-3 px-4">Fulfillment Status</th>
                      <th className="py-3 px-4">Courier Tracking</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-800">
                    {filteredSwagOrders.length > 0 ? (
                      filteredSwagOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                          
                          {/* Order ID & Product */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                                {o.id}
                              </span>
                              <div className="font-bold text-slate-900 dark:text-white mt-1">
                                {o.rewardTitle}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Ordered: {new Date(o.orderedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          </td>

                          {/* Recipient */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{o.fullName}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{o.phone}</div>
                          </td>

                          {/* Address */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-slate-300 font-medium line-clamp-2">{o.address}</div>
                            <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                              {o.city}, Pincode: <strong>{o.pincode}</strong>
                            </div>
                          </td>

                          {/* Cost */}
                          <td className="py-3 px-4 font-mono font-bold text-amber-400">
                            {o.coinsCost} 🪙
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                o.status === 'Delivered'
                                  ? 'success'
                                  : o.status === 'Shipped'
                                  ? 'info'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {o.status === 'Delivered' && '✅ Delivered'}
                              {o.status === 'Shipped' && '🚚 In Transit / Shipped'}
                              {o.status === 'Processing' && '⏳ Processing'}
                            </Badge>
                          </td>

                          {/* Tracking Number */}
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {o.trackingNumber ? (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700 text-[11px]">
                                {o.trackingNumber}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Not assigned</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenSwagModal(o)}
                              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                              className="text-xs h-7 border-slate-300 dark:border-dark-700"
                            >
                              Update Status
                            </Button>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No swag orders found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </CardContent>
          </Card>

          {/* All Claimed Discount Coupons Audit Table */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" /> Platform-Wide Unlocked Coupons Audit Log
              </CardTitle>
              <CardDescription className="text-xs">
                Complete historical record of all discount vouchers unlocked by students through contest victories and daily streaks.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="rounded-xl border border-slate-200 dark:border-dark-800 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100 dark:bg-dark-900/90 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-dark-800 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Perk Title</th>
                      <th className="py-3 px-4">Coupon Code</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Unlocked Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-800 font-mono">
                    {allUnlockedCoupons.length > 0 ? (
                      allUnlockedCoupons.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-white">{c.userName}</span>
                            <span className="text-[11px] text-slate-400 block">{c.userEmail}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-200 font-sans font-medium">{c.title}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-emerald-400 font-bold">
                            {c.discount}% OFF
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                            {new Date(c.unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                          No coupon claims recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* ================= TAB 5: ANTI-CHEAT & SUBMISSIONS REVIEW ================= */}
      {activeMainTab === 'anticheat' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Automated Scheduler & Anti-Cheat Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-blue-500/10 border border-rose-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                  <span>Anti-Cheat Real-Time Audit & Playback Center</span>
                  <Badge variant="danger" size="sm">Automated Monitor</Badge>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  Tracks window blurs, tab switches, clipboard code paste events, and submission solve speed (in seconds). Full chronological playback logs allow instant verification and administrative disqualifications.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAntiCheatParticipants(sundayContestService.getAntiCheatParticipants())}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="border-slate-300 dark:border-dark-700"
              >
                Refresh Log
              </Button>
            </div>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* 1. Total Participants */}
            <Card variant="elevated" className="border-slate-200 dark:border-dark-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white block">
                    {antiCheatParticipants.length}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-sans">
                    Contestants
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 2. Clean Verified */}
            <Card variant="elevated" className="border-emerald-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-emerald-500 block">
                    {antiCheatParticipants.filter((p) => (p.antiCheat?.status || 'Clean') === 'Clean').length}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-sans">
                    Clean Verified (🟢)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Suspicious Flags */}
            <Card variant="elevated" className="border-amber-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-amber-500 block">
                    {antiCheatParticipants.filter((p) => p.antiCheat?.status === 'Suspicious').length}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-sans">
                    Suspicious Flags (🟡)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 4. Plagiarism Flagged */}
            <Card variant="elevated" className="border-rose-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-rose-500 block">
                    {antiCheatParticipants.filter((p) => p.antiCheat?.status === 'Flagged').length}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-sans">
                    Plagiarism Flagged (🔴)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search, Filter & Participants Table Card */}
          <Card variant="elevated" className="border-slate-200 dark:border-dark-800">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <span>Participant Submissions & Anti-Cheat Records</span>
                    <Badge variant="outline" size="sm">
                      {filteredAntiCheatList.length} of {antiCheatParticipants.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Inspect exact seconds taken to submit code, tab defocus frequency, clipboard paste count, and review playbacks.
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student or college..."
                      value={antiCheatSearch}
                      onChange={(e) => setAntiCheatSearch(e.target.value)}
                      className="w-full h-8.5 pl-8.5 pr-3 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={antiCheatStatusFilter}
                    onChange={(e) => setAntiCheatStatusFilter(e.target.value as any)}
                    aria-label="Filter participants by anti-cheat status"
                    className="h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Clean">🟢 Clean Only</option>
                    <option value="Suspicious">🟡 Suspicious Only</option>
                    <option value="Flagged">🔴 Flagged Only</option>
                  </select>

                  {/* Switch filter */}
                  <select
                    value={antiCheatSwitchFilter}
                    onChange={(e) => setAntiCheatSwitchFilter(e.target.value as any)}
                    aria-label="Filter participants by tab switch count"
                    className="h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">All Switches</option>
                    <option value="has_switches">Switches &gt; 0</option>
                    <option value="high_switches">High Switches (&gt;= 3)</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="rounded-xl border border-slate-200 dark:border-dark-800 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100 dark:bg-dark-900/90 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-dark-800 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student & College</th>
                      <th className="py-3 px-4">Score / Solved</th>
                      <th className="py-3 px-4">Solve Time</th>
                      <th className="py-3 px-4">Tab Switches</th>
                      <th className="py-3 px-4">Pastes</th>
                      <th className="py-3 px-4">Integrity Status</th>
                      <th className="py-3 px-4">Flag Reason / Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-800 font-mono">
                    {filteredAntiCheatList.length > 0 ? (
                      filteredAntiCheatList.map((p) => {
                        const ac = p.antiCheat || {
                          tabSwitchesCount: 0,
                          pasteCount: 0,
                          timeTakenSeconds: 900,
                          status: 'Clean' as const,
                          reason: 'Verified session',
                          logs: [],
                        };
                        const isFlagged = ac.status === 'Flagged';
                        const isSuspicious = ac.status === 'Suspicious';

                        return (
                          <tr
                            key={p.userId || p.username}
                            className={cn(
                              'hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors',
                              isFlagged && 'bg-rose-500/5 dark:bg-rose-500/5',
                              isSuspicious && 'bg-amber-500/5 dark:bg-amber-500/5'
                            )}
                          >
                            {/* Student */}
                            <td className="py-3 px-4 font-sans">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                                  alt={p.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-dark-600 shrink-0"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {p.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      @{p.username}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[180px]">
                                    {p.college || 'Engineering College'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Score / Solved */}
                            <td className="py-3 px-4 font-mono">
                              <div className="font-bold text-amber-500">
                                {p.score} pts
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {p.problemsSolved}/2 Solved
                              </span>
                            </td>

                            {/* Solve Time */}
                            <td className="py-3 px-4 font-mono">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{p.finishTime || '00:15:00'}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block">
                                {ac.timeTakenSeconds ? `${ac.timeTakenSeconds}s elapsed` : 'Standard duration'}
                              </span>
                            </td>

                            {/* Tab Switches */}
                            <td className="py-3 px-4 font-mono">
                              <span
                                className={cn(
                                  'px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 border',
                                  ac.tabSwitchesCount === 0
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                    : ac.tabSwitchesCount < 4
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                    : 'bg-rose-500/15 border-rose-500/40 text-rose-500 animate-pulse font-black'
                                )}
                              >
                                {ac.tabSwitchesCount === 0 ? '🟢 0' : ac.tabSwitchesCount < 4 ? `🟡 ${ac.tabSwitchesCount}` : `🔴 ${ac.tabSwitchesCount}`} Switches
                              </span>
                            </td>

                            {/* Paste Count */}
                            <td className="py-3 px-4 font-mono">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-[11px] font-medium',
                                  ac.pasteCount === 0
                                    ? 'text-slate-400'
                                    : ac.pasteCount < 3
                                    ? 'bg-slate-200 dark:bg-dark-700 text-slate-700 dark:text-slate-300'
                                    : 'bg-rose-500/15 text-rose-400 font-bold'
                                )}
                              >
                                {ac.pasteCount} {ac.pasteCount === 1 ? 'paste' : 'pastes'}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 font-mono">
                              {ac.status === 'Clean' && (
                                <Badge variant="success" size="sm">
                                  <ShieldCheck className="w-3 h-3 mr-1 inline" /> Clean
                                </Badge>
                              )}
                              {ac.status === 'Suspicious' && (
                                <Badge variant="warning" size="sm">
                                  <AlertTriangle className="w-3 h-3 mr-1 inline" /> Suspicious
                                </Badge>
                              )}
                              {ac.status === 'Flagged' && (
                                <Badge variant="danger" size="sm">
                                  <ShieldAlert className="w-3 h-3 mr-1 inline" /> Flagged
                                </Badge>
                              )}
                            </td>

                            {/* Reason */}
                            <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-400 text-xs max-w-[200px] truncate" title={ac.reason}>
                              {ac.reason || 'Normal participant behavior'}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 font-sans">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStudentPlayback(p);
                                    setIsPlaybackModalOpen(true);
                                  }}
                                  leftIcon={<History className="w-3.5 h-3.5 text-blue-400" />}
                                  className="border-slate-300 dark:border-dark-700 text-[11px] h-7.5 px-2"
                                >
                                  Inspect Playback
                                </Button>

                                {ac.status !== 'Clean' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAdminOverride(p.userId || p.username, 'Clean', 'Verified as Clean by Admin')}
                                    className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 text-[11px] h-7.5 px-2"
                                    title="Clear flags and mark as clean"
                                  >
                                    Mark Clean
                                  </Button>
                                )}

                                {ac.status !== 'Flagged' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAdminOverride(p.userId || p.username, 'Flagged', 'Disqualified by Admin')}
                                    className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-[11px] h-7.5 px-2"
                                    title="Disqualify contestant"
                                  >
                                    Disqualify
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No contestant records match your search filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= MODAL: ADJUST USER COINS ================= */}
      {isCoinsModalOpen && selectedUserForCoins && (
        <Modal
          isOpen={isCoinsModalOpen}
          onClose={() => setIsCoinsModalOpen(false)}
          title={`Adjust Coins for ${selectedUserForCoins.userName}`}
          maxWidth="md"
        >
          <div className="space-y-4 p-2">
            
            {/* Current Balance Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400">Current Balance:</span>
              <span className="text-lg font-black text-amber-400">{selectedUserForCoins.coins} 🪙</span>
            </div>

            {/* Mode Select */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Adjustment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCoinsMode('add')}
                  className={cn(
                    'p-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border',
                    coinsMode === 'add'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  )}
                >
                  ➕ Add (+)
                </button>
                <button
                  type="button"
                  onClick={() => setCoinsMode('deduct')}
                  className={cn(
                    'p-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border',
                    coinsMode === 'deduct'
                      ? 'bg-rose-500 text-white border-rose-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  )}
                >
                  ➖ Deduct (-)
                </button>
                <button
                  type="button"
                  onClick={() => setCoinsMode('set')}
                  className={cn(
                    'p-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border',
                    coinsMode === 'set'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  )}
                >
                  🎯 Set Exact
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {coinsMode === 'set' ? 'New Exact Balance' : 'Amount of Coins'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg">🪙</span>
                <input
                  type="number"
                  min="0"
                  value={coinsAmount}
                  onChange={(e) => setCoinsAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-2">
              {[50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCoinsAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                >
                  {val}🪙
                </button>
              ))}
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Reason / Note for Audit Log
              </label>
              <input
                type="text"
                value={coinsReason}
                onChange={(e) => setCoinsReason(e.target.value)}
                placeholder="e.g. Weekly Contest Winner Bounty / Hackathon Award"
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCoinsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCoinsAdjustment}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              >
                Save Coin Changes
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* ================= MODAL: EDIT DAILY STREAK ================= */}
      {isStreakModalOpen && selectedUserForStreak && (
        <Modal
          isOpen={isStreakModalOpen}
          onClose={() => setIsStreakModalOpen(false)}
          title={`Edit Streak for ${selectedUserForStreak.userName}`}
          maxWidth="sm"
        >
          <div className="space-y-4 p-2 font-sans">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Streak Days Count (0 to 365)
              </label>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={streakValue}
                  onChange={(e) => setStreakValue(Math.max(0, Number(e.target.value)))}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold font-mono text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Claimed Coin Today</span>
                <span className="text-[11px] text-slate-400">Toggle if user already collected today's daily streak coin.</span>
              </div>
              <input
                type="checkbox"
                checked={streakClaimedToday}
                onChange={(e) => setStreakClaimedToday(e.target.checked)}
                className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStreakModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveStreakAdjustment}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
              >
                Save Streak
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: INSPECT USER PERKS ================= */}
      {isPerksModalOpen && selectedUserPerks && (
        <Modal
          isOpen={isPerksModalOpen}
          onClose={() => setIsPerksModalOpen(false)}
          title={`Claimed Perks & Orders — ${selectedUserPerks.userName}`}
          maxWidth="lg"
        >
          <div className="space-y-4 p-2">
            
            {/* Unlocked Coupons Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Unlocked Discount Coupons ({selectedUserPerks.unlockedCoupons?.length || 0})
              </h4>

              {selectedUserPerks.unlockedCoupons && selectedUserPerks.unlockedCoupons.length > 0 ? (
                <div className="space-y-2">
                  {selectedUserPerks.unlockedCoupons.map((c, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-white">{c.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Unlocked: {new Date(c.unlockedAt).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                          {c.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">{c.discount}% OFF</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-400 text-xs text-center border border-slate-800">
                  No coupons unlocked by this student yet.
                </div>
              )}
            </div>

            {/* Unlocked Courses Section */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Unlocked Pro Courses ({selectedUserPerks.unlockedCourses?.length || 0})
              </h4>

              {selectedUserPerks.unlockedCourses && selectedUserPerks.unlockedCourses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedUserPerks.unlockedCourses.map((slug, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/40">
                      💻 {slug}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-400 text-xs text-center border border-slate-800">
                  No courses unlocked yet.
                </div>
              )}
            </div>

            {/* Physical Swag Orders Section */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4" /> Physical Merchandise Orders ({selectedUserPerks.swagOrders?.length || 0})
              </h4>

              {selectedUserPerks.swagOrders && selectedUserPerks.swagOrders.length > 0 ? (
                <div className="space-y-2">
                  {selectedUserPerks.swagOrders.map((o) => (
                    <div key={o.id} className="p-3 rounded-xl bg-slate-900 border border-purple-500/30 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{o.rewardTitle}</span>
                        <Badge variant={o.status === 'Delivered' ? 'success' : o.status === 'Shipped' ? 'info' : 'warning'} size="sm">
                          {o.status}
                        </Badge>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        Order #{o.id} &bull; {o.address}, {o.city} ({o.pincode}) &bull; Phone: {o.phone}
                      </div>
                      {o.trackingNumber && (
                        <div className="text-[11px] font-mono text-emerald-400">
                          Tracking ID: <strong>{o.trackingNumber}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-400 text-xs text-center border border-slate-800">
                  No swag orders placed yet.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPerksModalOpen(false)}
              >
                Close
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* ================= MODAL: UPDATE SWAG ORDER STATUS & TRACKING ================= */}
      {isSwagModalOpen && editingSwagOrder && (
        <Modal
          isOpen={isSwagModalOpen}
          onClose={() => setIsSwagModalOpen(false)}
          title={`Update Swag Order #${editingSwagOrder.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 p-2 font-sans text-xs">
            
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-bold text-white text-sm">{editingSwagOrder.rewardTitle}</div>
              <div className="text-slate-400 font-mono">Recipient: {editingSwagOrder.fullName} &bull; {editingSwagOrder.phone}</div>
              <div className="text-slate-400">Address: {editingSwagOrder.address}, {editingSwagOrder.city} ({editingSwagOrder.pincode})</div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Fulfillment Status
              </label>
              <select
                value={swagStatusValue}
                onChange={(e) => setSwagStatusValue(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Processing">⏳ Processing (Order Received / Packing)</option>
                <option value="Shipped">🚚 Shipped / In Transit</option>
                <option value="Delivered">✅ Delivered to Student</option>
              </select>
            </div>

            {/* Courier Tracking Number */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Courier Tracking ID / Waybill Number
              </label>
              <input
                type="text"
                value={swagTrackingValue}
                onChange={(e) => setSwagTrackingValue(e.target.value)}
                placeholder="e.g. BLUEDART-88219034 / NEC-TRK-782194"
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSwagModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSwagUpdate}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
              >
                Update Fulfillment Status
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* ================= MODAL: GRANT CUSTOM PERK / COUPON ================= */}
      {isGrantPerkModalOpen && (
        <Modal
          isOpen={isGrantPerkModalOpen}
          onClose={() => setIsGrantPerkModalOpen(false)}
          title="Gift / Grant Custom Perk to Student"
          maxWidth="md"
        >
          <div className="space-y-4 p-2 text-xs font-sans">
            
            {/* Student Select */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Target Student
              </label>
              <select
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                {userWallets.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.userName} ({u.userEmail}) — {u.coins}🪙 Balance
                  </option>
                ))}
              </select>
            </div>

            {/* Perk Type */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Perk Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGrantType('coupon')}
                  className={cn(
                    'p-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border',
                    grantType === 'coupon'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  )}
                >
                  🎫 Discount Coupon Code
                </button>
                <button
                  type="button"
                  onClick={() => setGrantType('course')}
                  className={cn(
                    'p-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border',
                    grantType === 'course'
                      ? 'bg-blue-500 text-white border-blue-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  )}
                >
                  💻 Free Pro Course Access
                </button>
              </div>
            </div>

            {grantType === 'coupon' ? (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Coupon Title
                  </label>
                  <input
                    type="text"
                    value={grantCouponTitle}
                    onChange={(e) => setGrantCouponTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Discount Percentage (10% to 100%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={grantCouponDiscount}
                    onChange={(e) => setGrantCouponDiscount(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Course Slug Identifier
                </label>
                <select
                  value={grantCourseSlug}
                  onChange={(e) => setGrantCourseSlug(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                >
                  <option value="dsa-competitive-programming-masterclass">DSA & Competitive Programming Masterclass</option>
                  <option value="full-stack-web-development-bootcamp">Full-Stack Web Development Bootcamp</option>
                  <option value="system-design-microservices-pro">System Design & Microservices Pro</option>
                </select>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGrantPerkModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGrantCustomPerk}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              >
                Issue & Grant Perk
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* ================= MODAL: CREATE MANUAL SWAG ORDER ================= */}
      {isCreateSwagModalOpen && (
        <Modal
          isOpen={isCreateSwagModalOpen}
          onClose={() => setIsCreateSwagModalOpen(false)}
          title="📦 Create Physical Swag Order & Shipment"
        >
          <form onSubmit={handleCreateManualSwagOrder} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Select Student</label>
              <select
                value={swagStudentId}
                onChange={(e) => {
                  setSwagStudentId(e.target.value);
                  const found = userWallets.find((u) => u.userId === e.target.value);
                  if (found) setSwagRecipientName(found.userName);
                }}
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {userWallets.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.userName} ({u.userEmail}) — {u.coins} Coins
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Swag Merchandise Item</label>
                <select
                  value={swagItemTitle}
                  onChange={(e) => setSwagItemTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="NextEra Official Pro Hoodie & Swag Kit">NextEra Official Pro Hoodie & Swag Kit</option>
                  <option value="Full Stack Developer Pro Backpack">Full Stack Developer Pro Backpack</option>
                  <option value="NextEra Insulated Stainless Tumbler & Mug">NextEra Insulated Stainless Tumbler & Mug</option>
                  <option value="Developer Laptop Sleeve & Stickers Pack">Developer Laptop Sleeve & Stickers Pack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Coins Deducted / Value</label>
                <input
                  type="number"
                  min="0"
                  value={swagCost}
                  onChange={(e) => setSwagCost(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Recipient Full Name</label>
                <input
                  type="text"
                  value={swagRecipientName}
                  onChange={(e) => setSwagRecipientName(e.target.value)}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number (For Courier)</label>
                <input
                  type="text"
                  value={swagPhone}
                  onChange={(e) => setSwagPhone(e.target.value)}
                  required
                  placeholder="+91 9876543210"
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Delivery Street Address</label>
              <textarea
                value={swagAddress}
                onChange={(e) => setSwagAddress(e.target.value)}
                required
                rows={2}
                placeholder="House / Flat No, Street, Landmark, Area..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={swagCity}
                  onChange={(e) => setSwagCity(e.target.value)}
                  required
                  placeholder="e.g. New Delhi, Bengaluru"
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Pincode (6 digits)</label>
                <input
                  type="text"
                  value={swagPincode}
                  onChange={(e) => setSwagPincode(e.target.value)}
                  required
                  placeholder="e.g. 110001"
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsCreateSwagModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                Dispatch Swag Order
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: PRACTICE PROBLEM SELECTOR MODAL (1-CLICK SYNC) ================= */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-brand-500" />
                  Select Problem From Practice Repository
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Import into: <strong className="text-brand-500">{activeTab === 2 ? 'Daily Streak Problem' : `Contest Question #${activeTab + 1}`}</strong>
                </p>
              </div>

              <button
                onClick={() => setIsPickerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-slate-50 dark:bg-dark-950 border-b border-slate-200 dark:border-dark-800 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search problem title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="h-9 px-3 rounded-lg bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-3 rounded-lg bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-xs text-slate-700 dark:text-slate-300 hidden sm:inline-block"
              >
                <option value="all">All Categories</option>
                <option value="Arrays & Hashing">Arrays & Hashing</option>
                <option value="Stack">Stack</option>
                <option value="Sliding Window">Sliding Window</option>
                <option value="Graph & BFS">Graph & BFS</option>
                <option value="Dynamic Programming & Binary Search">DP & Binary Search</option>
                <option value="Two Pointers & Stack">Two Pointers & Stack</option>
              </select>
            </div>

            {/* Problems List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredCatalog.length > 0 ? (
                filteredCatalog.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 hover:border-brand-500 bg-white dark:bg-dark-800/60 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {template.title}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                            template.difficulty === 'Easy'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : template.difficulty === 'Medium'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          )}
                        >
                          {template.difficulty}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span>Category: <strong>{template.category}</strong></span>
                        <span>&bull;</span>
                        <span>Sample Cases: <strong>{template.sampleTestCases.length}</strong></span>
                        <span>&bull;</span>
                        <span>Hidden Cases: <strong>{template.hiddenTestCases.length}</strong></span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleImportProblem(template)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      className="shrink-0 text-xs font-bold"
                    >
                      {activeTab === 2 ? 'Set as Daily Problem' : `Load into Q${activeTab + 1}`}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No practice problems match your search.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-dark-950 border-t border-slate-200 dark:border-dark-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPickerOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: AUDIT PLAYBACK LOG ================= */}
      {isPlaybackModalOpen && selectedStudentPlayback && (
        <Modal
          isOpen={isPlaybackModalOpen}
          onClose={() => setIsPlaybackModalOpen(false)}
          title={`Anti-Cheat Audit Playback: ${selectedStudentPlayback.name}`}
          maxWidth="lg"
        >
          <div className="space-y-5 p-2 font-sans">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentPlayback.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                  alt={selectedStudentPlayback.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-300 dark:border-dark-600"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedStudentPlayback.name}
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">
                    @{selectedStudentPlayback.username} • {selectedStudentPlayback.college || 'Engineering College'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {selectedStudentPlayback.bio || ''}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs text-slate-500 dark:text-slate-400">Contest Score:</div>
                <div className="text-base font-bold text-amber-500">
                  {selectedStudentPlayback.score} pts ({selectedStudentPlayback.problemsSolved}/2 Solved)
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Total Time</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedStudentPlayback.finishTime || '00:15:00'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {selectedStudentPlayback.antiCheat?.timeTakenSeconds || 0}s elapsed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Tab Switches</span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    (selectedStudentPlayback.antiCheat?.tabSwitchesCount || 0) >= 4
                      ? 'text-rose-500 font-black'
                      : (selectedStudentPlayback.antiCheat?.tabSwitchesCount || 0) >= 2
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  )}
                >
                  {selectedStudentPlayback.antiCheat?.tabSwitchesCount || 0} Switches
                </span>
                <span className="text-[10px] text-slate-400 block">defocus events</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Code Pastes</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedStudentPlayback.antiCheat?.pasteCount || 0} Pastes
                </span>
                <span className="text-[10px] text-slate-400 block">clipboard events</span>
              </div>
            </div>

            {/* Current Verdict Banner */}
            <div
              className={cn(
                'p-3.5 rounded-xl border text-xs flex items-start gap-2.5',
                selectedStudentPlayback.antiCheat?.status === 'Flagged'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : selectedStudentPlayback.antiCheat?.status === 'Suspicious'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              )}
            >
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  Integrity Verdict: {selectedStudentPlayback.antiCheat?.status || 'Clean'}
                </span>
                <span className="text-[11px] opacity-90">
                  {selectedStudentPlayback.antiCheat?.reason || 'Verified clean typing session.'}
                </span>
              </div>
            </div>

            {/* Step-by-Step Playback Timeline */}
            <div>
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-500" />
                <span>Chronological Event Playback Log</span>
              </h5>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 max-h-60 overflow-y-auto space-y-3 font-mono text-xs">
                {selectedStudentPlayback.antiCheat?.logs && selectedStudentPlayback.antiCheat.logs.length > 0 ? (
                  selectedStudentPlayback.antiCheat.logs.map((log, idx) => {
                    const isTab = log.event === 'tab_switch';
                    const isPaste = log.event === 'paste';
                    const isSubmit = log.event === 'submit';
                    const isFlag = log.event === 'flag';

                    return (
                      <div key={idx} className="flex items-start gap-3 border-l-2 pl-3 border-slate-300 dark:border-dark-700 relative">
                        <div
                          className={cn(
                            'w-2.5 h-2.5 rounded-full absolute -left-[6px] top-1.5',
                            isTab
                              ? 'bg-amber-500'
                              : isPaste
                              ? 'bg-purple-500'
                              : isSubmit
                              ? 'bg-emerald-500'
                              : isFlag
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          )}
                        />
                        <div className="w-20 text-[11px] text-slate-500 shrink-0">
                          {log.timestamp}
                        </div>
                        <div className="flex-1">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase',
                              isTab
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                : isPaste
                                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                                : isSubmit
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                : isFlag
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                : 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                            )}
                          >
                            {log.event}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 text-xs font-sans">
                            {log.details}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-500 text-center py-4">
                    No granular playback events recorded for this session.
                  </div>
                )}
              </div>
            </div>

            {/* Admin Override Controls */}
            <div className="pt-3 border-t border-slate-200 dark:border-dark-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Admin note / override reason (e.g. Cleared after verification)..."
                  value={adminOverrideReason}
                  onChange={(e) => setAdminOverrideReason(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 font-sans"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleAdminOverride(
                        selectedStudentPlayback.userId || selectedStudentPlayback.username,
                        'Clean',
                        adminOverrideReason || 'Verified as Clean by Admin'
                      )
                    }
                    leftIcon={<UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                    className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs"
                  >
                    Mark Clean
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleAdminOverride(
                        selectedStudentPlayback.userId || selectedStudentPlayback.username,
                        'Suspicious',
                        adminOverrideReason || 'Marked Suspicious by Admin'
                      )
                    }
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs"
                  >
                    Flag Suspicious
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handleAdminOverride(
                        selectedStudentPlayback.userId || selectedStudentPlayback.username,
                        'Flagged',
                        adminOverrideReason || 'Disqualified for plagiarism by Admin'
                      )
                    }
                    leftIcon={<UserX className="w-3.5 h-3.5" />}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
                  >
                    Disqualify
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
