import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { certificateService } from '../../services/certificate.service';
import { ICertificate } from '../../types/certificate.types';
import { ROUTES } from '../../constants/routes';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LinkedInIcon } from '../../components/common/SocialIcons';
import { getLinkedInCertificationUrl } from '../../utils/pdfCertificate';
import {
  Award,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Eye,
  BookOpen,
  Crown,
  Sparkles,
} from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  useDocumentTitle('My Verified Credentials & Certificates — NextEra Coders');

  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await certificateService.getMyCertificates();
      setCertificates(data.certificates);
    } catch (err: any) {
      setError(err.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cryptographically Verified Credentials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Course Certificates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official certificates of completion earned through mastery of course curricula and assessments.
          </p>
        </div>

        <Link to={ROUTES.COURSES}>
          <Button variant="outline" size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
            Explore More Courses
          </Button>
        </Link>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} variant="elevated" className="h-64 flex flex-col justify-between">
              <CardHeader>
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-9 w-full rounded-xl" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Error Loading Certificates"
          message={error}
          onRetry={fetchCertificates}
        />
      )}

      {/* Certificates Grid */}
      {!loading && !error && certificates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card
              key={cert.id}
              variant="elevated"
              className="flex flex-col justify-between border-slate-200 dark:border-dark-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {cert.trackType === 'free' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Free Track
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5 text-amber-600 fill-current" /> Pro Track
                      </span>
                    )}
                    <Badge variant="success" size="sm" className="font-mono text-[10px]">
                      Verified
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Certificate ID: {cert.certificateId}
                  </span>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                    {cert.courseName}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {cert.trackType === 'free'
                    ? <>Conferred upon <span className="font-semibold text-slate-800 dark:text-slate-200">{cert.studentName}</span> for successfully completing the free {cert.courseName.toLowerCase().endsWith('course') ? cert.courseName : `${cert.courseName} course`}.</>
                    : <>Conferred upon <span className="font-semibold text-slate-800 dark:text-slate-200">{cert.studentName}</span> for successful completion of the full engineering curriculum.</>}
                </p>
              </CardContent>

              <CardFooter className="pt-0 flex items-center gap-2">
                <Link to={`/certificates/${cert.id}`} className="flex-1">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full font-mono text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View & Download PDF
                  </Button>
                </Link>

                <a
                  href={getLinkedInCertificationUrl({
                    courseName: cert.courseName,
                    certificateId: cert.certificateId,
                    issueDate: cert.issueDate,
                    isFree: cert.trackType === 'free',
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Add to LinkedIn Profile"
                  className="inline-flex"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs px-2.5 hover:border-[#0A66C2] hover:text-[#0A66C2]"
                  >
                    <LinkedInIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                  </Button>
                </a>

                <Link to={`/verify-certificate/${cert.certificateId}`} target="_blank">
                  <Button
                    variant="outline"
                    size="sm"
                    title="Public Verification Link"
                    className="font-mono text-xs px-2.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && certificates.length === 0 && (
        <EmptyState
          icon={<Award className="w-8 h-8 text-slate-400" />}
          title="No Certificates Earned Yet"
          description="Complete 100% of required lessons and pass assessments in any course to unlock your verified credential."
          actionLabel="Browse Courses"
          onAction={() => window.location.assign(ROUTES.COURSES)}
        />
      )}
    </div>
  );
};
