"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin-shared.module.css";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  type: string;
  status: string;
  stockQuantity: number | null;
  targetMinimum: number | null;
  maximumQuantity: number | null;
  category: string | null;
  image: string | null;
  openOrderId: string | null;
};

type OpenOrder = { id: string; name: string; status: string };

const PRODUCT_STATUSES = ["DRAFT", "COMING_SOON", "ACTIVE", "SOLD_OUT", "INACTIVE"];
const PRODUCT_TYPES = ["READY_STOCK", "PRE_ORDER"];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#10b981", DRAFT: "#f59e0b", COMING_SOON: "#3b82f6",
  SOLD_OUT: "#ef4444", INACTIVE: "#6b7280",
};

const emptyForm = {
  name: "", description: "", price: "", type: "READY_STOCK", status: "ACTIVE",
  stockQuantity: "", targetMinimum: "", maximumQuantity: "",
  category: "", image: "", openOrderId: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [pRes, ooRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/open-orders"),
    ]);
    if (pRes.ok) { const d = await pRes.json(); setProducts(d.products ?? []); }
    if (ooRes.ok) { const d = await ooRes.json(); setOpenOrders(d.openOrders ?? []); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description,
      price: String(p.price), type: p.type, status: p.status,
      stockQuantity: p.stockQuantity != null ? String(p.stockQuantity) : "",
      targetMinimum: p.targetMinimum != null ? String(p.targetMinimum) : "",
      maximumQuantity: p.maximumQuantity != null ? String(p.maximumQuantity) : "",
      category: p.category ?? "", image: p.image ?? "",
      openOrderId: p.openOrderId ?? "",
    });
    setError(null);
    setShowForm(true);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name, description: form.description,
      price: Number(form.price), type: form.type, status: form.status,
      category: form.category || "Umum",
      image: form.image || null,
      stockQuantity: form.stockQuantity !== "" ? Number(form.stockQuantity) : 0,
      targetMinimum: form.targetMinimum !== "" ? Number(form.targetMinimum) : 0,
      maximumQuantity: form.maximumQuantity !== "" ? Number(form.maximumQuantity) : null,
      openOrderId: form.openOrderId || null,
    };
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Gagal menyimpan."); return; }
    setShowForm(false);
    fetchAll();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kelola Produk</h1>
          <p className={styles.subtitle}>{products.length} produk terdaftar</p>
        </div>
        <button className={styles.btnAdd} onClick={openNew}>+ Tambah Produk</button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Tipe</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Stok / Target</th>
                <th>Kategori</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr className={styles.emptyRow}><td colSpan={7}>Belum ada produk</td></tr>
              )}
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>{p.slug}</div>
                  </td>
                  <td>
                    <span className={styles.badge} style={{ background: p.type === "PRE_ORDER" ? "#ede9fe" : "#dcfce7", color: p.type === "PRE_ORDER" ? "#7c3aed" : "#15803d" }}>
                      {p.type}
                    </span>
                  </td>
                  <td className={styles.mono}>Rp {Number(p.price).toLocaleString("id-ID")}</td>
                  <td>
                    <span className={styles.badge} style={{ background: `${STATUS_COLOR[p.status]}22`, color: STATUS_COLOR[p.status] }}>
                      {p.status}
                    </span>
                  </td>
                  <td className={styles.mono}>
                    {p.type === "READY_STOCK" ? `${p.stockQuantity ?? 0} pcs` : `Target: ${p.targetMinimum ?? 0}`}
                  </td>
                  <td style={{ color: "var(--gray-500)", fontSize: "0.875rem" }}>{p.category ?? "—"}</td>
                  <td>
                    <button className={styles.btnIcon} onClick={() => openEdit(p)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editing ? "Edit Produk" : "Tambah Produk Baru"}</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Produk</label>
                <input className={styles.formInput} value={form.name} onChange={handleChange("name")} placeholder="Nama produk" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Deskripsi</label>
                <textarea className={styles.formTextarea} value={form.description} onChange={handleChange("description")} placeholder="Deskripsi singkat produk" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Harga (Rp)</label>
                  <input className={styles.formInput} type="number" value={form.price} onChange={handleChange("price")} placeholder="0" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kategori</label>
                  <input className={styles.formInput} value={form.category} onChange={handleChange("category")} placeholder="Misal: Makanan, Merchandise" />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tipe Produk</label>
                  <select className={styles.formSelect} value={form.type} onChange={handleChange("type")}>
                    {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select className={styles.formSelect} value={form.status} onChange={handleChange("status")}>
                    {PRODUCT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {form.type === "READY_STOCK" ? (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stok Tersedia</label>
                  <input className={styles.formInput} type="number" value={form.stockQuantity} onChange={handleChange("stockQuantity")} placeholder="0" />
                </div>
              ) : (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Minimum</label>
                    <input className={styles.formInput} type="number" value={form.targetMinimum} onChange={handleChange("targetMinimum")} placeholder="0" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Maks Pesanan</label>
                    <input className={styles.formInput} type="number" value={form.maximumQuantity} onChange={handleChange("maximumQuantity")} placeholder="Opsional" />
                  </div>
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>URL Gambar (opsional)</label>
                <input className={styles.formInput} value={form.image} onChange={handleChange("image")} placeholder="https://..." />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hubungkan ke Open Order</label>
                <select className={styles.formSelect} value={form.openOrderId} onChange={handleChange("openOrderId")}>
                  <option value="">— Tidak ada —</option>
                  {openOrders.map(oo => <option key={oo.id} value={oo.id}>{oo.name} ({oo.status})</option>)}
                </select>
              </div>
              {error && <div className={styles.errorBox}>{error}</div>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={save} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan Produk"}
              </button>
              <button className={styles.btnSecondary} onClick={() => setShowForm(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
