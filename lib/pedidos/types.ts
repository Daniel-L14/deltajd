export type EstadoPedido = 'nuevo' | 'pagado' | 'entregado' | 'cancelado';

export const ESTADOS: EstadoPedido[] = [
  'nuevo',
  'pagado',
  'entregado',
  'cancelado',
];

export const ESTADO_LABEL: Record<EstadoPedido, string> = {
  nuevo: 'Nuevo',
  pagado: 'Pagado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const ESTADO_COLOR: Record<EstadoPedido, string> = {
  nuevo: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  pagado: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  entregado: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  cancelado: 'bg-slate-600/20 text-slate-400 border-slate-600/40',
};

export type ItemPedido = {
  id?: string;
  pedido_id?: string;
  producto_id: string | null;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal?: number;
};

export type Pedido = {
  id: string;
  codigo: string;
  cliente_nombre: string;
  cliente_telefono: string;
  direccion: string;
  items: ItemPedido[] | any;
  total: number;
  estado: EstadoPedido;
  notas_admin?: string | null;
  whatsapp_confirmado?: boolean; // <-- AQUÍ ESTÁ LA SOLUCIÓN
  created_at: string;
  updated_at?: string;
};

export type ItemInput = {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

export type CrearPedidoInput = {
  cliente_nombre: string;
  cliente_telefono: string;
  direccion: string;
  items: ItemInput[];
  estado?: EstadoPedido;
};