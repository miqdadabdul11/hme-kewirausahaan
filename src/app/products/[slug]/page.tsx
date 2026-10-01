import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTimeIndonesia, getProductProgress, getStoreStatus } from "@/lib/catalog";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AddToCart } from "@/components/products/AddToCart";
import styles from "./product-detail.module.css";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, openOrders] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          orderBy: { name: "asc" },
        },
        orderItems: {
          where: { order: { is: { orderStatus: { not: "CANCELLED" } } } },
          select: { quantity: true },
        },
        openOrderProducts: { include: { openOrder: true } },
      },
    }),
    prisma.openOrder.findMany({ orderBy: { startAt: "asc" }, select: { id: true, name: true, status: true, endAt: true } }),
  ]);

  if (!product || !["ACTIVE", "COMING_SOON"].includes(product.status)) {
    notFound();
  }

  const isComingSoon = product.status === "COMING_SOON";
  const progress = product.type === "PRE_ORDER" ? getProductProgress(product) : null;
  const linkedOpenOrders = product.openOrderProducts.map((entry) => entry.openOrder);
  const openOrder = linkedOpenOrders.find((entry) => entry.status === "OPEN") ?? linkedOpenOrders[0] ?? openOrders.find((entry) => entry.status === "OPEN");
  const storeStatus = getStoreStatus(openOrders);
  const hasVariants = product.variants.length > 0;
  const availableStock = hasVariants
    ? product.variants.filter((variant) => variant.status === "ACTIVE").reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0)
    : product.stockQuantity ?? 0;
  const isSoldOut = product.type === "READY_STOCK" && availableStock <= 0;

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <section className={styles.layout}>
          <div 
            className={styles.imageContainer} 
          >
            <img
              className={styles.productImageContent}
              src={product.image ?? "/product-placeholder.svg"}
              alt={product.image ? product.name : "HME FPTI UPI - Foto produk segera hadir"}
            />
            {isSoldOut && <div className={styles.soldOutBadge}>SOLD OUT</div>}
          </div>

          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.type}>
                <Badge variant={isComingSoon ? "warning" : "neutral"}>
                  {isComingSoon ? "SEGERA HADIR" : product.type === "READY_STOCK" ? "READY STOCK" : "PRE-ORDER"}
                </Badge>
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
              {openOrder && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Batas Pre-Order</span>
                  <span className={styles.infoValue}>{formatDateTimeIndonesia(openOrder.endAt)} WIB</span>
                </div>
              )}
              
              {product.type === "READY_STOCK" ? (
                <div className={styles.infoRow} style={{ marginTop: '12px' }}>
                  <span className={styles.infoLabel}>Stok Tersedia</span>
                  <span className={styles.infoValue}>
                    {availableStock} pcs
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

            {isComingSoon ? (
              <div className={styles.comingSoonMessage}>
                Produk ini belum tersedia untuk dipesan. Pantau halaman ini untuk kabar selanjutnya.
              </div>
            ) : storeStatus !== "OPEN" ? (
              <div className={styles.errorBox}>
                Penjualan sedang tidak aktif. Pantau terus info Open Order berikutnya.
              </div>
            ) : isSoldOut ? (
              <div className={styles.errorBox}>
                Maaf, stok produk ini telah habis.
              </div>
            ) : (
              <div className={styles.actions}>
                <AddToCart productId={product.id} name={product.name} price={product.price} type={product.type} variants={product.variants} />
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
