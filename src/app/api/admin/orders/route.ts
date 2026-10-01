import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { productName: true, variantName: true, quantity: true, price: true, subtotal: true } },
    },
  });
  return NextResponse.json({ orders });
}
