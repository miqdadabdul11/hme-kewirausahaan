import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/catalog";
import styles from "../dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [totalOrders, pendingOrders, totalRevenue, totalProducts, recentOrders, openOrders] = await Promise.all([
    prisma.order.count({ where: { orderStatus: { not: "CANCELLED" } } }),
    prisma.order.count({ where: { orderStatus: "PENDING" } }),
    prisma.order.aggregate({
      where: { orderStatus: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { items: { select: { productName: true, quantity: true } } },
    }),
    prisma.openOrder.findMany({ orderBy: { startAt: "desc" }, take: 3 }),
  ]);

  const stats = [
    { label: "Total Pesanan", value: totalOrders, icon: "📦", color: "blue" },
    { label: "Menunggu Konfirmasi", value: pendingOrders, icon: "⏳", color: "yellow" },
    { label: "Total Pendapatan", value: formatCurrency(Number(totalRevenue._sum.totalAmount ?? 0)), icon: "💰", color: "green" },
    { label: "Produk Aktif", value: totalProducts, icon: "🛍️", color: "purple" },
  ];

  const statusColor: Record<string, string> = {
    PENDING: "#f59e0b",
    CONFIRMED: "#3b82f6",
    READY: "#10b981",
    COMPLETED: "#6b7280",
    CANCELLED: "#ef4444",
  };
  const paymentColor: Record<string, string> = {
    UNPAID: "#ef4444",
    PAID: "#10b981",
    REFUNDED: "#6b7280",
  };
  const openOrderStatusColor: Record<string, string> = {
    OPEN: "#10b981",
    CLOSED: "#ef4444",
    DRAFT: "#f59e0b",
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Selamat datang di panel administrasi HME Kewirausahaan</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={`${styles.statCard} ${styles[`statCard_${stat.color}`]}`}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Recent Orders */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Pesanan Terbaru</h2>
            <a href="/admin/orders" className={styles.viewAll}>Lihat semua →</a>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Nama</th>
                  <th>Produk</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Bayar</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className={styles.mono}>{order.orderNumber}</td>
                    <td>{order.customerName}</td>
                    <td className={styles.productCell}>
                      {order.items.map(i => `${i.productName} (${i.quantity}x)`).join(", ")}
                    </td>
                    <td className={styles.mono}>{formatCurrency(Number(order.totalAmount))}</td>
                    <td>
                      <span className={styles.badge} style={{ background: `${statusColor[order.orderStatus] ?? "#ccc"}22`, color: statusColor[order.orderStatus] ?? "#666" }}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <span className={styles.badge} style={{ background: `${paymentColor[order.paymentStatus] ?? "#ccc"}22`, color: paymentColor[order.paymentStatus] ?? "#666" }}>
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open Orders Status */}
        <div className={styles.sideCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Open Orders</h2>
            <a href="/admin/open-orders" className={styles.viewAll}>Kelola →</a>
          </div>
          <div className={styles.openOrderList}>
            {openOrders.length === 0 && <p className={styles.emptyText}>Belum ada Open Order</p>}
            {openOrders.map((oo) => (
              <div key={oo.id} className={styles.openOrderItem}>
                <div className={styles.openOrderName}>{oo.name}</div>
                <span
                  className={styles.badge}
                  style={{ background: `${openOrderStatusColor[oo.status] ?? "#ccc"}22`, color: openOrderStatusColor[oo.status] ?? "#666" }}
                >
                  {oo.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
