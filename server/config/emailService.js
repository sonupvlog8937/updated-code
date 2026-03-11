import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

function createTransporter() {
  const emailUser = process.env.EMAIL;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("Missing EMAIL or EMAIL_PASS environment variables");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE || "fase") === "false",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

// Function to send email
async function sendEmail(to, subject, text, html) {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: Array.isArray(to) ? to.join(",") : to, // ✅ Array ko string mein convert
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

export { sendEmail };
