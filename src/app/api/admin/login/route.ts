import { NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  const admin = await verifyAdminCredentials(email, password);

  if (!admin) {
    return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });

  response.cookies.set("hme_admin_session", admin.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
