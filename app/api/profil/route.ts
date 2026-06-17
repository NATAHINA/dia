import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Récupération de l'ID depuis le header
    const userId = request.headers.get('x-user-id');
    
    if (!userId || userId === "null" || userId === "undefined") {
      return NextResponse.json({ error: 'Identifiant utilisateur manquant dans les en-têtes' }, { status: 400 });
    }
    
    const profil = await User.findById(userId).select('-password');
    if (!profil) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }
    
    return NextResponse.json(profil, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || body.userId;
    const { action } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    if (action === 'UPDATE_INFO') {
      user.nom = body.nom;
      user.email = body.email.toLowerCase();
      user.telephone = body.telephone;
      await user.save();
      
      return NextResponse.json({ success: true, message: 'Profil mis à jour' });
    }

    if (action === 'CHANGE_PASSWORD') {
      const { currentPassword, newPassword } = body;

      // Vérifier si l'ancien mot de passe match en BDD
      const passwordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!passwordCorrect) {
        return NextResponse.json({ error: 'Le mot de passe actuel est incorrect.' }, { status: 400 });
      }

      // Hacher le nouveau mot de passe
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return NextResponse.json({ success: true, message: 'Mot de passe modifié avec succès !' });
    }

    // ACTION C : Mise à jour des commutateurs de préférences (Switch)
    if (action === 'UPDATE_PREFERENCES') {
      user.notifEmail = body.notifEmail;
      user.notifVentes = body.notifVentes;
      await user.save();

      return NextResponse.json({ success: true, message: 'Préférences système enregistrées' });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}