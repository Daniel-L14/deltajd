import { NextResponse } from 'next/server';

// TODO: callback de Supabase Auth
export async function GET() {
  return NextResponse.json({ ok: true });
}
