"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Landmark, Plus } from "lucide-react";
import { saveBankAccount } from "@/lib/actions";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonClass, Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/page";
import { TableShell, TD, TH, THead, TR } from "@/components/ui/table";
import type { AccountType, BankAccount } from "@/lib/types";

const typeTone: Record<AccountType, "brand" | "info" | "warning"> = {
  BANK: "brand",
  CASH: "info",
  EWALLET: "warning",
};

const typeLabel: Record<AccountType, string> = {
  BANK: "Bank",
  CASH: "Tunai",
  EWALLET: "E-Wallet",
};

export function BankAccountsApp({ accounts }: { accounts: BankAccount[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  const total = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Card className="px-4 py-3">
          <p className="text-xs text-ink-500">Total saldo seluruh akun</p>
          <p className="text-lg font-semibold text-brand-700">{formatRupiah(total)}</p>
        </Card>
        <button
          type="button"
          className={buttonClass("primary", "md")}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Tambah akun
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Belum ada akun keuangan"
          description="Tambahkan rekening bank, kas, atau e-wallet untuk transaksi."
        />
      ) : (
        <TableShell>
          <THead>
            <tr>
              <TH>Nama akun</TH>
              <TH>Jenis</TH>
              <TH className="text-right">Saldo awal</TH>
              <TH className="text-right">Saldo saat ini</TH>
              <TH className="text-right">Aksi</TH>
            </tr>
          </THead>
          <tbody>
            {accounts.map((account) => (
              <TR key={account.id}>
                <TD className="font-medium text-ink-900">{account.name}</TD>
                <TD>
                  <Badge tone={typeTone[account.type]}>{typeLabel[account.type]}</Badge>
                </TD>
                <TD className="text-right text-sm text-ink-500">{formatRupiah(account.openingBalance)}</TD>
                <TD className="text-right text-sm font-semibold text-ink-900">{formatRupiah(account.balance)}</TD>
                <TD className="text-right">
                  <button
                    type="button"
                    className={buttonClass("ghost", "sm")}
                    onClick={() => {
                      setEditing(account);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                </TD>
              </TR>
            ))}
          </tbody>
        </TableShell>
      )}

      {open ? <AccountDialog key={editing?.id ?? "new"} editing={editing} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function AccountDialog({ editing, onClose }: { editing: BankAccount | null; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(() =>
    editing
      ? { name: editing.name, type: editing.type, openingBalance: editing.openingBalance }
      : { name: "", type: "BANK" as AccountType, openingBalance: 0 },
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await saveBankAccount({ id: editing?.id, ...form });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onClose();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? "Edit akun" : "Tambah akun"}
      description="Saldo awal akan disesuaikan saat menyimpan perubahan."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="account-form" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
    >
      <form id="account-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}
        <Field label="Nama akun" required>
          <Input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Mis. BCA Operasional"
          />
        </Field>
        <Field label="Jenis" required>
          <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AccountType })}>
            <option value="BANK">Bank</option>
            <option value="CASH">Tunai</option>
            <option value="EWALLET">E-Wallet</option>
          </Select>
        </Field>
        <Field label="Saldo awal" hint="Isi 0 bila tidak perlu penyesuaian.">
          <Input
            type="number"
            value={form.openingBalance}
            onChange={(event) => setForm({ ...form, openingBalance: Number(event.target.value) })}
          />
        </Field>
      </form>
    </Dialog>
  );
}
