import { logger } from '../utils/logger';
import { config } from '../config/env';

export interface WhatsAppSendResult {
  success: boolean;
  deliveredVia: 'cloud_api' | 'twilio' | 'sandbox_console';
  messageId?: string;
  error?: string;
  waMeLink?: string;
}

export interface WhatsAppAnnouncementData {
  name: string;
  phone: string;
  title: string;
  message: string;
  link?: string;
  type?: string;
}

export interface WhatsAppCertificateData {
  studentName: string;
  phone: string;
  courseTitle: string;
  certificateId: string;
  verificationUrl: string;
}

export interface WhatsAppInactiveComebackData {
  studentName: string;
  phone: string;
  daysInactive: number;
  lastStreak?: number;
}

class WhatsAppService {
  /**
   * Format and normalize phone numbers for WhatsApp API / wa.me
   * Defaults to +91 (India) if 10 digits are provided
   */
  public normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    digits = digits.replace(/^0+/, '');
    if (digits.length === 10) {
      digits = '91' + digits;
    }
    return digits;
  }

  /**
   * Generate Click-to-Chat direct WhatsApp URL
   */
  public generateClickToChatLink(phone: string, text: string): string {
    const cleanPhone = this.normalizePhoneNumber(phone);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Send WhatsApp Announcement Broadcast
   */
  public async sendAnnouncementWhatsApp(data: WhatsAppAnnouncementData): Promise<WhatsAppSendResult> {
    const { name, phone, title, message, link } = data;
    const cleanPhone = this.normalizePhoneNumber(phone);
    if (!cleanPhone) {
      return { success: false, deliveredVia: 'sandbox_console', error: 'Invalid phone number' };
    }

    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const actionUrl = link ? (link.startsWith('http') ? link : `${clientUrl}${link}`) : clientUrl;

    const formattedText = 
`📢 *NextEra Coders Alert* 🚀
━━━━━━━━━━━━━━━━━━━━━
Hi *${name}*,

*${title}*

${message}

🔗 *Jump In:* ${actionUrl}
━━━━━━━━━━━━━━━━━━━━━
_NextEra Coders • Empowering the Next Generation of Engineers_`;

    return this.dispatchMessage(cleanPhone, formattedText, 'ANNOUNCEMENT', name);
  }

  /**
   * Send Congratulatory Certificate Earned WhatsApp Message
   */
  public async sendCertificateEarnedWhatsApp(data: WhatsAppCertificateData): Promise<WhatsAppSendResult> {
    const { studentName, phone, courseTitle, certificateId, verificationUrl } = data;
    const cleanPhone = this.normalizePhoneNumber(phone);
    if (!cleanPhone) {
      return { success: false, deliveredVia: 'sandbox_console', error: 'Invalid phone number' };
    }

    const formattedText = 
`🎓 *CONGRATULATIONS, ${studentName.toUpperCase()}!* 🎉
━━━━━━━━━━━━━━━━━━━━━
You have officially earned your verified certificate for:
🏆 *${courseTitle}*

📜 *Certificate ID:* \`${certificateId}\`
🎖️ *Honors:* Grade A+ (Honors)
📅 *Status:* Verified & Globally Shareable

🔗 *View & Download Your Certificate:*
${verificationUrl}

_Add this verified achievement to your LinkedIn profile and resume!_ 🚀
━━━━━━━━━━━━━━━━━━━━━
_NextEra Coders Team_`;

    return this.dispatchMessage(cleanPhone, formattedText, 'CERTIFICATE_EARNED', studentName);
  }

  /**
   * Send 10-Day Inactive User "Come Back" WhatsApp Reminder
   */
  public async sendInactiveComebackWhatsApp(data: WhatsAppInactiveComebackData): Promise<WhatsAppSendResult> {
    const { studentName, phone, daysInactive, lastStreak } = data;
    const cleanPhone = this.normalizePhoneNumber(phone);
    if (!cleanPhone) {
      return { success: false, deliveredVia: 'sandbox_console', error: 'Invalid phone number' };
    }

    const clientUrl = config.clientUrl || 'http://localhost:5173';
    const streakText = lastStreak && lastStreak > 1 ? ` (You had a solid *${lastStreak}-day* streak!)` : '';

    const formattedText = 
`👋 *We Miss You at NextEra Coders, ${studentName}!* 💻
━━━━━━━━━━━━━━━━━━━━━
It has been *${daysInactive} days* since your last coding activity${streakText}.

Consistency is what makes great engineers. Don't let your problem-solving momentum pause!

✨ *What's waiting for you today:*
• ⚡ *Daily Coding Challenge (POTD)*: +50 Coins Bounty
• 🏆 *Sunday Weekly Contest*: Test your skills against top peers
• 🚀 *New Interactive Tutorials*: Master Data Structures & System Design

🔗 *Resume Learning Now:*
${clientUrl}/problems

_Keep coding, your dream career is built day by day!_ 💪
━━━━━━━━━━━━━━━━━━━━━
_NextEra Coders Mentorship Team_`;

    return this.dispatchMessage(cleanPhone, formattedText, 'INACTIVE_RETENTION', studentName);
  }

  /**
   * Dispatch via Meta WhatsApp Cloud API / Twilio or Sandbox Console
   */
  private async dispatchMessage(
    cleanPhone: string,
    text: string,
    context: string,
    recipientName: string
  ): Promise<WhatsAppSendResult> {
    const waMeLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

    // 1. Check Meta WhatsApp Cloud API
    const metaToken = process.env.WHATSAPP_TOKEN || process.env.META_WA_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WA_PHONE_ID;

    if (metaToken && metaPhoneId) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${metaToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: cleanPhone,
              type: 'text',
              text: { preview_url: true, body: text },
            }),
          }
        );

        const data = (await response.json()) as any;
        const msgId = data?.messages?.[0]?.id;
        if (response.ok) {
          logger.info(`[WHATSAPP SENT] ✅ Delivered via Meta Cloud API to +${cleanPhone} (${recipientName}) [${context}] MsgID: ${msgId}`);
          return { success: true, deliveredVia: 'cloud_api', messageId: msgId, waMeLink };
        } else {
          logger.error(`[WHATSAPP ERROR] ❌ Meta Cloud API returned error: ${data?.error?.message || response.statusText}`);
        }
      } catch (err: any) {
        logger.error(`[WHATSAPP ERROR] ❌ Meta Cloud API failed for +${cleanPhone}: ${err.message}`);
        // Fall back to sandbox logging
      }
    }

    // 2. Check Twilio WhatsApp
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

    if (twilioSid && twilioAuth && twilioFrom) {
      try {
        const authHeader = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
        const params = new URLSearchParams();
        params.append('From', twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`);
        params.append('To', `whatsapp:+${cleanPhone}`);
        params.append('Body', text);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${authHeader}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        const data = (await response.json()) as any;
        const msgId = data?.sid;
        if (response.ok) {
          logger.info(`[WHATSAPP SENT] ✅ Delivered via Twilio WhatsApp to +${cleanPhone} (${recipientName}) [${context}] SID: ${msgId}`);
          return { success: true, deliveredVia: 'twilio', messageId: msgId, waMeLink };
        } else {
          logger.error(`[WHATSAPP ERROR] ❌ Twilio WhatsApp returned error: ${data?.message || response.statusText}`);
        }
      } catch (err: any) {
        logger.error(`[WHATSAPP ERROR] ❌ Twilio WhatsApp failed for +${cleanPhone}: ${err.message}`);
      }
    }

    // 3. Fallback: Dual-Mode Sandbox Console & Simulator
    logger.info(`================================================================`);
    logger.info(`[WHATSAPP SANDBOX BROADCAST] (Simulated Delivery)`);
    logger.info(`Recipient : +${cleanPhone} (${recipientName})`);
    logger.info(`Context   : ${context}`);
    logger.info(`Click2Chat: ${waMeLink}`);
    logger.info(`Message   :\n${text}`);
    logger.info(`================================================================`);

    return {
      success: true,
      deliveredVia: 'sandbox_console',
      messageId: `sim-wa-${Date.now()}`,
      waMeLink,
    };
  }
}

export const whatsappService = new WhatsAppService();
