"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { type Product, FAMILIES } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import Link from "next/link";
import ProductPhotoPicker from "@/app/components/admin/ProductPhotoPicker";
import ProductPhoto from "@/app/components/productos/ProductPhoto";
const empty = {
  name: "",
  brand: "",
  family: "Amaderada",
  price: 0,
  stock: 0,
  description: "",
  presentation_ml: null as number | null,
  concentration: "",
  notes: "",
  budget_category: "ECONOMICO",
  occasion: "Diario",
  climate_preference: "TODOS",
};
export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [count, setCount] = useState(0),
    [form, setForm] = useState(empty),
    [editing, setEditing] = useState<Product | null>(null),
    [photo, setPhoto] = useState<File | null>(null),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const query = new URLSearchParams({
    admin: "1",
    page: String(page),
    q: search,
  }).toString();
  const load = useCallback(async () => {
    try {
      const d = await api<{ products: Product[]; count: number }>(
        `/api/productos?${query}`,
      );
      setProducts(d.products);
      setCount(d.count);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query]);
  useEffect(() => {
    let live = true;
    api<{ products: Product[]; count: number }>(`/api/productos?${query}`)
      .then((d) => {
        if (live) {
          setProducts(d.products);
          setCount(d.count);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [query]);
  function edit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, brand: p.brand, family: p.family, price: p.price, stock: p.stock,
      description: p.description ?? "", presentation_ml: p.presentation_ml,
      concentration: p.concentration, notes: p.notes, budget_category: p.budget_category,
      occasion: p.occasion, climate_preference: p.climate_preference,
    });
    setPhoto(null);
    setReason("");
    setMessage("");
    document
      .getElementById("product-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      // Editar metadatos conserva la foto actual si no se seleccionó un archivo.
      const values = { ...form, id: editing?.id, expected_stock: editing?.stock, reason };
      const payload = new FormData();
      if (photo) {
        payload.set("product", JSON.stringify(values));
        payload.set("photo", photo);
      }
      await api("/api/productos", {
        method: "POST",
        body: photo ? payload : JSON.stringify(values),
      });
      setPhoto(null);
      setForm(empty);
      setEditing(null);
      setReason("");
      setMessage("Producto guardado.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publishPhoto() {
    if (!editing || !photo || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    const body = new FormData();
    body.set("photo", photo);
    body.set("previous_url", editing.image_url ?? "");
    try {
      const result = await api<{ image_url: string }>(
        `/api/productos/${editing.id}/foto`, { method: "POST", body },
      );
      setEditing({ ...editing, image_url: result.image_url });
      setPhoto(null);
      setMessage("Foto guardada. Ya está disponible en la tienda.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function archive(p: Product) {
    if (
      !confirm(
        `${p.is_active ? "Archivar" : "Reactivar"} ${p.name}? El historial se conserva.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api("/api/productos", {
        method: "PATCH",
        body: JSON.stringify({ id: p.id, is_active: !p.is_active }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gold-400/20 pb-5">
        <h1 className="delta-title">Productos e <em>inventario</em></h1>
        <Link href="/admin/movimientos" className="delta-secondary">
          Historial de movimientos
        </Link>
      </div>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-300">
          {message}
        </p>
      )}
      <form
        id="product-form"
        onSubmit={save}
        className="delta-card grid items-start gap-6 xl:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)]"
      >
        <h2 className="border-b border-gold-400/15 pb-4 text-3xl xl:col-span-2">
          {editing ? "Editar producto" : "Crear producto"}
        </h2>
        <ProductPhotoPicker
          key={editing?.id ?? "new"}
          name={form.name}
          current={editing?.image_url}
          file={photo}
          disabled={busy}
          onChange={setPhoto}
          onPublish={editing ? () => void publishPhoto() : undefined}
        />
        <fieldset disabled={busy} className="grid min-w-0 content-start gap-4 sm:grid-cols-2">
          {(
            [
              "name",
              "brand",
              "description",
              "notes",
              "concentration",
            ] as const
          ).map((key, i) => (
            <label key={key} className="min-w-0">
              {
                [
                  "Nombre",
                  "Marca",
                  "Descripción",
                  "Notas olfativas",
                  "Concentración",
                ][i]
              }
              <input
                className="delta-input"
                value={form[key]}
                required={key === "name" || key === "brand"}
                maxLength={
                  key === "description" ? 2000 : 500
                }
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          {(["price", "stock"] as const).map((key) => (
            <label key={key} className="min-w-0">
              {key === "price" ? "Precio (COP)" : "Stock disponible"}
              <input
                className="delta-input"
                type="number"
                min={key === "price" ? 1 : 0}
                max={key === "price" ? 100000000 : 100000}
                step="1"
                required
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <label>
            Presentación (ml)
            <input
              className="delta-input"
              type="number"
              min="1"
              max="5000"
              value={form.presentation_ml ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  presentation_ml: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </label>
          {(
            [
              { key: "family", label: "Familia", options: FAMILIES },
              {
                key: "budget_category",
                label: "Categoría de presupuesto",
                options: ["ECONOMICO", "MEDIO", "PREMIUM"],
              },
              {
                key: "occasion",
                label: "Ocasión",
                options: ["Diario", "Trabajo", "Noche / Evento", "Todas"],
              },
              {
                key: "climate_preference",
                label: "Clima",
                options: ["CALIDO", "FRIO", "TODOS"],
              },
            ] as const
          ).map((f) => (
            <label key={f.key}>
              {f.label}
              <select
                className="delta-input"
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              >
                {!(f.options as readonly string[]).includes(form[f.key]) && (
                  <option value={form[f.key]}>Reclasificar: {form[f.key]}</option>
                )}
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
          <label className="sm:col-span-2">
            Motivo del registro o ajuste
            <input
              className="delta-input"
              required
              minLength={3}
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Compra a proveedor, conteo físico, corrección…"
            />
          </label>
          <button className="delta-button" disabled={busy}>
            {busy ? "Guardando…" : "Guardar producto"}
          </button>
          {editing && (
            <button
              type="button"
              className="delta-secondary"
              onClick={() => {
                setEditing(null);
                setForm(empty);
                setPhoto(null);
              }}
            >
              Cancelar edición
            </button>
          )}
        </fieldset>
      </form>
      <label className="block">
        Buscar en inventario
        <input
          className="delta-input"
          maxLength={100}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </label>
      {loading ? (
        <p>Cargando inventario…</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="delta-card flex flex-wrap justify-between gap-3"
            >
              <div className="flex items-center gap-4">
                <ProductPhoto src={p.image_url} name={p.name} compact className="size-16 shrink-0" />
                <div>
                  <h3 className="font-bold">
                    {p.name} {!p.is_active && "(Archivado)"}
                  </h3>
                  <p>
                    {formatCOP(p.price)} · Stock disponible: {p.stock}
                  </p>
                  <p className="text-sm text-slate-400">
                    {p.family} · {p.budget_category}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  className="delta-secondary"
                  onClick={() => edit(p)}
                >
                  Editar
                </button>
                <button
                  disabled={busy}
                  className="delta-secondary"
                  onClick={() => void archive(p)}
                >
                  {p.is_active ? "Archivar" : "Reactivar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between">
        <button
          disabled={page === 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <span>Página {page}</span>
        <button
          disabled={page * 24 >= count || loading}
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
