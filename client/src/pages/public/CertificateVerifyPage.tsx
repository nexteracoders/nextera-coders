import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { certificateService } from '../../services/certificate.service';
import { ICertificateVerifyResponse } from '../../types/certificate.types';
import { ROUTES } from '../../constants/routes';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { LinkedInIcon } from '../../components/common/SocialIcons';
import { getLinkedInCertificationUrl } from '../../utils/pdfCertificate';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Eye,
  Crown,
} from 'lucide-react';

export const CertificateVerifyPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();

  const [result, setResult] = useState<ICertificateVerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useDocumentTitle(
    result?.verified
      ? `Verified Credential: ${result.certificateId} — NextEra Coders`
      : 'Verify Certificate — NextEra Coders'
  );

  useEffect(() => {
    if (!certificateId) {
      setLoading(false);
      setResult({ verified: false });
      return;
    }

    setLoading(true);
    certificateService
      .verifyCertificate(certificateId)
      .then((data) => setResult(data))
      .catch(() => setResult({ verified: false }))
      .finally(() => setLoading(false));
  }, [certificateId]);

  const isFree = result?.trackType === 'free';

  return (
    <div className="min-h-screen py-12 sm:py-20 bg-slate-50/50 dark:bg-dark-950 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-3">
            <img
              src="/images/nec-navbar-logo-light.png"
              alt="NextEra Coders"
              className="h-9 sm:h-11 w-auto object-contain dark:hidden drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/nec-favicon.png';
              }}
            />
            <img
              src="/images/nec-navbar-logo.png"
              alt="NextEra Coders"
              className="h-9 sm:h-11 w-auto object-contain hidden dark:block drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/nec-favicon.png';
              }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Official Credential Verification Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Cryptographic authenticity verification for official certificates issued by NextEra Coders Academy.
          </p>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <Card variant="elevated" className="p-8 space-y-6">
            <Skeleton className="h-10 w-1/2 mx-auto" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </Card>
        )}

        {/* Verified Result Card */}
        {!loading && result?.verified && (
          <Card variant="elevated" className="border-emerald-500/40 dark:border-emerald-500/40 overflow-hidden shadow-2xl">
            {/* Top Status Banner */}
            <div className="bg-emerald-500/10 dark:bg-emerald-950/40 p-4 border-b border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-bold font-mono">AUTHENTIC CERTIFICATE VERIFIED</span>
              </div>
              <Badge variant="success" size="sm" className="font-mono shadow-xs">
                ✓ Valid & Verified
              </Badge>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Recipient Details */}
              <div className="text-center space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Recipient Conferred
                </span>
                <h2
                  className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-wide"
                  style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
                >
                  {result.studentName}
                </h2>
                <div className="pt-1 flex items-center justify-center gap-2">
                  {!isFree && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <Crown className="w-3.5 h-3.5 text-amber-600 fill-current" /> NextEra Pro Specialization
                    </span>
                  )}
                </div>
              </div>

              {/* Course & Credential Info Table */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-800 space-y-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Conferred Program / Course
                  </span>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {isFree
                      ? `Successfully completed the free ${(result.courseName || '').toLowerCase().endsWith('course') ? result.courseName : `${result.courseName || ''} course`}`
                      : (result.courseName || '')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/60 dark:border-dark-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Certificate ID</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 select-all">
                      {result.certificateId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Issue Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(result.issueDate!).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Academic Honors</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {result.grade || 'Grade A+ (Honors)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Issuing Authority</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      NextEra Coders Learning
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Trust Statement */}
              <div className="flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>
                  This credential record is cryptographically validated and confirmed directly against NextEra Coders permanent ledger records.
                </span>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50/50 dark:bg-dark-850/50 border-t border-slate-100 dark:border-dark-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Link to={`/certificates/${result.certificateId}`} className="w-full sm:w-auto">
                  <Button variant="primary" size="sm" leftIcon={<Eye className="w-4 h-4" />} className="w-full">
                    View Full Certificate
                  </Button>
                </Link>
                <a
                  href={getLinkedInCertificationUrl({
                    courseName: result.courseName || '',
                    certificateId: result.certificateId || '',
                    issueDate: result.issueDate || new Date(),
                    isFree: isFree,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<LinkedInIcon className="w-3.5 h-3.5 text-[#0A66C2]" />}
                    className="w-full hover:border-[#0A66C2] hover:text-[#0A66C2]"
                  >
                    Add to LinkedIn
                  </Button>
                </a>
              </div>
              <Link to={ROUTES.COURSES} className="w-full sm:w-auto">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} className="w-full">
                  Explore More Tracks
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {/* Invalid / Not Found Result Card */}
        {!loading && !result?.verified && (
          <Card variant="elevated" className="border-rose-500/30 dark:border-rose-500/30 text-center p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Certificate Record Not Found
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                The certificate ID <span className="font-mono font-semibold text-rose-500">{certificateId || 'Unknown'}</span> does not match any valid credentials issued by NextEra Coders.
              </p>
            </div>

            <div className="pt-2">
              <Link to={ROUTES.HOME}>
                <Button variant="primary" size="md">
                  Return to Home
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
