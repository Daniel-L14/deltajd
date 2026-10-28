import { createClient } from '@/lib/supabase/server';
import { Package, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import StockUpdater from './StockUpdater';

export default async function InventoryPage() {
  const supabase = await createClient();

  // Consulta relacional entre Inventario y Perfumes
  const { data: inventory, error } = await supabase
    .from('inventory')
    .select(`
      id,
      stock_quantity,
      cost_price,
      selling_price,
      last_updated,
      perfumes (
        name,
        brand,
        type
      )
    `);

  if (error) {
    return <div className="p-8 text-red-500">Error al cargar inventario.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <Link href="/" className="inline-flex items-center text-sm text-amber-500 hover:underline mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="w-8 h-8 text-amber-500" /> Panel de Control de Inventario
            </h1>
            <p className="text-slate-400 text-sm">Frascos y Esencias - Gestión centralizada de stock</p>
          </div>
        </div>

        {/* Tabla de Inventario */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-4 px-6">Producto</th>
                <th className="py-4 px-6">Tipo</th>
                <th className="py-4 px-6">Costo (COP)</th>
                <th className="py-4 px-6">Precio Venta (COP)</th>
                <th className="py-4 px-6">Stock Actual</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {inventory?.map((item: any) => {
                const isLowStock = item.stock_quantity < 5;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-white">
                      {item.perfumes?.name}
                      <span className="block text-xs text-slate-400">{item.perfumes?.brand}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded border ${
                        item.perfumes?.type === 'ORIGINAL' 
                          ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' 
                          : 'bg-purple-950/50 text-purple-400 border-purple-800'
                      }`}>
                        {item.perfumes?.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">${item.cost_price.toLocaleString()}</td>
                    <td className="py-4 px-6">${item.selling_price.toLocaleString()}</td>
                    <td className="py-4 px-6 font-semibold text-white">{item.stock_quantity} unidades</td>
                    <td className="py-4 px-6">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/50">
                          <AlertTriangle className="w-3.5 h-3.5" /> Bajo Stock
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/50">
                          Optimo
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <StockUpdater id={item.id} initialStock={item.stock_quantity} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}