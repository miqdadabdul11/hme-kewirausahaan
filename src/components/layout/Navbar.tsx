import React from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { Badge } from '../ui/Badge';

export const Navbar = ({ cartCount = 0 }) => {
  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <img src="/logo-hme.png" alt="HME" className={styles.logo} />
          <div className={styles.brandText}>
            <span className={styles.title}>Sub Kewirausahaan</span>
            <span className={styles.subtitle}>HME ITB</span>
          </div>
        </Link>
        <nav className={styles.navLinks}>
          <Link href="/">Home</Link>
          <Link href="/products">Produk</Link>
          <Link href="/order-tracking">Tracking</Link>
        </nav>
        <div className={styles.actions}>
          <Link href="/cart" className={styles.cartBtn}>
            🛒 Cart {cartCount > 0 && <Badge variant="success">{cartCount}</Badge>}
          </Link>
          <Link href="/admin/login" className={styles.adminBtn}>Admin</Link>
        </div>
      </div>
      <div className={styles.mobileNav}>
        <Link href="/">Home</Link>
        <Link href="/products">Produk</Link>
        <Link href="/cart">Cart {cartCount > 0 && <span>({cartCount})</span>}</Link>
        <Link href="/order-tracking">Track</Link>
      </div>
    </header>
  );
};