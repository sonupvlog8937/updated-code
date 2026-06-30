import { Resend } from 'resend';

const resendClient = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

/**
 * Sends email using Resend API
 */
async function sendEmail(to, subject, text, html) {
  if (!resendClient) {
    console.error('❌ Resend API key not configured');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const fromAddress =
        process.env.RESEND_FROM ||
        process.env.EMAIL_FROM ||
        'onboarding@resend.dev';
    const fromName = process.env.STORE_NAME || 'Zeedaddy';
    const from = fromAddress.includes('<')
        ? fromAddress
        : `${fromName} <${fromAddress}>`;

    const { data, error } = await resendClient.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
    });

    if (error) {
        console.error('❌ Resend email error:', error);
        return { success: false, error: error.message };
    }

    console.log(`📧 Resend email sent → ${to} | ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

export { sendEmail };
