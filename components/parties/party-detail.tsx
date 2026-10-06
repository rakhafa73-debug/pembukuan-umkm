"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableShell, TD, TH, THead, TR } from "@/components/ui/table";
import { DebtPayDialog } from "@/components/parties/debt-pay-dialog";
import { formatDate, formatRupiah } from "@/lib/format";
import type { BankAccount, Debt, Party, Transaction } from "@/lib/types";

export function PartyDetail({
  party,
  debts,
  transactions,
  accounts,
}: {
  party: Party;
  debts: Debt[];
  transactions: Transaction[];
  accounts: BankAccount[];
}) {
  const [paying, setPaying] = useState<Debt | null>(null);

  const receivable = debts
    .filter((debt) => debt.type === "RECEIVABLE" && debt.status !== "PAID")
    .reduce((sum, debt) => sum + (debt.total - debt.paid), 0);
  const payable = debts
    .filter((debt) => debt.type === "PAYABLE" && debt.status !== "PAID")
    .reduce((sum, debt) => sum + (debt.total - debt.paid), 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-ink-500">Sisa piutang (dari {party.name.split(" ")[0]})</p>
          <p className="mt-1 text-xl font-semibold text-success-700">{formatRupiah(receivable)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-500">Sisa utang (ke {party.name.split(" ")[0]})</p>
          <p className="mt-1 text-xl font-semibold text-danger-700">{formatRupiah(payable)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-500">Total transaksi tercatat</p>
          <p className="mt-1 text-xl font-semibold text-ink-900">{transactions.length}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kartu utang & piutang</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {debts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">
              Belum ada utang/piutang. Transaksi tempo akan otomatis tercatat di sini.
            </p>
          ) : (
            <TableShell className="border-0">
              <THead>
                <tr>
                  <TH>Jenis</TH>
                  <TH>Jatuh tempo</TH>
                  <TH className="text-right">Total</TH>
                  <TH className="text-right">Dibayar</TH>
                  <TH className="text-right">Sisa</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Aksi</TH>
                </tr>
              </THead>
              <tbody>
                {debts.map((debt) => {
                  const remaining = debt.total - debt.paid;
                  const overdue = debt.dueDate < new Date().toISOString().slice(0, 10) && debt.status !== "PAID";
                  return (
                    <TR key={debt.id}>
                      <TD>
                        <Badge tone={debt.type === "RECEIVABLE" ? "success" : "danger"}>
                          {debt.type === "RECEIVABLE" ? "Piutang" : "Utang"}
                        </Badge>
                      </TD>
                      <TD className={`whitespace-nowrap text-xs ${overdue ? "font-semibold text-danger-700" : ""}`}>
                        {formatDate(debt.dueDate)}
                      </TD>
                      <TD className="text-right text-sm">{formatRupiah(debt.total)}</TD>
                      <TD className="text-right text-sm text-ink-500">{formatRupiah(debt.paid)}</TD>
                      <TD className="text-right text-sm font-semibold">{formatRupiah(remaining)}</TD>
                      <TD>
                        <Badge tone={debt.status === "PAID" ? "success" : overdue ? "danger" : "warning"}>
                          {debt.status === "PAID" ? "Lunas" : overdue ? "Lewat tempo" : debt.status === "PARTIAL" ? "Sebagian" : "Berjalan"}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        {debt.status !== "PAID" ? (
                          <button
                            type="button"
                            className={buttonClass("outline", "sm")}
                            onClick={() => setPaying(debt)}
                          >
                            {debt.type === "RECEIVABLE" ? "Terima" : "Bayar"}
                          </button>
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </TableShell>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">Belum ada transaksi dengan pihak ini.</p>
          ) : (
            <TableShell className="border-0">
              <THead>
                <tr>
                  <TH>Tanggal</TH>
                  <TH>No. Invoice</TH>
                  <TH>Keterangan</TH>
                  <TH className="text-right">Nominal</TH>
                </tr>
              </THead>
              <tbody>
                {transactions.slice(0, 25).map((tx) => (
                  <TR key={tx.id}>
                    <TD className="whitespace-nowrap text-xs">{formatDate(tx.date)}</TD>
                    <TD className="font-mono text-xs">{tx.invoiceNo}</TD>
                    <TD className="text-xs">{tx.notes || tx.type}</TD>
                    <TD
                      className={`text-right text-sm font-semibold ${
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

      <DebtPayDialog debt={paying} party={party} accounts={accounts} onClose={() => setPaying(null)} />
    </div>
  );
}
