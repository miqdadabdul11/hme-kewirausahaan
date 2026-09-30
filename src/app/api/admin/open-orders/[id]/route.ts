import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name, description, startAt, endAt, status } = body;
  try {
    const oo = await prisma.openOrder.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(startAt ? { startAt: new Date(startAt) } : {}),
        ...(endAt ? { endAt: new Date(endAt) } : {}),
        ...(status ? { status } : {}),
      },
    });
    return NextResponse.json({ success: true, openOrder: oo });
  } catch (err) {
    return NextResponse.json({ error: "Open Order tidak ditemukan." }, { status: 404 });
  }
}
