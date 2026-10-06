import { listCategories, listProducts } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { InventoryApp } from "@/components/inventory/inventory-app";
import { PageHeader } from "@/components/ui/page";

export default async function InventoryPage({
  searchParams,
}: PageProps<"/inventaris">) {
  const session = await requireSession();
  const query = await searchParams;
  const [products, categories] = await Promise.all([listProducts(), listCategories("PRODUCT")]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventaris"
        description={`${products.length} produk aktif · kelola harga, stok, dan kategori.`}
      />
      <InventoryApp
        products={products}
        categories={categories}
        canEdit={session.role !== "staff"}
        initialLow={query.low === "1"}
      />
    </div>
  );
}
