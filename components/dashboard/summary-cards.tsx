import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCompact, formatNumber, formatPercent, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export interface SummaryData {
  cashBalance: number;
  salesToday: number;
  salesYesterday: number;
  salesCountToday: number;
  purchasesToday: number;
  expensesMonth: number;
  salesMonth: number;
  receivables: number;
  payables: number;
}

function Delta({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
        positive ? "text-success-700" : "text-danger-700"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPercent(value)} vs kemarin
    </span>
  );
}

function SummaryCard({
  label,
  value,
  caption,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  caption?: ReactNode;
  delta?: number;
  tone?: "default" | "brand";
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${tone === "brand" ? "text-brand-700" : "text-ink-900"}`}>
        {value}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {delta !== undefined ? <Delta value={delta} /> : null}
        {caption ? <span className="text-[11px] text-ink-400">{caption}</span> : null}
      </div>
    </Card>
  );
}

export function SummaryCards({ data }: { data: SummaryData }) {
  const delta =
    data.salesYesterday === 0 && data.salesToday === 0
      ? 0
      : ((data.salesToday - data.salesYesterday) / Math.max(data.salesYesterday, 1)) * 100;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Saldo kas & bank"
        value={formatRupiah(data.cashBalance)}
        caption="semua sumber dana"
        tone="brand"
      />
      <SummaryCard
        label="Penjualan hari ini"
        value={formatRupiah(data.salesToday)}
        delta={delta}
        caption={`${formatNumber(data.salesCountToday)} transaksi`}
      />
      <SummaryCard
        label="Pembelian hari ini"
        value={formatRupiah(data.purchasesToday)}
        caption={`bulanan ${formatCompact(data.salesMonth)}`}
      />
      <SummaryCard
        label="Pengeluaran bulan ini"
        value={formatRupiah(data.expensesMonth)}
        caption={
          <span className="flex flex-wrap gap-1">
            <Badge tone="success">Piutang {formatCompact(data.receivables)}</Badge>
            <Badge tone="danger">Utang {formatCompact(data.payables)}</Badge>
          </span>
        }
      />
    </div>
  );
}
