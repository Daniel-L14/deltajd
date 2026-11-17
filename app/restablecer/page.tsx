"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function Reset() {
  const [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    router = useRouter();
  return (
    <main className="delta-container max-w-lg">
      <h1 className="delta-title mb-5">Nueva <em>contraseña</em></h1>
      <form
        className="delta-card space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const db = createClient();
            const {
              data: { user },
            } = await db.auth.getUser();
            if (!user)
              throw new Error(
                "Abre primero el enlace de recuperación de tu correo.",
              );
            const { error } = await db.auth.updateUser({ password });
            if (error) throw error;
            await db.auth.signOut();
            router.replace("/login");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Contraseña
          <input
            className="delta-input"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button disabled={busy} className="delta-button">
          Guardar contraseña
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
