"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("hme-cart");
    setItems(stored ? JSON.parse(stored) : []);
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const updateQuantity = (productId: string, delta: number) => {
    const next = items
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item,
      )
      .filter((item) => item.quantity > 0);

    setItems(next);
    localStorage.setItem("hme-cart", JSON.stringify(next));
  };

  const removeItem = (productId: string) => {
    const next = items.filter((item) => item.productId !== productId);
    setItems(next);
    localStorage.setItem("hme-cart", JSON.stringify(next));
  };

  return (
    <main className="page-shell compact">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">HME</span>
          <div>
            <strong>Keranjang</strong>
            <small>Checkout cepat</small>
          </div>
        </div>
        <nav className="main-nav">
          <Link href="/">Home</Link>
          <Link href="/products">Produk</Link>
          <Link href="/order-tracking">Tracking</Link>
        </nav>
      </header>

      <section className="two-col">
        <div className="form-panel">
          <h2>Daftar Produk</h2>
          {items.length === 0 ? (
            <div className="empty-state">Keranjang masih kosong.</div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.productId}>
                <div>
                  <strong>{item.name}</strong>
                  <div className="status-note">Rp {item.price.toLocaleString("id-ID")}</div>
                </div>
                <div className="button-inline">
                  <button className="button secondary small" onClick={() => updateQuantity(item.productId, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button className="button secondary small" onClick={() => updateQuantity(item.productId, 1)}>+</button>
                </div>
                <button className="button danger small" onClick={() => removeItem(item.productId)}>Hapus</button>
              </div>
            ))
          )}
        </div>

        <aside className="summary-box">
          <h3>Ringkasan</h3>
          <div className="status-note">Total item: {items.reduce((sum, item) => sum + item.quantity, 0)}</div>
          <div className="price-row" style={{ marginTop: 12 }}>
            <strong>Total</strong>
            <strong>Rp {total.toLocaleString("id-ID")}</strong>
          </div>
          <div className="button-row">
            <Link href="/checkout" className="button primary">Checkout</Link>
            <Link href="/products" className="button secondary">Lanjut Belanja</Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
