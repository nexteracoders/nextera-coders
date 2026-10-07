import { Router } from 'express';
import {
  getPublicFooterLinks,
  getAdminFooterLinks,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink,
  resetDefaultFooterLinks,
} from '../controllers/footer.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public route to fetch grouped footer links
router.get('/', getPublicFooterLinks);

// Admin routes for footer management
router.get('/admin', authenticate, authorizeRoles('admin', 'sub_admin'), getAdminFooterLinks);
router.post('/admin', authenticate, authorizeRoles('admin', 'sub_admin'), createFooterLink);
router.put('/admin/:id', authenticate, authorizeRoles('admin', 'sub_admin'), updateFooterLink);
router.delete('/admin/:id', authenticate, authorizeRoles('admin', 'sub_admin'), deleteFooterLink);
router.post('/admin/seed', authenticate, authorizeRoles('admin', 'sub_admin'), resetDefaultFooterLinks);

export default router;
