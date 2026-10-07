import { Router } from 'express';
import {
  getMyCertificates,
  getCertificateById,
  generateCertificate,
  verifyCertificate,
  getCertificateTemplate,
  updateCertificateTemplate,
} from '../controllers/certificate.controller';
import { authenticate, optionalAuthenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public verification endpoint (No auth required)
router.get('/verify/:certificateId', verifyCertificate);

// Dynamic certificate template format settings (Must be before /:id)
router.get('/template', getCertificateTemplate);
router.put('/template', authenticate, authorizeRoles('admin'), updateCertificateTemplate);

// Publicly viewable credential endpoint (Optional auth for personalized controls)
router.get('/:id', optionalAuthenticate, getCertificateById);

// Protected student certificate routes
router.get('/', authenticate, getMyCertificates);
router.post('/generate/:courseId', authenticate, generateCertificate);

export default router;
