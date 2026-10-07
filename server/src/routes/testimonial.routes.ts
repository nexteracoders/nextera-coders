import { Router } from 'express';
import { getPublicTestimonials } from '../controllers/testimonial.controller';

const router = Router();

router.get('/', getPublicTestimonials);

export default router;
