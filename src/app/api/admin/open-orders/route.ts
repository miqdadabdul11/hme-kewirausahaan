import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const openOrders = await prisma.openOrder.findMany({ orderBy: { startAt: "desc" } });
  return NextResponse.json({ openOrders });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, startAt, endAt, status } = body;
  if (!name || !startAt || !endAt) {
    return NextResponse.json({ error: "Nama, startAt, dan endAt wajib diisi." }, { status: 400 });
  }
  const oo = await prisma.openOrder.create({
    data: { name, description: description ?? null, startAt: new Date(startAt), endAt: new Date(endAt), status: status ?? "DRAFT" },
  });
  return NextResponse.json({ success: true, openOrder: oo }, { status: 201 });
}
