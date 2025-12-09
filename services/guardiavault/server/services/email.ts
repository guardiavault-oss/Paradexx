import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import { logWarn } from "./logger";

let transporter: nodemailer.Transporter | null = null;
let sendGridInitialized = false;

// Initialize SendGrid if API key is available
function initSendGrid() {
  if (sendGridInitialized) return;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
    sendGridInitialized = true;
  }
}

// Get SMTP transporter (fallback if SendGrid is not configured)
function getTransport() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Send email using SendGrid (preferred) or SMTP (fallback)
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param text - Plain text email body
 * @param html - Optional HTML email body
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<{ ok: boolean; id?: string; simulated?: boolean; error?: string }> {
  // Try SendGrid first
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    try {
      initSendGrid();
      const from = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM || "noreply@guardiavault.com";
      
      const msg = {
        to,
        from,
        subject,
        text,
        ...(html && { html }),
      };

      const [response] = await sgMail.send(msg);
      return { ok: true, id: response.headers["x-message-id"] as string };
    } catch (error: any) {
      // If SendGrid fails, fall back to SMTP
      logWarn("SendGrid error, falling back to SMTP", { context: "sendEmail", error: error.message });
    }
  }

  // Fallback to SMTP
  const t = getTransport();
  if (!t) {
    return { ok: true, simulated: true };
  }
  
  const from = process.env.SMTP_FROM || "no-reply@guardiavault.local";
  const info = await t.sendMail({ 
    from, 
    to, 
    subject, 
    text,
    ...(html && { html }),
  });
  return { ok: true, id: info.messageId };
}


