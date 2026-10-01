import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const endAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@hme.ac.id").trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (passwordHash) {
    if (!/^\$2[aby]\$\d{2}\$/.test(passwordHash)) {
      throw new Error("ADMIN_PASSWORD_HASH tidak valid. Buat akun admin dengan npm run create-admin.");
    }

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { name: "Admin HME", passwordHash, role: "SUPER_ADMIN" },
      create: { name: "Admin HME", email: adminEmail, passwordHash, role: "SUPER_ADMIN" },
    });
  }

  const openOrder = await prisma.openOrder.upsert({
    where: { id: "demo-open-order" },
    update: {
      name: "Demo Open Order HME",
      description: "Periode demo untuk produk HME.",
      startAt: now,
      endAt,
      status: "OPEN",
    },
    create: {
      id: "demo-open-order",
      name: "Demo Open Order HME",
      description: "Periode demo untuk produk HME.",
      startAt: now,
      endAt,
      status: "OPEN",
    },
  });

  const products = [
    {
      name: "Kaos HME",
      slug: "kaos-hme-demo",
      description: "Kaos resmi HME untuk kegiatan dan keseharian.",
      category: "Apparel",
      type: "PRE_ORDER",
      price: 85000,
      status: "ACTIVE",
      targetMinimum: 15,
      maximumQuantity: 100,
      stockQuantity: null,
    },
    {
      name: "Totebag HME",
      slug: "totebag-hme-demo",
      description: "Totebag serbaguna dengan identitas HME.",
      category: "Aksesori",
      type: "READY_STOCK",
      price: 45000,
      status: "ACTIVE",
      targetMinimum: null,
      maximumQuantity: null,
      stockQuantity: 30,
    },
  ];

  for (const product of products) {
    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });

    await prisma.openOrderProduct.upsert({
      where: { openOrderId_productId: { openOrderId: openOrder.id, productId: savedProduct.id } },
      update: { targetMinimum: product.targetMinimum, maximumQuantity: product.maximumQuantity },
      create: {
        openOrderId: openOrder.id,
        productId: savedProduct.id,
        targetMinimum: product.targetMinimum,
        maximumQuantity: product.maximumQuantity,
      },
    });

    const variants = product.slug === "kaos-hme-demo"
      ? ["Ukuran S", "Ukuran M", "Ukuran L", "Ukuran XL", "Ukuran XXL"].map((name) => ({
          name,
          stockQuantity: null,
        }))
      : [{ name: "Standar", stockQuantity: product.stockQuantity }];

    for (const variant of variants) {
      const existingVariant = await prisma.productVariant.findFirst({
        where: { productId: savedProduct.id, name: variant.name },
      });
      if (existingVariant) {
        await prisma.productVariant.update({
          where: { id: existingVariant.id },
          data: { price: null, stockQuantity: variant.stockQuantity, status: "ACTIVE" },
        });
      } else {
        await prisma.productVariant.create({
          data: {
            productId: savedProduct.id,
            name: variant.name,
            stockQuantity: variant.stockQuantity,
            status: "ACTIVE",
          },
        });
      }
    }
  }

  const settings = {
    storeName: "Sub Kewirausahaan HME",
    bannerText: "Open Order HME",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
  }

  console.log("Demo seed selesai.");
}

main()
  .catch((error) => {
    console.error("Demo seed gagal.", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());