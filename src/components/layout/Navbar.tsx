"use client";

import React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-store';
import styles from './Navbar.module.css';
import { Badge } from '../ui/Badge';

export const Navbar = ({ cartCount }: { cartCount?: number }) => {
  const cart = useCart();
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const visibleCartCount = cartCount ?? cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuPath(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <Image src="/logo-estore.png" alt="Logo E-STORE HME FPTI UPI" width={60} height={60} className={styles.logo} />
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
        <button
          type="button"
          className={styles.menuToggle}
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen}
          aria-controls="store-mobile-menu"
          onClick={() => setMenuPath(menuOpen ? null : pathname)}
        >
          {menuOpen ? '×' : '☰'}
        </button>
      </div>
      {menuOpen && (
        <>
          <button
            type="button"
            className={styles.mobileMenuBackdrop}
            aria-label="Tutup menu"
            onClick={() => setMenuPath(null)}
          />
          <nav id="store-mobile-menu" className={styles.mobileMenu} aria-label="Navigasi utama">
            <button type="button" className={styles.mobileMenuClose} onClick={() => setMenuPath(null)}>
              <span>Tutup menu</span><span aria-hidden="true">×</span>
            </button>
            <Link href="/" onClick={() => setMenuPath(null)}>Home</Link>
            <Link href="/products" onClick={() => setMenuPath(null)}>Produk</Link>
            <Link href="/cart" onClick={() => setMenuPath(null)}>
              <span>Keranjang</span>
              {visibleCartCount > 0 && <Badge variant="success">{visibleCartCount}</Badge>}
            </Link>
            <Link href="/order-tracking" onClick={() => setMenuPath(null)}>Track</Link>
            <Link href="/admin/login" onClick={() => setMenuPath(null)}>Admin</Link>
          </nav>
        </>
      )}
    </header>
  );
};