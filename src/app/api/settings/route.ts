import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseSetting(value: string | null) {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function GET() {
  const entries = await prisma.setting.findMany();
  const settings = Object.fromEntries(entries.map(({ key, value }) => [key, parseSetting(value)]));
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Pengaturan tidak valid." }, { status: 400 });
  }

  await prisma.$transaction(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      }),
    ),
  );

  const entries = await prisma.setting.findMany();
  const settings = Object.fromEntries(entries.map(({ key, value }) => [key, parseSetting(value)]));
  return NextResponse.json({ success: true, settings });
}
