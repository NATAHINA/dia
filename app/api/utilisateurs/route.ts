import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET : Récupérer tous les utilisateurs
export async function GET() {
  try {
    await dbConnect();
    // On exclut le mot de passe par sécurité
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST : Créer un nouveau collaborateur
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { nom, email, role, statut, telephone } = body;

    if (!nom || !email) {
      return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const userExiste = await User.findOne({ email });
    if (userExiste) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
    }

    // Mot de passe par défaut temporaire (Ex: Agence2026!) que l'agent modifiera sur son profil
    const hashedPassword = await bcrypt.hash('Agence2026!', 10);

    const newCollaborateur = await User.create({
      nom,
      email,
      password: hashedPassword,
      role: role || 'Agent',
      statut: statut || 'Actif',
      telephone: telephone || '-',
    });

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userSansPassword } = newCollaborateur.toObject();
    return NextResponse.json(userSansPassword, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}