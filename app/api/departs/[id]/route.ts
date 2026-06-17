import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Depart from '@/models/Depart';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updatedDepart = await Depart.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedDepart) {
      return NextResponse.json({ error: 'Départ introuvable' }, { status: 404 });
    }

    return NextResponse.json(updatedDepart, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const deleted = await Depart.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Départ introuvable' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Départ supprimé avec succès' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}