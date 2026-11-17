"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
export default function Recover() {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="delta-container max-w-lg">
      <h1 className="text-2xl mb-5">Recuperar contraseña</h1>
      <form
        className="delta-card space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const { error } = await createClient().auth.resetPasswordForEmail(
              email.trim(),
              {
                redirectTo:
                  location.origin + "/api/auth/confirm?next=/restablecer",
              },
            );
            if (error) throw error;
            setMessage(
              "Si el correo está registrado, recibirás un enlace para continuar.",
            );
          } catch {
            setMessage(
              "No se pudo enviar el enlace. Intenta de nuevo más tarde.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Correo
          <input
            className="delta-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button disabled={busy} className="delta-button">
          Enviar enlace
        </button>
        <p role="status">{message}</p>
        <Link href="/login">Volver</Link>
      </form>
    </main>
  );
}
