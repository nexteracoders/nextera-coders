import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { logger } from './logger';
import {
  PlatformSettings,
  DEFAULT_CERTIFICATE_TEMPLATE,
  ICertificateTemplateSettings,
} from '../models/settings.model';

export interface CertificatePdfData {
  studentName: string;
  courseTitle: string;
  courseCategory?: string;
  trackType?: 'free' | 'pro';
  grade?: string;
  certificateId: string;
  verificationUrl: string;
  issueDate: string;
  template?: ICertificateTemplateSettings;
}

/**
 * Generate an official, executive-grade Certificate PDF Buffer using PDFKit
 * - Landscape A4 (841.89 x 595.28 pt)
 * - Sleek dual hairline gold and navy ornamental border
 * - Original transparent PNG logo and subtle watermark
 * - Ultra-legible bold serif recipient name
 * - Real scannable verification QR Code
 * - Official medal seal and founder signature
 * - Fully synchronized with Admin Certificate Template settings (Free & Pro tracks)
 */
export async function generateCertificatePdfBuffer(data: CertificatePdfData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      let template = data.template;
      if (!template) {
        try {
          if (mongoose.connection && mongoose.connection.readyState === 1) {
            const settings = await PlatformSettings.findOne().lean();
            template = {
              ...DEFAULT_CERTIFICATE_TEMPLATE,
              ...(settings?.certificateTemplate || {}),
            };
          } else {
            template = DEFAULT_CERTIFICATE_TEMPLATE;
          }
        } catch {
          template = DEFAULT_CERTIFICATE_TEMPLATE;
        }
      }
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
        info: {
          Title: `Certificate of Achievement - ${data.studentName}`,
          Author: 'NextEra Coders Academy',
          Subject: `Verified Course Completion Certificate for ${data.courseTitle}`,
          Keywords: 'certificate, nextera coders, verified credential, software engineering',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const width = doc.page.width;   // ~841.89 pt
      const height = doc.page.height; // ~595.28 pt

      // 1. Background Parchment Color (#FCFBF7)
      doc.rect(0, 0, width, height).fill('#FCFBF7');

      // 2. Outer Deep Slate/Navy Border (Thin & sleek, 3pt)
      doc.rect(14, 14, width - 28, height - 28)
        .lineWidth(2.5)
        .strokeColor('#0B192C')
        .stroke();

      // 3. Inner Dual Hairline Gold Ornamental Border
      doc.rect(20, 20, width - 40, height - 40)
        .lineWidth(1.2)
        .strokeColor('#D4AF37')
        .stroke();

      doc.rect(24, 24, width - 48, height - 48)
        .lineWidth(0.5)
        .strokeColor('#B45309')
        .stroke();

      // Corner Filigree L-Brackets in Gold
      const bracketSize = 14;
      const bracketInset = 28;
      // Top-Left
      doc.moveTo(bracketInset, bracketInset + bracketSize).lineTo(bracketInset, bracketInset).lineTo(bracketInset + bracketSize, bracketInset).lineWidth(1.8).strokeColor('#D4AF37').stroke();
      // Top-Right
      doc.moveTo(width - bracketInset - bracketSize, bracketInset).lineTo(width - bracketInset, bracketInset).lineTo(width - bracketInset, bracketInset + bracketSize).lineWidth(1.8).strokeColor('#D4AF37').stroke();
      // Bottom-Left
      doc.moveTo(bracketInset, height - bracketInset - bracketSize).lineTo(bracketInset, height - bracketInset).lineTo(bracketInset + bracketSize, height - bracketInset).lineWidth(1.8).strokeColor('#D4AF37').stroke();
      // Bottom-Right
      doc.moveTo(width - bracketInset - bracketSize, height - bracketInset).lineTo(width - bracketInset, height - bracketInset).lineTo(width - bracketInset, height - bracketInset - bracketSize).lineWidth(1.8).strokeColor('#D4AF37').stroke();

      // Decorative Top-Left and Bottom-Right corner luxury triangles (Prominent & bold)
      doc.save();
      doc.polygon([14, 14], [130, 14], [14, 130]).fill('#0B192C');
      doc.polygon([14, 14], [80, 14], [14, 80]).fill('#1E3E62');
      doc.moveTo(130, 14).lineTo(14, 130).lineWidth(2).strokeColor('#D4AF37').stroke();

      doc.polygon([width - 14, height - 14], [width - 130, height - 14], [width - 14, height - 130]).fill('#0B192C');
      doc.polygon([width - 14, height - 14], [width - 80, height - 14], [width - 14, height - 80]).fill('#1E3E62');
      doc.moveTo(width - 130, height - 14).lineTo(width - 14, height - 130).lineWidth(2).strokeColor('#D4AF37').stroke();
      doc.restore();

      // 4. Center Watermark Crest (Visible Security Watermark)
      const faviconPath = path.resolve(__dirname, '../assets/nec-favicon.png');
      if (fs.existsSync(faviconPath)) {
        doc.save();
        doc.opacity(template.watermarkOpacity ?? 0.12);
        const wmWidth = 320;
        doc.image(faviconPath, (width - wmWidth) / 2, (height - wmWidth) / 2 - 10, { width: wmWidth });
        doc.restore();
      }

      // 5. Header: Logo & Identity (Prominent NEC Favicon)
      if (fs.existsSync(faviconPath)) {
        doc.image(faviconPath, 45, 32, { width: 44, height: 44 });
      }

      // Track distinction badge (Top-Right, only if non-empty)
      const isFree = data.trackType === 'free';
      const badgeRaw = isFree ? template.freeTrackBadge : template.proTrackBadge;
      if (badgeRaw?.trim()) {
        const badgeText = badgeRaw.trim().toUpperCase();
        doc.save();
        const badgeWidth = 280;
        const badgeHeight = 20;
        const badgeX = width - badgeWidth - 45;
        const badgeY = 42;

        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10)
          .fillAndStroke(isFree ? '#ECFDF5' : '#FEF3C7', isFree ? '#10B981' : '#F59E0B');

        doc.fillColor(isFree ? '#065F46' : '#92400E')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(badgeText, badgeX, badgeY + 6, {
            width: badgeWidth,
            align: 'center',
          });
        doc.restore();
      }

      // Academy Credential text beside favicon logo (only if non-empty)
      if (template.organizationName?.trim()) {
        doc.fillColor('#0B192C')
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .text(template.organizationName.trim().toUpperCase(), 98, 39, { characterSpacing: 1.5 });
      }
      if (template.organizationSubtext?.trim()) {
        doc.fillColor('#B45309')
          .fontSize(6.5)
          .font('Helvetica-Bold')
          .text(template.organizationSubtext.trim().toUpperCase(), 98, 54, { characterSpacing: 0.8 });
      }

      // Horizontal separator line under header
      doc.moveTo(45, 80).lineTo(width - 45, 80).lineWidth(0.8).strokeColor('#D4AF37').stroke();

      // 6. Certificate Title (only if non-empty)
      if (template.title?.trim()) {
        doc.fillColor('#0B192C')
          .fontSize(27)
          .font('Times-Bold')
          .text(template.title.trim().toUpperCase(), 40, 96, {
            align: 'center',
            characterSpacing: 2,
          });
      }

      // Gold filigree line under title & Subtitle (only if non-empty)
      const titleLineY = 132;
      if (template.subtitle?.trim()) {
        doc.moveTo(width / 2 - 140, titleLineY).lineTo(width / 2 - 40, titleLineY).lineWidth(0.8).strokeColor('#D4AF37').stroke();
        doc.fillColor('#64748B')
          .fontSize(10)
          .font('Times-Italic')
          .text(template.subtitle.trim(), 40, titleLineY - 5, { align: 'center' });
        doc.moveTo(width / 2 + 40, titleLineY).lineTo(width / 2 + 140, titleLineY).lineWidth(0.8).strokeColor('#D4AF37').stroke();
      }

      // 7. Recipient Student Name
      let recipientName = data.studentName || 'Student Name';
      if (recipientName === recipientName.toUpperCase()) {
        recipientName = recipientName
          .toLowerCase()
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      doc.fillColor('#0B192C')
        .fontSize(30)
        .font('Times-BoldItalic')
        .text(recipientName, 40, 155, {
          align: 'center',
        });

      // Decorative underline below recipient name
      doc.moveTo(width / 2 - 180, 196).lineTo(width / 2 + 180, 196).lineWidth(1.5).strokeColor('#D4AF37').stroke();

      // 8. Statement of Conferral & Course Title (only if non-empty)
      const conferralIntro = isFree ? template.freeTrackDescription : template.proTrackDescription;
      if (conferralIntro?.trim()) {
        doc.fillColor('#334155')
          .fontSize(10.5)
          .font('Helvetica')
          .text(conferralIntro.trim(), 80, 212, {
            align: 'center',
            width: width - 160,
            lineGap: 3,
          });
      }

      // Course Name
      const courseDisplayName = isFree
        ? (data.courseTitle.toLowerCase().endsWith('course') ? data.courseTitle : `${data.courseTitle} course`)
        : data.courseTitle;

      doc.fillColor('#1E3E62')
        .fontSize(19)
        .font('Helvetica-Bold')
        .text(courseDisplayName, 60, 234, {
          align: 'center',
          width: width - 120,
        });

      // Track Description / Honors Statement (only if non-empty)
      const honorsStatement = isFree ? template.freeHonorsStatement : template.proHonorsStatement;
      if (honorsStatement?.trim()) {
        doc.fillColor('#64748B')
          .fontSize(8.5)
          .font('Times-Italic')
          .text(honorsStatement.trim(), 100, 264, {
            align: 'center',
            width: width - 200,
            lineGap: 2,
          });
      }

      // 9. Bottom Section: QR Code, Medal Seal, and Signature
      const bottomY = 320;
      doc.moveTo(45, bottomY - 15).lineTo(width - 45, bottomY - 15).lineWidth(0.8).strokeColor('#D4AF37').stroke();

      // A. Real Scannable Verification QR Code (Left)
      try {
        const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
          width: 95,
          margin: 1,
          color: {
            dark: '#0B192C',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });

        // QR Box Outline
        doc.roundedRect(55, bottomY - 5, 230, 105, 8)
          .fillAndStroke('#FFFFFF', '#E2E8F0');

        doc.image(qrBuffer, 62, bottomY + 2, { width: 90, height: 90 });

        doc.fillColor('#065F46')
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('INSTANT VERIFICATION', 160, bottomY + 12);

        doc.fillColor('#64748B')
          .fontSize(7)
          .font('Helvetica')
          .text('Scan with camera or click to verify record in live registry.', 160, bottomY + 26, { width: 115 });

        doc.fillColor('#0B192C')
          .fontSize(7.5)
          .font('Courier-Bold')
          .text(data.certificateId, 160, bottomY + 54, { width: 115 });

        doc.fillColor('#0284C7')
          .fontSize(6.5)
          .font('Helvetica-Bold')
          .text('Grade: ' + (data.grade || 'Grade A+ (Honors)'), 160, bottomY + 70);
      } catch (err: any) {
        logger.error(`[PDF QR CODE ERROR] ${err?.message}`);
      }

      // B. 3D Official Gold Medal Seal (Center - Scalloped Gold Rosette with Gold Silk Ribbon Tails)
      const sealCenterX = width / 2;
      const sealCenterY = bottomY + 45;

      // Golden Silk Ribbon tails with swallowtail V-notches (matching Image 2)
      doc.save();
      doc.polygon(
        [sealCenterX - 18, sealCenterY + 10],
        [sealCenterX - 6, sealCenterY + 10],
        [sealCenterX - 10, sealCenterY + 48],
        [sealCenterX - 14, sealCenterY + 42],
        [sealCenterX - 18, sealCenterY + 48]
      ).fillAndStroke('#CA8A04', '#854D0E');

      doc.polygon(
        [sealCenterX + 6, sealCenterY + 10],
        [sealCenterX + 18, sealCenterY + 10],
        [sealCenterX + 18, sealCenterY + 48],
        [sealCenterX + 14, sealCenterY + 42],
        [sealCenterX + 10, sealCenterY + 48]
      ).fillAndStroke('#EAB308', '#854D0E');

      // Outer gold medal circle
      doc.circle(sealCenterX, sealCenterY, 32).fillAndStroke('#D4AF37', '#78350F');
      // Inner lighter circle
      doc.circle(sealCenterX, sealCenterY, 28).fill('#FEF08A');
      doc.circle(sealCenterX, sealCenterY, 26).lineWidth(1).strokeColor('#B45309').stroke();

      // Text inside seal
      const sealTop = template.sealTopText?.trim() || 'NEC';
      const sealYear = template.sealBottomText?.trim() || String(new Date(data.issueDate || Date.now()).getFullYear());

      doc.fillColor('#78350F')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(sealTop, sealCenterX - 25, sealCenterY - 14, { width: 50, align: 'center' });

      doc.fillColor('#92400E')
        .fontSize(6)
        .font('Helvetica-Bold')
        .text('★', sealCenterX - 25, sealCenterY - 4, { width: 50, align: 'center' });

      doc.fillColor('#78350F')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text(sealYear, sealCenterX - 25, sealCenterY + 6, { width: 50, align: 'center' });
      doc.restore();

      if (template.sealSubtext?.trim()) {
        doc.fillColor('#B45309')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(template.sealSubtext.trim().toUpperCase(), sealCenterX - 50, sealCenterY + 36, { width: 100, align: 'center', characterSpacing: 0.5 });
      }

      // C. Founder & Chief Mentor Signature (Right)
      const sigX = width - 260;
      if (template.signatorySignatureText?.trim()) {
        doc.fillColor('#0B192C')
          .fontSize(22)
          .font('Times-Italic')
          .text(template.signatorySignatureText.trim(), sigX, bottomY + 10, { width: 200, align: 'center' });
      }

      // Signature line (only if signature or signatory name is present)
      if (template.signatorySignatureText?.trim() || template.signatoryName?.trim()) {
        doc.moveTo(sigX + 15, bottomY + 42).lineTo(sigX + 185, bottomY + 42).lineWidth(1).strokeColor('#0B192C').stroke();
      }

      if (template.signatoryName?.trim()) {
        doc.fillColor('#0B192C')
          .fontSize(10.5)
          .font('Helvetica-Bold')
          .text(template.signatoryName.trim(), sigX, bottomY + 47, { width: 200, align: 'center' });
      }

      if (template.signatoryTitle?.trim()) {
        doc.fillColor('#64748B')
          .fontSize(8)
          .font('Helvetica')
          .text(template.signatoryTitle.trim(), sigX, bottomY + 60, { width: 200, align: 'center' });
      }

      if (template.organizationName?.trim()) {
        doc.fillColor('#94A3B8')
          .fontSize(7)
          .font('Helvetica')
          .text(template.organizationName.trim(), sigX, bottomY + 71, { width: 200, align: 'center' });
      }

      // 10. Footer Fine Print
      const footerY = height - 42;
      doc.moveTo(45, footerY - 5).lineTo(width - 45, footerY - 5).lineWidth(0.5).strokeColor('#E2E8F0').stroke();

      doc.fillColor('#64748B')
        .fontSize(7)
        .font('Helvetica')
        .text(`Issue Date: ${data.issueDate}  •  Certificate ID: ${data.certificateId}`, 55, footerY);

      doc.fillColor('#059669')
        .fontSize(7)
        .font('Helvetica-Bold')
        .text(`Verify Authenticity at: ${data.verificationUrl}`, width - 360, footerY, { width: 300, align: 'right' });

      // Finalize document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
