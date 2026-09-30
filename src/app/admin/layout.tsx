import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import styles from "./admin-layout.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("hme_admin_session")?.value;

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className={styles.container}>
      <AdminSidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
