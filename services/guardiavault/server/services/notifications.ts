import fs from "fs/promises";
import path from "path";
import { storage } from "../storage";
import type { Notification, InsertNotification } from "@shared/schema";
import { logInfo, logError, logWarn } from "./logger";

const APP_URL = process.env.APP_URL || "http://localhost:5000";

export class NotificationService {
  private sendgridApiKey: string | null;
  private twilioAccountSid: string | null;
  private twilioAuthToken: string | null;
  private twilioPhoneNumber: string | null;
  private telegramBotToken: string | null;
  private isDemoMode: boolean;

  constructor() {
    this.sendgridApiKey = process.env.SENDGRID_API_KEY || null;
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || null;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || null;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || null;
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || null;

    // Demo mode if any critical credentials are missing
    this.isDemoMode = !this.sendgridApiKey || !this.twilioAccountSid;

    if (this.isDemoMode) {
      const missingCredentials = [];
      if (!this.sendgridApiKey) missingCredentials.push('SENDGRID_API_KEY');
      if (!this.twilioAccountSid) missingCredentials.push('TWILIO_ACCOUNT_SID');
      if (!this.twilioAuthToken) missingCredentials.push('TWILIO_AUTH_TOKEN');
      if (!this.twilioPhoneNumber) missingCredentials.push('TWILIO_PHONE_NUMBER');
      if (!this.telegramBotToken) missingCredentials.push('TELEGRAM_BOT_TOKEN');

      logWarn('Notification Service running in DEMO MODE', {
        context: 'NotificationService.constructor',
        missingCredentials
      });
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (!this.sendgridApiKey) {
      logInfo('DEMO MODE: Would send email', {
        context: 'sendEmail',
        to,
        subject
      });
      return { success: true };
    }

    try {
      const sgMail = await import("@sendgrid/mail");
      sgMail.default.setApiKey(this.sendgridApiKey);

      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || "no-reply@guardiavault.com",
        subject,
        text,
        html,
      };

      const [response] = await sgMail.default.send(msg);

      logInfo('Email sent successfully', {
        context: 'sendEmail',
        to,
        statusCode: response.statusCode,
        messageId: response.headers["x-message-id"]
      });

      return {
        success: true,
        messageId: response.headers["x-message-id"] as string,
      };
    } catch (error: any) {
      logError(error, {
        context: 'sendEmail',
        to,
        sendgridError: error.response?.body
      });

      return {
        success: false,
        error: error.message || "Unknown email send error",
      };
    }
  }

  async sendSMS(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; sid?: string }> {
    if (
      !this.twilioAccountSid ||
      !this.twilioAuthToken ||
      !this.twilioPhoneNumber
    ) {
      logInfo('DEMO MODE: Would send SMS', {
        context: 'sendSMS',
        to,
        messagePreview: message.substring(0, 50)
      });
      return { success: true };
    }

    try {
      const twilio = await import("twilio");
      const client = twilio.default(
        this.twilioAccountSid,
        this.twilioAuthToken
      );

      const twilioMessage = await client.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to,
      });

      logInfo('SMS sent successfully', {
        context: 'sendSMS',
        to,
        sid: twilioMessage.sid
      });

      return {
        success: true,
        sid: twilioMessage.sid,
      };
    } catch (error: any) {
      logError(error, {
        context: 'sendSMS',
        to
      });

      return {
        success: false,
        error: error.message || "Unknown SMS send error",
      };
    }
  }

  async sendTelegram(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; messageId?: number }> {
    if (!this.telegramBotToken) {
      logInfo('DEMO MODE: Would send Telegram message', {
        context: 'sendTelegram',
        to,
        messagePreview: message.substring(0, 50)
      });
      return { success: true };
    }

    try {
      // Telegram chat_id: usernames should have @ prefix, user IDs should be numeric strings
      // If it's already a number, use as-is; otherwise ensure @ prefix for username
      let chatId: string | number = to;
      if (!/^\d+$/.test(to)) {
        chatId = to.startsWith("@") ? to : `@${to}`;
      }
      
      const response = await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.description || "Telegram API error");
      }

      logInfo('Telegram message sent successfully', {
        context: 'sendTelegram',
        to,
        messageId: data.result.message_id
      });

      return {
        success: true,
        messageId: data.result.message_id,
      };
    } catch (error: any) {
      logError(error, {
        context: 'sendTelegram',
        to
      });

      return {
        success: false,
        error: error.message || "Unknown Telegram send error",
      };
    }
  }

  async loadTemplate(
    templateName: string,
    variables: Record<string, string>
  ): Promise<{ html: string; text: string; subject: string }> {
    try {
      const templatesDir = path.join(process.cwd(), "server", "templates");
      
      const htmlPath = path.join(templatesDir, `${templateName}.html`);
      const textPath = path.join(templatesDir, `${templateName}.txt`);

      let html = await fs.readFile(htmlPath, "utf-8");
      let text = await fs.readFile(textPath, "utf-8");

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, value);
        text = text.replace(regex, value);
      }

      const subject = this.getSubjectForTemplate(templateName, variables);

      return { html, text, subject };
    } catch (error: any) {
      logError(error, {
        context: 'loadTemplate',
        templateName
      });
      throw new Error(`Template loading failed: ${error.message}`);
    }
  }

  private getSubjectForTemplate(
    templateName: string,
    variables: Record<string, string>
  ): string {
    switch (templateName) {
      case "guardian-invitation":
        return `You've been named as a Guardian for ${variables.vaultName || "a vault"}`;
      case "beneficiary-notification":
        return `Important: Vault '${variables.vaultName || "Vault"}' has been triggered`;
      case "checkin-reminder":
        return `Reminder: Vault Check-In Due in ${variables.daysRemaining || "X"} days`;
      case "checkin-warning":
        return `URGENT: Final Warning - Vault Check-In Overdue`;
      default:
        return "GuardiaVault Notification";
    }
  }

  async processNotification(
    notificationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return { success: false, error: "Notification not found" };
      }

      if (notification.status !== "pending") {
        logInfo('Skipping notification (not pending)', {
          context: 'processNotification',
          notificationId,
          status: notification.status
        });
        return { success: true };
      }

      logInfo('Processing notification', {
        context: 'processNotification',
        notificationId,
        type: notification.type
      });

      let result: { success: boolean; error?: string };

      if (notification.channel === "email") {
        const templateData = JSON.parse(notification.message);
        const { html, text, subject } = await this.loadTemplate(
          this.getTemplateNameForType(notification.type),
          templateData
        );

        result = await this.sendEmail(
          notification.recipient,
          subject,
          html,
          text
        );
      } else if (notification.channel === "sms") {
        result = await this.sendSMS(
          notification.recipient,
          notification.message
        );
      } else if (notification.channel === "telegram") {
        result = await this.sendTelegram(
          notification.recipient,
          notification.message
        );
      } else {
        return {
          success: false,
          error: `Unsupported channel: ${notification.channel}`,
        };
      }

      if (result.success) {
        await storage.updateNotification(notificationId, {
          status: "sent",
          sentAt: new Date(),
        });
        logInfo('Notification sent successfully', {
          context: 'processNotification',
          notificationId
        });
      } else {
        const attempts = (notification as any).attempts || 0;
        const newAttempts = attempts + 1;

        if (newAttempts >= 3) {
          await storage.updateNotification(notificationId, {
            status: "failed",
            message: `${notification.message}\n\nError: ${result.error}`,
          });
          logError(new Error('Notification failed after max attempts'), {
            context: 'processNotification',
            notificationId,
            attempts: newAttempts,
            error: result.error
          });
        } else {
          logWarn('Notification failed, will retry', {
            context: 'processNotification',
            notificationId,
            attempt: newAttempts,
            maxAttempts: 3
          });
        }
      }

      return result;
    } catch (error: any) {
      logError(error, {
        context: 'processNotification',
        notificationId
      });
      return { success: false, error: error.message };
    }
  }

  async processPendingNotifications(): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    try {
      const pending = await storage.getPendingNotifications();

      logInfo('Processing pending notifications', {
        context: 'processPendingNotifications',
        count: pending.length
      });

      let sent = 0;
      let failed = 0;

      for (const notification of pending) {
        const result = await this.processNotification(notification.id);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }

      logInfo('Completed processing pending notifications', {
        context: 'processPendingNotifications',
        processed: pending.length,
        sent,
        failed
      });

      return {
        processed: pending.length,
        sent,
        failed,
      };
    } catch (error: any) {
      logError(error, {
        context: 'processPendingNotifications'
      });
      return {
        processed: 0,
        sent: 0,
        failed: 0,
      };
    }
  }

  private getTemplateNameForType(type: string): string {
    switch (type) {
      case "guardian_invitation":
        return "guardian-invitation";
      case "beneficiary_notification":
        return "beneficiary-notification";
      case "check_in_reminder":
        return "checkin-reminder";
      case "check_in_warning":
      case "check_in_critical":
        return "checkin-warning";
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  async createGuardianInvitation(params: {
    vaultId: string;
    guardianId: string;
    guardianEmail: string;
    vaultName: string;
    ownerName: string;
    inviteToken: string;
  }): Promise<Notification> {
    const { vaultId, guardianEmail, vaultName, ownerName, inviteToken } =
      params;

    const acceptLink = `${APP_URL}/accept-invite?token=${inviteToken}&role=guardian`;

    const templateData = {
      vaultName,
      ownerName,
      acceptLink,
    };

    const notification: InsertNotification = {
      vaultId,
      type: "guardian_invitation",
      recipient: guardianEmail,
      channel: "email",
      message: JSON.stringify(templateData),
    };

    return await storage.createNotification(notification);
  }

  async createBeneficiaryNotification(params: {
    vaultId: string;
    beneficiaryEmail: string;
    vaultName: string;
  }): Promise<Notification> {
    const { vaultId, beneficiaryEmail, vaultName } = params;

    const claimLink = `${APP_URL}/claims?vault=${vaultId}`;

    const templateData = {
      vaultName,
      claimLink,
    };

    const notification: InsertNotification = {
      vaultId,
      type: "beneficiary_notification",
      recipient: beneficiaryEmail,
      channel: "email",
      message: JSON.stringify(templateData),
    };

    return await storage.createNotification(notification);
  }

  async createCheckInReminder(params: {
    vaultId: string;
    ownerEmail: string;
    ownerName: string;
    vaultName: string;
    daysRemaining: number;
    dueDate: string;
    gracePeriod: number;
  }): Promise<Notification> {
    const {
      vaultId,
      ownerEmail,
      ownerName,
      vaultName,
      daysRemaining,
      dueDate,
      gracePeriod,
    } = params;

    const checkInLink = `${APP_URL}/checkins`;

    const templateData = {
      ownerName,
      vaultName,
      daysRemaining: daysRemaining.toString(),
      dueDate,
      gracePeriod: gracePeriod.toString(),
      checkInLink,
    };

    const notification: InsertNotification = {
      vaultId,
      type: "check_in_reminder",
      recipient: ownerEmail,
      channel: "email",
      message: JSON.stringify(templateData),
    };

    return await storage.createNotification(notification);
  }

  async createCheckInWarning(params: {
    vaultId: string;
    ownerEmail: string;
    ownerName: string;
    vaultName: string;
    hoursRemaining: number;
    triggerDate: string;
  }): Promise<Notification> {
    const {
      vaultId,
      ownerEmail,
      ownerName,
      vaultName,
      hoursRemaining,
      triggerDate,
    } = params;

    const checkInLink = `${APP_URL}/checkins`;

    const templateData = {
      ownerName,
      vaultName,
      hoursRemaining: hoursRemaining.toString(),
      triggerDate,
      checkInLink,
    };

    const notification: InsertNotification = {
      vaultId,
      type: "check_in_critical",
      recipient: ownerEmail,
      channel: "email",
      message: JSON.stringify(templateData),
    };

    return await storage.createNotification(notification);
  }
}

export const notificationService = new NotificationService();

export async function sendGuardianNotificationLink(params: {
  guardian: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    telegram: string | null;
  };
  url: string;
  vaultName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { guardian, url, vaultName } = params;

  try {
    let result: { success: boolean; error?: string } | null = null;

    if (guardian.email) {
      const message = `Hello ${guardian.name},\n\nYou have been requested to take action for vault "${vaultName}".\n\nPlease visit: ${url}\n\nThank you,\nGuardiaVault Team`;
      
      result = await notificationService.sendEmail(
        guardian.email,
        `Action Required: ${vaultName}`,
        `<p>Hello ${guardian.name},</p><p>You have been requested to take action for vault "<strong>${vaultName}</strong>".</p><p><a href="${url}">Click here to take action</a></p><p>Thank you,<br>GuardiaVault Team</p>`,
        message
      );
    } else if (guardian.phone) {
      const message = `GuardiaVault: Action required for vault "${vaultName}". Visit: ${url}`;
      result = await notificationService.sendSMS(guardian.phone, message);
    } else {
      logWarn('Guardian has no contact method configured', {
        context: 'sendGuardianNotificationLink',
        guardianId: guardian.id
      });
      return { ok: false, error: "No contact method available" };
    }

    return { ok: result?.success ?? false, error: result?.error };
  } catch (error: any) {
    logError(error, {
      context: 'sendGuardianNotificationLink',
      guardianId: guardian.id
    });
    return { ok: false, error: error.message };
  }
}
