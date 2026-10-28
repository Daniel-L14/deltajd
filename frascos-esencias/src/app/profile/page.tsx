'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Trash2, LogOut, ShieldCheck, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (!error) {
      setMessage('Perfil actualizado correctamente.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción borrará permanentemente todos tus datos conforme al tratamiento de información.')) {
      // Borrar perfil (trigger de BD cascada)
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Cargando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            Guardar Cambios
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Eliminar mi cuenta (RF-04)
          </button>
        </div>

      </div>
    </div>
  );
}