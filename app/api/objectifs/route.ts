import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import ObjectifModel from '@/models/Objectif';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { mois, montant } = body;

    if (!mois || montant === undefined) {
      return NextResponse.json({ error: 'Mois et montant requis' }, { status: 400 });
    }

    const Objectif = mongoose.models.Objectif || ObjectifModel;

    const objectifMisesAJour = await Objectif.findOneAndUpdate(
      { mois: parseInt(mois, 10), annee: 2026 },
      { $set: { montant: Number(montant) } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: objectifMisesAJour }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur API Objectifs :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}