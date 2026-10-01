"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./AdminSidebar.module.css";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Pesanan", icon: "📦" },
  { href: "/admin/products", label: "Produk", icon: "🛍️" },
  { href: "/admin/open-orders", label: "Open Orders", icon: "🗓️" },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <Image src="/logo-hme-mark.png" alt="HME FPTI UPI" width={44} height={46} className={styles.logo} />
        <div className={styles.brand}>
          <span className={styles.title}>Admin Panel</span>
          <span className={styles.subtitle}>Kewirausahaan HME</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.link} ${isActive(link.href) ? styles.linkActive : ""}`}
          >
            <span className={styles.linkIcon}>{link.icon}</span>
            {link.label}
          </Link>
        ))}
        <div className={styles.divider} />
        <Link href="/" className={styles.link}>
          <span className={styles.linkIcon}>🌐</span>
          Lihat Website
        </Link>
      </nav>

      <div className={styles.footer}>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" className={styles.logoutBtn}>
            Keluar (Logout)
          </button>
        </form>
      </div>
    </aside>
  );
};
