import { Request, Response, NextFunction } from 'express';
import { certificateService } from '../services/certificate.service';
import { ApiResponse } from '../utils/apiResponse';
import { PlatformSettings, DEFAULT_CERTIFICATE_TEMPLATE } from '../models/settings.model';
import { auditLogService } from '../services/auditLog.service';

// @desc    Get all certificates earned by active student
// @route   GET /api/certificates
// @access  Protected (Student)
export const getMyCertificates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const certificates = await certificateService.getUserCertificates(user._id);

    ApiResponse.success(
      res,
      'Certificates retrieved successfully',
      { certificates },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single certificate by ID or CertificateId
// @route   GET /api/certificates/:id
// @access  Protected (Student / Admin)
export const getCertificateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    const certificate = await certificateService.getCertificateById(
      id,
      user?._id,
      user?.role === 'admin'
    );

    ApiResponse.success(
      res,
      'Certificate details retrieved successfully',
      { certificate },
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Generate certificate for completed course
// @route   POST /api/certificates/generate/:courseId
// @access  Protected (Student)
export const generateCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const user = req.user!;

    const result = await certificateService.generateCertificate(user._id, courseId);

    ApiResponse.success(
      res,
      result.newlyCreated
        ? 'Congratulations! Your certificate has been generated!'
        : 'Certificate retrieved',
      {
        certificate: {
          id: result.certificate._id.toString(),
          certificateId: result.certificate.certificateId,
          studentName: result.certificate.studentName,
          courseName: result.certificate.courseName,
          issueDate: result.certificate.issueDate,
          verificationUrl: result.certificate.verificationUrl,
          certificateUrl: result.certificate.certificateUrl,
          createdAt: result.certificate.createdAt,
        },
        newlyCreated: result.newlyCreated,
      },
      result.newlyCreated ? 201 : 200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Public certificate verification (No auth required)
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
export const verifyCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { certificateId } = req.params;

    const result = await certificateService.verifyCertificate(certificateId);

    ApiResponse.success(
      res,
      result.verified ? 'Certificate verified successfully' : 'Certificate not found',
      result,
      200
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: List all certificates
// @route   GET /api/admin/certificates
// @access  Protected (Admin)
export const getAdminCertificates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string;
    const courseId = req.query.courseId as string;

    const result = await certificateService.getAdminCertificates({
      page,
      limit,
      search,
      courseId,
    });

    ApiResponse.success(res, 'Admin certificates retrieved', result, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get active certificate template format settings
// @route   GET /api/certificates/template
// @access  Public
export const getCertificateTemplate = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await PlatformSettings.findOne().lean();
    const template = {
      ...DEFAULT_CERTIFICATE_TEMPLATE,
      ...(settings?.certificateTemplate || {}),
    };
    ApiResponse.success(res, 'Certificate template retrieved successfully', { template }, 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update certificate template format settings
// @route   PUT /api/admin/certificates/template
// @access  Protected (Admin)
export const updateCertificateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const admin = req.user!;
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    settings.certificateTemplate = {
      ...DEFAULT_CERTIFICATE_TEMPLATE,
      ...(settings.certificateTemplate || {}),
      ...req.body,
    };

    await settings.save();

    await auditLogService.recordLog({
      adminId: admin._id,
      action: 'UPDATE',
      resourceType: 'SETTINGS',
      resourceTitle: 'Certificate Template Format',
      metadata: req.body,
    });

    ApiResponse.success(
      res,
      'Certificate format and template updated successfully',
      { template: settings.certificateTemplate },
      200
    );
  } catch (error) {
    next(error);
  }
};

