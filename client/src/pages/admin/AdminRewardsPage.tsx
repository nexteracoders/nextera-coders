import React, { useState, useEffect, useRef } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import {
  coinService,
  RewardItem,
  SwagOrder,
  UserWalletRecord,
} from '../../services/coin.service';
import { adminService } from '../../services/admin.service';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { Button } from '../../components/ui/Button';
import {
  Gift,
  Plus,
  Search,
  Truck,
  CheckCircle2,
  RotateCcw,
  Edit2,
  Trash2,
  Coins,
  Upload,
  Link2,
  Smile,
  Star,
  Users,
  Phone,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const EMOJI_PRESETS = [
  '🎒', '👕', '🍶', '💻', '🚀', '🎟️', '💎', '🎁', '🤖', '🎧',
  '⌨️', '📦', '🏆', '⚡', '☕', '📱', '🎫', '📚', '🎖️', '🔥',
];

export const AdminRewardsPage: React.FC = () => {
  useDocumentTitle('Rewards & Swag Store Management — Admin CMS');
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'wallets'>('catalog');
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [swagOrders, setSwagOrders] = useState<SwagOrder[]>([]);
  const [wallets, setWallets] = useState<UserWalletRecord[]>([]);

  // Search and filter states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'coupon' | 'course' | 'swag' | 'perk'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'outofstock'>('all');

  // Modal States
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Reward Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'coupon' | 'course' | 'swag' | 'perk'>('swag');
  const [formCoinsCost, setFormCoinsCost] = useState<number>(500);
  const [formDescription, setFormDescription] = useState('');
  const [formTag, setFormTag] = useState('Official Swag');
  const [formOriginalValue, setFormOriginalValue] = useState('Worth ₹1,999');
  const [formInStock, setFormInStock] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formCouponCode, setFormCouponCode] = useState('');
  const [formDiscountPercent, setFormDiscountPercent] = useState<number>(20);
  const [formCourseSlug, setFormCourseSlug] = useState('');

  // Image upload / URL / Emoji selector state
  const [imageType, setImageType] = useState<'upload' | 'url' | 'emoji'>('emoji');
  const [formImage, setFormImage] = useState('🎁');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Swag Order Modal State
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SwagOrder | null>(null);
  const [orderStatus, setOrderStatus] = useState<'Processing' | 'Shipped' | 'Delivered'>('Processing');
  const [orderTrackingNumber, setOrderTrackingNumber] = useState('');

  // Airdrop Modal State
  const [airdropModalOpen, setAirdropModalOpen] = useState(false);
  const [airdropUser, setAirdropUser] = useState<UserWalletRecord | null>(null);
  const [airdropAmount, setAirdropAmount] = useState<number>(100);
  const [airdropMode, setAirdropMode] = useState<'add' | 'deduct' | 'set'>('add');
  const [airdropReason, setAirdropReason] = useState('Contest / Hackathon reward bonus');

  // Load and subscribe to coinService
  useEffect(() => {
    coinService.fetchLiveRewards().then((items) => setRewards(items)).catch(() => {});
    adminService.getStudents({ limit: 100 }).then((res) => {
      if (res?.students) {
        coinService.syncDatabaseStudents(res.students as any);
        setSwagOrders(coinService.getAllSwagOrders());
      }
    }).catch(() => {});

    const unsubRewards = coinService.subscribeRewards((items) => {
      setRewards(items);
    });
    const unsubWallets = coinService.subscribeAdmin((wList) => {
      setWallets(wList);
      setSwagOrders(coinService.getAllSwagOrders());
    });

    setRewards(coinService.getRewards());
    setWallets(coinService.getAllUserWallets());
    setSwagOrders(coinService.getAllSwagOrders());

    return () => {
      unsubRewards();
      unsubWallets();
    };
  }, []);

  // Open Create Reward Modal
  const handleOpenCreate = () => {
    setEditingReward(null);
    setFormTitle('');
    setFormCategory('swag');
    setFormCoinsCost(500);
    setFormDescription('High quality developer swag item for platform champions.');
    setFormTag('Official Swag');
    setFormOriginalValue('Worth ₹1,999');
    setFormInStock(true);
    setFormIsFeatured(false);
    setFormCouponCode('');
    setFormDiscountPercent(20);
    setFormCourseSlug('');
    setFormImage('🎒');
    setImageType('emoji');
    setRewardModalOpen(true);
  };

  // Open Edit Reward Modal
  const handleOpenEdit = (item: RewardItem) => {
    setEditingReward(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormCoinsCost(item.coinsCost);
    setFormDescription(item.description);
    setFormTag(item.tag || '');
    setFormOriginalValue(item.originalValue || `Worth ₹${item.coinsCost * 3}`);
    setFormInStock(item.inStock !== false);
    setFormIsFeatured(Boolean(item.isFeatured));
    setFormCouponCode(item.couponCode || '');
    setFormDiscountPercent(item.discountPercent || 20);
    setFormCourseSlug(item.courseSlug || '');
    setFormImage(item.image || '🎁');

    if (item.image?.startsWith('http') || item.image?.startsWith('/')) {
      setImageType('url');
    } else if (item.image?.startsWith('data:image')) {
      setImageType('upload');
    } else {
      setImageType('emoji');
    }

    setRewardModalOpen(true);
  };

  // Image Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastError('Image size exceeds 2MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImage(reader.result);
        setImageType('upload');
        success('Image uploaded and previewed successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Reward Form
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toastError('Please enter a reward title');
      return;
    }
    if (formCoinsCost < 0) {
      toastError('Coins cost cannot be negative');
      return;
    }

    try {
      await coinService.saveReward({
        id: editingReward?.id,
        title: formTitle.trim(),
        category: formCategory,
        coinsCost: Number(formCoinsCost) || 0,
        description: formDescription.trim(),
        image: formImage.trim() || '🎁',
        tag: formTag.trim() || undefined,
        originalValue: formOriginalValue.trim() || undefined,
        inStock: formInStock,
        isFeatured: formIsFeatured,
        couponCode: formCategory === 'coupon' ? (formCouponCode.trim() || `NEC${formDiscountPercent}OFF`) : undefined,
        discountPercent: formCategory === 'coupon' ? Number(formDiscountPercent) : undefined,
        courseSlug: formCategory === 'course' ? formCourseSlug.trim() : undefined,
      });

      success(
        editingReward ? `Updated reward "${formTitle}" in database!` : `Created reward "${formTitle}" in database!`,
        'Reward Saved'
      );
      setRewardModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to save reward to database');
    }
  };

  // Delete Reward Handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const deleted = await coinService.deleteReward(deleteTarget.id);
    if (deleted) {
      success(`Removed "${deleteTarget.title}" from store database.`, 'Reward Deleted');
    }
    setDeleteTarget(null);
  };

  // Reset Rewards
  const handleResetDefaults = async () => {
    if (window.confirm('Reset all rewards to default platform catalog? Any custom added items will be replaced.')) {
      await coinService.resetRewardsToDefault();
      success('Reset reward store to standard default catalog in database.', 'Reset Complete');
    }
  };

  // Open Order Status Modal
  const handleOpenOrderModal = (order: SwagOrder) => {
    setSelectedOrder(order);
    setOrderStatus(order.status);
    setOrderTrackingNumber(order.trackingNumber || '');
    setOrderModalOpen(true);
  };

  // Save Order Status
  const handleSaveOrderStatus = () => {
    if (!selectedOrder) return;
    coinService.adminUpdateSwagOrderStatus(
      selectedOrder.id,
      orderStatus,
      orderTrackingNumber.trim() || undefined
    );
    success(`Updated Order #${selectedOrder.id} to "${orderStatus}"`, 'Shipment Updated');
    setOrderModalOpen(false);
  };

  // Open Airdrop Modal
  const handleOpenAirdrop = (walletUser: UserWalletRecord) => {
    setAirdropUser(walletUser);
    setAirdropAmount(100);
    setAirdropMode('add');
    setAirdropReason('Contest / Hackathon reward bonus');
    setAirdropModalOpen(true);
  };

  // Execute Airdrop
  const handleExecuteAirdrop = () => {
    if (!airdropUser) return;
    coinService.adminAdjustUserCoins(
      airdropUser.userId,
      Number(airdropAmount) || 0,
      airdropMode,
      airdropReason.trim() || 'Admin coin adjustment'
    );
    success(`Adjusted coins for ${airdropUser.userName} successfully!`, 'Coins Updated');
    setAirdropModalOpen(false);
  };

  // Filtered Rewards
  const filteredRewards = rewards.filter((r) => {
    const matchesSearch =
      !search.trim() ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.tag && r.tag.toLowerCase().includes(search.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase())) ||
      (r.couponCode && r.couponCode.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'instock' && r.inStock !== false) ||
      (stockFilter === 'outofstock' && r.inStock === false);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // KPI Calculations
  const inStockCount = rewards.filter((r) => r.inStock !== false).length;
  const pendingOrdersCount = swagOrders.filter((o) => o.status === 'Processing').length;
  const totalCoinsInCirculation = wallets.reduce((acc, curr) => acc + (curr.coins || 0), 0);

  // Helper to render reward image/icon
  const renderRewardImage = (img: string, title: string, className: string = 'w-12 h-12') => {
    const isImg = Boolean(
      img && (
        img.startsWith('http://') ||
        img.startsWith('https://') ||
        img.startsWith('/') ||
        img.startsWith('data:image') ||
        img.startsWith('blob:') ||
        /\.(jpeg|jpg|gif|png|svg|webp|avif)(\?.*)?$/i.test(img)
      )
    );

    if (isImg) {
      return (
        <div className={cn('relative rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center bg-slate-100 dark:bg-slate-800', className)}>
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLElement;
              target.style.display = 'none';
              if (target.parentElement && !target.parentElement.querySelector('.fallback-icon')) {
                const fallback = document.createElement('span');
                fallback.innerText = '🎁';
                fallback.className = 'fallback-icon text-xl select-none';
                target.parentElement.appendChild(fallback);
              }
            }}
          />
        </div>
      );
    }
    return (
      <div className={cn('rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-xs select-none shrink-0', className)}>
        {img || '🎁'}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans animate-fade-in">
      {/* Page Header */}
      <AdminPageHeader
        title="Rewards Store & Swag Hub"
        description="Create, customize, and manage coin redeemable coupons, full pro courses, physical merchandise swag, and student delivery orders."
        breadcrumbs={[{ label: 'Commerce & Rewards' }, { label: 'Rewards Store' }]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetDefaults}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="text-xs cursor-pointer"
            >
              Reset Defaults
            </Button>
            <Button
              type="button"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Add New Reward
            </Button>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{rewards.length}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Total Store Items</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{inStockCount}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">In Stock & Active</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{pendingOrdersCount}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Pending Swag Shipments</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {totalCoinsInCirculation.toLocaleString()}
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Circulating Coins</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Reward Store Catalog ({rewards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Swag Shipments & Orders</span>
          {pendingOrdersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-blue-500 text-white font-mono font-bold">
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wallets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'wallets'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Coin Wallets & Airdrop</span>
        </button>
      </div>

      {/* TAB 1: REWARD CATALOG & STORE ITEMS */}
      {activeTab === 'catalog' && (
        <div className="space-y-5 animate-fade-in">
          {/* Search & Filters */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rewards, coupons, swag..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-slate-400">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="coupon">Discount Coupons</option>
                  <option value="course">Pro Courses</option>
                  <option value="swag">Physical Merchandise</option>
                  <option value="perk">Digital Perks</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-slate-400">Stock:</span>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="instock">In Stock Only</option>
                  <option value="outofstock">Out of Stock Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRewards.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-5 rounded-2xl border transition-all flex flex-col justify-between relative group hover:shadow-lg',
                  item.isFeatured
                    ? 'bg-gradient-to-br from-amber-50/50 via-white to-amber-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border-amber-500/40 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                )}
              >
                <div className="space-y-3.5">
                  {/* Card Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {renderRewardImage(item.image, item.title, 'w-12 h-12 text-2xl')}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase',
                            item.category === 'coupon'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : item.category === 'course'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              : item.category === 'swag'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          )}>
                            {item.category}
                          </span>
                          {item.tag && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.tag}
                            </span>
                          )}
                          {item.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-current" />
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                        title="Edit Reward"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Reward"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Meta Specifics */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Redeem Cost:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1">
                        🪙 {item.coinsCost} Coins
                      </span>
                    </div>
                    {item.originalValue && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Original Value:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px]">{item.originalValue}</span>
                      </div>
                    )}
                    {item.couponCode && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Coupon Code:</span>
                        <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px] bg-emerald-500/10 px-1.5 py-0.2 rounded">
                          {item.couponCode}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-3 mt-4 text-xs">
                  <button
                    type="button"
                    onClick={async () => {
                      const nextFeatured = !item.isFeatured;
                      try {
                        await coinService.toggleRewardFeatured(item.id);
                        success(nextFeatured ? `"${item.title}" marked as Featured (Hot)!` : `"${item.title}" set to Standard.`);
                      } catch (err: any) {
                        toastError(err.message || 'Failed to update featured status');
                      }
                    }}
                    className={cn(
                      'text-[11px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1',
                      item.isFeatured
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <Star className="w-3 h-3" />
                    <span>{item.isFeatured ? 'Featured' : 'Standard'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const nextInStock = item.inStock === false;
                      try {
                        await coinService.toggleRewardStock(item.id);
                        success(
                          nextInStock
                            ? `✓ "${item.title}" is now In Stock & live for users!`
                            : `✕ "${item.title}" is now marked Out of Stock on store!`,
                          'Stock Updated'
                        );
                      } catch (err: any) {
                        toastError(err.message || 'Failed to update stock in database');
                      }
                    }}
                    className={cn(
                      'text-[11px] font-mono px-2.5 py-0.5 rounded transition-colors cursor-pointer font-bold',
                      item.inStock !== false
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    )}
                  >
                    {item.inStock !== false ? '✓ In Stock' : '✕ Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredRewards.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <Gift className="w-10 h-10 text-slate-400 mx-auto animate-bounce" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Rewards Found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No store items matched your search or filters. Try resetting filters or add a new reward.
              </p>
              <Button
                type="button"
                onClick={handleOpenCreate}
                className="bg-amber-500 text-slate-950 font-bold cursor-pointer"
              >
                Create Reward
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SWAG ORDERS & DELIVERY TRACKING */}
      {activeTab === 'orders' && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Physical Merchandise & Swag Delivery Records</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review student shipping addresses, update courier dispatch tracking numbers, and manage delivery fulfillment.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              {swagOrders.length} Total Orders
            </span>
          </div>

          {/* Orders Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Order ID & Date</th>
                  <th className="px-4 py-3.5 font-semibold">Reward Item</th>
                  <th className="px-4 py-3.5 font-semibold">Recipient & Contact</th>
                  <th className="px-4 py-3.5 font-semibold">Shipping Address</th>
                  <th className="px-4 py-3.5 font-semibold">Status & Courier</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {swagOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        #{order.id}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(order.orderedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {order.rewardTitle}
                      </div>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                        🪙 {order.coinsCost} Coins
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {order.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-amber-500" />
                        <span>{order.phone}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="line-clamp-2 text-slate-600 dark:text-slate-300 text-[11px]">
                        {order.address}
                      </p>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {order.city} - {order.pincode}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold',
                        order.status === 'Delivered'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : order.status === 'Shipped'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      )}>
                        {order.status}
                      </span>
                      {order.trackingNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Tracking: {order.trackingNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenOrderModal(order)}
                        className="text-xs cursor-pointer"
                      >
                        Update Status
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {swagOrders.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                No student merchandise orders placed yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT WALLETS & AIRDROP */}
      {activeTab === 'wallets' && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span>Student Coin Balances & Manual Airdrop Hub</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Directly adjust coins or grant bonus contest rewards to students with full ledger logging.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
              {wallets.length} Registered Wallets
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Student Name & Email</th>
                  <th className="px-4 py-3.5 font-semibold">Coin Balance</th>
                  <th className="px-4 py-3.5 font-semibold">Daily Streak</th>
                  <th className="px-4 py-3.5 font-semibold">Unlocked Perks</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {wallets.map((w) => (
                  <tr key={w.userId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{w.userName}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {w.userEmail}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1">
                        🪙 {(w.coins || 0).toLocaleString()} Coins
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                        🔥 {w.dailyStreak || 0} Days
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[11px] font-mono">
                      <span>{(w.unlockedCoupons || []).length} Coupons • {(w.unlockedCourses || []).length} Courses</span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenAirdrop(w)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                        leftIcon={<Coins className="w-3.5 h-3.5" />}
                      >
                        Adjust / Airdrop
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT REWARD MODAL */}
      {rewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <span>{editingReward ? 'Edit Reward Item' : 'Create New Store Reward'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setRewardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-4 text-xs">
              {/* Live Preview Header */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                {renderRewardImage(formImage, formTitle, 'w-14 h-14 text-3xl shrink-0')}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {formCategory} • {formTag || 'Reward'}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate mt-1">
                    {formTitle || 'Reward Title Preview'}
                  </h4>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                    🪙 {formCoinsCost} Coins • <span className="text-slate-400 font-normal">{formOriginalValue || 'Worth ₹999'}</span>
                  </p>
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reward Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. NEC Pro Developer Backpack"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setFormCategory(cat);
                      if (cat === 'coupon') setFormTag('Quick Reward');
                      else if (cat === 'course') setFormTag('Full Course');
                      else if (cat === 'swag') setFormTag('Official Swag');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="swag">Physical Swag / Merchandise</option>
                    <option value="coupon">Discount Coupon</option>
                    <option value="course">Full Pro Course Access</option>
                    <option value="perk">Digital Perk / Special Access</option>
                  </select>
                </div>
              </div>

              {/* Coins Cost & Original Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Coin Cost (Price) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formCoinsCost}
                    onChange={(e) => setFormCoinsCost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Badge Tag (e.g. Popular, Hot)
                  </label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder="e.g. Best Value"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Market Value Tag
                  </label>
                  <input
                    type="text"
                    value={formOriginalValue}
                    onChange={(e) => setFormOriginalValue(e.target.value)}
                    placeholder="e.g. Worth ₹1,999"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe material, specifications, discount terms, or perks..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Category Conditional Fields */}
              {formCategory === 'coupon' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Discount Percentage (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formDiscountPercent}
                      onChange={(e) => setFormDiscountPercent(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Coupon Code
                    </label>
                    <input
                      type="text"
                      value={formCouponCode}
                      onChange={(e) => setFormCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. NEC25SUPER"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {formCategory === 'course' && (
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Target URL Slug
                  </label>
                  <input
                    type="text"
                    value={formCourseSlug}
                    onChange={(e) => setFormCourseSlug(e.target.value)}
                    placeholder="e.g. dsa-competitive-programming-masterclass"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* IMAGE / VISUAL ASSET SELECTOR */}
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Reward Image / Visual Asset *
                </label>

                {/* Switcher Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImageType('upload')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                      imageType === 'upload'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    )}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageType('url')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                      imageType === 'url'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    )}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Image Web URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageType('emoji')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                      imageType === 'emoji'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    )}
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>Emoji Icon Preset</span>
                  </button>
                </div>

                {/* Option 1: Upload */}
                {imageType === 'upload' && (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Upload className="w-4 h-4" />}
                      className="text-xs cursor-pointer"
                    >
                      Choose Image from Computer (Max 2MB)
                    </Button>
                    <p className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WebP & SVG. Automatically converted and saved.
                    </p>
                  </div>
                )}

                {/* Option 2: Image URL */}
                {imageType === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="https://your-domain.com/reward-image.png"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                )}

                {/* Option 3: Emoji Grid */}
                {imageType === 'emoji' && (
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormImage(emoji)}
                        className={cn(
                          'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer',
                          formImage === emoji
                            ? 'bg-amber-500/20 border-2 border-amber-500 scale-110'
                            : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formInStock}
                    onChange={(e) => setFormInStock(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Active & In Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Feature on Store Top</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRewardModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  {editingReward ? 'Save Changes' : 'Publish Reward'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SWAG ORDER STATUS MODAL */}
      {orderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Update Shipment #{selectedOrder.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Status
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Processing">Processing (Packing order)</option>
                  <option value="Shipped">Shipped (In transit with courier)</option>
                  <option value="Delivered">Delivered (Successfully received)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Courier Tracking ID / URL
                </label>
                <input
                  type="text"
                  value={orderTrackingNumber}
                  onChange={(e) => setOrderTrackingNumber(e.target.value)}
                  placeholder="e.g. BLUEDART-987654321"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setOrderModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveOrderStatus}
                className="bg-amber-500 text-slate-950 font-bold"
              >
                Update Shipment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AIRDROP / ADJUST COINS MODAL */}
      {airdropModalOpen && airdropUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Coins className="w-4 h-4 text-purple-500" />
                <span>Adjust Coins for {airdropUser.userName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAirdropModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between font-mono">
                <span className="text-slate-500 dark:text-slate-400">Current Balance:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  🪙 {(airdropUser.coins || 0).toLocaleString()} Coins
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operation Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAirdropMode('add')}
                    className={cn(
                      'p-2 rounded-xl font-mono font-bold text-center transition-colors cursor-pointer',
                      airdropMode === 'add'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    + Add Coins
                  </button>
                  <button
                    type="button"
                    onClick={() => setAirdropMode('deduct')}
                    className={cn(
                      'p-2 rounded-xl font-mono font-bold text-center transition-colors cursor-pointer',
                      airdropMode === 'deduct'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    - Deduct
                  </button>
                  <button
                    type="button"
                    onClick={() => setAirdropMode('set')}
                    className={cn(
                      'p-2 rounded-xl font-mono font-bold text-center transition-colors cursor-pointer',
                      airdropMode === 'set'
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    = Set Exact
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Coin Amount
                </label>
                <input
                  type="number"
                  min="0"
                  value={airdropAmount}
                  onChange={(e) => setAirdropAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Reason
                </label>
                <input
                  type="text"
                  value={airdropReason}
                  onChange={(e) => setAirdropReason(e.target.value)}
                  placeholder="e.g. Hackathon 1st Prize / Bug Bounty"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setAirdropModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteAirdrop}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Execute Adjustment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Reward Item"
        itemName={deleteTarget?.title}
        description="Are you sure you want to permanently delete this item from the Rewards Store catalog? This action will remove it for all students immediately."
      />
    </div>
  );
};
