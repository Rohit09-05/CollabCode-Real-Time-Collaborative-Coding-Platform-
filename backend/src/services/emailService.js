const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Creates a Nodemailer transporter.
 * Supports Gmail (GMAIL_USER + GMAIL_APP_PASSWORD) or any SMTP.
 * Falls back to Ethereal (fake SMTP) in development when no creds are set.
 */
async function getTransporter() {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // Dev fallback — Ethereal
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  logger.warn('No GMAIL_USER set — using Ethereal test SMTP. Emails will NOT be delivered.');
  return transporter;
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.GMAIL_USER
      ? `"CollabCode" <${process.env.GMAIL_USER}>`
      : '"CollabCode" <no-reply@collabcode.dev>',
    to: toEmail,
    subject: 'Reset your CollabCode password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background:#f0f4f8;font-family:Inter,ui-sans-serif,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0"
                  style="background:#ffffff;border-radius:16px;overflow:hidden;
                         box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);
                               padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;
                                 letter-spacing:-0.5px;">CollabCode</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                        Real-time collaborative coding
                      </p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:700;">
                        Reset your password
                      </h2>
                      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                        We received a request to reset the password for your CollabCode account.
                        Click the button below to choose a new password.
                        This link expires in <strong>1 hour</strong>.
                      </p>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="${resetUrl}"
                          style="display:inline-block;padding:14px 32px;
                                 background:linear-gradient(135deg,#0ea5e9,#3b82f6);
                                 color:#ffffff;text-decoration:none;
                                 border-radius:12px;font-weight:700;font-size:15px;
                                 box-shadow:0 4px 16px rgba(59,130,246,0.35);">
                          Reset Password
                        </a>
                      </div>
                      <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="margin:0 0 24px;word-break:break-all;">
                        <a href="${resetUrl}"
                          style="color:#3b82f6;font-size:13px;text-decoration:none;">
                          ${resetUrl}
                        </a>
                      </p>
                      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
                      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
                        If you didn't request this, you can safely ignore this email.
                        Your password won't change unless you click the button above.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 40px;background:#f9fafb;
                               border-top:1px solid #f3f4f6;text-align:center;">
                      <p style="margin:0;color:#d1d5db;font-size:12px;">
                        © ${new Date().getFullYear()} CollabCode. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Reset your CollabCode password\n\nClick this link to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  });

  // In dev with Ethereal, log the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.info(`Preview email at: ${previewUrl}`);
  }

  logger.info(`Password reset email sent to ${toEmail}`);
}

module.exports = { sendPasswordResetEmail };
