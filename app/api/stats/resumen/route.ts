import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Verificar admin
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

  // Rango de fechas
  const ahora = new Date();
  const inicioHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  ).toISOString();
  const inicioMes = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    1
  ).toISOString();

  // Pedidos del mes (añadimos whatsapp_confirmado)
  const { data: pedidosMes } = await supabase
    .from('pedidos')
    .select('id, total, estado, created_at, whatsapp_confirmado')
    .gte('created_at', inicioMes);

  const pedidos = pedidosMes ?? [];

  const ventasHoy = pedidos
    .filter((p) => p.created_at >= inicioHoy && p.estado !== 'cancelado')
    .reduce((acc, p) => acc + Number(p.total ?? 0), 0);

  const ventasMes = pedidos
    .filter((p) => p.estado !== 'cancelado')
    .reduce((acc, p) => acc + Number(p.total ?? 0), 0);

  const pedidosNuevos = pedidos.filter((p) => p.estado === 'nuevo').length;
  
  // NUEVO: Pedidos sin confirmar WhatsApp
  const pedidosSinConfirmar = pedidos.filter(
    (p) => p.estado === 'nuevo' && p.whatsapp_confirmado === false
  ).length;

  const pedidosPagados = pedidos.filter((p) => p.estado === 'pagado');
  const ticketPromedio =
    pedidosPagados.length > 0
      ? pedidosPagados.reduce((acc, p) => acc + Number(p.total ?? 0), 0) /
        pedidosPagados.length
      : 0;

  // Top 5 productos del mes
  const { data: itemsMes } = await supabase
    .from('pedido_items')
    .select('nombre, cantidad, pedido_id, pedidos!inner(created_at, estado)')
    .gte('pedidos.created_at', inicioMes)
    .neq('pedidos.estado', 'cancelado');

  const conteo = new Map<string, number>();
  (itemsMes ?? []).forEach((it: any) => {
    conteo.set(it.nombre, (conteo.get(it.nombre) ?? 0) + it.cantidad);
  });
  const topProductos = [...conteo.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  // Stock bajo
  const { data: stockBajo } = await supabase
    .from('productos')
    .select('id, name, stock')
    .lt('stock', 5)
    .order('stock', { ascending: true })
    .limit(10);

  return NextResponse.json({
    ventasHoy,
    ventasMes,
    pedidosNuevos,
    pedidosSinConfirmar, // <-- AÑADIDO
    ticketPromedio,
    topProductos,
    stockBajo: stockBajo ?? [],
  });
}