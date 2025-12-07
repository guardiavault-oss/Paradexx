/**
 * Email Verification Service
 * Handles sending and validating verification codes
 * Supports: Resend connector, Resend API key, SendGrid API key
 */

import { Resend } from 'resend';
import { logger } from '../services/logger.service';
import crypto from 'crypto';

// Email configuration
const DEFAULT_FROM_EMAIL = process.env.FROM_EMAIL || 'Paradex <noreply@aldvra.resend.app>';
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
    logger.info('✅ Email: Using Resend connector');
    logger.info(`   From email: ${connectorFromEmail}`);
    return;
  }

  // Try Resend API key
  if (RESEND_API_KEY) {
    resendClient = new Resend(RESEND_API_KEY);
    emailProvider = 'resend_api';
    logger.info('✅ Email: Using Resend API key');
    return;
  }

  // Try SendGrid
  if (SENDGRID_API_KEY) {
    emailProvider = 'sendgrid';
    logger.info('✅ Email: Using SendGrid');
    return;
  }

  // Fallback to console logging
  emailProvider = 'console';
  logger.warn('⚠️  No email provider configured. Using console logging.');
}

// Initialize on module load
initEmailProvider();

// Send email using configured provider
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
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
        const fromEmail = connectorFromEmail || DEFAULT_FROM_EMAIL;
        logger.info(`[EMAIL] Sending to ${to} from ${fromEmail}`);
        logger.info(`[EMAIL] Using Resend API key: ${RESEND_API_KEY ? RESEND_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
        
        try {
          // Create plain text version for better deliverability
          const plainText = html
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
          
          const result = await resendClient.emails.send({
            from: fromEmail,
            to,
            subject,
            html,
            text: plainText,
            // Add headers for better deliverability
            headers: {
              'X-Entity-Ref-ID': crypto.randomBytes(16).toString('hex'),
            },
          });
          
          // Log the result for debugging
          if (result.error) {
            logger.error(`[EMAIL ERROR] Resend API error:`, JSON.stringify(result.error, null, 2));
            logger.error(`[EMAIL ERROR] Full error details:`, result.error);
            return false;
          }
          
          logger.info(`[EMAIL] ✅ Email queued successfully. ID: ${result.data?.id || 'N/A'}`);
          logger.info(`[EMAIL] Response:`, JSON.stringify(result.data || {}, null, 2));
          return true;
        } catch (error) {
          logger.error(`[EMAIL ERROR] Exception during send:`, error);
          logger.error(`[EMAIL ERROR] Error message:`, error.message);
          logger.error(`[EMAIL ERROR] Error stack:`, error.stack);
          return false;
        }
      } else {
        logger.error(`[EMAIL ERROR] Resend client not initialized. Provider: ${emailProvider}`);
        logger.error(`[EMAIL ERROR] RESEND_API_KEY present: ${!!RESEND_API_KEY}`);
        return false;
      }
    }

    if (emailProvider === 'sendgrid' && SENDGRID_API_KEY) {
      const startTime = Date.now();
      
      // Use mail_settings to prioritize delivery and ensure not in sandbox
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ 
            to: [{ email: to }],
            // Priority settings for faster delivery
            mail_settings: {
              sandbox_mode: { enable: false }, // Ensure not in sandbox
            }
          }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || DEFAULT_FROM_EMAIL.replace(/<|>/g, '').split(' ').pop() },
          subject,
          content: [{ type: 'text/html', value: html }],
          // Request immediate processing
          mail_settings: {
            sandbox_mode: { enable: false },
          },
        }),
      });
      
      const duration = Date.now() - startTime;
      if (response.ok) {
        logger.info(`[EMAIL] SendGrid accepted email in ${duration}ms`);
        return true;
      } else {
        const errorText = await response.text();
        logger.error(`[EMAIL ERROR] SendGrid failed (${response.status}): ${errorText}`);
        
        // If SendGrid fails, try Resend as fallback if available
        if (RESEND_API_KEY && !resendClient) {
          logger.info(`[EMAIL] Attempting Resend fallback...`);
          resendClient = new Resend(RESEND_API_KEY);
          emailProvider = 'resend_api';
          // Retry with Resend
          try {
            const result = await resendClient.emails.send({
              from: DEFAULT_FROM_EMAIL,
              to,
              subject,
              html,
            });
            if (result.error) {
              logger.error(`[EMAIL ERROR] Resend fallback failed:`, result.error);
              return false;
            }
            logger.info(`[EMAIL] Resend fallback succeeded`);
            return true;
          } catch (fallbackError) {
            logger.error(`[EMAIL ERROR] Resend fallback error:`, fallbackError);
            return false;
          }
        }
        
        return false;
      }
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

// In-memory store for verification codes (use Redis in production)
interface VerificationEntry {
  code: string;
  email: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

const verificationStore = new Map<string, VerificationEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [key, entry] of verificationStore.entries()) {
    if (entry.expiresAt < now) {
      verificationStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a 6-digit verification code
 */
function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate a verification token (used as key in store)
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Email template for verification code
 */
function getVerificationEmailHtml(code: string, name?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Paradex</title>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00ADEF 0%, #9B59B6 100%); padding: 40px 30px; text-align: center;">
      <img src="https://app.paradex.trade/paradex-official.png" alt="Paradex Logo" style="max-width: 120px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none';" />
      <h1 style="font-size: 28px; font-weight: bold; color: white; margin: 0;">Paradex</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Self-Custody. Simplified.</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 30px; background: #121212;">
      <h2 style="font-size: 24px; font-weight: 600; color: #ffffff; margin: 0 0 20px 0;">
        Verify Your Email
      </h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #aaaaaa; margin: 0 0 20px 0;">
        Hi ${name || 'there'},
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #aaaaaa; margin: 0 0 30px 0;">
        Welcome to Paradex! Please use the following verification code to complete your registration:
      </p>
      
      <!-- Verification Code Box -->
      <div style="background: #1a1a1a; border: 2px solid #00ADEF; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #888888; text-transform: uppercase; letter-spacing: 2px;">
          Your Verification Code
        </p>
        <div style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #00ADEF; font-family: 'Courier New', monospace;">
          ${code}
        </div>
        <p style="margin: 15px 0 0 0; font-size: 13px; color: #666666;">
          This code expires in 10 minutes
        </p>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #666666; margin: 20px 0 0 0;">
        If you didn't create a Paradex account, you can safely ignore this email.
      </p>
      
      <!-- Security Notice -->
      <div style="background: #ffc10715; border: 1px solid #ffc10730; border-radius: 12px; padding: 16px; margin: 30px 0;">
        <p style="margin: 0; color: #ffc107; font-size: 13px;">
          ⚠️ Never share this code with anyone. Paradex staff will never ask for your verification code.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding: 30px; background: #0a0a0a; text-align: center; border-top: 1px solid #1a1a1a;">
      <p style="font-size: 12px; color: #666666; margin: 0;">
        © ${new Date().getFullYear()} Paradex. All rights reserved.
      </p>
      <p style="font-size: 12px; color: #666666; margin-top: 10px;">
        Questions? <a href="mailto:help@paradex.trade" style="color: #00ADEF; text-decoration: none;">help@paradex.trade</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Guardian notification email template
 */
function getGuardianNotificationHtml(params: {
  guardianName: string;
  ownerName: string;
  ownerEmail: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Added as a Guardian - Paradex</title>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #9B59B6 0%, #00ADEF 100%); padding: 40px 30px; text-align: center;">
      <img src="https://app.paradex.trade/paradex-official.png" alt="Paradex Logo" style="max-width: 120px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none';" />
      <h1 style="font-size: 28px; font-weight: bold; color: white; margin: 0;">Paradex</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Guardian Network</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 30px; background: #121212;">
      <h2 style="font-size: 24px; font-weight: 600; color: #ffffff; margin: 0 0 20px 0;">
        You've Been Chosen as a Guardian 🛡️
      </h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #aaaaaa; margin: 0 0 20px 0;">
        Hi ${params.guardianName},
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #aaaaaa; margin: 0 0 20px 0;">
        <strong style="color: #ffffff;">${params.ownerName}</strong> (${params.ownerEmail}) has added you as a guardian for their Paradex wallet.
      </p>
      
      <!-- What This Means -->
      <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #9B59B6; font-size: 16px;">What does this mean?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #aaaaaa; font-size: 14px; line-height: 1.8;">
          <li>You're now part of ${params.ownerName}'s wallet security network</li>
          <li>If they ever lose access, you can help them recover their wallet</li>
          <li>You'll receive a notification if a recovery is initiated</li>
          <li>You cannot access their funds - only help with recovery approval</li>
        </ul>
      </div>
      
      <!-- How It Works -->
      <div style="background: #00ADEF15; border: 1px solid #00ADEF30; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #00ADEF; font-size: 16px;">How Guardian Recovery Works</h3>
        <p style="margin: 0; color: #aaaaaa; font-size: 14px; line-height: 1.6;">
          If ${params.ownerName} loses access to their wallet, they can initiate a recovery request. 
          Multiple guardians (including you) would need to approve this request before their wallet can be restored. 
          This ensures no single person can steal their funds.
        </p>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #666666; margin: 20px 0 0 0;">
        No action is needed from you right now. You'll be contacted if ${params.ownerName} ever needs your help with recovery.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="padding: 30px; background: #0a0a0a; text-align: center; border-top: 1px solid #1a1a1a;">
      <p style="font-size: 12px; color: #666666; margin: 0;">
        © ${new Date().getFullYear()} Paradex. All rights reserved.
      </p>
      <p style="font-size: 12px; color: #666666; margin-top: 10px;">
        Questions? <a href="mailto:help@paradex.trade" style="color: #00ADEF; text-decoration: none;">help@paradex.trade</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export const verificationService = {
  /**
   * Send a verification code to an email address
   * Returns a token that can be used to verify the code
   */
  async sendVerificationCode(email: string, name?: string): Promise<{ token: string; success: boolean; error?: string }> {
    try {
      // Check for existing pending verification (rate limiting)
      // Allow resend after 30 seconds instead of 60 seconds for better UX
      for (const [token, entry] of verificationStore.entries()) {
        if (entry.email === email && entry.expiresAt > new Date() && !entry.verified) {
          // Already has a pending verification, check if we should allow resend
          const createdAt = entry.expiresAt.getTime() - 10 * 60 * 1000; // Calculate when it was created
          const ageMs = Date.now() - createdAt;
          if (ageMs < 30 * 1000) { // Less than 30 seconds old
            return { token, success: false, error: 'Please wait before requesting another code' };
          }
          // Delete old entry to create new one
          verificationStore.delete(token);
          break;
        }
      }

      const code = generateCode();
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store verification entry
      verificationStore.set(token, {
        code,
        email: email.toLowerCase().trim(),
        expiresAt,
        attempts: 0,
        verified: false,
      });

      // Send email asynchronously (don't block response)
      // This improves UX by returning immediately while email is sent in background
      const emailPromise = sendEmail(
        email,
        `🔐 ${code} is your Paradex verification code`,
        getVerificationEmailHtml(code, name)
      );

      // Log code only in development mode
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[VERIFICATION] Code for ${email}: ${code}`);
      }

      // Handle email result asynchronously (don't block)
      emailPromise.then((emailSent) => {
        if (emailSent) {
          logger.info(`[VERIFICATION] Email queued successfully for ${email}`);
        } else {
          logger.warn(`[VERIFICATION] Email sending failed for ${email}. Check email provider configuration.`);
        }
      }).catch((error) => {
        logger.error(`[VERIFICATION] Email sending error for ${email}:`, error);
      });

      // Return immediately - email is being sent asynchronously
      // This prevents delays from email provider affecting user experience
      return { token, success: true };
    } catch (error) {
      logger.error('[VERIFICATION ERROR]', error);
      return { token: '', success: false, error: 'Failed to send verification code' };
    }
  },

  /**
   * Verify a code using the token
   */
  verifyCode(token: string, code: string): { success: boolean; email?: string; error?: string } {
    // Dev mode: Auto-verify any code (bypass email verification)
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[VERIFICATION] 🔧 DEV MODE: Auto-verifying code (bypass enabled)`);
      
      // Still try to find the entry to get the email
      const normalizedToken = token?.trim();
      const entry = verificationStore.get(normalizedToken);
      
      if (entry) {
        // Mark as verified
        entry.verified = true;
        verificationStore.set(normalizedToken, entry);
        logger.info(`[VERIFICATION] ✅ DEV MODE: Email auto-verified for ${entry.email}`);
        return { success: true, email: entry.email };
      } else {
        // If no entry found, create a mock verification
        logger.info(`[VERIFICATION] ✅ DEV MODE: Mock verification (no token found)`);
        return { success: true, email: 'dev@paradex.trade' };
      }
    }

    // Normalize inputs
    const normalizedToken = token?.trim();
    const normalizedCode = code?.trim();

    if (!normalizedToken || !normalizedCode) {
      return { success: false, error: 'Verification token and code are required' };
    }

    // Validate code format (must be 6 digits)
    if (!/^\d{6}$/.test(normalizedCode)) {
      return { success: false, error: 'Verification code must be 6 digits' };
    }

    const entry = verificationStore.get(normalizedToken);

    if (!entry) {
      logger.warn(`[VERIFICATION] Token not found: ${normalizedToken.substring(0, 8)}...`);
      logger.warn(`[VERIFICATION] Available tokens: ${Array.from(verificationStore.keys()).map(k => k.substring(0, 8)).join(', ')}`);
      return { success: false, error: 'Invalid or expired verification token' };
    }
    
    logger.info(`[VERIFICATION] Found entry for token. Email: ${entry.email}, Code: ${entry.code}, Expires: ${entry.expiresAt}`);

    if (entry.expiresAt < new Date()) {
      verificationStore.delete(normalizedToken);
      return { success: false, error: 'Verification code has expired' };
    }

    if (entry.verified) {
      return { success: false, error: 'Code already used' };
    }

    if (entry.attempts >= 5) {
      verificationStore.delete(normalizedToken);
      return { success: false, error: 'Too many attempts. Please request a new code.' };
    }

    entry.attempts++;

    // Strict comparison - ensure both are strings and match exactly
    const storedCode = String(entry.code).trim();
    const providedCode = String(normalizedCode).trim();

    // Enhanced logging for debugging
    logger.info(`[VERIFICATION] Code comparison - Stored: "${storedCode}" (length: ${storedCode.length}), Provided: "${providedCode}" (length: ${providedCode.length})`);
    logger.info(`[VERIFICATION] Code match: ${storedCode === providedCode}, Token: ${normalizedToken.substring(0, 8)}...`);

    if (storedCode !== providedCode) {
      verificationStore.set(normalizedToken, entry);
      logger.warn(`[VERIFICATION] Invalid code attempt for ${entry.email}. Expected: "${storedCode}", Got: "${providedCode}", Attempts: ${entry.attempts}`);
      return { success: false, error: 'Invalid verification code' };
    }

    // Mark as verified
    entry.verified = true;
    verificationStore.set(normalizedToken, entry);

    logger.info(`[VERIFICATION] Code verified successfully for ${entry.email}`);
    return { success: true, email: entry.email };
  },

  /**
   * Check if a token is valid (not expired and not yet verified)
   */
  isTokenValid(token: string): boolean {
    const entry = verificationStore.get(token);
    if (!entry) return false;
    if (entry.expiresAt < new Date()) return false;
    if (entry.verified) return false;
    return true;
  },

  /**
   * Get email for a verified token
   */
  getVerifiedEmail(token: string): string | null {
    const entry = verificationStore.get(token);
    if (!entry || !entry.verified) return null;
    return entry.email;
  },

  /**
   * Clean up a token after use
   */
  deleteToken(token: string): void {
    verificationStore.delete(token);
  },

  /**
   * Send guardian notification email
   */
  async sendGuardianNotification(params: {
    guardianEmail: string;
    guardianName: string;
    ownerName: string;
    ownerEmail: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const emailSent = await sendEmail(
        params.guardianEmail,
        `${params.ownerName} has added you as a Guardian`,
        getGuardianNotificationHtml({
          guardianName: params.guardianName,
          ownerName: params.ownerName,
          ownerEmail: params.ownerEmail,
        })
      );

      if (emailSent) {
        logger.info(`[GUARDIAN NOTIFICATION] Sent to ${params.guardianEmail}`);
      } else {
        logger.info(`[GUARDIAN NOTIFICATION-DEV] Would send to ${params.guardianEmail} for owner ${params.ownerName}`);
      }
      return { success: true };
    } catch (error) {
      logger.error('[GUARDIAN NOTIFICATION ERROR]', error);
      return { success: false, error: 'Failed to send guardian notification' };
    }
  },
};
