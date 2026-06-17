import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Reservation from '@/models/Reservation';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    // Résolution correcte des paramètres de l'URL
    const { id } = await params; 
    const body = await request.json();

    // Utilisation de findOneAndUpdate pour déclencher le hook du modèle
    const updated = await Reservation.findOneAndUpdate({ _id: id }, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const deleted = await Reservation.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Supprimé avec succès' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}