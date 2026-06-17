import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Circuit from '@/models/Circuit';

export async function GET() {
  try {
    await dbConnect();
    const circuits = await Circuit.find({}).sort({ nom: 1 });
    return NextResponse.json(circuits, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const nouveauCircuit = await Circuit.create(body);
    return NextResponse.json(nouveauCircuit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}