"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import styles from "./tracking.module.css";

type OrderItem = {
  productName: string;
  quantity: number;
};

type OrderResult = {
  orderNumber: string;
  customerName: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number | string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [whatsappLast4, setWhatsappLast4] = useState("");
  const [result, setResult] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    if (!orderNumber || !whatsappLast4) {
      setError("Silakan lengkapi Order ID dan 4 digit WhatsApp.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/orders?orderNumber=${encodeURIComponent(orderNumber)}&whatsappLast4=${encodeURIComponent(whatsappLast4)}`,
      );
      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error || "Pesanan tidak ditemukan. Periksa kembali Order ID Anda.");
        setResult(null);
        return;
      }

      setResult(data.order);
    } catch (err) {
      setLoading(false);
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    }
  };

  const lastUpdated = useMemo(
    () => (result ? new Date(result.updatedAt).toLocaleString("id-ID") : "-"),
    [result],
  );

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'PENDING') return 'warning';
    if (status === 'READY' || status === 'COMPLETED' || status === 'PAID') return 'success';
    if (status === 'CANCELLED') return 'error';
    return 'neutral';
  };

  return (
    <>
      <Navbar />
      <main className="page-shell compact">
        <div className={styles.header}>
          <h1 className="heading">Lacak Pesanan Anda</h1>
          <p>Masukkan Order ID dan 4 digit terakhir nomor WhatsApp yang Anda gunakan saat checkout.</p>
        </div>

        <Card className={styles.formCard}>
          <div className={styles.twoCol}>
            <Input 
              label="Order ID" 
              value={orderNumber} 
              onChange={(e) => setOrderNumber(e.target.value)} 
              placeholder="Contoh: HME-0001" 
            />
            <Input 
              label="4 digit terakhir WhatsApp" 
              value={whatsappLast4} 
              onChange={(e) => setWhatsappLast4(e.target.value)} 
              maxLength={4} 
              placeholder="Contoh: 1234" 
            />
          </div>
          <Button 
            size="lg" 
            style={{ width: '100%' }} 
            onClick={lookup} 
            isLoading={loading}
          >
            Cari Pesanan
          </Button>
          {error && <div className={styles.errorText}>{error}</div>}
        </Card>

        {result && (
          <section className={styles.resultSection}>
            <Card>
              <h2 className="heading" style={{ margin: 0, paddingBottom: '16px', borderBottom: '1px solid var(--gray-100)' }}>
                Hasil Pencarian: {result.orderNumber}
              </h2>
              
              <div className={styles.infoGrid}>
                <div className={styles.infoBlock}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Nama Pemesan</span>
                    <span className={styles.infoValue}>{result.customerName}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Produk yang Dipesan</span>
                    <span className={styles.infoValue}>
                      {result.items.map((item) => `${item.productName} (${item.quantity}x)`).join(", ")}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Total Tagihan</span>
                    <span className={styles.infoValue} style={{ color: 'var(--green-500)', fontSize: '1.25rem' }}>
                      Rp {Number(result.totalAmount).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className={styles.infoBlock}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Status Pesanan</span>
                    <div style={{ marginTop: '4px' }}>
                      <Badge variant={getStatusBadgeVariant(result.orderStatus)}>{result.orderStatus}</Badge>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Status Pembayaran</span>
                    <div style={{ marginTop: '4px' }}>
                      <Badge variant={getStatusBadgeVariant(result.paymentStatus)}>{result.paymentStatus}</Badge>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Waktu Pemesanan</span>
                    <span className={styles.infoValue} style={{ fontWeight: 'normal' }}>
                      {new Date(result.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.timeline}>
                <div className={styles.timelineTitle}>Update Terakhir</div>
                <div style={{ color: 'var(--gray-500)' }}>
                  Data pesanan ini terakhir kali diperbarui pada: <strong>{lastUpdated}</strong>
                </div>
              </div>
            </Card>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
