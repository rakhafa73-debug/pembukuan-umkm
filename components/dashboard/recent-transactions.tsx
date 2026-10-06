import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/page";
import { TableShell, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatRupiah } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

const typeLabel: Record<Transaction["type"], string> = {
  INCOME: "Kas Masuk",
  EXPENSE: "Kas Keluar",
  SALE: "Penjualan",
  PURCHASE: "Pembelian",
};

const typeTone: Record<Transaction["type"], "success" | "danger" | "brand" | "warning"> = {
  INCOME: "success",
  EXPENSE: "danger",
  SALE: "brand",
  PURCHASE: "warning",
};

export function RecentTransactions({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "-";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaksi terakhir</CardTitle>
        <Link href="/transaksi" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
          Lihat semua <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={ReceiptText}
              title="Belum ada transaksi"
              description="Mulai catat kas masuk atau penjualan pertama Anda."
              action={{ href: "/transaksi/baru?type=INCOME", label: "Catat kas masuk" }}
            />
          </div>
        ) : (
          <TableShell className="border-0">
            <THead>
              <tr>
                <TH>Tanggal</TH>
                <TH>Referensi</TH>
                <TH>Keterangan</TH>
                <TH className="text-right">Nominal</TH>
              </tr>
            </THead>
            <tbody>
              {transactions.map((tx) => (
                <TR key={tx.id}>
                  <TD className="whitespace-nowrap text-xs">{formatDate(tx.date)}</TD>
                  <TD className="whitespace-nowrap">
                    <span className="font-mono text-xs text-ink-500">{tx.invoiceNo}</span>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={typeTone[tx.type]}>{typeLabel[tx.type]}</Badge>
                      <span className="text-xs text-ink-500">{tx.notes || categoryName(tx.categoryId)}</span>
                    </div>
                  </TD>
                  <TD
                    className={`whitespace-nowrap text-right text-sm font-semibold ${
                      tx.type === "EXPENSE" || tx.type === "PURCHASE" ? "text-danger-700" : "text-success-700"
                    }`}
                  >
                    {tx.type === "EXPENSE" || tx.type === "PURCHASE" ? "-" : "+"}
                    {formatRupiah(tx.amount)}
                  </TD>
                </TR>
              ))}
            </tbody>
          </TableShell>
        )}
      </CardContent>
    </Card>
  );
}
