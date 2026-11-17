"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { formatCOP } from "@/lib/format";
import type { Product, Preferences } from "@/lib/products";
type Result = { product: Product; score: number; reasons: string[] };
export default function Wizard() {
  const [prefs, setPrefs] = useState<Preferences>({
      budget: "ECONOMICO",
      family: "Amaderada",
      occasion: "Diario",
      climate: "CALIDO",
    }),
    [results, setResults] = useState<Result[] | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResults(null);
    try {
      const d = await api<{ results: Result[] }>("/api/recomendaciones", {
        method: "POST",
        body: JSON.stringify(prefs),
      });
      setResults(d.results);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="delta-card w-full max-w-3xl space-y-6">
      <h1 className="text-3xl">Encuentra tu fragancia</h1>
      <p className="text-slate-400">
        Recomendaciones por preferencias y disponibilidad. La coincidencia
        representa reglas del catálogo, no una garantía de satisfacción.
      </p>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        {(
          [
            {
              key: "budget",
              label: "Presupuesto",
              options: ["ECONOMICO", "MEDIO", "PREMIUM"],
            },
            {
              key: "family",
              label: "Familia olfativa",
              options: [
                "Amaderada",
                "Cítrica",
                "Oriental",
                "Floral",
                "Dulce/Gourmand",
              ],
            },
            {
              key: "occasion",
              label: "Ocasión",
              options: ["Diario", "Trabajo", "Noche / Evento"],
            },
            {
              key: "climate",
              label: "Clima",
              options: ["CALIDO", "FRIO", "TODOS"],
            },
          ] as const
        ).map((f) => (
          <label key={f.key}>
            {f.label}
            <select
              className="delta-input"
              value={prefs[f.key]}
              onChange={(e) => setPrefs({ ...prefs, [f.key]: e.target.value })}
            >
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
        <button className="delta-button sm:col-span-2" disabled={busy}>
          {busy ? "Buscando coincidencias…" : "Ver recomendaciones"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {results?.length === 0 && (
        <p>
          No hay perfumes disponibles en esa categoría de presupuesto. Prueba
          otra categoría o consulta a la tienda.
        </p>
      )}
      {results && (
        <div className="grid sm:grid-cols-2 gap-4">
          {results.map(({ product, score, reasons }) => (
            <article
              key={product.id}
              className="border border-slate-700 rounded-xl p-4 space-y-3"
            >
              <h2 className="text-xl">{product.name}</h2>
              <p>{score}% de coincidencia con las reglas</p>
              <ul className="text-sm text-slate-300 list-disc pl-4">
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p>{formatCOP(product.price)}</p>
              <Link
                className="text-amber-300"
                href={`/tienda/producto/${product.id}`}
              >
                Ver este perfume →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
