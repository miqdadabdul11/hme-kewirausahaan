import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { variants: true, openOrderProducts: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    products: products.map(({ openOrderProducts, ...product }) => ({
      ...product,
      openOrderId: openOrderProducts[0]?.openOrderId ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const slug = body.slug || `${String(body.name || "produk").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const productData = {
    name: String(body.name || ""),
    slug,
    description: String(body.description || ""),
    image: body.image ? String(body.image) : null,
    category: body.category ? String(body.category) : "Umum",
    type: body.type || "READY_STOCK",
    price: Number(body.price || 0),
    status: body.status || "ACTIVE",
    targetMinimum: body.targetMinimum ? Number(body.targetMinimum) : 0,
    maximumQuantity: body.maximumQuantity === "" || body.maximumQuantity == null ? null : Number(body.maximumQuantity),
    stockQuantity: body.stockQuantity !== undefined ? Number(body.stockQuantity) : 0,
  };

  const savedProduct = await prisma.$transaction(async (transaction) => {
    const product = body.id
      ? await transaction.product.upsert({
          where: { id: String(body.id) },
          update: productData,
          create: { id: String(body.id), ...productData },
        })
      : await transaction.product.upsert({
          where: { slug },
          update: productData,
          create: productData,
        });

    await transaction.openOrderProduct.deleteMany({ where: { productId: product.id } });
    if (body.openOrderId) {
      await transaction.openOrderProduct.create({
        data: { productId: product.id, openOrderId: String(body.openOrderId) },
      });
    }

    return transaction.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { variants: true, openOrderProducts: true },
    });
  });

  const { openOrderProducts, ...product } = savedProduct;
  return NextResponse.json({
    success: true,
    product: { ...product, openOrderId: openOrderProducts[0]?.openOrderId ?? null },
  });
}
