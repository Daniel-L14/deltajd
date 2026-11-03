'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Plus, Trash2, Edit, Save, X, Search, RefreshCw } from 'lucide-react';

interface Producto {
  id: string;
  name: string;
  brand: string;
  family: string;
  price: number;
  stock: number;
  description: string;
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulario de creación
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [family, setFamily] = useState('Orientales & Madera');
  const [description, setDescription] = useState('');

  // Formulario de edición rápida
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);

  const supabase = createClient();

  const fetchProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setProductos(data as Producto[]);
  };

  useEffect(() => {
    fetchProductos();

    // Sincronización en tiempo real
    const channel = supabase
      .channel('admin-inventario-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        fetchProductos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const newProd = {
      name,
      brand: 'DELTA Private Blend',
      family,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      description
    };

    const { error } = await supabase.from('productos').insert([newProd]);
    if (!error) {
      setName('');
      setPrice('');
      setDescription('');
    }
  };

  const handleUpdate = async (id: string) => {
    await supabase.from('productos').update({ price: editPrice, stock: editStock }).eq('id', id);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('productos').delete().eq('id', id);
  };

  const filtered = productos.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.family.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" /> Control de Inventario
          </h1>
          <p className="text-xs text-slate-400">Todo cambio realizado aquí impactará el catálogo en tiempo real.</p>
        </div>
        <button
          onClick={fetchProductos}
          className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulario Agregar */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" /> Nuevo Lanzamiento
          </h2>
          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Nombre</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Precio ($)</label>
                <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Stock</label>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Familia Olfativa</label>
              <select value={family} onChange={e => setFamily(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500">
                <option value="Orientales & Madera">Orientales & Madera</option>
                <option value="Extractos Concentrados">Extractos Concentrados</option>
                <option value="Cítricos & Florales">Cítricos & Florales</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Descripción</label>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white resize-none focus:outline-none focus:border-amber-500" />
            </div>
            <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors">
              Publicar en Catálogo
            </button>
          </form>
        </div>

        {/* Lista de productos */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Catálogo Activo ({filtered.length})</h2>
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((prod) => (
              <div key={prod.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="font-bold text-white text-sm">{prod.name}</h3>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">{prod.family}</span>
                </div>

                {editingId === prod.id ? (
                  <div className="flex items-center gap-2">
                    <input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="w-24 bg-slate-900 border border-amber-500 rounded p-1 text-xs text-amber-400 font-bold" />
                    <input type="number" value={editStock} onChange={e => setEditStock(Number(e.target.value))} className="w-16 bg-slate-900 border border-amber-500 rounded p-1 text-xs text-white" />
                    <button onClick={() => handleUpdate(prod.id)} className="p-1.5 bg-emerald-600 text-white rounded-lg"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-800 text-slate-400 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-amber-400 font-extrabold text-sm">${Number(prod.price).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Stock: {prod.stock} unids</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingId(prod.id); setEditPrice(prod.price); setEditStock(prod.stock); }} className="p-2 bg-slate-900 text-slate-300 hover:text-amber-400 rounded-xl transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(prod.id)} className="p-2 bg-slate-900 text-slate-300 hover:text-red-400 rounded-xl transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}