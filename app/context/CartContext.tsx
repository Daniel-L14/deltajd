"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}
interface CartStore {
  cart: CartItem[];
  ready: boolean;
  storageError: string | null;
  addToCart: (i: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, n: number) => void;
  clearCart: () => void;
  total: number;
}
const Context = createContext<CartStore | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState<string | null>(null);
  useEffect(() => {
    // La lectura del almacenamiento externo termina antes de habilitar cualquier escritura.
    const restore = async () => {
      let items: CartItem[] = [];
      try {
        const v: unknown = JSON.parse(
          localStorage.getItem("delta_cart") ?? "[]",
        );
        if (Array.isArray(v))
          items = v.filter(
            (i): i is CartItem =>
              !!i &&
              typeof i.id === "string" &&
              typeof i.name === "string" &&
              Number.isFinite(i.price) &&
              i.price > 0 &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0 &&
              i.quantity <= 99,
          );
      } catch {
        setStorageError("No se pudo recuperar el carrito guardado.");
      }
      setCart(items);
      setReady(true);
    };
    void restore();
  }, []);
  const save = useCallback((fn: (items: CartItem[]) => CartItem[]) => {
    setCart((previous) => fn(previous));
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("delta_cart", JSON.stringify(cart));
    } catch {
      console.warn("El navegador no permite guardar el carrito.");
    }
  }, [cart, ready]);
  const addToCart = (i: CartItem) => {
    if (!ready || !Number.isFinite(i.price) || i.price <= 0) return;
    save((prev) => {
      const found = prev.find((x) => x.id === i.id);
      return found
        ? prev.map((x) =>
            x.id === i.id
              ? { ...x, image: i.image, quantity: Math.min(99, x.quantity + 1) }
              : x,
          )
        : [...prev, { ...i, quantity: 1 }];
    });
  };
  const clearCart = useCallback(() => save(() => []), [save]);
  const removeFromCart = (id: string) =>
    save((prev) => prev.filter((x) => x.id !== id));
  const updateQuantity = (id: string, n: number) => {
    if (!Number.isInteger(n) || n > 99) return;
    if (n <= 0) removeFromCart(id);
    else
      save((prev) =>
        prev.map((x) => (x.id === id ? { ...x, quantity: n } : x)),
      );
  };
  return (
    <Context.Provider
      value={{
        cart,
        ready,
        storageError,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCart() {
  const c = useContext(Context);
  if (!c) throw new Error("Falta CartProvider");
  return c;
}
