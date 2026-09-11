const https = require('https');
const logger = require('../utils/logger');

/**
 * Send email via Resend HTTP API (works on Railway — no SMTP port blocking).
 * Free tier: 3,000 emails/month.
 * Sign up at https://resend.com
 */
async function sendViaResend(toEmail, subject, html, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      from: 'CollabCode <onboarding@resend.dev>',
      to: [toEmail],
      subject,
      html,
      text,
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Resend API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(body);
    req.end();
  });
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!process.env.RESEND_API_KEY) {
    // No email service configured — just log the URL (dev mode)
    logger.warn(`[DEV] No email service configured. Reset URL: ${resetUrl}`);
    return;
  }

  const subject = 'Reset your CollabCode password';

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f0f4f8;font-family:Inter,ui-sans-serif,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:16px;overflow:hidden;
                     box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);
                           padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">CollabCode</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                    Real-time collaborative coding
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:700;">
                    Reset your password
                  </h2>
                  <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                    We received a request to reset your CollabCode password.
                    This link expires in <strong>1 hour</strong>.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${resetUrl}"
                      style="display:inline-block;padding:14px 32px;
                             background:linear-gradient(135deg,#0ea5e9,#3b82f6);
                             color:#fff;text-decoration:none;
                             border-radius:12px;font-weight:700;font-size:15px;">
                      Reset Password
                    </a>
                  </div>
                  <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">Or copy this link:</p>
                  <p style="margin:0 0 24px;word-break:break-all;">
                    <a href="${resetUrl}" style="color:#3b82f6;font-size:13px;">${resetUrl}</a>
                  </p>
                  <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
                  <p style="margin:0;color:#9ca3af;font-size:13px;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px;background:#f9fafb;
                           border-top:1px solid #f3f4f6;text-align:center;">
                  <p style="margin:0;color:#d1d5db;font-size:12px;">
                    © ${new Date().getFullYear()} CollabCode
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
  `;

  const text = `Reset your CollabCode password\n\nClick this link (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;

  await sendViaResend(toEmail, subject, html, text);
  logger.info(`Password reset email sent to ${toEmail} via Resend`);
}

module.exports = { sendPasswordResetEmail };
