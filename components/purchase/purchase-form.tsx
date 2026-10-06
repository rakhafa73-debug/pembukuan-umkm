"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createPurchase } from "@/lib/actions";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { BankAccount, Party, PaymentMethod, Product } from "@/lib/types";

interface DraftLine {
  productId: string;
  qty: number;
  unitCost: number;
}

export function PurchaseForm({
  products,
  suppliers,
  accounts,
}: {
  products: Product[];
  suppliers: Party[];
  accounts: BankAccount[];
}) {
  const router = useRouter();
  const [partyId, setPartyId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("TRANSFER");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const total = lines.reduce((sum, line) => sum + line.qty * line.unitCost, 0);

  function addLine() {
    const product = products[0];
    if (!product) return;
    setLines((current) => [...current, { productId: product.id, qty: 1, unitCost: product.costPrice }]);
  }

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!partyId) {
      setError("Pilih pemasok terlebih dahulu");
      return;
    }
    if (lines.length === 0) {
      setError("Tambahkan minimal satu item");
      return;
    }
    setPending(true);
    try {
      const result = await createPurchase({
        partyId,
        lines,
        paymentMethod: method,
        bankAccountId: accountId,
        notes,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setLines([]);
      setNotes("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form pembelian (restok)</CardTitle>
        <Button variant="outline" size="sm" onClick={addLine} disabled={products.length === 0}>
          <Plus className="h-3.5 w-3.5" /> Tambah item
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pemasok" required>
              <Select value={partyId} onChange={(event) => setPartyId(event.target.value)} required>
                <option value="" disabled>
                  Pilih pemasok
                </option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sumber dana" required>
              <Select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="space-y-3">
            {lines.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-500">
                Belum ada item. Klik “Tambah item”.
              </p>
            ) : (
              lines.map((line, index) => {
                const product = products.find((p) => p.id === line.productId);
                return (
                  <div key={index} className="grid items-end gap-3 rounded-xl border border-line bg-ink-50/60 p-3 sm:grid-cols-12">
                    <div className="sm:col-span-5">
                      <Field label="Produk">
                        <Select
                          value={line.productId}
                          onChange={(event) => {
                            const next = products.find((p) => p.id === event.target.value);
                            updateLine(index, { productId: event.target.value, unitCost: next?.costPrice ?? 0 });
                          }}
                        >
                          {products.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Qty">
                        <Input
                          type="number"
                          min={1}
                          value={line.qty}
                          onChange={(event) => updateLine(index, { qty: Number(event.target.value) })}
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-3">
                      <Field label="Harga beli">
                        <Input
                          type="number"
                          min={0}
                          value={line.unitCost}
                          onChange={(event) => updateLine(index, { unitCost: Number(event.target.value) })}
                        />
                      </Field>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:col-span-2">
                      <span className="text-xs font-semibold text-ink-800">
                        {formatRupiah(line.qty * line.unitCost)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                        className="rounded-md p-1.5 text-ink-400 hover:bg-white hover:text-danger-600"
                        aria-label={`Hapus ${product?.name ?? "item"}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status pembayaran">
              <div className="flex gap-1.5">
                {(["TRANSFER", "TEMPO"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium ${
                      method === value
                        ? "bg-brand-600 text-white"
                        : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    {value === "TRANSFER" ? "Bayar sekarang (Lunas)" : "Tempo (Utang)"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Catatan">
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opsional" />
            </Field>
          </div>

          <div className="flex items-center justify-between border-t border-dashed border-ink-200 pt-4">
            <div>
              <p className="text-xs text-ink-500">Total pembelian</p>
              <p className="text-lg font-semibold text-ink-900">{formatRupiah(total)}</p>
            </div>
            <Button type="submit" disabled={pending || lines.length === 0}>
              {pending ? "Menyimpan…" : "Simpan pembelian"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
