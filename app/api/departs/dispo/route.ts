import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Depart from '@/models/Depart';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const circuit = searchParams.get('circuit');
    const dateStr = searchParams.get('date');

    if (!circuit || !dateStr) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Normalisation de la date pour la recherche (début et fin de journée globale)
    const dateRecherche = new Date(dateStr);
    dateRecherche.setUTCHours(0, 0, 0, 0);
    const lendemain = new Date(dateRecherche.getTime() + 24 * 60 * 60 * 1000);

    // Trouver le départ planifié
    const depart = await Depart.findOne({
      circuit: { $regex: new RegExp(`^${circuit.trim()}$`, 'i') },
      dateDepart: { $gte: dateRecherche, $lt: lendemain }
    });

    if (!depart) {
      return NextResponse.json({ 
        statut: 'Non planifié',
        placesRestantes: 0, 
        message: 'Aucun départ n\'est encore programmé pour cette date.' 
      });
    }

    const placesRestantes = depart.placesDisponibles - depart.placesVendues;

    return NextResponse.json({
      statut: 'Disponible',
      placesMax: depart.placesDisponibles,
      placesVendues: depart.placesVendues,
      placesRestantes: placesRestantes > 0 ? placesRestantes : 0
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}