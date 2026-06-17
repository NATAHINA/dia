import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Client from '@/models/Client';

export async function GET() {
  try {
    await dbConnect();
    const clients = await Client.find({}).sort({ nomComplet: 1 });
    return NextResponse.json(clients, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const nouveauClient = await Client.create(body);
    return NextResponse.json(nouveauClient, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}