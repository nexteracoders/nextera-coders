import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import {
  coinService,
  CoinWalletState,
  RewardItem,
  SwagOrder,
} from '../../services/coin.service';
import { sundayContestService } from '../../services/contest.service';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { AnimatedCoinModal } from '../../components/contest/AnimatedCoinModal';
import {
  ShoppingBag,
  Flame,
  Copy,
  Check,
  CheckCircle2,
  Truck,
  Gift,
  MapPin,
  BookOpen,
  ArrowRight,
  Sparkles,
  Search,
  ShieldCheck,
  Zap,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { openCoinPassbook } from '../../components/common/CoinPassbookModal';

export const isImageUrl = (img?: string): boolean => {
  if (!img) return false;
  const trimmed = img.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return true;
  }
  return /\.(jpeg|jpg|gif|png|svg|webp|avif)(\?.*)?$/i.test(trimmed);
};

export const RewardsStorePage: React.FC = () => {
  useDocumentTitle('NEC Rewards Store — Redeem Coins for Courses & Swag');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [wallet, setWallet] = useState<CoinWalletState>(coinService.getState());
  const [rewards, setRewards] = useState<RewardItem[]>(coinService.getRewards());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'my-rewards'>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Additional Search & Stock Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isHowToEarnOpen, setIsHowToEarnOpen] = useState(false);

  // Animated Streak Modal State
  const [streakModalData, setStreakModalData] = useState<{
    isOpen: boolean;
    coins: number;
    title: string;
    subtitle: string;
    badgeText: string;
    streakCount: number;
    isBonus: boolean;
  }>({
    isOpen: false,
    coins: 1,
    title: '⚡ DAILY STREAK CLAIMED!',
    subtitle: 'You received +1 NEC Coin for your wallet & maintained your streak!',
    badgeText: 'DAILY STREAK REWARD',
    streakCount: 1,
    isBonus: false,
  });

  // Selected item for redemption modal
  const [activeReward, setActiveReward] = useState<RewardItem | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

  // Success Modal State
  const [successData, setSuccessData] = useState<{
    title: string;
    message: string;
    couponCode?: string;
    order?: SwagOrder;
  } | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Shipping Form for Swag Items
  const [shippingForm, setShippingForm] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      coinService.syncUserProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        college: (user as any).college,
        points: user.points,
        learningStreak: user.learningStreak,
        unlockedCoupons: (user as any).unlockedCoupons,
        unlockedCourses: (user as any).unlockedCourses,
        swagOrders: (user as any).swagOrders,
      });
      setShippingForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    coinService.fetchLiveRewards().then((items) => setRewards(items)).catch(() => {});
    const unsubWallet = coinService.subscribe(setWallet);
    const unsubRewards = coinService.subscribeRewards(setRewards);

    // Re-fetch fresh catalog whenever window refocuses (e.g. after editing in admin panel)
    const handleFocus = () => {
      coinService.fetchLiveRewards().then((items) => setRewards(items)).catch(() => {});
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubWallet();
      unsubRewards();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Filter Catalog Rewards by search query and in-stock toggle
  const filteredRewards = rewards.filter((item) => {
    if (inStockOnly && item.inStock === false) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchTag = item.tag?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchTag && !matchCat && !matchDesc) return false;
    }
    return true;
  });

  // Handle Daily Streak Claim
  const handleClaimStreak = () => {
    if (wallet.claimedToday) {
      info('You have already claimed your streak reward today.', 'Claimed ✓');
      return;
    }

    const dailyStreakProb = sundayContestService.getDailyStreakProblem();
    error(
      `Daily challenge pending! Please solve today's challenge ("${dailyStreakProb.title}") to maintain your streak and claim your coin.`,
      'Solve Today\'s Problem'
    );
    navigate(`/dsa/${dailyStreakProb.slug}`);
  };

  const claimedCount =
    wallet.unlockedCoupons.length +
    wallet.swagOrders.length +
    (wallet.unlockedCourses?.length || 0);

  // Open Details & Redeem Modal
  const handleOpenRedeem = (item: RewardItem) => {
    setActiveReward(item);
    setIsRedeemModalOpen(true);
  };

  // Confirm Redemption
  const [redeeming, setRedeeming] = useState(false);
  const handleConfirmRedeem = async () => {
    if (!activeReward || redeeming) return;

    if (activeReward.category === 'swag') {
      if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.address || !shippingForm.pincode) {
        error('Please complete all shipping address fields to deliver your merchandise.');
        return;
      }
    }

    setRedeeming(true);
    try {
      const result = await coinService.redeemReward(
        activeReward,
        activeReward.category === 'swag' ? shippingForm : undefined
      );

      if (result.success) {
        setIsRedeemModalOpen(false);
        setSuccessData({
          title: `🎉 ${activeReward.title} Unlocked!`,
          message:
            activeReward.category === 'coupon'
              ? 'Your exclusive discount coupon code is ready. Apply it during checkout to claim your instant discount!'
              : activeReward.category === 'course'
              ? 'Full lifetime course access has been added to your account! You can start learning right away.'
              : `Your order for official NEC merchandise has been placed successfully! It will be dispatched to your address within 4-5 business days.`,
          couponCode: result.couponCode,
          order: result.order,
        });
        setIsSuccessModalOpen(true);
        success(`Redeemed ${activeReward.title} successfully!`);
      } else {
        error(result.error || 'Failed to redeem reward.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to redeem reward.');
    } finally {
      setRedeeming(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success('Coupon code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors">
      
      {/* 1. TOP HERO & WALLET DASHBOARD */}
      <div className="relative border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-amber-500/5 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors">
        {/* Glow Gradients */}
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            
            {/* Left Title */}
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>OFFICIAL NEC REWARDS & SWAG STORE</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Redeem Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500">NEC Coins</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Earn coins by winning weekly contests (+100 Coins) and maintaining daily coding streaks (+1 Daily, +8 Bonus). Unlock premium courses, 50% discount coupons, and exclusive NEC developer swag delivered to your doorstep!
              </p>
            </div>

            {/* Right Live Wallet Balance Card */}
            <div className="w-full lg:w-auto p-6 rounded-3xl bg-white dark:bg-slate-950/90 border border-slate-200/80 dark:border-amber-500/40 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-4 min-w-[320px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Your Balance</span>
                <button
                  type="button"
                  onClick={openCoinPassbook}
                  title="Click to view full Coins Passbook & History"
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30 dark:border-amber-500/40 hover:bg-amber-500/30 cursor-pointer transition-all"
                >
                  View Passbook 📖
                </button>
              </div>

              <div
                onClick={openCoinPassbook}
                title="Click to view full Coins Passbook & History"
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  🪙
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-300 tracking-tight font-mono group-hover:underline decoration-amber-400/50">
                    {wallet.coins}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">Available NEC Coins (Click for ledger)</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold">
                  <Flame className="w-4 h-4 fill-orange-500" />
                  <span>{wallet.dailyStreak} Day Streak</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClaimStreak}
                  disabled={wallet.claimedToday}
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs py-1 h-7"
                >
                  {wallet.claimedToday ? 'Claimed ✓' : '+ Claim Daily'}
                </Button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => setIsHowToEarnOpen(true)}
                  className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>How to Earn More Coins?</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 1.5 STORE PERKS / TRUST STRIP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Instant Unlocking</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Codes & course access</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Pan-India Delivery</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Tracked doorstep swag</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">100% Free with Coins</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Zero monetary payment</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Official Merch</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Authentic NEC gear</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REWARDS CATALOG SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        
        {/* Category Tabs: Unified All Rewards & My Claimed Rewards + Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all font-mono cursor-pointer flex items-center gap-2',
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>All Rewards ({rewards.length})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('my-rewards')}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all font-mono cursor-pointer flex items-center gap-2',
                selectedCategory === 'my-rewards'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-md shadow-purple-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Gift className="w-4 h-4" />
              <span>My Claimed Rewards ({claimedCount})</span>
            </button>
          </div>

          {/* Search & Stock Filter */}
          {selectedCategory === 'all' && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 w-36 sm:w-48 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer flex items-center gap-1.5 shadow-xs',
                  inStockOnly
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <CheckCircle2 className={cn('w-3.5 h-3.5', inStockOnly ? 'text-emerald-500' : 'text-slate-400')} />
                <span>In-Stock Only</span>
              </button>
            </div>
          )}
        </div>

        {/* REWARDS GRID OR MY-REWARDS VIEW */}
        {selectedCategory === 'my-rewards' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-brand-600 dark:text-brand-400" /> My Claimed Rewards & Merchandise
            </h2>

            {wallet.unlockedCoupons.length === 0 && wallet.swagOrders.length === 0 && (wallet.unlockedCourses?.length || 0) === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="text-4xl">🎁</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No rewards claimed yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Participate in Weekly Contests and claim daily streaks to accumulate coins and redeem free perks!
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  Explore Rewards Catalog
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unlocked Coupons */}
                {wallet.unlockedCoupons.map((c, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-amber-500/30 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                        {c.discount}% DISCOUNT COUPON
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold">Unlocked</span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 font-mono">
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-300 tracking-wider">{c.code}</span>
                      <button
                        onClick={() => handleCopyCode(c.code)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-1 font-bold transition-colors cursor-pointer border border-amber-500/30"
                      >
                        {copiedCode === c.code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === c.code ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Unlocked Courses */}
                {(wallet.unlockedCourses || []).map((slug, i) => {
                  const courseReward = rewards.find((r) => r.courseSlug === slug);
                  return (
                    <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-sky-500/30 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-bold border border-sky-500/30">
                          FREE COURSE ACCESS UNLOCKED
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Lifetime
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900 dark:text-white">{courseReward?.title || slug}</div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-sky-500" /> Full Mentor Curriculum
                        </span>
                        <Link
                          to={`/courses/${slug}`}
                          className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold font-mono flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <span>Start Learning</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Swag Orders */}
                {wallet.swagOrders.map((order) => (
                  <div key={order.id} className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-500/30 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                        OFFICIAL SWAG DISPATCH
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" /> {order.status}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-white">{order.rewardTitle}</div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300">
                      <div><strong className="text-slate-500 dark:text-slate-400">Recipient:</strong> {order.fullName} ({order.phone})</div>
                      <div><strong className="text-slate-500 dark:text-slate-400">Address:</strong> {order.address}, {order.city} - {order.pincode}</div>
                      <div><strong className="text-slate-500 dark:text-slate-400">Tracking #:</strong> <span className="text-amber-700 dark:text-amber-300 font-bold">{order.trackingNumber}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredRewards.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <div className="text-4xl">🔍</div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Matching Rewards</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  No store items matched your search "{searchQuery}". Try searching for something else or turn off the "In-Stock Only" filter.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setInStockOnly(false);
                  }}
                  className="text-xs font-mono"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {filteredRewards.map((item) => {
                  const isOutOfStock = item.inStock === false;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenRedeem(item)}
                      className={cn(
                        "group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border p-2.5 sm:p-4 shadow-sm transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer select-none",
                        isOutOfStock
                          ? "border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                          : "border-purple-100/90 dark:border-slate-800/90 bg-gradient-to-b from-purple-100/60 via-pink-50/25 to-white dark:from-slate-900/90 dark:via-dark-900 dark:to-dark-950 hover:shadow-2xl hover:shadow-purple-500/15 dark:hover:shadow-purple-500/25 hover:border-purple-300 dark:hover:border-purple-500/50"
                      )}
                    >
                      {/* Card Top Badges */}
                      <div className="flex items-center justify-between gap-1 w-full z-10">
                        <span className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-mono text-[9px] sm:text-[10px] font-bold uppercase shadow-2xs backdrop-blur-xs border border-slate-200/50 dark:border-slate-800 truncate max-w-[110px]">
                          {item.tag || item.category}
                        </span>

                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[9px] sm:text-[10px] font-black border border-rose-500 shadow-xs flex items-center gap-0.5 shrink-0">
                            ✕ Out of Stock
                          </span>
                        ) : item.isFeatured ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[9px] sm:text-[10px] font-bold border border-amber-500/30 backdrop-blur-xs flex items-center gap-0.5 shrink-0">
                            ⭐ Hot
                          </span>
                        ) : item.originalValue ? (
                          <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 dark:text-slate-500 font-medium truncate shrink-0">
                            {item.originalValue}
                          </span>
                        ) : null}
                      </div>

                      {/* Large Product Image (Prominent & Centered like reference image) */}
                      <div className="w-full h-36 sm:h-48 flex items-center justify-center p-2 relative overflow-hidden">
                        {isImageUrl(item.image) && !failedImages[item.id] ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className={cn(
                              "max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300 ease-out",
                              isOutOfStock && "opacity-55 grayscale-[40%]"
                            )}
                            loading="lazy"
                            onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                          />
                        ) : (
                          <div className={cn(
                            "w-full h-full flex items-center justify-center text-6xl sm:text-7xl select-none group-hover:scale-115 group-hover:rotate-3 transition-transform duration-300 filter drop-shadow-md",
                            isOutOfStock && "opacity-55 grayscale-[40%]"
                          )}>
                            {item.image && !isImageUrl(item.image) ? item.image : '🎁'}
                          </div>
                        )}
                      </div>

                      {/* Price Banner Pill (like reference image purple button) */}
                      <div className="my-1.5 sm:my-2 w-full">
                        {isOutOfStock ? (
                          <div className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-slate-200/90 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold text-xs sm:text-sm text-center border border-slate-300/80 dark:border-slate-700 flex items-center justify-center gap-1.5 shadow-xs">
                            <span>🚫</span>
                            <span>Out of Stock (🪙 {item.coinsCost})</span>
                          </div>
                        ) : (
                          <div className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-black text-xs sm:text-sm text-center shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 group-hover:shadow-purple-600/35 transition-all">
                            <span>🪙</span>
                            <span>{item.coinsCost} Coins</span>
                          </div>
                        )}
                      </div>

                      {/* Product Title (Only Title, No Description!) */}
                      <div className="text-center px-1 pb-1">
                        <h3 className={cn(
                          "text-xs sm:text-sm font-bold line-clamp-1 sm:line-clamp-2 leading-snug transition-colors",
                          isOutOfStock
                            ? "text-slate-500 dark:text-slate-400"
                            : "text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400"
                        )}>
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. PRODUCT DETAILS & REDEEM MODAL */}
      <Modal
        isOpen={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
        title={activeReward ? activeReward.title : 'Reward Details'}
        maxWidth="lg"
      >
        {activeReward && (
          <div className="space-y-6 text-slate-800 dark:text-slate-200">
            {/* Top Section: Large Visual + Key Info */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* Product Visual */}
              <div className="sm:col-span-5 h-48 sm:h-56 rounded-2xl bg-gradient-to-b from-purple-100/70 via-pink-50/40 to-white dark:from-slate-900 dark:via-dark-900 dark:to-dark-950 border border-purple-100 dark:border-slate-800 flex items-center justify-center p-4 relative overflow-hidden shadow-inner">
                {isImageUrl(activeReward.image) && !failedImages[activeReward.id] ? (
                  <img
                    src={activeReward.image}
                    alt={activeReward.title}
                    className="max-h-full max-w-full object-contain drop-shadow-lg"
                  />
                ) : (
                  <div className="text-7xl select-none filter drop-shadow-xl">
                    {activeReward.image && !isImageUrl(activeReward.image) ? activeReward.image : '🎁'}
                  </div>
                )}
                {activeReward.isFeatured && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-bold shadow-md">
                    ⭐ FEATURED REWARD
                  </span>
                )}
              </div>

              {/* Product Meta */}
              <div className="sm:col-span-7 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold uppercase border border-purple-200 dark:border-purple-800">
                    {activeReward.tag || activeReward.category}
                  </span>
                  {activeReward.originalValue && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                      {activeReward.originalValue}
                    </span>
                  )}
                  {activeReward.inStock === false ? (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold border border-rose-500/30">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> In Stock & Ready
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {activeReward.title}
                </h2>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-mono font-black text-base shadow-md shadow-purple-600/20">
                  <span>🪙</span>
                  <span>{activeReward.coinsCost} NEC Coins</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  {activeReward.description}
                </p>
              </div>
            </div>

            {/* Out of Stock Warning Banner */}
            {activeReward.inStock === false && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-3">
                <span className="text-2xl shrink-0">🚫</span>
                <div>
                  <div className="font-bold uppercase tracking-wider text-[11px] text-rose-600 dark:text-rose-400">Currently Out of Stock</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                    This reward item is temporarily out of stock in the NEC warehouse. It cannot be redeemed right now. Restocking is underway!
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Status Card */}
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Your Coin Balance:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">🪙 {wallet.coins} Coins</span>
              </div>

              <div>
                {activeReward.inStock === false ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Item temporarily out of stock
                  </span>
                ) : wallet.coins >= activeReward.coinsCost ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready to Redeem! (Remaining after: {wallet.coins - activeReward.coinsCost} Coins)
                  </span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400 font-bold">
                    Need {activeReward.coinsCost - wallet.coins} more coins to unlock
                  </span>
                )}
              </div>
            </div>

            {/* If Swag Item: Show Shipping Form */}
            {activeReward.category === 'swag' && activeReward.inStock !== false && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-amber-500/30 space-y-3 font-mono text-xs">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-500" /> Doorstep Delivery Address (India Shipping):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sandip Kumar"
                      value={shippingForm.fullName}
                      onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Street Address / House No.</label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Sunshine Residency, Outer Ring Road"
                    value={shippingForm.address}
                    onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-semibold">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Pincode</label>
                    <input
                      type="text"
                      placeholder="e.g. 560100"
                      value={shippingForm.pincode}
                      onChange={(e) => setShippingForm({ ...shippingForm, pincode: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsRedeemModalOpen(false)}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Close
              </Button>

              {activeReward.inStock === false ? (
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  className="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold border-rose-300 dark:border-rose-900 cursor-not-allowed opacity-90"
                >
                  🚫 Out of Stock (Restocking Soon)
                </Button>
              ) : wallet.coins >= activeReward.coinsCost ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmRedeem}
                  isLoading={redeeming}
                  disabled={redeeming}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black border-none shadow-lg shadow-amber-500/25 cursor-pointer"
                >
                  {redeeming ? 'Redeeming Reward...' : `Confirm & Redeem (🪙 ${activeReward.coinsCost} Coins)`}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setIsRedeemModalOpen(false);
                    handleClaimStreak();
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold border-none shadow-md cursor-pointer"
                >
                  Earn More Coins (+Daily Challenge)
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 4. SUCCESS CELEBRATION MODAL */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Redemption Successful!"
        maxWidth="md"
      >
        {successData && (
          <div className="space-y-4 text-center text-slate-800 dark:text-slate-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-3xl mx-auto">
              🎉
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{successData.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{successData.message}</p>

            {successData.couponCode && (
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-amber-500/40 flex items-center justify-between gap-3 font-mono">
                <span className="text-base font-black text-amber-700 dark:text-amber-300 tracking-wider">
                  {successData.couponCode}
                </span>
                <button
                  onClick={() => handleCopyCode(successData.couponCode!)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Coupon</span>
                </button>
              </div>
            )}

            {successData.order && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left font-mono text-xs space-y-1 text-slate-800 dark:text-slate-300">
                <div><strong className="text-slate-500 dark:text-slate-400">Tracking Code:</strong> <span className="text-amber-700 dark:text-amber-300 font-bold">{successData.order.trackingNumber}</span></div>
                <div><strong className="text-slate-500 dark:text-slate-400">Shipping To:</strong> {successData.order.fullName}, {successData.order.city} - {successData.order.pincode}</div>
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold border-none cursor-pointer shadow-md"
            >
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* 5. HOW TO EARN COINS MODAL */}
      <Modal
        isOpen={isHowToEarnOpen}
        onClose={() => setIsHowToEarnOpen(false)}
        title="🪙 How to Earn NEC Coins"
        maxWidth="md"
      >
        <div className="space-y-4 text-slate-800 dark:text-slate-200">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            NEC Coins are 100% free platform reward points earned purely through your coding effort, consistency, and contest rankings!
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <span className="text-2xl shrink-0">🎁</span>
              <div>
                <div className="font-bold text-emerald-700 dark:text-emerald-300">1. Lifetime Welcome Bonus (+50 Coins)</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                  Solve your very first DSA coding practice problem on the platform to claim a one-time welcome gift of 50 NEC Coins!
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
              <span className="text-2xl shrink-0">🔥</span>
              <div>
                <div className="font-bold text-orange-700 dark:text-orange-300">2. Daily POTD Streak (+1/day, +7 Bonus)</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                  Solve today's Problem of the Day challenge daily to claim +1 Coin, plus +7 Bonus Coins on every 7-day continuous streak milestone.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <span className="text-2xl shrink-0">🏆</span>
              <div>
                <div className="font-bold text-amber-700 dark:text-amber-300">3. Weekly Sunday Contests (+50 to +100 Coins)</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                  Compete every Sunday at 8:00 PM. Solve algorithmic problems with 100% passed test cases to win up to +100 Coins per contest.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
              <span className="text-2xl shrink-0">👑</span>
              <div>
                <div className="font-bold text-yellow-700 dark:text-yellow-400">4. NEC Prime Battle (High-Stakes Arena)</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                  Stake 50 to 5,000 coins in 1v1 live coding duels. The faster accepted solution takes the entire net prize pool!
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
              <span className="text-2xl shrink-0">💎</span>
              <div>
                <div className="font-bold text-purple-700 dark:text-purple-300">5. Monthly Grand Contest & Tournaments</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                  Top performers in official monthly tournaments win official coin prize pools and direct merchandise shipments.
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              ⚡ <em>Standard Code Battle is 100% Free Practice (0 coins won or lost). Lessons, Quizzes & Courses award XP towards your leaderboard level.</em>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsHowToEarnOpen(false)}
              className="bg-amber-500 text-slate-950 font-bold cursor-pointer"
            >
              Got it, let's code!
            </Button>
          </div>
        </div>
      </Modal>

      {/* Animated Streak Modal */}
      <AnimatedCoinModal
        isOpen={streakModalData.isOpen}
        onClose={() => setStreakModalData((prev) => ({ ...prev, isOpen: false }))}
        coins={streakModalData.coins}
        title={streakModalData.title}
        subtitle={streakModalData.subtitle}
        badgeText={streakModalData.badgeText}
        streakCount={streakModalData.streakCount}
        isBonus={streakModalData.isBonus}
        isDailyStreak={true}
      />

    </div>
  );
};
