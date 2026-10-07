import { Router } from 'express';
import { getAdminTest } from '../controllers/admin.controller';
import { getAdminDashboardMetrics } from '../controllers/adminDashboard.controller';
import { getAdminAnalytics } from '../controllers/adminAnalytics.controller';
import {
  getAdminStudents,
  getAdminStudentById,
  updateAdminStudentStatus,
  updateAdminStudentSubscription,
  adminEnrollStudentCourse,
  adminRemoveStudentEnrollment,
  updateAdminStudentProfile,
  adminAdjustStudentCoins,
  adminAdjustStudentStreak,
  adminUpdateSwagOrderStatus,
  adminGrantStudentPerk,
  adminCreateStudentSwagOrder,
} from '../controllers/adminStudent.controller';
import {
  adminGetCourses,
  adminGetCourseById,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminPublishCourse,
  adminUnpublishCourse,
  adminToggleFeatureCourse,
} from '../controllers/adminCourse.controller';
import {
  adminGetModules,
  adminCreateModule,
  adminUpdateModule,
  adminDeleteModule,
  adminReorderModule,
} from '../controllers/adminModule.controller';
import {
  adminGetLessons,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  adminPublishLesson,
  adminUnpublishLesson,
  adminReorderLesson,
} from '../controllers/adminLesson.controller';
import {
  adminGetProblems,
  adminGetNextProblemOrder,
  adminGetProblemById,
  adminCreateProblem,
  adminUpdateProblem,
  adminDeleteProblem,
  adminPublishProblem,
  adminUnpublishProblem,
} from '../controllers/adminProblem.controller';
import {
  adminGetQuizzes,
  adminGetQuizById,
  adminCreateQuiz,
  adminUpdateQuiz,
  adminDeleteQuiz,
  adminPublishQuiz,
  adminUnpublishQuiz,
} from '../controllers/adminQuiz.controller';
import {
  adminGetProjects,
  adminGetProjectById,
  adminCreateProject,
  adminUpdateProject,
  adminDeleteProject,
  adminPublishProject,
  adminUnpublishProject,
} from '../controllers/adminProject.controller';
import {
  adminGetTutorials,
  adminGetTutorialById,
  adminCreateTutorial,
  adminUpdateTutorial,
  adminDeleteTutorial,
  adminPublishTutorial,
  adminUnpublishTutorial,
  adminGetSubjects,
  adminCreateSubject,
  adminGetSubjectBySlug,
  adminUpdateSubject,
  adminDeleteSubject,
  adminTogglePublishSubject,
} from '../controllers/adminTutorial.controller';
import {
  adminGetAnnouncements,
  adminCreateAnnouncement,
  adminUpdateAnnouncement,
  adminDeleteAnnouncement,
  adminPublishAnnouncement,
  adminBroadcastAnnouncement,
  adminGetInactiveRetentionStats,
  adminTriggerInactiveBlast,
} from '../controllers/adminAnnouncement.controller';
import {
  adminGetFaqs,
  adminCreateFaq,
  adminUpdateFaq,
  adminDeleteFaq,
} from '../controllers/faq.controller';
import {
  adminGetTestimonials,
  adminCreateTestimonial,
  adminUpdateTestimonial,
  adminDeleteTestimonial,
} from '../controllers/testimonial.controller';
import {
  adminGetMentors,
  adminGetMentorById,
  adminCreateMentor,
  adminUpdateMentor,
  adminResetMentorPassword,
  adminDeleteMentor,
} from '../controllers/mentor.controller';
import {
  getAdminCertificates,
  getCertificateTemplate,
  updateCertificateTemplate,
} from '../controllers/certificate.controller';
import {
  getAdminAchievements,
  createAdminAchievement,
  updateAdminAchievement,
} from '../controllers/achievement.controller';
import { getAdminSettings, updateAdminSettings } from '../controllers/adminSettings.controller';
import { getAdminAuditLogs } from '../controllers/adminAuditLog.controller';
import {
  getInactiveStudents,
  blastInactiveStudents,
  sendBroadcastAnnouncement,
  getBroadcastLogs,
} from '../controllers/broadcast.controller';
import {
  getAdminSystemHealth,
  testJudge0Ping,
} from '../controllers/adminHealth.controller';

import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validateRequest, validate } from '../middleware/validate.middleware';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validator';
import { createModuleSchema, updateModuleSchema } from '../validators/module.validator';
import { createLessonSchema, updateLessonSchema } from '../validators/lesson.validator';
import { createProblemSchema, updateProblemSchema } from '../validators/problem.validator';
import { createQuizSchema, updateQuizSchema } from '../validators/quiz.validator';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';
import { createTutorialSchema, updateTutorialSchema } from '../validators/tutorial.validator';

import {
  getAdminSubAdmins,
  appointSubAdmin,
  updateSubAdminPassword,
  demoteSubAdmin,
} from '../controllers/adminSubAdmin.controller';

const router = Router();

// Strict Authentication on all admin endpoints
router.use(authenticate);

// Role guards: Super Admin only vs Content Admin (Super Admin + Sub-Admin)
const requireSuperAdmin = authorizeRoles('admin');
const requireContentAdmin = authorizeRoles('admin', 'sub_admin');

// Admin verification test
router.get('/test', requireContentAdmin, getAdminTest);

// Dashboard & Analytics (Super Admin Only)
router.get('/dashboard', requireSuperAdmin, getAdminDashboardMetrics);
router.get('/analytics', requireSuperAdmin, getAdminAnalytics);

// Sub-Admin Management & Master Password Access (Super Admin Only - nexteracoders@gmail.com)
router.get('/sub-admins', requireSuperAdmin, getAdminSubAdmins);
router.post('/sub-admins', requireSuperAdmin, appointSubAdmin);
router.put('/sub-admins/:id/password', requireSuperAdmin, updateSubAdminPassword);
router.delete('/sub-admins/:id', requireSuperAdmin, demoteSubAdmin);

// Student Management (Super Admin & Sub-Admin)
router.get('/students', requireContentAdmin, getAdminStudents);
router.get('/students/:id', requireContentAdmin, getAdminStudentById);
router.patch('/students/:id/status', requireSuperAdmin, updateAdminStudentStatus);
router.put('/students/:id/subscription', requireSuperAdmin, updateAdminStudentSubscription);
router.post('/students/:id/enroll', requireSuperAdmin, adminEnrollStudentCourse);
router.delete('/students/:id/enrollments/:enrollmentId', requireSuperAdmin, adminRemoveStudentEnrollment);
router.put('/students/:id/profile', requireSuperAdmin, updateAdminStudentProfile);
router.put('/students/:id/coins', requireContentAdmin, adminAdjustStudentCoins);
router.put('/students/:id/streak', requireContentAdmin, adminAdjustStudentStreak);
router.post('/students/:id/perks', requireContentAdmin, adminGrantStudentPerk);
router.post('/students/:id/swag-order', requireContentAdmin, adminCreateStudentSwagOrder);
router.put('/swag-orders/:orderId/status', requireContentAdmin, adminUpdateSwagOrderStatus);

// Course Management (Content Admin Allowed)
router.get('/courses', requireContentAdmin, adminGetCourses);
router.post('/courses', requireContentAdmin, validateRequest(createCourseSchema), adminCreateCourse);
router.get('/courses/:id', requireContentAdmin, adminGetCourseById);
router.put('/courses/:id', requireContentAdmin, validateRequest(updateCourseSchema), adminUpdateCourse);
router.delete('/courses/:id', requireContentAdmin, adminDeleteCourse);
router.patch('/courses/:id/publish', requireContentAdmin, adminPublishCourse);
router.patch('/courses/:id/unpublish', requireContentAdmin, adminUnpublishCourse);
router.patch('/courses/:id/feature', requireContentAdmin, adminToggleFeatureCourse);

// Module Management (Content Admin Allowed)
router.get('/modules', requireContentAdmin, adminGetModules);
router.post('/modules', requireContentAdmin, validateRequest(createModuleSchema), adminCreateModule);
router.put('/modules/:id', requireContentAdmin, validateRequest(updateModuleSchema), adminUpdateModule);
router.delete('/modules/:id', requireContentAdmin, adminDeleteModule);
router.patch('/modules/:id/reorder', requireContentAdmin, adminReorderModule);

// Lesson Management (Content Admin Allowed)
router.get('/lessons', requireContentAdmin, adminGetLessons);
router.post('/lessons', requireContentAdmin, validateRequest(createLessonSchema), adminCreateLesson);
router.put('/lessons/:id', requireContentAdmin, validateRequest(updateLessonSchema), adminUpdateLesson);
router.delete('/lessons/:id', requireContentAdmin, adminDeleteLesson);
router.patch('/lessons/:id/publish', requireContentAdmin, adminPublishLesson);
router.patch('/lessons/:id/unpublish', requireContentAdmin, adminUnpublishLesson);
router.patch('/lessons/:id/reorder', requireContentAdmin, adminReorderLesson);

// Problem Management (Content Admin Allowed)
router.get('/problems', requireContentAdmin, adminGetProblems);
router.get('/problems/next-order', requireContentAdmin, adminGetNextProblemOrder);
router.post('/problems', requireContentAdmin, validate(createProblemSchema), adminCreateProblem);
router.get('/problems/:id', requireContentAdmin, adminGetProblemById);
router.put('/problems/:id', requireContentAdmin, validate(updateProblemSchema), adminUpdateProblem);
router.delete('/problems/:id', requireContentAdmin, adminDeleteProblem);
router.patch('/problems/:id/publish', requireContentAdmin, adminPublishProblem);
router.patch('/problems/:id/unpublish', requireContentAdmin, adminUnpublishProblem);

// Quiz Management (Content Admin Allowed)
router.get('/quizzes', requireContentAdmin, adminGetQuizzes);
router.post('/quizzes', requireContentAdmin, validate(createQuizSchema), adminCreateQuiz);
router.get('/quizzes/:id', requireContentAdmin, adminGetQuizById);
router.put('/quizzes/:id', requireContentAdmin, validate(updateQuizSchema), adminUpdateQuiz);
router.delete('/quizzes/:id', requireContentAdmin, adminDeleteQuiz);
router.patch('/quizzes/:id/publish', requireContentAdmin, adminPublishQuiz);
router.patch('/quizzes/:id/unpublish', requireContentAdmin, adminUnpublishQuiz);

// Project Management (Content Admin Allowed)
router.get('/projects', requireContentAdmin, adminGetProjects);
router.post('/projects', requireContentAdmin, validate(createProjectSchema), adminCreateProject);
router.get('/projects/:id', requireContentAdmin, adminGetProjectById);
router.put('/projects/:id', requireContentAdmin, validate(updateProjectSchema), adminUpdateProject);
router.delete('/projects/:id', requireContentAdmin, adminDeleteProject);
router.patch('/projects/:id/publish', requireContentAdmin, adminPublishProject);
router.patch('/projects/:id/unpublish', requireContentAdmin, adminUnpublishProject);

// Tutorial Subject Management (Content Admin Allowed)
router.get('/tutorials/subjects', requireContentAdmin, adminGetSubjects);
router.post('/tutorials/subjects', requireContentAdmin, adminCreateSubject);
router.get('/tutorials/subjects/:slug', requireContentAdmin, adminGetSubjectBySlug);
router.put('/tutorials/subjects/:slug', requireContentAdmin, adminUpdateSubject);
router.delete('/tutorials/subjects/:slug', requireContentAdmin, adminDeleteSubject);
router.patch('/tutorials/subjects/:slug/publish', requireContentAdmin, adminTogglePublishSubject);

// Tutorial Management (Content Admin Allowed)
router.get('/tutorials', requireContentAdmin, adminGetTutorials);
router.post('/tutorials', requireContentAdmin, validate(createTutorialSchema), adminCreateTutorial);
router.get('/tutorials/:id', requireContentAdmin, adminGetTutorialById);
router.put('/tutorials/:id', requireContentAdmin, validate(updateTutorialSchema), adminUpdateTutorial);
router.delete('/tutorials/:id', requireContentAdmin, adminDeleteTutorial);
router.patch('/tutorials/:id/publish', requireContentAdmin, adminPublishTutorial);
router.patch('/tutorials/:id/unpublish', requireContentAdmin, adminUnpublishTutorial);

// Announcement Management (Content Admin Allowed)
router.get('/announcements', requireContentAdmin, adminGetAnnouncements);
router.post('/announcements', requireContentAdmin, adminCreateAnnouncement);
router.post('/announcements/broadcast', requireSuperAdmin, adminBroadcastAnnouncement);
router.get('/announcements/inactive-stats', requireSuperAdmin, adminGetInactiveRetentionStats);
router.post('/announcements/inactive-blast', requireSuperAdmin, adminTriggerInactiveBlast);
router.put('/announcements/:id', requireContentAdmin, adminUpdateAnnouncement);
router.delete('/announcements/:id', requireContentAdmin, adminDeleteAnnouncement);
router.patch('/announcements/:id/publish', requireContentAdmin, adminPublishAnnouncement);

// FAQ Management (Content Admin Allowed)
router.get('/faqs', requireContentAdmin, adminGetFaqs);
router.post('/faqs', requireContentAdmin, adminCreateFaq);
router.put('/faqs/:id', requireContentAdmin, adminUpdateFaq);
router.delete('/faqs/:id', requireContentAdmin, adminDeleteFaq);

// Testimonial Management (Content Admin Allowed)
router.get('/testimonials', requireContentAdmin, adminGetTestimonials);
router.post('/testimonials', requireContentAdmin, adminCreateTestimonial);
router.put('/testimonials/:id', requireContentAdmin, adminUpdateTestimonial);
router.delete('/testimonials/:id', requireContentAdmin, adminDeleteTestimonial);

// Mentor Management (Content Admin Allowed)
router.get('/mentors', requireContentAdmin, adminGetMentors);
router.post('/mentors', requireContentAdmin, adminCreateMentor);
router.get('/mentors/:id', requireContentAdmin, adminGetMentorById);
router.put('/mentors/:id', requireContentAdmin, adminUpdateMentor);
router.post('/mentors/:id/password', requireContentAdmin, adminResetMentorPassword);
router.delete('/mentors/:id', requireContentAdmin, adminDeleteMentor);

// Certificate Management (Super Admin Only)
router.get('/certificates/template', requireSuperAdmin, getCertificateTemplate);
router.put('/certificates/template', requireSuperAdmin, updateCertificateTemplate);
router.get('/certificates', requireSuperAdmin, getAdminCertificates);

// Achievement Management (Super Admin Only)
router.get('/achievements', requireSuperAdmin, getAdminAchievements);
router.post('/achievements', requireSuperAdmin, createAdminAchievement);
router.put('/achievements/:id', requireSuperAdmin, updateAdminAchievement);

// Platform Settings & Audit Logs (Super Admin Only)
router.get('/settings', requireSuperAdmin, getAdminSettings);
router.put('/settings', requireSuperAdmin, updateAdminSettings);
router.get('/audit-logs', requireSuperAdmin, getAdminAuditLogs);

// Payments, QR Gateways, Coupons & Verification Requests
import {
  getAdminPaymentSettings,
  updateAdminPaymentSettings,
} from '../controllers/paymentSettings.controller';
import {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from '../controllers/coupon.controller';
import {
  getAdminPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  testAdminEmail,
} from '../controllers/paymentRequest.controller';

router.get('/payments/settings', requireSuperAdmin, getAdminPaymentSettings);
router.put('/payments/settings', requireSuperAdmin, updateAdminPaymentSettings);

router.get('/payments/coupons', requireSuperAdmin, getAdminCoupons);
router.post('/payments/coupons', requireSuperAdmin, createAdminCoupon);
router.put('/payments/coupons/:id', requireSuperAdmin, updateAdminCoupon);
router.delete('/payments/coupons/:id', requireSuperAdmin, deleteAdminCoupon);

router.get('/payments/requests', requireSuperAdmin, getAdminPaymentRequests);
router.post('/payments/requests/:id/approve', requireSuperAdmin, approvePaymentRequest);
router.post('/payments/requests/:id/reject', requireSuperAdmin, rejectPaymentRequest);
router.post('/payments/test-email', requireSuperAdmin, testAdminEmail);

// 1vs1 Live Coding Battles (Code Duels) Management
import {
  getAdminDuels,
  getAdminPrimeDuels,
  cancelAndRefundPrimeDuel,
  getAdminPrimeDuelSettings,
  updateAdminPrimeDuelSettings,
  getAdminDuelById,
  cancelAdminDuel,
  deleteAdminDuel,
  getAdminDuelSettings,
  updateAdminDuelSettings,
  overrideDuelPlayerAntiCheat,
} from '../controllers/adminDuel.controller';

// NEC Prime Battles (Staked Coins & 10% Platform Cut)
router.get('/duels/prime/settings', requireSuperAdmin, getAdminPrimeDuelSettings);
router.put('/duels/prime/settings', requireSuperAdmin, updateAdminPrimeDuelSettings);
router.get('/duels/prime', requireSuperAdmin, getAdminPrimeDuels);
router.post('/duels/prime/:id/cancel-refund', requireSuperAdmin, cancelAndRefundPrimeDuel);

// Standard Battles
router.get('/duels', requireSuperAdmin, getAdminDuels);
router.get('/duels/settings', requireSuperAdmin, getAdminDuelSettings);
router.put('/duels/settings', requireSuperAdmin, updateAdminDuelSettings);
router.get('/duels/:id', requireSuperAdmin, getAdminDuelById);
router.post('/duels/:id/cancel', requireSuperAdmin, cancelAdminDuel);
router.delete('/duels/:id', requireSuperAdmin, deleteAdminDuel);

// Anti-Cheat Status Override for Duel Battles (Standard & Prime)
router.post('/duels/:id/players/:playerId/anticheat', requireSuperAdmin, overrideDuelPlayerAntiCheat);

// Multi-Channel Notification & Broadcast System (Email & WhatsApp)
router.get('/broadcast/inactive-students', requireSuperAdmin, getInactiveStudents);
router.post('/broadcast/blast-inactive', requireSuperAdmin, blastInactiveStudents);
router.post('/broadcast/send', requireSuperAdmin, sendBroadcastAnnouncement);
router.get('/broadcast/logs', requireSuperAdmin, getBroadcastLogs);

// Server & Execution Health Monitoring (Real-time CPU, RAM, Judge0 Quota, SPM)
router.get('/health/metrics', requireSuperAdmin, getAdminSystemHealth);
router.post('/health/test-judge0', requireSuperAdmin, testJudge0Ping);

export default router;
