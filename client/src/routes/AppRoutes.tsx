import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazyWithRetry as lazy } from '../utils/lazyWithRetry';
import { ROUTES } from '../constants/routes';

import { PublicLayout } from '../layouts/PublicLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { AdminLayout } from '../layouts/AdminLayout';

import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { PageLoader } from '../components/common/PageLoader';
import { RouteAwareErrorBoundary } from '../components/common/ErrorBoundary';
import { ScrollToTop } from '../components/common/ScrollToTop';

// Public Landing & Static Pages (Loaded immediately or swiftly)
import { HomePage } from '../pages/public/HomePage';
import { AboutPage } from '../pages/public/AboutPage';
import { CareersPage } from '../pages/public/CareersPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/public/ResetPasswordPage';
import { GitHubCallbackPage } from '../pages/public/GitHubCallbackPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage';
import { ForbiddenPage } from '../pages/public/ForbiddenPage';
import { ServerErrorPage } from '../pages/public/ServerErrorPage';

// Lazy Loaded Educational Catalog & Detail Pages
const CoursesPage = lazy(() =>
  import('../pages/public/CoursesPage').then((m) => ({ default: m.CoursesPage }))
);
const CourseDetailsPage = lazy(() =>
  import('../pages/public/CourseDetailsPage').then((m) => ({ default: m.CourseDetailsPage }))
);
const NecProOnePage = lazy(() =>
  import('../pages/public/NecProOnePage').then((m) => ({ default: m.NecProOnePage }))
);
const DSAPage = lazy(() =>
  import('../pages/public/DSAPage').then((m) => ({ default: m.DSAPage }))
);
const ProblemDetailsPage = lazy(() =>
  import('../pages/public/ProblemDetailsPage').then((m) => ({ default: m.ProblemDetailsPage }))
);
const PracticePage = lazy(() =>
  import('../pages/public/PracticePage').then((m) => ({ default: m.PracticePage }))
);
const SavedProblemsPage = lazy(() =>
  import('../pages/public/SavedProblemsPage').then((m) => ({ default: m.SavedProblemsPage }))
);
const DailyStreakPage = lazy(() =>
  import('../pages/public/DailyStreakPage').then((m) => ({ default: m.DailyStreakPage }))
);
const TopInterview150Page = lazy(() =>
  import('../pages/public/TopInterview150Page').then((m) => ({ default: m.TopInterview150Page }))
);
const MonthlyContestPage = lazy(() =>
  import('../pages/public/MonthlyContestPage').then((m) => ({ default: m.MonthlyContestPage }))
);
const ContestsHubPage = lazy(() =>
  import('../pages/public/ContestsHubPage').then((m) => ({ default: m.ContestsHubPage }))
);
const WeeklyContestPage = lazy(() =>
  import('../pages/public/WeeklyContestPage').then((m) => ({ default: m.WeeklyContestPage }))
);
const RewardsStorePage = lazy(() =>
  import('../pages/public/RewardsStorePage').then((m) => ({ default: m.RewardsStorePage }))
);
const DuelsHubPage = lazy(() =>
  import('../pages/public/DuelsHubPage').then((m) => ({ default: m.DuelsHubPage }))
);
const PrimeDuelsHubPage = lazy(() =>
  import('../pages/public/PrimeDuelsHubPage').then((m) => ({ default: m.PrimeDuelsHubPage }))
);
const DuelArenaPage = lazy(() =>
  import('../pages/public/DuelArenaPage').then((m) => ({ default: m.DuelArenaPage }))
);
const NecCompilerPage = lazy(() =>
  import('../pages/public/NecCompilerPage').then((m) => ({ default: m.NecCompilerPage }))
);
const ExplorePage = lazy(() =>
  import('../pages/public/ExplorePage').then((m) => ({ default: m.ExplorePage }))
);
const CommunityPage = lazy(() =>
  import('../pages/public/CommunityPage').then((m) => ({ default: m.CommunityPage }))
);
const QuizzesPage = lazy(() =>
  import('../pages/public/QuizzesPage').then((m) => ({ default: m.QuizzesPage }))
);
const QuizDetailsPage = lazy(() =>
  import('../pages/public/QuizDetailsPage').then((m) => ({ default: m.QuizDetailsPage }))
);
const QuizAttemptPage = lazy(() =>
  import('../pages/public/QuizAttemptPage').then((m) => ({ default: m.QuizAttemptPage }))
);
const QuizResultPage = lazy(() =>
  import('../pages/public/QuizResultPage').then((m) => ({ default: m.QuizResultPage }))
);
const ProjectsPage = lazy(() =>
  import('../pages/public/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectDetailsPage = lazy(() =>
  import('../pages/public/ProjectDetailsPage').then((m) => ({ default: m.ProjectDetailsPage }))
);
const TutorialsPage = lazy(() =>
  import('../pages/public/TutorialsPage').then((m) => ({ default: m.TutorialsPage }))
);
const TutorialDetailsPage = lazy(() =>
  import('../pages/public/TutorialDetailsPage').then((m) => ({ default: m.TutorialDetailsPage }))
);
const ScriptsPage = lazy(() =>
  import('../pages/public/ScriptsPage').then((m) => ({ default: m.ScriptsPage }))
);
const CertificateViewPage = lazy(() =>
  import('../pages/public/CertificateViewPage').then((m) => ({ default: m.CertificateViewPage }))
);
const CertificateVerifyPage = lazy(() =>
  import('../pages/public/CertificateVerifyPage').then((m) => ({ default: m.CertificateVerifyPage }))
);
const MentorProfilePage = lazy(() =>
  import('../pages/public/MentorProfilePage').then((m) => ({ default: m.MentorProfilePage }))
);

// Lazy Loaded Student Portal Pages
const DashboardPage = lazy(() =>
  import('../pages/student/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const MyLearningPage = lazy(() =>
  import('../pages/student/MyLearningPage').then((m) => ({ default: m.MyLearningPage }))
);
const CourseLearnPage = lazy(() =>
  import('../pages/student/CourseLearnPage').then((m) => ({ default: m.CourseLearnPage }))
);
const CertificatesPage = lazy(() =>
  import('../pages/student/CertificatesPage').then((m) => ({ default: m.CertificatesPage }))
);
const AchievementsPage = lazy(() =>
  import('../pages/student/AchievementsPage').then((m) => ({ default: m.AchievementsPage }))
);
const NotificationsPage = lazy(() =>
  import('../pages/student/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const ProfilePage = lazy(() =>
  import('../pages/student/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);

// Lazy Loaded Admin CMS Pages
const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminAnalyticsPage = lazy(() =>
  import('../pages/admin/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage }))
);
const AdminCoursesListPage = lazy(() =>
  import('../pages/admin/AdminCoursesListPage').then((m) => ({ default: m.AdminCoursesListPage }))
);
const AdminCourseCreatePage = lazy(() =>
  import('../pages/admin/AdminCourseCreatePage').then((m) => ({ default: m.AdminCourseCreatePage }))
);
const AdminCourseEditPage = lazy(() =>
  import('../pages/admin/AdminCourseEditPage').then((m) => ({ default: m.AdminCourseEditPage }))
);
const AdminCourseCurriculumPage = lazy(() =>
  import('../pages/admin/AdminCourseCurriculumPage').then((m) => ({ default: m.AdminCourseCurriculumPage }))
);
const AdminModulesPage = lazy(() =>
  import('../pages/admin/AdminModulesPage').then((m) => ({ default: m.AdminModulesPage }))
);
const AdminLessonsPage = lazy(() =>
  import('../pages/admin/AdminLessonsPage').then((m) => ({ default: m.AdminLessonsPage }))
);
const AdminStudentsListPage = lazy(() =>
  import('../pages/admin/AdminStudentsListPage').then((m) => ({ default: m.AdminStudentsListPage }))
);
const AdminStudentDetailPage = lazy(() =>
  import('../pages/admin/AdminStudentDetailPage').then((m) => ({ default: m.AdminStudentDetailPage }))
);
const AdminProblemsListPage = lazy(() =>
  import('../pages/admin/AdminProblemsListPage').then((m) => ({ default: m.AdminProblemsListPage }))
);
const AdminProblemCreatePage = lazy(() =>
  import('../pages/admin/AdminProblemCreatePage').then((m) => ({ default: m.AdminProblemCreatePage }))
);
const AdminProblemEditPage = lazy(() =>
  import('../pages/admin/AdminProblemEditPage').then((m) => ({ default: m.AdminProblemEditPage }))
);
const AdminContestPage = lazy(() =>
  import('../pages/admin/AdminContestPage').then((m) => ({ default: m.AdminContestPage }))
);
const AdminPotdPage = lazy(() =>
  import('../pages/admin/AdminPotdPage').then((m) => ({ default: m.AdminPotdPage }))
);
const AdminTop150Page = lazy(() =>
  import('../pages/admin/AdminTop150Page').then((m) => ({ default: m.AdminTop150Page }))
);
const AdminQuizzesListPage = lazy(() =>
  import('../pages/admin/AdminQuizzesListPage').then((m) => ({ default: m.AdminQuizzesListPage }))
);
const AdminQuizCreatePage = lazy(() =>
  import('../pages/admin/AdminQuizCreatePage').then((m) => ({ default: m.AdminQuizCreatePage }))
);
const AdminQuizEditPage = lazy(() =>
  import('../pages/admin/AdminQuizEditPage').then((m) => ({ default: m.AdminQuizEditPage }))
);
const AdminProjectsListPage = lazy(() =>
  import('../pages/admin/AdminProjectsListPage').then((m) => ({ default: m.AdminProjectsListPage }))
);
const AdminProjectCreatePage = lazy(() =>
  import('../pages/admin/AdminProjectCreatePage').then((m) => ({ default: m.AdminProjectCreatePage }))
);
const AdminProjectEditPage = lazy(() =>
  import('../pages/admin/AdminProjectEditPage').then((m) => ({ default: m.AdminProjectEditPage }))
);
const AdminTutorialsListPage = lazy(() =>
  import('../pages/admin/AdminTutorialsListPage').then((m) => ({ default: m.AdminTutorialsListPage }))
);
const AdminTutorialSubjectManagePage = lazy(() =>
  import('../pages/admin/AdminTutorialSubjectManagePage').then((m) => ({ default: m.AdminTutorialSubjectManagePage }))
);
const AdminTutorialCreatePage = lazy(() =>
  import('../pages/admin/AdminTutorialCreatePage').then((m) => ({ default: m.AdminTutorialCreatePage }))
);
const AdminTutorialEditPage = lazy(() =>
  import('../pages/admin/AdminTutorialEditPage').then((m) => ({ default: m.AdminTutorialEditPage }))
);
const AdminAnnouncementsPage = lazy(() =>
  import('../pages/admin/AdminAnnouncementsPage').then((m) => ({ default: m.AdminAnnouncementsPage }))
);
const AdminFAQsPage = lazy(() =>
  import('../pages/admin/AdminFAQsPage').then((m) => ({ default: m.AdminFAQsPage }))
);
const AdminTestimonialsPage = lazy(() =>
  import('../pages/admin/AdminTestimonialsPage').then((m) => ({ default: m.AdminTestimonialsPage }))
);
const AdminMentorsPage = lazy(() =>
  import('../pages/admin/AdminMentorsPage').then((m) => ({ default: m.AdminMentorsPage }))
);
const AdminMentorDetailPage = lazy(() =>
  import('../pages/admin/AdminMentorDetailPage').then((m) => ({ default: m.AdminMentorDetailPage }))
);
const AdminSubAdminsPage = lazy(() =>
  import('../pages/admin/AdminSubAdminsPage').then((m) => ({ default: m.AdminSubAdminsPage }))
);
const AdminCareersPage = lazy(() =>
  import('../pages/admin/AdminCareersPage').then((m) => ({ default: m.AdminCareersPage }))
);
const AdminCertificatesListPage = lazy(() =>
  import('../pages/admin/AdminCertificatesListPage').then((m) => ({ default: m.AdminCertificatesListPage }))
);
const AdminAchievementsListPage = lazy(() =>
  import('../pages/admin/AdminAchievementsListPage').then((m) => ({ default: m.AdminAchievementsListPage }))
);
const AdminNotificationsPage = lazy(() =>
  import('../pages/admin/AdminNotificationsPage').then((m) => ({ default: m.AdminNotificationsPage }))
);
const AdminNecProOnePage = lazy(() =>
  import('../pages/admin/AdminNecProOnePage').then((m) => ({ default: m.AdminNecProOnePage }))
);
const AdminPaymentsPage = lazy(() =>
  import('../pages/admin/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage }))
);
const AdminRewardsPage = lazy(() =>
  import('../pages/admin/AdminRewardsPage').then((m) => ({ default: m.AdminRewardsPage }))
);
const AdminSettingsPage = lazy(() =>
  import('../pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);
const AdminFooterPage = lazy(() =>
  import('../pages/admin/AdminFooterPage').then((m) => ({ default: m.AdminFooterPage }))
);
const AdminAuditLogsPage = lazy(() =>
  import('../pages/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage }))
);
const AdminHealthPage = lazy(() =>
  import('../pages/admin/AdminHealthPage').then((m) => ({ default: m.AdminHealthPage }))
);
const AdminAntiCheatPage = lazy(() =>
  import('../pages/admin/AdminAntiCheatPage').then((m) => ({ default: m.AdminAntiCheatPage }))
);
const AdminMonthlyContestPage = lazy(() =>
  import('../pages/admin/AdminMonthlyContestPage').then((m) => ({ default: m.AdminMonthlyContestPage }))
);
const AdminDuelsPage = lazy(() =>
  import('../pages/admin/AdminDuelsPage').then((m) => ({ default: m.AdminDuelsPage }))
);
const AdminPrimeDuelsPage = lazy(() =>
  import('../pages/admin/AdminPrimeDuelsPage').then((m) => ({ default: m.AdminPrimeDuelsPage }))
);

export const AppRoutes: React.FC = () => {
  return (
    <RouteAwareErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Website Layout (Open to all visitors to browse & view catalogs) */}
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.ABOUT} element={<AboutPage />} />
            <Route path={ROUTES.CAREERS} element={<CareersPage />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
            <Route path={ROUTES.VERIFY_CERTIFICATE} element={<CertificateVerifyPage />} />
            <Route path={ROUTES.CERTIFICATE_DETAILS} element={<CertificateViewPage />} />
            <Route path="/certificates/:id" element={<CertificateViewPage />} />
            <Route path={ROUTES.GITHUB_CALLBACK} element={<GitHubCallbackPage />} />

            {/* Publicly Viewable Catalogs & Previews */}
            <Route path={ROUTES.COURSES} element={<CoursesPage />} />
            <Route path={ROUTES.COURSE_DETAILS} element={<CourseDetailsPage />} />
            <Route path={ROUTES.PRO_ONE} element={<NecProOnePage />} />
            <Route path={ROUTES.DSA} element={<DSAPage />} />
            <Route path={ROUTES.PRACTICE} element={<PracticePage />} />
            <Route path={ROUTES.BOOKMARKS} element={<SavedProblemsPage />} />
            <Route path="/bookmarks" element={<Navigate to={ROUTES.BOOKMARKS} replace />} />
            <Route path="/saved-problems" element={<Navigate to={ROUTES.BOOKMARKS} replace />} />
            <Route path={ROUTES.DAILY_STREAK} element={<DailyStreakPage />} />
            <Route path={ROUTES.PRACTICE_DAILY_STREAK} element={<Navigate to={ROUTES.DAILY_STREAK} replace />} />
            <Route path="/potd" element={<Navigate to={ROUTES.DAILY_STREAK} replace />} />
            <Route path="/problem-of-the-day" element={<Navigate to={ROUTES.DAILY_STREAK} replace />} />
            <Route path={ROUTES.TOP_INTERVIEW_150} element={<TopInterview150Page />} />
            <Route path="/top-150" element={<Navigate to={ROUTES.TOP_INTERVIEW_150} replace />} />
            <Route path="/top-interview-150" element={<Navigate to={ROUTES.TOP_INTERVIEW_150} replace />} />
            <Route path={ROUTES.MONTHLY_CONTEST} element={<MonthlyContestPage />} />
            <Route path="/monthly-contest" element={<Navigate to={ROUTES.MONTHLY_CONTEST} replace />} />
            <Route path="/practice/monthly-contest" element={<Navigate to={ROUTES.MONTHLY_CONTEST} replace />} />
            <Route path={ROUTES.CONTESTS_HUB} element={<ContestsHubPage />} />
            <Route path="/contest-hub" element={<Navigate to={ROUTES.CONTESTS_HUB} replace />} />
            <Route path={ROUTES.DUELS} element={<DuelsHubPage />} />
            <Route path="/duels" element={<Navigate to={ROUTES.DUELS} replace />} />
            <Route path="/practice/duels" element={<Navigate to={ROUTES.DUELS} replace />} />
            <Route path="/code-battles" element={<Navigate to={ROUTES.DUELS} replace />} />
            <Route path={ROUTES.PRIME_DUELS} element={<PrimeDuelsHubPage />} />
            <Route path="/prime-duels" element={<Navigate to={ROUTES.PRIME_DUELS} replace />} />
            <Route path="/practice/prime-duels" element={<Navigate to={ROUTES.PRIME_DUELS} replace />} />
            <Route path="/practice/prime_duels" element={<Navigate to={ROUTES.PRIME_DUELS} replace />} />
            <Route path="/prime-battles" element={<Navigate to={ROUTES.PRIME_DUELS} replace />} />
            <Route path="/practice/prime-battles" element={<Navigate to={ROUTES.PRIME_DUELS} replace />} />
            <Route path={ROUTES.REWARDS} element={<RewardsStorePage />} />
            <Route path={ROUTES.EXPLORE} element={<ExplorePage />} />
            <Route path={ROUTES.QUIZZES} element={<QuizzesPage />} />
            <Route path={ROUTES.QUIZ_DETAILS} element={<QuizDetailsPage />} />
            <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
            <Route path={ROUTES.PROJECT_DETAILS} element={<ProjectDetailsPage />} />
            <Route path={ROUTES.TUTORIALS} element={<TutorialsPage />} />
            <Route path="/tutorials/:trackSlug" element={<TutorialsPage />} />
            <Route path="/tutorials/:trackSlug/:chapterSlug" element={<TutorialsPage />} />
            <Route path="/tutorials/article/:slug" element={<TutorialDetailsPage />} />
            <Route path={ROUTES.SCRIPTS} element={<ScriptsPage />} />
            <Route path={ROUTES.SCRIPTS_SUBJECT} element={<ScriptsPage />} />
            <Route path={ROUTES.COMMUNITY} element={<CommunityPage />} />
            <Route path={ROUTES.POSTS} element={<Navigate to={ROUTES.COMMUNITY} replace />} />
            <Route path="/reviews" element={<Navigate to={ROUTES.COMMUNITY} replace />} />
            <Route path={ROUTES.MENTOR_PROFILE} element={<MentorProfilePage />} />
            <Route path="/mentor/:id" element={<MentorProfilePage />} />
            <Route path="/mentors/:id" element={<Navigate to="/mentor/:id" replace />} />

            {/* Error Handlers */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="/server-error" element={<ServerErrorPage />} />
          </Route>

          {/* Standalone Public In-Browser Multi-Language Compiler (100% Free & Open without login) */}
          <Route path={ROUTES.COMPILER} element={<NecCompilerPage />} />

          {/* Protected Interactive Problem Solving, Video Player, Quiz Attempt & Contests (Requires Login) */}
          <Route element={<ProtectedRoute />}>
            {/* Standalone Full-Screen Coding IDEs (Problem Solver & Live Contest Arena) */}
            <Route path={ROUTES.DSA_PROBLEM} element={<ProblemDetailsPage />} />
            <Route path="/practice/:slug" element={<ProblemDetailsPage />} />
            <Route path="/problems/:slug" element={<ProblemDetailsPage />} />
            <Route path="/problem/:slug" element={<ProblemDetailsPage />} />
            <Route path="/dsa-problem/:slug" element={<ProblemDetailsPage />} />
            <Route path={ROUTES.CONTEST} element={<WeeklyContestPage />} />
            <Route path={ROUTES.DUEL_ARENA} element={<DuelArenaPage />} />
            <Route path="/duels/:roomCode" element={<DuelArenaPage />} />
            <Route path="/duel/:roomCode" element={<DuelArenaPage />} />
            <Route path="/code-battles/:roomCode" element={<DuelArenaPage />} />
            <Route path="/practice/duels/:roomCode" element={<DuelArenaPage />} />
            <Route path="/practice/code-battles/:roomCode" element={<DuelArenaPage />} />
            <Route path={ROUTES.PRIME_DUEL_ARENA} element={<DuelArenaPage />} />
            <Route path="/prime-duels/:roomCode" element={<DuelArenaPage />} />
            <Route path="/practice/prime-duels/:roomCode" element={<DuelArenaPage />} />
            <Route path="/practice/prime_duels/:roomCode" element={<DuelArenaPage />} />
            <Route path="/prime-battles/:roomCode" element={<DuelArenaPage />} />
            <Route path="/practice/prime-battles/:roomCode" element={<DuelArenaPage />} />

            {/* Immersive Dedicated Learning Player & Quiz Attempt */}
            <Route path={ROUTES.COURSE_LEARN} element={<CourseLearnPage />} />
            <Route path={ROUTES.QUIZ_ATTEMPT} element={<QuizAttemptPage />} />
            <Route path={ROUTES.QUIZ_RESULT} element={<QuizResultPage />} />
            <Route path={ROUTES.USER_PROFILE} element={<ProfilePage />} />
          </Route>

          {/* Student Portal Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<StudentLayout />}>
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.MY_LEARNING} element={<MyLearningPage />} />
              <Route path={ROUTES.CERTIFICATES} element={<CertificatesPage />} />
              <Route path={ROUTES.ACHIEVEMENTS} element={<AchievementsPage />} />
              <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Admin CMS Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={['admin', 'sub_admin']} />}>
              <Route element={<AdminLayout />}>
                {/* Content Management Routes (Accessible by Super Admin & Sub-Admin) */}
                <Route path={ROUTES.ADMIN_COURSES} element={<AdminCoursesListPage />} />
                <Route path={ROUTES.ADMIN_COURSES_NEW} element={<AdminCourseCreatePage />} />
                <Route path={ROUTES.ADMIN_COURSES_EDIT} element={<AdminCourseEditPage />} />
                <Route path={ROUTES.ADMIN_COURSES_CURRICULUM} element={<AdminCourseCurriculumPage />} />
                <Route path={ROUTES.ADMIN_MODULES} element={<AdminModulesPage />} />
                <Route path={ROUTES.ADMIN_LESSONS} element={<AdminLessonsPage />} />
                <Route path={ROUTES.ADMIN_PROBLEMS} element={<AdminProblemsListPage />} />
                <Route path={ROUTES.ADMIN_PROBLEMS_NEW} element={<AdminProblemCreatePage />} />
                <Route path={ROUTES.ADMIN_PROBLEMS_EDIT} element={<AdminProblemEditPage />} />
                <Route path={ROUTES.ADMIN_CONTEST} element={<AdminContestPage />} />
                <Route path={ROUTES.ADMIN_MONTHLY_CONTEST} element={<AdminMonthlyContestPage />} />
                <Route path="/admin/monthly-contest" element={<AdminMonthlyContestPage />} />
                <Route path={ROUTES.ADMIN_POTD} element={<AdminPotdPage />} />
                <Route path="/admin/potd" element={<AdminPotdPage />} />
                <Route path={ROUTES.ADMIN_TOP_150} element={<AdminTop150Page />} />
                <Route path="/admin/top-150" element={<AdminTop150Page />} />
                <Route path={ROUTES.ADMIN_QUIZZES} element={<AdminQuizzesListPage />} />
                <Route path={ROUTES.ADMIN_QUIZZES_NEW} element={<AdminQuizCreatePage />} />
                <Route path={ROUTES.ADMIN_QUIZZES_EDIT} element={<AdminQuizEditPage />} />
                <Route path={ROUTES.ADMIN_PROJECTS} element={<AdminProjectsListPage />} />
                <Route path={ROUTES.ADMIN_PROJECTS_NEW} element={<AdminProjectCreatePage />} />
                <Route path={ROUTES.ADMIN_PROJECTS_EDIT} element={<AdminProjectEditPage />} />
                <Route path={ROUTES.ADMIN_TUTORIALS} element={<AdminTutorialsListPage />} />
                <Route path={ROUTES.ADMIN_TUTORIALS_SUBJECT} element={<AdminTutorialSubjectManagePage />} />
                <Route path={ROUTES.ADMIN_TUTORIALS_NEW} element={<AdminTutorialCreatePage />} />
                <Route path={ROUTES.ADMIN_TUTORIALS_EDIT} element={<AdminTutorialEditPage />} />
                <Route path={ROUTES.ADMIN_ANNOUNCEMENTS} element={<AdminAnnouncementsPage />} />
                <Route path={ROUTES.ADMIN_FAQS} element={<AdminFAQsPage />} />
                <Route path={ROUTES.ADMIN_TESTIMONIALS} element={<AdminTestimonialsPage />} />
                <Route path={ROUTES.ADMIN_MENTORS} element={<AdminMentorsPage />} />
                <Route path={ROUTES.ADMIN_MENTOR_DETAILS} element={<AdminMentorDetailPage />} />
                <Route path="/admin/mentors/:id" element={<AdminMentorDetailPage />} />
                <Route path={ROUTES.ADMIN_FOOTER} element={<AdminFooterPage />} />
                <Route path="/admin/footer" element={<AdminFooterPage />} />

                {/* Sensitive Governance & System Routes (Strictly Super Admin Only) */}
                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                  <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
                  <Route path={ROUTES.ADMIN_ANALYTICS} element={<AdminAnalyticsPage />} />
                  <Route path={ROUTES.ADMIN_SUB_ADMINS} element={<AdminSubAdminsPage />} />
                  <Route path={ROUTES.ADMIN_STUDENTS} element={<AdminStudentsListPage />} />
                  <Route path={ROUTES.ADMIN_STUDENT_DETAILS} element={<AdminStudentDetailPage />} />
                  <Route path={ROUTES.ADMIN_DUELS} element={<AdminDuelsPage />} />
                  <Route path="/admin/duels" element={<AdminDuelsPage />} />
                  <Route path={ROUTES.ADMIN_PRIME_DUELS} element={<AdminPrimeDuelsPage />} />
                  <Route path="/admin/prime-duels" element={<AdminPrimeDuelsPage />} />
                  <Route path={ROUTES.ADMIN_CAREERS} element={<AdminCareersPage />} />
                  <Route path={ROUTES.ADMIN_CERTIFICATES} element={<AdminCertificatesListPage />} />
                  <Route path={ROUTES.ADMIN_ACHIEVEMENTS} element={<AdminAchievementsListPage />} />
                  <Route path={ROUTES.ADMIN_NOTIFICATIONS} element={<AdminNotificationsPage />} />
                  <Route path={ROUTES.ADMIN_PRO_ONE} element={<AdminNecProOnePage />} />
                  <Route path="/admin/pro-one" element={<AdminNecProOnePage />} />
                  <Route path={ROUTES.ADMIN_PAYMENTS} element={<AdminPaymentsPage />} />
                  <Route path={ROUTES.ADMIN_REWARDS} element={<AdminRewardsPage />} />
                  <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
                  <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<AdminAuditLogsPage />} />
                  <Route path={ROUTES.ADMIN_HEALTH} element={<AdminHealthPage />} />
                  <Route path={ROUTES.ADMIN_ANTI_CHEAT} element={<AdminAntiCheatPage />} />
                  <Route path="/admin/anti-cheat" element={<AdminAntiCheatPage />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Catch-all 404 Route */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </RouteAwareErrorBoundary>
  );
};
