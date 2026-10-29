import { NextResponse } from 'next/server';

// TODO: verificar firma con STRIPE_WEBHOOK_SECRET y actualizar pedido
export async function POST(request: Request) {
  const body = await request.text();
  return NextResponse.json({ received: true });
}
