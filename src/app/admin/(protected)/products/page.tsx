"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "../../admin-shared.module.css";

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
  variants: ProductVariant[];
};

type ProductVariant = {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  stockQuantity: number | null;
  status: string;
};

type VariantForm = {
  id?: string;
  name: string;
  sku: string;
  price: string;
  stockQuantity: string;
};

type OpenOrder = { id: string; name: string; status: string };

const PRODUCT_STATUSES = ["DRAFT", "COMING_SOON", "ACTIVE", "SOLD_OUT", "INACTIVE"];
const PRODUCT_TYPES = ["READY_STOCK", "PRE_ORDER"];
const MAX_ORIGINAL_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_BYTES = 3.5 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#10b981", DRAFT: "#f59e0b", COMING_SOON: "#3b82f6",
  SOLD_OUT: "#ef4444", INACTIVE: "#6b7280",
};

const emptyForm = {
  name: "", description: "", price: "", type: "READY_STOCK", status: "ACTIVE",
  stockQuantity: "", targetMinimum: "", maximumQuantity: "",
  category: "", image: "", openOrderId: "",
};

const newVariant = (): VariantForm => ({
  name: "Standar",
  sku: "",
  price: "",
  stockQuantity: "0",
});

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [variants, setVariants] = useState<VariantForm[]>([newVariant()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pendingImageUrls = useRef(new Set<string>());

  const fetchAll = useCallback(async () => {
    const [pRes, ooRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/open-orders"),
    ]);
    if (pRes.ok) { const d = await pRes.json(); setProducts(d.products ?? []); }
    if (ooRes.ok) { const d = await ooRes.json(); setOpenOrders(d.openOrders ?? []); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setVariants([newVariant()]);
    setError(null);
    setNotice(null);
    setImageFileName("");
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
    setVariants(p.variants.length > 0
      ? p.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku ?? "",
          price: variant.price == null ? "" : String(variant.price),
          stockQuantity: variant.stockQuantity == null ? "0" : String(variant.stockQuantity),
        }))
      : [{
          ...newVariant(),
          stockQuantity: String(p.stockQuantity ?? 0),
        }]);
    setError(null);
    setNotice(null);
    setImageFileName("");
    setShowForm(true);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleVariantChange = (index: number, field: keyof VariantForm, value: string) => {
    setVariants((current) => current.map((variant, variantIndex) =>
      variantIndex === index ? { ...variant, [field]: value } : variant,
    ));
  };

  const deleteUploadedImage = async (imageUrl: string) => {
    const response = await fetch("/api/admin/product-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Foto sementara gagal dihapus.");
    }
    pendingImageUrls.current.delete(imageUrl);
  };

  const compressImage = async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      throw new Error("Foto tidak dapat diproses oleh browser ini.");
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const encode = (type: string, quality: number) => new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Foto tidak dapat dikompres. Coba pilih foto lain."));
      }, type, quality);
    });

    let blob = await encode("image/webp", 0.82);
    if (blob.type !== "image/webp") {
      blob = await encode("image/jpeg", 0.82);
    }
    for (const quality of [0.72, 0.62, 0.52]) {
      if (blob.size <= MAX_COMPRESSED_IMAGE_BYTES) break;
      blob = await encode(blob.type, quality);
    }
    if (blob.size > MAX_COMPRESSED_IMAGE_BYTES) {
      throw new Error("Foto masih terlalu besar setelah dikompres. Pilih foto yang lebih kecil.");
    }
    return blob;
  };

  const uploadProductImage = (blob: Blob, originalName: string) => new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const data = new FormData();
    data.append("file", blob, originalName.replace(/\.[^.]+$/, "") + (blob.type === "image/webp" ? ".webp" : ".jpg"));
    if (editing) data.append("productId", editing.id);

    request.open("POST", "/api/admin/product-image");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.min(99, 5 + Math.round((event.loaded / event.total) * 90)));
      }
    });
    request.addEventListener("load", () => {
      let response: { imageUrl?: string; error?: string };
      try {
        response = JSON.parse(request.responseText) as { imageUrl?: string; error?: string };
      } catch {
        reject(new Error("Server memberikan respons upload yang tidak valid."));
        return;
      }
      if (request.status < 200 || request.status >= 300 || !response.imageUrl) {
        reject(new Error(response.error ?? "Foto gagal diunggah."));
        return;
      }
      resolve(response.imageUrl);
    });
    request.addEventListener("error", () => reject(new Error("Koneksi terputus saat mengunggah foto. Coba lagi.")));
    request.addEventListener("abort", () => reject(new Error("Unggahan foto dibatalkan.")));
    request.send(data);
  });

  const handleImageSelected = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format foto harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
      setError("Ukuran foto maksimal 5 MB.");
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);
    setUploadStage("Mengompres foto…");
    try {
      const compressed = await compressImage(file);
      setUploadStage("Mengunggah foto…");
      const uploadedUrl = await uploadProductImage(compressed, file.name);
      pendingImageUrls.current.add(uploadedUrl);

      const previousImage = form.image;
      if (previousImage && pendingImageUrls.current.has(previousImage) && previousImage !== uploadedUrl) {
        try {
          await deleteUploadedImage(previousImage);
        } catch (cleanupError) {
          setError(cleanupError instanceof Error
            ? `Foto baru sudah diunggah, tetapi foto sementara sebelumnya gagal dihapus: ${cleanupError.message}`
            : "Foto sementara sebelumnya gagal dihapus dari penyimpanan.");
        }
      }
      setForm((current) => ({ ...current, image: uploadedUrl }));
      setImageFileName(file.name);
      setUploadProgress(100);
      setUploadStage("");
    } catch (uploadError) {
      setError(uploadError instanceof Error
        ? uploadError.message
        : "Foto gagal diproses atau diunggah. Coba lagi.");
      setUploadStage("");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProductImage = async () => {
    if (uploadingImage) return;
    setError(null);
    if (form.image && pendingImageUrls.current.has(form.image)) {
      try {
        await deleteUploadedImage(form.image);
      } catch (cleanupError) {
        setError(cleanupError instanceof Error ? cleanupError.message : "Foto gagal dihapus dari penyimpanan.");
        return;
      }
    }
    setForm((current) => ({ ...current, image: "" }));
    setImageFileName("");
  };

  const closeForm = async () => {
    if (saving || uploadingImage) return;
    try {
      for (const imageUrl of pendingImageUrls.current) {
        await deleteUploadedImage(imageUrl);
      }
      setShowForm(false);
    } catch (cleanupError) {
      setError(cleanupError instanceof Error
        ? `Foto unggahan yang belum disimpan gagal dibersihkan: ${cleanupError.message}`
        : "Foto unggahan yang belum disimpan gagal dibersihkan.");
    }
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
      variants: variants.map((variant) => ({
        ...(variant.id ? { id: variant.id } : {}),
        name: variant.name,
        sku: variant.sku,
        price: variant.price === "" ? null : Number(variant.price),
        stockQuantity: form.type === "READY_STOCK" ? Number(variant.stockQuantity) : null,
      })),
    };
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan.");
        return;
      }
      const savedImageUrl = typeof data.product?.image === "string" ? data.product.image : null;
      if (savedImageUrl) pendingImageUrls.current.delete(savedImageUrl);
      let saveNotice = typeof data.warning === "string" ? data.warning : null;
      for (const imageUrl of [...pendingImageUrls.current]) {
        try {
          await deleteUploadedImage(imageUrl);
        } catch (cleanupError) {
          saveNotice = cleanupError instanceof Error
            ? `Produk tersimpan, tetapi foto unggahan sementara gagal dibersihkan: ${cleanupError.message}`
            : "Produk tersimpan, tetapi foto unggahan sementara gagal dibersihkan.";
        }
      }
      setNotice(saveNotice);
      setShowForm(false);
      await fetchAll();
    } catch {
      setError("Terjadi kesalahan jaringan. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
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
      {notice && <div className={styles.errorBox} role="status">{notice}</div>}

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Foto</th>
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
                <tr className={styles.emptyRow}><td colSpan={8}>Belum ada produk</td></tr>
              )}
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <img
                      className={styles.productImageThumb}
                      src={p.image ?? "/product-placeholder.svg"}
                      alt={p.image ? p.name : "HME FPTI UPI - Foto produk segera hadir"}
                    />
                  </td>
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
                    {p.type === "READY_STOCK"
                      ? `${p.variants.length > 0
                          ? p.variants.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0)
                          : p.stockQuantity ?? 0} pcs`
                      : `Target: ${p.targetMinimum ?? 0}`}
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
        <div className={styles.overlay} onClick={closeForm}>
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
              {form.type === "PRE_ORDER" && (
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <label className={styles.formLabel}>Varian dan pilihan pembeli</label>
                    <p style={{ color: "var(--gray-500)", fontSize: "0.8rem", margin: "4px 0 0" }}>
                      Buat satu pilihan per ukuran, misalnya Ukuran S hingga XXL. Model yang sama untuk semua ukuran tidak perlu ditambahkan.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.btnIcon}
                    onClick={() => setVariants((current) => [...current, { ...newVariant(), name: "" }])}
                  >
                    + Tambah varian
                  </button>
                </div>
                {variants.map((variant, index) => (
                  <div key={variant.id ?? `new-${index}`} className={styles.tableCard} style={{ padding: 14, marginTop: 12 }}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nama pilihan</label>
                        <input
                          className={styles.formInput}
                          value={variant.name}
                          onChange={(event) => handleVariantChange(index, "name", event.target.value)}
                          placeholder="Ukuran M · Model Oversize"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>SKU (opsional)</label>
                        <input
                          className={styles.formInput}
                          value={variant.sku}
                          onChange={(event) => handleVariantChange(index, "sku", event.target.value)}
                          placeholder="Kosongkan jika tidak dipakai"
                        />
                      </div>
                    </div>
                    <div className={styles.formRow} style={{ marginTop: 12 }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Harga khusus (kosong = harga produk)</label>
                        <input
                          className={styles.formInput}
                          type="number"
                          min="0"
                          step="1"
                          value={variant.price}
                          onChange={(event) => handleVariantChange(index, "price", event.target.value)}
                          placeholder={form.price || "Ikuti harga produk"}
                        />
                      </div>
                      {form.type === "READY_STOCK" && (
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Stok varian</label>
                          <input
                            className={styles.formInput}
                            type="number"
                            min="0"
                            step="1"
                            value={variant.stockQuantity}
                            onChange={(event) => handleVariantChange(index, "stockQuantity", event.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        className={styles.btnDanger}
                        style={{ marginTop: 12 }}
                        onClick={() => setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index))}
                      >
                        Hapus varian
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Foto Produk (opsional)</label>
                <input
                  ref={imageInputRef}
                  className={styles.imageFileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Pilih foto produk"
                  disabled={uploadingImage || saving}
                  onChange={(event) => {
                    void handleImageSelected(event.currentTarget.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                {form.image ? (
                  <div
                    className={styles.imagePreviewCard}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleImageSelected(event.dataTransfer.files[0]);
                    }}
                  >
                    <img className={styles.imagePreview} src={form.image} alt={`Pratinjau ${form.name || "foto produk"}`} />
                    <div className={styles.imagePreviewDetails}>
                      <span className={styles.imageFileName}>{imageFileName || "Foto tersimpan"}</span>
                      <div className={styles.imageActions}>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          disabled={uploadingImage || saving}
                          onClick={() => imageInputRef.current?.click()}
                        >
                          Ganti
                        </button>
                        <button
                          type="button"
                          className={styles.btnDanger}
                          disabled={uploadingImage || saving}
                          onClick={removeProductImage}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.imageDropzone}
                    disabled={uploadingImage || saving}
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleImageSelected(event.dataTransfer.files[0]);
                    }}
                  >
                    <span className={styles.imageDropzoneIcon} aria-hidden="true">＋</span>
                    <span>Pilih foto</span>
                    <span className={styles.imageHint}>JPG, PNG, atau WebP · Maks. 5 MB</span>
                  </button>
                )}
                {uploadingImage && (
                  <div className={styles.imageProgress} role="status" aria-live="polite">
                    <span>{uploadStage} {uploadProgress > 0 ? `${uploadProgress}%` : ""}</span>
                    <progress max="100" value={uploadProgress} />
                  </div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hubungkan ke Open Order</label>
                <select className={styles.formSelect} value={form.openOrderId} onChange={handleChange("openOrderId")}>
                  <option value="">— Tidak ada —</option>
                  {openOrders.map(oo => <option key={oo.id} value={oo.id}>{oo.name} ({oo.status})</option>)}
                </select>
              </div>
              {error && <div className={styles.errorBox} role="alert">{error}</div>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={save} disabled={saving || uploadingImage}>
                {uploadingImage ? "Mengunggah foto…" : saving ? "Menyimpan…" : "Simpan Produk"}
              </button>
              <button className={styles.btnSecondary} onClick={closeForm} disabled={saving || uploadingImage}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
