"use client";
import { Suspense } from "react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { formatCOP } from "@/lib/format";
import type { Pedido } from "@/lib/pedidos/types";
function Content({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params),
    [pedido, setPedido] = useState<Pedido | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    api<{ pedido: Pedido }>(`/api/cuenta/pedidos/${encodeURIComponent(codigo)}`)
      .then((d) => {
        if (live) setPedido(d.pedido);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [codigo]);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
  const message = pedido
    ? `Hola DELTA. Quiero coordinar el pago del pedido ${pedido.codigo}, por ${formatCOP(pedido.total)}. Verifiquen el pedido en el panel.`
    : "";
  return (
    <main className="delta-container max-w-2xl space-y-5">
      <Link href="/cuenta/pedidos">← Mis pedidos</Link>
      {error ? (
        <p role="alert">
          {error}{" "}
          <Link
            href={`/login?next=${encodeURIComponent("/tienda/pedido/" + codigo)}`}
          >
            Iniciar sesión
          </Link>
        </p>
      ) : !pedido ? (
        <p>Cargando pedido…</p>
      ) : (
        <div className="delta-card space-y-5">
          <h1 className="text-2xl">Pedido registrado</h1>
          <p className="break-all font-mono">{pedido.codigo}</p>
          <p>Estado: {pedido.estado}</p>
          <ul>
            {pedido.items.map((i, index) => (
              <li key={index}>
                {i.nombre} × {i.cantidad} — {formatCOP(i.precio * i.cantidad)}
              </li>
            ))}
          </ul>
          <p className="text-2xl text-amber-300">{formatCOP(pedido.total)}</p>
          <p>
            El pedido no se considera pagado hasta que la tienda confirme el
            pago.
          </p>
          {phone && /^\d{10,15}$/.test(phone) ? (
            <a
              className="delta-button inline-block"
              href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Coordinar por WhatsApp
            </a>
          ) : (
            <p>Contacta a la tienda indicando tu código de pedido.</p>
          )}
        </div>
      )}
    </main>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8">Cargando…</p>}>
      <Content params={params} />
    </Suspense>
  );
}
