import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const resendClient = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

function getSmtpCredentials() {
    const user = process.env.SMTP_USER || process.env.EMAIL;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    if (!user || !pass) return null;
    return { user, pass };
}

async function sendViaSmtp({ sendTo, subject, text, html }) {
    const credentials = getSmtpCredentials();
    if (!credentials) return false;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
        auth: credentials,
    });

    const fromName = process.env.STORE_NAME || 'Zeedaddy';
    const info = await transporter.sendMail({
        from: `"${fromName}" <${credentials.user}>`,
        to: Array.isArray(sendTo) ? sendTo.join(',') : sendTo,
        subject,
        text,
        html,
    });

    console.log(`📧 SMTP email sent → ${sendTo} | ID: ${info.messageId}`);
    return true;
}

async function sendViaResend({ sendTo, subject, text, html }) {
    if (!resendClient) return false;

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
        to: Array.isArray(sendTo) ? sendTo : [sendTo],
        subject,
        text,
        html,
    });

    if (error) {
        console.error('❌ Resend email error:', error);
        return false;
    }

    console.log(`📧 Resend email sent → ${sendTo} | ID: ${data?.id}`);
    return true;
}

/**
 * Sends email via SMTP (Gmail) first, then Resend as fallback.
 */
const sendEmailFun = async ({ sendTo, subject, text = '', html }) => {
    try {
        if (await sendViaSmtp({ sendTo, subject, text, html })) {
            return true;
        }
    } catch (error) {
        console.error('❌ SMTP send error:', error.message);
    }

    try {
        if (await sendViaResend({ sendTo, subject, text, html })) {
            return true;
        }
    } catch (error) {
        console.error('❌ Resend send error:', error.message);
    }

    return false;
};

export default sendEmailFun;
