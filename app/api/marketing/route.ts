import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Marketing from '@/models/Marketing';

// GET : Récupérer toutes les publications marketing
export async function GET() {
  try {
    await dbConnect();
    const campaigns = await Marketing.find({}).sort({ _id: -1 });
    return NextResponse.json(campaigns, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Calcul automatique du score d'efficacité si non fourni (ex: messages + (ventes * 10))
    const score = body.score || (Number(body.messages) + (Number(body.reservationsObtenues) * 10));

    const newCampaign = await Marketing.create({
      ...body,
      score
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}