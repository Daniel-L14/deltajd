import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ApiError } from "./validation";
export async function requireUser() {
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new ApiError(401, "Inicia sesión para continuar.");
  return { db, user };
}
export async function requireAdmin() {
  const { db, user } = await requireUser();
  const { data, error } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error || data?.role !== "ADMIN")
    throw new ApiError(403, "No tienes permisos de administración.");
  return { db, user };
}
