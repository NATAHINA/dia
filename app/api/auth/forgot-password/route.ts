import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import crypto from 'crypto';
import { sendSystemEmail } from '@/lib/mailService';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { email } = await req.json();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log("Utilisateur introuvable.");
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // 2. Génération token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();
    console.log("Token généré et sauvegardé.");

    // 3. Debug envoi email
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const resetUrl = `${protocol}://${host}/reset-password/${token}`;


    await sendSystemEmail({
      to: email,
      subject: "Réinitialisation de votre mot de passe - Dia Travel",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #228be6;">Réinitialisation de votre mot de passe</h2>
          <p>Bonjour ${user.nom},</p>
          <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong>Dia Travel</strong>.</p>
          <p>Si vous êtes à l'origine de cette demande, veuillez cliquer sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien est sécurisé et expirera dans <strong>1 heure</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #228be6; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>

          <p style="font-size: 0.9em; color: #666;">
            Si vous n'avez pas effectué cette demande, vous pouvez ignorer cet email en toute sécurité. 
            Aucune modification n'a été apportée à votre compte.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8em; color: #999;">
            Cordialement,<br>
            L'équipe Dia Travel
          </p>
        </div>
      `
    });

    return NextResponse.json({ message: "Email envoyé" }, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({ 
        error: "Erreur serveur", 
        details: error.message 
    }, { status: 500 });
  }
}