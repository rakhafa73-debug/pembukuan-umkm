"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Suspense } from "react";
import { Field, Input, Select } from "@/components/ui/field";
import type { Category } from "@/lib/types";

const TYPES: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "INCOME", label: "Kas Masuk" },
  { value: "EXPENSE", label: "Kas Keluar" },
  { value: "SALE", label: "Penjualan" },
  { value: "PURCHASE", label: "Pembelian" },
];

function Filters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/transaksi?${next.toString()}`);
  }

  const activeType = params.get("type") ?? "ALL";

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => update("type", type.value === "ALL" ? "" : type.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeType === type.value
                ? "bg-brand-600 text-white"
                : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <Field label="Cari">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              defaultValue={params.get("q") ?? ""}
              placeholder="No. invoice / keterangan"
              className="pl-9"
              onKeyDown={(event) => {
                if (event.key === "Enter") update("q", event.currentTarget.value);
              }}
              onBlur={(event) => update("q", event.target.value)}
            />
          </div>
        </Field>
        <Field label="Dari tanggal">
          <Input type="date" defaultValue={params.get("from") ?? ""} onBlur={(event) => update("from", event.target.value)} />
        </Field>
        <Field label="Sampai tanggal">
          <Input type="date" defaultValue={params.get("to") ?? ""} onBlur={(event) => update("to", event.target.value)} />
        </Field>
        <Field label="Kategori">
          <Select defaultValue={params.get("category") ?? ""} onChange={(event) => update("category", event.target.value)}>
            <option value="">Semua kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {[...params.keys()].length > 0 ? (
        <button
          type="button"
          onClick={() => router.replace("/transaksi")}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800"
        >
          <X className="h-3.5 w-3.5" /> Reset filter
        </button>
      ) : null}
    </div>
  );
}

export function TransactionFilters({ categories }: { categories: Category[] }) {
  return (
    <Suspense>
      <Filters categories={categories} />
    </Suspense>
  );
}
