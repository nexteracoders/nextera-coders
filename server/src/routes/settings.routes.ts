import { Router } from 'express';
import { getPublicSettings } from '../controllers/adminSettings.controller';

const router = Router();

// Public Platform Settings (Social links, brand, locations, offers)
router.get('/', getPublicSettings);

export default router;
