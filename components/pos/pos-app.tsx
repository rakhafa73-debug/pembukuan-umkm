"use client";

import { Minus, Plus, Printer, Search, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createSale } from "@/lib/actions";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import type { BankAccount, Category, Party, PaymentMethod, Product } from "@/lib/types";

interface CartLine {
  productId: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  qty: number;
  discount: number;
}

interface ReceiptData {
  invoiceNo: string;
  date: string;
  lines: CartLine[];
  discount: number;
  total: number;
  method: PaymentMethod;
  received: number;
  change: number;
  customer: string;
}

const METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Tunai" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "QRIS", label: "QRIS" },
  { value: "TEMPO", label: "Tempo" },
];

export function PosApp({
  products,
  categories,
  parties,
  accounts,
  canOverrideStock,
  businessName,
}: {
  products: Product[];
  categories: Category[];
  parties: Party[];
  accounts: BankAccount[];
  canOverrideStock: boolean;
  businessName: string;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [partyId, setPartyId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [received, setReceived] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [override, setOverride] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((product) => (categoryId === "all" ? true : product.categoryId === categoryId))
      .filter((product) => (q ? product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q) : true));
  }, [products, query, categoryId]);

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty - line.discount, 0);
  const total = Math.max(subtotal - discount, 0);
  const change = method === "CASH" ? Math.max(received - total, 0) : 0;

  function addProduct(product: Product) {
    setError("");
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id ? { ...line, qty: line.qty + 1 } : line,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          price: product.sellPrice,
          stock: product.stock,
          qty: 1,
          discount: 0,
        },
      ];
    });
  }

  function updateQty(productId: string, delta: number) {
    setLines((current) =>
      current
        .map((line) => (line.productId === productId ? { ...line, qty: Math.max(line.qty + delta, 0) } : line))
        .filter((line) => line.qty > 0),
    );
  }

  function removeLine(productId: string) {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }

  function reset() {
    setLines([]);
    setDiscount(0);
    setReceived(0);
    setNotes("");
    setMethod("CASH");
    setPartyId("");
    setError("");
    setOverride(false);
  }

  async function handlePay() {
    setError("");
    if (lines.length === 0) {
      setError("Keranjang masih kosong");
      return;
    }
    if (method === "CASH" && received < total) {
      setError("Uang diterima kurang dari total belanja");
      return;
    }
    if (method === "TEMPO" && !partyId) {
      setError("Penjualan tempo harus menyertakan pelanggan");
      return;
    }

    setPending(true);
    try {
      const result = await createSale({
        lines: lines.map((line) => ({ productId: line.productId, qty: line.qty, discount: line.discount })),
        discount,
        paymentMethod: method,
        bankAccountId: accountId,
        partyId: partyId || null,
        notes,
        allowStockOverride: override,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setReceipt({
        invoiceNo: result.invoiceNo ?? "-",
        date: new Date().toISOString(),
        lines,
        discount,
        total,
        method,
        received,
        change,
        customer: parties.find((p) => p.id === partyId)?.name ?? "Umum",
      });
      reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari produk atau SKU…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              categoryId === "all" ? "bg-ink-900 text-white" : "border border-ink-200 bg-white text-ink-600"
            }`}
          >
            Semua
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                categoryId === category.id ? "bg-ink-900 text-white" : "border border-ink-200 bg-white text-ink-600"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => {
            const out = product.stock <= 0;
            return (
              <button
                key={product.id}
                type="button"
                disabled={out}
                onClick={() => addProduct(product)}
                className={`rounded-card border bg-white p-4 text-left transition-shadow hover:shadow-md ${
                  out ? "cursor-not-allowed border-line opacity-50" : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-ink-900">{product.name}</span>
                  <span className="font-mono text-[10px] text-ink-400">{product.sku}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-brand-700">{formatRupiah(product.sellPrice)}</p>
                <p className="mt-1 text-[11px] text-ink-400">
                  Stok {product.stock} {product.unit}
                  {product.stock <= product.minStock ? <span className="text-warning-700"> · menipis</span> : null}
                </p>
              </button>
            );
          })}
          {visible.length === 0 ? (
            <p className="col-span-full rounded-card border border-dashed border-ink-200 bg-white px-4 py-8 text-center text-sm text-ink-500">
              Produk tidak ditemukan.
            </p>
          ) : null}
        </div>
      </div>

      <Card className="flex h-fit flex-col lg:col-span-2 lg:sticky lg:top-20">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <ShoppingBag className="h-4 w-4 text-brand-600" /> Keranjang
            </h2>
            <p className="text-xs text-ink-500">{lines.length} item berbeda</p>
          </div>
          {lines.length > 0 ? (
            <button type="button" onClick={reset} className="text-xs font-medium text-ink-500 hover:text-danger-600">
              Kosongkan
            </button>
          ) : null}
        </div>

        <div className="max-h-[40vh] space-y-3 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <p className="py-8 text-center text-xs text-ink-500">
              Klik produk di sebelah kiri untuk menambahkannya ke keranjang.
            </p>
          ) : (
            lines.map((line) => (
              <div key={line.productId} className="rounded-xl border border-line bg-ink-50/60 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink-900">{line.name}</p>
                    <p className="text-[11px] text-ink-500">
                      {formatRupiah(line.price)} × {line.qty} = {formatRupiah(line.price * line.qty)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId)}
                    className="rounded-md p-1 text-ink-400 hover:bg-white hover:text-danger-600"
                    aria-label={`Hapus ${line.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white">
                    <button
                      type="button"
                      onClick={() => updateQty(line.productId, -1)}
                      className="px-2 py-1 text-ink-500 hover:text-ink-900"
                      aria-label="Kurangi"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-semibold text-ink-900">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(line.productId, 1)}
                      className="px-2 py-1 text-ink-500 hover:text-ink-900"
                      aria-label="Tambah"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={line.discount}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item) =>
                          item.productId === line.productId
                            ? { ...item, discount: Math.max(Number(event.target.value), 0) }
                            : item,
                        ),
                      )
                    }
                    placeholder="Diskon"
                    className="h-7 w-24 rounded-lg border border-ink-200 bg-white px-2 text-right text-xs"
                    aria-label={`Diskon ${line.name}`}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t border-line px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pelanggan">
              <Select value={partyId} onChange={(event) => setPartyId(event.target.value)}>
                <option value="">Umum</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sumber dana">
              <Select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-700">Metode pembayaran</p>
            <div className="grid grid-cols-4 gap-1.5">
              {METHODS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMethod(item.value)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium ${
                    method === item.value
                      ? "bg-brand-600 text-white"
                      : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Diskon total">
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(event) => setDiscount(Math.max(Number(event.target.value), 0))}
              />
            </Field>
            {method === "CASH" ? (
              <Field label="Uang diterima">
                <Input
                  type="number"
                  min={0}
                  value={received || ""}
                  onChange={(event) => setReceived(Number(event.target.value))}
                  placeholder="0"
                />
              </Field>
            ) : (
              <Field label="Catatan">
                <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opsional" />
              </Field>
            )}
          </div>

          {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}

          {error.toLowerCase().includes("stok") && canOverrideStock ? (
            <label className="flex items-center gap-2 text-xs text-ink-600">
              <input type="checkbox" checked={override} onChange={(event) => setOverride(event.target.checked)} />
              Lewati validasi stok (Admin/Owner)
            </label>
          ) : null}

          <div className="space-y-1 border-t border-dashed border-ink-200 pt-3 text-sm">
            <div className="flex justify-between text-ink-500">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>Diskon</span>
              <span>-{formatRupiah(discount)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink-900">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>
            {method === "CASH" && received > 0 ? (
              <div className="flex justify-between text-ink-500">
                <span>Kembalian</span>
                <span>{formatRupiah(change)}</span>
              </div>
            ) : null}
          </div>

          <Button className="w-full" size="lg" onClick={handlePay} disabled={pending || lines.length === 0}>
            {pending ? "Memproses…" : `Bayar ${formatRupiah(total)}`}
          </Button>
        </div>
      </Card>

      <Dialog
        open={Boolean(receipt)}
        title="Struk penjualan"
        onClose={() => setReceipt(null)}
        size="sm"
        footer={
          receipt ? (
            <>
              <Button variant="outline" onClick={() => setReceipt(null)}>
                Transaksi baru
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Cetak struk
              </Button>
            </>
          ) : null
        }
      >
        {receipt ? (
          <div className="print-area rounded-lg border border-dashed border-ink-200 bg-white p-4 font-mono text-xs text-ink-900">
            <div className="text-center">
              <p className="text-sm font-bold">{businessName}</p>
              <p className="text-[11px] text-ink-500">Terima kasih atas kunjungan Anda</p>
            </div>
            <div className="my-2 border-t border-dashed border-ink-300" />
            <div className="space-y-0.5 text-[11px]">
              <p>No. {receipt.invoiceNo}</p>
              <p>{formatDateTime(receipt.date)}</p>
              <p>Pelanggan: {receipt.customer}</p>
            </div>
            <div className="my-2 border-t border-dashed border-ink-300" />
            <ul className="space-y-1">
              {receipt.lines.map((line) => (
                <li key={line.productId} className="flex justify-between gap-2">
                  <span>
                    {line.name}
                    <br />
                    {line.qty} {line.unit} × {formatRupiah(line.price)}
                    {line.discount > 0 ? ` (-${formatRupiah(line.discount)})` : ""}
                  </span>
                  <span>{formatRupiah(line.price * line.qty - line.discount)}</span>
                </li>
              ))}
            </ul>
            <div className="my-2 border-t border-dashed border-ink-300" />
            {receipt.discount > 0 ? (
              <div className="flex justify-between">
                <span>Diskon</span>
                <span>-{formatRupiah(receipt.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span>{formatRupiah(receipt.total)}</span>
            </div>
            <div className="mt-1 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Bayar ({receipt.method})</span>
                <span>{formatRupiah(receipt.method === "CASH" ? receipt.received : receipt.total)}</span>
              </div>
              {receipt.method === "CASH" ? (
                <div className="flex justify-between">
                  <span>Kembali</span>
                  <span>{formatRupiah(receipt.change)}</span>
                </div>
              ) : null}
            </div>
            <div className="my-2 border-t border-dashed border-ink-300" />
            <p className="text-center text-[10px] text-ink-500">
              Dicetak oleh Pembukuan UMKM · Simpan struk ini sebagai bukti
            </p>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
