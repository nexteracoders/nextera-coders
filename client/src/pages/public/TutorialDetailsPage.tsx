import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { tutorialService } from '../../services/tutorial.service';
import { ITutorialDetail, ITutorialSummary } from '../../types/tutorial.types';
import { ROUTES } from '../../constants/routes';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Clock,
  User,
  ArrowLeft,
  BookOpen,
  Eye,
} from 'lucide-react';
import { VideoPlayer } from '../../components/learning/VideoPlayer';

export const TutorialDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [tutorial, setTutorial] = useState<ITutorialDetail | null>(null);
  const [related, setRelated] = useState<ITutorialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(
    tutorial ? `${tutorial.title} — NextEra Coders Guide` : 'Article — NextEra Coders'
  );

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    tutorialService
      .getTutorialBySlug(slug)
      .then((data) => {
        setTutorial(data.tutorial);
        setRelated(data.relatedTutorials || []);
      })
      .catch((err) => setError(err.message || 'Failed to load tutorial'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <ErrorState title="Article Not Found" message={error || 'Tutorial not found'} />
        <div className="text-center mt-4">
          <Link to={ROUTES.TUTORIALS}>
            <Button variant="outline" size="sm">
              Back to Tutorials
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-slate-50/50 dark:bg-dark-950 transition-colors pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to={ROUTES.TUTORIALS}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Tutorials
          </Link>
        </div>

        {/* Article Header Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm" className="font-mono">
              {tutorial.category}
            </Badge>
            {tutorial.videoUrl ? (
              <Badge variant="success" size="sm" className="font-mono bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold">
                🎬 100% FREE VIDEO TUTORIAL
              </Badge>
            ) : (
              <Badge variant="info" size="sm" className="font-mono">
                📄 ARTICLE GUIDE
              </Badge>
            )}
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {tutorial.videoDuration || `${tutorial.readingTime} min read`}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {tutorial.title}
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {tutorial.excerpt}
          </p>

          {/* Author & Published Info */}
          <div className="flex items-center justify-between py-4 border-y border-slate-200 dark:border-dark-800 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-600/10 text-brand-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-slate-900 dark:text-white font-sans text-xs">
                  {tutorial.author?.name || 'NextEra Staff'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {tutorial.author?.role || 'Technical Educator'} • Published{' '}
                  {new Date(tutorial.publishedAt || tutorial.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              <span>{tutorial.views || 1} views</span>
            </div>
          </div>
        </div>

        {/* Video Player Embed (If videoUrl is provided) */}
        {tutorial.videoUrl ? (
          <div className="w-full">
            <VideoPlayer
              videoUrl={tutorial.videoUrl}
              title={tutorial.title}
              duration={tutorial.videoDuration || (tutorial.readingTime ? `${tutorial.readingTime} mins` : undefined)}
            />
          </div>
        ) : tutorial.thumbnail ? (
          <div className="h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-900 relative shadow-sm">
            <img
              src={tutorial.thumbnail}
              alt={tutorial.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        {/* Article Body Content */}
        <Card variant="elevated" className="border-slate-200 dark:border-dark-800">
          <CardContent className="p-6 sm:p-10">
            <article className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-sm sm:text-base space-y-4">
              {tutorial.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2
                      key={idx}
                      className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-4 pb-1 border-b border-slate-100 dark:border-dark-800"
                    >
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3
                      key={idx}
                      className="text-lg font-bold text-slate-900 dark:text-white pt-2"
                    >
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('```')) {
                  const cleaned = paragraph.replace(/```[a-z]*\n?/g, '');
                  return (
                    <pre
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-4 border border-slate-800"
                    >
                      <code>{cleaned}</code>
                    </pre>
                  );
                }
                return (
                  <p key={idx} className="leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </article>

            {/* Tags Footer */}
            {tutorial.tags && tutorial.tags.length > 0 && (
              <div className="pt-8 mt-8 border-t border-slate-100 dark:border-dark-800 flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-slate-400 mr-2">Tags:</span>
                {tutorial.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-dark-850 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-dark-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Articles Section */}
        {related.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" />
              Related Guides & Articles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((rel) => (
                <Link key={rel.id} to={`/tutorials/article/${rel.slug || rel.id}`} className="group">
                  <Card
                    variant="elevated"
                    className="h-full hover:border-brand-500/40 transition-all p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{rel.category}</span>
                      <span>{rel.readingTime} min</span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-2">
                      {rel.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2">{rel.excerpt}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
