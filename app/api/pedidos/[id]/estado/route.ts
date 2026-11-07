import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


const ESTADOS_VALIDOS = ['nuevo', 'pagado', 'entregado', 'cancelado'] as const;
type EstadoValido = (typeof ESTADOS_VALIDOS)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Verificar sesión y rol admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!perfil || perfil.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // 2. Leer body
  let body: { estado?: string; nota?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.estado || !ESTADOS_VALIDOS.includes(body.estado as EstadoValido)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  // 3. Llamar a la RPC
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('cambiar_estado_pedido', {
    p_pedido_id: id,
    p_estado: body.estado,
    p_nota: body.nota ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pedido = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    id: pedido.id,
    codigo: pedido.codigo,
    estado: pedido.estado,
  });
}