import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";

if (typeof process.loadEnvFile === "function") {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (existsSync(".env")) process.loadEnvFile(".env");
}

const prisma = new PrismaClient();

async function main() {
  const cliPassword = process.argv[2] ?? process.env.ADMIN_PASSWORD;
  const email = (process.env.ADMIN_EMAIL || "admin@hme.ac.id").trim().toLowerCase();

  if (!cliPassword) {
    console.error("Password admin belum diatur. Gunakan: ADMIN_PASSWORD='password-baru' npm run create-admin");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(cliPassword, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin HME",
      passwordHash,
      role: "SUPER_ADMIN",
    },
    create: {
      name: "Admin HME",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`Admin berhasil dibuat/diupdate: ${email}`);
}

main()
  .catch((error) => {
    console.error("Gagal membuat admin.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
