import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("hme_admin_session")?.value;

  if (!session) {
    redirect("/admin/login");
  }

  return <div className="admin-layout">{children}</div>;
}
