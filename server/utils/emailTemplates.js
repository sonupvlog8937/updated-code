// utils/emailTemplates.js
const getOtpEmailHtml = ({ customerName, otp, orderId, trackingUrl, supportUrl, customerEmail }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Delivery OTP - Zeedaddy</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Brand Logo -->
          <tr>
            <td align="center" style="padding: 20px 0 12px;">
              <span style="font-size:24px; font-weight:700; color:#C000C0; letter-spacing:-0.5px;">Zee</span><span style="font-size:24px; font-weight:700; color:#333333;">daddy</span>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e0e0e0;">

              <!-- Hero Header -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg, #C000C0 0%, #8800AA 100%); padding: 40px 32px 32px;">
                    <!-- Icon -->
                    <div style="width:64px; height:64px; background:rgba(255,255,255,0.15); border-radius:50%; margin:0 auto 16px; border:2px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; text-align:center; line-height:64px; font-size:28px;">
                      📬
                    </div>
                    <h1 style="margin:0 0 8px; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.3px;">Delivery OTP</h1>
                    <p style="margin:0; color:rgba(255,255,255,0.8); font-size:14px;">Your order is out for delivery</p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 32px 32px 24px;">

                    <!-- Greeting -->
                    <p style="margin:0 0 24px; color:#444444; font-size:15px; line-height:1.6;">
                      Hi <strong style="color:#222222;">{{customerName}}</strong>, your delivery partner is on the way! Share the OTP below with them to confirm your delivery.
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center" style="background:#faf5ff; border:2px dashed #C000C0; border-radius:12px; padding:28px 20px;">
                          <p style="margin:0 0 8px; color:#888888; font-size:11px; letter-spacing:2px; text-transform:uppercase; font-weight:600;">One-Time Password</p>
                          <p style="margin:0 0 12px; font-size:40px; font-weight:800; color:#C000C0; letter-spacing:16px; font-family:'Courier New', Courier, monospace; text-indent:16px;">{{otp}}</p>
                          <!-- Progress bar (static visual) -->
                          <table width="80%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 8px;">
                            <tr>
                              <td style="background:#f0e0f0; border-radius:4px; height:4px; overflow:hidden;">
                                <div style="background:#C000C0; height:4px; width:100%; border-radius:4px;"></div>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:0; color:#999999; font-size:12px;">
                            ⏱ Valid for <strong style="color:#C000C0;">10 minutes</strong> only
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Info Cards Row -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                      <tr>
                        <td width="33%" align="center" style="background:#f8f8f8; border-radius:10px; padding:14px 8px; border:1px solid #eeeeee;">
                          <div style="font-size:22px; margin-bottom:4px;">📦</div>
                          <p style="margin:0; font-size:10px; color:#888888; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">Order ID</p>
                          <p style="margin:4px 0 0; font-size:13px; color:#333333; font-weight:700;">{{orderId}}</p>
                        </td>
                        <td width="2%"></td>
                        <td width="33%" align="center" style="background:#f8f8f8; border-radius:10px; padding:14px 8px; border:1px solid #eeeeee;">
                          <div style="font-size:22px; margin-bottom:4px;">🚴</div>
                          <p style="margin:0; font-size:10px; color:#888888; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">Status</p>
                          <p style="margin:4px 0 0; font-size:13px; color:#333333; font-weight:700;">Out for Delivery</p>
                        </td>
                        <td width="2%"></td>
                        <td width="33%" align="center" style="background:#f8f8f8; border-radius:10px; padding:14px 8px; border:1px solid #eeeeee;">
                          <div style="font-size:22px; margin-bottom:4px;">🔒</div>
                          <p style="margin:0; font-size:10px; color:#888888; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">Secured By</p>
                          <p style="margin:4px 0 0; font-size:13px; color:#333333; font-weight:700;">Zeedaddy</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:#fff8e1; border-left:3px solid #f59e0b; border-radius:0 8px 8px 0; padding:14px 16px;">
                          <p style="margin:0; color:#92400e; font-size:13px; line-height:1.6;">
                            <strong>⚠ Security Notice:</strong> Never share this OTP with anyone, including Zeedaddy support. Our agents will <strong>never</strong> ask for your OTP.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <a href="{{trackingUrl}}" style="display:inline-block; background:#C000C0; color:#ffffff; text-decoration:none; padding:14px 36px; border-radius:8px; font-weight:700; font-size:15px; letter-spacing:0.3px;">Track Your Order →</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Support note -->
                    <p style="margin:0; color:#aaaaaa; font-size:12px; text-align:center; line-height:1.6;">
                      Didn't place this order? <a href="{{supportUrl}}" style="color:#C000C0; text-decoration:none; font-weight:600;">Contact our support team</a> immediately.
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#fafafa; border-top:1px solid #eeeeee; padding:20px 32px; text-align:center;">
                    <p style="margin:0 0 6px; color:#bbbbbb; font-size:11px; letter-spacing:0.3px;">© 2025 Zeedaddy. All rights reserved.</p>
                    <p style="margin:0; font-size:11px; color:#cccccc;">
                      <a href="{{unsubscribeUrl}}" style="color:#C000C0; text-decoration:none;">Unsubscribe</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="{{privacyUrl}}" style="color:#C000C0; text-decoration:none;">Privacy Policy</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="{{supportUrl}}" style="color:#C000C0; text-decoration:none;">Help Center</a>
                    </p>
                    <p style="margin:8px 0 0; color:#dddddd; font-size:10px;">This email was sent to {{customerEmail}}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
          <!-- End Main Card -->

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`  // paste full HTML here
    .replace("{{customerName}}", customerName || "Customer")
    .replace("{{otp}}", otp)
    .replace("{{orderId}}", orderId || "")
    .replace("{{trackingUrl}}", trackingUrl || "#")
    .replace("{{supportUrl}}", supportUrl || "#")
    .replace("{{customerEmail}}", customerEmail || "")
    .replace("{{unsubscribeUrl}}", "#")
    .replace("{{privacyUrl}}", "#");
};

export { getOtpEmailHtml };
export default getOtpEmailHtml;