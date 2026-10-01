"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./AdminSidebar.module.css";
import layoutStyles from "@/app/admin/admin-layout.module.css";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Pesanan", icon: "📦" },
  { href: "/admin/products", label: "Produk", icon: "🛍️" },
  { href: "/admin/open-orders", label: "Open Orders", icon: "🗓️" },
];

const subscribeToCollapsed = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("hme-admin-sidebar-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("hme-admin-sidebar-change", callback);
  };
};

const getCollapsedSnapshot = () => window.localStorage.getItem("hme-admin-sidebar-collapsed") === "true";
const getCollapsedServerSnapshot = () => false;

export const AdminSidebar = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const collapsed = useSyncExternalStore(
    subscribeToCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerPath(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [drawerOpen]);

  return (
    <div className={`${layoutStyles.container} ${collapsed ? layoutStyles.collapsed : ""}`}>
      <div className={layoutStyles.mobileTopbar}>
        <button
          type="button"
          className={layoutStyles.menuToggle}
          aria-label="Buka menu admin"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerPath(pathname)}
        >
          ☰
        </button>
        <span>Admin E-STORE</span>
      </div>

      {drawerOpen && (
        <button
          type="button"
          className={layoutStyles.drawerOverlay}
          aria-label="Tutup menu admin"
          onClick={() => setDrawerPath(null)}
        />
      )}

      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${drawerOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.header}>
          <Image src="/logo-estore-transparent.png" alt="Logo E-STORE HME FPTI UPI" width={42} height={52} className={styles.logo} />
          <div className={styles.brand}>
            <span className={styles.title} title="Admin E-STORE">Admin E-STORE</span>
          </div>
          <button
            type="button"
            className={styles.collapseBtn}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            aria-pressed={collapsed}
            onClick={() => {
              window.localStorage.setItem("hme-admin-sidebar-collapsed", String(!collapsed));
              window.dispatchEvent(new Event("hme-admin-sidebar-change"));
            }}
          >
            {collapsed ? "»" : "«"}
          </button>
          <button
            type="button"
            className={styles.drawerClose}
            aria-label="Tutup menu admin"
            onClick={() => setDrawerPath(null)}
          >
            ×
          </button>
        </div>

        <nav className={styles.nav}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              aria-label={link.label}
              className={`${styles.link} ${isActive(link.href) ? styles.linkActive : ""}`}
              onClick={() => setDrawerPath(null)}
            >
              <span className={styles.linkIcon}>{link.icon}</span>
              <span className={styles.linkLabel}>{link.label}</span>
            </Link>
          ))}
          <div className={styles.divider} />
          <Link
            href="/"
            title={collapsed ? "Lihat Website" : undefined}
            aria-label="Lihat Website"
            className={styles.link}
            onClick={() => setDrawerPath(null)}
          >
            <span className={styles.linkIcon}>🌐</span>
            <span className={styles.linkLabel}>Lihat Website</span>
          </Link>
        </nav>

        <div className={styles.footer}>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className={styles.logoutBtn} aria-label="Keluar (Logout)">
              <span className={styles.logoutIcon} aria-hidden="true">↪</span>
              <span className={styles.logoutLabel}>Keluar (Logout)</span>
            </button>
          </form>
        </div>
      </aside>

      <main className={layoutStyles.mainContent}>
        {children}
      </main>
    </div>
  );
};
