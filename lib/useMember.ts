"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  getTierProgress,
  nombreCorto,
  type TierProgress,
  type PedidoResumen,
} from "./club";
import { api } from "./client-api";
export interface FavItem {
  id: string;
  name: string;
  price: number;
  family?: string;
  image_url?: string | null;
}
export interface UltimoPedido extends PedidoResumen {
  codigo?: string;
  created_at?: string;
}
interface Account {
  user: Pick<User, "id" | "email" | "user_metadata">;
  isAdmin: boolean;
  points: number;
  pedidosCount: number;
  ultimoPedido: UltimoPedido | null;
  favs: FavItem[];
}
export interface Member {
  loading: boolean;
  user: Account["user"] | null;
  userId: string | null;
  firstName: string;
  isAdmin: boolean;
  points: number;
  progress: TierProgress;
  pedidosCount: number;
  ultimoPedido: UltimoPedido | null;
  favs: FavItem[];
  isFav: (id: string) => boolean;
  toggleFav: (i: FavItem) => Promise<boolean>;
  signOut: () => Promise<void>;
  error: string;
}
export function useMember(): Member {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const db = createClient();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) {
        setAccount(null);
        return;
      }
      // Importación no destructiva de favoritos del navegador anterior.
      try {
        const marker = `delta_favs_imported_v2_${user.id}`;
        if (!localStorage.getItem(marker)) {
          const old: unknown = JSON.parse(
            localStorage.getItem(`delta_favs_${user.id}`) ?? "[]",
          );
          if (Array.isArray(old)) {
            const ids = old
              .map((f: { id?: unknown }) => f?.id)
              .filter((id): id is string => typeof id === "string");
            for (let i = 0; i < ids.length; i += 100)
              await api("/api/cuenta/favoritos/importar", {
                method: "POST",
                body: JSON.stringify({ ids: ids.slice(i, i + 100) }),
              });
          }
          localStorage.setItem(marker, "1");
        }
      } catch {
        /* Los originales permanecen en el navegador si la importación falla. */
      }
      setAccount(await api<Account>("/api/cuenta"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const db = createClient();
    void db.auth.getUser().then(() => refresh());
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0);
    });
    const sync = () => void refresh();
    window.addEventListener("delta:favs-changed", sync);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("delta:favs-changed", sync);
    };
  }, [refresh]);
  const toggleFav = async (item: FavItem) => {
    if (!account) return false;
    try {
      const active = !account.favs.some((f) => f.id === item.id);
      await api("/api/cuenta/favoritos", {
        method: "POST",
        body: JSON.stringify({ id: item.id, active }),
      });
      await refresh();
      window.dispatchEvent(new Event("delta:favs-changed"));
      return true;
    } catch (e) {
      setError((e as Error).message);
      return true;
    }
  };
  const points = account?.points ?? 0;
  return {
    loading,
    user: account?.user ?? null,
    userId: account?.user.id ?? null,
    firstName: account ? nombreCorto(account.user) : "",
    isAdmin: account?.isAdmin ?? false,
    points,
    progress: getTierProgress(points),
    pedidosCount: account?.pedidosCount ?? 0,
    ultimoPedido: account?.ultimoPedido ?? null,
    favs: account?.favs ?? [],
    isFav: (id) => account?.favs.some((f) => f.id === id) ?? false,
    toggleFav,
    signOut: async () => {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setError("No se pudo cerrar sesión. Intenta de nuevo.");
        return;
      }
      router.replace("/");
      router.refresh();
    },
    error,
  };
}
