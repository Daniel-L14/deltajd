'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  calcularPuntos,
  getTierProgress,
  nombreCorto,
  type PedidoResumen,
  type TierProgress,
} from '@/lib/club';

export interface FavItem {
  id: string;
  name: string;
  price: number;
  family?: string;
}

export interface UltimoPedido extends PedidoResumen {
  codigo?: string;
  created_at?: string;
}

const FAVS_EVENT = 'delta:favs-changed';
const favKey = (userId: string) => `delta_favs_${userId}`;

function readFavs(userId: string): FavItem[] {
  try {
    const raw = localStorage.getItem(favKey(userId));
    return raw ? (JSON.parse(raw) as FavItem[]) : [];
  } catch {
    return [];
  }
}

export interface Member {
  loading: boolean;
  user: any | null;
  userId: string | null;
  firstName: string;
  isAdmin: boolean;
  points: number;
  progress: TierProgress;
  pedidosCount: number;
  ultimoPedido: UltimoPedido | null;
  favs: FavItem[];
  isFav: (id: string) => boolean;
  toggleFav: (item: FavItem) => boolean;
  signOut: () => Promise<void>;
}

export function useMember(options: { withOrders?: boolean } = {}): Member {
  const { withOrders = true } = options;
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pedidos, setPedidos] = useState<UltimoPedido[]>([]);
  const [favs, setFavs] = useState<FavItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;

      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }

      const role = user.user_metadata?.role || user.app_metadata?.role;
      setIsAdmin(role === 'admin');
      setFavs(readFavs(user.id));

      if (withOrders && user.email) {
        const { data } = await supabase
          .from('pedidos')
          .select('codigo,total,estado,created_at')
          .eq('cliente_email', user.email)
          .order('created_at', { ascending: false });
        if (mounted) setPedidos((data as UltimoPedido[]) ?? []);
      }
      if (mounted) setLoading(false);
    };

    load().catch(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [supabase, withOrders]);

  useEffect(() => {
    if (!user) return;
    const sync = () => setFavs(readFavs(user.id));
    window.addEventListener(FAVS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(FAVS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [user]);

  const toggleFav = useCallback(
    (item: FavItem) => {
      if (!user) return false;
      const current = readFavs(user.id);
      const next = current.some((f) => f.id === item.id)
        ? current.filter((f) => f.id !== item.id)
        : [...current, item];
      try {
        localStorage.setItem(favKey(user.id), JSON.stringify(next));
      } catch {
        // almacenamiento lleno o bloqueado
      }
      setFavs(next);
      window.dispatchEvent(new Event(FAVS_EVENT));
      return true;
    },
    [user]
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignorar fallos de red
    }
    window.location.href = '/';
  }, [supabase]);

  const points = useMemo(() => calcularPuntos(pedidos), [pedidos]);
  const progress = useMemo(() => getTierProgress(points), [points]);

  return {
    loading,
    user,
    userId: user?.id ?? null,
    firstName: user ? nombreCorto(user) : '',
    isAdmin,
    points,
    progress,
    pedidosCount: pedidos.length,
    ultimoPedido: pedidos[0] ?? null,
    favs,
    isFav: (id: string) => favs.some((f) => f.id === id),
    toggleFav,
    signOut,
  };
}