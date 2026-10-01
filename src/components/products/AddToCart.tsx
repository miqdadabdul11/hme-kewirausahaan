"use client";

import { useState } from "react";
import { addCartItem } from "@/lib/cart-store";
import { Button } from "@/components/ui/Button";
import styles from "./AddToCart.module.css";

type Variant = {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  stockQuantity: number | null;
  status: string;
};

export function AddToCart({
  productId,
  name,
  price,
  type,
  variants,
}: {
  productId: string;
  name: string;
  price: number;
  type: "READY_STOCK" | "PRE_ORDER";
  variants: Variant[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(variants.length === 1 ? variants[0].id : "");
  const [message, setMessage] = useState<string | null>(null);
  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const unitPrice = selectedVariant?.price ?? price;

  const add = () => {
    if (variants.length > 0 && !selectedVariant) {
      setMessage("Pilih varian produk terlebih dahulu.");
      return;
    }
    if (type === "READY_STOCK" && selectedVariant && (selectedVariant.stockQuantity ?? 0) < quantity) {
      setMessage("Stok varian yang dipilih tidak mencukupi.");
      return;
    }

    try {
      addCartItem({
        productId,
        ...(selectedVariant ? { variantId: selectedVariant.id, variantName: selectedVariant.name } : {}),
        name,
        price: unitPrice,
        quantity,
      });
      setMessage(`${quantity} pcs ${name}${selectedVariant ? ` (${selectedVariant.name})` : ""} berhasil dimasukkan ke keranjang.`);
    } catch (error) {
      if (error instanceof Error && error.message === "Maksimal 10 pcs per produk.") {
        setMessage("Maksimal 10 pcs per produk dalam satu keranjang.");
        return;
      }
      setMessage("Keranjang tidak dapat disimpan. Periksa pengaturan browser lalu coba lagi.");
    }
  };

  return (
    <div className={styles.container}>
      {variants.length > 0 && (
        <div className={styles.variantField}>
          <label className={styles.label} htmlFor={`variant-${productId}`}>Pilih varian</label>
          <select
            id={`variant-${productId}`}
            className={styles.variantSelect}
            value={variantId}
            onChange={(event) => {
              setVariantId(event.target.value);
              setMessage(null);
            }}
            required
          >
            <option value="" disabled>— Pilih ukuran / model —</option>
            {variants.map((variant) => {
              const unavailable = variant.status !== "ACTIVE" ||
                (type === "READY_STOCK" && (variant.stockQuantity ?? 0) <= 0);
              return (
                <option key={variant.id} value={variant.id} disabled={unavailable}>
                  {variant.name}
                  {variant.price != null ? ` · Rp ${variant.price.toLocaleString("id-ID")}` : ""}
                  {type === "READY_STOCK" ? ` · sisa ${variant.stockQuantity ?? 0}` : ""}
                  {unavailable ? " · habis" : ""}
                </option>
              );
            })}
          </select>
          {selectedVariant && selectedVariant.price != null && (
            <p className={styles.variantPrice}>
              Harga pilihan ini: Rp {unitPrice.toLocaleString("id-ID")}
            </p>
          )}
        </div>
      )}
      <label className={styles.label} htmlFor={`quantity-${productId}`}>Jumlah</label>
      <div className={styles.controls}>
        <div className={styles.quantity}>
          <button
            type="button"
            aria-label="Kurangi jumlah"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
          >
            −
          </button>
          <input
            id={`quantity-${productId}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={type === "READY_STOCK" && selectedVariant ? Math.min(10, selectedVariant.stockQuantity ?? 0) : 10}
            value={quantity}
            onChange={(event) => {
              const value = Number(event.target.value);
              const maxQuantity = type === "READY_STOCK" && selectedVariant
                ? Math.min(10, selectedVariant.stockQuantity ?? 0)
                : 10;
              if (Number.isInteger(value) && value >= 1 && value <= maxQuantity) {
                setQuantity(value);
              }
            }}
            aria-label="Jumlah produk"
          />
          <button
            type="button"
            aria-label="Tambah jumlah"
            onClick={() => setQuantity((current) => Math.min(10, current + 1))}
            disabled={quantity >= 10}
          >
            +
          </button>
        </div>
        <Button type="button" size="lg" onClick={add}>
          Tambah ke Keranjang
        </Button>
      </div>
      {message && <p className={styles.message} role="status">{message}</p>}
    </div>
  );
}
