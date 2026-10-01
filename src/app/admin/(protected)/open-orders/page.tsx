"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../../admin-shared.module.css";

type OpenOrder = {
  id: string;
  name: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: string;
  createdAt: string;
};

const OO_STATUSES = ["DRAFT", "UPCOMING", "OPEN", "CLOSED"];
const STATUS_COLOR: Record<string, string> = {
  OPEN: "#10b981", CLOSED: "#ef4444", UPCOMING: "#3b82f6", DRAFT: "#f59e0b",
};

const emptyForm = { name: "", description: "", startAt: "", endAt: "", status: "DRAFT" };

export default function AdminOpenOrdersPage() {
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OpenOrder | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/admin/open-orders");
    if (!res.ok) return;
    const data = await res.json();
    setOpenOrders(data.openOrders ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const toDatetimeLocal = (iso: string) => iso ? iso.slice(0, 16) : "";

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (oo: OpenOrder) => {
    setEditing(oo);
    setForm({
      name: oo.name,
      description: oo.description ?? "",
      startAt: toDatetimeLocal(oo.startAt),
      endAt: toDatetimeLocal(oo.endAt),
      status: oo.status,
    });
    setError(null);
    setShowForm(true);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const save = async () => {
    if (!form.name || !form.startAt || !form.endAt) {
      setError("Nama, waktu mulai, dan waktu selesai wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    const url = editing ? `/api/admin/open-orders/${editing.id}` : "/api/admin/open-orders";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, description: form.description || null,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        status: form.status,
      }),
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
          <h1 className={styles.title}>Kelola Open Order</h1>
          <p className={styles.subtitle}>Atur periode penjualan aktif</p>
        </div>
        <button className={styles.btnAdd} onClick={openNew}>+ Buat Open Order</button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Open Order</th>
                <th>Status</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Deskripsi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {openOrders.length === 0 && (
                <tr className={styles.emptyRow}><td colSpan={6}>Belum ada Open Order</td></tr>
              )}
              {openOrders.map(oo => (
                <tr key={oo.id}>
                  <td style={{ fontWeight: 600 }}>{oo.name}</td>
                  <td>
                    <span className={styles.badge} style={{ background: `${STATUS_COLOR[oo.status]}22`, color: STATUS_COLOR[oo.status] }}>
                      {oo.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{new Date(oo.startAt).toLocaleString("id-ID")}</td>
                  <td style={{ fontSize: "0.85rem" }}>{new Date(oo.endAt).toLocaleString("id-ID")}</td>
                  <td className={styles.truncate} style={{ color: "var(--gray-500)", fontSize: "0.875rem" }}>
                    {oo.description ?? "—"}
                  </td>
                  <td>
                    <button className={styles.btnIcon} onClick={() => openEdit(oo)}>Edit</button>
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
            <h2 className={styles.modalTitle}>{editing ? "Edit Open Order" : "Buat Open Order Baru"}</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Open Order</label>
                <input className={styles.formInput} value={form.name} onChange={handleChange("name")} placeholder="Misal: Open Order April 2025" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Deskripsi (opsional)</label>
                <textarea className={styles.formTextarea} value={form.description} onChange={handleChange("description")} placeholder="Keterangan singkat tentang periode ini" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Waktu Mulai</label>
                  <input className={styles.formInput} type="datetime-local" value={form.startAt} onChange={handleChange("startAt")} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Waktu Selesai</label>
                  <input className={styles.formInput} type="datetime-local" value={form.endAt} onChange={handleChange("endAt")} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select className={styles.formSelect} value={form.status} onChange={handleChange("status")}>
                  {OO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {error && <div className={styles.errorBox}>{error}</div>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={save} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
              <button className={styles.btnSecondary} onClick={() => setShowForm(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
