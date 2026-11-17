"use client";
import ProductPhoto from "@/app/components/productos/ProductPhoto";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
import { api } from "@/lib/client-api";
import { formatCOP } from "@/lib/format";
import { BUDGET_LABELS, type Product, type Preferences } from "@/lib/products";
type Result = { product: Product; score: number; reasons: string[] };

const optionsLabels: Record<string, string> = {
  ...BUDGET_LABELS,
  CALIDO: "Cálido",
  FRIO: "Frío",
  TODOS: "Cualquier clima",
};
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
    <section className="space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[.9fr_1.1fr] lg:gap-10">
        <header className="space-y-4 pt-2 lg:pt-7">
          <Compass aria-hidden className="size-8 stroke-[1.4] text-gold-300" />
          <h1 className="delta-title max-w-md">Encuentra tu <em>fragancia</em></h1>
          <p className="max-w-md text-slate-300">
            Elige tu presupuesto, tu familia olfativa y el momento en que usarás
            la fragancia. Te mostraremos opciones disponibles del catálogo.
          </p>
        </header>
        <form onSubmit={submit} className="delta-card grid gap-4 sm:grid-cols-2">
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
          <label key={f.key} className="min-w-0">
            {f.label}
            <select
              className="delta-input"
              value={prefs[f.key]}
              onChange={(e) => setPrefs({ ...prefs, [f.key]: e.target.value })}
            >
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {optionsLabels[o] ?? o}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button className="delta-button sm:col-span-2" disabled={busy}>
          {busy ? "Buscando coincidencias…" : "Ver recomendaciones"}
          {!busy && <ArrowUpRight aria-hidden className="size-4" />}
        </button>
        </form>
      </div>
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
      {!!results?.length && (
        <section className="space-y-4 border-t border-gold-400/20 pt-6" aria-labelledby="recomendaciones">
          <h2 id="recomendaciones" className="delta-section-title">Tu <em>selección</em></h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(({ product, score, reasons }) => (
            <article
              key={product.id}
              className="delta-product-card flex flex-col"
            >
              <ProductPhoto src={product.image_url} name={product.name} className="aspect-[4/3] w-full rounded-none border-0" />
              <div className="flex flex-1 flex-col gap-3 p-5">
              <span className="delta-eyebrow">{score}% de coincidencia</span>
              <h3 className="text-2xl">{product.name}</h3>
              <ul className="text-sm text-slate-300 list-disc pl-4">
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-auto text-lg font-semibold text-gold-300">{formatCOP(product.price)}</p>
              <Link
                className="delta-secondary w-fit"
                href={`/tienda/producto/${product.id}`}
              >
                Ver este perfume <ArrowUpRight aria-hidden className="size-4" />
              </Link>
              </div>
            </article>
          ))}
          </div>
        </section>
      )}
    </section>
  );
}
