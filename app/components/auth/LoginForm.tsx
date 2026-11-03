'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Home } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Limpieza preventiva de sesión local
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignorar si no había sesión activa
      }

      // 2. Autenticar credenciales
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // 3. Forzar redirección limpia omitiendo la caché de Next.js
      if (data.user) {
        const role = data.user.user_metadata?.role || data.user.app_metadata?.role;
        const targetUrl = role === 'admin' ? '/admin' : '/tienda';
        
        // Recarga completa para aplicar la cookie fresca en el servidor
        window.location.href = targetUrl;
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError('Error al procesar la conexión con la base de datos.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" /> Volver
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <Home className="w-4 h-4 text-slate-400" /> Inicio
        </Link>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">DELTA</h1>
          <p className="text-xs text-slate-400">Perfumería de Alta Gama & Esencias Exclusivas</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="daniel.latorrec@uniagustiniana.edu.co"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition-colors"
          >
            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2">
          ¿No tienes una cuenta en DELTA?{' '}
          <Link href="/registro" className="text-amber-400 hover:underline font-semibold">
            Crea tu cuenta aquí
          </Link>
        </div>
      </div>
    </div>
  );
}