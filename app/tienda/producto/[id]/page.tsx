"use client";
import ProductPhoto from "@/app/components/productos/ProductPhoto";
import { Suspense } from "react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import type { Product } from "@/lib/products";
import { useCart } from "@/app/context/CartContext";
import { formatCOP } from "@/lib/format";
function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params),
    [product, setProduct] = useState<Product | null>(null),
    [error, setError] = useState("");
  const { cart, addToCart, ready } = useCart();
  useEffect(() => {
    let live = true;
    api<{ product: Product }>(`/api/productos/${id}`)
      .then((d) => {
        if (live) setProduct(d.product);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [id]);
  return (
    <main className="delta-container space-y-5">
      <Link href="/tienda">← Volver al catálogo</Link>
      {error ? (
        <p role="alert">{error}</p>
      ) : !product ? (
        <p>Cargando…</p>
      ) : (
        <article className="delta-card grid md:grid-cols-2 gap-8">
          <ProductPhoto src={product.image_url} name={product.name} className="aspect-square w-full" />
          <div className="space-y-4">
            <p>{product.brand}</p>
            <h1 className="text-3xl">{product.name}</h1>
            <p>{product.description}</p>
            <p>Familia: {product.family}</p>
            <p>Notas: {product.notes || "Por completar"}</p>
            <p>
              Presentación:{" "}
              {product.presentation_ml
                ? `${product.presentation_ml} ml`
                : "Por completar"}{" "}
              · {product.concentration || "Concentración por completar"}
            </p>
            <p>
              Ocasión: {product.occasion} · Clima: {product.climate_preference}
            </p>
            <p className="text-2xl text-amber-300">
              {formatCOP(product.price)}
            </p>
            <p>Disponibles: {product.stock}</p>
            <button
              className="delta-button"
              disabled={
                !ready ||
                (cart.find((i) => i.id === id)?.quantity ?? 0) >= product.stock
              }
              onClick={() =>
                addToCart({
                  id,
                  name: product.name,
                  price: product.price,
                  image: product.image_url ?? undefined,
                  quantity: 1,
                })
              }
            >
              Añadir al carrito
            </button>
            <Link href="/tienda/carrito" className="block">
              Revisar carrito →
            </Link>
            <p className="text-sm text-slate-400">
              La duración percibida varía según uso y condiciones. Consulta
              entrega y pago con la tienda.
            </p>
          </div>
        </article>
      )}
    </main>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8">Cargando…</p>}>
      <Content params={params} />
    </Suspense>
  );
}
