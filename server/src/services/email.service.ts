import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { PlatformSettings } from '../models/settings.model';
import { generateCertificatePdfBuffer } from '../utils/pdfGenerator';

export interface PaymentApprovedEmailData {
  studentName: string;
  studentEmail: string;
  type: 'course' | 'pro_one';
  courseTitle?: string;
  planId?: 'monthly' | 'yearly' | 'lifetime';
  amount: number;
  transactionId: string;
  paymentMethod?: string;
}

export interface SwagDeliveredEmailData {
  studentName: string;
  studentEmail: string;
  rewardTitle: string;
  orderId: string;
  trackingNumber?: string;
  coinsCost: number;
  deliveryAddress?: string;
  city?: string;
  pincode?: string;
}

export interface CareerApplicationEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  roleType: string;
  applicationId: string;
  resumeFileName?: string;
  experienceYears?: string;
  phone?: string;
  appliedAt?: string;
}

export interface CareerShortlistedEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  roleType: string;
  applicationId: string;
  adminNotes?: string;
  nextStepTitle?: string;
}

export interface CareerRejectedEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  roleType: string;
  applicationId: string;
}

export interface CareerInterviewScheduledEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  roleType: string;
  applicationId: string;
  interviewDate: string;
  interviewTime: string;
  interviewMode?: string;
  meetingLink: string;
  panelists: string;
  roundType: string;
  duration?: string;
  agendaOrNotes?: string;
}

export interface SubAdminAppointmentEmailData {
  userName: string;
  userEmail: string;
  assignedPassword?: string;
  assignedByAdminName?: string;
  loginUrl?: string;
}

export interface MentorWelcomeEmailData {
  mentorName: string;
  mentorEmail: string;
  mentorPhone: string;
  role: string;
  assignedPassword: string;
  loginUrl?: string;
  profileUrl?: string;
  skills?: string[];
  exCompanies?: string[];
  quoteTitle?: string;
}

export interface WelcomeEmailData {
  studentName: string;
  studentEmail: string;
  password?: string;
  studentId?: string;
  createdAt?: Date | string;
  authProvider?: string;
}

export interface EmailSendResult {
  success: boolean;
  deliveredVia: 'gmail_smtp' | 'sandbox_console';
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  public async getActiveSmtpCredentials(): Promise<{
    user: string;
    pass: string;
    service: string;
    host: string;
    port: number;
    secure: boolean;
    fromName: string;
  }> {
    let user = (process.env.SMTP_USER || config.smtpUser || '').trim();
    let pass = (process.env.SMTP_PASS || config.smtpPass || '').trim();
    let service = (process.env.SMTP_SERVICE || config.smtpService || 'gmail').toLowerCase();
    let host = process.env.SMTP_HOST || config.smtpHost || 'smtp.gmail.com';
    let port = Number(process.env.SMTP_PORT || config.smtpPort || 465);
    let secure = process.env.SMTP_SECURE !== 'false' && config.smtpSecure !== false;
    let fromName = config.emailFromName || 'NextEra Coders';

    // Check MongoDB PlatformSettings if .env is missing credentials
    if (!user || !pass) {
      try {
        const settings = await PlatformSettings.findOne().lean();
        if (settings?.smtpSettings?.user && settings?.smtpSettings?.pass) {
          user = settings.smtpSettings.user.trim();
          pass = settings.smtpSettings.pass.trim();
          service = (settings.smtpSettings.service || service).toLowerCase();
          host = settings.smtpSettings.host || host;
          port = settings.smtpSettings.port || port;
          secure = settings.smtpSettings.secure !== false;
          fromName = settings.smtpSettings.fromName || fromName;
        }
      } catch (err) {
        // ignore DB read error
      }
    }

    return { user, pass, service, host, port, secure, fromName };
  }

  public async initTransporter(): Promise<{ ready: boolean; error?: string; user?: string }> {
    const creds = await this.getActiveSmtpCredentials();

    if (creds.user && creds.pass) {
      try {
        const cleanPass = creds.pass.replace(/\s+/g, '');

        if (creds.service === 'gmail' || creds.host.includes('gmail')) {
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: creds.user,
              pass: cleanPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
        } else {
          this.transporter = nodemailer.createTransport({
            host: creds.host,
            port: creds.port,
            secure: creds.secure,
            auth: {
              user: creds.user,
              pass: cleanPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
        }

        await this.transporter.verify();
        logger.info(`[EMAIL SERVICE] ✅ Gmail SMTP connected and verified successfully as: ${creds.user}`);
        return { ready: true, user: creds.user };
      } catch (err: any) {
        logger.error(`[EMAIL SERVICE] ❌ SMTP Verification Failed (${creds.user}): ${err.message}`);
        this.transporter = null;
        return { ready: false, error: err.message, user: creds.user };
      }
    } else {
      this.transporter = null;
      return { ready: false, error: 'NO_CREDENTIALS' };
    }
  }

  /**
   * Send Congratulatory Payment Approved Email to Student
   */
  async sendPaymentApprovedEmail(data: PaymentApprovedEmailData): Promise<EmailSendResult> {
    const {
      studentName,
      studentEmail,
      type,
      courseTitle,
      planId,
      amount,
      transactionId,
      paymentMethod = 'UPI QR',
    } = data;

    if (!this.transporter && (process.env.SMTP_HOST || config.smtpHost)) {
      this.initTransporter();
    }

    const itemName =
      type === 'pro_one'
        ? `NEC Pro One (${planId === 'lifetime' ? '3-YEAR ALL-ACCESS' : (planId ? planId.toUpperCase() : 'YEARLY')} PASS)`
        : courseTitle || 'NextEra Coders Pro Track';

    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const dashboardUrl = `${clientUrl}/dashboard`;
    const myLearningUrl = `${clientUrl}/my-learning`;

    const subject = `Congratulations! Your NextEra Coders Pro Access is Approved & Active`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 620px;
      margin: 30px auto;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #d97706 100%);
      padding: 36px 24px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-tagline {
      font-size: 13px;
      color: #fef08a;
      margin-top: 6px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .content {
      padding: 32px 28px;
    }
    .congrats-badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .headline {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 12px 0;
      line-height: 1.3;
    }
    .description {
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 24px;
    }
    .card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #1e293b;
      font-size: 14px;
    }
    .card-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .label {
      color: #94a3b8;
      font-weight: 500;
    }
    .value {
      color: #f8fafc;
      font-weight: 700;
      text-align: right;
    }
    .highlight-value {
      color: #38bdf8;
      font-weight: 800;
    }
    .status-badge {
      color: #34d399;
      background: rgba(16, 185, 129, 0.2);
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
    }
    .perks-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin: 20px 0 12px 0;
    }
    .perks-list {
      list-style: none;
      padding: 0;
      margin: 0 0 28px 0;
    }
    .perks-list li {
      padding: 6px 0;
      font-size: 14px;
      color: #cbd5e1;
      display: flex;
      align-items: center;
    }
    .perks-list li span {
      margin-right: 10px;
      color: #f59e0b;
      font-weight: bold;
    }
    .button-wrap {
      text-align: center;
      margin: 28px 0 16px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      padding: 14px 36px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
      transition: all 0.2s ease;
    }
    .footer {
      background: #0f172a;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #334155;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">NextEra Coders</h1>
      <div class="brand-tagline">LEARN • CODE • BUILD • GROW</div>
    </div>
    <div class="content">
      <div class="congrats-badge">✅ Payment Verified & Approved</div>
      <h2 class="headline">Congratulations, ${studentName}! 🌟</h2>
      <p class="description">
        Great news! Your payment has been successfully verified and approved by the NextEra Coders administration team. 
        Your <strong>Pro Learning Access</strong> has been fully activated on your account.
      </p>

      <div class="card">
        <div class="card-row">
          <span class="label">Item / Plan:</span>
          <span class="value highlight-value">${itemName}</span>
        </div>
        <div class="card-row">
          <span class="label">Amount Paid:</span>
          <span class="value">₹${amount.toLocaleString('en-IN')}</span>
        </div>
        <div class="card-row">
          <span class="label">Transaction Ref (UTR):</span>
          <span class="value font-mono">${transactionId}</span>
        </div>
        <div class="card-row">
          <span class="label">Payment Mode:</span>
          <span class="value">${paymentMethod}</span>
        </div>
        <div class="card-row">
          <span class="label">Access Status:</span>
          <span class="value"><span class="status-badge">ACTIVE & UNLOCKED</span></span>
        </div>
      </div>

      <div class="perks-title">🎁 What is unlocked with your Pro Access:</div>
      <ul class="perks-list">
        <li><span>✨</span> Full Unlimited Access to HD Video Lectures & Player</li>
        <li><span>✨</span> Downloadable Production Source Code & Architecture Blueprints</li>
        <li><span>✨</span> 500+ Curated SDE Problem Sheet with Video Editorials</li>
        <li><span>✨</span> System Design (High-Level & Low-Level) Masterclasses</li>
        <li><span>✨</span> 1-on-1 Senior Tech Mentorship & Code Reviews</li>
        <li><span>✨</span> Official Verified Career Certificate of Completion</li>
      </ul>

      <div class="button-wrap">
        <a href="${dashboardUrl}" class="cta-button" target="_blank">🚀 Launch Learning Dashboard</a>
      </div>
      <p style="text-align: center; font-size: 13px; color: #94a3b8; margin-top: 8px;">
        Or access your courses directly at <a href="${myLearningUrl}" style="color: #818cf8;">${myLearningUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>Thank you for choosing <strong>NextEra Coders</strong> to accelerate your software engineering career.</p>
      <p>If you have any questions or require assistance, please reply directly to this email or reach us at <a href="mailto:support@nexteracoders.com">support@nexteracoders.com</a>.</p>
      <p style="margin-top: 12px; color: #475569;">© ${new Date().getFullYear()} NextEra Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    // 1. Try sending via nodemailer transporter if available
    const initResult = await this.initTransporter();

    if (this.transporter && initResult.ready) {
      try {
        const creds = await this.getActiveSmtpCredentials();
        const fromAddress = creds.user
          ? `"${creds.fromName}" <${creds.user}>`
          : `"${creds.fromName}" <noreply@nexteracoders.com>`;

        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: studentEmail,
          subject,
          html,
        });
        logger.info(`[EMAIL SENT] ✅ Congratulation approval email delivered to ${studentEmail} | Message ID: ${info.messageId}`);
        return {
          success: true,
          deliveredVia: 'gmail_smtp',
          messageId: info.messageId,
        };
      } catch (err: any) {
        logger.error(`[EMAIL ERROR] ❌ Failed to send email via SMTP to ${studentEmail}: ${err.message}`);
        return {
          success: false,
          deliveredVia: 'gmail_smtp',
          error: err.message,
        };
      }
    }

    // 2. Fallback logger for dev/staging when no SMTP credentials
    logger.info(`================================================================`);
    logger.info(`[CONGRATULATION EMAIL LOGGED] (No SMTP credentials configured)`);
    logger.info(`Recipient : ${studentEmail} (${studentName})`);
    logger.info(`Subject   : ${subject}`);
    logger.info(`Item      : ${itemName}`);
    logger.info(`Amount    : ₹${amount} | Ref UTR: ${transactionId}`);
    logger.info(`Status    : ACTIVE & PRO ACCESS UNLOCKED`);
    logger.info(`================================================================`);

    return {
      success: false,
      deliveredVia: 'sandbox_console',
      error: initResult.error || 'SMTP credentials missing (SMTP_USER / SMTP_PASS). In-app notification was delivered to student.',
    };
  }

  /**
   * Send Congratulatory Swag Delivered Email to Student
   */
  async sendSwagDeliveredEmail(data: SwagDeliveredEmailData): Promise<EmailSendResult> {
    const {
      studentName,
      studentEmail,
      rewardTitle,
      orderId,
      trackingNumber,
      coinsCost,
      deliveryAddress = 'Your registered shipping address',
      city = '',
      pincode = '',
    } = data;

    if (!this.transporter && (process.env.SMTP_HOST || config.smtpHost)) {
      this.initTransporter();
    }

    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const storeUrl = `${clientUrl}/rewards`;
    const subject = `🎉 Congratulations! Your NEC Swag Reward "${rewardTitle}" Has Been Delivered!`;

    const destinationText = [deliveryAddress, city, pincode].filter(Boolean).join(', ');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #131d31;
      border: 1px solid #1e293b;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 40%, #047857 100%);
      padding: 36px 24px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-tagline {
      font-size: 12px;
      color: #a7f3d0;
      margin-top: 5px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .content {
      padding: 32px 28px;
    }
    .congrats-badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      color: #34d399;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 6px 14px;
      border-radius: 50px;
      margin-bottom: 18px;
    }
    .main-heading {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 14px 0;
      line-height: 1.3;
    }
    .greeting {
      font-size: 15px;
      color: #94a3b8;
      margin-bottom: 20px;
      line-height: 1.6;
    }
    .receipt-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 22px;
      margin: 24px 0;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #1e293b;
      font-size: 13px;
    }
    .receipt-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .receipt-label {
      color: #64748b;
      font-weight: 500;
    }
    .receipt-value {
      color: #f8fafc;
      font-weight: 700;
      text-align: right;
    }
    .highlight-value {
      color: #fbbf24;
      font-weight: 800;
    }
    .status-badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .btn-cta {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      padding: 14px 34px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
      letter-spacing: 0.5px;
    }
    .footer {
      background: #0b1120;
      border-top: 1px solid #1e293b;
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 38px; margin-bottom: 6px;">📦</div>
      <h1 class="brand-title">NextEra Coders</h1>
      <p class="brand-tagline">OFFICIAL MERCHANDISE & SWAG REWARDS</p>
    </div>

    <div class="content">
      <div class="congrats-badge">✅ PACKAGE DELIVERED</div>
      <h2 class="main-heading">Your Swag Package Has Arrived!</h2>
      <p class="greeting">
        Dear <strong>${studentName}</strong>,<br><br>
        Congratulations on your hard work, daily streaks, and contest achievements! Your official merchandise item <strong>"${rewardTitle}"</strong> has been successfully delivered.
      </p>

      <div class="receipt-card">
        <div class="receipt-row">
          <span class="receipt-label">Order ID</span>
          <span class="receipt-value" style="font-family: monospace; color: #a78bfa;">${orderId}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Merchandise Item</span>
          <span class="receipt-value">${rewardTitle}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Coins Redeemed</span>
          <span class="receipt-value highlight-value">${coinsCost} 🪙 NEC Coins</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Delivery Status</span>
          <span class="receipt-value"><span class="status-badge">DELIVERED</span></span>
        </div>
        ${trackingNumber ? `
        <div class="receipt-row">
          <span class="receipt-label">Courier Tracking ID</span>
          <span class="receipt-value" style="font-family: monospace; color: #34d399;">${trackingNumber}</span>
        </div>` : ''}
        <div class="receipt-row">
          <span class="receipt-label">Destination</span>
          <span class="receipt-value" style="font-size: 12px; max-width: 250px;">${destinationText}</span>
        </div>
      </div>

      <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 0 10px 10px 0; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
          🔥 <strong>Keep the coding momentum going!</strong> Participate in the upcoming Sunday Weekly Contest and maintain your daily streak to earn more NEC Coins for exclusive developer rewards.
        </p>
      </div>

      <div class="btn-container">
        <a href="${storeUrl}" class="btn-cta">Explore NextEra Rewards Store ➔</a>
      </div>
    </div>

    <div class="footer">
      <p>This is an official automated fulfillment notification from NextEra Coders.</p>
      <p>If you have any questions or need support, reach out to us at <a href="mailto:support@nexteracoders.com">support@nexteracoders.com</a>.</p>
      <p style="margin-top: 12px; color: #475569;">© ${new Date().getFullYear()} NextEra Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const initResult = await this.initTransporter();

    if (this.transporter) {
      try {
        const creds = await this.getActiveSmtpCredentials();
        const fromAddress = creds.user
          ? `"${creds.fromName}" <${creds.user}>`
          : `"${creds.fromName}" <noreply@nexteracoders.com>`;

        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: studentEmail,
          subject,
          html,
        });
        logger.info(`[EMAIL SENT] ✅ Swag delivery confirmation email sent to ${studentEmail} | Message ID: ${info.messageId}`);
        return {
          success: true,
          deliveredVia: 'gmail_smtp',
          messageId: info.messageId,
        };
      } catch (err: any) {
        logger.error(`[EMAIL ERROR] ❌ Failed to send swag delivery email to ${studentEmail}: ${err.message}`);
        return {
          success: false,
          deliveredVia: 'gmail_smtp',
          error: err.message,
        };
      }
    }

    logger.info(`================================================================`);
    logger.info(`[SWAG DELIVERED EMAIL LOGGED] (No SMTP credentials configured)`);
    logger.info(`Recipient : ${studentEmail} (${studentName})`);
    logger.info(`Subject   : ${subject}`);
    logger.info(`Item      : ${rewardTitle} | Order: ${orderId}`);
    logger.info(`Coins     : ${coinsCost} 🪙`);
    logger.info(`Status    : DELIVERED`);
    logger.info(`================================================================`);

    return {
      success: false,
      deliveredVia: 'sandbox_console',
      error: initResult.error || 'SMTP credentials missing (SMTP_USER / SMTP_PASS). In-app notification was delivered to student.',
    };
  }

  /**
   * Send 1-Minute Password Reset OTP Email
   */
  async sendPasswordResetOtpEmail(data: {
    studentName: string;
    studentEmail: string;
    otp: string;
    expiresMinutes?: number;
  }): Promise<EmailSendResult> {
    const { studentName, studentEmail, otp, expiresMinutes = 1 } = data;

    if (!this.transporter && (process.env.SMTP_HOST || config.smtpHost)) {
      await this.initTransporter();
    }

    const subject = `🔐 NextEra Coders — Password Reset Verification Code: ${otp}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .container {
      max-width: 580px;
      margin: 24px auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .content {
      padding: 32px 24px;
    }
    .otp-box {
      margin: 28px 0;
      padding: 24px;
      background: #0f172a;
      border: 2px dashed #10b981;
      border-radius: 12px;
      text-align: center;
    }
    .otp-code {
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #34d399;
      font-family: 'Courier New', Courier, monospace;
      margin: 8px 0;
    }
    .timer-alert {
      display: inline-block;
      padding: 6px 14px;
      background: #7f1d1d;
      color: #fecaca;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 10px;
    }
    .footer {
      padding: 20px 24px;
      background: #0b0f19;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
      border-top: 1px solid #1f2937;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">NextEra Coders Security</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #d1fae5;">Account Verification & Password Reset</p>
    </div>

    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Hello <strong>${studentName || 'Coder'}</strong>,</p>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
        We received a request to reset your password for your <strong>NextEra Coders</strong> account (<code>${studentEmail}</code>).
      </p>

      <div class="otp-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700;">
          Your 6-Digit One-Time Password (OTP)
        </div>
        <div class="otp-code">${otp}</div>
        <div class="timer-alert">⏱️ Valid for ${expiresMinutes} Minute (60 Seconds)</div>
      </div>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
        🔒 <strong>Security Warning:</strong> This OTP is strictly confidential. Never share this code with anyone, including NextEra Coders administrators.
      </p>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 16px;">
        If you did not request this password reset, please ignore this email or change your password immediately.
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} NextEra Coders. Learn. Code. Build. All rights reserved.<br>
      Automated Security Notification • Do not reply
    </div>
  </div>
</body>
</html>
    `;

    const initResult = await this.initTransporter();

    if (this.transporter && initResult.ready) {
      try {
        const creds = await this.getActiveSmtpCredentials();
        const fromAddress = creds.user
          ? `"${creds.fromName}" <${creds.user}>`
          : `"${creds.fromName}" <security@nexteracoders.com>`;

        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: studentEmail,
          subject,
          html,
        });

        logger.info(`[EMAIL SENT] ✅ Password reset OTP (${otp}) sent to ${studentEmail} | MsgID: ${info.messageId}`);
        return { success: true, deliveredVia: 'gmail_smtp', messageId: info.messageId };
      } catch (err: any) {
        logger.error(`[EMAIL ERROR] ❌ Failed to send OTP email to ${studentEmail}: ${err.message}`);
        return { success: false, deliveredVia: 'gmail_smtp', error: err.message };
      }
    }

    logger.info(`================================================================`);
    logger.info(`[PASSWORD RESET OTP EMAIL] (Console Delivery / Dev Mode)`);
    logger.info(`Recipient : ${studentEmail} (${studentName})`);
    logger.info(`OTP Code  : ${otp} (⏱️ Valid for 1 Minute / 60s)`);
    logger.info(`Subject   : ${subject}`);
    logger.info(`================================================================`);

    return {
      success: true,
      deliveredVia: 'sandbox_console',
    };
  }

  /**
   * Send Welcome Login / Onboarding Email to Student with NEC Favicon & Credentials
   */
  async sendWelcomeLoginEmail(data: WelcomeEmailData): Promise<EmailSendResult> {
    const { studentName, studentEmail, password, studentId, createdAt, authProvider } = data;

    if (!this.transporter && (process.env.SMTP_HOST || config.smtpHost)) {
      await this.initTransporter();
    }

    const subject = `🚀 Welcome to NextEra Coders, ${studentName}! Ready to Build the Future?`;
    const clientUrl = config.clientUrl || 'http://localhost:5173';

    // Locate official NEC favicon png
    const candidatePaths = [
      path.resolve(__dirname, '../assets/nec-favicon.png'),
      path.resolve(__dirname, '../../src/assets/nec-favicon.png'),
      path.resolve(process.cwd(), 'server/src/assets/nec-favicon.png'),
      path.resolve(process.cwd(), 'src/assets/nec-favicon.png'),
      path.resolve(process.cwd(), 'client/public/images/nec-favicon.png'),
      path.resolve(process.cwd(), 'client/public/favicon.png'),
    ];

    let faviconPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        faviconPath = p;
        break;
      }
    }

    const studentIdFormatted = studentId
      ? `NEC-STD-${studentId.slice(-6).toUpperCase()}`
      : 'NEC-STD-NEW';

    const joinedDateStr = createdAt
      ? new Date(createdAt).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

    const passwordDisplayHtml = password
      ? `<span style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 6px; padding: 2px 8px; font-family: monospace; font-size: 13px; font-weight: 700; color: #a5b4fc; letter-spacing: 0.5px;">${password}</span>`
      : `<span style="color: #94a3b8; font-size: 12px; font-style: italic;">Connected via ${authProvider === 'google' ? 'Google' : authProvider === 'github' ? 'GitHub' : 'Social'} OAuth (Passwordless)</span>`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070b14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #070b14;
      padding: 24px 12px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55);
    }
    .header-banner {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%);
      padding: 24px 20px;
      text-align: center;
      color: #ffffff;
    }
    .btn-primary {
      display: inline-block;
      padding: 13px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14.5px;
      box-shadow: 0 4px 18px rgba(99, 102, 241, 0.45);
      letter-spacing: 0.3px;
    }
    .feature-tile {
      background: #111a2e;
      border: 1px solid #1e2d4d;
      border-radius: 10px;
      padding: 10px 12px;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #070b14;">
  <div class="wrapper">
    <div class="container">
      
      <!-- Top Brand Favicon -->
      <div style="text-align: center; padding: 22px 16px 14px 16px; background: #0b1120;">
        <img src="cid:necfavicon" width="56" height="56" alt="NEC Favicon" style="width: 56px; height: 56px; max-width: 56px; max-height: 56px; object-fit: contain; border-radius: 14px; box-shadow: 0 4px 18px rgba(99, 102, 241, 0.4); border: 2px solid rgba(99, 102, 241, 0.45); background-color: #070b14; padding: 4px; display: inline-block;" />
      </div>

      <!-- Compact Header Banner -->
      <div class="header-banner">
        <div style="display: inline-block; padding: 3px 12px; background: rgba(255, 255, 255, 0.18); border-radius: 9999px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
          ★ Official Developer Fellowship
        </div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.4px; line-height: 1.25;">
          Welcome to NextEra Coders
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #ede9fe; font-weight: 500;">
          Your Developer Account is Activated & Ready!
        </p>
      </div>

      <!-- Main Compact Body -->
      <div style="padding: 22px 20px;">
        
        <!-- Short Interactive Greeting -->
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #cbd5e1; line-height: 1.55;">
          Hi <strong style="color: #ffffff;">${studentName}</strong>, welcome to NextEra Coders! Your official learning workspace has been configured. Below are your account credentials and assigned profile details:
        </p>

        <!-- Credentials & Assigned Info Card -->
        <div style="background: #0b1120; border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);">
          <div style="margin-bottom: 10px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.8px;">
              🔐 Login Credentials & Profile Details
            </span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
            <tr>
              <td style="padding: 5px 0; color: #64748b; width: 130px; font-weight: 600;">Student ID:</td>
              <td style="padding: 5px 0;">
                <span style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 2px 7px; color: #38bdf8; font-weight: 700; font-family: monospace; font-size: 12px;">${studentIdFormatted}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Full Name:</td>
              <td style="padding: 5px 0; color: #f8fafc; font-weight: 600;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Login Email:</td>
              <td style="padding: 5px 0; color: #f8fafc; font-weight: 600; font-family: monospace;">${studentEmail}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Password:</td>
              <td style="padding: 5px 0;">${passwordDisplayHtml}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Assigned Role:</td>
              <td style="padding: 5px 0;">
                <span style="background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 6px; padding: 2px 7px; color: #c084fc; font-weight: 700; font-size: 11.5px;">Student Developer</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Platform Access:</td>
              <td style="padding: 5px 0;">
                <span style="background: rgba(52, 211, 153, 0.12); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 6px; padding: 2px 7px; color: #34d399; font-weight: 700; font-size: 11.5px;">100% Free Lifetime Access</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Joined On:</td>
              <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">${joinedDateStr}</td>
            </tr>
          </table>

          <div style="margin-top: 8px; padding-top: 7px; border-top: 1px dashed #1e293b; font-size: 11px; color: #64748b; line-height: 1.4;">
            💡 <em>Keep your login credentials secure. You can update your password anytime from Profile Settings.</em>
          </div>
        </div>

        <!-- 2x2 Compact Feature Grid (Takes minimal space, clean and interactive) -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 18px;">
          <tr>
            <td style="width: 50%; vertical-align: top;" class="feature-tile">
              <div style="font-size: 12.5px; font-weight: 700; color: #38bdf8; margin-bottom: 2px;">
                💻 Live Compilers
              </div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.35;">
                5+ Languages in browser, zero local setup
              </div>
            </td>
            <td style="width: 50%; vertical-align: top;" class="feature-tile">
              <div style="font-size: 12.5px; font-weight: 700; color: #818cf8; margin-bottom: 2px;">
                📚 Free Tutorials
              </div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.35;">
                Step-by-step developer roadmaps & quizzes
              </div>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; vertical-align: top;" class="feature-tile">
              <div style="font-size: 12.5px; font-weight: 700; color: #34d399; margin-bottom: 2px;">
                ⚡ 1v1 Code Arenas
              </div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.35;">
                Real-time algorithmic duels & leaderboards
              </div>
            </td>
            <td style="width: 50%; vertical-align: top;" class="feature-tile">
              <div style="font-size: 12.5px; font-weight: 700; color: #fbbf24; margin-bottom: 2px;">
                🪙 Coins & Swag
              </div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.35;">
                Daily streaks to earn real developer hoodies
              </div>
            </td>
          </tr>
        </table>

        <!-- Interactive CTA Button -->
        <div style="text-align: center; margin: 20px 0 14px 0;">
          <a href="${clientUrl}/dashboard" class="btn-primary">Launch Learning Workspace →</a>
        </div>

        <!-- Quick Links (Compact Interactive Pills) -->
        <div style="text-align: center; margin-bottom: 6px;">
          <a href="${clientUrl}/tutorials" style="color: #818cf8; text-decoration: none; font-size: 11.5px; margin: 0 6px; font-weight: 600;">📖 Tutorials</a>
          <span style="color: #334155;">•</span>
          <a href="${clientUrl}/dsa" style="color: #818cf8; text-decoration: none; font-size: 11.5px; margin: 0 6px; font-weight: 600;">⚔️ DSA Arena</a>
          <span style="color: #334155;">•</span>
          <a href="${clientUrl}/compiler" style="color: #818cf8; text-decoration: none; font-size: 11.5px; margin: 0 6px; font-weight: 600;">💻 Online Compiler</a>
        </div>

      </div>

      <!-- Compact Footer -->
      <div style="padding: 16px 20px; background: #070b14; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; line-height: 1.5;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #94a3b8;">
          © ${new Date().getFullYear()} NextEra Coders • Empowering Future Tech Architects
        </p>
        <p style="margin: 0; font-size: 10.5px; color: #475569;">
          Questions? Contact us at support@nexteracoders.com
        </p>
      </div>

    </div>
  </div>
</body>
</html>
    `;

    const initResult = await this.initTransporter();

    if (this.transporter && initResult.ready) {
      try {
        const creds = await this.getActiveSmtpCredentials();
        const fromAddress = creds.user
          ? `"${creds.fromName}" <${creds.user}>`
          : `"${creds.fromName}" <hello@nexteracoders.com>`;

        const mailOptions: any = {
          from: fromAddress,
          to: studentEmail,
          subject,
          html,
        };

        if (faviconPath) {
          mailOptions.attachments = [
            {
              filename: 'nec-favicon.png',
              path: faviconPath,
              cid: 'necfavicon',
            },
          ];
        }

        const info = await this.transporter.sendMail(mailOptions);

        logger.info(`[WELCOME EMAIL SENT] ✅ Welcome email delivered to ${studentEmail} | MsgID: ${info.messageId}`);
        return { success: true, deliveredVia: 'gmail_smtp', messageId: info.messageId };
      } catch (err: any) {
        logger.error(`[WELCOME EMAIL ERROR] ❌ Failed to send welcome email to ${studentEmail}: ${err.message}`);
        return { success: false, deliveredVia: 'gmail_smtp', error: err.message };
      }
    }

    logger.info(`[WELCOME EMAIL LOGGED] Recipient: ${studentEmail} (${studentName})`);
    return { success: true, deliveredVia: 'sandbox_console' };
  }

  /**
   * Send "Application Received / Thanks for Applying" Confirmation Email to Candidate
   */
  async sendCareerApplicationReceivedEmail(data: CareerApplicationEmailData): Promise<EmailSendResult> {
    const {
      candidateName,
      candidateEmail,
      jobTitle,
      department,
      roleType,
      applicationId,
      resumeFileName = 'Attached Resume Document',
      experienceYears = 'Candidate Profile',
      appliedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    } = data;

    if (!this.transporter && (process.env.SMTP_HOST || config.smtpHost)) {
      await this.initTransporter();
    }

    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const careersUrl = `${clientUrl}/careers`;

    const subject = `💼 Application Received: ${jobTitle} — Thank You for Applying to NextEra Coders!`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 620px;
      margin: 28px auto;
      background: #111e38;
      border: 1px solid #1e293b;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #1d4ed8 0%, #4f46e5 50%, #7c3aed 100%);
      padding: 38px 24px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-tagline {
      font-size: 12px;
      color: #bfdbfe;
      margin-top: 6px;
      font-weight: 700;
      letter-spacing: 1.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .status-pill {
      display: inline-block;
      background: rgba(59, 130, 246, 0.18);
      border: 1px solid #3b82f6;
      color: #60a5fa;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 18px;
    }
    .headline {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 14px 0;
      line-height: 1.35;
    }
    .description {
      font-size: 14.5px;
      line-height: 1.65;
      color: #cbd5e1;
      margin-bottom: 22px;
    }
    .card {
      background: #0b1329;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 20px;
      margin: 24px 0;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 0;
      border-bottom: 1px solid #172554;
      font-size: 13.5px;
    }
    .card-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .label {
      color: #94a3b8;
      font-weight: 500;
    }
    .value {
      color: #f8fafc;
      font-weight: 700;
      text-align: right;
    }
    .highlight-value {
      color: #38bdf8;
      font-weight: 800;
    }
    .step-box {
      background: rgba(30, 41, 59, 0.6);
      border-left: 3px solid #6366f1;
      border-radius: 0 10px 10px 0;
      padding: 14px 18px;
      margin: 10px 0;
    }
    .step-title {
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 4px;
    }
    .step-desc {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 0;
    }
    .button-wrap {
      text-align: center;
      margin: 30px 0 14px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14.5px;
      padding: 13px 32px;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
    }
    .footer {
      background: #070d1a;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #1e293b;
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 34px; margin-bottom: 6px;">💼</div>
      <h1 class="brand-title">NextEra Coders</h1>
      <div class="brand-tagline">TALENT ACQUISITION & ENGINEERING HIRING</div>
    </div>

    <div class="content">
      <div class="status-pill">✅ Application Received & In Pipeline</div>
      <h2 class="headline">Thank you for applying, ${candidateName}! 🚀</h2>
      <p class="description">
        We have received your application for the <strong>${jobTitle}</strong> position at <strong>NextEra Coders</strong>. 
        We appreciate your interest in building the future of developer tools and interactive computer science education with us.
      </p>

      <div class="card">
        <div class="card-row">
          <span class="label">Position Applied:</span>
          <span class="value highlight-value">${jobTitle}</span>
        </div>
        <div class="card-row">
          <span class="label">Department / Track:</span>
          <span class="value">${department}</span>
        </div>
        <div class="card-row">
          <span class="label">Employment Type:</span>
          <span class="value" style="color: #a78bfa;">${roleType}</span>
        </div>
        <div class="card-row">
          <span class="label">Application Reference:</span>
          <span class="value" style="font-family: monospace; color: #38bdf8;">#${applicationId}</span>
        </div>
        <div class="card-row">
          <span class="label">Resume Logged:</span>
          <span class="value" style="font-size: 12px; color: #34d399;">📄 ${resumeFileName}</span>
        </div>
        <div class="card-row">
          <span class="label">Experience / Background:</span>
          <span class="value">${experienceYears}</span>
        </div>
        <div class="card-row">
          <span class="label">Date Submitted:</span>
          <span class="value">${appliedAt}</span>
        </div>
      </div>

      <div style="margin: 22px 0 14px 0;">
        <h3 style="font-size: 15px; color: #f8fafc; margin-bottom: 12px;">🗺️ What Happens Next?</h3>
        
        <div class="step-box">
          <div class="step-title">1. Engineering & Portfolio Screening (In Progress)</div>
          <p class="step-desc">Our tech leads and talent partners will review your projects, resume, and experience within 2–4 business days.</p>
        </div>

        <div class="step-box">
          <div class="step-title">2. Technical Assessment / Sandbox Challenge</div>
          <p class="step-desc">Shortlisted candidates will be invited to a hands-on coding challenge or take-home system design task.</p>
        </div>

        <div class="step-box">
          <div class="step-title">3. Team Sync & Culture Discussion</div>
          <p class="step-desc">A deep-dive video conversation with our engineering founders and product leads.</p>
        </div>
      </div>

      <div style="background: rgba(99, 102, 241, 0.08); border: 1px dashed rgba(99, 102, 241, 0.3); padding: 14px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 12.5px; color: #cbd5e1;">
          💡 <em>Pro Tip: While you wait, keep your skills sharp by exploring our interactive tutorials and weekly coding challenges.</em>
        </p>
      </div>

      <div class="button-wrap">
        <a href="${careersUrl}" class="cta-button" target="_blank">View Careers & Culture Hub ➔</a>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated acknowledgment sent to <strong>${candidateEmail}</strong> for application #${applicationId}.</p>
      <p>Have questions about your candidacy? Write to our hiring team at <a href="mailto:careers@nexteracoders.com">careers@nexteracoders.com</a>.</p>
      <p style="margin-top: 10px; color: #475569;">© ${new Date().getFullYear()} NextEra Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const initResult = await this.initTransporter();

    if (this.transporter && initResult.ready) {
      try {
        const creds = await this.getActiveSmtpCredentials();
        const fromAddress = creds.user
          ? `"${creds.fromName} Careers" <${creds.user}>`
          : `"${creds.fromName} Careers" <careers@nexteracoders.com>`;

        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: candidateEmail,
          subject,
          html,
        });

        logger.info(`[CAREER EMAIL SENT] ✅ Application confirmation sent to ${candidateEmail} (${candidateName}) for [${jobTitle}] | MsgID: ${info.messageId}`);
        return { success: true, deliveredVia: 'gmail_smtp', messageId: info.messageId };
      } catch (err: any) {
        logger.error(`[CAREER EMAIL ERROR] ❌ Failed to send application confirmation to ${candidateEmail}: ${err.message}`);
        return { success: false, deliveredVia: 'gmail_smtp', error: err.message };
      }
    }

    logger.info(`================================================================`);
    logger.info(`[CAREER APPLICATION CONFIRMATION LOGGED] (Sandbox Console Delivery)`);
    logger.info(`Recipient : ${candidateEmail} (${candidateName})`);
    logger.info(`Role      : ${jobTitle} (${roleType}) | Dept: ${department}`);
    logger.info(`App ID    : #${applicationId} | Resume: ${resumeFileName}`);
    logger.info(`Subject   : ${subject}`);
    logger.info(`================================================================`);

    return { success: true, deliveredVia: 'sandbox_console' };
  }

  /**
   * Send Shortlisted Candidate Congratulations & Next Round Instructions Email
   */
  async sendCareerShortlistedEmail(data: CareerShortlistedEmailData): Promise<EmailSendResult> {
    const {
      candidateName,
      candidateEmail,
      jobTitle,
      department,
      roleType,
      applicationId,
      adminNotes,
      nextStepTitle = 'Technical Sandbox & Engineering Assessment',
    } = data;

    if (!this.transporter && (process.env.SMTP_HOST || config.smtpHost)) {
      await this.initTransporter();
    }

    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const subject = `🎉 Congratulations ${candidateName}! You've Been Shortlisted for ${jobTitle} at NextEra Coders 🚀`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060f1e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 620px;
      margin: 28px auto;
      background: #0f1c34;
      border: 1px solid #1e293b;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 40%, #0d9488 100%);
      padding: 38px 24px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-tagline {
      font-size: 12px;
      color: #a7f3d0;
      margin-top: 6px;
      font-weight: 700;
      letter-spacing: 1.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .badge-congrats {
      display: inline-block;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      color: #34d399;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 6px 16px;
      border-radius: 9999px;
      margin-bottom: 18px;
    }
    .headline {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 14px 0;
      line-height: 1.35;
    }
    .description {
      font-size: 14.5px;
      line-height: 1.65;
      color: #cbd5e1;
      margin-bottom: 22px;
    }
    .card {
      background: #091325;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 20px;
      margin: 22px 0;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 0;
      border-bottom: 1px solid #172554;
      font-size: 13.5px;
    }
    .card-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .label {
      color: #94a3b8;
      font-weight: 500;
    }
    .value {
      color: #f8fafc;
      font-weight: 700;
      text-align: right;
    }
    .notes-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-left: 4px solid #10b981;
      border-radius: 0 12px 12px 0;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .prep-box {
      background: #091325;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 16px;
      margin: 18px 0;
    }
    .button-wrap {
      text-align: center;
      margin: 28px 0 14px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 14.5px;
      padding: 13px 34px;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }
    .footer {
      background: #040914;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #1e293b;
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #34d399;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 38px; margin-bottom: 6px;">🌟</div>
      <h1 class="brand-title">NextEra Coders</h1>
      <div class="brand-tagline">TALENT ACQUISITION & ENGINEERING EXCELLENCE</div>
    </div>

    <div class="content">
      <div class="badge-congrats">🎉 Shortlisted for Next Round</div>
      <h2 class="headline">Congratulations, ${candidateName}! 🚀</h2>
      <p class="description">
        We have great news! After reviewing your application, technical background, and portfolio, our hiring panel and tech leads were <strong>exceptionally impressed</strong>.
        You have been officially <strong>shortlisted</strong> for the position of <strong>${jobTitle}</strong> (${department}).
      </p>

      <div class="card">
        <div class="card-row">
          <span class="label">Position:</span>
          <span class="value" style="color: #34d399;">${jobTitle}</span>
        </div>
        <div class="card-row">
          <span class="label">Department:</span>
          <span class="value">${department}</span>
        </div>
        <div class="card-row">
          <span class="label">Employment Type:</span>
          <span class="value">${roleType}</span>
        </div>
        <div class="card-row">
          <span class="label">Application Reference:</span>
          <span class="value font-mono">#${applicationId}</span>
        </div>
        <div class="card-row">
          <span class="label">Current Status:</span>
          <span class="value"><span style="color: #34d399; background: rgba(16,185,129,0.2); padding: 3px 10px; border-radius: 6px; font-size: 12px;">SHORTLISTED</span></span>
        </div>
      </div>

      ${adminNotes ? `
      <div class="notes-box">
        <div style="font-size: 12px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          💬 Recruiter / Hiring Manager Note:
        </div>
        <div style="font-size: 13.5px; color: #e2e8f0; line-height: 1.6; font-style: italic;">
          "${adminNotes}"
        </div>
      </div>
      ` : ''}

      <div class="prep-box">
        <h4 style="margin: 0 0 10px 0; color: #f8fafc; font-size: 14px;">🎯 Next Stage: ${nextStepTitle}</h4>
        <p style="margin: 0 0 8px 0; font-size: 12.5px; color: #94a3b8; line-height: 1.5;">
          Our talent recruitment team will connect with you via email or phone within <strong>24–48 hours</strong> to schedule your technical interview or share your assessment challenge link.
        </p>
        <ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 12.5px; color: #cbd5e1; line-height: 1.6;">
          <li>Hands-on code walkthrough and architectural discussion.</li>
          <li>Problem-solving in modern JavaScript / TypeScript / Algorithms.</li>
          <li>Overview of our codebase, culture, and high-impact engineering roadmap.</li>
        </ul>
      </div>

      <div class="button-wrap">
        <a href="${clientUrl}/dashboard" class="cta-button" target="_blank">Launch NextEra Workspace ➔</a>
      </div>
    </div>

    <div class="footer">
      <p>Congratulations once again on reaching this milestone! We look forward to speaking with you soon.</p>
      <p>Need to update your contact details or reschedule? Reply to this email or reach us at <a href="mailto:careers@nexteracoders.com">careers@nexteracoders.com</a>.</p>
      <p style="margin-top: 10px; color: #475569;">© ${new Date().getFullYear()} NextEra Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const initResult = await this.initTransporter();

    if (this.transporter && initResult.ready) {
      try {
        const creds = await this.getActiveSmtpCredentials();
        const fromAddress = creds.user
          ? `"${creds.fromName} Hiring Team" <${creds.user}>`
          : `"${creds.fromName} Hiring Team" <careers@nexteracoders.com>`;

        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: candidateEmail,
          subject,
          html,
        });

        logger.info(`[CAREER EMAIL SENT] ✅ Shortlist congratulatory email sent to ${candidateEmail} (${candidateName}) for [${jobTitle}] | MsgID: ${info.messageId}`);
        return { success: true, deliveredVia: 'gmail_smtp', messageId: info.messageId };
      } catch (err: any) {
        logger.error(`[CAREER EMAIL ERROR] ❌ Failed to send shortlist email to ${candidateEmail}: ${err.message}`);
        return { success: false, deliveredVia: 'gmail_smtp', error: err.message };
      }
    }

    logger.info(`================================================================`);
    logger.info(`[CAREER SHORTLIST EMAIL LOGGED] (Sandbox Console Delivery)`);
    logger.info(`Recipient : ${candidateEmail} (${candidateName})`);
    logger.info(`Role      : ${jobTitle} (${roleType}) | Dept: ${department}`);
    logger.info(`App ID    : #${applicationId}`);
    logger.info(`Notes     : ${adminNotes || 'Standard shortlist invitation'}`);
    logger.info(`Subject   : ${subject}`);
    logger.info(`================================================================`);

    return { success: true, deliveredVia: 'sandbox_console' };
  }

  /**
   * Send Warm, Respectful Application Status / Rejection & Talent Pool Email
   */
  async sendCareerRejectedEmail(data: CareerRejectedEmailData): Promise<EmailSendResult> {
    const {
      candidateName,
      candidateEmail,
      jobTitle,
      department,
      roleType,
      applicationId,
    } = data;

    if (!this.transporter && (process.env.SMTP_HOST || config.smtpHost)) {
      await this.initTransporter();
    }

    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const subject = `Update regarding your application for ${jobTitle} at NextEra Coders`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 28px auto;
      background: #131b2e;
      border: 1px solid #1e293b;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #334155 0%, #1e293b 60%, #0f172a 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
      border-bottom: 1px solid #334155;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      font-size: 11.5px;
      color: #94a3b8;
      margin-top: 5px;
      font-weight: 600;
      letter-spacing: 1.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .status-badge {
      display: inline-block;
      background: rgba(148, 163, 184, 0.15);
      border: 1px solid #475569;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      padding: 5px 12px;
      border-radius: 9999px;
      margin-bottom: 18px;
    }
    .headline {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 14px 0;
      line-height: 1.35;
    }
    .description {
      font-size: 14px;
      line-height: 1.65;
      color: #cbd5e1;
      margin-bottom: 18px;
    }
    .talent-box {
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 12px;
      padding: 16px 18px;
      margin: 20px 0;
    }
    .button-wrap {
      text-align: center;
      margin: 26px 0 12px 0;
    }
    .cta-button {
      display: inline-block;
      background: #1e293b;
      border: 1px solid #475569;
      color: #e2e8f0 !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 13.5px;
      padding: 12px 28px;
      border-radius: 10px;
      transition: all 0.2s;
    }
    .footer {
      background: #080c14;
      padding: 22px;
      text-align: center;
      border-top: 1px solid #1e293b;
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">NextEra Coders</h1>
      <div class="brand-tagline">TALENT ACQUISITION TEAM</div>
    </div>

    <div class="content">
      <div class="status-badge">Application Status Update</div>
      <h2 class="headline">Update on your application for ${jobTitle}</h2>
      
      <p class="description">
        Dear <strong>${candidateName}</strong>,
      </p>

      <p class="description">
        Thank you sincerely for taking the time and effort to apply for the <strong>${jobTitle}</strong> (${roleType}) role in our ${department} team (Application #${applicationId}).
      </p>

      <p class="description">
        We received a very high volume of applications from talented engineers across the globe. After careful review and deliberation by our hiring committee, we have decided not to move forward with your candidacy for this particular opening at this time.
      </p>

      <div style="background: rgba(30, 41, 59, 0.5); border-left: 3px solid #64748b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 18px 0;">
        <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.55;">
          Please know that this was a competitive decision influenced by our immediate specialization constraints for this specific role, and is in no way a reflection of your talent, dedication, or potential as a software engineer.
        </p>
      </div>

      <div class="talent-box">
        <h4 style="margin: 0 0 6px 0; color: #60a5fa; font-size: 13.5px;">🤝 NextEra Talent Network</h4>
        <p style="margin: 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.55;">
          We have retained your resume and profile in our internal <strong>Talent Database</strong> for the next 12 months. When new positions open that closely match your skill set and career aspirations, our recruiting leads will reach out to you directly.
        </p>
      </div>

      <p class="description">
        We sincerely appreciate your interest in NextEra Coders and wish you immense success in your engineering journey and upcoming interviews. Keep building, exploring, and learning!
      </p>

      <div class="button-wrap">
        <a href="${clientUrl}/tutorials" class="cta-button" target="_blank">Continue Learning on NextEra Coders ➔</a>
      </div>
    </div>

    <div class="footer">
      <p>This message was sent to <strong>${candidateEmail}</strong> regarding application #${applicationId}.</p>
      <p>Have questions or want to stay in touch? Reach out to us at <a href="mailto:careers@nexteracoders.com">careers@nexteracoders.com</a>.</p>
      <p style="margin-top: 10px; color: #475569;">© ${new Date().getFullYear()} NextEra Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const initResult = await this.initTransporter();

    if (this.transporter && initResult.ready) {
      try {
        const creds = await this.getActiveSmtpCredentials();
        const fromAddress = creds.user
          ? `"${creds.fromName} Hiring Team" <${creds.user}>`
          : `"${creds.fromName} Hiring Team" <careers@nexteracoders.com>`;

        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: candidateEmail,
          subject,
          html,
        });

        logger.info(`[CAREER EMAIL SENT] ✅ Application rejection/update email sent to ${candidateEmail} (${candidateName}) for [${jobTitle}] | MsgID: ${info.messageId}`);
        return { success: true, deliveredVia: 'gmail_smtp', messageId: info.messageId };
      } catch (err: any) {
        logger.error(`[CAREER EMAIL ERROR] ❌ Failed to send status update email to ${candidateEmail}: ${err.message}`);
        return { success: false, deliveredVia: 'gmail_smtp', error: err.message };
      }
    }

    logger.info(`================================================================`);
    logger.info(`[CAREER REJECTION EMAIL LOGGED] (Sandbox Console Delivery)`);
    logger.info(`Recipient : ${candidateEmail} (${candidateName})`);
    logger.info(`Role      : ${jobTitle} (${roleType}) | Dept: ${department}`);
    logger.info(`App ID    : #${applicationId}`);
    logger.info(`Subject   : ${subject}`);
    logger.info(`================================================================`);

    return { success: true, deliveredVia: 'sandbox_console' };
  }

  /**
   * Send Beautiful, High-Impact Interview Invitation Email with Google Meet & Panelist Details
   */
  async sendCareerInterviewScheduledEmail(data: CareerInterviewScheduledEmailData): Promise<EmailSendResult> {
    const {
      candidateName,
      candidateEmail,
      jobTitle,
      department,
      roleType,
      applicationId,
      interviewDate,
      interviewTime,
      interviewMode = 'Google Meet (Online Video Conference)',
      meetingLink,
      panelists,
      roundType = 'Technical & Problem Solving Round',
      duration = '45 - 60 Minutes',
      agendaOrNotes = '',
    } = data;

    if (!this.transporter && (process.env.SMTP_HOST || config.smtpHost)) {
      await this.initTransporter();
    }

    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const subject = `🗓️ Interview Invitation: ${jobTitle} (${roundType}) — NextEra Coders`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #080c14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 620px;
      margin: 28px auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      background: linear-gradient(135deg, #4c1d95 0%, #1e1b4b 50%, #0f172a 100%);
      padding: 36px 24px;
      text-align: center;
      color: #ffffff;
      border-bottom: 1px solid #374151;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      font-size: 11px;
      color: #c4b5fd;
      margin-top: 6px;
      font-weight: 700;
      letter-spacing: 2px;
    }
    .content {
      padding: 32px 28px;
    }
    .badge {
      display: inline-block;
      background: rgba(139, 92, 246, 0.18);
      border: 1px solid rgba(167, 139, 250, 0.4);
      color: #c4b5fd;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 18px;
    }
    .headline {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 12px 0;
      line-height: 1.35;
    }
    .description {
      font-size: 14px;
      line-height: 1.65;
      color: #cbd5e1;
      margin-bottom: 20px;
    }
    .interview-card {
      background: linear-gradient(180deg, rgba(30, 27, 75, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%);
      border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: 16px;
      padding: 22px;
      margin: 24px 0;
    }
    .button-wrap {
      text-align: center;
      margin: 28px 0 16px 0;
    }
    .meet-button {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 14.5px;
      padding: 14px 36px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4);
      letter-spacing: 0.3px;
    }
    .link-box {
      background: rgba(15, 23, 42, 0.7);
      border: 1px dashed #374151;
      border-radius: 10px;
      padding: 12px 14px;
      margin: 16px 0;
      word-break: break-all;
      font-family: monospace;
      font-size: 12px;
      color: #38bdf8;
      text-align: center;
    }
    .agenda-box {
      background: rgba(15, 23, 42, 0.6);
      border-left: 3px solid #8b5cf6;
      border-radius: 0 12px 12px 0;
      padding: 14px 18px;
      margin: 20px 0;
    }
    .agenda-title {
      margin: 0 0 6px 0;
      font-size: 13.5px;
      font-weight: 700;
      color: #c4b5fd;
    }
    .agenda-text {
      margin: 0;
      font-size: 13px;
      line-height: 1.55;
      color: #cbd5e1;
    }
    .prep-list {
      margin: 14px 0 0 0;
      padding-left: 18px;
      font-size: 12.5px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer {
      background: #0b0f19;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #1f2937;
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #a78bfa;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">NextEra Coders</h1>
      <div class="brand-tagline">TECHNICAL HIRING & INTERVIEW COMMITTEE</div>
    </div>

    <div class="content">
      <div class="badge">🗓️ INTERVIEW SCHEDULED • OFFICIAL INVITATION</div>
      <h2 class="headline">Interview Scheduled for ${jobTitle}</h2>
      
      <p class="description">
        Hello <strong>${candidateName}</strong>,
      </p>

      <p class="description">
        We are thrilled with your profile and technical background! We would love to invite you for your next interview round for the <strong>${jobTitle}</strong> (${roleType}) position in our ${department} department.
      </p>

      <!-- Interview Details Card -->
      <div class="interview-card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td style="padding: 9px 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">📅 Date</td>
            <td style="padding: 9px 0; color: #ffffff; font-size: 13.5px; font-weight: 700; text-align: right;">${interviewDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td style="padding: 9px 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">⏰ Time & Slot</td>
            <td style="padding: 9px 0; color: #38bdf8; font-size: 14px; font-weight: 800; text-align: right;">${interviewTime} <span style="font-size: 11.5px; color: #94a3b8;">(${duration})</span></td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td style="padding: 9px 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">🎯 Round Type</td>
            <td style="padding: 9px 0; color: #c4b5fd; font-size: 13.5px; font-weight: 700; text-align: right;">${roundType}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td style="padding: 9px 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">👥 Interviewer(s) / Panel</td>
            <td style="padding: 9px 0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${panelists}</td>
          </tr>
          <tr>
            <td style="padding: 9px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">🎥 Mode / Platform</td>
            <td style="padding: 9px 0 0 0; color: #4ade80; font-size: 13px; font-weight: 700; text-align: right;">${interviewMode}</td>
          </tr>
        </table>
      </div>

      <!-- Prominent Meet Button -->
      <div class="button-wrap">
        <a href="${meetingLink}" class="meet-button" target="_blank">🔗 Join Interview Room (Google Meet) ➔</a>
      </div>

      <div class="link-box">
        Direct Link: <a href="${meetingLink}" style="color: #38bdf8; text-decoration: underline;" target="_blank">${meetingLink}</a>
      </div>

      ${
        agendaOrNotes
          ? `
      <div class="agenda-box">
        <h4 class="agenda-title">📋 Panel Notes & Specific Instructions:</h4>
        <p class="agenda-text">${agendaOrNotes}</p>
      </div>
      `
          : ''
      }

      <!-- Preparation Checklist -->
      <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid #1f2937; border-radius: 12px; padding: 16px; margin: 18px 0;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #e2e8f0; font-weight: 700;">💡 Key Recommendations for the Call:</h4>
        <ul class="prep-list">
          <li>Please ensure a stable internet connection, working webcam, and microphone.</li>
          <li>Join the meeting room <strong>5 minutes early</strong> to test your setup.</li>
          <li>Have your preferred code editor / IDE or browser open for live problem-solving.</li>
          <li>Be prepared to discuss your past projects, architecture decisions, and code samples.</li>
        </ul>
      </div>

      <p class="description" style="font-size: 13px; color: #94a3b8;">
        If you have any scheduling conflicts or need to adjust your time slot, please reply directly to this email or reach us at <a href="mailto:careers@nexteracoders.com" style="color: #c4b5fd;">careers@nexteracoders.com</a> as soon as possible.
      </p>
    </div>

    <div class="footer">
      <p>This interview invitation was sent to <strong>${candidateEmail}</strong> for Application #${applicationId}.</p>
      <p><a href="${clientUrl}/careers" style="color: #a78bfa; text-decoration: none;">NextEra Coders Careers Portal</a> • Empowering the Next Generation of Software Engineers</p>
      <p style="margin-top: 8px; color: #475569;">© ${new Date().getFullYear()} NextEra Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const initResult = await this.initTransporter();

    if (this.transporter && initResult.ready) {
      try {
        const creds = await this.getActiveSmtpCredentials();
        const fromAddress = creds.user
          ? `"${creds.fromName} Hiring Team" <${creds.user}>`
          : `"${creds.fromName} Hiring Team" <careers@nexteracoders.com>`;

        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: candidateEmail,
          subject,
          html,
        });

        logger.info(`[CAREER EMAIL SENT] ✅ Interview scheduled email sent to ${candidateEmail} (${candidateName}) for [${jobTitle}] on ${interviewDate} ${interviewTime} | MsgID: ${info.messageId}`);
        return { success: true, deliveredVia: 'gmail_smtp', messageId: info.messageId };
      } catch (err: any) {
        logger.error(`[CAREER EMAIL ERROR] ❌ Failed to send interview invitation email to ${candidateEmail}: ${err.message}`);
        return { success: false, deliveredVia: 'gmail_smtp', error: err.message };
      }
    }

    logger.info(`================================================================`);
    logger.info(`[CAREER INTERVIEW EMAIL LOGGED] (Sandbox Console Delivery)`);
    logger.info(`Recipient : ${candidateEmail} (${candidateName})`);
    logger.info(`Role      : ${jobTitle} (${roleType}) | Dept: ${department}`);
    logger.info(`Date/Time : ${interviewDate} at ${interviewTime} (${duration})`);
    logger.info(`Meeting   : ${meetingLink}`);
    logger.info(`Panelists : ${panelists}`);
    logger.info(`Round     : ${roundType}`);
    logger.info(`App ID    : #${applicationId}`);
    logger.info(`Subject   : ${subject}`);
    logger.info(`================================================================`);

    return { success: true, deliveredVia: 'sandbox_console' };
  }

  /**
   * Send Multi-Channel Broadcast Announcement Email
   */
  async sendBroadcastAnnouncementEmail(data: {
    studentName: string;
    studentEmail: string;
    title: string;
    message: string;
    link?: string;
    type?: string;
  }): Promise<EmailSendResult> {
    const { studentName, studentEmail, title, message, link, type = 'GENERAL' } = data;
    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const actionUrl = link ? (link.startsWith('http') ? link : `${clientUrl}${link}`) : clientUrl;

    const subject = `📢 ${title} • NextEra Coders`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0; padding: 0; background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0; -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 620px; margin: 30px auto; background: #1e293b;
      border: 1px solid #334155; border-radius: 16px; overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%);
      padding: 34px 24px; text-align: center; color: #ffffff;
    }
    .brand-title {
      font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; text-transform: uppercase;
    }
    .brand-tagline {
      font-size: 13px; color: #e0e7ff; margin-top: 6px; font-weight: 600;
    }
    .content { padding: 32px 28px; }
    .type-badge {
      display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(129, 140, 248, 0.4); color: #a5b4fc; border-radius: 20px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;
    }
    .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 14px; }
    .announcement-title { font-size: 20px; font-weight: 800; color: #38bdf8; margin: 0 0 16px 0; }
    .message-box {
      background: rgba(15, 23, 42, 0.6); border: 1px solid #334155;
      border-radius: 12px; padding: 20px; font-size: 14px; line-height: 1.6;
      color: #cbd5e1; margin-bottom: 24px; white-space: pre-wrap;
    }
    .button-wrap { text-align: center; margin: 28px 0; }
    .action-button {
      display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff !important; padding: 14px 32px; border-radius: 10px;
      font-weight: 700; font-size: 14px; text-decoration: none;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
    }
    .footer {
      background: #0f172a; padding: 20px; text-align: center;
      font-size: 12px; color: #64748b; border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">NextEra Coders</h1>
      <div class="brand-tagline">Official Community & Platform Broadcast</div>
    </div>
    <div class="content">
      <span class="type-badge">📢 ${type}</span>
      <div class="greeting">Hi ${studentName},</div>
      <h2 class="announcement-title">${title}</h2>
      <div class="message-box">${message}</div>
      <div class="button-wrap">
        <a href="${actionUrl}" class="action-button" target="_blank">🔗 View Announcement on NextEra Coders ➔</a>
      </div>
    </div>
    <div class="footer">
      <p>You received this official announcement as a registered student on NextEra Coders.</p>
      <p>© ${new Date().getFullYear()} NextEra Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendGenericHtmlEmail(studentEmail, studentName, subject, html, 'ANNOUNCEMENT');
  }

  /**
   * Send Congratulatory Certificate Earned Email
   */
  async sendCertificateEarnedEmail(data: {
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    courseCategory?: string;
    trackType?: 'free' | 'pro';
    grade?: string;
    certificateId: string;
    verificationUrl: string;
    certificateUrl?: string;
    issueDate: string;
  }): Promise<EmailSendResult> {
    const {
      studentName,
      studentEmail,
      courseTitle,
      trackType = 'pro',
      grade = 'Grade A+ (Honors)',
      certificateId,
      verificationUrl,
      issueDate,
    } = data;

    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const absoluteVerificationUrl = verificationUrl.startsWith('http')
      ? verificationUrl
      : `${clientUrl}${verificationUrl}`;

    let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined;
    try {
      const pdfBuffer = await generateCertificatePdfBuffer({
        studentName,
        courseTitle,
        courseCategory: data.courseCategory,
        trackType,
        grade,
        certificateId,
        verificationUrl: absoluteVerificationUrl,
        issueDate,
      });

      const safeId = certificateId.replace(/[^a-zA-Z0-9_-]/g, '_');
      attachments = [
        {
          filename: `NextEra_Certificate_${safeId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ];
      logger.info(`[CERTIFICATE PDF] ✅ Generated certificate PDF (${pdfBuffer.length} bytes) for ${certificateId}`);
    } catch (pdfErr: any) {
      logger.error(`[CERTIFICATE PDF ERROR] Failed to generate PDF buffer: ${pdfErr?.message}`);
    }

    const subject = `🎓 Congratulations ${studentName}! Your Verified Certificate for "${courseTitle}" is Ready!`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0; padding: 0; background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .container {
      max-width: 620px; margin: 30px auto; background: #1e293b;
      border: 1px solid #334155; border-radius: 16px; overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #d97706 0%, #b45309 30%, #7c3aed 100%);
      padding: 36px 24px; text-align: center; color: #ffffff;
    }
    .gold-badge {
      display: inline-block; padding: 6px 16px; background: rgba(254, 240, 138, 0.2);
      border: 1px solid #fde047; color: #fef08a; border-radius: 20px;
      font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;
    }
    .brand-title { font-size: 26px; font-weight: 900; margin: 0; }
    .content { padding: 32px 28px; }
    .highlight-card {
      background: rgba(15, 23, 42, 0.7); border: 1px solid #475569;
      border-radius: 14px; padding: 22px; margin: 20px 0;
    }
    .table-details { width: 100%; border-collapse: collapse; }
    .table-details td { padding: 8px 0; font-size: 13.5px; }
    .td-label { color: #94a3b8; font-weight: 600; }
    .td-value { color: #f8fafc; font-weight: 700; text-align: right; }
    .button-wrap { text-align: center; margin: 28px 0; }
    .cert-button {
      display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #0f172a !important; padding: 15px 34px; border-radius: 10px;
      font-weight: 800; font-size: 14.5px; text-decoration: none;
      box-shadow: 0 10px 25px rgba(245, 158, 11, 0.35);
    }
    .share-tip {
      background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(129, 140, 248, 0.3);
      border-radius: 12px; padding: 16px; font-size: 13px; color: #c7d2fe;
    }
    .pdf-tip {
      background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 12px; padding: 16px; font-size: 13px; color: #a7f3d0; margin-bottom: 20px;
    }
    .footer {
      background: #0f172a; padding: 20px; text-align: center;
      font-size: 12px; color: #64748b; border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="gold-badge">🏆 VERIFIED CERTIFICATION</div>
      <h1 class="brand-title">NextEra Coders</h1>
      <p style="margin: 6px 0 0 0; color: #fef08a; font-size: 13.5px; font-weight: 600;">Honors Credential Issued</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin: 0 0 12px 0;">Dear <strong>${studentName}</strong>,</p>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
        Heartiest congratulations! You have successfully completed and mastered <strong>${courseTitle}</strong> on NextEra Coders. Your dedication, hard work, and technical problem-solving skills have earned you this verified credential.
      </p>

      <div class="highlight-card">
        <table class="table-details">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td class="td-label">🎓 Course Track</td>
            <td class="td-value" style="color: #38bdf8;">${courseTitle}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td class="td-label">📜 Certificate ID</td>
            <td class="td-value" style="font-family: monospace; color: #fef08a;">${certificateId}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td class="td-label">🎖️ Performance Grade</td>
            <td class="td-value" style="color: #4ade80;">${grade}</td>
          </tr>
          <tr>
            <td class="td-label">📅 Date Issued</td>
            <td class="td-value">${issueDate}</td>
          </tr>
        </table>
      </div>

      <div class="pdf-tip">
        📎 <strong>Official PDF Attached:</strong> Your high-resolution, printable Certificate of Achievement is attached directly to this email as a PDF document (<code>NextEra_Certificate_${certificateId}.pdf</code>). You can download, print, or attach it to job applications!
      </div>

      <div class="button-wrap">
        <a href="${absoluteVerificationUrl}" class="cert-button" target="_blank">📜 View & Verify Your Certificate Online ➔</a>
      </div>

      <div class="share-tip">
        💡 <strong>Pro Tip:</strong> Add your NextEra Coders certificate to your <strong>LinkedIn Profile & Resume</strong> under "Licenses & Certifications" to stand out to top tech recruiters!
      </div>
    </div>
    <div class="footer">
      <p>Verify anytime at: <a href="${absoluteVerificationUrl}" style="color: #93c5fd;">${absoluteVerificationUrl}</a></p>
      <p>© ${new Date().getFullYear()} NextEra Coders Academy. Empowering Software Engineers.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendGenericHtmlEmail(studentEmail, studentName, subject, html, 'CERTIFICATE_EARNED', attachments);
  }

  /**
   * Send 10-Day Inactive User Retention & Comeback Email
   */
  async sendInactiveComebackEmail(data: {
    studentName: string;
    studentEmail: string;
    daysInactive: number;
    lastStreak?: number;
  }): Promise<EmailSendResult> {
    const { studentName, studentEmail, daysInactive, lastStreak } = data;
    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const problemsUrl = `${clientUrl}/problems`;

    const subject = `👋 We miss you at NextEra Coders, ${studentName}! Jump back into code today`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0; padding: 0; background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .container {
      max-width: 620px; margin: 30px auto; background: #1e293b;
      border: 1px solid #334155; border-radius: 16px; overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
      padding: 34px 24px; text-align: center; color: #ffffff;
    }
    .brand-title { font-size: 26px; font-weight: 900; margin: 0; }
    .content { padding: 32px 28px; }
    .stat-pill {
      background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(248, 113, 113, 0.4);
      color: #fca5a5; padding: 4px 14px; border-radius: 20px; font-size: 12px;
      font-weight: 700; display: inline-block; margin-bottom: 16px;
    }
    .perks-box {
      background: rgba(15, 23, 42, 0.6); border: 1px solid #334155;
      border-radius: 12px; padding: 18px; margin: 20px 0;
    }
    .perks-box li { margin-bottom: 8px; font-size: 13.5px; color: #cbd5e1; }
    .button-wrap { text-align: center; margin: 28px 0; }
    .resume-button {
      display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      color: #ffffff !important; padding: 14px 34px; border-radius: 10px;
      font-weight: 700; font-size: 14.5px; text-decoration: none;
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
    }
    .footer {
      background: #0f172a; padding: 20px; text-align: center;
      font-size: 12px; color: #64748b; border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">NextEra Coders</h1>
      <p style="margin: 6px 0 0 0; color: #93c5fd; font-size: 13px; font-weight: 600;">Consistency Is Key To Mastery</p>
    </div>
    <div class="content">
      <span class="stat-pill">⏱️ ${daysInactive} Days Since Last Session</span>
      <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px 0;">Hi ${studentName}, your coding streak misses you!</h2>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        ${
          lastStreak && lastStreak > 1
            ? `You previously achieved an incredible <strong>${lastStreak}-day streak</strong>. Don't let that momentum fade away!`
            : 'Software engineering skills sharpen with every small step. Just 15 minutes of coding today can make all the difference!'
        }
      </p>

      <div class="perks-box">
        <h4 style="margin: 0 0 10px 0; color: #38bdf8; font-size: 14px;">🚀 Here's what's active right now on NextEra Coders:</h4>
        <ul style="padding-left: 20px; margin: 0;">
          <li><strong>Problem of the Day:</strong> Quick algorithmic challenge with +50 bonus coins.</li>
          <li><strong>Weekly Contest:</strong> Every Sunday hands-free contest with live anti-cheat arena.</li>
          <li><strong>Interactive Code Duels:</strong> Challenge friends to real-time 1vs1 speed coding battles.</li>
        </ul>
      </div>

      <div class="button-wrap">
        <a href="${problemsUrl}" class="resume-button" target="_blank">💻 Jump Back Into Coding Now ➔</a>
      </div>
    </div>
    <div class="footer">
      <p>This reminder was sent to <strong>${studentEmail}</strong> to help you stay on track with your goals.</p>
      <p>© ${new Date().getFullYear()} NextEra Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendGenericHtmlEmail(studentEmail, studentName, subject, html, 'INACTIVE_RETENTION');
  }

  /**
   * Dispatch Sub-Admin Appointment and Credential Welcome Email
   */
  public async sendSubAdminAppointmentEmail(data: SubAdminAppointmentEmailData): Promise<EmailSendResult> {
    const {
      userName,
      userEmail,
      assignedPassword,
      assignedByAdminName = 'Super Administrator',
      loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : 'http://localhost:5173/login',
    } = data;

    const subject = `🎉 Congratulations ${userName}! You are appointed as Sub-Admin (Content Manager) at NextEra Coders`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 24px; }
    .container { max-width: 620px; margin: 0 auto; background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #d97706 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 9999px; padding: 6px 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
    .title { margin: 0; font-size: 26px; font-weight: 900; line-height: 1.25; }
    .subtitle { margin: 8px 0 0; font-size: 13.5px; opacity: 0.95; font-weight: 500; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 14px; }
    .desc { font-size: 14px; color: #94a3b8; line-height: 1.65; margin: 0 0 24px; }
    .credentials-box { background: rgba(15, 23, 42, 0.9); border: 1px solid #3b82f6; border-radius: 14px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15); }
    .credentials-header { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #60a5fa; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
    .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 13px; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { color: #94a3b8; font-weight: 500; }
    .cred-val { font-family: monospace; font-weight: 700; color: #f8fafc; background: #030712; padding: 4px 10px; border-radius: 6px; border: 1px solid #334155; }
    .cred-val.highlight { color: #f59e0b; border-color: #f59e0b; font-size: 14px; }
    .responsibilities-box { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 20px; margin-bottom: 24px; }
    .box-title { font-size: 13.5px; font-weight: 700; color: #cbd5e1; margin: 0 0 12px; }
    .resp-list { margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.6; }
    .resp-list li { margin-bottom: 6px; }
    .security-note { background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #fbbf24; margin-bottom: 24px; line-height: 1.5; }
    .btn-wrap { text-align: center; margin: 30px 0 10px; }
    .action-btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4); }
    .footer { background: #030712; border-top: 1px solid #1e293b; padding: 20px; text-align: center; font-size: 11.5px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">NextEra Coders Governance</div>
      <h1 class="title">Welcome to the Team, Sub-Admin! 🚀</h1>
      <p class="subtitle">Platform Content Management & Moderation Privilege Granted</p>
    </div>
    <div class="content">
      <p class="greeting">Hi ${userName},</p>
      <p class="desc">
        Congratulations! You have been officially appointed as a <strong>Sub-Admin (Content Manager)</strong> on NextEra Coders by <strong>${assignedByAdminName}</strong>. 
        You now have special editorial access to build, update, and curate educational content across the entire platform.
      </p>

      <div class="credentials-box">
        <div class="credentials-header">🔐 Your Sub-Admin Access Credentials</div>
        <div class="cred-row">
          <span class="cred-label">Login Email</span>
          <span class="cred-val">${userEmail}</span>
        </div>
        ${
          assignedPassword
            ? `<div class="cred-row">
          <span class="cred-label">Assigned Password</span>
          <span class="cred-val highlight">${assignedPassword}</span>
        </div>`
            : `<div class="cred-row">
          <span class="cred-label">Account Password</span>
          <span class="cred-val">Your Existing Password</span>
        </div>`
        }
        <div class="cred-row">
          <span class="cred-label">Role Assigned</span>
          <span class="cred-val">Sub-Admin (Content Manager)</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Authorized By</span>
          <span class="cred-val">${assignedByAdminName}</span>
        </div>
      </div>

      <div class="responsibilities-box">
        <div class="box-title">📋 What You Have Permission To Do:</div>
        <ul class="resp-list">
          <li><strong>Tutorials & Courses:</strong> Write, update, organize, and publish technical tutorials, courses, and lessons.</li>
          <li><strong>DSA & Problems:</strong> Create problem statements, define test cases, constraints, and hints for practice.</li>
          <li><strong>Quizzes & Contests:</strong> Build questions, organize weekly contests, and schedule monthly competitions.</li>
          <li><strong>Community Moderation:</strong> Help keep community discussions high quality by moderating posts and comments.</li>
        </ul>
      </div>

      <div class="security-note">
        🛡️ <strong>Security Notice:</strong> As a Sub-Admin, all content updates are recorded in administrative audit logs. Your permissions are strictly focused on learning content. Keep your credentials private and never share your password.
      </div>

      <div class="btn-wrap">
        <a href="${loginUrl}" class="action-btn" target="_blank">Login to NextEra Portal ➔</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NextEra Coders. All rights reserved.</p>
      <p>This is an automated administrative notification sent to ${userEmail}.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendGenericHtmlEmail(userEmail, userName, subject, html, 'SUB_ADMIN_APPOINTMENT');
  }

  /**
   * Send Mentor Onboarding & Congratulatory Welcome Email with credentials
   */
  public async sendMentorWelcomeEmail(data: MentorWelcomeEmailData): Promise<EmailSendResult> {
    const {
      mentorName,
      mentorEmail,
      mentorPhone,
      role,
      assignedPassword,
      loginUrl = 'http://localhost:5173/login',
      profileUrl = 'http://localhost:5173',
      skills = [],
      exCompanies = [],
      quoteTitle = 'Transforming Learners into Industry Leaders.',
    } = data;

    const subject = `🎉 Congratulations & Welcome to NextEra Coders Mentorship Network, ${mentorName}!`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 620px;
      margin: 24px auto;
      background: #111827;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #1f2937;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #06b6d4 100%);
      padding: 40px 24px;
      text-align: center;
      color: #ffffff;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 5px 14px;
      border-radius: 9999px;
      margin-bottom: 14px;
    }
    .title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 14px;
      color: #e0e7ff;
      margin: 0;
      font-weight: 500;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
    }
    .desc {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 24px 0;
    }
    .credentials-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .credentials-header {
      font-size: 13px;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cred-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #1e293b;
      font-size: 14px;
    }
    .cred-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .cred-label {
      color: #94a3b8;
      font-weight: 500;
    }
    .cred-val {
      color: #f8fafc;
      font-weight: 700;
      font-family: monospace;
      font-size: 13.5px;
    }
    .cred-val.highlight {
      color: #10b981;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .info-card {
      background: #1e1b4b/40;
      border: 1px solid #4338ca/30;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 24px;
    }
    .info-title {
      font-size: 13px;
      font-weight: 700;
      color: #a5b4fc;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    }
    .info-detail {
      font-size: 13.5px;
      color: #cbd5e1;
      line-height: 1.5;
      margin: 4px 0;
    }
    .security-note {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 10px;
      padding: 14px 16px;
      font-size: 13px;
      color: #fbbf24;
      line-height: 1.5;
      margin-bottom: 28px;
    }
    .btn-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: center;
      margin-top: 10px;
    }
    .action-btn {
      display: block;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 15px;
      padding: 14px 24px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }
    .secondary-btn {
      display: block;
      background: #1f2937;
      color: #cbd5e1 !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 13.5px;
      padding: 11px 20px;
      border-radius: 8px;
      border: 1px solid #374151;
      margin-top: 8px;
    }
    .footer {
      background: #0b0f19;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #1f2937;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">NextEra Coders • Elite Mentorship Network</div>
      <h1 class="title">Congratulations, ${mentorName}! 🌟</h1>
      <p class="subtitle">Official Mentor & Engineering Instructor Onboarding</p>
    </div>
    <div class="content">
      <p class="greeting">Dear ${mentorName},</p>
      <p class="desc">
        We are thrilled to welcome you as a featured <strong>Mentor & Technical Coach</strong> at NextEra Coders! Your profile is now live and published on our platform. Aspiring developers and engineers will now be able to follow you, learn from your industry expertise, and enroll in your guided programs.
      </p>

      <div class="credentials-box">
        <div class="credentials-header">🔐 Your Mentor Access Credentials</div>
        <div class="cred-row">
          <span class="cred-label">Login Email</span>
          <span class="cred-val">${mentorEmail}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Assigned Password</span>
          <span class="cred-val highlight">${assignedPassword}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Registered Phone</span>
          <span class="cred-val">${mentorPhone}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Assigned Role</span>
          <span class="cred-val">Mentor & Engineering Instructor</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Public Designation</span>
          <span class="cred-val">${role}</span>
        </div>
      </div>

      <div class="info-card">
        <div class="info-title">📋 Your Mentor Profile Summary</div>
        <div class="info-detail"><strong>Inspiring Headline:</strong> ${quoteTitle}</div>
        ${exCompanies.length ? `<div class="info-detail"><strong>Ex-Companies:</strong> ${exCompanies.join(' & ')}</div>` : ''}
        ${skills.length ? `<div class="info-detail"><strong>Core Skills / Focus:</strong> ${skills.join(', ')}</div>` : ''}
      </div>

      <div class="security-note">
        🛡️ <strong>Getting Started & Password Notice:</strong> Use the login email and auto-generated password above to sign in for the first time. Once logged in, you can update your bio, social handles, view your followers, and safely change your password to a personal one in your profile settings.
      </div>

      <div class="btn-wrap">
        <a href="${loginUrl}" class="action-btn" target="_blank">Login to Mentor Portal ➔</a>
        <a href="${profileUrl}" class="secondary-btn" target="_blank">View Your Public Profile ➔</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NextEra Coders. Transforming Learners into Industry Leaders.</p>
      <p>This automated message was sent to ${mentorEmail}. If you have questions, please reach out to admin support.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendGenericHtmlEmail(mentorEmail, mentorName, subject, html, 'MENTOR_ONBOARDING');
  }

  /**
   * Helper to dispatch generic HTML email with SMTP or Sandbox Console fallback
   */
  private async sendGenericHtmlEmail(
    toEmail: string,
    toName: string,
    subject: string,
    html: string,
    context: string,
    attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>
  ): Promise<EmailSendResult> {
    const initResult = await this.initTransporter();

    if (this.transporter && initResult.ready) {
      try {
        const creds = await this.getActiveSmtpCredentials();
        const fromAddress = creds.user
          ? `"${creds.fromName}" <${creds.user}>`
          : `"${creds.fromName}" <no-reply@nexteracoders.com>`;

        const mailOptions: nodemailer.SendMailOptions = {
          from: fromAddress,
          to: toEmail,
          subject,
          html,
        };

        if (attachments && attachments.length > 0) {
          mailOptions.attachments = attachments;
        }

        const info = await this.transporter.sendMail(mailOptions);

        logger.info(`[EMAIL SENT] ✅ ${context} email sent to ${toEmail} (${toName})${attachments?.length ? ` with ${attachments.length} attachment(s)` : ''} | MsgID: ${info.messageId}`);
        return { success: true, deliveredVia: 'gmail_smtp', messageId: info.messageId };
      } catch (err: any) {
        logger.error(`[EMAIL ERROR] ❌ Failed to send ${context} email to ${toEmail}: ${err.message}`);
        return { success: false, deliveredVia: 'gmail_smtp', error: err.message };
      }
    }

    logger.info(`================================================================`);
    logger.info(`[EMAIL LOGGED] (Sandbox Console Delivery - ${context})`);
    logger.info(`Recipient : ${toEmail} (${toName})`);
    logger.info(`Subject   : ${subject}`);
    logger.info(`Context   : ${context}`);
    if (attachments && attachments.length > 0) {
      logger.info(`Attach    : ${attachments.map((a) => a.filename).join(', ')}`);
    }
    logger.info(`Status    : Simulated (SMTP not connected or sandbox mode)`);
    logger.info(`================================================================`);

    return { success: true, deliveredVia: 'sandbox_console' };
  }
}

export const emailService = new EmailService();

