'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Plus, Trash2, Edit, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

interface Perfume {
  id: string;
  name: string;
  brand: string;
  type: 'ORIGINAL' | '1.1';
  family: string;
  intensity: number;
  duration_hours: number;
  price: number;
  budget_category: 'ECONOMICO' | 'MEDIO' | 'PREMIUM';
  occasion: string;
  climate_preference: string;
  description: string;
  is_active: boolean;
}

export default function ProductosView() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Campos del Formulario
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<'ORIGINAL' | '1.1'>('1.1');
  const [family, setFamily] = useState('Amaderada');
  const [intensity, setIntensity] = useState(3);
  const [durationHours, setDurationHours] = useState(8);
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [budgetCategory, setBudgetCategory] = useState<'ECONOMICO' | 'MEDIO' | 'PREMIUM'>('ECONOMICO');
  const [occasion, setOccasion] = useState('Diario');
  const [climatePreference, setClimatePreference] = useState('TODOS');
  const [description, setDescription] = useState('');

  const supabase = createClient();

  const fetchPerfumes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfumes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPerfumes(data as Perfume[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPerfumes();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // 1. Insertar Perfume
    const { data: newPerfume, error: perfumeError } = await supabase
      .from('perfumes')
      .insert([
        {
          name,
          brand,
          type,
          family,
          intensity: Number(intensity),
          duration_hours: Number(durationHours),
          price: Number(price),
          budget_category: budgetCategory,
          occasion,
          climate_preference: climatePreference,
          description,
          is_active: Number(stockQuantity) > 0,
        },
      ])
      .select()
      .single();

    if (perfumeError || !newPerfume) {
      setMessage({ type: 'error', text: `Error al crear perfume: ${perfumeError?.message}` });
      return;
    }

    // 2. Insertar Registro Inicial de Inventario
    const { error: inventoryError } = await supabase
      .from('inventory')
      .insert([
        {
          perfume_id: newPerfume.id,
          stock_quantity: Number(stockQuantity),
          cost_price: Number(costPrice || Number(price) * 0.6),
          selling_price: Number(price),
        },
      ]);

    if (inventoryError) {
      setMessage({ type: 'error', text: `Perfume creado, pero falló inventario: ${inventoryError.message}` });
    } else {
      setMessage({ type: 'success', text: '¡Producto e inventario creados con éxito!' });
      setShowModal(false);
      resetForm();
      fetchPerfumes();
    }
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setPrice('');
    setCostPrice('');
    setDescription('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este perfume?')) return;
    const { error } = await supabase.from('perfumes').delete().eq('id', id);
    if (!error) fetchPerfumes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" /> Catálogo de Productos
          </h1>
          <p className="text-xs text-slate-400">
            Administra los perfumes originales y versiones 1.1 disponibles en la tienda.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" /> Nuevo Perfume
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
          message.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
            : 'bg-red-950/60 border-red-800 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabla de Productos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Nombre / Marca</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Familia</th>
              <th className="p-4">Precio</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {perfumes.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.brand}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.type === 'ORIGINAL' 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {p.type}
                  </span>
                </td>
                <td className="p-4">{p.family}</td>
                <td className="p-4 font-bold text-amber-400">${Number(p.price).toLocaleString()}</td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 bg-red-950/40 border border-red-800/50 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Agregar Producto */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Crear Nuevo Perfume
            </h2>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Savage Ultra"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej: Dior / Frascos & Esencias"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'ORIGINAL' | '1.1')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="1.1">1.1 (Inspiración)</option>
                    <option value="ORIGINAL">ORIGINAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Familia Olfativa</label>
                  <select
                    value={family}
                    onChange={(e) => setFamily(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Amaderada">Amaderada</option>
                    <option value="Cítrica">Cítrica</option>
                    <option value="Oriental">Oriental</option>
                    <option value="Floral">Floral</option>
                    <option value="Dulce/Gourmand">Dulce/Gourmand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Gama Presupuesto</label>
                  <select
                    value={budgetCategory}
                    onChange={(e) => setBudgetCategory(e.target.value as 'ECONOMICO' | 'MEDIO' | 'PREMIUM')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="ECONOMICO">Económico</option>
                    <option value="MEDIO">Medio</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="120000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Costo ($)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="60000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notas principales y descripción del aroma..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-xl text-xs font-bold text-slate-950"
                >
                  Guardar Perfume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}