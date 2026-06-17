import nodemailer from 'nodemailer';

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true' || true, // true pour le port 465, false pour les autres
  auth: {
    user: process.env.SMTP_USER, // Votre adresse email d'expédition
    pass: process.env.SMTP_PASS, // Votre mot de passe ou clé d'application sécurisée
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendSystemEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Dia Travel Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log('✉️ E-mail envoyé avec succès ! MessageID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Échec de l'envoi de l'e-mail:", error);
    throw error;
  }
}