import { Resend } from 'resend';

// Initialize Resend client
let resendClient = null;

try {
    if (process.env.RESEND_API_KEY) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
        console.log('✅ Resend client initialized');
    } else {
        console.warn('⚠️ RESEND_API_KEY not found in environment variables');
    }
} catch (error) {
    console.error('❌ Failed to initialize Resend client:', error);
}

/**
 * Sends email using Resend API
 */
const sendEmailFun = async ({ sendTo, subject, text = '', html }) => {
    console.log('📧 Attempting to send email to:', sendTo);
    
    if (!resendClient) {
        console.error('❌ Resend client not initialized - check RESEND_API_KEY');
        return false;
    }

    try {
        const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';
        const fromName = process.env.STORE_NAME || 'Zeedaddy';
        const from = fromAddress.includes('<')
            ? fromAddress
            : `${fromName} <${fromAddress}>`;

        console.log('📧 Sending from:', from);
        console.log('📧 Subject:', subject);

        const { data, error } = await resendClient.emails.send({
            from,
            to: Array.isArray(sendTo) ? sendTo : [sendTo],
            subject,
            text: text || `Email from ${fromName}`,
            html: html || text,
        });

        if (error) {
            console.error('❌ Resend API error:', JSON.stringify(error, null, 2));
            return false;
        }

        console.log(`✅ Email sent successfully → ${sendTo} | ID: ${data?.id}`);
        return true;
    } catch (error) {
        console.error('❌ Exception while sending email:', error.message);
        console.error('Stack trace:', error.stack);
        return false;
    }
};

export default sendEmailFun;
