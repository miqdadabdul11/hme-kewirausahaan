"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCartItemKey, saveCart, useCart } from "@/lib/cart-store";
import styles from "./cart.module.css";

export default function CartPage() {
  const items = useCart();

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const updateQuantity = (itemKey: string, delta: number) => {
    const next = items
      .map((item) =>
        getCartItemKey(item) === itemKey
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item,
      )
      .filter((item) => item.quantity > 0);

    saveCart(next);
  };

  const removeItem = (itemKey: string) => {
    const next = items.filter((item) => getCartItemKey(item) !== itemKey);
    saveCart(next);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Navbar cartCount={totalItems} />
      <main className="page-shell compact">
        <div className={styles.header}>
          <h1 className="heading">Keranjang Belanja</h1>
          <p>Selesaikan pesanan Anda sebelum sesi Open Order berakhir.</p>
        </div>

        <section className={styles.layout}>
          <div className={styles.mainCol}>
            <Card>
              <h2 className={styles.cardTitle}>Daftar Produk</h2>
              {items.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Keranjang Anda masih kosong.</p>
                  <Link href="/products">
                    <Button variant="secondary" style={{ marginTop: '16px' }}>Lihat Produk</Button>
                  </Link>
                </div>
              ) : (
                <div className={styles.itemList}>
                  {items.map((item) => (
                    <div className={styles.cartItem} key={getCartItemKey(item)}>
                      <div className={styles.itemInfo}>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        {item.variantName && <span>{item.variantName}</span>}
                        <span className={styles.itemPrice}>Rp {item.price.toLocaleString("id-ID")}</span>
                      </div>
                      
                      <div className={styles.itemActions}>
                        <div className={styles.stepper}>
                          <button className={styles.stepBtn} onClick={() => updateQuantity(getCartItemKey(item), -1)}>-</button>
                          <span className={styles.qty}>{item.quantity}</span>
                          <button className={styles.stepBtn} onClick={() => updateQuantity(getCartItemKey(item), 1)}>+</button>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => removeItem(getCartItemKey(item))}>
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <aside className={styles.sidebar}>
            <Card className={styles.summaryCard}>
              <h3 className={styles.cardTitle}>Ringkasan</h3>
              <div className={styles.summaryRow}>
                <span>Total Item</span>
                <span>{totalItems}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total Pembayaran</span>
                <span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
              
              <div className={styles.actions}>
                <Link href={items.length > 0 ? "/checkout" : "#"}>
                  <Button size="lg" disabled={items.length === 0} style={{ width: '100%' }}>
                    Lanjut ke Checkout
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="ghost" size="lg" style={{ width: '100%' }}>
                    Lanjut Belanja
                  </Button>
                </Link>
              </div>
            </Card>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}
