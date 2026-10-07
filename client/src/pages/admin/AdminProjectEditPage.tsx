import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { adminProjectService } from '../../services/adminProject.service';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ArrowLeft, Save } from 'lucide-react';

const formSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  slug: z.string().trim().min(1, 'Slug is required'),
  category: z.string().trim().min(2, 'Category is required'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  thumbnail: z.string().optional(),
  technologies: z.string().optional(),
  requirements: z.string().optional(),
  features: z.string().optional(),
  learningOutcomes: z.string().optional(),
  githubUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  isPublished: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export const AdminProjectEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle('Edit Project Blueprint — NextEra Coders Admin');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!id) return;
    adminProjectService
      .getProjectById(id)
      .then((p) => {
        reset({
          title: p.title,
          slug: p.slug,
          category: p.category,
          difficulty: p.difficulty,
          description: p.description,
          thumbnail: p.thumbnail || '',
          technologies: p.technologies?.join(', ') || '',
          requirements: p.requirements?.join('\n') || '',
          features: p.features?.join('\n') || '',
          learningOutcomes: p.learningOutcomes?.join('\n') || '',
          githubUrl: p.githubUrl || '',
          demoUrl: p.demoUrl || '',
          isPublished: p.isPublished,
        });
      })
      .catch((err) => setError(err.message || 'Failed to load project'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    try {
      setSubmitting(true);

      const splitLines = (str?: string) =>
        str ? str.split('\n').map((s) => s.trim()).filter(Boolean) : [];

      const techArray = data.technologies
        ? data.technologies.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: data.title,
        slug: data.slug,
        category: data.category,
        difficulty: data.difficulty,
        description: data.description,
        thumbnail: data.thumbnail || '',
        technologies: techArray,
        requirements: splitLines(data.requirements),
        features: splitLines(data.features),
        learningOutcomes: splitLines(data.learningOutcomes),
        githubUrl: data.githubUrl || '',
        demoUrl: data.demoUrl || '',
        isPublished: data.isPublished,
      };

      await adminProjectService.updateProject(id, payload);
      success('Project updated successfully!', 'Saved');
      navigate(ROUTES.ADMIN_PROJECTS);
    } catch (err: any) {
      toastError(err.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <ErrorState title="Error Loading Project" message={error} />
        <div className="text-center mt-4">
          <Link to={ROUTES.ADMIN_PROJECTS}>
            <Button variant="outline" size="sm">
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Link to={ROUTES.ADMIN_PROJECTS}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Projects
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Edit Project Blueprint
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Update specifications, features, technology tags, and demo links.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Project Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Project Title *"
                error={errors.title?.message}
                {...register('title')}
              />
              <Input
                label="Slug *"
                error={errors.slug?.message}
                {...register('slug')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Category *
                </label>
                <input
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                  {...register('category')}
                />
                {errors.category && (
                  <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Difficulty Level *
                </label>
                <select
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                  {...register('difficulty')}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <Input
              label="Thumbnail Image URL"
              {...register('thumbnail')}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Project Overview *
              </label>
              <textarea
                rows={4}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                {...register('description')}
              />
            </div>

            <Input
              label="Technologies (Comma separated)"
              {...register('technologies')}
            />
          </CardContent>
        </Card>

        {/* Requirements, Features, Learning Outcomes */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Specifications & Outcomes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Core Features (One per line)
              </label>
              <textarea
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                {...register('features')}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Prerequisites & Requirements (One per line)
              </label>
              <textarea
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                {...register('requirements')}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Learning Outcomes (One per line)
              </label>
              <textarea
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                {...register('learningOutcomes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Repository & Demo Links */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Repository & Live URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GitHub Repository URL"
                {...register('githubUrl')}
              />
              <Input
                label="Live Demo URL"
                {...register('demoUrl')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" className="rounded text-brand-600" {...register('isPublished')} />
            <span>Published</span>
          </label>

          <div className="flex items-center gap-2">
            <Link to={ROUTES.ADMIN_PROJECTS}>
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Update Project
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
