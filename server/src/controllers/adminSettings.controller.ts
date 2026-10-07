import { Request, Response, NextFunction } from 'express';
import { PlatformSettings, DEFAULT_CERTIFICATE_TEMPLATE } from '../models/settings.model';
import { auditLogService } from '../services/auditLog.service';
import { ApiResponse } from '../utils/apiResponse';

// @desc    Get platform settings
// @route   GET /api/admin/settings
// @access  Protected (Admin)
export const getAdminSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    ApiResponse.success(res, 'Platform settings retrieved', { settings }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Protected (Admin)
export const updateAdminSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admin = req.user!;
    let settings = await PlatformSettings.findOne();

    if (!settings) {
      settings = await PlatformSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'SETTINGS',
      resourceTitle: 'Platform Settings',
      metadata: req.body,
    });

    ApiResponse.success(res, 'Platform settings updated successfully', { settings }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get public platform metadata (brand, social links, locations, offers)
// @route   GET /api/settings
// @access  Public
export const getPublicSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    // Filter out sensitive data (SMTP credentials, internal banking details if any)
    const publicData = {
      platformName: settings.platformName || 'NextEra Coders Learning',
      tagline: settings.tagline || 'Learn. Code. Build. Grow.',
      contactEmail: settings.contactEmail || 'support@nexteracoders.com',
      contactPhone: settings.contactPhone || '+91 98765 43210',
      logoUrl: settings.logoUrl || '',
      socialLinks: settings.socialLinks || {},
      locations:
        settings.locations && settings.locations.length > 0
          ? settings.locations.filter((l) => l.isActive !== false)
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
      festivalOffer: settings.festivalOffer,
      maintenanceMode: settings.maintenanceMode || false,
      certificateTemplate: settings.certificateTemplate || DEFAULT_CERTIFICATE_TEMPLATE,
    };

    ApiResponse.success(res, 'Public platform settings retrieved', { settings: publicData }, 200);
  } catch (error) {
    next(error);
  }
};
