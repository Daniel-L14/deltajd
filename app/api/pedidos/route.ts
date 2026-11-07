import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type RawItem = any;

function normalizarItems(items: RawItem[]): {
  producto_id: string | null;
  nombre: string;
  precio: number;
  cantidad: number;
}[] {
  return (items ?? []).map((it) => ({
    producto_id: it.producto_id ?? it.productId ?? null,
    nombre: it.nombre ?? it.name ?? 'Producto',
    precio: Number(it.precio ?? it.price ?? 0),
    cantidad: Number(it.cantidad ?? it.quantity ?? 1),
  }));
}

function normalizarEstado(
  raw?: string | null
): 'nuevo' | 'pagado' | 'entregado' | 'cancelado' {
  const e = (raw ?? '').toLowerCase().trim();
  if (e === 'pagado' || e === 'paid') return 'pagado';
  if (e === 'entregado' || e === 'delivered') return 'entregado';
  if (e === 'cancelado' || e === 'cancelled' || e === 'canceled') return 'cancelado';
  return 'nuevo';
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (perfil && perfil.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, pedidos });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cliente_nombre,
      cliente_email, // NUEVO CAMPO RECIBIDO
      cliente_telefono,
      direccion,
      items,
      total,
      estado,
    } = body ?? {};

    if (!cliente_nombre || !cliente_telefono || !direccion) {
      return NextResponse.json(
        { error: 'Faltan datos del cliente (nombre, teléfono, dirección)' },
        { status: 400 }
      );
    }

    const itemsNormalizados = normalizarItems(items);
    if (itemsNormalizados.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    const totalCalculado = itemsNormalizados.reduce(
      (acc, it) => acc + it.precio * it.cantidad,
      0
    );
    const totalFinal = totalCalculado > 0 ? totalCalculado : Number(total ?? 0);
    const estadoFinal = normalizarEstado(estado);

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('crear_pedido', {
      payload: {
        cliente_nombre,
        cliente_email: cliente_email || null, // LO ENVIAMOS A LA BASE DE DATOS
        cliente_telefono,
        direccion,
        total: totalFinal,
        items: itemsNormalizados,
        estado: estadoFinal,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const pedido = Array.isArray(data) ? data[0] : data;

    return NextResponse.json(
      {
        ok: true,
        pedido,
        id: pedido.id,
        codigo: pedido.codigo,
        total: pedido.total,
        estado: pedido.estado,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error al procesar el pedido' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, estado } = body ?? {};

    if (!id || !estado) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (id, estado)' },
        { status: 400 }
      );
    }

    const estadoFinal = normalizarEstado(estado);
    const admin = createAdminClient();

    const { data, error } = await admin.rpc('cambiar_estado_pedido', {
      p_pedido_id: id,
      p_estado: estadoFinal,
      p_nota: null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const pedido = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({ ok: true, pedido });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error al actualizar el pedido' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID del pedido' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.rpc('cambiar_estado_pedido', {
      p_pedido_id: id,
      p_estado: 'cancelado',
      p_nota: 'Cancelado desde panel',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Pedido cancelado correctamente',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error al cancelar el pedido' },
      { status: 500 }
    );
  }
}