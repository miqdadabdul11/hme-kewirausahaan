import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

class OrderInputError extends Error {}

type OrderLine = { productId: string; quantity: number; variantName: string | null };

function serializeOrder(order: {
  paymentMethod: string | null;
  items: Array<{ variantName: string | null; [key: string]: unknown }>;
  [key: string]: unknown;
}) {
  return {
    ...order,
    paymentMethod: order.paymentMethod ?? "Transfer",
    items: order.items.map((item) => ({ ...item, variant: item.variantName ?? "-" })),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber") || "";
  const whatsappLast4 = searchParams.get("whatsappLast4") || "";

  const order = await prisma.order.findFirst({
    where: {
      ...(orderNumber ? { orderNumber: { equals: orderNumber, mode: "insensitive" } } : {}),
      ...(whatsappLast4 ? { whatsapp: { endsWith: whatsappLast4 } } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ order: serializeOrder(order) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items : [];
  const customerName = String(body.customerName || "").trim();
  const nim = String(body.nim || "").trim();
  const studyProgram = String(body.studyProgram || "").trim();
  const whatsapp = String(body.whatsapp || "").trim();
  const email = String(body.email || "").trim();
  const notes = String(body.notes || "").trim();
  const paymentMethod = String(body.paymentMethod || "Transfer");
  const idempotencyKey = String(body.idempotencyKey || "").trim();

  if (!customerName || !nim || !studyProgram || !whatsapp || !items.length || !idempotencyKey) {
    return NextResponse.json({ error: "Data pemesanan tidak lengkap." }, { status: 400 });
  }

  const lines: OrderLine[] = items.map((input: { productId?: unknown; quantity?: unknown; variant?: unknown }) => ({
    productId: String(input.productId || ""),
    quantity: Number(input.quantity),
    variantName: input.variant ? String(input.variant) : null,
  }));
  if (lines.some((line) => !line.productId || !Number.isInteger(line.quantity) || line.quantity <= 0)) {
    return NextResponse.json({ error: "Jumlah pesanan harus valid." }, { status: 400 });
  }

  try {
    const order = await prisma.$transaction(async (transaction) => {
      const duplicate = await transaction.order.findUnique({
        where: { idempotencyKey },
        include: { items: true },
      });
      if (duplicate) return { order: duplicate, duplicate: true };

      const openOrder = await transaction.openOrder.findFirst({
        where: { status: "OPEN" },
        orderBy: { startAt: "desc" },
      });
      if (!openOrder) throw new OrderInputError("Open Order telah ditutup. Pesanan baru tidak dapat dibuat.");

      const quantities = new Map<string, number>();
      for (const line of lines) {
        quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
      }

      const products = await transaction.product.findMany({
        where: { id: { in: [...quantities.keys()] }, status: "ACTIVE" },
      });
      const productsById = new Map(products.map((product) => [product.id, product]));
      if (productsById.size !== quantities.size) {
        throw new OrderInputError("Salah satu produk tidak tersedia.");
      }

      for (const [productId, quantity] of quantities) {
        const product = productsById.get(productId)!;
        if (product.type === "READY_STOCK" && (product.stockQuantity ?? 0) < quantity) {
          throw new OrderInputError("Maaf, stok produk ini sudah habis.");
        }

        if (product.type === "PRE_ORDER" && product.maximumQuantity !== null) {
          const current = await transaction.orderItem.aggregate({
            where: {
              productId,
              order: { is: { orderStatus: { not: "CANCELLED" } } },
            },
            _sum: { quantity: true },
          });
          if ((current._sum.quantity ?? 0) + quantity > product.maximumQuantity) {
            throw new OrderInputError("Maaf, jumlah maksimum pesanan untuk produk ini telah tercapai.");
          }
        }
      }

      for (const [productId, quantity] of quantities) {
        const product = productsById.get(productId)!;
        if (product.type === "READY_STOCK") {
          const updated = await transaction.product.updateMany({
            where: { id: productId, stockQuantity: { gte: quantity } },
            data: { stockQuantity: { decrement: quantity } },
          });
          if (updated.count !== 1) throw new OrderInputError("Maaf, stok produk ini sudah habis.");
        }
      }

      const itemsToCreate = lines.map((line) => {
        const product = productsById.get(line.productId)!;
        return {
          productId: product.id,
          productName: product.name,
          variantName: line.variantName,
          quantity: line.quantity,
          price: product.price,
          subtotal: product.price * line.quantity,
        };
      });
      const totalAmount = itemsToCreate.reduce((sum, item) => sum + item.subtotal, 0);
      const orderNumber = `HME-${String((await transaction.order.count()) + 1).padStart(4, "0")}`;
      const created = await transaction.order.create({
        data: {
          orderNumber,
          customerName,
          nim,
          studyProgram,
          whatsapp,
          email: email || null,
          notes: notes || null,
          paymentMethod,
          paymentStatus: "UNPAID",
          orderStatus: "PENDING",
          totalAmount,
          idempotencyKey,
          openOrderId: openOrder.id,
          items: { create: itemsToCreate },
        },
        include: { items: true },
      });

      return { order: created, duplicate: false };
    });

    return NextResponse.json(
      { success: true, order: serializeOrder(order.order), ...(order.duplicate ? { duplicate: true } : {}) },
      { status: order.duplicate ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof OrderInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const duplicate = await prisma.order.findUnique({ where: { idempotencyKey }, include: { items: true } });
      if (duplicate) {
        return NextResponse.json({ success: true, order: serializeOrder(duplicate), duplicate: true });
      }
    }
    return NextResponse.json({ error: "Pesanan tidak dapat disimpan." }, { status: 500 });
  }
}
