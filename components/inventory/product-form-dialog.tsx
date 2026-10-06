"use client";

import { useState, type FormEvent } from "react";
import { saveProduct } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import type { Category, Product } from "@/lib/types";

interface ProductFormDialogProps {
  open: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}

export function ProductFormDialog({ open, product, categories, onClose }: ProductFormDialogProps) {
  if (!open) return null;
  return (
    <ProductFormInner key={product?.id ?? "new"} product={product} categories={categories} onClose={onClose} />
  );
}

function ProductFormInner({
  product,
  categories,
  onClose,
}: Omit<ProductFormDialogProps, "open">) {
  const [form, setForm] = useState(() =>
    product
      ? {
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          categoryId: product.categoryId,
          unit: product.unit,
          costPrice: product.costPrice,
          sellPrice: product.sellPrice,
          stock: product.stock,
          minStock: product.minStock,
        }
      : {
          name: "",
          sku: "",
          barcode: "",
          categoryId: categories[0]?.id ?? "",
          unit: "pcs",
          costPrice: 0,
          sellPrice: 0,
          stock: 0,
          minStock: 0,
        },
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await saveProduct({ id: product?.id, ...form });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={product ? "Edit produk" : "Tambah produk"}
      description={product ? `Perbarui data ${product.name}` : "Produk baru langsung muncul di katalog POS."}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="product-form" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan produk"}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama produk" required>
            <Input required value={form.name} onChange={(event) => set("name", event.target.value)} />
          </Field>
          <Field label="SKU" required>
            <Input required value={form.sku} onChange={(event) => set("sku", event.target.value)} placeholder="KM-001" />
          </Field>
          <Field label="Barcode">
            <Input value={form.barcode} onChange={(event) => set("barcode", event.target.value)} />
          </Field>
          <Field label="Kategori" required>
            <Select value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Satuan" required>
            <Input required value={form.unit} onChange={(event) => set("unit", event.target.value)} placeholder="pcs / kg / liter" />
          </Field>
          <Field label="Stok minimum">
            <Input
              type="number"
              min={0}
              value={form.minStock}
              onChange={(event) => set("minStock", Number(event.target.value))}
            />
          </Field>
          <Field label="Harga beli" required>
            <Input
              type="number"
              min={0}
              required
              value={form.costPrice}
              onChange={(event) => set("costPrice", Number(event.target.value))}
            />
          </Field>
          <Field label="Harga jual" required>
            <Input
              type="number"
              min={0}
              required
              value={form.sellPrice}
              onChange={(event) => set("sellPrice", Number(event.target.value))}
            />
          </Field>
          {!product ? (
            <Field label="Stok awal" required hint="Bisa disesuaikan lagi lewat menu penyesuaian stok">
              <Input
                type="number"
                min={0}
                required
                value={form.stock}
                onChange={(event) => set("stock", Number(event.target.value))}
              />
            </Field>
          ) : null}
        </div>
      </form>
    </Dialog>
  );
}
