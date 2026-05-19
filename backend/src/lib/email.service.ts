/* lib/email.service.ts — Gmail SMTP transporter for OTP emails.
 *
 * The transporter is created lazily on first use (not at module load time)
 * so the server starts cleanly even if SMTP credentials are not set.
 * In development without credentials, the OTP is logged to the console instead
 * of being sent — useful for local testing without a real email account.
 *
 * Required env vars: SMTP_USER (Gmail address), SMTP_PASS (App Password) */

import nodemailer from "nodemailer";

/* Build a nodemailer transport using generic SMTP or Gmail.
 * Returns null if SMTP credentials are not available. */
function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // If host is explicitly set, use custom SMTP config (e.g. Brevo or Sendgrid)
  if (host) {
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  // Default to gmail service config if SMTP_HOST is not provided
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/* Module-level singleton — created once on first call to getTransporter() */
let _transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = buildTransporter();
  }
  return _transporter;
}

/* Send a 6-digit OTP to the given email address.
 * Falls back to console.log in development when no SMTP is configured.
 * Throws HTTP 503 in production if SMTP is not configured. */
export async function sendOtpEmail(to: string, otp: string, name: string): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${to}: ${otp}`);
      return;
    }
    throw Object.assign(new Error("Email service not configured"), { status: 503 });
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const from = fromEmail?.includes("<") ? fromEmail : `"Photogram" <${fromEmail}>`;

  await transporter.sendMail({
    from,
    to,
    subject: "Your Photogram verification code",
    /* Plain-text fallback for clients that don't render HTML */
    text: `Hi ${name},\n\nYour verification code is: ${otp}\n\nIt expires in 10 minutes. Do not share it with anyone.\n\n— Photogram`,
    /* HTML email with Photogram dark-themed design */
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Georgia',serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;padding:48px 40px;">
          <tr>
            <td style="padding-bottom:32px;border-bottom:1px solid #222;">
              <p style="margin:0;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#888;">Photogram</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 0;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:2px;text-transform:uppercase;">Hello, ${name}</p>
              <p style="margin:0 0 28px;font-size:15px;color:#ccc;line-height:1.6;">
                Use the code below to verify your email address. It expires in <strong style="color:#e5e5e5;">10 minutes</strong>.
              </p>
              <div style="background:#1a1a1a;border:1px solid #333;padding:24px;text-align:center;margin:0 0 28px;">
                <span style="font-family:'Courier New',monospace;font-size:36px;letter-spacing:12px;color:#fff;font-weight:bold;">${otp}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;border-top:1px solid #222;">
              <p style="margin:0;font-size:12px;color:#555;letter-spacing:1px;">— The Photogram Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
