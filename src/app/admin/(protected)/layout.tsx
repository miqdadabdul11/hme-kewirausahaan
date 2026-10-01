import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

// This layout ONLY wraps protected admin pages.
// /admin/login is outside this route group so no redirect loop.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("hme_admin_session")?.value;

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminSidebar>{children}</AdminSidebar>
  );
}
