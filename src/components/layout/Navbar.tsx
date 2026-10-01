"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart-store';
import styles from './Navbar.module.css';
import { Badge } from '../ui/Badge';

export const Navbar = ({ cartCount }: { cartCount?: number }) => {
  const cart = useCart();
  const visibleCartCount = cartCount ?? cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <Image src="/logo-hme-mark.png" alt="HME FPTI UPI" width={48} height={50} className={styles.logo} />
          <div className={styles.brandText}>
            <span className={styles.title}>E-STORE</span>
            <span className={styles.subtitle}>HME FPTI UPI</span>
          </div>
        </Link>
        <nav className={styles.navLinks}>
          <Link href="/">Home</Link>
          <Link href="/products">Produk</Link>
          <Link href="/order-tracking">Tracking</Link>
        </nav>
        <div className={styles.actions}>
          <Link href="/cart" className={styles.cartBtn}>
            🛒 Keranjang {visibleCartCount > 0 && <Badge variant="success">{visibleCartCount}</Badge>}
          </Link>
          <Link href="/admin/login" className={styles.adminBtn}>Admin</Link>
        </div>
      </div>
      <div className={styles.mobileNav}>
        <Link href="/">Home</Link>
        <Link href="/products">Produk</Link>
        <Link href="/cart">Keranjang {visibleCartCount > 0 && <span>({visibleCartCount})</span>}</Link>
        <Link href="/order-tracking">Track</Link>
        <Link href="/admin/login">Admin</Link>
      </div>
    </header>
  );
};