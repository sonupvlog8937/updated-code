/**
 * verifyEmailTemplate.js
 * Signup ke baad verification OTP email
 *
 * @param {string} username  - user ka naam
 * @param {string} otp       - 6-digit OTP
 * @returns {string}         - HTML string
 */
const VerificationEmail = (username, otp) => {
    const storeName  = process.env.STORE_NAME  || 'Zeedaddy';
    const storeColor = process.env.STORE_COLOR || '#4CAF50';
    const year       = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email – ${storeName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#333;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;
                    border-radius:10px;overflow:hidden;
                    box-shadow:0 4px 12px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:${storeColor};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
              ${storeName}
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.88);font-size:14px;">
              Email Verification
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;">
              Hi ${username}! 👋
            </p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#555;">
              Thank you for registering with <strong>${storeName}</strong>.
              Use the OTP below to verify your email address.
              This code is valid for <strong>10 minutes</strong>.
            </p>

            <!-- OTP Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <div style="display:inline-block;
                              background:#f0fdf4;
                              border:2px dashed ${storeColor};
                              border-radius:12px;
                              padding:20px 52px;
                              text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                               color:#999;text-transform:uppercase;letter-spacing:2px;">
                      Your OTP Code
                    </p>
                    <p style="margin:0;font-size:44px;font-weight:900;
                               color:${storeColor};letter-spacing:10px;line-height:1.2;">
                      ${otp}
                    </p>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Warning -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#fffbeb;border-left:4px solid #f59e0b;
                            border-radius:6px;padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                    ⚠️ <strong>Never share this OTP</strong> with anyone.
                    If you didn't create an account, please ignore this email.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#999;line-height:1.6;">
              Need help? Contact our support team anytime.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid #eeeeee;margin:0;"/>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.7;">
              © ${year} ${storeName}. All rights reserved.<br/>
              This is an automated email — please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
};

export default VerificationEmail;