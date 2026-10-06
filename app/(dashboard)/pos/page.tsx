import { listBankAccounts, listCategories, listParties, listProducts } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { PosApp } from "@/components/pos/pos-app";
import { PageHeader } from "@/components/ui/page";

export default async function PosPage() {
  const session = await requireSession();
  const [products, categories, parties, accounts] = await Promise.all([
    listProducts(),
    listCategories("PRODUCT"),
    listParties("CUSTOMER"),
    listBankAccounts(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kasir (POS)"
        description="Pilih produk, tentukan pembayaran, lalu cetak struk."
      />
      <PosApp
        products={products}
        categories={categories}
        parties={parties}
        accounts={accounts}
        canOverrideStock={session.role !== "staff"}
        businessName={session.business.name}
      />
    </div>
  );
}
