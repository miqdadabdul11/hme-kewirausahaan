import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { orderStatus, paymentStatus } = body;

  try {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(orderStatus ? { orderStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
    });
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    return NextResponse.json({ error: "Order tidak ditemukan atau gagal diupdate." }, { status: 400 });
  }
}
