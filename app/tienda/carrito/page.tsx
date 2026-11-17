"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { api, RequestError } from "@/lib/client-api";
import { formatCOP } from "@/lib/format";
import type { Product } from "@/lib/products";
type PendingCheckout = {
  userId: string;
  cartSignature: string;
  fingerprint: string;
  key: string;
};
const pendingKey = "delta_pending_checkout";
function readPending(): PendingCheckout | null {
  try {
    return JSON.parse(sessionStorage.getItem(pendingKey) ?? "null");
  } catch {
    return null;
  }
}
function writePending(pending: PendingCheckout | null) {
  try {
    if (pending) sessionStorage.setItem(pendingKey, JSON.stringify(pending));
    else sessionStorage.removeItem(pendingKey);
  } catch {
    /* A blocked storage still permits a retry while this page is open. */
  }
}
export default function Checkout() {
  const {
    cart,
    ready,
    removeFromCart,
    updateQuantity,
    clearCart,
    storageError,
  } = useCart();
  const router = useRouter();
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [address, setAddress] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [account, setAccount] = useState<string | null>(null),
    [checking, setChecking] = useState(true),
    [prices, setPrices] = useState<Record<string, Product>>({}),
    [loadedSignature, setLoadedSignature] = useState(""),
    [recoveredSignature, setRecoveredSignature] = useState<string | null>(null),
    [priceVersion, setPriceVersion] = useState(0);
  const pendingInPage = useRef<PendingCheckout | null>(null);
  const submitting = useRef(false);
  const signature = cart
    .map((i) => `${i.id}:${i.quantity}`)
    .sort()
    .join("|");
  useEffect(() => {
    api<{ user: { id: string; user_metadata: { full_name?: string } } }>(
      "/api/cuenta",
    )
      .then((d) => {
        setAccount(d.user.id);
        setName(d.user.user_metadata.full_name ?? "");
      })
      .catch((e) => {
        setAccount(null);
        if (!(e instanceof RequestError) || e.status !== 401)
          setError(e.message);
      })
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    async function load() {
      try {
        const result = await Promise.all(
          cart.map((i) => api<{ product: Product }>(`/api/productos/${i.id}`)),
        );
        if (live) {
          setPrices(
            Object.fromEntries(result.map((x) => [x.product.id, x.product])),
          );
          setLoadedSignature(signature);
        }
      } catch (e) {
        if (live) {
          setLoadedSignature("");
          setError((e as Error).message);
        }
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [cart, signature, ready, priceVersion]);
  useEffect(() => {
    if (!account || !ready) return;
    let live = true;
    const lookupSignature = `${account}:${signature}`;
    async function recover() {
      try {
        const pending = readPending();
        if (pending?.userId !== account || pending.cartSignature !== signature)
          return;
        const result = await api<{ codigo: string | null }>(
          `/api/cuenta/pedido-pendiente?key=${encodeURIComponent(pending.key)}`,
        );
        if (live && result.codigo) {
          writePending(null);
          clearCart();
          router.replace(`/tienda/pedido/${encodeURIComponent(result.codigo)}`);
        }
      } catch {
        /* Mis pedidos also shows confirmations from the server. */
      } finally {
        if (live) setRecoveredSignature(lookupSignature);
      }
    }
    void recover();
    return () => {
      live = false;
    };
  }, [account, ready, signature, router, clearCart]);
  const total = cart.reduce(
    (s, i) => s + (prices[i.id]?.price ?? i.price) * i.quantity,
    0,
  );
  const invalid =
    recoveredSignature !== `${account}:${signature}` ||
    loadedSignature !== signature ||
    cart.some((i) => !prices[i.id] || prices[i.id].stock < i.quantity);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current || !account || invalid || !cart.length) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    const payload = {
      cliente_nombre: name.trim(),
      cliente_telefono: phone.trim(),
      direccion: address.trim(),
      subtotal_visto_centavos: Math.round(total * 100),
      items: cart
        .map((i) => ({ producto_id: i.id, cantidad: i.quantity }))
        .sort((a, b) => a.producto_id.localeCompare(b.producto_id)),
    };
    try {
      const serialized = JSON.stringify(payload);
      const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(serialized),
      );
      const fingerprint = Array.from(new Uint8Array(hash), (value) =>
        value.toString(16).padStart(2, "0"),
      ).join("");
      const saved = pendingInPage.current ?? readPending();
      const key =
        saved?.userId === account && saved.fingerprint === fingerprint
          ? saved.key
          : crypto.randomUUID();
      const pending = {
        userId: account,
        cartSignature: signature,
        fingerprint,
        key,
      };
      pendingInPage.current = pending;
      writePending(pending);
      const result = await api<{ codigo: string }>("/api/pedidos", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: serialized,
      });
      clearCart();
      writePending(null);
      router.replace(`/tienda/pedido/${encodeURIComponent(result.codigo)}`);
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof RequestError && e.status === 409) {
        setLoadedSignature("");
        setPriceVersion((value) => value + 1);
      }
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="delta-container max-w-3xl space-y-6">
      <Link href="/tienda">← Seguir comprando</Link>
      <h1 className="text-3xl">Revisar pedido</h1>
      {storageError && <p role="alert">{storageError}</p>}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {!ready ? (
        <p>Cargando carrito…</p>
      ) : !cart.length ? (
        <p>
          No tienes productos. <Link href="/tienda">Ir al catálogo</Link>
        </p>
      ) : (
        <>
          <div className="delta-card space-y-4">
            {cart.map((i) => (
              <div
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p>{i.name}</p>
                  <p>{formatCOP(prices[i.id]?.price ?? i.price)}</p>
                  {prices[i.id] && i.quantity > prices[i.id].stock && (
                    <p className="text-red-300">
                      Solo quedan {prices[i.id].stock} unidades.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    disabled={busy}
                    aria-label={`Restar ${i.name}`}
                    onClick={() => updateQuantity(i.id, i.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{i.quantity}</span>
                  <button
                    disabled={
                      busy ||
                      i.quantity >= 99 ||
                      i.quantity >= (prices[i.id]?.stock ?? 0)
                    }
                    aria-label={`Sumar ${i.name}`}
                    onClick={() => updateQuantity(i.id, i.quantity + 1)}
                  >
                    +
                  </button>
                  <button disabled={busy} onClick={() => removeFromCart(i.id)}>
                    Quitar
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xl text-amber-300">
              Subtotal: {formatCOP(total)}
            </p>
            <p className="text-sm text-slate-400">
              El servidor confirma el precio y stock al registrar. La entrega y
              cualquier costo adicional se acuerdan con la tienda antes del
              pago.
            </p>
          </div>
          {checking ? (
            <p>Comprobando sesión…</p>
          ) : !account ? (
            <div className="delta-card">
              <p>
                Inicia sesión para guardar y consultar tu pedido de forma
                segura. Tu carrito se conserva.
              </p>
              <Link
                className="delta-button inline-block mt-4"
                href="/login?next=/tienda/carrito"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="delta-card space-y-4">
              <label className="block">
                Nombre
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  className="delta-input"
                  disabled={busy}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                />
              </label>
              <label className="block">
                Teléfono
                <input
                  required
                  minLength={7}
                  maxLength={20}
                  autoComplete="tel"
                  type="tel"
                  className="delta-input"
                  disabled={busy}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                  }}
                />
              </label>
              <label className="block">
                Dirección y ciudad
                <input
                  required
                  minLength={8}
                  maxLength={300}
                  autoComplete="street-address"
                  className="delta-input"
                  disabled={busy}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                  }}
                />
              </label>
              <button
                disabled={busy || invalid}
                className="delta-button w-full"
              >
                {busy ? "Registrando…" : "Crear pedido y coordinar el pago"}
              </button>
              <p className="text-xs text-slate-400">
                Este paso no realiza un cobro. Puedes consultar tus pedidos para
                comprobar el registro si pierdes la conexión.
              </p>
              <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
            </form>
          )}
        </>
      )}
    </main>
  );
}
