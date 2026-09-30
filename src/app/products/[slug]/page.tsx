import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getProductProgress, getStoreStatus } from "@/lib/catalog";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import styles from "./product-detail.module.css";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, openOrders] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        orderItems: {
          where: { order: { is: { orderStatus: { not: "CANCELLED" } } } },
          select: { quantity: true },
        },
        openOrderProducts: { include: { openOrder: true } },
      },
    }),
    prisma.openOrder.findMany({ orderBy: { startAt: "asc" }, select: { id: true, name: true, status: true } }),
  ]);

  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  const progress = product.type === "PRE_ORDER" ? getProductProgress(product) : null;
  const linkedOpenOrders = product.openOrderProducts.map((entry) => entry.openOrder);
  const openOrder = linkedOpenOrders.find((entry) => entry.status === "OPEN") ?? linkedOpenOrders[0] ?? openOrders.find((entry) => entry.status === "OPEN");
  const storeStatus = getStoreStatus(openOrders);
  const isSoldOut = product.type === "READY_STOCK" && (product.stockQuantity ?? 0) <= 0;

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <section className={styles.layout}>
          <div 
            className={styles.imageContainer} 
            style={{ backgroundImage: `url(${product.image ?? "/images/default-product.jpg"})` }}
          >
            {isSoldOut && <div className={styles.soldOutBadge}>SOLD OUT</div>}
          </div>

          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.type}>
                <Badge variant="neutral">{product.type === "READY_STOCK" ? "READY STOCK" : "PRE-ORDER"}</Badge>
              </div>
              <h1 className={styles.title}>{product.name}</h1>
              <p className={styles.price}>{formatCurrency(product.price)}</p>
            </div>

            <p className={styles.desc}>{product.description}</p>

            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Periode Open Order</span>
                <span className={styles.infoValue}>{openOrder ? openOrder.name : "Belum ditentukan"}</span>
              </div>
              
              {product.type === "READY_STOCK" ? (
                <div className={styles.infoRow} style={{ marginTop: '12px' }}>
                  <span className={styles.infoLabel}>Stok Tersedia</span>
                  <span className={styles.infoValue}>
                    {product.stockQuantity ?? 0} pcs
                  </span>
                </div>
              ) : progress ? (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Target Pesanan</span>
                    <span className={styles.infoValue}>{progress.current} / {progress.target} pcs</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${Math.min((progress.current / Math.max(progress.target, 1)) * 100, 100)}%` }} 
                    />
                  </div>
                  <div className={styles.progressText}>
                    {progress.remainingTarget > 0
                      ? `${progress.remainingTarget} pesanan lagi menuju target.`
                      : "Target minimum telah tercapai!"}
                  </div>
                </div>
              ) : null}
            </div>

            {storeStatus !== "OPEN" ? (
              <div className={styles.errorBox}>
                Penjualan sedang tidak aktif. Pantau terus info Open Order berikutnya.
              </div>
            ) : isSoldOut ? (
              <div className={styles.errorBox}>
                Maaf, stok produk ini telah habis.
              </div>
            ) : (
              <div className={styles.actions}>
                <Link href={`/checkout?productId=${product.id}`} style={{ flex: 1 }}>
                  <Button size="lg" style={{ width: '100%' }}>Beli Sekarang</Button>
                </Link>
                <Link href="/products" style={{ flex: 1 }}>
                  <Button variant="ghost" size="lg" style={{ width: '100%' }}>Kembali</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
