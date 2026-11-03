import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Obtener la lista de pedidos (para el panel de administración)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, pedidos });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Registrar un nuevo pedido
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cliente_nombre, cliente_telefono, direccion, items, total, estado } = body;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente_nombre,
          cliente_telefono,
          direccion,
          items,
          total,
          estado: estado || 'Pendiente',
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, pedido: data[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar el pedido' }, { status: 500 });
  }
}

// PUT: Actualizar el estado de un pedido existente
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return NextResponse.json({ error: 'Faltan campos requeridos (id, estado)' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, pedido: data[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 });
  }
}

// DELETE: Eliminar un pedido por ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Se requiere el ID del pedido' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('pedidos').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: 'Pedido eliminado correctamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar el pedido' }, { status: 500 });
  }
}