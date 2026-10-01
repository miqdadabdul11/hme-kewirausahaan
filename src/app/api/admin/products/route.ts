import { NextResponse } from "next/server";
import { Prisma, ProductStatus, ProductType } from "@prisma/client";
import { getAdminFromSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 401 });

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
  const admin = await getAdminFromSession();
  if (!admin) return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format data produk tidak valid." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const type: ProductType | null = body.type === "PRE_ORDER"
    ? ProductType.PRE_ORDER
    : body.type === "READY_STOCK"
      ? ProductType.READY_STOCK
      : null;
  const statusValues = Object.values(ProductStatus);
  const status = typeof body.status === "string" && statusValues.includes(body.status as ProductStatus)
    ? body.status as ProductStatus
    : ProductStatus.ACTIVE;
  const price = Number(body.price);
  const targetMinimum = body.targetMinimum == null || body.targetMinimum === "" ? 0 : Number(body.targetMinimum);
  const maximumQuantity = body.maximumQuantity == null || body.maximumQuantity === "" ? null : Number(body.maximumQuantity);
  const variants = body.variants;
  if (!name || !description || !type || !Number.isSafeInteger(price) || price < 0 ||
    !Number.isSafeInteger(targetMinimum) || targetMinimum < 0 ||
    (maximumQuantity !== null && (!Number.isSafeInteger(maximumQuantity) || maximumQuantity < targetMinimum)) ||
    !Array.isArray(variants) || variants.length === 0) {
    return NextResponse.json({ error: "Nama, deskripsi, tipe, harga, dan minimal satu varian wajib diisi." }, { status: 400 });
  }

  const normalizedVariants: Array<{
    id: string | null;
    name: string;
    sku: string | null;
    price: number | null;
    stockQuantity: number | null;
  }> = [];
  const seenSkus = new Set<string>();
  for (const [index, input] of variants.entries()) {
    if (!input || typeof input !== "object") {
      return NextResponse.json({ error: `Data varian ke-${index + 1} tidak valid.` }, { status: 400 });
    }
    const variant = input as Record<string, unknown>;
    const variantName = typeof variant.name === "string" ? variant.name.trim() : "";
    const variantPrice = variant.price == null || variant.price === "" ? null : Number(variant.price);
    const stockQuantity = type === "READY_STOCK" ? Number(variant.stockQuantity) : null;
    if (!variantName || variantName.length > 120 ||
      (variantPrice !== null && (!Number.isSafeInteger(variantPrice) || variantPrice < 0)) ||
      (type === "READY_STOCK" && (!Number.isSafeInteger(stockQuantity) || (stockQuantity ?? -1) < 0))) {
      return NextResponse.json({ error: `Nama, harga, atau stok varian ke-${index + 1} tidak valid.` }, { status: 400 });
    }
    normalizedVariants.push({
      id: typeof variant.id === "string" ? variant.id : null,
      name: variantName,
      sku: typeof variant.sku === "string" && variant.sku.trim() && variant.sku.trim() !== "-"
        ? variant.sku.trim()
        : null,
      price: variantPrice,
      stockQuantity,
    });
    const sku = normalizedVariants.at(-1)?.sku;
    if (sku) {
      const normalizedSku = sku.toLocaleLowerCase();
      if (seenSkus.has(normalizedSku)) {
        return NextResponse.json({ error: `SKU "${sku}" dipakai lebih dari sekali.` }, { status: 400 });
      }
      seenSkus.add(normalizedSku);
    }
  }

  const slug = typeof body.slug === "string" && body.slug.trim()
    ? body.slug.trim()
    : `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const totalStock = type === "READY_STOCK"
    ? normalizedVariants.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0)
    : null;
  const productData = {
    name,
    slug: String(slug),
    description,
    image: body.image ? String(body.image) : null,
    category: body.category ? String(body.category) : "Umum",
    type,
    price,
    status,
    targetMinimum,
    maximumQuantity,
    stockQuantity: totalStock,
  };

  try {
    const savedProduct = await prisma.$transaction(async (transaction) => {
      const product = typeof body.id === "string"
        ? await transaction.product.upsert({
            where: { id: body.id },
            update: productData,
            create: { id: body.id, ...productData },
          })
        : await transaction.product.upsert({
            where: { slug: String(slug) },
            update: productData,
            create: productData,
          });

      const retainedIds: string[] = [];
      for (const variant of normalizedVariants) {
        if (variant.id) {
          const updated = await transaction.productVariant.updateMany({
            where: { id: variant.id, productId: product.id },
            data: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              stockQuantity: variant.stockQuantity,
              status: "ACTIVE",
            },
          });
          if (updated.count !== 1) throw new Error("Salah satu varian tidak ditemukan.");
          retainedIds.push(variant.id);
        } else {
          const created = await transaction.productVariant.create({
            data: {
              productId: product.id,
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              stockQuantity: variant.stockQuantity,
              status: "ACTIVE",
            },
          });
          retainedIds.push(created.id);
        }
      }

      await transaction.productVariant.deleteMany({
        where: { productId: product.id, id: { notIn: retainedIds } },
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.map(String).join(",").toLowerCase()
        : String(error.meta?.target ?? "").toLowerCase();
      console.error("Failed to save product and variants.", { code: error.code, target });

      if (error.code === "P2002") {
        const message = target.includes("sku")
          ? "SKU sudah digunakan produk lain. Kosongkan SKU atau gunakan kode unik."
          : target.includes("slug")
            ? "Nama/slug produk sudah digunakan. Ubah nama produk lalu coba lagi."
            : "Ada data unik yang sudah digunakan. Periksa SKU tiap varian.";
        return NextResponse.json({ error: message }, { status: 409 });
      }
      if (error.code === "P2003") {
        return NextResponse.json({ error: "Open Order yang dipilih tidak valid. Muat ulang daftar lalu coba lagi." }, { status: 400 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Data produk atau varian berubah. Muat ulang halaman lalu simpan kembali." }, { status: 409 });
      }
    } else {
      console.error("Failed to save product and variants.");
    }
    return NextResponse.json({ error: "Produk atau varian tidak dapat disimpan." }, { status: 400 });
  }
}
