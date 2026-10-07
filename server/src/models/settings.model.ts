import { Schema, model, Document, Types } from 'mongoose';

export interface IPlatformLocation {
  id?: string;
  title: string;
  badge?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  phone?: string;
  email?: string;
  mapUrl?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface IPlatformSettings {
  platformName: string;
  tagline: string;
  contactEmail: string;
  contactPhone?: string;
  logoUrl?: string;
  socialLinks: {
    github?: string;
    twitter?: string;
    x?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  locations: IPlatformLocation[];
  maintenanceMode: boolean;
  defaultPagination: number;

  // Payment & QR configurations
  paymentConfig: {
    upiId: string;
    upiReceiverName: string;
    qrImageUrl: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolder: string;
    enabledMethods: {
      upiQr: boolean;
      upiApps: boolean;
      cards: boolean;
      netbanking: boolean;
      emi: boolean;
    };
  };

  // Festival & Global Discounts
  festivalOffer: {
    isActive: boolean;
    title: string;
    description: string;
    discountPercent: number;
    bannerText: string;
    couponCode: string;
    expiresAt?: Date;
  };

  // Global Pro One Pricing
  proOnePricing: {
    monthlyPrice: number;
    yearlyPrice: number;
    lifetimePrice: number;
    originalMonthlyPrice: number;
    originalYearlyPrice: number;
    originalLifetimePrice: number;
  };
  proOnePlans?: Array<{
    id: 'monthly' | 'yearly' | 'lifetime';
    name: string;
    subtitle: string;
    badge?: string;
    originalPrice: number;
    price: number;
    perMonthPrice: number;
    durationLabel: string;
    billingText: string;
    subPriceText?: string;
    savePercent: number;
    features: string[];
  }>;

  // Gmail / SMTP Email Delivery Settings
  smtpSettings?: {
    service: string;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
  };

  // 1vs1 Live Coding Battles (Code Duels) Configuration
  duelSettings?: {
    coinsReward: number;
    durationSeconds: number;
    isEnabled: boolean;
    maxParticipantsPerRoom: number;
  };

  // NEC Prime Battles (Staked Coins & 10% Cut) Configuration
  primeDuelSettings?: {
    minStake: number;
    maxStake: number;
    platformFeePercent: number;
    durationSeconds: number;
    isEnabled: boolean;
    maxParticipantsPerRoom: number;
    twoPlayerPercentages: {
      first: number;
    };
    squadPercentages: {
      first: number;
      second: number;
    };
    grandRoyalePercentages: {
      first: number;
      second: number;
      third: number;
    };
  };

  // Customizable Certificate Template & Credential Format Settings
  certificateTemplate?: ICertificateTemplateSettings;

  updatedAt: Date;
}

export interface ICertificateTemplateSettings {
  headerLogoUrl: string;
  watermarkLogoUrl: string;
  watermarkOpacity: number;
  title: string;
  subtitle: string;
  organizationName: string;
  organizationSubtext: string;
  freeTrackBadge: string;
  freeTrackDescription: string;
  freeHonorsStatement: string;
  proTrackBadge: string;
  proTrackDescription: string;
  proHonorsStatement: string;
  signatoryName: string;
  signatoryTitle: string;
  signatorySignatureText: string;
  signatureImageUrl?: string;
  sealTopText: string;
  sealBottomText: string;
  sealSubtext: string;
}

export const DEFAULT_CERTIFICATE_TEMPLATE: ICertificateTemplateSettings = {
  headerLogoUrl: '/images/nec-favicon.png',
  watermarkLogoUrl: '/images/nec-favicon.png',
  watermarkOpacity: 0.12,
  title: 'Certificate of Achievement',
  subtitle: 'This is proudly presented to',
  organizationName: 'NextEra Coders Academy',
  organizationSubtext: 'Official Credential & Verification Registry',
  freeTrackBadge: 'NextEra Open Academy • Verified Completion',
  freeTrackDescription: 'for having successfully demonstrated coding competency and successfully completing the free',
  freeHonorsStatement: 'Conferred under the NextEra Open Engineering Initiative upon demonstrating rigorous coding competency and foundational mastery.',
  proTrackBadge: 'NextEra Pro Specialization • Verified Honors Track',
  proTrackDescription: 'for successfully mastering all curriculum modules, architecture benchmarks, and hands-on engineering projects in',
  proHonorsStatement: 'Conferred under the NextEra Advanced Engineering Fellowship with verified production architecture, live code review, and honors standing.',
  signatoryName: 'Sandip Kumar Verma',
  signatoryTitle: 'Founder & Chief Mentor',
  signatorySignatureText: 'Sandip Kr Verma',
  signatureImageUrl: '',
  sealTopText: 'NEC',
  sealBottomText: '2026',
  sealSubtext: 'Verified Credential',
};


export interface IPlatformSettingsDocument extends IPlatformSettings, Document {
  _id: Types.ObjectId;
}

const LocationSchema = new Schema<IPlatformLocation>(
  {
    id: { type: String },
    title: { type: String, required: true, trim: true },
    badge: { type: String, default: 'Office', trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    mapUrl: { type: String, default: '', trim: true },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const PlatformSettingsSchema = new Schema<IPlatformSettingsDocument>(
  {
    platformName: {
      type: String,
      default: 'NextEra Coders Learning',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Learn. Code. Build. Grow.',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: 'support@nexteracoders.com',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '+91 98765 43210',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    socialLinks: {
      github: { type: String, default: 'https://github.com/nexteracoders' },
      twitter: { type: String, default: 'https://x.com/nexteracoders' },
      x: { type: String, default: 'https://x.com/nexteracoders' },
      linkedin: { type: String, default: 'https://linkedin.com/company/nexteracoders' },
      instagram: { type: String, default: 'https://instagram.com/nexteracoders' },
      youtube: { type: String, default: 'https://youtube.com/@nexteracoders' },
    },
    locations: {
      type: [LocationSchema],
      default: [
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
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    defaultPagination: {
      type: Number,
      default: 12,
    },
    paymentConfig: {
      upiId: { type: String, default: 'sandipkrvirat@okaxis', trim: true },
      upiReceiverName: { type: String, default: 'Sandip Kumar (NextEra Coders)', trim: true },
      qrImageUrl: { type: String, default: '/images/upi-qr.jpg', trim: true },
      bankName: { type: String, default: 'HDFC Bank / Axis Bank', trim: true },
      accountNumber: { type: String, default: '50200089123456', trim: true },
      ifscCode: { type: String, default: 'HDFC0001234', trim: true },
      accountHolder: { type: String, default: 'Sandip Kumar (NextEra Coders)', trim: true },
      enabledMethods: {
        upiQr: { type: Boolean, default: true },
        upiApps: { type: Boolean, default: true },
        cards: { type: Boolean, default: true },
        netbanking: { type: Boolean, default: true },
        emi: { type: Boolean, default: true },
      },
    },
    festivalOffer: {
      isActive: { type: Boolean, default: false },
      title: { type: String, default: 'Festive Developer Celebration Offer', trim: true },
      description: { type: String, default: 'Get an extra flat 20% off on all Pro Courses & Pro One Yearly Pass!', trim: true },
      discountPercent: { type: Number, default: 20 },
      bannerText: { type: String, default: '🎉 Special Festival Offer: Extra 20% OFF with code FESTIVAL20', trim: true },
      couponCode: { type: String, default: 'FESTIVAL20', trim: true },
      expiresAt: { type: Date },
    },
    proOnePricing: {
      monthlyPrice: { type: Number, default: 399 },
      yearlyPrice: { type: Number, default: 2999 },
      lifetimePrice: { type: Number, default: 5999 },
      originalMonthlyPrice: { type: Number, default: 999 },
      originalYearlyPrice: { type: Number, default: 9999 },
      originalLifetimePrice: { type: Number, default: 14999 },
    },
    proOnePlans: [
      {
        id: { type: String, enum: ['monthly', 'yearly', 'lifetime'], required: true },
        name: { type: String, required: true },
        subtitle: { type: String, default: '' },
        badge: { type: String, default: '' },
        originalPrice: { type: Number, default: 0 },
        price: { type: Number, required: true },
        perMonthPrice: { type: Number, default: 0 },
        durationLabel: { type: String, default: '' },
        billingText: { type: String, default: '' },
        subPriceText: { type: String, default: '' },
        savePercent: { type: Number, default: 0 },
        features: [{ type: String }],
      },
    ],
    smtpSettings: {
      service: { type: String, default: 'gmail' },
      host: { type: String, default: 'smtp.gmail.com' },
      port: { type: Number, default: 465 },
      secure: { type: Boolean, default: true },
      user: { type: String, default: '', trim: true },
      pass: { type: String, default: '', trim: true },
      fromName: { type: String, default: 'NextEra Coders', trim: true },
      fromEmail: { type: String, default: 'noreply@nexteracoders.com', trim: true },
    },
    duelSettings: {
      coinsReward: { type: Number, default: 50 },
      durationSeconds: { type: Number, default: 900 },
      isEnabled: { type: Boolean, default: true },
      maxParticipantsPerRoom: { type: Number, default: 4, min: 2, max: 10 },
    },
    primeDuelSettings: {
      minStake: { type: Number, default: 50, min: 1 },
      maxStake: { type: Number, default: 5000 },
      platformFeePercent: { type: Number, default: 10, min: 0, max: 50 },
      durationSeconds: { type: Number, default: 900 },
      isEnabled: { type: Boolean, default: true },
      maxParticipantsPerRoom: { type: Number, default: 10, min: 2, max: 10 },
      twoPlayerPercentages: {
        first: { type: Number, default: 100 },
      },
      squadPercentages: {
        first: { type: Number, default: 65 },
        second: { type: Number, default: 35 },
      },
      grandRoyalePercentages: {
        first: { type: Number, default: 50 },
        second: { type: Number, default: 30 },
        third: { type: Number, default: 20 },
      },
    },
    certificateTemplate: {
      headerLogoUrl: { type: String, default: '/images/nec-favicon.png', trim: true },
      watermarkLogoUrl: { type: String, default: '/images/nec-favicon.png', trim: true },
      watermarkOpacity: { type: Number, default: 0.12, min: 0.01, max: 0.5 },
      title: { type: String, default: 'Certificate of Achievement', trim: true },
      subtitle: { type: String, default: 'This is proudly presented to', trim: true },
      organizationName: { type: String, default: 'NextEra Coders Academy', trim: true },
      organizationSubtext: { type: String, default: 'Official Credential & Verification Registry', trim: true },
      freeTrackBadge: { type: String, default: 'NextEra Open Academy • Verified Completion', trim: true },
      freeTrackDescription: {
        type: String,
        default: 'for having successfully demonstrated coding competency and successfully completing the free',
        trim: true,
      },
      freeHonorsStatement: {
        type: String,
        default: 'Conferred under the NextEra Open Engineering Initiative upon demonstrating rigorous coding competency and foundational mastery.',
        trim: true,
      },
      proTrackBadge: { type: String, default: 'NextEra Pro Specialization • Verified Honors Track', trim: true },
      proTrackDescription: {
        type: String,
        default: 'for successfully mastering all curriculum modules, architecture benchmarks, and hands-on engineering projects in',
        trim: true,
      },
      proHonorsStatement: {
        type: String,
        default: 'Conferred under the NextEra Advanced Engineering Fellowship with verified production architecture, live code review, and honors standing.',
        trim: true,
      },
      signatoryName: { type: String, default: 'Sandip Kumar Verma', trim: true },
      signatoryTitle: { type: String, default: 'Founder & Chief Mentor', trim: true },
      signatorySignatureText: { type: String, default: 'Sandip Kr Verma', trim: true },
      signatureImageUrl: { type: String, default: '', trim: true },
      sealTopText: { type: String, default: 'NEC', trim: true },
      sealBottomText: { type: String, default: '2026', trim: true },
      sealSubtext: { type: String, default: 'Verified Credential', trim: true },
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings = model<IPlatformSettingsDocument>(
  'PlatformSettings',
  PlatformSettingsSchema
);
