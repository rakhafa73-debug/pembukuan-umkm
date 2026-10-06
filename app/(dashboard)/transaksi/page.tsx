import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";
import { listCategories, listParties, listTransactions } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { TableShell, TD, TH, THead, TR } from "@/components/ui/table";
import { TransactionFilters } from "@/components/transactions/filter-bar";
import type { TxType } from "@/lib/types";

const typeLabel: Record<TxType, string> = {
  INCOME: "Kas Masuk",
  EXPENSE: "Kas Keluar",
  SALE: "Penjualan",
  PURCHASE: "Pembelian",
};

const typeTone: Record<TxType, "success" | "danger" | "brand" | "warning"> = {
  INCOME: "success",
  EXPENSE: "danger",
  SALE: "brand",
  PURCHASE: "warning",
};

export default async function TransactionsPage({
  searchParams,
}: PageProps<"/transaksi">) {
  const session = await requireSession();
  const query = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const categories = await listCategories();
  const parties = await listParties();

  const type = (query.type as TxType | undefined) ?? "ALL";
  const transactions = await listTransactions({
    type: type === "ALL" ? "ALL" : type,
    from: one(query.from),
    to: one(query.to),
    q: one(query.q),
    categoryId: one(query.category),
  });

  const partyName = (id: string | null) => (id ? parties.find((p) => p.id === id)?.name ?? "-" : "-");
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "-";
  const canManage = session.role !== "staff";

  const totalIn = transactions.filter((t) => t.type === "INCOME" || t.type === "SALE").reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.type === "EXPENSE" || t.type === "PURCHASE").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kas Masuk & Keluar"
        description="Semua transaksi keuangan dalam satu tabel."
        actions={
          <>
            <Link href="/transaksi/baru?type=EXPENSE" className={buttonClass("outline", "md")}>
              Kas Keluar
            </Link>
            <Link href="/transaksi/baru?type=INCOME" className={buttonClass("primary", "md")}>
              <Plus className="h-4 w-4" /> Kas Masuk
            </Link>
          </>
        }
      />

      <TransactionFilters categories={categories} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-ink-500">Total uang masuk</p>
          <p className="mt-1 text-lg font-semibold text-success-700">{formatRupiah(totalIn)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-500">Total uang keluar</p>
          <p className="mt-1 text-lg font-semibold text-danger-700">{formatRupiah(totalOut)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-500">Selisih periode</p>
          <p className={`mt-1 text-lg font-semibold ${totalIn - totalOut >= 0 ? "text-success-700" : "text-danger-700"}`}>
            {formatRupiah(totalIn - totalOut)}
          </p>
        </Card>
      </div>

      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Tidak ada transaksi pada filter ini"
            description="Ubah filter atau catat transaksi baru."
            action={{ href: "/transaksi/baru?type=INCOME", label: "Catat transaksi" }}
          />
        ) : (
          <TableShell>
            <THead>
              <tr>
                <TH>Tanggal</TH>
                <TH>No. Invoice</TH>
                <TH>Tipe</TH>
                <TH>Kategori / Pihak</TH>
                <TH>Pembayaran</TH>
                <TH className="text-right">Nominal</TH>
                <TH className="text-right">Aksi</TH>
              </tr>
            </THead>
            <tbody>
              {transactions.slice(0, 100).map((tx) => (
                <TR key={tx.id}>
                  <TD className="whitespace-nowrap text-xs">{formatDate(tx.date)}</TD>
                  <TD className="whitespace-nowrap font-mono text-xs">{tx.invoiceNo}</TD>
                  <TD>
                    <Badge tone={typeTone[tx.type]}>{typeLabel[tx.type]}</Badge>
                  </TD>
                  <TD>
                    <p className="text-xs text-ink-700">{tx.notes || categoryName(tx.categoryId)}</p>
                    <p className="text-[11px] text-ink-400">{partyName(tx.partyId)}</p>
                  </TD>
                  <TD className="text-xs">
                    {tx.paymentMethod === "TEMPO" ? (
                      <Badge tone={tx.paymentStatus === "UNPAID" ? "danger" : "warning"}>Tempo</Badge>
                    ) : (
                      <span className="text-ink-500">{tx.paymentMethod}</span>
                    )}
                  </TD>
                  <TD
                    className={`whitespace-nowrap text-right text-sm font-semibold ${
                      tx.type === "EXPENSE" || tx.type === "PURCHASE" ? "text-danger-700" : "text-success-700"
                    }`}
                  >
                    {tx.type === "EXPENSE" || tx.type === "PURCHASE" ? "-" : "+"}
                    {formatRupiah(tx.amount)}
                  </TD>
                  <TD className="text-right text-xs">
                    {canManage ? <span className="text-ink-400">Detail</span> : <span className="text-ink-300">—</span>}
                  </TD>
                </TR>
              ))}
            </tbody>
          </TableShell>
        )}
      </CardContent>
    </div>
  );
}
