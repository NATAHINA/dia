import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Veuillez fournir un email et un mot de passe.' },
        { status: 400 }
      );
    }

    // 1. Rechercher l'utilisateur (normalisation en minuscules)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // 2. Vérifier si l'utilisateur existe et si le compte est actif
    if (!user) {
      return NextResponse.json(
        { error: 'Identifiant ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    if (user.statut === 'Inactif') {
      return NextResponse.json(
        { error: 'Votre compte a été désactivé. Veuillez contacter un administrateur.' },
        { status: 403 }
      );
    }

    // 3. Comparer le mot de passe brut avec le mot de passe haché (bcrypt)
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Identifiant ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    // 4. Authentification réussie
    // (Note : Dans une configuration complète, vous pouvez générer un cookie/token ici)
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json(
      { 
        message: 'Connexion réussie', 
        user: userWithoutPassword 
      }, 
      { status: 200 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur serveur est survenue.' },
      { status: 500 }
    );
  }
}