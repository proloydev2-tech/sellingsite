import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem } from './supabase';

const STORAGE_KEY = 'voltstore_cart';

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);

function loadInitial(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const value = useMemo<CartCtx>(() => {
    const add = (item: CartItem) => {
      setItems((prev) => {
        const existing = prev.find((p) => p.variantId === item.variantId);
        if (existing) {
          return prev.map((p) =>
            p.variantId === item.variantId ? { ...p, quantity: p.quantity + item.quantity } : p,
          );
        }
        return [...prev, item];
      });
    };
    const remove = (variantId: string) =>
      setItems((prev) => prev.filter((p) => p.variantId !== variantId));
    const setQty = (variantId: string, qty: number) =>
      setItems((prev) =>
        prev
          .map((p) => (p.variantId === variantId ? { ...p, quantity: qty } : p))
          .filter((p) => p.quantity > 0),
      );
    const clear = () => setItems([]);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, add, remove, setQty, clear, count, total };
  }, [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
