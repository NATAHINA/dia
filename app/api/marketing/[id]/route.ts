import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Marketing from '@/models/Marketing';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params; 
    const body = await request.json();
    
    const msgCount = body.messages !== undefined ? Number(body.messages) : 0;
    const resCount = body.reservationsObtenues !== undefined ? Number(body.reservationsObtenues) : 0;
    
    body.score = msgCount + (resCount * 10);

    const updatedCampaign = await Marketing.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCampaign) {
      return NextResponse.json({ error: 'Publication introuvable' }, { status: 404 });
    }

    return NextResponse.json(updatedCampaign, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const deletedCampaign = await Marketing.findByIdAndDelete(id);

    if (!deletedCampaign) {
      return NextResponse.json({ error: 'Publication introuvable' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Publication supprimée avec succès' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}