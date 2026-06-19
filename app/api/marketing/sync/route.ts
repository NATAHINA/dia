import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Marketing from '@/models/Marketing';

export async function POST() {
  try {
    await dbConnect();
    
    // 1. Appel à l'API Meta (nécessite un Access Token valide)
    const PAGE_ID = process.env.META_PAGE_ID;
    const TOKEN = process.env.META_ACCESS_TOKEN;
    const url = `https://graph.facebook.com/v25.0/${PAGE_ID}/insights?metric=page_impressions,page_messages_received&access_token=${TOKEN}`;
    
    const response = await fetch(url);
    const data = await response.json();

    const newEntry = {
      date: new Date(),
      publication: "Sync Automatique Meta",
      portee: data.data[0].values[0].value,
      messages: data.data[1].values[0].value,
      reservationsObtenues: 0,
      score: 0
    };

    await Marketing.create(newEntry);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}