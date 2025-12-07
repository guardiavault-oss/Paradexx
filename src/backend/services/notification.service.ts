// Notification Service - Email, Push, SMS, In-app
// Supports Resend (primary) and SendGrid (fallback)

import nodemailer from 'nodemailer';
import { logger } from '../services/logger.service';
import axios from 'axios';

// Email providers
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@paradex.trade';

// Other notification providers
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

// Email provider type
type EmailProvider = 'resend' | 'sendgrid' | 'console';
const EMAIL_PROVIDER: EmailProvider = RESEND_API_KEY ? 'resend' : (SENDGRID_API_KEY ? 'sendgrid' : 'console');

if (EMAIL_PROVIDER === 'console') {
  logger.warn('⚠️ Email Service: No email provider configured (RESEND_API_KEY or SENDGRID_API_KEY) - using console logging');
} else {
  logger.info(`✅ Email Service: Using ${EMAIL_PROVIDER}`);
}

export interface NotificationOptions {
  userId: string;
  type: NotificationType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels: NotificationChannel[];
  data: any;
}

export type NotificationType =
  | 'transaction_confirmed'
  | 'transaction_failed'
  | 'price_alert'
  | 'security_alert'
  | 'guardian_request'
  | 'guardian_approved'
  | 'recovery_initiated'
  | 'wallet_locked'
  | 'large_transaction'
  | 'approval_detected'
  | 'phishing_detected'
  | 'whale_alert';

export type NotificationChannel = 'email' | 'push' | 'sms' | 'in-app';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    // Setup email transporter based on provider
    if (EMAIL_PROVIDER === 'sendgrid' && SENDGRID_API_KEY) {
      this.emailTransporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: SENDGRID_API_KEY,
        },
      });
    }
    // Resend uses direct API, no SMTP transporter needed
  }

  // Send notification
  async send(options: NotificationOptions): Promise<void> {
    const promises: Promise<any>[] = [];

    // Send to each channel
    for (const channel of options.channels) {
      switch (channel) {
        case 'email':
          promises.push(this.sendEmail(options));
          break;
        case 'push':
          promises.push(this.sendPush(options));
          break;
        case 'sms':
          promises.push(this.sendSMS(options));
          break;
        case 'in-app':
          promises.push(this.sendInApp(options));
          break;
      }
    }

    await Promise.allSettled(promises);
  }

  // Send email notification
  private async sendEmail(options: NotificationOptions): Promise<void> {
    try {
      const template = this.getEmailTemplate(options.type, options.data);
      const user = await this.getUser(options.userId);

      if (!user.email) {
        throw new Error('User has no email address');
      }

      // Use appropriate provider
      if (EMAIL_PROVIDER === 'resend' && RESEND_API_KEY) {
        await this.sendWithResend(user.email, template);
      } else if (EMAIL_PROVIDER === 'sendgrid' && this.emailTransporter) {
        await this.emailTransporter.sendMail({
          from: FROM_EMAIL,
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });
      } else {
        // Console logging fallback
        logger.info(`[EMAIL-CONSOLE] To: ${user.email}`);
        logger.info(`[EMAIL-CONSOLE] Subject: ${template.subject}`);
        logger.info(`[EMAIL-CONSOLE] Body: ${template.text}`);
        return;
      }

      logger.info(`Email sent to ${user.email}: ${options.type}`);
    } catch (error) {
      logger.error('Email error:', error);
      throw error;
    }
  }

  // Send email via Resend API
  private async sendWithResend(to: string, template: EmailTemplate): Promise<void> {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: FROM_EMAIL,
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text,
      },
      {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Resend API error: ${response.status}`);
    }
  }

  // Send push notification (OneSignal)
  private async sendPush(options: NotificationOptions): Promise<void> {
    try {
      const message = this.getPushMessage(options.type, options.data);

      await axios.post(
        'https://onesignal.com/api/v1/notifications',
        {
          app_id: ONESIGNAL_APP_ID,
          include_external_user_ids: [options.userId],
          headings: { en: message.title },
          contents: { en: message.body },
          data: options.data,
          priority: options.priority === 'critical' ? 10 : 5,
        },
        {
          headers: {
            Authorization: `Basic ${ONESIGNAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Push sent to user ${options.userId}: ${options.type}`);
    } catch (error) {
      logger.error('Push notification error:', error);
      throw error;
    }
  }

  // Send SMS (Twilio)
  private async sendSMS(options: NotificationOptions): Promise<void> {
    try {
      const user = await this.getUser(options.userId);

      if (!user.phone) {
        throw new Error('User has no phone number');
      }

      const message = this.getSMSMessage(options.type, options.data);

      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        new URLSearchParams({
          To: user.phone,
          From: TWILIO_PHONE!,
          Body: message,
        }),
        {
          auth: {
            username: TWILIO_ACCOUNT_SID!,
            password: TWILIO_AUTH_TOKEN!,
          },
        }
      );

      logger.info(`SMS sent to ${user.phone}: ${options.type}`);
    } catch (error) {
      logger.error('SMS error:', error);
      throw error;
    }
  }

  // Send in-app notification
  private async sendInApp(options: NotificationOptions): Promise<void> {
    try {
      // Store in database for in-app display
      // In production: Use WebSocket to push real-time

      // TODO: Implement in-app notification storage
      logger.info(`In-app notification queued for user ${options.userId}: ${options.type}`);
    } catch (error) {
      logger.error('In-app notification error:', error);
      throw error;
    }
  }

  // Get email template
  private getEmailTemplate(type: NotificationType, data: any): EmailTemplate {
    const templates: Record<NotificationType, (data: any) => EmailTemplate> = {
      transaction_confirmed: (d) => ({
        subject: '✅ Transaction Confirmed',
        html: `
          <h2>Transaction Confirmed</h2>
          <p>Your transaction has been confirmed on the blockchain.</p>
          <p><strong>Hash:</strong> ${d.hash}</p>
          <p><strong>Amount:</strong> ${d.amount} ${d.token}</p>
          <p><a href="https://etherscan.io/tx/${d.hash}">View on Etherscan</a></p>
        `,
        text: `Transaction Confirmed\n\nHash: ${d.hash}\nAmount: ${d.amount} ${d.token}`,
      }),

      transaction_failed: (d) => ({
        subject: '❌ Transaction Failed',
        html: `
          <h2>Transaction Failed</h2>
          <p>Your transaction failed and was reverted.</p>
          <p><strong>Hash:</strong> ${d.hash}</p>
          <p><strong>Reason:</strong> ${d.reason}</p>
          <p>Your funds are safe. Please try again.</p>
        `,
        text: `Transaction Failed\n\nHash: ${d.hash}\nReason: ${d.reason}`,
      }),

      price_alert: (d) => ({
        subject: `📈 Price Alert: ${d.token}`,
        html: `
          <h2>Price Alert Triggered</h2>
          <p>${d.token} has ${d.condition} your target price.</p>
          <p><strong>Current Price:</strong> $${d.currentPrice}</p>
          <p><strong>Target Price:</strong> $${d.targetPrice}</p>
        `,
        text: `Price Alert: ${d.token} ${d.condition} $${d.targetPrice}`,
      }),

      security_alert: (d) => ({
        subject: '🚨 Security Alert',
        html: `
          <h2>Security Alert</h2>
          <p style="color: red;"><strong>${d.message}</strong></p>
          <p>If this wasn't you, please secure your account immediately.</p>
          <p><a href="https://app.paradex.trade/security">Review Security Settings</a></p>
        `,
        text: `Security Alert: ${d.message}`,
      }),

      guardian_request: (d) => ({
        subject: '👥 Guardian Invitation',
        html: `
          <h2>You've Been Invited as a Guardian</h2>
          <p>${d.inviterName} has invited you to be a guardian for their Paradex wallet.</p>
          <p>As a guardian, you'll help them recover their wallet if they lose access.</p>
          <p><a href="${d.inviteLink}">Accept Invitation</a></p>
        `,
        text: `Guardian Invitation from ${d.inviterName}\n\nAccept: ${d.inviteLink}`,
      }),

      guardian_approved: (d) => ({
        subject: '✅ Guardian Approved Recovery',
        html: `
          <h2>Guardian Approved Recovery</h2>
          <p>${d.guardianName} has approved your recovery request.</p>
          <p><strong>Approvals:</strong> ${d.approvalCount} of ${d.requiredApprovals}</p>
          ${d.canExecute ? '<p><a href="https://app.paradex.trade/recovery">Execute Recovery</a></p>' : ''}
        `,
        text: `Guardian ${d.guardianName} approved recovery. ${d.approvalCount}/${d.requiredApprovals} approvals.`,
      }),

      recovery_initiated: (d) => ({
        subject: '⚠️ Recovery Request Initiated',
        html: `
          <h2>Recovery Request Initiated</h2>
          <p>A recovery request has been initiated for your wallet.</p>
          <p><strong>Time Lock:</strong> ${d.timelock} days</p>
          <p>If this wasn't you, dispute it immediately.</p>
          <p><a href="https://app.paradex.trade/recovery">View Request</a></p>
        `,
        text: `Recovery request initiated. Time lock: ${d.timelock} days.`,
      }),

      wallet_locked: (d) => ({
        subject: '🔒 Wallet Locked',
        html: `
          <h2>Wallet Locked</h2>
          <p>Your wallet has been locked due to inactivity.</p>
          <p>Please unlock it with your biometric or PIN.</p>
        `,
        text: 'Your wallet has been locked due to inactivity.',
      }),

      large_transaction: (d) => ({
        subject: '💰 Large Transaction Detected',
        html: `
          <h2>Large Transaction Detected</h2>
          <p>A transaction over ${d.threshold} ETH was detected.</p>
          <p><strong>Amount:</strong> ${d.amount} ${d.token}</p>
          <p><strong>To:</strong> ${d.to}</p>
          <p>If this wasn't you, cancel it immediately.</p>
        `,
        text: `Large transaction detected: ${d.amount} ${d.token}`,
      }),

      approval_detected: (d) => ({
        subject: '⚠️ Token Approval Detected',
        html: `
          <h2>Token Approval Detected</h2>
          <p>An approval for ${d.token} was detected.</p>
          <p><strong>Spender:</strong> ${d.spender}</p>
          <p><strong>Amount:</strong> ${d.amount === 'unlimited' ? 'Unlimited ⚠️' : d.amount}</p>
          <p><a href="https://app.paradex.trade/approvals">Manage Approvals</a></p>
        `,
        text: `Token approval: ${d.token} for ${d.spender}`,
      }),

      phishing_detected: (d) => ({
        subject: '🚨 Phishing Site Detected',
        html: `
          <h2>Phishing Site Detected</h2>
          <p style="color: red;">You attempted to connect to a known phishing site.</p>
          <p><strong>URL:</strong> ${d.url}</p>
          <p>Connection was blocked for your safety.</p>
        `,
        text: `Phishing detected: ${d.url}`,
      }),

      whale_alert: (d) => ({
        subject: '🐋 Whale Alert',
        html: `
          <h2>Whale Movement Detected</h2>
          <p>A whale moved ${d.amount} ${d.token}.</p>
          <p><strong>From:</strong> ${d.from}</p>
          <p><strong>To:</strong> ${d.to}</p>
          <p>This might affect the price.</p>
        `,
        text: `Whale alert: ${d.amount} ${d.token} moved`,
      }),
    };

    return templates[type](data);
  }

  // Get push message
  private getPushMessage(
    type: NotificationType,
    data: any
  ): { title: string; body: string } {
    const messages: Record<NotificationType, (data: any) => { title: string; body: string }> = {
      transaction_confirmed: (d) => ({
        title: 'Transaction Confirmed',
        body: `${d.amount} ${d.token} sent successfully`,
      }),
      transaction_failed: (d) => ({
        title: 'Transaction Failed',
        body: d.reason,
      }),
      price_alert: (d) => ({
        title: `${d.token} Price Alert`,
        body: `${d.condition} $${d.targetPrice}`,
      }),
      security_alert: (d) => ({
        title: 'Security Alert',
        body: d.message,
      }),
      guardian_request: (d) => ({
        title: 'Guardian Invitation',
        body: `${d.inviterName} invited you as a guardian`,
      }),
      guardian_approved: (d) => ({
        title: 'Guardian Approved',
        body: `${d.guardianName} approved your recovery`,
      }),
      recovery_initiated: (d) => ({
        title: 'Recovery Initiated',
        body: `${d.timelock} day time lock started`,
      }),
      wallet_locked: () => ({
        title: 'Wallet Locked',
        body: 'Unlock to continue',
      }),
      large_transaction: (d) => ({
        title: 'Large Transaction',
        body: `${d.amount} ${d.token} detected`,
      }),
      approval_detected: (d) => ({
        title: 'Approval Detected',
        body: `${d.token} approved for ${d.spender}`,
      }),
      phishing_detected: (d) => ({
        title: 'Phishing Blocked',
        body: 'Connection to scam site blocked',
      }),
      whale_alert: (d) => ({
        title: 'Whale Alert',
        body: `${d.amount} ${d.token} moved`,
      }),
    };

    return messages[type](data);
  }

  // Get SMS message
  private getSMSMessage(type: NotificationType, data: any): string {
    const messages: Record<NotificationType, (data: any) => string> = {
      transaction_confirmed: (d) => `Paradex: Transaction confirmed. ${d.amount} ${d.token} sent.`,
      transaction_failed: (d) => `Paradex: Transaction failed. ${d.reason}`,
      price_alert: (d) => `Paradex: ${d.token} ${d.condition} $${d.targetPrice}`,
      security_alert: (d) => `Paradex SECURITY ALERT: ${d.message}`,
      guardian_request: (d) => `Paradex: ${d.inviterName} invited you as a guardian.`,
      guardian_approved: (d) => `Paradex: Guardian approved your recovery.`,
      recovery_initiated: (d) => `Paradex: Recovery initiated. ${d.timelock} day time lock.`,
      wallet_locked: () => `Paradex: Wallet locked. Unlock to continue.`,
      large_transaction: (d) => `Paradex: Large transaction detected: ${d.amount} ${d.token}`,
      approval_detected: (d) => `Paradex: Approval detected for ${d.token}`,
      phishing_detected: () => `Paradex: Phishing attempt blocked.`,
      whale_alert: (d) => `Paradex: Whale moved ${d.amount} ${d.token}`,
    };

    return messages[type](data);
  }

  // Get user from database
  private async getUser(userId: string): Promise<{ email?: string; phone?: string }> {
    // In production: Query from database
    return { email: 'user@example.com', phone: '+1234567890' };
  }
}

// Export singleton
export const notificationService = new NotificationService();
