import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Reservation from '@/models/Reservation';
import Depart from '@/models/Depart';


export async function GET() {
  try {
    await dbConnect();
    const reservations = await Reservation.find({}).sort({ _id: -1 });
    return NextResponse.json(reservations, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const nouvelleReservation = await Reservation.create(body);

  if (nouvelleReservation.statut === 'Confirmé') {
    const toutesLesReservations = await Reservation.find({
      circuit: nouvelleReservation.circuit,
      date: nouvelleReservation.date,
      statut: 'Confirmé'
    });

    const totalPlacesVendues = toutesLesReservations.reduce((sum, res) => sum + res.nbPersonnes, 0);

    await Depart.findOneAndUpdate(
      { circuit: nouvelleReservation.circuit, dateDepart: nouvelleReservation.date },
      { placesVendues: totalPlacesVendues },
      { upsert: true }
    );
  }

  return NextResponse.json(nouvelleReservation);
}