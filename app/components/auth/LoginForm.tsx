'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from '@/app/components/auth/AuthShell';

const INPUT =
  'w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/40 transition-colors';

/** Solo permite rutas internas (evita redirecciones abiertas) */
function rutaSegura(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignorar si no había sesión activa
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const role = data.user.user_metadata?.role || data.user.app_metadata?.role;
        const next = rutaSegura(new URLSearchParams(window.location.search).get('next'));
        const bienvenida = '/?bienvenida=1';
        const targetUrl = role === 'admin' ? '/admin' : !next || next === '/' ? bienvenida : next;

        window.location.href = targetUrl;
      } else {
        setLoading(false);
      }
    } catch {
      setError('Error al procesar la conexión con la base de datos.');
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      subtitle="Inicia sesión para ver tus puntos, favoritos y pedidos."
    >
      {error && (
        <div role="alert" className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${INPUT} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-gold-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-shine w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-gold-500/10"
        >
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400">
        ¿Aún no tienes cuenta?{' '}
        <Link href="/registro" className="text-gold-300 hover:underline font-semibold">
          Créala gratis y empieza a acumular puntos
        </Link>
      </p>
    </AuthShell>
  );
}