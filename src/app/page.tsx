import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getProductProgress, getStoreStatus } from "@/lib/catalog";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [openOrders, visibleProducts] = await Promise.all([
    prisma.openOrder.findMany({ select: { status: true } }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        orderItems: {
          where: { order: { is: { orderStatus: { not: "CANCELLED" } } } },
          select: { quantity: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const storeStatus = getStoreStatus(openOrders);

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <Badge variant={storeStatus === "OPEN" ? "success" : storeStatus === "COMING_SOON" ? "warning" : "neutral"}>
              {storeStatus === "OPEN" ? "🟢 TOKO BUKA" : storeStatus === "COMING_SOON" ? "⏳ SEGERA HADIR" : "🔴 SEDANG TUTUP"}
            </Badge>
            <h1 className={styles.heroTitle}>
              {storeStatus === "OPEN" ? "OPEN ORDER SEKARANG" : "Saat Ini Belum Ada Open Order"}
            </h1>
            <p className={styles.heroDesc}>
              {storeStatus === "OPEN"
                ? "Produk merchandise resmi HME ITB telah tersedia. Pesan sekarang sebelum kehabisan!"
                : "Pantau terus website HME Kewirausahaan untuk informasi Open Order berikutnya."}
            </p>
            <div className={styles.heroActions}>
              <Link href="/products">
                <Button size="lg">Jelajahi Katalog</Button>
              </Link>
              <Link href="/order-tracking">
                <Button variant="secondary" size="lg">Tracking Pesanan</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.productSection}>
          <div className={styles.sectionHeader}>
            <h2 className="heading">Katalog Produk</h2>
            <Link href="/products" className={styles.seeAll}>Lihat semua →</Link>
          </div>
          
          {visibleProducts.length === 0 ? (
             <Card className={styles.emptyState}>
               <h3 className="heading">Belum ada produk</h3>
               <p>Katalog produk saat ini kosong. Cek kembali nanti!</p>
             </Card>
          ) : (
            <div className={styles.grid}>
              {visibleProducts.map((product) => {
                const statusInfo = product.type === "PRE_ORDER" ? getProductProgress(product) : null;
                const isSoldOut = product.type === "READY_STOCK" && (product.stockQuantity ?? 0) <= 0;

                return (
                  <Card key={product.id} className={styles.productCard}>
                    <div 
                      className={styles.productImage} 
                      style={{ backgroundImage: `url(${product.image ?? "/images/default-product.jpg"})` }} 
                    >
                      {isSoldOut && <span className={styles.soldOutBadge}>SOLD OUT</span>}
                    </div>
                    
                    <div className={styles.productBody}>
                      <Badge variant="neutral">{product.type === "READY_STOCK" ? "READY STOCK" : "PRE-ORDER"}</Badge>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <div className={styles.priceRow}>
                        <span className={styles.price}>{formatCurrency(product.price)}</span>
                        {product.type === "READY_STOCK" && !isSoldOut && (
                          <span className={styles.stockText}>Sisa {product.stockQuantity}</span>
                        )}
                      </div>

                      {product.type === "PRE_ORDER" && statusInfo && (
                        <div className={styles.progressContainer}>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill} 
                              style={{ width: `${Math.min((statusInfo.current / Math.max(statusInfo.target, 1)) * 100, 100)}%` }} 
                            />
                          </div>
                          <span className={styles.progressText}>
                            {statusInfo.current} / {statusInfo.target} pesanan
                          </span>
                        </div>
                      )}

                      <Link href={`/products/${product.slug}`} style={{ marginTop: 'auto' }}>
                        <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                          Lihat Detail
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
