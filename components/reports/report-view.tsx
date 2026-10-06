"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { TableShell, TD, TH, THead, TR } from "@/components/ui/table";
import { buttonClass } from "@/components/ui/button";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { ExportButtons } from "./export-buttons";
import { tabLabels, type ReportPayload, type ReportTab } from "./types";
import { formatNumber, formatRupiah } from "@/lib/format";
import { ReceiptText } from "lucide-react";

const tabs: ReportTab[] = ["labarugi", "kas", "piutang", "penjualan", "persediaan"];

function StatCard({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "success" | "danger" | "brand" }) {
  const toneClass =
    tone === "success" ? "text-success-700" : tone === "danger" ? "text-danger-700" : tone === "brand" ? "text-brand-700" : "text-ink-900";
  return (
    <Card className="p-4">
      <p className="text-xs text-ink-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function Money({ value, strong }: { value: number; strong?: boolean }) {
  return (
    <span className={`whitespace-nowrap ${strong ? "font-semibold text-ink-900" : "text-ink-700"}`}>{formatRupiah(value)}</span>
  );
}

function ProfitLossSection({ payload }: { payload: ReportPayload }) {
  const { profitLoss: pl, expenseCategories } = payload;
  const rows: Array<{ label: string; value: number; strong?: boolean; muted?: boolean }> = [
    { label: "Pendapatan penjualan", value: pl.revenue },
    { label: "Pendapatan lain (kas masuk)", value: pl.otherIncome },
    { label: "Harga pokok penjualan (pembelian)", value: pl.purchases, muted: true },
    { label: "Laba kotor", value: pl.grossProfit, strong: true },
    { label: "Beban operasional", value: pl.expenses, muted: true },
    { label: "Laba bersih periode ini", value: pl.netProfit, strong: true },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total pendapatan" value={formatRupiah(pl.revenue + pl.otherIncome)} tone="success" />
        <StatCard label="Total beban + HPP" value={formatRupiah(pl.purchases + pl.expenses)} tone="danger" />
        <StatCard label="Laba bersih" value={formatRupiah(pl.netProfit)} tone={pl.netProfit >= 0 ? "brand" : "danger"} />
      </div>

      <TableShell>
        <THead>
          <tr>
            <TH>Uraian</TH>
            <TH className="text-right">Nilai</TH>
          </tr>
        </THead>
        <tbody>
          {rows.map((row) => (
            <TR key={row.label} className={row.strong ? "bg-ink-50" : undefined}>
              <TD className={row.strong ? "font-semibold text-ink-900" : row.muted ? "text-ink-500" : "text-ink-700"}>
                {row.label}
              </TD>
              <TD className={`text-right ${row.muted ? "text-danger-700" : ""}`}>
                <Money value={row.value} strong={row.strong} />
              </TD>
            </TR>
          ))}
        </tbody>
      </TableShell>

      <TableShell>
        <THead>
          <tr>
            <TH>Beban per kategori</TH>
            <TH className="text-right">Nominal</TH>
            <TH className="text-right">Porsi</TH>
          </tr>
        </THead>
        <tbody>
          {expenseCategories.length === 0 ? (
            <TR>
              <TD className="text-sm text-ink-500">Tidak ada beban tercatat pada periode ini.</TD>
              <TD />
              <TD />
            </TR>
          ) : (
            expenseCategories.map((row) => (
              <TR key={row.name}>
                <TD>{row.name}</TD>
                <TD className="text-right">
                  <Money value={row.amount} />
                </TD>
                <TD className="text-right text-xs text-ink-500">
                  {formatNumber(Math.round((row.amount / Math.max(pl.expenses, 1)) * 100))}%
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </TableShell>
    </div>
  );
}

function CashSection({ payload }: { payload: ReportPayload }) {
  const totalIn = payload.cashflow.reduce((sum, row) => sum + row.masuk, 0);
  const totalOut = payload.cashflow.reduce((sum, row) => sum + row.keluar, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Saldo kas & bank saat ini" value={formatRupiah(payload.cashBalance)} tone="brand" />
        <StatCard label="Total masuk periode ini" value={formatRupiah(totalIn)} tone="success" />
        <StatCard label="Total keluar periode ini" value={formatRupiah(totalOut)} tone="danger" />
      </div>

      <CashflowChart data={payload.cashflow} />

      <TableShell>
        <THead>
          <tr>
            <TH>Akun</TH>
            <TH>Jenis</TH>
            <TH className="text-right">Masuk</TH>
            <TH className="text-right">Keluar</TH>
            <TH className="text-right">Bersih</TH>
          </tr>
        </THead>
        <tbody>
          {payload.cashAccounts.map((row) => (
            <TR key={row.name}>
              <TD className="font-medium text-ink-900">{row.name}</TD>
              <TD>
                <Badge tone="muted">{row.type}</Badge>
              </TD>
              <TD className="text-right text-sm text-success-700">{formatRupiah(row.inflow)}</TD>
              <TD className="text-right text-sm text-danger-700">{formatRupiah(row.outflow)}</TD>
              <TD className="text-right">
                <Money value={row.net} strong />
              </TD>
            </TR>
          ))}
        </tbody>
      </TableShell>

      <TableShell>
        <THead>
          <tr>
            <TH>Tanggal</TH>
            <TH className="text-right">Masuk</TH>
            <TH className="text-right">Keluar</TH>
            <TH className="text-right">Bersih harian</TH>
          </tr>
        </THead>
        <tbody>
          {payload.cashflow
            .filter((row) => row.masuk || row.keluar)
            .map((row) => (
              <TR key={row.date}>
                <TD className="whitespace-nowrap text-xs">{row.date}</TD>
                <TD className="text-right text-sm text-success-700">{formatRupiah(row.masuk)}</TD>
                <TD className="text-right text-sm text-danger-700">{formatRupiah(row.keluar)}</TD>
                <TD className="text-right">
                  <Money value={row.masuk - row.keluar} strong />
                </TD>
              </TR>
            ))}
        </tbody>
      </TableShell>
    </div>
  );
}

function DebtTable({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: ReportPayload["receivables"];
  emptyText: string;
}) {
  const totalRemaining = rows.reduce((sum, row) => sum + row.remaining, 0);
  return (
    <TableShell>
      <THead>
        <tr>
          <TH>{title}</TH>
          <TH>Jatuh tempo</TH>
          <TH>Umur</TH>
          <TH className="text-right">Total</TH>
          <TH className="text-right">Dibayar</TH>
          <TH className="text-right">Sisa</TH>
        </tr>
      </THead>
      <tbody>
        {rows.length === 0 ? (
          <TR>
            <TD className="text-sm text-ink-500" colSpan={6}>
              {emptyText}
            </TD>
          </TR>
        ) : (
          <>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD className="font-medium text-ink-900">{row.partyName}</TD>
                <TD className="whitespace-nowrap text-xs">{row.dueDate}</TD>
                <TD>
                  <Badge tone={row.bucket === "Belum jatuh tempo" ? "muted" : row.bucket === ">60" ? "danger" : "warning"}>
                    {row.bucket}
                  </Badge>
                </TD>
                <TD className="text-right text-sm">{formatRupiah(row.total)}</TD>
                <TD className="text-right text-sm text-ink-500">{formatRupiah(row.paid)}</TD>
                <TD className="text-right text-sm font-semibold">{formatRupiah(row.remaining)}</TD>
              </TR>
            ))}
            <TR className="bg-ink-50">
              <TD className="font-semibold text-ink-900" colSpan={5}>
                Total sisa {title.toLowerCase()}
              </TD>
              <TD className="text-right font-semibold text-ink-900">{formatRupiah(totalRemaining)}</TD>
            </TR>
          </>
        )}
      </tbody>
    </TableShell>
  );
}

function DebtSection({ payload }: { payload: ReportPayload }) {
  const overdueReceivable = payload.receivables.filter((row) => row.bucket !== "Belum jatuh tempo").reduce((s, r) => s + r.remaining, 0);
  const overduePayable = payload.payables.filter((row) => row.bucket !== "Belum jatuh tempo").reduce((s, r) => s + r.remaining, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total piutang berjalan"
          value={formatRupiah(payload.receivables.reduce((s, r) => s + r.remaining, 0))}
          tone="success"
        />
        <StatCard
          label="Total utang berjalan"
          value={formatRupiah(payload.payables.reduce((s, r) => s + r.remaining, 0))}
          tone="danger"
        />
        <StatCard label="Terlambat (piutang + utang)" value={formatRupiah(overdueReceivable + overduePayable)} />
      </div>
      <DebtTable title="Piutang" rows={payload.receivables} emptyText="Tidak ada piutang berjalan." />
      <DebtTable title="Utang" rows={payload.payables} emptyText="Tidak ada utang berjalan." />
    </div>
  );
}

function SalesSection({ payload }: { payload: ReportPayload }) {
  const totalAmount = payload.salesProducts.reduce((sum, row) => sum + row.amount, 0);
  const totalQty = payload.salesProducts.reduce((sum, row) => sum + row.qty, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Transaksi penjualan" value={`${formatNumber(payload.salesCount)} transaksi`} tone="brand" />
        <StatCard label="Unit terjual" value={`${formatNumber(totalQty)} unit`} />
        <StatCard label="Omzet produk" value={formatRupiah(totalAmount)} tone="success" />
      </div>

      <TableShell>
        <THead>
          <tr>
            <TH>Produk</TH>
            <TH className="text-right">Qty</TH>
            <TH className="text-right">Omzet</TH>
            <TH className="text-right">Kontribusi</TH>
          </tr>
        </THead>
        <tbody>
          {payload.salesProducts.length === 0 ? (
            <TR>
              <TD className="text-sm text-ink-500" colSpan={4}>
                Belum ada penjualan produk pada periode ini.
              </TD>
            </TR>
          ) : (
            payload.salesProducts.map((row) => (
              <TR key={row.name}>
                <TD className="font-medium text-ink-900">{row.name}</TD>
                <TD className="text-right text-sm">{formatNumber(row.qty)}</TD>
                <TD className="text-right">
                  <Money value={row.amount} strong />
                </TD>
                <TD className="text-right text-xs text-ink-500">
                  {formatNumber(Math.round((row.amount / Math.max(totalAmount, 1)) * 100))}%
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </TableShell>
    </div>
  );
}

function InventorySection({ payload }: { payload: ReportPayload }) {
  const { inventory } = payload;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Nilai persediaan (harga beli)" value={formatRupiah(inventory.totalValue)} tone="brand" />
        <StatCard label="Jenis produk" value={`${formatNumber(inventory.itemCount)} item`} />
        <StatCard label="Stok menipis" value={`${formatNumber(inventory.lowCount)} produk`} tone={inventory.lowCount ? "danger" : "success"} />
      </div>

      <TableShell>
        <THead>
          <tr>
            <TH>SKU</TH>
            <TH>Produk</TH>
            <TH className="text-right">Stok</TH>
            <TH className="text-right">Nilai</TH>
            <TH>Status</TH>
          </tr>
        </THead>
        <tbody>
          {inventory.items.map((row) => (
            <TR key={row.sku}>
              <TD className="font-mono text-xs">{row.sku}</TD>
              <TD className="font-medium text-ink-900">{row.name}</TD>
              <TD className="text-right text-sm">
                {formatNumber(row.stock)} <span className="text-xs text-ink-400">{row.unit}</span>
              </TD>
              <TD className="text-right">
                <Money value={row.value} />
              </TD>
              <TD>
                <Badge tone={row.low ? "warning" : "success"}>{row.low ? "Menipis" : "Aman"}</Badge>
              </TD>
            </TR>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}

export function ReportView({ payload }: { payload: ReportPayload }) {
  const { tab, range } = payload;
  const period = useMemo(() => `${range.from} s/d ${range.to}`, [range]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan"
        description={`Periode ${period} · ekspor PDF, Excel, atau cetak langsung dari browser.`}
        actions={<ExportButtons payload={payload} />}
      />

      <div className="no-print flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-ink-200 bg-white p-1">
          {tabs.map((item) => (
            <Link
              key={item}
              href={`/laporan?tab=${item}&from=${range.from}&to=${range.to}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === item ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              }`}
            >
              {tabLabels[item]}
            </Link>
          ))}
        </div>

        <form method="get" action="/laporan" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="tab" value={tab} />
          <Field label="Dari tanggal">
            <Input type="date" name="from" defaultValue={range.from} className="w-40" />
          </Field>
          <Field label="Sampai tanggal">
            <Input type="date" name="to" defaultValue={range.to} className="w-40" />
          </Field>
          <button type="submit" className={buttonClass("primary", "md")}>
            Terapkan
          </button>
        </form>
      </div>

      <div className="print-area space-y-4 rounded-card border border-line bg-surface p-5">
        <div className="hidden border-b border-ink-200 pb-4 print:block">
          <p className="text-lg font-bold text-ink-900">{payload.businessName}</p>
          <p className="text-sm text-ink-600">
            {tabLabels[tab]} — periode {period}
          </p>
        </div>

        {payload.cashBalance + payload.profitLoss.revenue + payload.inventory.totalValue === 0 &&
        payload.receivables.length === 0 &&
        payload.payables.length === 0 &&
        payload.salesProducts.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Belum ada data pada periode ini"
            description="Ubah rentang tanggal atau catat transaksi baru."
          />
        ) : tab === "labarugi" ? (
          <ProfitLossSection payload={payload} />
        ) : tab === "kas" ? (
          <CashSection payload={payload} />
        ) : tab === "piutang" ? (
          <DebtSection payload={payload} />
        ) : tab === "penjualan" ? (
          <SalesSection payload={payload} />
        ) : (
          <InventorySection payload={payload} />
        )}
      </div>
    </div>
  );
}
