"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  variantId?: string;
  variantName?: string;
  name: string;
  price: number;
  quantity: number;
};

export function getCartItemKey(item: Pick<CartItem, "productId" | "variantId">) {
  return `${item.productId}:${item.variantId ?? "default"}`;
}

const emptyCart: CartItem[] = [];
let cartSnapshot: CartItem[] | null = null;
const subscribers = new Set<() => void>();

function readCart(): CartItem[] {
  if (cartSnapshot) return cartSnapshot;

  try {
    const stored = window.localStorage.getItem("hme-cart");
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    cartSnapshot = Array.isArray(parsed)
      ? parsed.filter((item): item is CartItem =>
          typeof item?.productId === "string" &&
          typeof item?.name === "string" &&
          Number.isSafeInteger(item?.price) &&
          Number.isInteger(item?.quantity) &&
          item.quantity > 0,
        )
      : [];
  } catch {
    cartSnapshot = [];
  }

  return cartSnapshot;
}

function getSnapshot() {
  return typeof window === "undefined" ? emptyCart : readCart();
}

function subscribe(listener: () => void) {
  subscribers.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === "hme-cart") {
      cartSnapshot = null;
      listener();
    }
  };

  window.addEventListener("storage", onStorage);
  return () => {
    subscribers.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, () => emptyCart);
}

export function saveCart(items: CartItem[]) {
  window.localStorage.setItem("hme-cart", JSON.stringify(items));
  cartSnapshot = items;
  subscribers.forEach((listener) => listener());
}

export function addCartItem(item: CartItem) {
  const current = readCart();
  const itemKey = getCartItemKey(item);
  const existing = current.find((line) => getCartItemKey(line) === itemKey);
  const quantity = (existing?.quantity ?? 0) + item.quantity;
  const productQuantity = current
    .filter((line) => line.productId === item.productId)
    .reduce((sum, line) => sum + line.quantity, 0) + item.quantity;

  if (quantity > 10 || productQuantity > 10) {
    throw new Error("Maksimal 10 pcs per produk.");
  }

  saveCart(
    existing
      ? current.map((line) =>
          getCartItemKey(line) === itemKey
            ? { ...line, quantity }
            : line,
        )
      : [...current, item],
  );
}

export function clearCart() {
  saveCart([]);
}
