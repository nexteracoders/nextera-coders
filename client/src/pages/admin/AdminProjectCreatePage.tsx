import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { ArrowLeft, Save } from 'lucide-react';

const formSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  slug: z.string().trim().optional(),
  category: z.string().trim().min(2, 'Category is required'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  thumbnail: z.string().optional(),
  technologies: z.string().optional(), // comma or newline separated
  requirements: z.string().optional(), // newline separated
  features: z.string().optional(), // newline separated
  learningOutcomes: z.string().optional(), // newline separated
  githubUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  isPublished: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export const AdminProjectCreatePage: React.FC = () => {
  useDocumentTitle('Create Project Blueprint — NextEra Coders Admin');
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      difficulty: 'Intermediate',
      category: 'MERN',
      isPublished: true,
      technologies: 'React 18, TypeScript, Node.js, Express, MongoDB',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);

      const splitLines = (str?: string) =>
        str ? str.split('\n').map((s) => s.trim()).filter(Boolean) : [];

      const techArray = data.technologies
        ? data.technologies.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: data.title,
        slug: data.slug || undefined,
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

      const created = await adminProjectService.createProject(payload);
      success(`Project "${created.title}" created successfully!`, 'Created');
      navigate(ROUTES.ADMIN_PROJECTS);
    } catch (err: any) {
      toastError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

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
          Create New Project Blueprint
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure architecture guidelines, features, prerequisites, and demo repositories.
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
                placeholder="e.g. Distributed Task Queue & Rate Limiter"
                error={errors.title?.message}
                {...register('title')}
              />
              <Input
                label="Slug (Optional, Auto-generated)"
                placeholder="e.g. distributed-task-queue"
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
                  list="proj-categories"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                  placeholder="e.g. MERN, React, Node.js, Express, Java, Python"
                  {...register('category')}
                />
                <datalist id="proj-categories">
                  <option value="MERN" />
                  <option value="React" />
                  <option value="Node.js" />
                  <option value="Express" />
                  <option value="TypeScript" />
                  <option value="Java" />
                  <option value="Python" />
                </datalist>
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
              label="Thumbnail Image URL (Optional)"
              placeholder="https://images.unsplash.com/photo-..."
              {...register('thumbnail')}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Project Overview & Architecture Description *
              </label>
              <textarea
                rows={4}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-800 bg-white dark:bg-dark-900 text-xs font-mono"
                placeholder="Detailed overview explaining the application and architecture..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <Input
              label="Technologies (Comma separated)"
              placeholder="React 18, TypeScript, Tailwind, Redux, Express, MongoDB"
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
                placeholder="JWT Authentication with HTTP-only cookies&#10;Real-time WebSockets synchronization&#10;Multi-language code execution"
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
                placeholder="Solid grasp of JavaScript async/await&#10;Familiarity with Express routing"
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
                placeholder="Master full-stack monorepo patterns&#10;Implement resilient database indexing"
                {...register('learningOutcomes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Repository & Demo Links */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Repository & Live Application URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GitHub Repository URL"
                placeholder="https://github.com/nexteracoders/..."
                {...register('githubUrl')}
              />
              <Input
                label="Live Demo URL"
                placeholder="https://demo.nexteracoders.com/..."
                {...register('demoUrl')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" className="rounded text-brand-600" {...register('isPublished')} />
            <span>Publish immediately to student blueprint gallery</span>
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
              Save Project
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
