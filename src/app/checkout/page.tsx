"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import styles from "./checkout.module.css";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [items] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = window.localStorage.getItem("hme-cart");
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
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

    try {
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
      router.push(`/order-tracking?orderNumber=${encodeURIComponent(result.order.orderNumber)}`);
    } catch {
      setLoading(false);
      setMessage("Terjadi kesalahan sistem. Silakan coba lagi.");
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <>
        <Navbar cartCount={0} />
        <main className="page-shell compact">
          <Card className={styles.emptyState}>
            <h2 className="heading">Keranjang masih kosong</h2>
            <p>Silakan pilih produk terlebih dahulu sebelum melanjutkan ke checkout.</p>
            <Link href="/products">
              <Button style={{ marginTop: '16px' }}>Lihat Katalog</Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar cartCount={totalItems} />
      <main className="page-shell compact">
        <div className={styles.header}>
          <h1 className="heading">Checkout Pesanan</h1>
          <p>Lengkapi data diri Anda untuk menyelesaikan pemesanan.</p>
        </div>

        <form className={styles.layout} onSubmit={submit}>
          <div className={styles.mainCol}>
            <Card>
              <h2 className={styles.cardTitle}>Data Pemesan</h2>
              <div className={styles.formGrid}>
                <Input 
                  label="Nama Lengkap" 
                  value={form.customerName} 
                  onChange={handleInputChange('customerName')} 
                  required 
                  placeholder="Masukkan nama lengkap Anda"
                />
                
                <div className={styles.twoCol}>
                  <Input 
                    label="NIM" 
                    value={form.nim} 
                    onChange={handleInputChange('nim')} 
                    required 
                    placeholder="Contoh: 13220000"
                  />
                  <Input 
                    label="Program Studi" 
                    value={form.studyProgram} 
                    onChange={handleInputChange('studyProgram')} 
                    required 
                    placeholder="Teknik Elektro"
                  />
                </div>
                
                <div className={styles.twoCol}>
                  <Input 
                    label="Nomor WhatsApp" 
                    type="tel"
                    value={form.whatsapp} 
                    onChange={handleInputChange('whatsapp')} 
                    required 
                    placeholder="08123456789"
                  />
                  <Input 
                    label="Email (opsional)" 
                    type="email"
                    value={form.email} 
                    onChange={handleInputChange('email')} 
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Catatan Tambahan (Opsional)</label>
                  <textarea 
                    className={styles.textarea}
                    value={form.notes} 
                    onChange={handleInputChange('notes')} 
                    placeholder="Ukuran, warna khusus, atau instruksi lain"
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Metode Pembayaran</label>
                  <select 
                    className={styles.select}
                    value={form.paymentMethod} 
                    onChange={handleInputChange('paymentMethod')}
                  >
                    <option value="Transfer">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Cash">Cash (Bayar Langsung)</option>
                  </select>
                </div>
              </div>
              
              {message && <div className={styles.errorMessage}>{message}</div>}
            </Card>
          </div>

          <aside className={styles.sidebar}>
            <Card className={styles.summaryCard}>
              <h3 className={styles.cardTitle}>Ringkasan Pesanan</h3>
              
              <div className={styles.itemList}>
                {items.map((item) => (
                  <div key={item.productId} className={styles.cartItem}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemQty}>Qty: {item.quantity}</span>
                    </div>
                    <span className={styles.itemPrice}>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
              
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total Pembayaran</span>
                <span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
              
              <div className={styles.actions}>
                <Button 
                  type="submit" 
                  size="lg" 
                  isLoading={loading}
                  style={{ width: '100%' }}
                >
                  Konfirmasi Pesanan
                </Button>
                <Link href="/cart" style={{ width: '100%' }}>
                  <Button variant="ghost" size="lg" style={{ width: '100%' }} disabled={loading}>
                    Kembali ke Keranjang
                  </Button>
                </Link>
              </div>
            </Card>
          </aside>
        </form>
      </main>
      <Footer />
    </>
  );
}
