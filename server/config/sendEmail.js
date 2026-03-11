import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email bhejne ka main function — Resend API use karta hai
 * (SMTP ki jagah HTTP API — Render pe kaam karta hai)
 *
 * @param {Object}          options
 * @param {string|string[]} options.sendTo   - recipient email(s)
 * @param {string}          options.subject  - email subject
 * @param {string}          [options.text]   - plain text fallback
 * @param {string}          options.html     - HTML body
 * @returns {Promise<boolean>}
 */
const sendEmailFun = async ({ sendTo, subject, text = '', html }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: `${process.env.STORE_NAME || 'Zeedaddy'} <noreply@zeedaddy.in>`,
            // ↑ Resend free plan mein apna domain verify karne tak onboarding@resend.dev use karo
            // Custom domain baad mein: noreply@yourdomain.com
            to: Array.isArray(sendTo) ? sendTo : [sendTo],
            subject,
            text,
            html,
        });

        if (error) {
            console.error('❌ Resend email error:', error);
            return false;
        }

        console.log(`📧 Email sent → ${sendTo} | ID: ${data?.id}`);
        return true;

    } catch (error) {
        console.error('❌ sendEmailFun error:', error.message);
        return false;
    }
};

export default sendEmailFun;