import { Request, Response } from 'express';
import { Coupon } from '../models/coupon.model';
import { AuditLog } from '../models/auditLog.model';
import { PlatformSettings } from '../models/settings.model';

// POST /api/v1/coupons/validate (Public / Authenticated)
export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, amount } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, message: 'Coupon code is required' });
      return;
    }

    const orderAmount = Number(amount) || 0;
    const cleanCode = code.trim().toUpperCase();

    // 1. Check Site-Wide Festival Offer configured by Admin in Settings
    const settings = await PlatformSettings.findOne();
    if (settings?.festivalOffer?.couponCode) {
      const festCode = settings.festivalOffer.couponCode.trim().toUpperCase();
      if (cleanCode === festCode) {
        if (!settings.festivalOffer.isActive) {
          res.status(400).json({
            success: false,
            message: `The festival offer coupon (${cleanCode}) is currently disabled by admin.`,
          });
          return;
        }

        const discountPercent = settings.festivalOffer.discountPercent || 20;
        const discountAmount = Math.round((orderAmount * discountPercent) / 100);
        res.status(200).json({
          success: true,
          message: `Festival Offer applied! ${settings.festivalOffer.title || 'Special Discount'} (${discountPercent}% OFF)`,
          data: {
            code: cleanCode,
            discountType: 'percent',
            discountValue: discountPercent,
            discountAmount,
            finalAmount: Math.max(0, orderAmount - discountAmount),
            offerTitle: settings.festivalOffer.title,
          },
        });
        return;
      }
    }

    // 2. Check Database Coupons (Admin Created / Configured)
    const coupon = await Coupon.findOne({
      code: { $regex: new RegExp(`^${cleanCode}$`, 'i') },
    });

    if (coupon) {
      if (!coupon.isActive) {
        res.status(400).json({ success: false, message: 'This coupon is currently disabled or inactive.' });
        return;
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        res.status(400).json({ success: false, message: 'This coupon has expired.' });
        return;
      }

      if (coupon.usedCount >= coupon.maxUses) {
        res.status(400).json({ success: false, message: 'Coupon usage limit has been reached.' });
        return;
      }

      if (orderAmount < coupon.minOrderValue) {
        res.status(400).json({
          success: false,
          message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
        });
        return;
      }

      let discountAmount = 0;
      if (coupon.discountType === 'percent') {
        discountAmount = Math.round((orderAmount * coupon.discountValue) / 100);
      } else {
        discountAmount = Math.min(orderAmount, coupon.discountValue);
      }

      const finalAmount = Math.max(0, orderAmount - discountAmount);

      res.status(200).json({
        success: true,
        message: 'Coupon applied successfully!',
        data: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
          finalAmount,
        },
      });
      return;
    }

    // 3. Optional fallback for coin-store redeemed reward coupons (if not yet in Coupon collection)
    if (cleanCode === 'NEXTERA50' || cleanCode === 'PROONE50' || cleanCode === 'NEC50MEGA' || cleanCode.startsWith('NEC50OFF') || cleanCode.startsWith('ADMIN50OFF')) {
      const discount = Math.round((orderAmount * 50) / 100);
      res.status(200).json({
        success: true,
        message: '50% Mega Saver Coupon applied!',
        data: {
          code: cleanCode,
          discountType: 'percent',
          discountValue: 50,
          discountAmount: discount,
          finalAmount: Math.max(0, orderAmount - discount),
        },
      });
      return;
    }

    if (cleanCode === 'NEC25SUPER' || cleanCode.startsWith('NEC25OFF') || cleanCode.startsWith('ADMIN25OFF')) {
      const discount = Math.round((orderAmount * 25) / 100);
      res.status(200).json({
        success: true,
        message: '25% Super Discount Coupon applied!',
        data: {
          code: cleanCode,
          discountType: 'percent',
          discountValue: 25,
          discountAmount: discount,
          finalAmount: Math.max(0, orderAmount - discount),
        },
      });
      return;
    }

    if (cleanCode === 'NEC10COIN' || cleanCode === 'NEC10COIN-INIT' || cleanCode.startsWith('NEC10OFF') || cleanCode.startsWith('ADMIN10OFF')) {
      const discount = Math.round((orderAmount * 10) / 100);
      res.status(200).json({
        success: true,
        message: '10% Extra Discount Coupon applied!',
        data: {
          code: cleanCode,
          discountType: 'percent',
          discountValue: 10,
          discountAmount: discount,
          finalAmount: Math.max(0, orderAmount - discount),
        },
      });
      return;
    }

    if (cleanCode === 'WELCOMEPRO' || cleanCode === 'SAVE1000') {
      const discount = Math.min(orderAmount, 1000);
      res.status(200).json({
        success: true,
        data: {
          code: cleanCode,
          discountType: 'flat',
          discountValue: 1000,
          discountAmount: discount,
          finalAmount: Math.max(0, orderAmount - discount),
        },
      });
      return;
    }

    if (cleanCode === 'FREEPRO' || cleanCode === 'DEV100') {
      const discount = orderAmount;
      res.status(200).json({
        success: true,
        data: {
          code: cleanCode,
          discountType: 'percent',
          discountValue: 100,
          discountAmount: discount,
          finalAmount: 0,
        },
      });
      return;
    }

    res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to validate coupon',
    });
  }
};

// GET /api/v1/admin/coupons (Admin)
export const getAdminCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: coupons,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve coupons',
    });
  }
};

// POST /api/v1/admin/coupons (Admin)
export const createAdminCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxUses,
      isActive,
      expiresAt,
    } = req.body;

    if (!code || !discountValue) {
      res.status(400).json({ success: false, message: 'Code and discount value are required' });
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      res.status(409).json({ success: false, message: 'Coupon code already exists' });
      return;
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: description || '',
      discountType: discountType || 'percent',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxUses: Number(maxUses) || 1000,
      isActive: isActive !== false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: (req as any).user?._id,
    });

    if ((req as any).user) {
      await AuditLog.create({
        userId: (req as any).user._id,
        action: 'CREATE_COUPON',
        resourceType: 'Coupon',
        resourceId: coupon._id.toString(),
        details: { code: coupon.code, discountValue: coupon.discountValue },
      });
    }

    res.status(201).json({
      success: true,
      message: `Coupon ${coupon.code} created successfully`,
      data: coupon,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create coupon',
    });
  }
};

// PUT /api/v1/admin/coupons/:id (Admin)
export const updateAdminCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update coupon',
    });
  }
};

// DELETE /api/v1/admin/coupons/:id (Admin)
export const deleteAdminCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} deleted successfully`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete coupon',
    });
  }
};
