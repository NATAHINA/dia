import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Client from '@/models/Client';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updated = await Client.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const deleted = await Client.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    return NextResponse.json({ message: 'Client supprimé' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}