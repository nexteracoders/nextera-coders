// NEC Coins, Daily Streak & Rewards Service
import { api } from './api';

export interface RewardItem {
  id: string;
  title: string;
  category: 'coupon' | 'course' | 'swag' | 'perk';
  coinsCost: number;
  description: string;
  image: string; // URL, Base64 image, or Emoji
  tag?: string;
  couponCode?: string;
  discountPercent?: number;
  courseSlug?: string;
  inStock?: boolean;
  stockCount?: number;
  isFeatured?: boolean;
  originalValue?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoinTransaction {
  id: string;
  title: string;
  type: 'credit' | 'debit';
  amount: number;
  timestamp: string;
  description: string;
}

export interface SwagOrder {
  id: string;
  rewardId: string;
  rewardTitle: string;
  coinsCost: number;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
  orderedAt: string;
  trackingNumber: string;
}

export interface CoinWalletState {
  coins: number;
  dailyStreak: number;
  lastClaimDate: string | null;
  claimedToday: boolean;
  transactions: CoinTransaction[];
  unlockedCoupons: { code: string; discount: number; title: string; unlockedAt: string }[];
  unlockedCourses: string[];
  swagOrders: SwagOrder[];
}

export const DEFAULT_REWARD_CATALOG: RewardItem[] = [
  {
    id: 'coupon-10',
    title: '10% Extra Discount Coupon',
    category: 'coupon',
    coinsCost: 100,
    discountPercent: 10,
    couponCode: 'NEC10COIN',
    description: 'Get an extra 10% instant discount on any Pro Course or subscription.',
    image: '🎫',
    tag: 'Quick Reward',
    inStock: true,
    originalValue: 'Worth ₹499',
  },
  {
    id: 'coupon-25',
    title: '25% Super Discount Coupon',
    category: 'coupon',
    coinsCost: 250,
    discountPercent: 25,
    couponCode: 'NEC25SUPER',
    description: 'Get a massive 25% instant discount applicable on any checkout.',
    image: '🎟️',
    tag: 'Popular',
    inStock: true,
    isFeatured: true,
    originalValue: 'Worth ₹999',
  },
  {
    id: 'coupon-50',
    title: '50% Mega Saver Coupon',
    category: 'coupon',
    coinsCost: 500,
    discountPercent: 50,
    couponCode: 'NEC50MEGA',
    description: 'Huge 50% discount on any Premium Pro Cohort or Masterclass track.',
    image: '💎',
    tag: 'Best Value',
    inStock: true,
    isFeatured: true,
    originalValue: 'Worth ₹2,499',
  },
  {
    id: 'course-dsa',
    title: 'DSA & Competitive Coding Ace Track',
    category: 'course',
    coinsCost: 500,
    courseSlug: 'dsa-competitive-programming-masterclass',
    description: 'Master 450+ Data Structures & Algorithms problems with full mentor video solutions.',
    image: '💻',
    tag: 'Full Course',
    inStock: true,
    originalValue: 'Worth ₹1,999',
  },
  {
    id: 'course-mern',
    title: 'Full-Stack MERN Mastery Cohort',
    category: 'course',
    coinsCost: 500,
    courseSlug: 'full-stack-web-development-bootcamp',
    description: 'Build 8+ production apps with React 19, Node.js, Express, MongoDB and Microservices.',
    image: '🚀',
    tag: 'Full Course',
    inStock: true,
    originalValue: 'Worth ₹2,499',
  },
  {
    id: 'course-python',
    title: 'Python for GenAI & Machine Learning',
    category: 'course',
    coinsCost: 400,
    courseSlug: 'python-for-data-science-and-ai',
    description: 'Hands-on Python, NumPy, Pandas, LangChain, and fine-tuning AI LLM models.',
    image: '🤖',
    tag: 'Specialization',
    inStock: true,
    originalValue: 'Worth ₹1,499',
  },
  {
    id: 'swag-bag',
    title: 'NEC Pro Developer Waterproof Backpack',
    category: 'swag',
    coinsCost: 500,
    description: 'Ergonomic water-resistant developer bag with padded 16" laptop sleeve and USB charging port.',
    image: '🎒',
    tag: 'Official Swag',
    inStock: true,
    isFeatured: true,
    originalValue: 'Worth ₹1,999',
  },
  {
    id: 'swag-bottle',
    title: 'NEC Stainless Steel Insulated Water Bottle',
    category: 'swag',
    coinsCost: 500,
    description: '750ml vacuum-insulated dual-wall flask keeps beverages cold for 24h & hot for 12h.',
    image: '🍶',
    tag: 'Official Swag',
    inStock: true,
    originalValue: 'Worth ₹899',
  },
  {
    id: 'swag-hoodie',
    title: 'NEC "Code The Future" Premium Developer Hoodie',
    category: 'swag',
    coinsCost: 500,
    description: 'Heavyweight fleece cotton hoodie with embroidered NEC logo and code glyphs.',
    image: '👕',
    tag: 'Limited Edition',
    inStock: true,
    isFeatured: true,
    originalValue: 'Worth ₹2,299',
  },
  {
    id: 'swag-desk-kit',
    title: 'NEC Developer Desk Swag Pack',
    category: 'swag',
    coinsCost: 250,
    description: 'Hardcover developer notebook, matte metal gel pen, and 20+ holographic dev stickers.',
    image: '🎁',
    tag: 'Swag Box',
    inStock: true,
    originalValue: 'Worth ₹799',
  },
];

export let REWARD_CATALOG: RewardItem[] = [...DEFAULT_REWARD_CATALOG];

export interface UserWalletRecord {
  userId: string;
  userName: string;
  userEmail: string;
  avatar: string;
  college?: string;
  coins: number;
  dailyStreak: number;
  lastClaimDate: string | null;
  claimedToday: boolean;
  unlockedCoupons: { code: string; discount: number; title: string; unlockedAt: string }[];
  unlockedCourses: string[];
  swagOrders: SwagOrder[];
  updatedAt: string;
}

const STORAGE_KEY = 'nextera_coin_wallet_v3';
const ADMIN_WALLETS_KEY = 'nextera_admin_user_wallets_v3';
const REWARDS_CATALOG_KEY = 'nextera_rewards_catalog_v3';

class CoinService {
  private state: CoinWalletState;
  private userWallets: UserWalletRecord[];
  private rewards: RewardItem[];
  private currentUserId: string = 'user-current';
  private currentUserName: string = 'Student Coder';
  private currentUserEmail: string = '';
  private currentUserAvatar: string = '';
  private currentUserCollege: string = '';
  private listeners: Set<(state: CoinWalletState) => void> = new Set();
  private adminListeners: Set<(wallets: UserWalletRecord[]) => void> = new Set();
  private rewardListeners: Set<(rewards: RewardItem[]) => void> = new Set();

  constructor() {
    this.userWallets = this.loadAllUserWallets();
    this.rewards = this.loadRewards();
    REWARD_CATALOG = this.rewards;
    this.state = this.loadState();
    this.checkDayReset();
    this.fetchLiveRewards().catch(() => {});
  }

  public async fetchLiveRewards(): Promise<RewardItem[]> {
    try {
      const res = await api.get('/rewards');
      if (res.data?.data?.rewards && Array.isArray(res.data.data.rewards)) {
        this.rewards = res.data.data.rewards;
        REWARD_CATALOG = this.rewards;
        try {
          localStorage.setItem(REWARDS_CATALOG_KEY, JSON.stringify(this.rewards));
        } catch {}
        this.rewardListeners.forEach((l) => l(this.rewards));
        return this.rewards;
      }
    } catch (err) {
      console.warn('Could not fetch live rewards from server, using cached/default catalog.', err);
    }
    return this.getRewards();
  }

  private loadRewards(): RewardItem[] {
    try {
      const cached = localStorage.getItem(REWARDS_CATALOG_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading rewards catalog', e);
    }
    return [...DEFAULT_REWARD_CATALOG];
  }

  private saveRewards(rewards: RewardItem[]) {
    this.rewards = rewards;
    REWARD_CATALOG = rewards;
    try {
      localStorage.setItem(REWARDS_CATALOG_KEY, JSON.stringify(rewards));
    } catch (e) {
      console.error('Error saving rewards catalog', e);
    }
    this.rewardListeners.forEach((l) => l(this.rewards));
  }

  public getRewards(): RewardItem[] {
    return [...this.rewards];
  }

  public subscribeRewards(listener: (rewards: RewardItem[]) => void): () => void {
    this.rewardListeners.add(listener);
    listener(this.rewards);
    return () => this.rewardListeners.delete(listener);
  }

  public async saveReward(item: Partial<RewardItem> & { title: string; category: 'coupon' | 'course' | 'swag' | 'perk'; coinsCost: number }): Promise<RewardItem> {
    const existingIdx = this.rewards.findIndex((r) => r.id === item.id);
    const now = new Date().toISOString();

    let savedItem: RewardItem;
    if (existingIdx !== -1) {
      savedItem = {
        ...this.rewards[existingIdx],
        ...item,
        title: item.title.trim(),
        coinsCost: Math.max(0, Number(item.coinsCost) || 0),
        description: item.description || this.rewards[existingIdx].description || '',
        image: item.image || this.rewards[existingIdx].image || '🎁',
        updatedAt: now,
      };
      const updated = [...this.rewards];
      updated[existingIdx] = savedItem;
      this.saveRewards(updated);

      try {
        await api.put(`/rewards/${savedItem.id}`, savedItem);
      } catch (e) {
        console.error('Failed to sync updated reward to database', e);
      }
    } else {
      const newId = item.id || `reward-${item.category}-${Date.now()}`;
      savedItem = {
        id: newId,
        title: item.title.trim(),
        category: item.category,
        coinsCost: Math.max(0, Number(item.coinsCost) || 0),
        description: item.description || '',
        image: item.image || (item.category === 'coupon' ? '🎫' : item.category === 'course' ? '💻' : '🎒'),
        tag: item.tag || 'New Reward',
        couponCode: item.couponCode || (item.category === 'coupon' ? `NEC${item.discountPercent || 20}OFF` : undefined),
        discountPercent: item.discountPercent,
        courseSlug: item.courseSlug,
        inStock: item.inStock !== false,
        stockCount: item.stockCount,
        isFeatured: Boolean(item.isFeatured),
        originalValue: item.originalValue || `Worth ₹${Math.max(199, (Number(item.coinsCost) || 100) * 3)}`,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [savedItem, ...this.rewards];
      this.saveRewards(updated);

      try {
        await api.post('/rewards', savedItem);
      } catch (e) {
        console.error('Failed to sync new reward to database', e);
      }
    }

    return savedItem;
  }

  public async deleteReward(id: string): Promise<boolean> {
    const next = this.rewards.filter((r) => r.id !== id);
    if (next.length !== this.rewards.length) {
      this.saveRewards(next);
      try {
        await api.delete(`/rewards/${id}`);
      } catch (e) {
        console.error('Failed to sync reward deletion to database', e);
      }
      return true;
    }
    return false;
  }

  public async toggleRewardStock(id: string): Promise<boolean> {
    const idx = this.rewards.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const newStock = this.rewards[idx].inStock === false;
      const updated = [...this.rewards];
      updated[idx] = {
        ...updated[idx],
        inStock: newStock,
        updatedAt: new Date().toISOString(),
      };
      this.saveRewards(updated);
      try {
        await api.put(`/rewards/${id}`, { inStock: newStock });
      } catch (e: any) {
        console.error('Failed to sync reward stock to database', e);
        throw new Error(e.response?.data?.message || 'Failed to sync stock to database');
      }
      return true;
    }
    return false;
  }

  public async toggleRewardFeatured(id: string): Promise<boolean> {
    const idx = this.rewards.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const newFeatured = !this.rewards[idx].isFeatured;
      const updated = [...this.rewards];
      updated[idx] = {
        ...updated[idx],
        isFeatured: newFeatured,
        updatedAt: new Date().toISOString(),
      };
      this.saveRewards(updated);
      try {
        await api.put(`/rewards/${id}`, { isFeatured: newFeatured });
      } catch (e: any) {
        console.error('Failed to sync featured status to database', e);
        throw new Error(e.response?.data?.message || 'Failed to sync featured status to database');
      }
      return true;
    }
    return false;
  }

  public async updateRewardImage(id: string, image: string): Promise<boolean> {
    const idx = this.rewards.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const updated = [...this.rewards];
      updated[idx] = {
        ...updated[idx],
        image,
        updatedAt: new Date().toISOString(),
      };
      this.saveRewards(updated);
      try {
        await api.put(`/rewards/${id}`, { image });
      } catch (e) {
        console.error('Failed to sync reward image to database', e);
      }
      return true;
    }
    return false;
  }

  public async resetRewardsToDefault(): Promise<RewardItem[]> {
    try {
      const res = await api.post('/rewards/reset');
      if (res.data?.data?.rewards) {
        this.saveRewards(res.data.data.rewards);
        return this.rewards;
      }
    } catch (e) {
      console.error('Failed to reset rewards in database', e);
    }
    this.saveRewards([...DEFAULT_REWARD_CATALOG]);
    return this.getRewards();
  }

  private loadAllUserWallets(): UserWalletRecord[] {
    try {
      const cached = localStorage.getItem(ADMIN_WALLETS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error loading admin user wallets', e);
    }
    return [];
  }

  private saveAllUserWallets(wallets: UserWalletRecord[]) {
    this.userWallets = wallets;
    try {
      localStorage.setItem(ADMIN_WALLETS_KEY, JSON.stringify(wallets));
    } catch (e) {
      console.error('Error saving admin user wallets', e);
    }
    this.adminListeners.forEach((l) => l(this.userWallets));
  }

  private loadState(): CoinWalletState {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error loading coin wallet state', e);
    }

    const initialState: CoinWalletState = {
      coins: 0,
      dailyStreak: 0,
      lastClaimDate: null,
      claimedToday: false,
      transactions: [],
      unlockedCoupons: [],
      unlockedCourses: [],
      swagOrders: [],
    };

    return initialState;
  }

  private saveState(state: CoinWalletState) {
    this.state = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving coin wallet state', e);
    }

    if (this.currentUserId && this.currentUserEmail) {
      let matched = false;
      const updated = this.userWallets.map((u) => {
        if (
          (this.currentUserId !== 'user-current' && u.userId === this.currentUserId) ||
          (this.currentUserEmail && u.userEmail.toLowerCase() === this.currentUserEmail.toLowerCase())
        ) {
          matched = true;
          return {
            ...u,
            userId: this.currentUserId !== 'user-current' ? this.currentUserId : (u.userId !== 'user-current' ? u.userId : this.currentUserId),
            userName: this.currentUserName || u.userName,
            userEmail: this.currentUserEmail || u.userEmail,
            avatar: this.currentUserAvatar || u.avatar,
            college: this.currentUserCollege || u.college,
            coins: state.coins,
            dailyStreak: state.dailyStreak,
            lastClaimDate: state.lastClaimDate,
            claimedToday: state.claimedToday,
            unlockedCoupons: state.unlockedCoupons,
            unlockedCourses: state.unlockedCourses,
            swagOrders: state.swagOrders,
            updatedAt: new Date().toISOString(),
          };
        }
        return u;
      });

      if (!matched && this.currentUserId !== 'user-current') {
        updated.unshift({
          userId: this.currentUserId,
          userName: this.currentUserName || 'Student Coder',
          userEmail: this.currentUserEmail,
          avatar: this.currentUserAvatar || '',
          college: this.currentUserCollege || '',
          coins: state.coins,
          dailyStreak: state.dailyStreak,
          lastClaimDate: state.lastClaimDate,
          claimedToday: state.claimedToday,
          unlockedCoupons: state.unlockedCoupons,
          unlockedCourses: state.unlockedCourses,
          swagOrders: state.swagOrders,
          updatedAt: new Date().toISOString(),
        });
      }
      this.saveAllUserWallets(updated);
    }
    this.notify();
  }

  public getTimeUntilMidnight(): { hours: number; minutes: number; seconds: number; formatted: string } {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const diffMs = midnight.getTime() - now.getTime();
    if (diffMs <= 0) return { hours: 0, minutes: 0, seconds: 0, formatted: '00h 00m 00s' };

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      hours,
      minutes,
      seconds,
      formatted: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
    };
  }

  public checkDayReset(): boolean {
    const today = new Date().toDateString();
    if (this.state.lastClaimDate && new Date(this.state.lastClaimDate).toDateString() !== today) {
      if (this.state.claimedToday) {
        this.saveState({ ...this.state, claimedToday: false });
        return true;
      }
    }
    return false;
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  public subscribe(listener: (state: CoinWalletState) => void): () => void {
    this.checkDayReset();
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public subscribeAdmin(listener: (wallets: UserWalletRecord[]) => void): () => void {
    this.adminListeners.add(listener);
    listener(this.userWallets);
    return () => this.adminListeners.delete(listener);
  }

  public getState(): CoinWalletState {
    this.checkDayReset();
    return { ...this.state };
  }

  public async fetchLiveWallet() {
    try {
      const res = await api.get('/users/me/wallet');
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        const updated: CoinWalletState = {
          ...this.state,
          coins: typeof data.coins === 'number' ? data.coins : this.state.coins,
          dailyStreak: typeof data.dailyStreak === 'number' ? data.dailyStreak : this.state.dailyStreak,
          claimedToday: Boolean(data.claimedToday),
          lastClaimDate: data.lastClaimDate || this.state.lastClaimDate,
          unlockedCoupons: Array.isArray(data.unlockedCoupons) ? data.unlockedCoupons : this.state.unlockedCoupons,
          unlockedCourses: Array.isArray(data.unlockedCourses) ? data.unlockedCourses : this.state.unlockedCourses,
          swagOrders: Array.isArray(data.swagOrders) ? data.swagOrders : this.state.swagOrders,
        };
        this.saveState(updated);
      }
    } catch (e) {
      console.warn('Could not fetch live wallet from server, using local cache', e);
    }
  }

  public syncUserProfile(user: {
    id?: string;
    name?: string;
    email?: string;
    profileImage?: string;
    college?: string;
    points?: number;
    learningStreak?: number;
    unlockedCoupons?: any[];
    unlockedCourses?: string[];
    swagOrders?: SwagOrder[];
  }) {
    if (!user || (!user.name && !user.email)) return;
    const currentUserId = user.id || this.currentUserId;
    this.currentUserId = currentUserId;
    if (user.name) this.currentUserName = user.name;
    if (user.email) this.currentUserEmail = user.email;
    if (user.profileImage) this.currentUserAvatar = user.profileImage;
    if (user.college) this.currentUserCollege = user.college;

    const realCoins = typeof user.points === 'number' ? user.points : this.state.coins;
    const realStreak = typeof user.learningStreak === 'number' ? user.learningStreak : this.state.dailyStreak;
    const realCoupons = Array.isArray(user.unlockedCoupons) ? user.unlockedCoupons : this.state.unlockedCoupons;
    const realCourses = Array.isArray(user.unlockedCourses) ? user.unlockedCourses : this.state.unlockedCourses;
    const realOrders = Array.isArray(user.swagOrders) ? user.swagOrders : this.state.swagOrders;

    const updatedState: CoinWalletState = {
      ...this.state,
      coins: realCoins,
      dailyStreak: realStreak,
      unlockedCoupons: realCoupons,
      unlockedCourses: realCourses,
      swagOrders: realOrders,
    };
    this.saveState(updatedState);
    this.fetchLiveWallet();
  }

  public getAllUserWallets(): UserWalletRecord[] {
    return [...this.userWallets];
  }

  public syncDatabaseStudents(students: Array<{
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    college?: string;
    points?: number;
    learningStreak?: number;
    unlockedCoupons?: any[];
    unlockedCourses?: string[];
    swagOrders?: SwagOrder[];
  }>) {
    if (!students || students.length === 0) return;

    // Deduplicate incoming students by email/id
    const seenEmails = new Set<string>();
    const validStudents = students.filter((s) => {
      const emailLower = (s.email || '').toLowerCase().trim();
      if (!emailLower || seenEmails.has(emailLower)) return false;
      seenEmails.add(emailLower);
      return true;
    });

    const mapped: UserWalletRecord[] = validStudents.map((s) => {
      const existing = this.userWallets.find(
        (w) => w.userId === s.id || (s.email && w.userEmail.toLowerCase() === s.email.toLowerCase().trim())
      );
      return {
        userId: s.id,
        userName: s.name || 'Student Coder',
        userEmail: s.email,
        avatar: s.profileImage || '',
        college: s.college || '',
        coins: typeof s.points === 'number' ? s.points : (existing?.coins ?? 0),
        dailyStreak: typeof s.learningStreak === 'number' ? s.learningStreak : (existing?.dailyStreak ?? 0),
        lastClaimDate: existing?.lastClaimDate || null,
        claimedToday: existing?.claimedToday || false,
        unlockedCoupons: (s.unlockedCoupons && s.unlockedCoupons.length > 0) ? s.unlockedCoupons : (existing?.unlockedCoupons || []),
        unlockedCourses: (s.unlockedCourses && s.unlockedCourses.length > 0) ? s.unlockedCourses : (existing?.unlockedCourses || []),
        swagOrders: (s.swagOrders && s.swagOrders.length > 0) ? s.swagOrders : (existing?.swagOrders || []),
        updatedAt: new Date().toISOString(),
      };
    });

    this.saveAllUserWallets(mapped);
  }

  public adminCreateManualSwagOrder(userId: string, rewardTitle: string, coinsCost: number, shippingDetails: { fullName: string; phone: string; address: string; city: string; pincode: string }): SwagOrder | null {
    let target = this.userWallets.find((u) => u.userId === userId);
    if (!target) return null;

    const newOrder: SwagOrder = {
      id: `SWAG-${Date.now().toString().slice(-6)}`,
      rewardId: `custom-swag-${Date.now()}`,
      rewardTitle,
      coinsCost,
      fullName: shippingDetails.fullName,
      phone: shippingDetails.phone,
      address: shippingDetails.address,
      city: shippingDetails.city,
      pincode: shippingDetails.pincode,
      status: 'Processing',
      orderedAt: new Date().toISOString(),
      trackingNumber: `NEC-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    const updatedWallets = this.userWallets.map((u) => {
      if (u.userId === userId) {
        return {
          ...u,
          swagOrders: [newOrder, ...(u.swagOrders || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    this.saveAllUserWallets(updatedWallets);
    if (userId === this.currentUserId) {
      this.saveState({
        ...this.state,
        swagOrders: [newOrder, ...this.state.swagOrders],
      });
    }

    // Sync to backend MongoDB
    api.post(`/admin/students/${userId}/swag-order`, {
      rewardTitle,
      coinsCost,
      shippingDetails,
    }).catch((e) => console.warn('Could not sync manual swag order to backend', e));

    return newOrder;
  }

  public adminAdjustUserCoins(userId: string, amount: number, mode: 'add' | 'deduct' | 'set', reason: string = 'Admin adjustment'): UserWalletRecord | null {
    let target = this.userWallets.find((u) => u.userId === userId);
    if (!target) return null;

    let newCoins = target.coins;
    if (mode === 'add') newCoins = target.coins + Math.max(0, amount);
    else if (mode === 'deduct') newCoins = Math.max(0, target.coins - Math.max(0, amount));
    else if (mode === 'set') newCoins = Math.max(0, amount);

    const updated = this.userWallets.map((u) => {
      if (u.userId === userId) {
        return { ...u, coins: newCoins, updatedAt: new Date().toISOString() };
      }
      return u;
    });

    this.saveAllUserWallets(updated);

    if (userId === this.currentUserId) {
      const tx: CoinTransaction = {
        id: `tx-admin-${Date.now()}`,
        title: `⚙️ Coins Adjusted by Administrator`,
        type: mode === 'deduct' ? 'debit' : 'credit',
        amount: mode === 'set' ? Math.abs(newCoins - this.state.coins) : amount,
        timestamp: new Date().toISOString(),
        description: reason,
      };
      this.saveState({
        ...this.state,
        coins: newCoins,
        transactions: [tx, ...this.state.transactions],
      });
    }

    // Sync to backend MongoDB
    api.put(`/admin/students/${userId}/coins`, {
      amount,
      mode,
      reason,
    }).catch((e) => console.warn('Could not sync coin adjustment to backend', e));

    return updated.find((u) => u.userId === userId) || null;
  }

  public adminAdjustUserStreak(userId: string, streak: number, claimedToday: boolean = false): UserWalletRecord | null {
    const cleanStreak = Math.max(0, streak);
    const updated = this.userWallets.map((u) => {
      if (u.userId === userId) {
        return {
          ...u,
          dailyStreak: cleanStreak,
          claimedToday,
          lastClaimDate: claimedToday ? new Date().toDateString() : u.lastClaimDate,
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    this.saveAllUserWallets(updated);
    if (userId === this.currentUserId) {
      this.saveState({
        ...this.state,
        dailyStreak: cleanStreak,
        claimedToday,
        lastClaimDate: claimedToday ? new Date().toDateString() : this.state.lastClaimDate,
      });
    }

    // Sync to backend MongoDB
    api.put(`/admin/students/${userId}/streak`, {
      streak: cleanStreak,
      claimedToday,
    }).catch((e) => console.warn('Could not sync streak adjustment to backend', e));

    return updated.find((u) => u.userId === userId) || null;
  }

  public getAllSwagOrders(): SwagOrder[] {
    const ordersMap = new Map<string, SwagOrder>();
    this.state.swagOrders.forEach((o) => ordersMap.set(o.id, o));
    this.userWallets.forEach((u) => (u.swagOrders || []).forEach((o) => ordersMap.set(o.id, o)));
    return Array.from(ordersMap.values()).sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());
  }

  public updateSwagOrderStatus(orderId: string, newStatus: 'Processing' | 'Shipped' | 'Delivered', trackingNumber?: string): boolean {
    let found = false;
    const updatedWallets = this.userWallets.map((u) => {
      const orders = u.swagOrders || [];
      const orderIdx = orders.findIndex((o) => o.id === orderId);
      if (orderIdx !== -1) {
        found = true;
        const updatedOrders = [...orders];
        updatedOrders[orderIdx] = {
          ...updatedOrders[orderIdx],
          status: newStatus,
          trackingNumber: trackingNumber !== undefined ? trackingNumber : updatedOrders[orderIdx].trackingNumber,
        };
        return { ...u, swagOrders: updatedOrders, updatedAt: new Date().toISOString() };
      }
      return u;
    });

    if (found) {
      this.saveAllUserWallets(updatedWallets);
      const currentOrders = updatedWallets.find((u) => u.userId === this.currentUserId)?.swagOrders || [];
      this.saveState({ ...this.state, swagOrders: currentOrders });

      // Sync to backend MongoDB
      api.put(`/admin/swag-orders/${orderId}/status`, {
        status: newStatus,
        trackingNumber,
      }).catch((e) => console.warn('Could not sync swag order status to backend', e));
    }
    return found;
  }

  public adminUpdateSwagOrderStatus(orderId: string, newStatus: 'Processing' | 'Shipped' | 'Delivered', trackingNumber?: string): boolean {
    return this.updateSwagOrderStatus(orderId, newStatus, trackingNumber);
  }

  public adminGrantCoupon(userId: string, title: string, discount: number, code?: string): boolean {
    const couponCode = code || `ADMIN${discount}OFF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    let found = false;
    const updatedWallets = this.userWallets.map((u) => {
      if (u.userId === userId) {
        found = true;
        return {
          ...u,
          unlockedCoupons: [{ code: couponCode, discount, title, unlockedAt: new Date().toISOString() }, ...(u.unlockedCoupons || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    if (found) {
      this.saveAllUserWallets(updatedWallets);
      if (userId === this.currentUserId) {
        const currentCoupons = updatedWallets.find((u) => u.userId === this.currentUserId)?.unlockedCoupons || [];
        this.saveState({ ...this.state, unlockedCoupons: currentCoupons });
      }
    }
    return found;
  }

  public adminGrantCourse(userId: string, courseSlug: string): boolean {
    let found = false;
    const updatedWallets = this.userWallets.map((u) => {
      if (u.userId === userId) {
        found = true;
        const courses = u.unlockedCourses || [];
        if (!courses.includes(courseSlug)) return { ...u, unlockedCourses: [...courses, courseSlug], updatedAt: new Date().toISOString() };
      }
      return u;
    });

    if (found) {
      this.saveAllUserWallets(updatedWallets);
      if (userId === this.currentUserId) {
        const currentCourses = updatedWallets.find((u) => u.userId === this.currentUserId)?.unlockedCourses || [];
        this.saveState({ ...this.state, unlockedCourses: currentCourses });
      }
    }
    return found;
  }

  public isTodaySolved(): boolean {
    this.checkDayReset();
    const today = new Date().toDateString();
    return Boolean(
      this.state.claimedToday &&
      this.state.lastClaimDate &&
      new Date(this.state.lastClaimDate).toDateString() === today
    );
  }

  public isStreakLockedToday(): boolean {
    return this.isTodaySolved();
  }

  public async claimDailyStreakAsync(potdSlug?: string, potdId?: string, isPassed: boolean = true): Promise<{
    success: boolean;
    coinsAwarded: number;
    dailyCoins: number;
    extraCoins: number;
    newStreak: number;
    isBonus: boolean;
    alreadyClaimed?: boolean;
  }> {
    try {
      const res = await api.post('/users/me/streak/claim', {
        problemSlug: potdSlug,
        problemId: potdId,
        passed: isPassed,
      });
      if (res.data?.success && res.data?.data) {
        const backendData = res.data.data;
        const nextStreak = backendData.newStreak || (this.state.dailyStreak || 0) + 1;
        const totalCoins = typeof backendData.totalCoins === 'number' ? backendData.totalCoins : this.state.coins + 1;
        const nowIso = new Date().toISOString();

        const updatedState: CoinWalletState = {
          ...this.state,
          coins: totalCoins,
          dailyStreak: nextStreak,
          lastClaimDate: nowIso,
          claimedToday: true,
        };
        this.saveState(updatedState);
        return {
          success: true,
          coinsAwarded: backendData.coinsAwarded ?? 1,
          dailyCoins: 1,
          extraCoins: backendData.extraCoins ?? 0,
          newStreak: nextStreak,
          isBonus: nextStreak % 7 === 0,
          alreadyClaimed: backendData.alreadyClaimed || false,
        };
      }
    } catch (err) {
      console.warn('Live streak claim sync failed, falling back to local calculation:', err);
    }
    return this.claimDailyStreak();
  }

  public claimDailyStreak(): {
    success: boolean;
    coinsAwarded: number;
    dailyCoins: number;
    extraCoins: number;
    newStreak: number;
    isBonus: boolean;
    alreadyClaimed?: boolean;
  } {
    this.checkDayReset();
    const today = new Date().toDateString();
    if (this.state.claimedToday && this.state.lastClaimDate && new Date(this.state.lastClaimDate).toDateString() === today) {
      return { success: false, coinsAwarded: 0, dailyCoins: 0, extraCoins: 0, newStreak: this.state.dailyStreak, isBonus: false, alreadyClaimed: true };
    }

    const nextStreak = (this.state.dailyStreak || 0) + 1;
    const isBonus = nextStreak % 7 === 0;
    const extraCoins = isBonus ? 7 : 0;
    const coinsAwarded = 1 + extraCoins;
    const nowIso = new Date().toISOString();
    const updatedState: CoinWalletState = {
      ...this.state,
      coins: this.state.coins + coinsAwarded,
      dailyStreak: nextStreak,
      lastClaimDate: nowIso,
      claimedToday: true,
      transactions: [{
        id: `tx-streak-${Date.now()}`,
        title: isBonus
          ? `🔥 7-Day Streak Mega Bonus (1 + ${extraCoins} Extra Coins)`
          : '⚡ Daily Coding Streak (+1 Coin)',
        type: 'credit',
        amount: coinsAwarded,
        timestamp: nowIso,
        description: isBonus
          ? `Day ${nextStreak} streak completed! 1 Daily Coin + ${extraCoins} Extra Bonus Coins awarded`
          : `Day ${nextStreak} daily streak reward claimed (Locked for today)`,
      }, ...this.state.transactions],
    };

    this.saveState(updatedState);
    api.post('/users/me/streak/claim').then((res) => {
      if (res.data?.success && typeof res.data.data?.totalCoins === 'number') {
        this.saveState({
          ...this.state,
          coins: res.data.data.totalCoins,
          dailyStreak: res.data.data.newStreak || nextStreak,
          claimedToday: true,
          lastClaimDate: nowIso,
        });
      }
    }).catch((err) => console.warn('Background streak claim sync', err));
    return { success: true, coinsAwarded, dailyCoins: 1, extraCoins, newStreak: nextStreak, isBonus, alreadyClaimed: false };
  }

  public recordSuccessfulProblemSolve(problemTitle: string = 'Practice Problem'): {
    success: boolean;
    coinsAwarded: number;
    newStreak: number;
    isBonus: boolean;
    isDailyStreak: boolean;
    totalCoins: number;
    alreadyClaimed: boolean;
  } {
    this.checkDayReset();
    const today = new Date().toDateString();
    const alreadyClaimed = Boolean(
      this.state.claimedToday &&
      this.state.lastClaimDate &&
      new Date(this.state.lastClaimDate).toDateString() === today
    );

    if (alreadyClaimed) {
      return {
        success: true,
        coinsAwarded: 0,
        newStreak: this.state.dailyStreak,
        isBonus: false,
        isDailyStreak: false,
        totalCoins: this.state.coins,
        alreadyClaimed: true,
      };
    }

    const nextStreak = (this.state.dailyStreak || 0) + 1;
    const coinsAwarded = 1;
    const nowIso = new Date().toISOString();
    const updatedState: CoinWalletState = {
      ...this.state,
      coins: this.state.coins + coinsAwarded,
      dailyStreak: nextStreak,
      lastClaimDate: nowIso,
      claimedToday: true,
      transactions: [
        {
          id: `tx-streak-${Date.now()}`,
          title: '⚡ Daily Coding Streak (+1 Coin)',
          type: 'credit',
          amount: coinsAwarded,
          timestamp: nowIso,
          description: `Solved "${problemTitle}" • Day ${nextStreak} streak claimed (Locked for today)`,
        },
        ...this.state.transactions,
      ],
    };

    this.saveState(updatedState);

    // Sync with backend
    api.post('/users/me/streak/claim')
      .then((res) => {
        if (res.data?.success && typeof res.data.data?.totalCoins === 'number') {
          this.saveState({
            ...this.state,
            coins: res.data.data.totalCoins,
            dailyStreak: res.data.data.newStreak || this.state.dailyStreak,
            claimedToday: true,
            lastClaimDate: nowIso,
          });
        }
      })
      .catch((err) => console.warn('Background streak solve claim sync', err));

    return {
      success: true,
      coinsAwarded,
      newStreak: nextStreak,
      isBonus: false,
      isDailyStreak: true,
      totalCoins: updatedState.coins,
      alreadyClaimed: false,
    };
  }

  public async awardContestWinner(
    contestTitle: string = 'NEC Weekly Contest #42',
    contestNumber: number = 42,
    coinsAmount: number = 100
  ): Promise<{ success: boolean; totalCoins: number; coinsAwarded: number }> {
    const coinsAwarded = Number(coinsAmount) || 100;
    const updatedState: CoinWalletState = {
      ...this.state,
      coins: this.state.coins + coinsAwarded,
      transactions: [
        {
          id: `tx-contest-${Date.now()}`,
          title: `🏆 ${contestTitle} Winner Reward`,
          type: 'credit',
          amount: coinsAwarded,
          timestamp: new Date().toISOString(),
          description: `Passed 100% test cases and solved contest questions: +${coinsAwarded} NEC Coins credited`,
        },
        ...this.state.transactions,
      ],
    };
    this.saveState(updatedState);

    let finalCoins = updatedState.coins;
    try {
      const res = await api.post('/users/me/contest/award', {
        contestNumber,
        coinsAmount: coinsAwarded,
        allPassed: true,
      });
      if (res.data?.success && typeof res.data.data?.totalCoins === 'number') {
        finalCoins = res.data.data.totalCoins;
        this.saveState({ ...this.state, coins: finalCoins });
      }
    } catch (e) {
      console.warn('Contest award backend sync error:', e);
    }

    return { success: true, totalCoins: finalCoins, coinsAwarded };
  }

  public async redeemReward(
    reward: RewardItem,
    shippingDetails?: { fullName: string; phone: string; address: string; city: string; pincode: string }
  ): Promise<{ success: boolean; error?: string; couponCode?: string; order?: SwagOrder }> {
    if (reward.inStock === false) {
      return {
        success: false,
        error: 'This reward item is currently out of stock. Please check back later!',
      };
    }

    if (this.state.coins < reward.coinsCost) {
      return {
        success: false,
        error: `Insufficient coins. Required: ${reward.coinsCost}, Available: ${this.state.coins}`,
      };
    }

    let generatedCode: string | undefined = undefined;
    if (reward.category === 'coupon') {
      generatedCode =
        reward.couponCode ||
        `NEC${reward.discountPercent || 20}OFF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }

    try {
      const res = await api.post('/users/me/rewards/claim', {
        rewardId: reward.id,
        title: reward.title,
        category: reward.category,
        coinsCost: reward.coinsCost,
        couponCode: generatedCode,
        discountPercent: reward.discountPercent,
        courseSlug: reward.courseSlug,
        shippingAddress: shippingDetails,
      });

      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        const newCoins = typeof d.coins === 'number' ? d.coins : Math.max(0, this.state.coins - reward.coinsCost);
        const updatedCoupons = Array.isArray(d.unlockedCoupons) ? d.unlockedCoupons : this.state.unlockedCoupons;
        const updatedCourses = Array.isArray(d.unlockedCourses) ? d.unlockedCourses : this.state.unlockedCourses;
        const updatedOrders = Array.isArray(d.swagOrders) ? d.swagOrders : this.state.swagOrders;

        const updatedState: CoinWalletState = {
          ...this.state,
          coins: newCoins,
          transactions: [
            {
              id: `tx-redeem-${Date.now()}`,
              title: `Redeemed: ${reward.title}`,
              type: 'debit',
              amount: reward.coinsCost,
              timestamp: new Date().toISOString(),
              description: `Redemption of ${reward.category}`,
            },
            ...this.state.transactions,
          ],
          unlockedCoupons: updatedCoupons,
          unlockedCourses: updatedCourses,
          swagOrders: updatedOrders,
        };

        this.saveState(updatedState);
        return { success: true, couponCode: d.couponCode || generatedCode, order: d.order };
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to claim reward from server.';
      return { success: false, error: errMsg };
    }

    // Fallback if offline
    const newCoins = Math.max(0, this.state.coins - reward.coinsCost);
    let updatedCoupons = [...this.state.unlockedCoupons];
    let updatedCourses = [...this.state.unlockedCourses];
    let updatedOrders = [...this.state.swagOrders];
    let createdOrder: SwagOrder | undefined = undefined;

    if (reward.category === 'coupon' && generatedCode) {
      updatedCoupons.push({
        code: generatedCode,
        discount: reward.discountPercent || 20,
        title: reward.title,
        unlockedAt: new Date().toISOString(),
      });
    } else if (reward.category === 'course' && reward.courseSlug) {
      if (!updatedCourses.includes(reward.courseSlug)) updatedCourses.push(reward.courseSlug);
    } else if (reward.category === 'swag' && shippingDetails) {
      createdOrder = {
        id: `SWAG-${Date.now().toString().slice(-6)}`,
        rewardId: reward.id,
        rewardTitle: reward.title,
        coinsCost: reward.coinsCost,
        fullName: shippingDetails.fullName,
        phone: shippingDetails.phone,
        address: shippingDetails.address,
        city: shippingDetails.city,
        pincode: shippingDetails.pincode,
        status: 'Processing',
        orderedAt: new Date().toISOString(),
        trackingNumber: `NEC-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      };
      updatedOrders.unshift(createdOrder);
    }

    const updatedState: CoinWalletState = {
      ...this.state,
      coins: newCoins,
      transactions: [
        {
          id: `tx-redeem-${Date.now()}`,
          title: `Redeemed: ${reward.title}`,
          type: 'debit',
          amount: reward.coinsCost,
          timestamp: new Date().toISOString(),
          description: `Redemption of ${reward.category}`,
        },
        ...this.state.transactions,
      ],
      unlockedCoupons: updatedCoupons,
      unlockedCourses: updatedCourses,
      swagOrders: updatedOrders,
    };
    this.saveState(updatedState);
    return { success: true, couponCode: generatedCode, order: createdOrder };
  }

  public awardCoins(amount: number, reason: string): { success: boolean; totalCoins: number } {
    const coinsAwarded = Math.max(0, Number(amount) || 0);
    if (coinsAwarded === 0) return { success: true, totalCoins: this.state.coins };

    const updatedState: CoinWalletState = {
      ...this.state,
      coins: this.state.coins + coinsAwarded,
      transactions: [
        {
          id: `tx-reward-${Date.now()}`,
          title: `🎁 ${reason}`,
          type: 'credit',
          amount: coinsAwarded,
          timestamp: new Date().toISOString(),
          description: reason,
        },
        ...this.state.transactions,
      ],
    };
    this.saveState(updatedState);
    return { success: true, totalCoins: updatedState.coins };
  }
}

export const coinService = new CoinService();
