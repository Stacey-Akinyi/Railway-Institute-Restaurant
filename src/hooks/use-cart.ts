import { useEffect, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const KEY = "rti-cart";
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn());
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => read());

  useEffect(() => {
    const sync = () => setItems(read());
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const add = (item: Omit<CartItem, "quantity">) => {
    const cur = read();
    const idx = cur.findIndex((i) => i.id === item.id);
    if (idx >= 0) cur[idx].quantity += 1;
    else cur.push({ ...item, quantity: 1 });
    write(cur);
  };
  const remove = (id: string) => write(read().filter((i) => i.id !== id));
  const update = (id: string, qty: number) => {
    const cur = read();
    const i = cur.find((x) => x.id === id);
    if (!i) return;
    if (qty <= 0) write(cur.filter((x) => x.id !== id));
    else {
      i.quantity = qty;
      write(cur);
    }
  };
  const clear = () => write([]);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, add, remove, update, clear, total, count };
}
