import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

if (typeof process.loadEnvFile === "function") {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (existsSync(".env")) process.loadEnvFile(".env");
}

function readHiddenPassword(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Perintah reset password harus dijalankan langsung di terminal interaktif.");
  }

  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let password = "";

    const finish = (error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
      if (error) reject(error);
      else resolve(password);
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish(new Error("Reset password dibatalkan."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u0008" || character === "\u007f") {
          password = password.slice(0, -1);
          continue;
        }
        if (character >= " " && character !== "\u007f") password += character;
      }
    };

    stdin.on("data", onData);
  });
}

const prisma = new PrismaClient();
const readline = createInterface({ input: stdin, output: stdout });

async function main() {
  const configuredEmail = (process.env.ADMIN_EMAIL || "admin@hme.ac.id").trim().toLowerCase();
  const enteredEmail = await readline.question(`Email admin [${configuredEmail}]: `);
  const email = (enteredEmail.trim() || configuredEmail).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Format email tidak valid.");
  }

  const password = await readHiddenPassword("Password baru (minimal 12 karakter): ");
  const confirmation = await readHiddenPassword("Ulangi password baru: ");
  if (password.length < 12) throw new Error("Password harus minimal 12 karakter.");
  if (password !== confirmation) throw new Error("Konfirmasi password tidak cocok.");

  const passwordHash = await bcrypt.hash(password, 12);
  if (passwordHash.length !== 60 || !passwordHash.startsWith("$2b$12$")) {
    throw new Error("Hash password yang dihasilkan tidak valid.");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      name: "Admin HME",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
    select: { email: true, passwordHash: true },
  });

  const verified = await bcrypt.compare(password, user.passwordHash);
  if (!verified) throw new Error("Verifikasi password setelah penyimpanan gagal.");

  console.log(`Password admin berhasil direset untuk ${user.email}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Gagal mereset password admin.");
    process.exitCode = 1;
  })
  .finally(async () => {
    readline.close();
    await prisma.$disconnect();
  });
