export type StoreStatus = "OPEN" | "COMING_SOON" | "CLOSED";

export function getStoreStatus(openOrders: Array<{ status: string }>): StoreStatus {
  if (openOrders.some((order) => order.status === "OPEN")) return "OPEN";
  if (openOrders.some((order) => order.status === "UPCOMING")) return "COMING_SOON";
  return "CLOSED";
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getProductProgress(product: {
  targetMinimum: number | null;
  maximumQuantity: number | null;
  orderItems: Array<{ quantity: number }>;
}) {
  const current = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const target = product.targetMinimum ?? 0;
  const maximum = product.maximumQuantity;

  return {
    current,
    target,
    remainingTarget: Math.max(0, target - current),
    remainingMax: maximum === null ? null : Math.max(0, maximum - current),
    maximum,
    targetReached: target > 0 ? current >= target : true,
  };
}