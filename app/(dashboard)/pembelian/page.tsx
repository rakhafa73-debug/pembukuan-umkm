import { listBankAccounts, listParties, listProducts, listTransactions } from "@/lib/data";
import { requireRole, requireSession } from "@/lib/session";
import { formatDate, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableShell, TD, TH, THead, TR } from "@/components/ui/table";
import { PurchaseForm } from "@/components/purchase/purchase-form";

export default async function PurchasePage() {
  const session = await requireSession();
  requireRole(session, ["owner", "admin"]);

  const [products, suppliers, accounts, purchases] = await Promise.all([
    listProducts(),
    listParties("SUPPLIER"),
    listBankAccounts(),
    listTransactions({ type: "PURCHASE" }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pembelian"
        description="Restok barang dari pemasok — stok bertambah otomatis setelah disimpan."
      />

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <PurchaseForm products={products} suppliers={suppliers} accounts={accounts} />
        </div>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Riwayat pembelian</CardTitle>
            <Badge tone="muted">{purchases.length}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <TableShell className="border-0">
              <THead>
                <tr>
                  <TH>Tanggal</TH>
                  <TH>No. Invoice</TH>
                  <TH className="text-right">Nominal</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <tbody>
                {purchases.slice(0, 15).map((tx) => (
                  <TR key={tx.id}>
                    <TD className="whitespace-nowrap text-xs">{formatDate(tx.date)}</TD>
                    <TD className="font-mono text-xs">{tx.invoiceNo}</TD>
                    <TD className="whitespace-nowrap text-right text-sm font-semibold text-danger-700">
                      -{formatRupiah(tx.amount)}
                    </TD>
                    <TD>
                      {tx.paymentStatus === "UNPAID" ? (
                        <Badge tone="danger">Belum bayar</Badge>
                      ) : (
                        <Badge tone="success">Lunas</Badge>
                      )}
                    </TD>
                  </TR>
                ))}
                {purchases.length === 0 ? (
                  <TR>
                    <TD className="py-6 text-center text-xs text-ink-500">Belum ada pembelian.</TD>
                  </TR>
                ) : null}
              </tbody>
            </TableShell>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
