'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCOP, formatFecha } from '@/lib/format';
import { ESTADO_COLOR, ESTADO_LABEL, type EstadoPedido } from '@/lib/pedidos/types';
import { Package, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MisPedidosPage() {
    const supabase = createClient();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        const cargar = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) { setLoading(false); return; }
            setEmail(user.email);

            const { data } = await supabase
                .from('pedidos')
                .select('*')
                .eq('cliente_email', user.email)
                .order('created_at', { ascending: false });

            setPedidos(data ?? []);
            setLoading(false);
        };
        cargar();
    }, [supabase]);

    if (loading) return <div className="p-8 text-slate-400">Cargando tus pedidos...</div>;

    if (!email) {
        return (
            <div className="p-8 text-center mt-20 space-y-4">
                <p className="text-white">Debes iniciar sesión para ver tus pedidos.</p>
                <Link href="/login" className="inline-block px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg">Iniciar Sesión</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link href="/tienda" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-4">
                    <ArrowLeft className="w-4 h-4" /> Volver a la tienda
                </Link>

                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Package className="w-6 h-6 text-amber-400" /> Mis Pedidos
                </h1>

                {pedidos.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-slate-400">Aún no tienes pedidos registrados con este correo.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pedidos.map((p) => (
                            <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono text-amber-400 font-bold">{p.codigo}</span>
                                        <span className="text-xs text-slate-500">{formatFecha(p.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-slate-300">{p.cliente_nombre} - {p.direccion}</p>
                                </div>
                                <div className="flex sm:flex-col justify-between items-end">
                                    <span className="text-lg font-bold text-white">{formatCOP(p.total)}</span>
                                    {/* AQUÍ ESTÁ LA CORRECCIÓN: Añadimos "as EstadoPedido" */}
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded border ${ESTADO_COLOR[p.estado as EstadoPedido] ?? ''}`}>
                                        {ESTADO_LABEL[p.estado as EstadoPedido] ?? p.estado}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}