import { Router } from 'express';
import { careerController } from '../controllers/career.controller';

const router = Router();

// Public route: submit career application
router.post('/apply', (req, res) => careerController.submitApplication(req, res));

// Notification endpoint: trigger custom career status email
router.post('/notify-email', (req, res) => careerController.notifyCandidateEmail(req, res));

// Admin routes: manage applications
router.get('/applications', (req, res) => careerController.getApplications(req, res));
router.patch('/applications/:id/status', (req, res) => careerController.updateApplicationStatus(req, res));
router.post('/applications/:id/schedule-interview', (req, res) => careerController.scheduleInterview(req, res));
router.delete('/applications/:id', (req, res) => careerController.deleteApplication(req, res));

export default router;
