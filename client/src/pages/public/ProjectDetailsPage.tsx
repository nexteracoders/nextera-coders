import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { projectService } from '../../services/project.service';
import { IProject } from '../../types/project.types';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Github,
  ExternalLink,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';

export const ProjectDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(
    project ? `${project.title} — Project Blueprint` : 'Project Blueprint — NextEra Coders'
  );

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    projectService
      .getProjectBySlug(slug)
      .then((data) => setProject(data))
      .catch((err) => setError(err.message || 'Failed to load project details'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <ErrorState title="Project Not Found" message={error || 'Project not found'} />
        <div className="text-center mt-4">
          <Link to={ROUTES.PROJECTS}>
            <Button variant="outline" size="sm">
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-slate-50/50 dark:bg-dark-950 transition-colors pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to={ROUTES.PROJECTS}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Project Blueprints
          </Link>
        </div>

        {/* Hero Card */}
        <Card variant="elevated" className="overflow-hidden border-slate-200 dark:border-dark-800">
          {project.thumbnail && (
            <div className="h-64 sm:h-80 w-full overflow-hidden bg-slate-900 relative">
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" size="sm" className="font-mono">
                {project.category}
              </Badge>
              <Badge
                variant={
                  project.difficulty === 'Beginner'
                    ? 'success'
                    : project.difficulty === 'Intermediate'
                    ? 'warning'
                    : 'danger'
                }
                size="sm"
                className="font-mono"
              >
                {project.difficulty}
              </Badge>
            </div>

            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {project.title}
            </CardTitle>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {project.description}
            </p>

            {/* Links & CTA Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {project.githubUrl ? (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="primary"
                    size="md"
                    className="font-mono text-xs"
                    leftIcon={<Github className="w-4 h-4" />}
                  >
                    View Source Repository
                  </Button>
                </a>
              ) : (
                <Button variant="outline" size="md" disabled className="font-mono text-xs opacity-60">
                  <Github className="w-4 h-4 mr-2" /> Repository Private
                </Button>
              )}

              {project.demoUrl ? (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="md"
                    className="font-mono text-xs"
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    Live Demo Application
                  </Button>
                </a>
              ) : (
                <Button variant="outline" size="md" disabled className="font-mono text-xs opacity-60">
                  <ExternalLink className="w-4 h-4 mr-2" /> Live Demo Unavailable
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Tech Stack & Key Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tech Stack */}
          <Card variant="elevated" className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" /> Technology Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {project.technologies?.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-dark-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Architecture Features & Requirements */}
          <div className="md:col-span-2 space-y-6">
            {/* Features */}
            {project.features && project.features.length > 0 && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Core Features & Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {project.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites & Requirements */}
            {project.requirements && project.requirements.length > 0 && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-600" /> Prerequisites & Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {project.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Learning Outcomes */}
            {project.learningOutcomes && project.learningOutcomes.length > 0 && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> What You Will Master
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {project.learningOutcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 mt-1.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
