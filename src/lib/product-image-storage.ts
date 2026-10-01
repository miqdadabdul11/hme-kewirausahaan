const PRODUCT_IMAGE_BUCKET = "product-images";
const PRODUCT_IMAGE_PATH_PREFIX = "products/";
export const MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024;

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ProductImageStorageError extends Error {}

function getSupabaseUrl() {
  const value = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  if (!value) {
    throw new ProductImageStorageError("Penyimpanan foto belum dikonfigurasi di server.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ProductImageStorageError("Alamat Supabase di server tidak valid.");
  }

  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new ProductImageStorageError("Alamat Supabase di server tidak valid.");
  }

  return url;
}

function getServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new ProductImageStorageError("Kredensial penyimpanan foto belum dikonfigurasi di server.");
  }
  return value;
}

export function detectProductImageMimeType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function isSupportedProductImageMimeType(mimeType: string) {
  return allowedMimeTypes.has(mimeType);
}

export function getProductImagePublicUrlPath(imageUrl: string) {
  const configuredUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  if (!configuredUrl) return null;
  let supabaseUrl: URL;
  try {
    supabaseUrl = new URL(configuredUrl);
  } catch {
    throw new ProductImageStorageError("Alamat Supabase di server tidak valid.");
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return null;
  }

  const publicPathPrefix = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  if (
    parsedUrl.origin !== supabaseUrl.origin ||
    !parsedUrl.pathname.startsWith(publicPathPrefix) ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    return null;
  }

  let objectPath: string;
  try {
    objectPath = decodeURIComponent(parsedUrl.pathname.slice(publicPathPrefix.length));
  } catch {
    return null;
  }

  if (!objectPath.startsWith(PRODUCT_IMAGE_PATH_PREFIX)) return null;
  const fileName = objectPath.slice(PRODUCT_IMAGE_PATH_PREFIX.length);
  if (!/^[a-zA-Z0-9_-]+-\d+-[0-9a-f-]{36}\.(webp|jpg|png)$/.test(fileName)) return null;
  return objectPath;
}

export async function uploadProductImage(
  bytes: Uint8Array,
  mimeType: string,
  productId?: string,
) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  if (!allowedMimeTypes.has(mimeType)) {
    throw new ProductImageStorageError("Format foto tidak didukung.");
  }

  const prefix = productId?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "product";
  const extension = mimeType === "image/webp" ? "webp" : mimeType === "image/png" ? "png" : "jpg";
  const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const objectPath = `${PRODUCT_IMAGE_PATH_PREFIX}${fileName}`;
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": mimeType,
        "x-upsert": "false",
      },
      body,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error("Supabase Storage rejected a product image upload.", { status: response.status });
    throw new ProductImageStorageError(
      response.status === 404
        ? "Bucket foto produk belum tersedia. Minta admin menyiapkan bucket product-images."
        : "Foto gagal disimpan ke Supabase Storage. Periksa konfigurasi bucket lalu coba lagi.",
    );
  }

  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${encodedPath}`;
}

export async function deleteProductImage(imageUrl: string) {
  const objectPath = getProductImagePublicUrlPath(imageUrl);
  if (!objectPath) return false;

  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: [objectPath] }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Supabase Storage rejected a product image deletion.", { status: response.status });
    throw new ProductImageStorageError("Foto lama gagal dihapus dari Supabase Storage.");
  }
  return true;
}
