"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ProductsTable } from "@/components/inventory/products-table";
import { ProductFormDialog } from "@/components/inventory/product-form-dialog";
import { StockAdjustDialog } from "@/components/inventory/stock-adjust-dialog";
import type { Category, Product } from "@/lib/types";

export function InventoryApp({
  products,
  categories,
  canEdit,
  initialLow = false,
}: {
  products: Product[];
  categories: Category[];
  canEdit: boolean;
  initialLow?: boolean;
}) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canEdit ? (
          <button type="button" className={buttonClass("primary", "md")} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Tambah produk
          </button>
        ) : null}
      </div>

      <ProductsTable
        products={products}
        categories={categories}
        canEdit={canEdit}
        initialLow={initialLow}
        onEdit={(product) => setEditing(product)}
        onAdjust={(product) => setAdjusting(product)}
      />

      <ProductFormDialog
        open={createOpen || Boolean(editing)}
        product={editing}
        categories={categories}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
      />
      <StockAdjustDialog open={Boolean(adjusting)} product={adjusting} onClose={() => setAdjusting(null)} />
    </div>
  );
}
