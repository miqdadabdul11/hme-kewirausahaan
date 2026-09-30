import fs from 'fs';
import path from 'path';

const uiDir = path.join(process.cwd(), 'src/components/layout');
if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

const components = {
  'Navbar.tsx': `
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
`,
  'Navbar.module.css': `
.navbar {
  background: var(--black-900);
  color: var(--white);
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--black-700);
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--white);
  padding: 4px;
}
.brandText {
  display: flex;
  flex-direction: column;
}
.title {
  font-family: var(--font-space);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--green-500);
}
.subtitle {
  font-size: 0.75rem;
  color: var(--gray-100);
  opacity: 0.8;
}
.navLinks {
  display: flex;
  gap: 24px;
}
.navLinks a {
  font-weight: 600;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.navLinks a:hover {
  color: var(--green-400);
}
.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.cartBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  background: var(--black-700);
  padding: 8px 16px;
  border-radius: 8px;
}
.cartBtn:hover {
  background: #2a342c;
}
.adminBtn {
  font-size: 0.875rem;
  opacity: 0.7;
}
.mobileNav {
  display: none;
  background: var(--black-900);
  padding: 12px 20px;
  border-top: 1px solid var(--black-700);
  justify-content: space-around;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}
.mobileNav a {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-100);
}
@media (max-width: 768px) {
  .navLinks, .actions { display: none; }
  .mobileNav { display: flex; }
  .container { padding: 12px 16px; }
}
`,
  'Footer.tsx': `
import React from 'react';

export const Footer = () => (
  <footer style={{ background: 'var(--black-900)', color: 'var(--gray-500)', padding: '40px 20px', textAlign: 'center', marginTop: '60px' }}>
    <p style={{ fontFamily: 'var(--font-space)', fontWeight: 700, color: 'var(--white)', marginBottom: '8px' }}>HME Kewirausahaan</p>
    <p style={{ fontSize: '0.875rem' }}>© {new Date().getFullYear()} Himpunan Mahasiswa Elektro. All rights reserved.</p>
  </footer>
);
`
};

for (const [filename, content] of Object.entries(components)) {
  fs.writeFileSync(path.join(uiDir, filename), content.trim());
}

console.log('Layout Components scaffolded!');
