import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyAdminCredentials(email: string, password: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const admin = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      return null;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    return isValid ? admin : null;
  } catch {
    return null;
  }
}

export function getDefaultAdminPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH ?? "$2b$12$mLWexroKRl27.Xptm6.9HepiTCk3vGKz12OgEG4xJPquhwkBxH.3q";
}
