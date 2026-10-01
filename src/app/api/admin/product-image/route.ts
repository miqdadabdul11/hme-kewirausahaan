import { NextResponse } from "next/server";
import { getAdminFromSession } from "@/lib/admin-auth";
import {
  detectProductImageMimeType,
  isSupportedProductImageMimeType,
  MAX_PRODUCT_IMAGE_BYTES,
  ProductImageStorageError,
  uploadProductImage,
  deleteProductImage,
} from "@/lib/product-image-storage";

export const runtime = "nodejs";
const MAX_REQUEST_BYTES = 4.5 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await getAdminFromSession();
  if (!admin) return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Ukuran upload melewati batas aman server. Pilih foto yang lebih kecil." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Data foto tidak valid. Pilih ulang foto lalu coba lagi." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pilih file foto terlebih dahulu." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return NextResponse.json({ error: "Ukuran foto setelah kompresi melebihi batas 4 MB." }, { status: 413 });
  }
  if (!isSupportedProductImageMimeType(file.type)) {
    return NextResponse.json({ error: "Format foto harus JPG, PNG, atau WebP." }, { status: 415 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedMimeType = detectProductImageMimeType(bytes);
  if (!detectedMimeType || detectedMimeType !== file.type) {
    return NextResponse.json({ error: "Isi file tidak sesuai dengan format foto yang didukung." }, { status: 415 });
  }

  const productId = formData.get("productId");
  try {
    const imageUrl = await uploadProductImage(
      bytes,
      detectedMimeType,
      typeof productId === "string" ? productId : undefined,
    );
    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof ProductImageStorageError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const requestId = crypto.randomUUID();
    console.error("Unexpected product image upload failure.", {
      requestId,
      name: error instanceof Error ? error.name : typeof error,
    });
    return NextResponse.json({
      error: `Foto gagal diunggah. Coba lagi; bila berulang, kirim kode ${requestId} ke admin.`,
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromSession();
  if (!admin) return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan hapus foto tidak valid." }, { status: 400 });
  }

  const imageUrl = body && typeof body === "object" && "imageUrl" in body
    ? (body as { imageUrl?: unknown }).imageUrl
    : null;
  if (typeof imageUrl !== "string") {
    return NextResponse.json({ error: "Alamat foto tidak valid." }, { status: 400 });
  }

  try {
    const deleted = await deleteProductImage(imageUrl);
    if (!deleted) {
      return NextResponse.json({ error: "Foto bukan file unggahan produk yang dapat dihapus." }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProductImageStorageError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const requestId = crypto.randomUUID();
    console.error("Unexpected product image deletion failure.", {
      requestId,
      name: error instanceof Error ? error.name : typeof error,
    });
    return NextResponse.json({
      error: `Foto gagal dihapus. Coba lagi; bila berulang, kirim kode ${requestId} ke admin.`,
    }, { status: 500 });
  }
}
