import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getProductProgress, getStoreStatus } from "@/lib/catalog";

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
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">HME</span>
          <div>
            <strong>Sub Kewirausahaan</strong>
            <small>Himpunan Mahasiswa Elektro</small>
          </div>
        </div>
        <nav className="main-nav">
          <Link href="/">Home</Link>
          <Link href="/products">Produk</Link>
          <Link href="/order-tracking">Tracking</Link>
          <Link href="/admin/login">Admin</Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">HME Kewirausahaan</p>
          <h1>{storeStatus === "OPEN" ? "OPEN ORDER SEKARANG" : "Saat Ini Belum Ada Open Order"}</h1>
          <p>
            {storeStatus === "OPEN"
              ? "Produk HME tersedia untuk pemesanan. Lihat katalog dan lakukan checkout dengan mudah."
              : "Pantau terus website HME Kewirausahaan untuk informasi Open Order berikutnya."}
          </p>
          <div className="hero-actions">
            <Link href="/products" className="button primary">Lihat Produk</Link>
            <Link href="/order-tracking" className="button secondary">Tracking Pesanan</Link>
          </div>
        </div>
        <div className="status-card">
          <span className={`status-badge ${storeStatus.toLowerCase()}`}>{storeStatus}</span>
          <ul>
            <li>Catalog produk siap dibeli</li>
            <li>Checkout tanpa login</li>
            <li>Order ID untuk tracking</li>
          </ul>
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <h2>Produk Aktif</h2>
          <Link href="/products">Lihat semua</Link>
        </div>
        <div className="product-grid">
          {visibleProducts.map((product) => {
            const statusInfo = product.type === "PRE_ORDER" ? getProductProgress(product) : null;

            return (
              <article className="product-card" key={product.id}>
                <div className="product-image" style={{ backgroundImage: `url(${product.image ?? "/images/default-product.jpg"})` }} />
                <div className="product-body">
                  <span className="product-type">{product.type}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="price-row">
                    <strong>{formatCurrency(product.price)}</strong>
                    {product.type === "READY_STOCK" && <span>{product.stockQuantity} tersisa</span>}
                  </div>
                  {product.type === "PRE_ORDER" && statusInfo && (
                    <div className="mini-progress">
                      <div className="progress-bar">
                        <span style={{ width: `${Math.min((statusInfo.current / Math.max(statusInfo.target, 1)) * 100, 100)}%` }} />
                      </div>
                      <small>
                        {statusInfo.current} / {statusInfo.target} pesanan
                      </small>
                    </div>
                  )}
                  <Link href={`/products/${product.slug}`} className="button secondary small">Lihat Detail</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
