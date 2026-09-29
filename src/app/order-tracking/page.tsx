"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [whatsappLast4, setWhatsappLast4] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch(
      `/api/orders?orderNumber=${encodeURIComponent(orderNumber)}&whatsappLast4=${encodeURIComponent(whatsappLast4)}`,
    );
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Order tidak ditemukan.");
      setResult(null);
      return;
    }

    setResult(data.order);
  };

  const lastUpdated = useMemo(
    () => (result ? new Date(result.updatedAt).toLocaleString("id-ID") : "-"),
    [result],
  );

  return (
    <main className="page-shell compact">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">HME</span>
          <div>
            <strong>Tracking Pesanan</strong>
            <small>Order ID + 4 digit WhatsApp</small>
          </div>
        </div>
        <nav className="main-nav">
          <Link href="/">Home</Link>
          <Link href="/products">Produk</Link>
        </nav>
      </header>

      <section className="form-panel">
        <div className="two-col">
          <div className="form-group">
            <label>Order ID</label>
            <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="HME-0001" />
          </div>
          <div className="form-group">
            <label>4 digit terakhir WhatsApp</label>
            <input value={whatsappLast4} onChange={(e) => setWhatsappLast4(e.target.value)} maxLength={4} placeholder="1234" />
          </div>
        </div>
        <div className="button-row">
          <button className="button primary" onClick={lookup} disabled={loading}>{loading ? "Mencari..." : "Cari Pesanan"}</button>
        </div>
        {error && <div className="error-text">{error}</div>}
      </section>

      {result && (
        <section className="order-card">
          <h3>Informasi Pesanan</h3>
          <div className="two-col">
            <div>
              <p><strong>Nama:</strong> {result.customerName}</p>
              <p><strong>Produk:</strong> {result.items.map((item: any) => item.productName).join(", ")}</p>
              <p><strong>Jumlah:</strong> {result.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</p>
              <p><strong>Total:</strong> Rp {Number(result.totalAmount).toLocaleString("id-ID")}</p>
            </div>
            <div>
              <p><strong>Payment Status:</strong> {result.paymentStatus}</p>
              <p><strong>Order Status:</strong> {result.orderStatus}</p>
              <p><strong>Waktu Pemesanan:</strong> {new Date(result.createdAt).toLocaleString("id-ID")}</p>
              <p><strong>Update Terakhir:</strong> {lastUpdated}</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
