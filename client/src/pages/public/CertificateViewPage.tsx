import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import { certificateService } from '../../services/certificate.service';
import {
  ICertificate,
  ICertificateTemplateSettings,
  DEFAULT_CERTIFICATE_TEMPLATE,
} from '../../types/certificate.types';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { LinkedInIcon } from '../../components/common/SocialIcons';
import { downloadCertificatePdf, getLinkedInCertificationUrl } from '../../utils/pdfCertificate';
import {
  Printer,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  QrCode as QrIcon,
  Crown,
  ExternalLink,
  Download,
  Loader2,
} from 'lucide-react';

export const CertificateViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success } = useToast();

  const [certificate, setCertificate] = useState<ICertificate | null>(null);
  const [template, setTemplate] = useState<ICertificateTemplateSettings>(DEFAULT_CERTIFICATE_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useDocumentTitle(
    certificate
      ? `${certificate.studentName} — Official Certificate of Completion`
      : 'Official Certificate — NextEra Coders'
  );

  useEffect(() => {
    // Fetch live customized certificate template format
    certificateService
      .getCertificateTemplate()
      .then((tpl) => {
        if (tpl) setTemplate(tpl);
      })
      .catch((err) => console.warn('Could not fetch customized certificate template:', err));

    if (!id) return;
    setLoading(true);
    setError(null);
    certificateService
      .getCertificateById(id)
      .then((data) => {
        setCertificate(data);
        const verificationUrl = `${window.location.origin}/verify-certificate/${data.certificateId}`;
        QRCode.toDataURL(verificationUrl, {
          width: 320,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        })
          .then((url) => setQrDataUrl(url))
          .catch((err) => console.error('QR code generation error:', err));
      })
      .catch((err) => setError(err.message || 'Failed to load certificate'))
      .finally(() => setLoading(false));
  }, [id]);

  const isFreeTrack = useMemo(() => {
    if (!certificate) return false;
    return certificate.trackType === 'free';
  }, [certificate]);

  const linkedInUrl = useMemo(() => {
    if (!certificate) return '#';
    return getLinkedInCertificationUrl({
      courseName: certificate.courseName,
      certificateId: certificate.certificateId,
      issueDate: certificate.issueDate,
      isFree: isFreeTrack,
    });
  }, [certificate, isFreeTrack]);

  const handleCopyLink = () => {
    if (!certificate) return;
    const url = `${window.location.origin}/verify-certificate/${certificate.certificateId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    success('Public verification link copied to clipboard!', 'Link Copied');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!certificateRef.current || !certificate) return;
    try {
      setDownloadingPdf(true);
      const safeName = certificate.studentName.trim().replace(/[^a-zA-Z0-9]/g, '_');
      const safeCourse = certificate.courseName.trim().replace(/[^a-zA-Z0-9]/g, '_');
      await downloadCertificatePdf(
        certificateRef.current,
        `NextEra_Certificate_${safeName}_${safeCourse}.pdf`
      );
      success('PDF Certificate downloaded successfully!', 'Download Complete');
    } catch (err) {
      console.error('PDF generation failed:', err);
      // Fallback to native print dialog
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formattedDate = useMemo(() => {
    if (!certificate) return '';
    return new Date(certificate.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [certificate]);

  const issueYear = useMemo(() => {
    if (!certificate?.issueDate) return new Date().getFullYear().toString();
    const d = new Date(certificate.issueDate);
    return isNaN(d.getFullYear()) ? new Date().getFullYear().toString() : d.getFullYear().toString();
  }, [certificate?.issueDate]);

  const formattedStudentName = useMemo(() => {
    if (!certificate?.studentName) return '';
    const raw = certificate.studentName.trim();
    if (raw === raw.toUpperCase() || raw === raw.toLowerCase()) {
      return raw
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return raw;
  }, [certificate?.studentName]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[580px] w-full rounded-3xl" />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <ErrorState title="Certificate Not Found" message={error || 'Certificate not found'} />
        <div className="text-center mt-4">
          <Link to={ROUTES.CERTIFICATES}>
            <Button variant="outline" size="sm">
              Back to My Certificates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const verificationFullUrl = `${window.location.origin}/verify-certificate/${certificate.certificateId}`;

  return (
    <div className="min-h-screen py-8 bg-slate-900/5 dark:bg-dark-950 transition-colors pb-24 print:bg-white print:p-0 print:m-0">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, footer, .print\\:hidden, #app-navbar, #app-footer {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
          .certificate-print-container {
            width: 100vw !important;
            height: 100vh !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 space-y-4">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <Link
            to={ROUTES.CERTIFICATES}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Certificates
          </Link>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
            <Link to={`/verify-certificate/${certificate.certificateId}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="w-3.5 h-3.5 text-brand-500" />}
                className="font-mono text-xs"
              >
                Verification
              </Button>
            </Link>

            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                variant="outline"
                size="sm"
                leftIcon={<LinkedInIcon className="w-3.5 h-3.5 text-[#0A66C2]" />}
                className="font-mono text-xs hover:border-[#0A66C2] hover:text-[#0A66C2] dark:hover:border-[#0A66C2]"
              >
                Add to LinkedIn
              </Button>
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              className="font-mono text-xs"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
              className="font-mono text-xs"
            >
              Print
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              leftIcon={downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              className="font-mono text-xs shadow-md shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {downloadingPdf ? 'Generating PDF...' : 'Download PDF Certificate'}
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LUXURY EXECUTIVE CERTIFICATE FRAME (Strict Landscape Diploma Proportions) */}
        {/* ========================================================================= */}
        <div
          ref={certificateRef}
          className="certificate-print-container certificate-render-frame relative rounded-2xl sm:rounded-[26px] p-1.5 sm:p-2.5 bg-gradient-to-br from-[#070e18] via-[#0f1d30] to-[#070e18] shadow-2xl border border-[#D4AF37]/50 print:border-none print:p-0 transition-transform duration-300 w-full"
        >
          <div className="relative overflow-hidden rounded-[16px] sm:rounded-[20px] bg-[#FCFBF7] text-slate-900 shadow-inner border-[1.5px] sm:border-[2px] border-[#D4AF37]/80 print:border-[1.5px] print:border-[#D4AF37] min-h-[500px] sm:aspect-[1.414/1] flex flex-col justify-between">
            
            {/* 1. TOP-LEFT CORNER DELICATE LUXURY ACCENT (Deep Navy & Rich Gold) */}
            <div className="absolute top-0 left-0 w-36 sm:w-56 md:w-68 h-36 sm:h-56 md:h-68 pointer-events-none z-0">
              <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d="M0,0 L140,0 C100,45 65,80 35,115 C10,145 0,200 0,200 Z"
                  fill="#0B192C"
                />
                <path
                  d="M0,0 L95,0 C70,35 45,65 20,95 C5,120 0,160 0,160 Z"
                  fill="#1E3E62"
                />
                <path
                  d="M140,0 C100,45 65,80 35,115 C10,145 0,200 0,200 L0,190 C0,190 10,140 35,110 C65,75 100,40 136,0 Z"
                  fill="#D4AF37"
                />
                <path
                  d="M95,0 C70,35 45,65 20,95 C5,120 0,160 0,160 L0,152 C0,152 5,115 20,90 C45,60 70,30 92,0 Z"
                  fill="#F59E0B"
                />
              </svg>
            </div>

            {/* 2. BOTTOM-RIGHT CORNER DELICATE LUXURY ACCENT (Deep Navy & Rich Gold) */}
            <div className="absolute bottom-0 right-0 w-32 sm:w-52 md:w-64 h-32 sm:h-52 md:h-64 pointer-events-none z-0">
              <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d="M200,200 L60,200 C100,155 135,120 165,85 C190,55 200,0 200,0 Z"
                  fill="#0B192C"
                />
                <path
                  d="M200,200 L105,200 C130,165 155,135 180,105 C195,80 200,40 200,40 Z"
                  fill="#1E3E62"
                />
                <path
                  d="M60,200 C100,155 135,120 165,85 C190,55 200,0 200,0 L200,10 C200,10 190,60 165,90 C135,125 100,160 64,200 Z"
                  fill="#D4AF37"
                />
                <path
                  d="M105,200 C130,165 155,135 180,105 C195,80 200,40 200,40 L200,48 C200,48 195,85 180,110 C155,140 130,170 108,200 Z"
                  fill="#F59E0B"
                />
              </svg>
            </div>

            {/* 3. INNER ORNAMENTAL DOUBLE HAIRLINE BORDER & CORNER FILIGREE */}
            <div className="absolute inset-2 sm:inset-3.5 border-[1px] border-[#D4AF37]/60 pointer-events-none z-0" />
            <div className="absolute inset-3 sm:inset-5 border-[0.5px] border-[#0B192C]/20 pointer-events-none z-0" />
            
            {/* Corner Filigree L-Brackets */}
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37] pointer-events-none z-0" />
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37] pointer-events-none z-0" />
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37] pointer-events-none z-0" />
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37] pointer-events-none z-0" />

            {/* 4. WATERMARK CREST IN CENTER (Clearly Visible Security Watermark) */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 select-none transition-opacity"
              style={{ opacity: template.watermarkOpacity ?? 0.12 }}
            >
              <img
                src={template.watermarkLogoUrl || "/images/nec-favicon.png"}
                alt="NextEra Official Watermark"
                className="w-[280px] sm:w-[380px] md:w-[440px] h-auto object-contain drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/nec-favicon.png';
                }}
              />
            </div>

            {/* ========================================================================= */}
            {/* MAIN CERTIFICATE CONTENT */}
            {/* ========================================================================= */}
            <div className="relative z-10 p-4 sm:p-6 md:p-8 flex flex-col justify-between h-full text-center space-y-2.5 sm:space-y-3.5">

              {/* TOP HEADER: BRAND & TRACK BADGE */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full border-b border-[#D4AF37]/35 pb-2.5 pt-0.5">
                {/* Official Brand Logo (Favicon directly without container box, enlarged) */}
                <div className="flex items-center gap-3">
                  <img
                    src={template.headerLogoUrl || "/images/nec-favicon.png"}
                    alt="NextEra Coders Favicon"
                    className="h-16 sm:h-18 md:h-20 w-auto object-contain drop-shadow-md shrink-0 select-none"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/nec-favicon.png';
                    }}
                  />
                  <div className="text-left border-l-2 border-[#D4AF37]/70 pl-3 space-y-0.5">
                    {template.organizationName?.trim() && (
                      <span className="text-xs sm:text-sm md:text-base font-serif font-black tracking-[0.14em] text-[#0B192C] uppercase block">
                        {template.organizationName}
                      </span>
                    )}
                    {template.organizationSubtext?.trim() && (
                      <span className="block text-[8px] sm:text-[9px] font-mono tracking-wider text-[#B45309] font-bold uppercase">
                        {template.organizationSubtext}
                      </span>
                    )}
                  </div>
                </div>

                {/* Track Distinction Badge: Free vs Pro (Only render if non-empty) */}
                <div>
                  {isFreeTrack && template.freeTrackBadge?.trim() && (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[9.5px] font-mono font-bold tracking-wider uppercase shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{template.freeTrackBadge}</span>
                    </div>
                  )}
                  {!isFreeTrack && template.proTrackBadge?.trim() && (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 border border-amber-400 text-amber-950 text-[9.5px] font-mono font-black tracking-wider uppercase shadow-2xs">
                      <Crown className="w-3.5 h-3.5 text-amber-700 fill-current" />
                      <span>{template.proTrackBadge}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CERTIFICATE TITLE & SUBTITLE */}
              <div className="space-y-0.5 pt-0.5">
                {template.title?.trim() && (
                  <h1
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0B192C] tracking-[0.05em]"
                    style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Cinzel Decorative', Georgia, serif" }}
                  >
                    {template.title}
                  </h1>
                )}
                {template.subtitle?.trim() && (
                  <div className="flex items-center justify-center gap-2.5 py-0.5">
                    <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-r from-transparent via-[#D4AF37] to-[#D4AF37]" />
                    <span className="text-[11px] sm:text-xs font-serif italic text-slate-600 tracking-wider">
                      {template.subtitle}
                    </span>
                    <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-l from-transparent via-[#D4AF37] to-[#D4AF37]" />
                  </div>
                )}
              </div>

              {/* RECIPIENT NAME (Classic Elegant Calligraphy Cursive Font matching Founder Signature) */}
              <div className="py-1 sm:py-2">
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#0B192C] tracking-wide select-none"
                  style={{
                    fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                    textShadow: '0 1px 3px rgba(11, 25, 44, 0.08)',
                    lineHeight: 1.2,
                  }}
                >
                  {formattedStudentName}
                </h2>
                <div className="w-48 sm:w-72 md:w-80 h-[1.5px] mx-auto mt-1.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
              </div>

              {/* STATEMENT OF CONFERRAL & COURSE TITLE */}
              <div className="max-w-2xl mx-auto space-y-1 px-4">
                {isFreeTrack && template.freeTrackDescription?.trim() && (
                  <p className="text-xs sm:text-[13px] text-slate-700 leading-snug font-sans font-medium">
                    {template.freeTrackDescription}
                  </p>
                )}
                {!isFreeTrack && template.proTrackDescription?.trim() && (
                  <p className="text-xs sm:text-[13px] text-slate-700 leading-snug font-sans font-medium">
                    {template.proTrackDescription}
                  </p>
                )}
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#1E3E62] tracking-tight font-sans">
                  {isFreeTrack
                    ? (certificate.courseName.toLowerCase().endsWith('course')
                        ? certificate.courseName
                        : `${certificate.courseName} course`)
                    : certificate.courseName}
                </h3>
                {isFreeTrack && template.freeHonorsStatement?.trim() && (
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-sans italic max-w-xl mx-auto leading-tight">
                    {template.freeHonorsStatement}
                  </p>
                )}
                {!isFreeTrack && template.proHonorsStatement?.trim() && (
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-sans italic max-w-xl mx-auto leading-tight">
                    {template.proHonorsStatement}
                  </p>
                )}
              </div>

              {/* ========================================================================= */}
              {/* BOTTOM FOOTER: QR CODE, 3D SCALLOPED GOLD ROSETTE MEDAL, & SIGNATURES */}
              {/* ========================================================================= */}
              <div className="pt-3 sm:pt-4 border-t border-[#D4AF37]/35 grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-left">
                
                {/* 1. DYNAMIC VERIFICATION QR CODE BOX */}
                <Link
                  to={`/verify-certificate/${certificate.certificateId}`}
                  target="_blank"
                  className="flex items-center gap-2.5 bg-white/90 hover:bg-white p-2 rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 shadow-xs max-w-xs mx-auto md:mx-0 transition-all hover:scale-[1.02] cursor-pointer group/qr"
                  title="Click to open live verification portal"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 bg-white p-1 rounded-xl border border-slate-300 shrink-0 flex items-center justify-center shadow-xs">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Certificate Verification QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrIcon className="w-8 h-8 text-slate-400 animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[9.5px] font-mono font-bold text-emerald-700 uppercase group-hover/qr:text-emerald-600">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Instant Verification</span>
                    </div>
                    <span className="block text-[8.5px] font-mono text-slate-500 leading-tight">
                      Scan with camera or click to verify record.
                    </span>
                    <span className="block text-[8.5px] font-mono font-bold text-slate-800 select-all truncate max-w-[130px]">
                      {certificate.certificateId}
                    </span>
                  </div>
                </Link>

                {/* 2. AUTHENTIC 3D SCALLOPED GOLD ROSETTE MEDAL WITH GOLD SILK RIBBON TAILS */}
                <div className="flex flex-col items-center justify-center my-0 select-none">
                  <div className="relative flex flex-col items-center">
                    <svg
                      viewBox="0 0 120 125"
                      className="w-20 h-22 sm:w-24 sm:h-26 md:w-26 md:h-28 filter drop-shadow-md overflow-visible"
                    >
                      <defs>
                        {/* Ribbon Left Gradient */}
                        <linearGradient id="goldRibbonL" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#CA8A04" />
                          <stop offset="35%" stopColor="#FDE047" />
                          <stop offset="70%" stopColor="#EAB308" />
                          <stop offset="100%" stopColor="#854D0E" />
                        </linearGradient>

                        {/* Ribbon Right Gradient */}
                        <linearGradient id="goldRibbonR" x1="1" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#CA8A04" />
                          <stop offset="35%" stopColor="#FDE047" />
                          <stop offset="70%" stopColor="#EAB308" />
                          <stop offset="100%" stopColor="#854D0E" />
                        </linearGradient>

                        {/* 3D Scalloped Rosette Gold Radial Gradient */}
                        <radialGradient id="rosetteGoldGrad" cx="35%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#FEF9C3" />
                          <stop offset="25%" stopColor="#FDE047" />
                          <stop offset="60%" stopColor="#EAB308" />
                          <stop offset="85%" stopColor="#CA8A04" />
                          <stop offset="100%" stopColor="#78350F" />
                        </radialGradient>

                        {/* Outer Coin Edge Bevel Gradient */}
                        <linearGradient id="outerBevelGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#FEF08A" />
                          <stop offset="50%" stopColor="#CA8A04" />
                          <stop offset="100%" stopColor="#78350F" />
                        </linearGradient>

                        {/* Polished Sunburst Radial Metallic Core */}
                        <radialGradient id="sunburstCoreGrad" cx="42%" cy="38%" r="62%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                          <stop offset="15%" stopColor="#FEF9C3" />
                          <stop offset="45%" stopColor="#FACC15" />
                          <stop offset="75%" stopColor="#EAB308" />
                          <stop offset="92%" stopColor="#B45309" />
                          <stop offset="100%" stopColor="#78350F" />
                        </radialGradient>

                        <filter id="medalDropShadow" x="-15%" y="-15%" width="130%" height="130%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#78350F" floodOpacity="0.35" />
                        </filter>
                      </defs>

                      {/* Layer 1: Left Gold Silk Ribbon Tail with Swallowtail V-notch */}
                      <path
                        d="M 44 55 L 24 108 L 38 96 L 50 110 L 53 55 Z"
                        fill="url(#goldRibbonL)"
                        stroke="#854D0E"
                        strokeWidth="0.8"
                        strokeLinejoin="round"
                      />

                      {/* Layer 2: Right Gold Silk Ribbon Tail with Swallowtail V-notch */}
                      <path
                        d="M 67 55 L 70 110 L 82 96 L 96 108 L 76 55 Z"
                        fill="url(#goldRibbonR)"
                        stroke="#854D0E"
                        strokeWidth="0.8"
                        strokeLinejoin="round"
                      />

                      {/* Layer 3: 24-Petal Scalloped Rosette Outer Medallion Rim */}
                      <path
                        d="M 100.65 54.65 Q 108.00 60.00, 100.65 65.35 Q 106.36 72.42, 97.88 75.69 Q 101.57 84.00, 92.53 84.96 Q 93.94 93.94, 84.96 92.53 Q 84.00 101.57, 75.69 97.88 Q 72.42 106.36, 65.35 100.65 Q 60.00 108.00, 54.65 100.65 Q 47.58 106.36, 44.31 97.88 Q 36.00 101.57, 35.04 92.53 Q 26.06 93.94, 27.47 84.96 Q 18.43 84.00, 22.12 75.69 Q 13.64 72.42, 19.35 65.35 Q 12.00 60.00, 19.35 54.65 Q 13.64 47.58, 22.12 44.31 Q 18.43 36.00, 27.47 35.04 Q 26.06 26.06, 35.04 27.47 Q 36.00 18.43, 44.31 22.12 Q 47.58 13.64, 54.65 19.35 Q 60.00 12.00, 65.35 19.35 Q 72.42 13.64, 75.69 22.12 Q 84.00 18.43, 84.96 27.47 Q 93.94 26.06, 92.53 35.04 Q 101.57 36.00, 97.88 44.31 Q 106.36 47.58, 100.65 54.65 Z"
                        fill="url(#rosetteGoldGrad)"
                        stroke="#92400E"
                        strokeWidth="1.2"
                        filter="url(#medalDropShadow)"
                      />

                      {/* Layer 4: Outer Coin-Edge Bevel Ring */}
                      <circle cx="60" cy="60" r="39" fill="url(#outerBevelGrad)" stroke="#78350F" strokeWidth="1" />

                      {/* Layer 5: Inner Recessed Groove & Dashed Filigree Ring */}
                      <circle cx="60" cy="60" r="35" fill="none" stroke="#78350F" strokeWidth="1.2" strokeDasharray="2.5,1.5" />

                      {/* Layer 6: Polished Sunburst Radial Metallic Core */}
                      <circle cx="60" cy="60" r="32" fill="url(#sunburstCoreGrad)" stroke="#92400E" strokeWidth="0.8" />

                      {/* Layer 7: Dynamic Embossed Text inside Seal */}
                      {/* Top Text: NEC or custom template.sealTopText */}
                      <text
                        x="60"
                        y="51"
                        textAnchor="middle"
                        fontSize="8"
                        fontFamily="sans-serif"
                        fontWeight="900"
                        letterSpacing="1.2"
                        fill="#78350F"
                      >
                        {template.sealTopText?.trim() || 'NEC'}
                      </text>

                      {/* Center Decorative Star */}
                      <text
                        x="60"
                        y="60"
                        textAnchor="middle"
                        fontSize="7"
                        fill="#92400E"
                      >
                        ★
                      </text>

                      {/* Bottom Text: Year (Issue Year e.g. 2026 or custom template.sealBottomText) */}
                      <text
                        x="60"
                        y="71"
                        textAnchor="middle"
                        fontSize="7.5"
                        fontFamily="sans-serif"
                        fontWeight="800"
                        letterSpacing="1"
                        fill="#78350F"
                      >
                        {template.sealBottomText?.trim() || issueYear}
                      </text>
                    </svg>

                    {/* Verified Credential Gold Plaque Banner (Render only if non-empty) */}
                    {template.sealSubtext?.trim() && (
                      <div className="mt-1 z-10 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border border-amber-400/80 shadow-xs">
                        <span className="text-[9px] font-mono font-black text-[#78350F] uppercase tracking-wider block">
                          {template.sealSubtext}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. SINGLE AUTHORIZED SIGNATURE */}
                <div className="flex items-center justify-center md:justify-end pr-2 sm:pr-6 md:pr-8">
                  <div className="space-y-1 text-center md:text-right">
                    <div className="h-10 flex items-end justify-center md:justify-end">
                      {template.signatureImageUrl?.trim() ? (
                        <img
                          src={template.signatureImageUrl}
                          alt={template.signatoryName || 'Signature'}
                          className="max-h-10 object-contain"
                        />
                      ) : template.signatorySignatureText?.trim() ? (
                        <span
                          className="text-2xl sm:text-3xl text-[#0B192C] font-normal italic select-none"
                          style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                        >
                          {template.signatorySignatureText}
                        </span>
                      ) : null}
                    </div>
                    {(template.signatorySignatureText?.trim() || template.signatureImageUrl?.trim() || template.signatoryName?.trim()) && (
                      <div className="w-40 sm:w-48 h-[1.5px] bg-[#0B192C]/40 mx-auto md:ml-auto" />
                    )}
                    {template.signatoryName?.trim() && (
                      <span className="block text-xs sm:text-sm font-bold text-[#0B192C] font-sans">
                        {template.signatoryName}
                      </span>
                    )}
                    {template.signatoryTitle?.trim() && (
                      <span className="block text-[9px] sm:text-[10px] font-mono text-slate-600 uppercase tracking-wider font-semibold">
                        {template.signatoryTitle}
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* BOTTOM ULTRA-FINE PRINT & VERIFICATION URL */}
              <div className="pt-2 border-t border-slate-200 text-[9px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1">
                <span>
                  Issue Date: <strong className="text-slate-800 font-bold">{formattedDate}</strong> • ID: <strong className="text-slate-800 font-bold">{certificate.certificateId}</strong>
                </span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Authenticity Verified: {verificationFullUrl}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Informative Guidance Card Below Certificate (Hidden in print) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Dynamic Verification QR Code
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Anyone can scan the QR code using their smartphone camera or LinkedIn profile to instantly verify this credential.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                variant="outline"
                size="sm"
                leftIcon={<LinkedInIcon className="w-3.5 h-3.5 text-[#0A66C2]" />}
                className="font-mono text-xs hover:border-[#0A66C2] hover:text-[#0A66C2] dark:hover:border-[#0A66C2]"
              >
                Add to LinkedIn
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              className="font-mono text-xs"
            >
              Share Link
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              leftIcon={downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              className="font-mono text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {downloadingPdf ? 'Generating PDF...' : 'Download PDF Certificate'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
