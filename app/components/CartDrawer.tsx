"use client";
import ProductPhoto from "@/app/components/productos/ProductPhoto";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { formatCOP } from "@/lib/format";
export default function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    { cart, total, removeFromCart } = useCart();
  useEffect(() => {
    const d = dialog.current;
    if (isOpen && !d?.open) d?.showModal();
    if (!isOpen && d?.open) d.close();
  }, [isOpen]);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="cart-title"
      className="m-auto w-[min(95vw,32rem)] rounded-2xl bg-slate-900 text-white p-6 backdrop:bg-black/70"
    >
      <div className="flex justify-between">
        <h2 id="cart-title" className="text-xl">
          Tu carrito
        </h2>
        <button autoFocus onClick={onClose} aria-label="Cerrar carrito">
          ✕
        </button>
      </div>
      <ul className="space-y-4 my-6">
        {cart.map((i) => (
          <li key={i.id} className="flex justify-between gap-3">
            <ProductPhoto src={i.image} name={i.name} compact className="size-12 shrink-0" />
            <span className="flex-1">
              {i.name} × {i.quantity}
            </span>
            <button
              onClick={() => removeFromCart(i.id)}
              aria-label={`Quitar ${i.name}`}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      {cart.length ? (
        <>
          <p>Subtotal estimado: {formatCOP(total)}</p>
          <Link
            href="/tienda/carrito"
            onClick={onClose}
            className="delta-button mt-4 block text-center"
          >
            Revisar y confirmar
          </Link>
        </>
      ) : (
        <p>Tu carrito está vacío.</p>
      )}
    </dialog>
  );
}
