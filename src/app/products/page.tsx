import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getProductProgress } from "@/lib/catalog";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import styles from "./products.module.css";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      variants: {
        where: { status: "ACTIVE" },
        select: { stockQuantity: true },
      },
      orderItems: {
        where: { order: { is: { orderStatus: { not: "CANCELLED" } } } },
        select: { quantity: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className={styles.header}>
          <div>
            <h1 className="heading">Semua Produk</h1>
            <p>Jelajahi seluruh koleksi merchandise resmi HME FPTI UPI.</p>
          </div>
          <Link href="/cart">
            <Button variant="secondary">Lihat Keranjang</Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <Card className={styles.emptyState}>
            <h2 className="heading">Katalog kosong</h2>
            <p>Belum ada produk yang tersedia saat ini.</p>
          </Card>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => {
              const statusInfo = product.type === "PRE_ORDER" ? getProductProgress(product) : null;
              const stockQuantity = product.variants.length > 0
                ? product.variants.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0)
                : product.stockQuantity ?? 0;
              const isSoldOut = product.type === "READY_STOCK" && stockQuantity <= 0;

              return (
                <Card key={product.id} className={styles.productCard}>
                  <div 
                    className={styles.productImage} 
                    style={{ backgroundImage: `url(${product.image ?? "/product-placeholder.svg"})` }}
                  >
                    {isSoldOut && <span className={styles.soldOutBadge}>SOLD OUT</span>}
                  </div>
                  
                  <div className={styles.productBody}>
                    <Badge variant="neutral">{product.type === "READY_STOCK" ? "READY STOCK" : "PRE-ORDER"}</Badge>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <div className={styles.priceRow}>
                      <span className={styles.price}>{formatCurrency(product.price)}</span>
                      {product.type === "READY_STOCK" && !isSoldOut && (
                        <span className={styles.stockText}>Sisa {stockQuantity}</span>
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
      </main>
      <Footer />
    </>
  );
}
