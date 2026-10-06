"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveCashTransaction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { BankAccount, Category, Party, TxType } from "@/lib/types";
import { toISODate } from "@/lib/format";

interface CashFormProps {
  type: Extract<TxType, "INCOME" | "EXPENSE">;
  categories: Category[];
  accounts: BankAccount[];
  parties: Party[];
}

export function CashForm({ type, categories, accounts, parties }: CashFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const income = type === "INCOME";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setPending(true);
    try {
      const result = await saveCashTransaction({
        type,
        amount: Number(data.get("amount")),
        categoryId: String(data.get("categoryId") || ""),
        bankAccountId: String(data.get("bankAccountId") || ""),
        partyId: String(data.get("partyId") || "") || null,
        notes: String(data.get("notes") || ""),
        date: String(data.get("date") || toISODate(new Date())),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/transaksi");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}

          <Field label="Nominal" required>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">
                Rp
              </span>
              <Input
                name="amount"
                type="number"
                min={1}
                required
                placeholder="0"
                className="h-12 pl-9 text-lg font-semibold"
              />
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori" required>
              <Select name="categoryId" required defaultValue="">
                <option value="" disabled>
                  Pilih kategori
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Sumber dana" required>
              <Select name="bankAccountId" required defaultValue={accounts[0]?.id ?? ""}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tanggal" required>
              <Input name="date" type="date" required defaultValue={toISODate(new Date())} />
            </Field>

            <Field label={income ? "Pihak penerima (opsional)" : "Pihak penerima/pemberi (opsional)"}>
              <Select name="partyId" defaultValue="">
                <option value="">— Tanpa pihak —</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Catatan">
            <Textarea
              name="notes"
              placeholder={income ? "Contoh: setoran marketplace" : "Contoh: beli gas LPG"}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => router.back()}>
              Batal
            </Button>
            <Button type="submit" variant={income ? "success" : "danger"} disabled={pending}>
              {pending ? "Menyimpan…" : income ? "Simpan kas masuk" : "Simpan kas keluar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
