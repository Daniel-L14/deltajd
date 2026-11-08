'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import AuthShell from '@/app/components/auth/AuthShell';

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    if (!data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    // Sesión creada: bienvenida al Club en la portada
    window.location.href = '/?bienvenida=1';
  };

  const field =
    'w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/40 transition-colors';

  return (
    <AuthShell
      title="Únete al Club DELTA"
      subtitle="Crea tu cuenta gratis y acumula puntos en cada pedido."
    >
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
            Ir a iniciar sesión
          </Link>
        </div>
      )}

      {!success && (
        <form onSubmit={handleRegister} className="space-y-5" noValidate>
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              required
              autoFocus
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre y apellidos"
              className={field}
            />
          </div>

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
              className={field}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
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
              className={field}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="btn-shine w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-gold-500/10"
          >
            {loading ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-slate-400">
        ¿Ya eres miembro de DELTA?{' '}
        <Link href="/login" className="text-gold-300 hover:underline font-semibold">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}