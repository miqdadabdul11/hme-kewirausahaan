import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getAdminFromSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("hme_admin_session")?.value;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
}
