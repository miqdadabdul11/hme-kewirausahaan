import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getProductProgress } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      orderItems: {
        where: { order: { is: { orderStatus: { not: "CANCELLED" } } } },
        select: { quantity: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page-shell compact">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">HME</span>
          <div>
            <strong>Produk</strong>
            <small>Katalog HME</small>
          </div>
        </div>
        <nav className="main-nav">
          <Link href="/">Home</Link>
          <Link href="/products">Produk</Link>
          <Link href="/order-tracking">Tracking</Link>
          <Link href="/admin/login">Admin</Link>
        </nav>
      </header>

      <section className="section-block">
        <div className="section-head">
          <h2>Semua Produk</h2>
          <Link href="/cart" className="button secondary small">Keranjang</Link>
        </div>

        <div className="product-grid list">
          {products.map((product) => {
            const progress = product.type === "PRE_ORDER" ? getProductProgress(product) : null;

            return (
              <article className="product-card variant" key={product.id}>
                <div className="product-image small" style={{ backgroundImage: `url(${product.image ?? "/images/default-product.jpg"})` }} />
                <div className="product-body">
                  <span className="product-type">{product.type}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="price-row">
                    <strong>{formatCurrency(product.price)}</strong>
                    {product.type === "READY_STOCK" ? <span>{product.stockQuantity} stok</span> : <span>{progress?.current ?? 0} / {product.targetMinimum} target</span>}
                  </div>
                  <Link href={`/products/${product.slug}`} className="button primary small">Detail Produk</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
