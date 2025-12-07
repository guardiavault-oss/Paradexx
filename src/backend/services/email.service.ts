/**
 * Email Service - Supports Resend connector, Resend API, and SendGrid
 * 
 * Priority order:
 * 1. Resend connector (Replit integration)
 * 2. Resend API key (direct)
 * 3. SendGrid API key (fallback)
 * 4. Console logging (development)
 */

import { Resend } from 'resend';
import { logger } from '../services/logger.service';

// Email configuration
const DEFAULT_FROM_EMAIL = process.env.FROM_EMAIL || 'Paradex <noreply@aldvra.resend.app>';
const APP_URL = process.env.FRONTEND_URL || 'https://app.paradex.trade';
const SUPPORT_EMAIL = 'help@paradex.trade';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Email provider state
let emailProvider: 'resend_connector' | 'resend_api' | 'sendgrid' | 'console' = 'console';
let resendClient: Resend | null = null;
let connectorFromEmail: string | null = null;

// Verified domain for production emails
const VERIFIED_FROM_EMAIL = 'Paradex <noreply@aldvra.resend.app>';

// Try to get Resend client from connector
async function getResendFromConnector(): Promise<{ client: Resend; fromEmail: string } | null> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
      ? 'repl ' + process.env.REPL_IDENTITY
      : process.env.WEB_REPL_RENEWAL
        ? 'depl ' + process.env.WEB_REPL_RENEWAL
        : null;

    if (!hostname || !xReplitToken) return null;

    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    const data = await response.json() as { items?: Array<{ settings?: { api_key?: string; from_email?: string } }> };
    const connectionSettings = data.items?.[0];

    if (!connectionSettings?.settings?.api_key) return null;

    // Use verified domain instead of default Resend test domain
    let fromEmail = connectionSettings.settings.from_email || DEFAULT_FROM_EMAIL;
    if (fromEmail.includes('onboarding@resend.dev') || fromEmail.includes('resend.dev')) {
      fromEmail = VERIFIED_FROM_EMAIL;
    }

    return {
      client: new Resend(connectionSettings.settings.api_key),
      fromEmail
    };
  } catch (error) {
    logger.warn('Failed to get Resend connector:', error);
    return null;
  }
}

// Initialize email provider
async function initEmailProvider() {
  // Try Resend connector first
  const connector = await getResendFromConnector();
  if (connector) {
    resendClient = connector.client;
    connectorFromEmail = connector.fromEmail;
    emailProvider = 'resend_connector';
    logger.info('✅ Email Service: Using Resend connector');
    logger.info(`   From email: ${connectorFromEmail}`);
    return;
  }

  // Try Resend API key
  if (RESEND_API_KEY) {
    resendClient = new Resend(RESEND_API_KEY);
    emailProvider = 'resend_api';
    logger.info('✅ Email Service: Using Resend API key');
    return;
  }

  // Try SendGrid
  if (SENDGRID_API_KEY) {
    emailProvider = 'sendgrid';
    logger.info('✅ Email Service: Using SendGrid');
    return;
  }

  // Fallback to console logging
  emailProvider = 'console';
  logger.warn('⚠️ Email Service: No email provider configured - using console logging');
}

// Initialize on module load
initEmailProvider();

// Send email using configured provider
async function sendEmailViaProvider(to: string, subject: string, html: string): Promise<boolean> {
  try {
    if (emailProvider === 'resend_connector' || emailProvider === 'resend_api') {
      if (!resendClient) {
        const connector = await getResendFromConnector();
        if (connector) {
          resendClient = connector.client;
          connectorFromEmail = connector.fromEmail;
        }
      }

      if (resendClient) {
        // Use connector from email if available, otherwise use default
        const fromEmail = connectorFromEmail || DEFAULT_FROM_EMAIL;
        await resendClient.emails.send({
          from: fromEmail,
          to,
          subject,
          html,
        });
        return true;
      }
    }

    if (emailProvider === 'sendgrid' && SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || DEFAULT_FROM_EMAIL.replace(/<|>/g, '').split(' ').pop() },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });
      return response.ok;
    }

    // Console fallback
    logger.info(`\n📧 [EMAIL-DEV] To: ${to}`);
    logger.info(`   Subject: ${subject}`);
    logger.info(`   (Email content logged - not sent in dev mode)\n`);
    return true;
  } catch (error) {
    logger.error('Email send error:', error);
    return false;
  }
}

// Email template styles
const emailStyles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: #0a0a0a;
    color: #e0e0e0;
    padding: 0;
  `,
  header: `
    background: linear-gradient(135deg, #00ADEF 0%, #9B59B6 100%);
    padding: 40px 30px;
    text-align: center;
  `,
  logo: `
    font-size: 28px;
    font-weight: bold;
    color: white;
    margin: 0;
  `,
  body: `
    padding: 40px 30px;
    background: #121212;
  `,
  title: `
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 20px 0;
  `,
  text: `
    font-size: 16px;
    line-height: 1.6;
    color: #aaaaaa;
    margin: 0 0 20px 0;
  `,
  button: `
    display: inline-block;
    background: linear-gradient(135deg, #00ADEF 0%, #9B59B6 100%);
    color: white;
    padding: 16px 32px;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    text-align: center;
    margin: 20px 0;
  `,
  secondaryButton: `
    display: inline-block;
    background: #2a2a2a;
    color: #e0e0e0;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    margin: 10px 0;
  `,
  card: `
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  `,
  warning: `
    background: #ffc10720;
    border: 1px solid #ffc10750;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  `,
  success: `
    background: #10b98120;
    border: 1px solid #10b98150;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  `,
  footer: `
    padding: 30px;
    background: #0a0a0a;
    text-align: center;
    border-top: 1px solid #1a1a1a;
  `,
  footerText: `
    font-size: 12px;
    color: #666666;
    margin: 0;
  `,
  link: `
    color: #00ADEF;
    text-decoration: none;
  `,
};

// Base email template
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paradex</title>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <img src="https://app.paradex.trade/paradex-official.png" alt="Paradex" style="max-width: 120px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none';" />
      <h1 style="${emailStyles.logo}">🛡️ Paradex</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Self-Custody. Simplified.</p>
    </div>
    <div style="${emailStyles.body}">
      ${content}
    </div>
    <div style="${emailStyles.footer}">
      <p style="${emailStyles.footerText}">
        © ${new Date().getFullYear()} Paradex. All rights reserved.
      </p>
      <p style="${emailStyles.footerText}; margin-top: 10px;">
        Questions? <a href="mailto:${SUPPORT_EMAIL}" style="${emailStyles.link}">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export interface EmailService {
  // Guardian emails
  sendGuardianInvitation: (params: {
    to: string;
    guardianName: string;
    ownerName: string;
    inviteLink: string;
    threshold: number;
    totalGuardians: number;
  }) => Promise<void>;

  sendGuardianAcceptedNotification: (params: {
    to: string;
    ownerName: string;
    guardianName: string;
    guardianEmail: string;
  }) => Promise<void>;

  sendGuardianDeclinedNotification: (params: {
    to: string;
    ownerName: string;
    guardianName: string;
    guardianEmail: string;
    reason?: string;
  }) => Promise<void>;

  // Recovery emails
  sendRecoveryInitiatedNotification: (params: {
    to: string;
    ownerName: string;
    initiatorEmail: string;
    disputeLink: string;
    timeLockHours: number;
  }) => Promise<void>;

  sendRecoveryRequestToGuardian: (params: {
    to: string;
    guardianName: string;
    ownerName: string;
    reason?: string;
    portalLink: string;
  }) => Promise<void>;

  sendGuardianVotedNotification: (params: {
    to: string;
    ownerName: string;
    guardianName: string;
    approved: boolean;
    currentApprovals: number;
    requiredApprovals: number;
  }) => Promise<void>;

  sendRecoveryApprovedNotification: (params: {
    to: string;
    ownerName: string;
    canExecuteAt?: Date;
  }) => Promise<void>;

  sendRecoveryCompletedNotification: (params: {
    to: string;
    ownerName: string;
  }) => Promise<void>;

  sendRecoveryDisputedNotification: (params: {
    to: string[];
    ownerName: string;
    reason: string;
  }) => Promise<void>;

  // Guardian communication
  sendGuardianMessageToOwner: (params: {
    to: string;
    ownerName: string;
    guardianName: string;
    guardianEmail: string;
    message: string;
  }) => Promise<void>;

  // Security emails
  sendSecurityAlert: (params: {
    to: string;
    userName: string;
    alertType: string;
    message: string;
    actionLink?: string;
  }) => Promise<void>;
}

class ResendEmailService implements EmailService {
  async sendGuardianInvitation(params: {
    to: string;
    guardianName: string;
    ownerName: string;
    inviteLink: string;
    threshold: number;
    totalGuardians: number;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">You've Been Chosen as a Guardian 🛡️</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.guardianName || 'there'},
      </p>
      
      <p style="${emailStyles.text}">
        <strong>${params.ownerName}</strong> has invited you to be a guardian for their Paradex wallet. 
        As a guardian, you'll hold a piece of their recovery key and help protect their cryptocurrency.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #888888; font-size: 14px;">How it works:</p>
        <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #aaaaaa; font-size: 14px;">
          <li style="margin-bottom: 8px;">You securely store a piece of their recovery key</li>
          <li style="margin-bottom: 8px;">${params.threshold} of ${params.totalGuardians} guardians must approve any recovery</li>
          <li style="margin-bottom: 8px;">You can't access their funds alone - it's a group decision</li>
          <li>You'll only be contacted if they need help recovering their wallet</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.inviteLink}" style="${emailStyles.button}">
          Accept Guardian Invitation
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        No app download required - everything works through your browser.
      </p>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        This invitation expires in 7 days. If you don't want to be a guardian, 
        simply ignore this email.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `👥 ${params.ownerName} invited you to be a Guardian`,
      html: baseTemplate(content),
    });
  }

  async sendGuardianAcceptedNotification(params: {
    to: string;
    ownerName: string;
    guardianName: string;
    guardianEmail: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">Guardian Accepted! ✅</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.ownerName},
      </p>
      
      <p style="${emailStyles.text}">
        Great news! <strong>${params.guardianName}</strong> (${params.guardianEmail}) has accepted 
        your guardian invitation and is now helping protect your wallet.
      </p>
      
      <div style="${emailStyles.success}">
        <p style="margin: 0; color: #10b981;">
          ✓ Guardian is now active and holds a recovery key shard
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        Your wallet's social recovery is now stronger. Make sure you have enough 
        guardians to meet your threshold requirement.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/settings/guardians" style="${emailStyles.secondaryButton}">
          View Your Guardians
        </a>
      </div>
    `;

    await this.send({
      to: params.to,
      subject: `✅ ${params.guardianName} is now your guardian`,
      html: baseTemplate(content),
    });
  }

  async sendGuardianDeclinedNotification(params: {
    to: string;
    ownerName: string;
    guardianName: string;
    guardianEmail: string;
    reason?: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">Guardian Invitation Declined</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.ownerName},
      </p>
      
      <p style="${emailStyles.text}">
        Unfortunately, <strong>${params.guardianName}</strong> (${params.guardianEmail}) 
        has declined your guardian invitation.
      </p>
      
      ${params.reason ? `
        <div style="${emailStyles.card}">
          <p style="margin: 0; color: #888888; font-size: 14px;">Reason given:</p>
          <p style="margin: 10px 0 0 0; color: #e0e0e0;">${params.reason}</p>
        </div>
      ` : ''}
      
      <p style="${emailStyles.text}">
        Consider inviting someone else to ensure your wallet has enough guardians 
        for recovery.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/settings/guardians" style="${emailStyles.button}">
          Invite Another Guardian
        </a>
      </div>
    `;

    await this.send({
      to: params.to,
      subject: `${params.guardianName} declined your guardian invitation`,
      html: baseTemplate(content),
    });
  }

  async sendRecoveryInitiatedNotification(params: {
    to: string;
    ownerName: string;
    initiatorEmail: string;
    disputeLink: string;
    timeLockHours: number;
  }): Promise<void> {
    const days = Math.ceil(params.timeLockHours / 24);

    const content = `
      <h2 style="${emailStyles.title}">⚠️ Recovery Request Initiated</h2>
      
      <div style="${emailStyles.warning}">
        <p style="margin: 0; color: #ffc107; font-weight: 600;">
          IMPORTANT: Someone is attempting to recover your wallet
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        Hi ${params.ownerName},
      </p>
      
      <p style="${emailStyles.text}">
        A recovery request has been initiated for your wallet by <strong>${params.initiatorEmail}</strong>.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0 0 10px 0; color: #e0e0e0;">
          <strong>Time Lock:</strong> ${days} days
        </p>
        <p style="margin: 0; color: #888888; font-size: 14px;">
          If you don't dispute this, and enough guardians approve, your wallet 
          will be recoverable after ${days} days.
        </p>
      </div>
      
      <p style="${emailStyles.text}; color: #ff5555;">
        <strong>If this wasn't you, dispute immediately:</strong>
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.disputeLink}" style="${emailStyles.button}; background: #ff5555;">
          🚨 Dispute This Request
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        If you initiated this recovery or this is expected, no action is needed. 
        Your guardians will be contacted for approval.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `⚠️ URGENT: Recovery request for your Paradex wallet`,
      html: baseTemplate(content),
    });
  }

  async sendRecoveryRequestToGuardian(params: {
    to: string;
    guardianName: string;
    ownerName: string;
    reason?: string;
    portalLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">🔐 Recovery Request - Your Help Needed</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.guardianName},
      </p>
      
      <p style="${emailStyles.text}">
        <strong>${params.ownerName}</strong> needs help recovering their Paradex wallet. 
        As one of their trusted guardians, your approval is needed.
      </p>
      
      ${params.reason ? `
        <div style="${emailStyles.card}">
          <p style="margin: 0; color: #888888; font-size: 14px;">Reason given:</p>
          <p style="margin: 10px 0 0 0; color: #e0e0e0;">${params.reason}</p>
        </div>
      ` : ''}
      
      <div style="${emailStyles.warning}">
        <p style="margin: 0; color: #ffc107; font-size: 14px;">
          ⚠️ Before approving, try to verify this is a legitimate request. 
          If possible, contact ${params.ownerName} through another channel.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.portalLink}" style="${emailStyles.button}">
          Review Recovery Request
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        If you believe this is fraudulent, you can reject the request in the portal.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🔐 ${params.ownerName} needs your help with wallet recovery`,
      html: baseTemplate(content),
    });
  }

  async sendGuardianVotedNotification(params: {
    to: string;
    ownerName: string;
    guardianName: string;
    approved: boolean;
    currentApprovals: number;
    requiredApprovals: number;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">Guardian ${params.approved ? 'Approved' : 'Rejected'} Recovery</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.ownerName},
      </p>
      
      <p style="${emailStyles.text}">
        <strong>${params.guardianName}</strong> has ${params.approved ? 'approved' : 'rejected'} 
        your recovery request.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0;">
          <strong>Current approvals:</strong> ${params.currentApprovals} of ${params.requiredApprovals} required
        </p>
        ${params.currentApprovals >= params.requiredApprovals ? `
          <p style="margin: 15px 0 0 0; color: #10b981;">
            ✓ Threshold reached! Recovery can proceed after time lock expires.
          </p>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/recovery" style="${emailStyles.secondaryButton}">
          View Recovery Status
        </a>
      </div>
    `;

    await this.send({
      to: params.to,
      subject: `${params.approved ? '✅' : '❌'} ${params.guardianName} ${params.approved ? 'approved' : 'rejected'} your recovery`,
      html: baseTemplate(content),
    });
  }

  async sendRecoveryApprovedNotification(params: {
    to: string;
    ownerName: string;
    canExecuteAt?: Date;
  }): Promise<void> {
    const executeDate = params.canExecuteAt
      ? new Date(params.canExecuteAt).toLocaleString()
      : 'soon';

    const content = `
      <h2 style="${emailStyles.title}">Recovery Approved! 🎉</h2>
      
      <div style="${emailStyles.success}">
        <p style="margin: 0; color: #10b981;">
          ✓ Enough guardians have approved your recovery request
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        Hi ${params.ownerName},
      </p>
      
      <p style="${emailStyles.text}">
        Great news! Your recovery request has received enough guardian approvals. 
        ${params.canExecuteAt && new Date(params.canExecuteAt) > new Date()
        ? `You can complete the recovery after the time lock expires on <strong>${executeDate}</strong>.`
        : 'You can now complete the recovery process.'}
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/recovery" style="${emailStyles.button}">
          Complete Recovery
        </a>
      </div>
    `;

    await this.send({
      to: params.to,
      subject: `🎉 Your wallet recovery has been approved`,
      html: baseTemplate(content),
    });
  }

  async sendRecoveryCompletedNotification(params: {
    to: string;
    ownerName: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">Recovery Complete! 🎉</h2>
      
      <div style="${emailStyles.success}">
        <p style="margin: 0; color: #10b981;">
          ✓ Your wallet access has been restored
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        Hi ${params.ownerName},
      </p>
      
      <p style="${emailStyles.text}">
        Your wallet recovery has been completed successfully. You now have full access 
        to your Paradex wallet again.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0; font-weight: 600;">Security Recommendations:</p>
        <ul style="margin: 15px 0 0 20px; padding: 0; color: #aaa;">
          <li style="margin-bottom: 8px;">Set up new biometric authentication</li>
          <li style="margin-bottom: 8px;">Review your guardian list</li>
          <li style="margin-bottom: 8px;">Check recent transactions for any suspicious activity</li>
          <li>Enable additional security features</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}" style="${emailStyles.button}">
          Open Your Wallet
        </a>
      </div>
    `;

    await this.send({
      to: params.to,
      subject: `🎉 Wallet recovery complete - Welcome back!`,
      html: baseTemplate(content),
    });
  }

  async sendRecoveryDisputedNotification(params: {
    to: string[];
    ownerName: string;
    reason: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">Recovery Request Cancelled</h2>
      
      <p style="${emailStyles.text}">
        The wallet owner (<strong>${params.ownerName}</strong>) has disputed and cancelled 
        the recovery request.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #888888; font-size: 14px;">Reason:</p>
        <p style="margin: 10px 0 0 0; color: #e0e0e0;">${params.reason}</p>
      </div>
      
      <p style="${emailStyles.text}">
        This recovery request is no longer active. If you have questions, 
        please contact the wallet owner directly.
      </p>
    `;

    // Send to all guardians
    for (const email of params.to) {
      await this.send({
        to: email,
        subject: `Recovery request cancelled by ${params.ownerName}`,
        html: baseTemplate(content),
      });
    }
  }

  async sendGuardianMessageToOwner(params: {
    to: string;
    ownerName: string;
    guardianName: string;
    guardianEmail: string;
    message: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">Message from Your Guardian</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.ownerName},
      </p>
      
      <p style="${emailStyles.text}">
        Your guardian <strong>${params.guardianName}</strong> (${params.guardianEmail}) 
        has sent you a message:
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0; white-space: pre-wrap;">${params.message}</p>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        You can reply directly to ${params.guardianEmail}.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `💬 Message from your guardian ${params.guardianName}`,
      html: baseTemplate(content),
      replyTo: params.guardianEmail,
    });
  }

  async sendSecurityAlert(params: {
    to: string;
    userName: string;
    alertType: string;
    message: string;
    actionLink?: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">🚨 Security Alert</h2>
      
      <div style="${emailStyles.warning}">
        <p style="margin: 0; color: #ffc107; font-weight: 600;">
          ${params.alertType}
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        Hi ${params.userName},
      </p>
      
      <p style="${emailStyles.text}">
        ${params.message}
      </p>
      
      ${params.actionLink ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.actionLink}" style="${emailStyles.button}">
            Take Action
          </a>
        </div>
      ` : ''}
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        If you didn't initiate this action, please secure your account immediately 
        and contact support.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🚨 Security Alert: ${params.alertType}`,
      html: baseTemplate(content),
    });
  }

  async sendInheritanceWarning(params: {
    to: string;
    userName: string;
    daysRemaining: number;
    checkInLink: string;
  }): Promise<void> {
    const urgency = params.daysRemaining <= 1 ? 'URGENT: ' : '';
    const urgencyStyle = params.daysRemaining <= 1 ? emailStyles.warning : emailStyles.card;

    const content = `
      <h2 style="${emailStyles.title}">⏰ Inheritance Vault Alert</h2>
      
      <div style="${urgencyStyle}">
        <p style="margin: 0; color: ${params.daysRemaining <= 1 ? '#ffc107' : '#e0e0e0'}; font-weight: 600;">
          ${urgency}Your inheritance vault will trigger in ${params.daysRemaining} day${params.daysRemaining > 1 ? 's' : ''}
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        Hi ${params.userName},
      </p>
      
      <p style="${emailStyles.text}">
        We haven't detected any activity from your Paradex wallet in a while. 
        If you don't check in soon, your inheritance vault will automatically trigger 
        and begin the asset distribution process to your beneficiaries.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #888888; font-size: 14px;">What happens next:</p>
        <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #aaaaaa; font-size: 14px;">
          <li style="margin-bottom: 8px;">After ${params.daysRemaining} day${params.daysRemaining > 1 ? 's' : ''}, a 7-day timelock will start</li>
          <li style="margin-bottom: 8px;">Your beneficiaries will be notified</li>
          <li style="margin-bottom: 8px;">You can cancel the trigger anytime during the timelock</li>
          <li>After the timelock, assets will be distributed automatically</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.checkInLink}" style="${emailStyles.button}">
          ✓ Check In Now
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        Checking in resets your inactivity timer and keeps your vault active.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `${urgency}⏰ Inheritance Vault - ${params.daysRemaining} day${params.daysRemaining > 1 ? 's' : ''} until trigger`,
      html: baseTemplate(content),
    });
  }

  async sendInheritanceCheckInReminder(params: {
    to: string;
    userName: string;
    checkInLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">📅 Annual Check-In Reminder</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.userName},
      </p>
      
      <p style="${emailStyles.text}">
        It's been a year since your last check-in on your Paradex Inheritance Vault. 
        This is a friendly reminder to verify your settings and ensure everything is up to date.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0; font-weight: 600;">We recommend reviewing:</p>
        <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #aaaaaa; font-size: 14px;">
          <li style="margin-bottom: 8px;">Your beneficiary list and allocations</li>
          <li style="margin-bottom: 8px;">Inactivity trigger settings</li>
          <li style="margin-bottom: 8px;">Wallet addresses associated with your vault</li>
          <li>Guardian approval requirements</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.checkInLink}" style="${emailStyles.button}">
          Review & Check In
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        This is a Premium feature - yearly reminders to keep your inheritance plan current.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `📅 Annual Inheritance Vault Check-In Reminder`,
      html: baseTemplate(content),
    });
  }

  async sendInheritanceTriggered(params: {
    to: string;
    userName: string;
    timelockDays: number;
    cancelLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">⚠️ Inheritance Vault Triggered</h2>
      
      <div style="${emailStyles.warning}">
        <p style="margin: 0; color: #ffc107; font-weight: 600;">
          IMPORTANT: Your inheritance vault has been triggered due to inactivity
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        Hi ${params.userName},
      </p>
      
      <p style="${emailStyles.text}">
        Your Paradex Inheritance Vault has been triggered because we haven't detected 
        any wallet activity within your configured inactivity period.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0;">
          <strong>Timelock Period:</strong> ${params.timelockDays} days
        </p>
        <p style="margin: 15px 0 0 0; color: #888888; font-size: 14px;">
          Your beneficiaries have been notified. After the timelock expires, 
          assets will be distributed according to your configured allocations.
        </p>
      </div>
      
      <p style="${emailStyles.text}; color: #10b981;">
        <strong>If you're still here, you can cancel this immediately:</strong>
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.cancelLink}" style="${emailStyles.button}; background: #10b981;">
          ✓ Cancel & Resume Vault
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        Cancelling will reset your inactivity timer and stop the distribution process.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `⚠️ IMPORTANT: Your Inheritance Vault Has Been Triggered`,
      html: baseTemplate(content),
    });
  }

  async sendInheritanceBeneficiaryNotification(params: {
    to: string;
    beneficiaryName: string;
    ownerName: string;
    verificationLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">🔐 You've Been Added as a Beneficiary</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.beneficiaryName},
      </p>
      
      <p style="${emailStyles.text}">
        <strong>${params.ownerName}</strong> has added you as a beneficiary to their 
        Paradex Inheritance Vault. This means you may receive cryptocurrency assets 
        in the future if the vault's conditions are met.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #888888; font-size: 14px;">What this means:</p>
        <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #aaaaaa; font-size: 14px;">
          <li style="margin-bottom: 8px;">You're designated to receive a portion of ${params.ownerName}'s crypto assets</li>
          <li style="margin-bottom: 8px;">The vault triggers only after a period of inactivity</li>
          <li style="margin-bottom: 8px;">You don't need to do anything now</li>
          <li>You'll be notified if/when the vault triggers</li>
        </ul>
      </div>
      
      <p style="${emailStyles.text}">
        Please verify your email to confirm your beneficiary status:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.verificationLink}" style="${emailStyles.button}">
          Verify Email Address
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        If you have questions about this, please contact ${params.ownerName} directly.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🔐 ${params.ownerName} added you as an inheritance beneficiary`,
      html: baseTemplate(content),
    });
  }

  async sendInheritanceBeneficiaryAlert(params: {
    to: string;
    beneficiaryName: string;
    ownerName: string;
    timelockDays: number;
    claimLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">🔔 Inheritance Vault Triggered</h2>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0; font-weight: 600;">
          Asset transfer is pending
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        Hi ${params.beneficiaryName},
      </p>
      
      <p style="${emailStyles.text}">
        The inheritance vault belonging to <strong>${params.ownerName}</strong> has been 
        triggered due to wallet inactivity. As a designated beneficiary, you may receive 
        assets after the timelock period.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0;">
          <strong>Timelock Period:</strong> ${params.timelockDays} days
        </p>
        <p style="margin: 15px 0 0 0; color: #888888; font-size: 14px;">
          The vault owner can cancel this transfer during the timelock period. 
          You'll be notified when assets are ready for claim.
        </p>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        No action is required from you at this time. We'll notify you when 
        the distribution is complete and assets are ready for claim.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.claimLink}" style="${emailStyles.secondaryButton}">
          View Claim Status
        </a>
      </div>
    `;

    await this.send({
      to: params.to,
      subject: `🔔 Inheritance vault triggered - Assets pending`,
      html: baseTemplate(content),
    });
  }

  async sendInheritanceDistributionComplete(params: {
    to: string;
    beneficiaryName: string;
    ownerName: string;
    percentage: number;
    claimLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">🎉 Assets Ready for Claim</h2>
      
      <div style="${emailStyles.success}">
        <p style="margin: 0; color: #10b981;">
          ✓ Inheritance distribution complete
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        Hi ${params.beneficiaryName},
      </p>
      
      <p style="${emailStyles.text}">
        The inheritance vault from <strong>${params.ownerName}</strong> has completed 
        its distribution. Your allocated assets (${params.percentage}%) are now ready 
        for claim.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0; font-weight: 600;">Your Allocation:</p>
        <p style="margin: 10px 0 0 0; font-size: 24px; color: #10b981;">
          ${params.percentage}% of vault assets
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.claimLink}" style="${emailStyles.button}">
          Claim Your Assets
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        You'll need to connect a wallet to receive your assets. 
        If you don't have a crypto wallet, follow our simple setup guide.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🎉 Inheritance assets ready for claim`,
      html: baseTemplate(content),
    });
  }

  // Seedless wallet - Guardian shard notification
  async sendGuardianShardNotification(params: {
    to: string;
    guardianName: string;
    ownerName: string;
    shardIndex: number;
    totalShards: number;
    threshold: number;
    portalLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">🔐 You Hold a Key Shard</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.guardianName},
      </p>
      
      <p style="${emailStyles.text}">
        <strong>${params.ownerName}</strong> has created a seedless wallet with Paradex and 
        has trusted you with a critical piece of their recovery key.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0; font-weight: 600;">Your Role:</p>
        <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #aaaaaa; font-size: 14px;">
          <li style="margin-bottom: 8px;">You hold shard #${params.shardIndex} of ${params.totalShards}</li>
          <li style="margin-bottom: 8px;">${params.threshold} of ${params.totalShards} shards are needed for recovery</li>
          <li style="margin-bottom: 8px;">Your shard alone cannot access their wallet</li>
          <li>You'll only be contacted if recovery is needed</li>
        </ul>
      </div>
      
      <div style="${emailStyles.warning}">
        <p style="margin: 0; color: #ffc107; font-size: 14px;">
          <strong>⚠️ Security Note:</strong> Never share your shard or approve recovery 
          unless you've verified the request directly with ${params.ownerName}.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.portalLink}" style="${emailStyles.button}">
          Access Guardian Portal
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        The portal allows you to verify your shard and respond to recovery requests.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🔐 You're now a key guardian for ${params.ownerName}'s wallet`,
      html: baseTemplate(content),
    });
  }

  // Helper method to send email using unified provider
  private async send(params: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
  }): Promise<void> {
    try {
      const sent = await sendEmailViaProvider(params.to, params.subject, params.html);

      if (sent) {
        logger.info(`[EMAIL] Sent to ${params.to}: ${params.subject}`);
      } else {
        logger.warn(`[EMAIL] Failed to send to ${params.to}: ${params.subject}`);
      }
    } catch (error) {
      logger.error(`[EMAIL ERROR] Failed to send to ${params.to}:`, error);
    }
  }

  // ============================================================
  // EMAIL VERIFICATION
  // ============================================================

  async sendEmailVerification(params: {
    to: string;
    userName: string;
    verificationCode: string;
    verificationLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">Verify Your Email Address</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.userName},
      </p>
      
      <p style="${emailStyles.text}">
        Welcome to Paradex! Please verify your email address to complete your registration 
        and secure your account.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #888888; font-size: 14px; text-align: center;">Your verification code:</p>
        <p style="margin: 15px 0 0 0; font-size: 36px; font-weight: bold; color: #00ADEF; text-align: center; letter-spacing: 8px;">
          ${params.verificationCode}
        </p>
      </div>
      
      <p style="${emailStyles.text}; text-align: center;">
        Or click the button below to verify automatically:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.verificationLink}" style="${emailStyles.button}">
          ✓ Verify Email Address
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        This code expires in 24 hours. If you didn't create a Paradex account, 
        you can safely ignore this email.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🔐 Verify your Paradex email address`,
      html: baseTemplate(content),
    });
  }

  async sendPasswordResetEmail(params: {
    to: string;
    userName: string;
    resetLink: string;
    expiresIn: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">Reset Your Password</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.userName},
      </p>
      
      <p style="${emailStyles.text}">
        We received a request to reset your Paradex password. Click the button below 
        to create a new password:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.resetLink}" style="${emailStyles.button}">
          Reset Password
        </a>
      </div>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #888888; font-size: 14px;">
          ⏰ This link expires in ${params.expiresIn}
        </p>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        If you didn't request a password reset, please ignore this email or contact 
        support if you have concerns about your account security.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🔑 Reset your Paradex password`,
      html: baseTemplate(content),
    });
  }

  // ============================================================
  // DEATH / PASSING NOTIFICATIONS (Sensitive)
  // ============================================================

  async sendGuardianDeathNotification(params: {
    to: string;
    guardianName: string;
    ownerName: string;
    ownerEmail: string;
    daysInactive: number;
    attestationLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">🕊️ Guardian Attestation Required</h2>
      
      <p style="${emailStyles.text}">
        Dear ${params.guardianName},
      </p>
      
      <p style="${emailStyles.text}">
        We're reaching out because you're listed as a guardian for <strong>${params.ownerName}</strong>'s 
        Paradex account. Their inheritance vault has been triggered due to ${params.daysInactive} days 
        of inactivity.
      </p>
      
      <div style="${emailStyles.warning}">
        <p style="margin: 0; color: #ffc107; font-weight: 600;">
          If ${params.ownerName} has passed away, your attestation may be required to help 
          their beneficiaries claim their digital assets.
        </p>
      </div>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0; font-weight: 600;">What you need to do:</p>
        <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #aaaaaa; font-size: 14px;">
          <li style="margin-bottom: 8px;">Try to contact ${params.ownerName} directly if possible</li>
          <li style="margin-bottom: 8px;">If you can confirm they've passed, provide attestation</li>
          <li style="margin-bottom: 8px;">Your attestation helps unlock assets for beneficiaries</li>
          <li>Multiple guardian attestations may be required</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.attestationLink}" style="${emailStyles.button}">
          Review & Attest
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        We understand this may be a difficult time. If you have any questions, 
        our support team is here to help.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🕊️ Guardian attestation needed for ${params.ownerName}'s account`,
      html: baseTemplate(content),
    });
  }

  async sendBeneficiaryCondolenceNotification(params: {
    to: string;
    beneficiaryName: string;
    ownerName: string;
    percentage: number;
    timelockDays: number;
    claimLink: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">🕊️ A Message About ${params.ownerName}'s Digital Legacy</h2>
      
      <p style="${emailStyles.text}">
        Dear ${params.beneficiaryName},
      </p>
      
      <p style="${emailStyles.text}">
        We're reaching out with news about <strong>${params.ownerName}</strong>'s digital assets. 
        Their Paradex Inheritance Vault has been triggered, and you've been designated as a beneficiary.
      </p>
      
      <p style="${emailStyles.text}">
        ${params.ownerName} took the time to plan for this moment and wanted to ensure their 
        digital assets would be passed on to you.
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0; font-weight: 600;">Your Inheritance:</p>
        <p style="margin: 10px 0 0 0; font-size: 20px; color: #10b981;">
          ${params.percentage}% of ${params.ownerName}'s digital assets
        </p>
        <p style="margin: 15px 0 0 0; color: #888888; font-size: 14px;">
          A ${params.timelockDays}-day waiting period ensures security. After this period, 
          you'll be able to claim your designated portion.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.claimLink}" style="${emailStyles.button}">
          View Inheritance Details
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        We understand this is a sensitive time. Our support team is available to help 
        guide you through the process. You'll receive another notification when your 
        assets are ready for claim.
      </p>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #888888; font-style: italic;">
        "Digital assets are more than just currency - they represent memories, investments, 
        and a legacy worth preserving."
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🕊️ ${params.ownerName} has left you a digital inheritance`,
      html: baseTemplate(content),
    });
  }

  async sendWelcomeEmail(params: {
    to: string;
    userName: string;
  }): Promise<void> {
    const content = `
      <h2 style="${emailStyles.title}">Welcome to Paradex! 🎉</h2>
      
      <p style="${emailStyles.text}">
        Hi ${params.userName},
      </p>
      
      <p style="${emailStyles.text}">
        Thank you for joining Paradex - your self-custody crypto wallet with 
        inheritance planning built in. We're excited to have you!
      </p>
      
      <div style="${emailStyles.card}">
        <p style="margin: 0; color: #e0e0e0; font-weight: 600;">Get Started:</p>
        <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #aaaaaa; font-size: 14px;">
          <li style="margin-bottom: 8px;">🔐 Set up your wallet security</li>
          <li style="margin-bottom: 8px;">💱 Make your first swap (0.79% fee supports the platform)</li>
          <li style="margin-bottom: 8px;">🛡️ Add guardians for social recovery</li>
          <li style="margin-bottom: 8px;">📜 Create an inheritance vault for your loved ones</li>
          <li>💰 Earn yield on your assets</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}" style="${emailStyles.button}">
          Open Your Wallet
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #666666;">
        Need help? Check out our docs or reach out to support anytime.
      </p>
    `;

    await this.send({
      to: params.to,
      subject: `🎉 Welcome to Paradex - Let's get started!`,
      html: baseTemplate(content),
    });
  }
}

// Export singleton
export const emailService = new ResendEmailService();
