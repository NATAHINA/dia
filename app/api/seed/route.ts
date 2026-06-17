import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();

    // 1. Normalisation de l'email pour la recherche (en accord avec lowercase: true)
    const testEmail = 'admin@agence.me'.toLowerCase().trim();

    // 2. Vérifier si l'utilisateur de test existe déjà
    const userExists = await User.findOne({ email: testEmail });

    if (userExists) {
      return NextResponse.json(
        { message: 'L’utilisateur de test existe déjà !' }, 
        { status: 200 }
      );
    }

    // 3. Sécurisation obligatoire : Hachage du mot de passe de test
    const hashedPassword = await bcrypt.hash('SuperPassword2026', 10);

    // 4. Création complète en incluant les nouveaux champs requis par le modèle
    const defaultUser = await User.create({
      nom: 'Administrateur Dia',
      email: testEmail,
      password: hashedPassword,
      telephone: '+261 34 00 000 00', // Optionnel mais recommandé pour éviter le '-' par défaut
      role: 'Administrateur',         // Aligné avec l'enum ['Administrateur', 'Agent', 'Comptable']
      statut: 'Actif',                // Aligné avec l'enum ['Actif', 'Inactif']
      notifEmail: true,
      notifVentes: true,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    // 5. Extraction sécurisée du mot de passe de l'objet de retour
    const { password, ...userSansPassword } = defaultUser.toObject();

    return NextResponse.json(
      { 
        message: 'Utilisateur administrateur par défaut créé avec succès !',
        user: userSansPassword 
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    // Capture les erreurs de validation Mongoose ou de connexion BDD en JSON propre
    return NextResponse.json(
      { error: error.message || 'Une erreur système interne est survenue.' }, 
      { status: 500 }
    );
  }
}