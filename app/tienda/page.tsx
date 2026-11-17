"use client";
import ProductPhoto from "@/app/components/productos/ProductPhoto";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Search, ShoppingBag } from "lucide-react";
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
    <div className="delta-frame min-h-screen">
      <Navbar />
      <main className="delta-container space-y-6">
        <section className="grid items-end gap-5 border-b border-gold-400/20 pb-7 pt-3 sm:grid-cols-[1fr_auto] sm:pt-8">
          <div className="space-y-3">
            <h1 className="delta-title">Catálogo <em>DELTA</em></h1>
            <p className="max-w-lg text-slate-300">
              Explora las familias olfativas y consulta el precio y la disponibilidad de cada perfume.
            </p>
          </div>
          <Link className="delta-secondary w-fit" href="/tienda/carrito">
            <ShoppingBag aria-hidden className="size-4" /> Mi carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </Link>
        </section>
        <div className="delta-card grid gap-4 sm:grid-cols-[2fr_1fr]">
          <label className="block min-w-0">
            Buscar en el catálogo
            <span className="relative block">
              <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gold-300" />
              <input
                className="delta-input pl-10"
                value={search}
                maxLength={100}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Nombre, marca o notas"
              />
            </span>
          </label>
          <label className="block min-w-0">
            Familia olfativa
            <select
              className="delta-input"
              value={family}
              onChange={(event) => { setFamily(event.target.value); setPage(1); }}
            >
              <option value="">Todas las familias</option>
              {FAMILIES.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        </div>
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
                <article key={product.id} className="delta-product-card flex flex-col">
                  <Link href={`/tienda/producto/${product.id}`} aria-label={`Ver ${product.name}`}>
                    <ProductPhoto src={product.image_url} name={product.name} className="aspect-[4/3] w-full rounded-none border-0" />
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                  <p className="delta-eyebrow">
                    {product.brand} · {product.family}
                  </p>
                  <Link
                    href={`/tienda/producto/${product.id}`}
                    className="block font-display text-2xl leading-tight text-slate-100 hover:text-gold-300"
                  >
                    {product.name}
                  </Link>
                  <p className="line-clamp-2 text-sm leading-6 text-slate-300">{product.description}</p>
                  <p className="mt-auto pt-2 text-lg font-semibold text-gold-300">
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
                          image: product.image_url ?? undefined,
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
                      aria-label={member.isFav(product.id) ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`}
                      aria-pressed={member.isFav(product.id)}
                      onClick={() => {
                        if (!member.user) router.push("/login?next=/tienda");
                        else void member.toggleFav(product);
                      }}
                    >
                      <Heart aria-hidden className={`size-4 ${member.isFav(product.id) ? "fill-gold-300 text-gold-300" : ""}`} />
                    </button>
                  </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-gold-400/20 pt-5 text-sm text-slate-300">
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
    </div>
  );
}
