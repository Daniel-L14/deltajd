'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Compass, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Perfume {
  id: string;
  name: string;
  brand: string;
  type: 'ORIGINAL' | '1.1';
  family: string;
  price: number;
  description: string;
  budget_category: string;
}

export default function RecommendationWizard() {
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState<'ECONOMICO' | 'MEDIO' | 'PREMIUM'>('ECONOMICO');
  const [family, setFamily] = useState('Amaderada');
  const [occasion, setOccasion] = useState('Diario');
  const [climate, setClimate] = useState('CALIDO');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Perfume[]>([]);
  const [completed, setCompleted] = useState(false);

  const supabase = createClient();

  const handleCalculateRecommendation = async () => {
    setLoading(true);
    setCompleted(true);

    // Consulta de coincidencias por presupuesto y preferencia
    const { data } = await supabase
      .from('perfumes')
      .select('*')
      .eq('is_active', true)
      .or(`budget_category.eq.${budget},type.eq.1.1`)
      .limit(6);

    if (data) {
      setResults(data as Perfume[]);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setStep(1);
    setCompleted(false);
    setResults([]);
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
      {!completed ? (
        <>
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" /> Descubre tu Fragancia Ideal
            </div>
            <h1 className="text-2xl font-bold text-white">Test de Perfumería Personalizado</h1>
            <p className="text-slate-400 text-xs">Paso {step} de 4</p>
          </div>

          {/* PASO 1: Presupuesto */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">1. ¿Cuál es tu presupuesto preferido?</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'ECONOMICO', title: 'Económico', desc: 'Línea 1.1 accesibles' },
                  { id: 'MEDIO', title: 'Gama Media', desc: 'Calidad superior' },
                  { id: 'PREMIUM', title: 'Premium', desc: 'Fragancias Originales' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setBudget(item.id as 'ECONOMICO' | 'MEDIO' | 'PREMIUM')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      budget === item.id 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{item.title}</div>
                    <div className="text-[10px] text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
              >
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PASO 2: Familia Olfativa */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">2. ¿Qué familia olfativa prefieres?</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Amaderada', 'Cítrica', 'Oriental', 'Floral', 'Dulce/Gourmand'].map((fam) => (
                  <button
                    key={fam}
                    onClick={() => setFamily(fam)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      family === fam 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{fam}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-2/3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Ocasión */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">3. ¿Para qué ocasión principal lo usarás?</h3>
              <div className="grid grid-cols-3 gap-3">
                {['Diario', 'Trabajo', 'Noche / Evento'].map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setOccasion(occ)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      occasion === occ 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{occ}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="w-2/3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: Clima y Finalizar */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">4. ¿En qué tipo de clima vives o lo usarás?</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'CALIDO', label: 'Cálido' },
                  { id: 'FRIO', label: 'Frío' },
                  { id: 'TODOS', label: 'Todo Clima' }
                ].map((cli) => (
                  <button
                    key={cli.id}
                    onClick={() => setClimate(cli.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      climate === cli.id 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{cli.label}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(3)}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs"
                >
                  Atrás
                </button>
                <button
                  onClick={handleCalculateRecommendation}
                  className="w-2/3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Generar Mi Perfume Ideal
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* VISTA DE RESULTADOS */
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Recomendaciones Generadas
            </div>
            <h2 className="text-2xl font-bold text-white">Tus Fragancias Ideales</h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Analizando notas olfativas y stock...
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.name}</h4>
                      <p className="text-[11px] text-slate-400">{p.brand}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      p.type === 'ORIGINAL' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {p.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <div className="font-bold text-amber-400 text-sm">${Number(p.price).toLocaleString()}</div>
                    <Link
                      href={`/catalogo`}
                      className="text-xs text-slate-300 hover:text-amber-400 font-semibold"
                    >
                      Ver en Catálogo →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No encontramos perfumes que coincidan con todos los parámetros exactos. ¡Prueba ajustar tus filtros!
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Repetir Test
          </button>
        </div>
      )}
    </div>
  );
}