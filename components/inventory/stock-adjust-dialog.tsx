"use client";

import { useState, type FormEvent } from "react";
import { adjustStock } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { Product } from "@/lib/types";
import { formatNumber } from "@/lib/format";

interface StockAdjustDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

export function StockAdjustDialog({ open, product, onClose }: StockAdjustDialogProps) {
  if (!open || !product) return null;
  return <StockAdjustInner key={product.id} product={product} onClose={onClose} />;
}

function StockAdjustInner({ product, onClose }: { product: Product; onClose: () => void }) {
  const [qtyChange, setQtyChange] = useState(0);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await adjustStock(product.id, qtyChange, reason);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onClose();
    } finally {
      setPending(false);
    }
  }

  const projected = product.stock + qtyChange;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Penyesuaian stok (opname)"
      description={`${product.name} · stok saat ini ${formatNumber(product.stock)} ${product.unit}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="adjust-form" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan penyesuaian"}
          </Button>
        </>
      }
    >
      <form id="adjust-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}

        <Field label="Selisih stok" required hint="Angka positif untuk tambah, negatif untuk kurang">
          <Input
            type="number"
            required
            value={qtyChange}
            onChange={(event) => setQtyChange(Number(event.target.value))}
            placeholder="Contoh: -3"
          />
        </Field>

        <Field label="Alasan" required>
          <Textarea
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Contoh: hasil opname akhir pekan / rusak / hilang"
          />
        </Field>

        <p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">
          Stok setelah penyesuaian:{" "}
          <span className={`font-semibold ${projected < 0 ? "text-danger-700" : "text-ink-900"}`}>
            {formatNumber(projected)}
          </span>{" "}
          {product?.unit}
        </p>
      </form>
    </Dialog>
  );
}
