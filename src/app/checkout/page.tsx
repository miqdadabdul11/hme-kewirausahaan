"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    nim: "",
    studyProgram: "",
    whatsapp: "",
    email: "",
    notes: "",
    paymentMethod: "Transfer",
  });

  useEffect(() => {
    const stored = localStorage.getItem("hme-cart") || "[]";
    setItems(JSON.parse(stored));
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      ...form,
      items,
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.error || "Checkout gagal.");
      return;
    }

    localStorage.removeItem("hme-cart");
    window.location.href = `/order-tracking?orderNumber=${encodeURIComponent(result.order.orderNumber)}`;
  };

  if (items.length === 0) {
    return (
      <main className="page-shell compact">
        <div className="empty-state">Keranjang masih kosong. Silakan pilih produk terlebih dahulu.</div>
      </main>
    );
  }

  return (
    <main className="page-shell compact">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">HME</span>
          <div>
            <strong>Checkout</strong>
            <small>Form pemesanan</small>
          </div>
        </div>
        <nav className="main-nav">
          <Link href="/">Home</Link>
          <Link href="/cart">Keranjang</Link>
        </nav>
      </header>

      <form className="form-grid" onSubmit={submit}>
        <div className="form-panel">
          <h2>Data Pemesan</h2>
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
          </div>
          <div className="two-col">
            <div className="form-group">
              <label>NIM</label>
              <input value={form.nim} onChange={(e) => setForm({ ...form, nim: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Program Studi</label>
              <input value={form.studyProgram} onChange={(e) => setForm({ ...form, studyProgram: e.target.value })} required />
            </div>
          </div>
          <div className="two-col">
            <div className="form-group">
              <label>Nomor WhatsApp</label>
              <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email (opsional)</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Catatan</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Metode Pembayaran</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="Transfer">Transfer</option>
              <option value="QRIS">QRIS</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          {message && <div className="error-text">{message}</div>}
        </div>

        <aside className="summary-box">
          <h3>Ringkasan Pesanan</h3>
          {items.map((item) => (
            <div key={item.productId} className="cart-item">
              <div>
                <strong>{item.name}</strong>
                <div className="status-note">Qty: {item.quantity}</div>
              </div>
              <div>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</div>
            </div>
          ))}
          <div className="price-row" style={{ marginTop: 16 }}>
            <strong>Total</strong>
            <strong>Rp {total.toLocaleString("id-ID")}</strong>
          </div>
          <div className="button-row">
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? "Memproses..." : "Buat Pesanan"}
            </button>
            <Link href="/cart" className="button secondary">Kembali</Link>
          </div>
        </aside>
      </form>
    </main>
  );
}
