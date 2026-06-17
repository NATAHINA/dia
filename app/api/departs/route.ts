import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Depart from '@/models/Depart';

export async function GET() {
  try {
    await dbConnect();
    const departs = await Depart.find({}).sort({ _id: 1 });
    return NextResponse.json(departs, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    
    const newDepart = await Depart.create(body);
    return NextResponse.json(newDepart, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}