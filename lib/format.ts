const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("id-ID");

export function formatRupiah(value: number) {
  return rupiah.format(Math.round(value));
}

export function formatCompact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1)} M`;
  if (abs >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)} jt`;
  if (abs >= 1_000) return `Rp${(value / 1_000).toFixed(0)} rb`;
  return formatRupiah(value);
}

export function formatNumber(value: number) {
  return decimal.format(value);
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(date);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseISODate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function daysBetween(from: string, to: string) {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000);
}

export function percentDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
