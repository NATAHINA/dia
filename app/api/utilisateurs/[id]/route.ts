import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// 1. Définition du type conforme à Next.js 15+ (params est une Promise)
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    
    // 2. Résolution asynchrone obligatoire de la promesse params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "L'identifiant requis est absent" }, { status: 400 });
    }

    const body = await request.json();

    const userModifie = await User.findByIdAndUpdate(
      id, // On utilise l'ID extrait après le await
      { 
        nom: body.nom, 
        email: body.email?.toLowerCase().trim(), 
        role: body.role, 
        statut: body.statut 
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!userModifie) {
      return NextResponse.json({ error: 'Utilisateur introuvable en base de données' }, { status: 404 });
    }

    return NextResponse.json(userModifie, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}

// Pensez également à appliquer la même correction sur la méthode DELETE si elle est dans ce fichier :
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "L'identifiant requis est absent" }, { status: 400 });
    }

    const userSupprime = await User.findByIdAndDelete(id);
    if (!userSupprime) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}