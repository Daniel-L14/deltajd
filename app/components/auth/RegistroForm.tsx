'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Home, CheckCircle2 } from 'lucide-react';

// Traduce los errores más comunes de Supabase Auth al español
function traducirError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('user already registered')) return 'Este correo ya está registrado. Intenta iniciar sesión.';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 8 caracteres.';
  if (m.includes('invalid email')) return 'El correo electrónico no es válido.';
  if (m.includes('email not confirmed')) return 'Debes confirmar tu correo antes de continuar.';
  if (m.includes('signups not allowed')) return 'El registro está deshabilitado temporalmente.';
  return message;
}

export default function RegistroForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación mínima antes de llamar a Supabase
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setError(traducirError(error.message));
      setLoading(false);
      return;
    }

    // Si Supabase exige confirmación de email, no hay sesión aún
    if (!data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    // Sesión creada: a la tienda
    router.push('/tienda');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative">
      {/* Botones de Navegación */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <button
          type="button"
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
          <p className="text-xs text-slate-400">Únete a la experiencia exclusiva de perfumería DELTA</p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl space-y-2"
          >
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Cuenta creada
            </div>
            <p>
              Revisa tu correo <span className="font-semibold">{email}</span> para confirmar tu
              cuenta y luego inicia sesión.
            </p>
            <Link
              href="/login"
              className="inline-block mt-1 text-emerald-300 hover:underline font-semibold"
            >
              Ir a iniciar sesión →
            </Link>
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre Completo
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoFocus
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre y Apellidos"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@delta.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Usa al menos 8 caracteres.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl text-xs transition-colors"
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 pt-2">
          ¿Ya eres miembro de DELTA?{' '}
          <Link href="/login" className="text-amber-400 hover:underline font-semibold">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}