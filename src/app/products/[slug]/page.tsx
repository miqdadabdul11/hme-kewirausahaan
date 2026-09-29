import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getProductProgress, getStoreStatus } from "@/lib/catalog";

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

  return (
    <main className="page-shell compact">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">HME</span>
          <div>
            <strong>{product.name}</strong>
            <small>{product.type}</small>
          </div>
        </div>
        <nav className="main-nav">
          <Link href="/">Home</Link>
          <Link href="/products">Produk</Link>
          <Link href="/order-tracking">Tracking</Link>
        </nav>
      </header>

      <section className="detail-layout">
        <div className="detail-image" style={{ backgroundImage: `url(${product.image ?? "/images/default-product.jpg"})` }} />
        <div className="detail-content">
          <span className="product-type">{product.type}</span>
          <h1>{product.name}</h1>
          <p className="price-highlight">{formatCurrency(product.price)}</p>
          <p>{product.description}</p>

          {product.type === "READY_STOCK" ? (
            <div className="info-box">
              <strong>Stock tersedia:</strong> {product.stockQuantity ?? 0} pcs
            </div>
          ) : progress ? (
            <div className="info-box">
              <strong>Target Pesanan:</strong> {progress.current} / {progress.target} pcs
              <div className="progress-bar large">
                <span style={{ width: `${Math.min((progress.current / Math.max(progress.target, 1)) * 100, 100)}%` }} />
              </div>
              <small>
                {progress.remainingTarget > 0
                  ? `${progress.remainingTarget} pesanan lagi untuk mencapai target minimum.`
                  : "Target minimum telah tercapai."}
              </small>
            </div>
          ) : null}

          <div className="info-box">
            <strong>Periode:</strong> {openOrder ? openOrder.name : "Belum ditentukan"}
          </div>

          <div className="button-row">
            <Link href={`/checkout?productId=${product.id}`} className="button primary">Add to Cart</Link>
            <Link href="/products" className="button secondary">Kembali</Link>
          </div>

          {storeStatus !== "OPEN" && <p className="error-text">Open Order belum dibuka. Pembelian belum dapat dilakukan.</p>}
        </div>
      </section>
    </main>
  );
}
