import { Resend } from 'resend';
import logger from '../config/Logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email bhejne ka main function — Resend API use karta hai
 * (SMTP ki jagah HTTP API — Render/Railway pe perfectly kaam karta hai)
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
        if (!sendTo) {
            logger.error('sendEmailFun: sendTo is missing');
            return false;
        }

        const { data, error } = await resend.emails.send({
            from: `${process.env.STORE_NAME || 'Zeedaddy'} <noreply@zeedaddy.in>`,
            to: Array.isArray(sendTo) ? sendTo : [sendTo],
            subject,
            text,
            html,
        });

        if (error) {
            logger.error('Resend email error', { error, sendTo, subject });
            return false;
        }

        logger.info(`Email sent → ${sendTo} | ID: ${data?.id}`);
        return true;

    } catch (err) {
        logger.error('sendEmailFun exception', { error: err.message, sendTo });
        return false;
    }
};

export default sendEmailFun;