import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Trophy, CheckCircle2, Award, QrCode, Loader2 } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { certificateService } from '../../services/certificate.service';
import { ICertificate } from '../../types/certificate.types';
import { LinkedInIcon } from '../common/SocialIcons';
import { getLinkedInCertificationUrl } from '../../utils/pdfCertificate';

interface CourseCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  totalLessons: number;
  courseId?: string;
  isFree?: boolean;
}

export const CourseCompletedModal: React.FC<CourseCompletedModalProps> = ({
  isOpen,
  onClose,
  courseTitle,
  totalLessons,
  courseId,
  isFree = false,
}) => {
  const [certificate, setCertificate] = useState<ICertificate | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);

  useEffect(() => {
    if (isOpen && courseId) {
      setLoadingCert(true);
      certificateService
        .generateCertificate(courseId)
        .then((res) => setCertificate(res.certificate))
        .catch((err) => console.error('Certificate generate/fetch error:', err))
        .finally(() => setLoadingCert(false));
    }
  }, [isOpen, courseId]);

  const courseDisplayName = isFree
    ? courseTitle.toLowerCase().endsWith('course')
      ? courseTitle
      : `${courseTitle} course`
    : courseTitle;

  const linkedInUrl = certificate
    ? getLinkedInCertificationUrl({
        courseName: courseTitle,
        certificateId: certificate.certificateId,
        issueDate: certificate.issueDate,
        isFree,
      })
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-6 py-3">
        {/* Trophy Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-500 flex items-center justify-center shadow-xl animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        {/* Title & Completion Notice */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
            100% Curriculum Mastered
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Congratulations!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            {isFree ? (
              <>
                You have successfully completed the free{' '}
                <span className="text-brand-600 dark:text-brand-400 font-bold">
                  {courseDisplayName}
                </span>{' '}
                and mastered all <strong>{totalLessons} lessons</strong>!
              </>
            ) : (
              <>
                You have successfully completed all <strong>{totalLessons} lessons</strong> of{' '}
                <span className="text-brand-600 dark:text-brand-400 font-semibold">
                  {courseTitle}
                </span>
                .
              </>
            )}
          </p>
        </div>

        {/* Verified Credential & QR Badge */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 text-xs text-slate-500 space-y-2 font-mono">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Course Completion & Certificate Generated
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-brand-500" />
            Includes live verification QR code & high-res PDF download
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-2">
          {certificate ? (
            <Link
              to={`/certificates/${certificate.id || certificate.certificateId}`}
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                size="md"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 font-bold"
                leftIcon={<Award className="w-4 h-4" />}
                onClick={onClose}
              >
                View & Download PDF Certificate
              </Button>
            </Link>
          ) : (
            <Link to={ROUTES.CERTIFICATES} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                leftIcon={
                  loadingCert ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Award className="w-4 h-4" />
                  )
                }
                onClick={onClose}
              >
                {loadingCert ? 'Issuing Certificate...' : 'View My Certificates'}
              </Button>
            </Link>
          )}

          {linkedInUrl && (
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex"
            >
              <Button
                variant="outline"
                size="md"
                className="w-full hover:border-[#0A66C2] hover:text-[#0A66C2] dark:hover:border-[#0A66C2]"
                leftIcon={<LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />}
              >
                Add to LinkedIn
              </Button>
            </a>
          )}

          <Link to={ROUTES.MY_LEARNING} className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full" onClick={onClose}>
              My Learning
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
};
