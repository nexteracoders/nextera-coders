import { api } from './api';
import { PlatformLocation } from '../types/admin.types';

export interface PublicSettings {
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
  locations: PlatformLocation[];
  festivalOffer?: {
    isActive: boolean;
    title: string;
    description: string;
    discountPercent: number;
    bannerText: string;
    couponCode: string;
  };
  maintenanceMode: boolean;
}

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
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
};

let cachedSettings: PublicSettings | null = null;
let fetchPromise: Promise<PublicSettings> | null = null;

export const settingsService = {
  async getPublicSettings(): Promise<PublicSettings> {
    if (cachedSettings) return cachedSettings;
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
      try {
        const response = await api.get('/settings');
        if (response.data?.data?.settings) {
          cachedSettings = {
            ...DEFAULT_PUBLIC_SETTINGS,
            ...response.data.data.settings,
            socialLinks: {
              ...DEFAULT_PUBLIC_SETTINGS.socialLinks,
              ...(response.data.data.settings.socialLinks || {}),
            },
            locations:
              response.data.data.settings.locations &&
              response.data.data.settings.locations.length > 0
                ? response.data.data.settings.locations
                : DEFAULT_PUBLIC_SETTINGS.locations,
          };
          return cachedSettings!;
        }
      } catch (error) {
        console.warn('Unable to load server settings, using platform defaults:', error);
      }
      return DEFAULT_PUBLIC_SETTINGS;
    })();

    return fetchPromise;
  },

  clearCache() {
    cachedSettings = null;
    fetchPromise = null;
  },
};
