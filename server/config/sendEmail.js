import { Resend } from 'resend';
import logger from './Logger.js';
import { sendEmail as sendEmailViaSmtp } from './emailService.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const normalizeRecipients = (sendTo, to) => {
  const input = sendTo || to;
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  if (typeof input === 'string') return [input.trim()].filter(Boolean);
  return [];
};

const sendWithResend = async ({ recipients, subject, text, html }) => {
  if (!resend) return { ok: false, reason: 'RESEND_DISABLED' };

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || `${process.env.STORE_NAME || 'Zeedaddy'} <noreply@zeedaddy.in>`,
    to: recipients,
    subject,
    text,
    html,
  });

  if (error) {
    logger.error('Resend email error', { error, recipients, subject });
    return { ok: false, reason: 'RESEND_ERROR' };
  }

  logger.info(`Email sent via Resend → ${recipients.join(',')} | ID: ${data?.id}`);
  return { ok: true };
};

const sendWithSmtpFallback = async ({ recipients, subject, text, html }) => {
  const result = await sendEmailViaSmtp(recipients, subject, text, html);
  if (!result?.success) {
    logger.error('SMTP fallback email failed', { recipients, subject, error: result?.error });
    return false;
  }

  logger.info(`Email sent via SMTP fallback → ${recipients.join(',')} | ID: ${result.messageId}`);
  return true;
};
const sendEmailFun = async ({ sendTo, to, subject, text = '', html }) => {
  try {
    const recipients = normalizeRecipients(sendTo, to);

    if (!recipients.length) {
      logger.error('sendEmailFun: No recipients defined', { sendTo, to, subject });
      return false;
    }

    const resendResult = await sendWithResend({ recipients, subject, text, html });
    if (resendResult.ok) return true;

    return await sendWithSmtpFallback({ recipients, subject, text, html });
  } catch (err) {
    logger.error('sendEmailFun exception', { error: err.message, sendTo, to, subject });
    return false;
  }
};

export default sendEmailFun;