import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { learningService } from '../../services/learning.service';
import {
  ILearningCourseData,
  ILessonDetailsResponse,
} from '../../types/learning.types';
import { VideoPlayer } from '../../components/learning/VideoPlayer';
import { LearningSidebar } from '../../components/learning/LearningSidebar';
import { LessonNotes } from '../../components/learning/LessonNotes';
import { LessonResources } from '../../components/learning/LessonResources';
import { LessonNavigation } from '../../components/learning/LessonNavigation';
import { CourseCompletedModal } from '../../components/learning/CourseCompletedModal';
import { CoursePaymentModal } from '../../components/course/CoursePaymentModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Menu, Sparkles, Crown, RotateCw, LogIn } from 'lucide-react';

export const CourseLearnPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLessonId = searchParams.get('lesson') || undefined;
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [courseData, setCourseData] = useState<ILearningCourseData | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lessonDetails, setLessonDetails] = useState<ILessonDetailsResponse | null>(null);

  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useDocumentTitle(
    lessonDetails ? `${lessonDetails.lesson.title} — ${courseData?.course.title || 'Learning'}` : 'Learning Player'
  );

  // 1. Fetch Course Data & Curriculum
  const fetchCourseData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoadingCourse(true);
      setError(null);
      const data = await learningService.getCourseLearnData(slug, requestedLessonId);
      setCourseData(data);
      setActiveLessonId(data.activeLessonId);
    } catch (err: any) {
      if (err.code === 'ENROLLMENT_REQUIRED') {
        navigate(`/courses/${slug}`);
      } else {
        setError(err.message || 'Failed to load course player');
      }
    } finally {
      setLoadingCourse(false);
    }
  }, [slug, requestedLessonId, navigate]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // 2. Fetch Active Lesson Details
  const fetchLessonDetails = useCallback(async (lessonId: string) => {
    try {
      setLoadingLesson(true);
      const data = await learningService.getLessonById(lessonId);
      setLessonDetails(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to load lesson content');
    } finally {
      setLoadingLesson(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (activeLessonId) {
      fetchLessonDetails(activeLessonId);
    }
  }, [activeLessonId, fetchLessonDetails]);

  // Select lesson handler
  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setSearchParams({ lesson: lessonId });
  };

  // Mark lesson as complete handler
  const handleMarkComplete = async () => {
    if (!activeLessonId || !courseData) return;

    try {
      setCompleting(true);
      const res = await learningService.markLessonComplete(activeLessonId);
      const updatedEnrollment = res.enrollment;

      // Update courseData curriculum and enrollment state
      setCourseData((prev) => {
        if (!prev) return null;
        const updatedCurriculum = prev.curriculum.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((l) =>
            l.id === activeLessonId ? { ...l, isCompleted: true } : l
          ),
        }));

        return {
          ...prev,
          enrollment: {
            id: updatedEnrollment.courseId,
            progress: updatedEnrollment.progress,
            completedLessons: updatedEnrollment.completedLessons,
            lastAccessedLesson: activeLessonId,
            isCompleted: updatedEnrollment.isCompleted,
            completedAt: updatedEnrollment.completedAt,
          },
          curriculum: updatedCurriculum,
          completedCount: updatedEnrollment.completedLessonCount,
        };
      });

      // Update current lesson details
      setLessonDetails((prev) =>
        prev
          ? {
              ...prev,
              lesson: { ...prev.lesson, isCompleted: true },
            }
          : null
      );

      if (updatedEnrollment.isCompleted) {
        setCompletionModalOpen(true);
        success('Congratulations! You completed the entire course!', 'Course Completed');
      } else {
        success('Lesson marked as complete!', 'Progress Updated');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to complete lesson');
    } finally {
      setCompleting(false);
    }
  };

  if (loadingCourse || authLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex">
        <div className="hidden md:block w-80 p-4 border-r border-slate-200 dark:border-dark-800 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="w-full aspect-video rounded-2xl" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-500 shadow-xl">
          <LogIn className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Sign In to Start Learning
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Please log in or create an account to access this course, stream HD lessons, and track your progress.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to={`/login?redirect=/courses/${slug}/learn`}>
            <Button variant="primary" size="md" className="bg-gradient-to-r from-brand-600 to-indigo-600 font-bold shadow-lg" leftIcon={<LogIn className="w-4 h-4" />}>
              Sign In to Continue
            </Button>
          </Link>
          <Link to={`/courses/${slug}`}>
            <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Course Overview
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    const isAccessDenied = error?.toLowerCase().includes('permission') || error?.toLowerCase().includes('enroll') || error?.toLowerCase().includes('pro');

    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 shadow-xl">
          {isAccessDenied ? <Crown className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isAccessDenied ? 'Course Access / Enrollment Required' : 'Unable to Load Learning Player'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {error || 'You need an active Free or Pro enrollment to access this learning workspace and lessons.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchCourseData()}
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Try Again
          </Button>
          <Link to={`/courses/${slug}`}>
            <Button variant="primary" size="md" className="bg-gradient-to-r from-brand-600 to-indigo-600 font-bold shadow-lg" rightIcon={<ArrowLeft className="w-4 h-4 rotate-180" />}>
              Course Overview & Plans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const enrollment = courseData.enrollment;
  const progress = enrollment?.progress || 0;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-50 dark:bg-dark-950">
      {/* Top Navbar */}
      <div className="h-14 px-4 sm:px-6 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/courses/${slug}`}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 text-xs font-mono shrink-0"
            title="Back to Course Overview"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </Link>

          <span className="text-slate-300 dark:text-dark-700">|</span>

          <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {courseData.course.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {enrollment?.tier === 'pro' || (user?.isPro && user?.subscription?.plan && user?.subscription?.status === 'active') ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> NEC Pro Active
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono">
                NEC Free
              </span>
              <Button
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-xs"
                onClick={() => setPaymentModalOpen(true)}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Upgrade to Pro
              </Button>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Progress:</span>
            <span className="font-bold text-brand-600 dark:text-brand-400">{progress}%</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileDrawerOpen(true)}
            leftIcon={<Menu className="w-4 h-4" />}
          >
            Curriculum
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="hidden md:block h-full">
          <LearningSidebar
            courseTitle={courseData.course.title}
            category={courseData.course.category}
            progress={progress}
            completedCount={courseData.completedCount}
            totalLessons={courseData.totalLessons}
            curriculum={courseData.curriculum}
            activeLessonId={activeLessonId}
            onSelectLesson={handleSelectLesson}
          />
        </div>

        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-4/5 max-w-sm h-full z-10">
              <LearningSidebar
                courseTitle={courseData.course.title}
                category={courseData.course.category}
                progress={progress}
                completedCount={courseData.completedCount}
                totalLessons={courseData.totalLessons}
                curriculum={courseData.curriculum}
                activeLessonId={activeLessonId}
                onSelectLesson={(id) => {
                  handleSelectLesson(id);
                  setMobileDrawerOpen(false);
                }}
                onCloseMobile={() => setMobileDrawerOpen(false)}
                isMobileDrawer={true}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {loadingLesson ? (
              <div className="space-y-4">
                <Skeleton className="w-full aspect-video rounded-2xl" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : lessonDetails ? (
              <>
                <VideoPlayer
                  videoUrl={lessonDetails.lesson.videoUrl}
                  title={lessonDetails.lesson.title}
                  duration={lessonDetails.lesson.duration}
                  userEmail={user?.email}
                  userName={user?.name}
                />

                <div className="space-y-1">
                  {lessonDetails.module && (
                    <span className="text-xs font-mono text-brand-600 dark:text-brand-400 font-semibold">
                      MODULE {lessonDetails.module.order}: {lessonDetails.module.title}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {lessonDetails.lesson.title}
                  </h2>
                </div>

                <LessonNotes
                  description={lessonDetails.lesson.description}
                  notes={lessonDetails.lesson.notes}
                />

                {lessonDetails.lesson.resources && lessonDetails.lesson.resources.length > 0 && (
                  <LessonResources resources={lessonDetails.lesson.resources} />
                )}

                <LessonNavigation
                  navigation={lessonDetails.navigation}
                  isCompleted={lessonDetails.lesson.isCompleted}
                  isCompleting={completing}
                  isCourseCompleted={progress === 100}
                  onPrevLesson={() =>
                    lessonDetails.navigation.prevLesson &&
                    handleSelectLesson(lessonDetails.navigation.prevLesson.id)
                  }
                  onNextLesson={() =>
                    lessonDetails.navigation.nextLesson &&
                    handleSelectLesson(lessonDetails.navigation.nextLesson.id)
                  }
                  onMarkComplete={handleMarkComplete}
                  onOpenCompletionModal={() => setCompletionModalOpen(true)}
                />
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                Select a lesson from the curriculum sidebar to begin.
              </div>
            )}
          </div>
        </div>
      </div>

      <CourseCompletedModal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        courseTitle={courseData.course.title}
        totalLessons={courseData.totalLessons}
        courseId={courseData.course.id}
        isFree={courseData.enrollment?.tier === 'free'}
      />

      {courseData && (
        <CoursePaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          course={{
            id: courseData.course.id,
            title: courseData.course.title,
            slug: courseData.course.slug,
            description: '',
            shortDescription: '',
            thumbnail: '',
            category: courseData.course.category,
            level: courseData.course.level as any,
            duration: courseData.course.duration,
            instructor: courseData.course.instructor as any,
            tags: [],
            requirements: [],
            whatYouWillLearn: [],
            originalPrice: courseData.course.originalPrice || 9999,
            proPrice: courseData.course.proPrice || 1999,
            isFeatured: false,
            isPublished: true,
            createdAt: '',
            updatedAt: '',
          }}
          onSuccess={() => {
            fetchCourseData();
          }}
        />
      )}
    </div>
  );
};
