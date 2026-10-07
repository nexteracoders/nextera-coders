import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminCourseService } from '../../services/adminCourse.service';
import { adminService } from '../../services/admin.service';
import { ICourse } from '../../types/course.types';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ArrowLeft, Save, Layers, ExternalLink, Crown, AlertCircle, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ThumbnailUploadInput } from '../../components/common/ThumbnailUploadInput';

const courseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  slug: z.string().trim().optional(),
  thumbnail: z.string().optional().default(''),
  shortDescription: z.string().trim().min(5, 'Short description is required').max(300),
  description: z.string().trim().min(10, 'Full description must be at least 10 characters'),
  category: z.string().trim().min(2, 'Category is required'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']),
  duration: z.string().trim().default('10 Hours'),
  proPrice: z.coerce.number().min(0, 'Pro price cannot be negative').max(99999, 'Pro price cannot exceed ₹99999').default(1999),
  originalPrice: z.coerce.number().min(0).default(9999),
  isProAvailable: z.boolean().default(true),
  isIncludedInMembership: z.boolean().default(true),
  instructorName: z.string().trim().min(2, 'Instructor name is required'),
  instructorRole: z.string().trim().min(2, 'Instructor role is required'),
  instructorBio: z.string().optional().default(''),
  tags: z.string().optional().default(''),
  requirements: z.string().optional().default(''),
  whatYouWillLearn: z.string().optional().default(''),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export const AdminCourseEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle('Edit Course — Admin CMS');
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [course, setCourse] = useState<ICourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricingMode, setPricingMode] = useState<'dual' | 'free'>('dual');
  const [mentorsList, setMentorsList] = useState<{ id?: string; name: string; role: string; bio?: string; image?: string }[]>([]);

  // Pro One Multi-Plan Selector State (Compulsory)
  const [selectedProPlans, setSelectedProPlans] = useState<('monthly' | 'yearly' | 'lifetime')[]>([]);
  const [isNotInProOne, setIsNotInProOne] = useState(false);
  const [proPlansError, setProPlansError] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getMentors()
      .then((res) => {
        if (res.mentors && res.mentors.length > 0) {
          setMentorsList(res.mentors);
        }
      })
      .catch((err) => {
        console.error('Failed to load mentors:', err);
      });
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
  });

  const togglePlan = (plan: 'monthly' | 'yearly' | 'lifetime') => {
    setIsNotInProOne(false);
    setProPlansError(null);
    setSelectedProPlans((prev) => {
      const exists = prev.includes(plan);
      const nextPlans = exists ? prev.filter((p) => p !== plan) : [...prev, plan];
      setValue('isIncludedInMembership', nextPlans.length > 0, { shouldDirty: true });
      return nextPlans;
    });
  };

  const setNotInProOneOption = () => {
    setIsNotInProOne(true);
    setSelectedProPlans([]);
    setProPlansError(null);
    setValue('isIncludedInMembership', false, { shouldDirty: true });
  };

  const selectPlanPreset = (plans: ('monthly' | 'yearly' | 'lifetime')[]) => {
    setIsNotInProOne(false);
    setSelectedProPlans(plans);
    setProPlansError(null);
    setValue('isIncludedInMembership', plans.length > 0, { shouldDirty: true });
  };

  const currentInstructorName = watch('instructorName');
  const selectedMentor = mentorsList.find((m) => m.name === currentInstructorName);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminCourseService.getCourseById(id);
        setCourse(data);
        const isFree = data.proPrice === 0 || data.isProAvailable === false;
        setPricingMode(isFree ? 'free' : 'dual');

        const coursePlans: ('monthly' | 'yearly' | 'lifetime')[] = Array.isArray(data.includedInProPlans)
          ? (data.includedInProPlans as ('monthly' | 'yearly' | 'lifetime')[])
          : (data.isIncludedInMembership !== false ? ['monthly', 'yearly', 'lifetime'] : []);
        setSelectedProPlans(coursePlans);
        setIsNotInProOne(coursePlans.length === 0 || data.isIncludedInMembership === false);
        setProPlansError(null);

        reset({
          title: data.title,
          slug: data.slug,
          thumbnail: data.thumbnail || '',
          shortDescription: data.shortDescription,
          description: data.description,
          category: data.category,
          level: data.level,
          duration: data.duration,
          proPrice: data.proPrice !== undefined ? data.proPrice : 1999,
          originalPrice: data.originalPrice !== undefined ? data.originalPrice : 9999,
          isProAvailable: data.isProAvailable !== false,
          isIncludedInMembership: data.isIncludedInMembership !== false,
          instructorName: data.instructor?.name || '',
          instructorRole: data.instructor?.role || '',
          instructorBio: data.instructor?.bio || '',
          tags: data.tags?.join(', ') || '',
          requirements: data.requirements?.join('\n') || '',
          whatYouWillLearn: data.whatYouWillLearn?.join('\n') || '',
          isFeatured: data.isFeatured,
          isPublished: data.isPublished,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, reset]);

  const onSubmit = async (data: CourseFormValues) => {
    if (!id) return;
    try {
      // Compulsory check: Admin must select at least one Pro One plan OR explicitly choose "Not in Pro One"
      if (!isNotInProOne && selectedProPlans.length === 0) {
        setProPlansError('Compulsory: Please select which Pro One plan(s) include this course, or choose "Not in Pro One".');
        toastError('Please select Pro One availability or choose "Not in Pro One"');
        const el = document.getElementById('pro-one-plans-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      setSubmitting(true);
      const tagsArray = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const reqArray = data.requirements ? data.requirements.split('\n').map((r) => r.trim()).filter(Boolean) : [];
      const learnArray = data.whatYouWillLearn ? data.whatYouWillLearn.split('\n').map((l) => l.trim()).filter(Boolean) : [];

      const updated = await adminCourseService.updateCourse(id, {
        title: data.title,
        slug: data.slug,
        thumbnail: data.thumbnail || '',
        shortDescription: data.shortDescription,
        description: data.description,
        category: data.category,
        level: data.level,
        duration: data.duration,
        proPrice: data.proPrice,
        originalPrice: data.originalPrice,
        isProAvailable: data.isProAvailable,
        isIncludedInMembership: !isNotInProOne && selectedProPlans.length > 0,
        includedInProPlans: isNotInProOne ? [] : selectedProPlans,
        instructor: {
          name: data.instructorName,
          role: data.instructorRole,
          bio: data.instructorBio,
        },
        tags: tagsArray,
        requirements: reqArray,
        whatYouWillLearn: learnArray,
        isFeatured: data.isFeatured,
        isPublished: data.isPublished,
      });

      success(`Course "${updated.title}" updated successfully!`, 'Saved');
      navigate(ROUTES.ADMIN_COURSES);
    } catch (err: any) {
      toastError(err.message || 'Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <ErrorState title="Course Not Found" message={error || 'Unable to fetch course.'} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Link to={ROUTES.ADMIN_COURSES} className="text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 text-xs font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
        </Link>
        <Link to={`/admin/courses/${id}/curriculum`}>
          <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5 text-brand-500" />}>
            Manage Curriculum
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Edit Course Metadata
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Modify course title, descriptions, tags, and publication state.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg">Course Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Course Title *"
                error={errors.title?.message}
                {...register('title')}
              />
              <Input
                label="URL Slug *"
                error={errors.slug?.message}
                {...register('slug')}
              />
            </div>

            <Input
              label="Short Description *"
              error={errors.shortDescription?.message}
              {...register('shortDescription')}
            />

            {/* Course Thumbnail (16:9 Standard) */}
            <ThumbnailUploadInput
              value={watch('thumbnail')}
              onChange={(url) => setValue('thumbnail', url, { shouldValidate: true, shouldDirty: true })}
              label="Course Thumbnail Image (16:9 Aspect Ratio)"
              helperText="Auto-adjusts to 16:9 YouTube format. Displayed on course catalog cards, hero headers, and previews."
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Description *
              </label>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Category *"
                error={errors.category?.message}
                {...register('category')}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Level</label>
                <select
                  {...register('level')}
                  className="w-full rounded-lg border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>

              <Input
                label="Duration Estimate"
                {...register('duration')}
              />
            </div>
          </CardContent>
        </Card>

        {/* NEC Pricing & Tier Setup */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg">Course Pricing & Access Model</CardTitle>
            <CardDescription>Choose whether this course is 100% Free or has a paid NEC Pro video track.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Pricing Mode Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-800">
              <button
                type="button"
                onClick={() => {
                  setPricingMode('dual');
                  setValue('proPrice', 1999, { shouldDirty: true });
                  setValue('isProAvailable', true, { shouldDirty: true });
                  setValue('originalPrice', 9999, { shouldDirty: true });
                }}
                className={cn(
                  "p-3 rounded-xl text-left transition-all font-sans cursor-pointer flex items-center gap-3",
                  pricingMode === 'dual'
                    ? "bg-white dark:bg-dark-900 shadow-md border border-brand-500/30 text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 font-bold">
                  ₹
                </div>
                <div>
                  <div className="text-xs font-bold">Standard Dual-Tier Course</div>
                  <div className="text-[11px] text-slate-500">Free Text Curriculum + Paid Pro Video Track</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPricingMode('free');
                  setValue('proPrice', 0, { shouldDirty: true });
                  setValue('isProAvailable', false, { shouldDirty: true });
                  setValue('originalPrice', 0, { shouldDirty: true });
                }}
                className={cn(
                  "p-3 rounded-xl text-left transition-all font-sans cursor-pointer flex items-center gap-3",
                  pricingMode === 'free'
                    ? "bg-white dark:bg-dark-900 shadow-md border border-emerald-500/40 text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                  🎁
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">100% Free Course</div>
                  <div className="text-[11px] text-slate-500">All Video Lectures & Lessons Free for Everyone</div>
                </div>
              </button>
            </div>

            {pricingMode === 'dual' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      label="NEC Pro Track Price (₹) *"
                      placeholder="e.g. 1999"
                      error={errors.proPrice?.message}
                      {...register('proPrice')}
                    />
                    {/* Quick preset buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] font-mono text-slate-400">Presets:</span>
                      {[999, 1499, 1999, 2499, 3999, 4999, 9999].map((price) => (
                        <button
                          key={price}
                          type="button"
                          onClick={() => setValue('proPrice', price, { shouldDirty: true })}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-dark-850 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950 dark:hover:text-brand-400 border border-slate-200 dark:border-dark-800 transition-colors cursor-pointer"
                        >
                          ₹{price}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Input
                      type="number"
                      label="Original Strike-Through Price (₹) *"
                      placeholder="e.g. 9999"
                      error={errors.originalPrice?.message}
                      {...register('originalPrice')}
                    />
                    <p className="text-[11px] text-slate-500 font-mono mt-2">
                      Shown as crossed-out original value (e.g. <span className="line-through">₹9999</span> Free / ₹1999 Pro)
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div>
                    <strong>NEC Free Track:</strong> Text curriculum is free at ₹0; students can optionally buy the Pro Video Track.
                  </div>
                  <span className="font-mono font-bold bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded text-[11px]">
                    FREE (₹0)
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span>✅ 100% Free Course Mode Active</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  This course will be completely free (₹0). Any student can enroll and stream all video lectures, syllabus, and compiler challenges without requiring payment or approval.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructor */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Instructor Profile</CardTitle>
                <CardDescription>Select the official mentor/instructor assigned to lead this course.</CardDescription>
              </div>
              <Link
                to={ROUTES.ADMIN_MENTORS}
                target="_blank"
                className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Manage Mentors</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Instructor Name <span className="text-rose-500 font-bold">*</span></span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Choose from mentors</span>
                </label>
                <select
                  className={cn(
                    'w-full rounded-lg border bg-white dark:bg-dark-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer',
                    errors.instructorName
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-300 dark:border-dark-800'
                  )}
                  {...register('instructorName', {
                    onChange: (e) => {
                      const selectedName = e.target.value;
                      const found = mentorsList.find((m) => m.name === selectedName);
                      if (found) {
                        if (found.role) setValue('instructorRole', found.role, { shouldDirty: true, shouldValidate: true });
                        if (found.bio) setValue('instructorBio', found.bio, { shouldDirty: true, shouldValidate: true });
                      }
                    },
                  })}
                >
                  <option value="">-- Select a Mentor / Instructor --</option>
                  {currentInstructorName && !mentorsList.some((m) => m.name === currentInstructorName) && (
                    <option value={currentInstructorName}>
                      {currentInstructorName} (Current Instructor)
                    </option>
                  )}
                  {mentorsList.map((m) => (
                    <option key={m.id || m.name} value={m.name}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
                {errors.instructorName && (
                  <p className="text-xs text-rose-500 mt-1">{errors.instructorName.message}</p>
                )}
              </div>

              <Input
                label="Instructor Role *"
                error={errors.instructorRole?.message}
                {...register('instructorRole')}
              />
            </div>

            {selectedMentor && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-brand-500/30">
                  {selectedMentor.image ? (
                    <img src={selectedMentor.image} alt={selectedMentor.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedMentor.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{selectedMentor.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/20">
                      Verified Mentor
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{selectedMentor.role}</p>
                </div>
              </div>
            )}

            <Input
              label="Instructor Bio"
              {...register('instructorBio')}
            />
          </CardContent>
        </Card>

        {/* Curriculum Details */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg">Curriculum Objectives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Tags (Comma separated)"
              {...register('tags')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  What You Will Learn (1 per line)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                  {...register('whatYouWillLearn')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Prerequisites (1 per line)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                  {...register('requirements')}
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3 text-xs text-slate-700 dark:text-slate-300">
            {/* Pro One Plan Availability Selector (Compulsory) */}
            <div
              id="pro-one-plans-section"
              className={cn(
                'p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-4',
                proPlansError
                  ? 'border-rose-500 bg-rose-500/5 ring-2 ring-rose-500/20'
                  : 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Pro One Membership Availability <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      Compulsory
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select which Pro One plan(s) include this course. You can select multiple plans (e.g. 1 Year + 3 Years), all 3 plans, or choose "Not in Pro One" (students must buy separately).
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => selectPlanPreset(['monthly', 'yearly', 'lifetime'])}
                    className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    All 3 Plans
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPlanPreset(['yearly', 'lifetime'])}
                    className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    1Y & 3Y
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPlanPreset(['lifetime'])}
                    className="px-2 py-1 rounded-md text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                  >
                    3Y Only
                  </button>
                  <button
                    type="button"
                    onClick={setNotInProOneOption}
                    className="px-2 py-1 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                  >
                    Not in Pro One
                  </button>
                </div>
              </div>

              {/* 4 Interactive Option Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. 1 Month */}
                <div
                  onClick={() => togglePlan('monthly')}
                  className={cn(
                    'p-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between select-none relative',
                    selectedProPlans.includes('monthly') && !isNotInProOne
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-xs ring-1 ring-amber-500/20'
                      : 'border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 hover:border-slate-300 dark:hover:border-dark-700'
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">1 Month Plan</span>
                    <div
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center border transition-colors',
                        selectedProPlans.includes('monthly') && !isNotInProOne
                          ? 'bg-amber-500 border-amber-600 text-slate-950'
                          : 'border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-900'
                      )}
                    >
                      {selectedProPlans.includes('monthly') && !isNotInProOne && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Basic Pass (₹399/mo)</div>
                  <div className="text-[10px] font-semibold mt-2">
                    {selectedProPlans.includes('monthly') && !isNotInProOne ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">✓ Included in 1 Month</span>
                    ) : (
                      <span className="text-slate-400">Not Included</span>
                    )}
                  </div>
                </div>

                {/* 2. 1 Year */}
                <div
                  onClick={() => togglePlan('yearly')}
                  className={cn(
                    'p-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between select-none relative',
                    selectedProPlans.includes('yearly') && !isNotInProOne
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-xs ring-1 ring-amber-500/20'
                      : 'border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 hover:border-slate-300 dark:hover:border-dark-700'
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">1 Year Plan</span>
                    <div
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center border transition-colors',
                        selectedProPlans.includes('yearly') && !isNotInProOne
                          ? 'bg-amber-500 border-amber-600 text-slate-950'
                          : 'border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-900'
                      )}
                    >
                      {selectedProPlans.includes('yearly') && !isNotInProOne && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Plus Pass (₹2,999/yr)</div>
                  <div className="text-[10px] font-semibold mt-2">
                    {selectedProPlans.includes('yearly') && !isNotInProOne ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">✓ Included in 1 Year</span>
                    ) : (
                      <span className="text-slate-400">Not Included</span>
                    )}
                  </div>
                </div>

                {/* 3. 3 Years */}
                <div
                  onClick={() => togglePlan('lifetime')}
                  className={cn(
                    'p-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between select-none relative',
                    selectedProPlans.includes('lifetime') && !isNotInProOne
                      ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/15 shadow-xs ring-1 ring-purple-500/20'
                      : 'border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 hover:border-slate-300 dark:hover:border-dark-700'
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">3 Years Plan</span>
                    <div
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center border transition-colors',
                        selectedProPlans.includes('lifetime') && !isNotInProOne
                          ? 'bg-purple-600 border-purple-700 text-white'
                          : 'border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-900'
                      )}
                    >
                      {selectedProPlans.includes('lifetime') && !isNotInProOne && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Pro Pass (₹5,999/3yr)</div>
                  <div className="text-[10px] font-semibold mt-2">
                    {selectedProPlans.includes('lifetime') && !isNotInProOne ? (
                      <span className="text-purple-600 dark:text-purple-400 font-bold">✓ Included in 3 Years</span>
                    ) : (
                      <span className="text-slate-400">Not Included</span>
                    )}
                  </div>
                </div>

                {/* 4. Not in Pro One */}
                <div
                  onClick={setNotInProOneOption}
                  className={cn(
                    'p-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between select-none relative',
                    isNotInProOne
                      ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-500/15 shadow-xs ring-1 ring-rose-500/20'
                      : 'border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 hover:border-slate-300 dark:hover:border-dark-700'
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">Not in Pro One</span>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center border transition-colors',
                        isNotInProOne
                          ? 'bg-rose-500 border-rose-600 text-white'
                          : 'border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-900'
                      )}
                    >
                      {isNotInProOne && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Standalone Only</div>
                  <div className="text-[10px] font-semibold mt-2">
                    {isNotInProOne ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">✓ Students Must Pay Separately</span>
                    ) : (
                      <span className="text-slate-400">Click to Exclude</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status summary banner */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-dark-800">
                <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  <strong>Access Rule:</strong>{' '}
                  {isNotInProOne ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      Standalone Only (Not available in any Pro One plan — everyone must buy separately).
                    </span>
                  ) : selectedProPlans.length === 3 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Included in ALL 3 Pro One Plans (Monthly, 1-Year, 3-Years).
                    </span>
                  ) : selectedProPlans.length > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Included ONLY in: {selectedProPlans.map((p) => (p === 'lifetime' ? '3 Years' : p === 'yearly' ? '1 Year' : '1 Month')).join(', ')}. Other students must pay separately.
                    </span>
                  ) : (
                    <span className="text-rose-500 font-bold">Selection Required (Compulsory).</span>
                  )}
                </div>
              </div>

              {proPlansError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{proPlansError}</span>
                </div>
              )}
            </div>

              <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-950 dark:text-brand-300 hover:bg-brand-500/15 transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" {...register('isFeatured')} />
                <div>
                  <span className="font-bold block text-xs">🏠 Show on Homepage (Featured & Latest Section)</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Place this course prominently on the homepage under "Master In-Demand Technologies".</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-dark-800">
                <input type="checkbox" className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" {...register('isPublished')} />
                <div>
                  <span className="font-semibold block text-xs">Published (Visible in Public Catalog)</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Uncheck to unpublish or keep as draft.</span>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Link to={ROUTES.ADMIN_COURSES}>
            <Button variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="md" isLoading={submitting} disabled={submitting} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
