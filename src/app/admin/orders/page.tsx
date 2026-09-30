"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin-shared.module.css";

type OrderItem = { productName: string; quantity: number; price: number; subtotal: number };
type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  nim: string;
  whatsapp: string;
  studyProgram: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  notes: string | null;
  items: OrderItem[];
};

const ORDER_STATUSES = ["PENDING", "PAID", "PROCESSING", "READY", "COMPLETED", "CANCELLED"];
const PAYMENT_STATUSES = ["UNPAID", "PENDING_VERIFICATION", "PAID", "FAILED", "REFUNDED"];

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b", PAID: "#3b82f6", PROCESSING: "#8b5cf6",
  READY: "#10b981", COMPLETED: "#6b7280", CANCELLED: "#ef4444",
};
const PAY_COLOR: Record<string, string> = {
  UNPAID: "#ef4444", PENDING_VERIFICATION: "#f59e0b",
  PAID: "#10b981", FAILED: "#ef4444", REFUNDED: "#6b7280",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [editOrderStatus, setEditOrderStatus] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (!res.ok) return;
    const data = await res.json();
    setOrders(data.orders ?? []);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    let list = orders;
    if (statusFilter) list = list.filter(o => o.orderStatus === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.nim.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [orders, search, statusFilter]);

  const openDetail = (order: Order) => {
    setSelected(order);
    setEditOrderStatus(order.orderStatus);
    setEditPaymentStatus(order.paymentStatus);
    setError(null);
  };

  const saveUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: editOrderStatus, paymentStatus: editPaymentStatus }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Gagal menyimpan.");
      return;
    }
    setSelected(null);
    fetchOrders();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kelola Pesanan</h1>
          <p className={styles.subtitle}>{orders.length} total pesanan tersimpan</p>
        </div>
      </div>

      <div className={styles.filterBar}>
        <input
          className={styles.filterInput}
          placeholder="Cari nama / NIM / order ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Nama</th>
                <th>NIM</th>
                <th>Produk</th>
                <th>Total</th>
                <th>Status Order</th>
                <th>Status Bayar</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr className={styles.emptyRow}><td colSpan={9}>Tidak ada pesanan</td></tr>
              )}
              {filtered.map(order => (
                <tr key={order.id}>
                  <td className={styles.mono}>{order.orderNumber}</td>
                  <td>{order.customerName}</td>
                  <td className={styles.mono}>{order.nim}</td>
                  <td className={styles.truncate}>
                    {order.items.map(i => `${i.productName}(${i.quantity}x)`).join(", ")}
                  </td>
                  <td className={styles.mono}>Rp {Number(order.totalAmount).toLocaleString("id-ID")}</td>
                  <td>
                    <span className={styles.badge} style={{ background: `${STATUS_COLOR[order.orderStatus]}22`, color: STATUS_COLOR[order.orderStatus] }}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge} style={{ background: `${PAY_COLOR[order.paymentStatus]}22`, color: PAY_COLOR[order.paymentStatus] }}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td>
                    <button className={styles.btnIcon} onClick={() => openDetail(order)}>Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Detail Pesanan — {selected.orderNumber}</h2>
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nama Pemesan</label>
                  <div style={{ padding: "10px 12px", background: "var(--gray-100)", borderRadius: 8, fontSize: "0.9rem" }}>{selected.customerName}</div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>NIM</label>
                  <div style={{ padding: "10px 12px", background: "var(--gray-100)", borderRadius: 8, fontSize: "0.9rem", fontFamily: "monospace" }}>{selected.nim}</div>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>WhatsApp</label>
                  <div style={{ padding: "10px 12px", background: "var(--gray-100)", borderRadius: 8, fontSize: "0.9rem" }}>{selected.whatsapp}</div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total</label>
                  <div style={{ padding: "10px 12px", background: "var(--gray-100)", borderRadius: 8, fontSize: "0.9rem", fontWeight: 700, color: "var(--green-500)" }}>
                    Rp {Number(selected.totalAmount).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Produk Dipesan</label>
                <div style={{ background: "var(--gray-100)", borderRadius: 8, padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {selected.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span>{item.productName} × {item.quantity}</span>
                      <span style={{ fontFamily: "monospace" }}>Rp {Number(item.subtotal).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.notes && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Catatan</label>
                  <div style={{ padding: "10px 12px", background: "var(--gray-100)", borderRadius: 8, fontSize: "0.9rem" }}>{selected.notes}</div>
                </div>
              )}

              {/* Edit status */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status Pesanan</label>
                  <select className={styles.formSelect} value={editOrderStatus} onChange={e => setEditOrderStatus(e.target.value)}>
                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status Pembayaran</label>
                  <select className={styles.formSelect} value={editPaymentStatus} onChange={e => setEditPaymentStatus(e.target.value)}>
                    {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={saveUpdate} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
              <button className={styles.btnSecondary} onClick={() => setSelected(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
