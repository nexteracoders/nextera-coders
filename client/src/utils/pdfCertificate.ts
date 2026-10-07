import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface LinkedInCertData {
  courseName: string;
  certificateId: string;
  issueDate: string | Date;
  isFree?: boolean;
}

/**
 * Builds the official LinkedIn "Add to Profile" certification URL
 */
export function getLinkedInCertificationUrl(data: LinkedInCertData): string {
  const d = new Date(data.issueDate);
  const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const month = isNaN(d.getMonth()) ? new Date().getMonth() + 1 : d.getMonth() + 1; // 1-indexed

  // Title: e.g. "React JS Mastery" or "Free React JS Course"
  const certName = data.isFree
    ? `Free ${data.courseName} Course`
    : data.courseName;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nexteracoders.com';
  const verificationUrl = `${origin}/verify-certificate/${data.certificateId}`;

  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: certName,
    organizationName: 'NextEra Coders',
    issueYear: String(year),
    issueMonth: String(month),
    certUrl: verificationUrl,
    certId: data.certificateId,
  });

  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

/**
 * Generates and triggers download of a high-resolution landscape A4 PDF certificate
 */
export async function downloadCertificatePdf(
  element: HTMLElement,
  fileName: string = 'NextEra_Certificate.pdf'
): Promise<void> {
  // Capture high-DPI canvas with desktop landscape viewport
  const canvas = await html2canvas(element, {
    scale: 2.5, // Crisp print-quality resolution
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FAF9F5',
    logging: false,
    windowWidth: 1280,
    windowHeight: 900,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.querySelector('.certificate-render-frame') as HTMLElement;
      if (clonedElement) {
        clonedElement.style.width = '1120px';
        clonedElement.style.minWidth = '1120px';
        clonedElement.style.maxWidth = '1120px';
      }
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  // A4 dimensions in mm: 297 x 210 (Landscape)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Draw full-bleed landscape image with high fidelity
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  // Trigger browser download
  pdf.save(fileName);
}
