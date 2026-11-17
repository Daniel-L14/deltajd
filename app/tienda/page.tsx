"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/client-api";
import { type Product, FAMILIES } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import { useCart } from "@/app/context/CartContext";
import { useMember } from "@/lib/useMember";
import Navbar from "@/app/components/layout/Navbar";
export default function Store() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]),
    [page, setPage] = useState(1),
    [count, setCount] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(""),
    [family, setFamily] = useState("");
  const query = new URLSearchParams({
    page: String(page),
    q: search,
    family,
  }).toString();
  const { addToCart, cart, ready } = useCart(),
    member = useMember();
  useEffect(() => {
    let live = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const d = await api<{ products: Product[]; count: number }>(
          `/api/productos?${query}`,
        );
        if (live) {
          setProducts(d.products);
          setCount(d.count);
        }
      } catch (e) {
        if (live) setError((e as Error).message);
      } finally {
        if (live) setLoading(false);
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [query]);
  return (
    <>
      <Navbar />
      <main className="delta-container space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Catálogo DELTA</h1>
            <p className="text-slate-400">
              Precios en pesos colombianos. Confirma disponibilidad y entrega al
              comprar.
            </p>
          </div>
          <Link className="delta-button" href="/tienda/carrito">
            Carrito ({cart.reduce((s, x) => s + x.quantity, 0)})
          </Link>
        </div>
        <label className="block">
          Buscar en el catálogo
          <input
            className="delta-input"
            value={search}
            maxLength={100}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Nombre, marca, familia o notas"
          />
        </label>
        <label className="block">
          Familia olfativa
          <select
            className="delta-input"
            value={family}
            onChange={(e) => {
              setFamily(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las familias</option>
            {FAMILIES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        {member.error && (
          <p role="alert" className="text-red-300">
            {member.error}
          </p>
        )}
        {loading ? (
          <p role="status">Cargando catálogo…</p>
        ) : !products.length ? (
          <p>No encontramos productos para estos filtros.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => {
              const quantity =
                cart.find((i) => i.id === product.id)?.quantity ?? 0;
              return (
                <article key={product.id} className="delta-card space-y-3">
                  {product.image_url ? (
                    <Image
                      unoptimized
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                      width={400}
                      height={320}
                      className="h-48 w-full object-contain bg-slate-950 rounded-xl"
                    />
                  ) : (
                    <div className="h-40 grid place-items-center bg-slate-950 rounded-xl text-amber-300">
                      Fotografía pendiente
                    </div>
                  )}
                  <p className="text-sm text-slate-400">
                    {product.brand} · {product.family}
                  </p>
                  <Link
                    href={`/tienda/producto/${product.id}`}
                    className="text-xl font-bold block"
                  >
                    {product.name}
                  </Link>
                  <p className="line-clamp-2 text-sm">{product.description}</p>
                  <p className="text-amber-300 font-bold">
                    {formatCOP(product.price)}
                  </p>
                  <p className="text-sm">
                    {product.stock > 0
                      ? `${product.stock} disponibles`
                      : "Agotado"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="delta-button flex-1"
                      disabled={
                        !ready || quantity >= product.stock || quantity >= 99
                      }
                      onClick={() =>
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          quantity: 1,
                        })
                      }
                    >
                      {quantity >= product.stock
                        ? "Sin más unidades"
                        : "Añadir al carrito"}
                    </button>
                    <button
                      className="delta-secondary"
                      aria-label={`Guardar ${product.name} en favoritos`}
                      onClick={() => {
                        if (!member.user) router.push("/login?next=/tienda");
                        else void member.toggleFav(product);
                      }}
                    >
                      {member.isFav(product.id) ? "♥" : "♡"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <div className="flex justify-between items-center">
          <button
            className="delta-secondary"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page} de {Math.max(1, Math.ceil(count / 24))}
          </span>
          <button
            className="delta-secondary"
            disabled={page * 24 >= count || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </main>
    </>
  );
}
