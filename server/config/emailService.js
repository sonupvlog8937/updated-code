import dotenv from "dotenv";
import nodemailer from "nodemailer";
import logger from "./Logger.js";

dotenv.config();

function createTransporter() {
  const emailUser = process.env.SMTP_USER;   // ✅ Fixed: was EMAIL, now SMTP_USER (matches your .env)
  const emailPass = process.env.SMTP_PASS;   // ✅ Fixed: was EMAIL_PASS, now SMTP_PASS

  if (!emailUser || !emailPass) {
    throw new Error("Missing SMTP_USER or SMTP_PASS environment variables");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // ✅ BUG FIX: was "fase" (typo) → now proper boolean check
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

async function sendEmail(to, subject, text, html) {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `${process.env.STORE_NAME || 'Zeedaddy'} <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent to ${to} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Error sending email", { error: error.message, to });
    return { success: false, error: error.message };
  }
}

export { sendEmail };