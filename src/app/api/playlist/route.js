import { NextResponse } from 'next/server';
import { getPlaylist } from '@/lib/api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const data = await getPlaylist(id);
  return NextResponse.json(data);
}
