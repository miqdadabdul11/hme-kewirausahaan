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

export function formatDateTimeIndonesia(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function toDatetimeLocalIndonesia(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function datetimeLocalIndonesiaToISOString(value: string) {
  return new Date(`${value}:00+07:00`).toISOString();
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