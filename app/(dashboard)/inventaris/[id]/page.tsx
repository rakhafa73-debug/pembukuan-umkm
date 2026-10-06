import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { getProduct, listCategories, listStockMovements } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { TableShell, TD, TH, THead, TR } from "@/components/ui/table";

const moveLabel: Record<string, string> = {
  IN: "Masuk",
  OUT: "Keluar",
  ADJUSTMENT: "Penyesuaian",
  OPENING: "Saldo awal",
};

export default async function ProductDetailPage({ params }: PageProps<"/inventaris/[id]">) {
  await requireSession();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [categories, movements] = await Promise.all([
    listCategories("PRODUCT"),
    listStockMovements(product.id),
  ]);
  const category = categories.find((item) => item.id === product.categoryId)?.name ?? "-";
  const low = product.stock <= product.minStock;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/inventaris"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke inventaris
        </Link>
      </div>

      <PageHeader
        title={product.name}
        description={`SKU ${product.sku} · Barcode ${product.barcode || "-"} · ${category}`}
        actions={<Badge tone={low ? "warning" : "success"}>{low ? "Stok menipis" : "Stok aman"}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-ink-500">Stok saat ini</p>
          <p className={`mt-1 text-xl font-semibold ${low ? "text-warning-700" : "text-ink-900"}`}>
            {formatNumber(product.stock)}{" "}
            <span className="text-sm font-normal text-ink-400">{product.unit}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-500">Stok minimum</p>
          <p className="mt-1 text-xl font-semibold text-ink-900">{formatNumber(product.minStock)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-500">Harga jual</p>
          <p className="mt-1 text-xl font-semibold text-brand-700">{formatRupiah(product.sellPrice)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-500">Harga beli</p>
          <p className="mt-1 text-xl font-semibold text-ink-900">{formatRupiah(product.costPrice)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kartu stok</CardTitle>
          <span className="text-xs text-ink-500">{movements.length} riwayat</span>
        </CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Package} title="Belum ada pergerakan" description="Riwayat stok akan muncul di sini." />
            </div>
          ) : (
            <TableShell className="border-0">
              <THead>
                <tr>
                  <TH>Tanggal</TH>
                  <TH>Tipe</TH>
                  <TH>Referensi</TH>
                  <TH>Keterangan</TH>
                  <TH className="text-right">Perubahan</TH>
                  <TH className="text-right">Sisa stok</TH>
                </tr>
              </THead>
              <tbody>
                {movements.map((movement) => (
                  <TR key={movement.id}>
                    <TD className="whitespace-nowrap text-xs">{formatDate(movement.date)}</TD>
                    <TD>
                      <Badge
                        tone={
                          movement.type === "IN"
                            ? "success"
                            : movement.type === "OUT"
                              ? "danger"
                              : movement.type === "ADJUSTMENT"
                                ? "warning"
                                : "muted"
                        }
                      >
                        {moveLabel[movement.type]}
                      </Badge>
                    </TD>
                    <TD className="font-mono text-xs">{movement.reference}</TD>
                    <TD className="text-xs">{movement.reason}</TD>
                    <TD
                      className={`text-right text-sm font-semibold ${
                        movement.qtyChange >= 0 ? "text-success-700" : "text-danger-700"
                      }`}
                    >
                      {movement.qtyChange >= 0 ? "+" : ""}
                      {movement.qtyChange}
                    </TD>
                    <TD className="text-right text-sm text-ink-700">{movement.stockAfter}</TD>
                  </TR>
                ))}
              </tbody>
            </TableShell>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
