import { Request, Response } from 'express';
import { PlatformSettings } from '../models/settings.model';
import { AuditLog } from '../models/auditLog.model';
import { Coupon } from '../models/coupon.model';

const DEFAULT_PRO_ONE_PLANS = [
  {
    id: 'monthly',
    name: 'Basic Plan',
    subtitle: 'Monthly paid plan.',
    originalPrice: 999,
    price: 399,
    perMonthPrice: 399,
    durationLabel: '1 month access',
    billingText: '1 month access',
    subPriceText: '1 month access',
    savePercent: 60,
    features: [
      'All Course Access (DSA + more)',
      'Core CS Subjects',
      'Mock Tests',
      'Coding Contest',
      'AI Support with 25K/day Tokens (25K/day)',
      'Quick Compiler (50/day)',
      'Run/Submit (50/day)',
      '</> DSA Sheet',
      '>_ 400+ Coding Problem',
      'Live Group Sessions',
      'Interview Experience',
      'Article & Tutorials',
    ],
  },
  {
    id: 'yearly',
    name: 'Plus Plan',
    subtitle: '1 year paid plan.',
    originalPrice: 9999,
    price: 2999,
    perMonthPrice: 250,
    durationLabel: '/month',
    billingText: '₹2,999 for 1 year',
    subPriceText: '₹2,999 for 1 year',
    savePercent: 70,
    features: [
      'All Course Access (DSA + more)',
      'Core CS Subjects',
      'Mock Tests',
      'Coding Contest',
      'AI Support with 50K/day Tokens (50K/day)',
      'Quick Compiler (100/day)',
      'Run/Submit (100/day)',
      '</> DSA Sheet',
      '>_ 400+ Coding Problem',
      'Live Group Sessions',
      'Interview Experience',
      'Article & Tutorials',
    ],
  },
  {
    id: 'lifetime',
    name: 'Pro Plan',
    subtitle: '3 year paid plan.',
    badge: 'Popular',
    originalPrice: 14999,
    price: 5999,
    perMonthPrice: 167,
    durationLabel: '/month',
    billingText: '₹5,999 for 3 years',
    subPriceText: '₹5,999 for 3 years',
    savePercent: 75,
    features: [
      'All Course Access (DSA + more)',
      'Core CS Subjects',
      'Mock Tests',
      'Coding Contest',
      'AI Support with 75K/day Tokens (75K/day)',
      'Quick Compiler (300/day)',
      'Run/Submit (300/day)',
      '</> DSA Sheet',
      '>_ 400+ Coding Problem',
      'Live Group Sessions',
      'Interview Experience',
      'Article & Tutorials',
    ],
  },
];

const getOrCreateSettings = async () => {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({
      platformName: 'NextEra Coders Learning',
      tagline: 'Learn. Code. Build. Grow.',
      paymentConfig: {
        upiId: 'sandipkrvirat@okaxis',
        upiReceiverName: 'Sandip Kumar (NextEra Coders)',
        qrImageUrl: '/images/upi-qr.jpg',
        bankName: 'HDFC Bank / Axis Bank',
        accountNumber: '50200089123456',
        ifscCode: 'HDFC0001234',
        accountHolder: 'Sandip Kumar (NextEra Coders)',
        enabledMethods: {
          upiQr: true,
          upiApps: true,
          cards: true,
          netbanking: true,
          emi: true,
        },
      },
      festivalOffer: {
        isActive: false,
        title: 'Festive Developer Celebration Offer',
        description: 'Get an extra flat 20% off on all Pro Courses & Pro One Yearly Pass!',
        discountPercent: 20,
        bannerText: 'Special Festival Offer: Extra 20% OFF with code FESTIVAL20',
        couponCode: 'FESTIVAL20',
      },
      proOnePricing: {
        monthlyPrice: 399,
        yearlyPrice: 2999,
        lifetimePrice: 5999,
        originalMonthlyPrice: 999,
        originalYearlyPrice: 9999,
        originalLifetimePrice: 14999,
      },
      proOnePlans: DEFAULT_PRO_ONE_PLANS,
    });
  } else {
    // If settings exists from before, ensure UPI ID and QR code image are updated to active official QR
    let isModified = false;
    if (!settings.paymentConfig?.qrImageUrl || settings.paymentConfig.qrImageUrl === '') {
      if (!settings.paymentConfig) {
        settings.paymentConfig = {} as any;
      }
      settings.paymentConfig.qrImageUrl = '/images/upi-qr.jpg';
      isModified = true;
    }
    if (!settings.paymentConfig.upiId || settings.paymentConfig.upiId === 'nexteracoders@okaxis') {
      settings.paymentConfig.upiId = 'sandipkrvirat@okaxis';
      settings.paymentConfig.upiReceiverName = 'Sandip Kumar (NextEra Coders)';
      isModified = true;
    }
    if (
      !settings.proOnePlans ||
      settings.proOnePlans.length === 0 ||
      settings.proOnePricing?.monthlyPrice !== 399 ||
      settings.proOnePricing?.yearlyPrice !== 2999 ||
      settings.proOnePricing?.lifetimePrice !== 5999
    ) {
      settings.proOnePricing = {
        monthlyPrice: 399,
        yearlyPrice: 2999,
        lifetimePrice: 5999,
        originalMonthlyPrice: 999,
        originalYearlyPrice: 9999,
        originalLifetimePrice: 14999,
      };
      settings.proOnePlans = DEFAULT_PRO_ONE_PLANS as any;
      settings.markModified('proOnePricing');
      settings.markModified('proOnePlans');
      isModified = true;
    }
    if (isModified) {
      settings.markModified('paymentConfig');
      await settings.save();
    }
  }
  return settings;
};

// GET /api/v1/payments/config (Public)
export const getPublicPaymentConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();

    // Fetch active coupons configured by admin
    const activeCoupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    })
      .select('code description discountType discountValue minOrderValue')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        paymentConfig: settings.paymentConfig,
        festivalOffer: settings.festivalOffer,
        proOnePricing: settings.proOnePricing,
        proOnePlans: settings.proOnePlans || DEFAULT_PRO_ONE_PLANS,
        activeCoupons: activeCoupons || [],
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve payment configuration',
    });
  }
};

// GET /api/v1/admin/payments/settings (Admin)
export const getAdminPaymentSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,
      data: {
        paymentConfig: settings.paymentConfig,
        festivalOffer: settings.festivalOffer,
        proOnePricing: settings.proOnePricing,
        proOnePlans: settings.proOnePlans || DEFAULT_PRO_ONE_PLANS,
        smtpSettings: settings.smtpSettings,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve admin payment settings',
    });
  }
};

// PUT /api/v1/admin/payments/settings (Admin)
export const updateAdminPaymentSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentConfig, festivalOffer, proOnePricing, proOnePlans, smtpSettings } = req.body;
    const settings = await getOrCreateSettings();

    if (paymentConfig) {
      settings.paymentConfig = {
        ...settings.paymentConfig,
        ...paymentConfig,
        enabledMethods: {
          ...settings.paymentConfig.enabledMethods,
          ...(paymentConfig.enabledMethods || {}),
        },
      };
    }

    if (festivalOffer) {
      const prevCode = settings.festivalOffer?.couponCode?.trim()?.toUpperCase();
      settings.festivalOffer = {
        ...settings.festivalOffer,
        ...festivalOffer,
      };

      if (festivalOffer.couponCode) {
        const cleanFestCode = festivalOffer.couponCode.trim().toUpperCase();
        try {
          if (prevCode && prevCode !== cleanFestCode) {
            await Coupon.updateMany({ code: prevCode }, { isActive: false });
          }
          await Coupon.findOneAndUpdate(
            { code: cleanFestCode },
            {
              code: cleanFestCode,
              description: festivalOffer.title || 'Site-Wide Festival Discount Offer',
              discountType: 'percent',
              discountValue: festivalOffer.discountPercent || 20,
              minOrderValue: 0,
              maxUses: 999999,
              isActive: festivalOffer.isActive === true,
            },
            { upsert: true, new: true }
          );
        } catch {
          // ignore error
        }
      }
    }

    if (proOnePricing) {
      settings.proOnePricing = {
        ...settings.proOnePricing,
        ...proOnePricing,
      };
    }

    if (proOnePlans && Array.isArray(proOnePlans)) {
      settings.proOnePlans = proOnePlans;
      settings.markModified('proOnePlans');

      const monthly = proOnePlans.find((p) => p.id === 'monthly');
      const yearly = proOnePlans.find((p) => p.id === 'yearly');
      const lifetime = proOnePlans.find((p) => p.id === 'lifetime');
      if (monthly && yearly && lifetime) {
        settings.proOnePricing = {
          monthlyPrice: monthly.price,
          yearlyPrice: yearly.price,
          lifetimePrice: lifetime.price,
          originalMonthlyPrice: monthly.originalPrice || 999,
          originalYearlyPrice: yearly.originalPrice || 9999,
          originalLifetimePrice: lifetime.originalPrice || 14999,
        };
        settings.markModified('proOnePricing');
      }
    }

    if (smtpSettings) {
      settings.smtpSettings = {
        ...(settings.smtpSettings || {}),
        ...smtpSettings,
      };
    }

    await settings.save();

    // Log admin audit
    if ((req as any).user) {
      await AuditLog.create({
        userId: (req as any).user._id,
        action: 'UPDATE_PAYMENT_SETTINGS',
        resourceType: 'PaymentSettings',
        resourceId: settings._id.toString(),
        details: {
          paymentConfigUpdated: !!paymentConfig,
          festivalOfferUpdated: !!festivalOffer,
          proOnePricingUpdated: !!proOnePricing,
          proOnePlansUpdated: !!proOnePlans,
          smtpSettingsUpdated: !!smtpSettings,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment configuration, Pro One plans, and offers updated successfully',
      data: {
        paymentConfig: settings.paymentConfig,
        festivalOffer: settings.festivalOffer,
        proOnePricing: settings.proOnePricing,
        proOnePlans: settings.proOnePlans || DEFAULT_PRO_ONE_PLANS,
        smtpSettings: settings.smtpSettings,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update payment settings',
    });
  }
};
