'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Compass, Sparkles, CheckCircle } from 'lucide-react';

export default function RecommendationTest() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    climate: '',
    budget: '',
    family: '',
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSelect = (key: string, value: string) => {
    setAnswers({ ...answers, [key]: value });
  };

  const calculateRecommendations = async () => {
    setLoading(true);
    let query = supabase.from('perfumes').select('*');

    if (answers.climate) {
      query = query.in('climate_preference', [answers.climate, 'TODOS']);
    }
    if (answers.budget) {
      query = query.eq('budget_category', answers.budget);
    }
    if (answers.family) {
      query = query.eq('family', answers.family);
    }

    const { data } = await query;
    setResults(data || []);
    setLoading(false);
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        
        {step < 4 && (
          <div className="mb-6">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Paso {step} de 3</span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-300" 
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Paso 1: Entorno / Clima */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Compass className="text-amber-500" /> ¿En qué tipo de clima usas principalmente la fragancia?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'CALIDO', label: 'Cálido (Climas calurosos, costa, zonas húmedas)' },
                { id: 'FRIO', label: 'Frío (Ciudades frías, clima de montaña, noche)' },
                { id: 'TEMPLADO', label: 'Templado / Versátil (Uso diario variado)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { handleSelect('climate', opt.id); setStep(2); }}
                  className="p-4 text-left border border-slate-800 bg-slate-800/40 rounded-xl hover:border-amber-500/50 hover:bg-slate-800 transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 2: Presupuesto */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">¿Cuál es tu rango de presupuesto preferido?</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'ECONOMICO', label: 'Económico (Perfumes Tipo 1.1 de alta similitud)' },
                { id: 'MEDIO', label: 'Gama Media (Excelente balance calidad/precio)' },
                { id: 'PREMIUM', label: 'Premium (Fragancias Diseñador / Originales)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { handleSelect('budget', opt.id); setStep(3); }}
                  className="p-4 text-left border border-slate-800 bg-slate-800/40 rounded-xl hover:border-amber-500/50 hover:bg-slate-800 transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 3: Familia Olfativa */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">¿Qué familia olfativa prefieres?</h2>
            <div className="grid grid-cols-2 gap-3">
              {['Cítrica', 'Amaderada', 'Oriental', 'Floral'].map((fam) => (
                <button
                  key={fam}
                  onClick={() => handleSelect('family', fam)}
                  className={`p-4 text-center border rounded-xl transition-all ${
                    answers.family === fam 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  {fam}
                </button>
              ))}
            </div>
            <button
              onClick={calculateRecommendations}
              disabled={loading || !answers.family}
              className="w-full mt-4 bg-amber-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {loading ? 'Analizando Catálogo...' : 'Ver Fragancias Recomendadas'}
            </button>
          </div>
        )}

        {/* Paso 4: Resultados */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-amber-400">
              <Sparkles /> Recomendaciones Personalizadas
            </h2>
            {results.length === 0 ? (
              <p className="text-slate-400">No se encontraron fragancias que coincidan exactamente con el criterio seleccionado.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {results.map((perfume) => (
                  <div key={perfume.id} className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white">{perfume.name}</h3>
                      <p className="text-xs text-slate-400">{perfume.brand} • {perfume.family}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
                      {perfume.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => { setStep(1); setResults([]); }}
              className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl transition-colors text-sm"
            >
              Reiniciar Test
            </button>
          </div>
        )}

      </div>
    </div>
  );
}