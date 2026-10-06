"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { payDebt } from "@/lib/actions";
import { formatRupiah, toISODate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import type { BankAccount, Debt, Party } from "@/lib/types";

interface DebtPayDialogProps {
  debt: Debt | null;
  party: Party | null;
  accounts: BankAccount[];
  onClose: () => void;
}

export function DebtPayDialog({ debt, party, accounts, onClose }: DebtPayDialogProps) {
  if (!debt) return null;
  return <DebtPayInner key={debt.id} debt={debt} party={party} accounts={accounts} onClose={onClose} />;
}

function DebtPayInner({ debt, party, accounts, onClose }: Omit<DebtPayDialogProps, "debt"> & { debt: Debt }) {
  const router = useRouter();
  const outstanding = debt.total - debt.paid;
  const [amount, setAmount] = useState(outstanding);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await payDebt(debt.id, amount, accountId, notes);
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

  const isReceivable = debt.type === "RECEIVABLE";

  return (
    <Dialog
      open
      onClose={onClose}
      title={isReceivable ? "Terima piutang" : "Bayar utang"}
      description={party ? `${party.name} · sisa ${formatRupiah(outstanding)}` : ""}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="debt-form" disabled={pending} variant={isReceivable ? "success" : "danger"}>
            {pending ? "Menyimpan…" : "Simpan pembayaran"}
          </Button>
        </>
      }
    >
      <form id="debt-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}
        <Field label="Nominal" required>
          <Input
            type="number"
            min={1}
            max={outstanding}
            required
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </Field>
        <Field label="Sumber / tujuan dana" required>
          <Select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Catatan">
          <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opsional" />
        </Field>
        <p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">
          Tanggal: {toISODate(new Date())} · sisa tagihan setelah pembayaran{" "}
          <span className="font-semibold">{formatRupiah(Math.max(outstanding - amount, 0))}</span>
        </p>
      </form>
    </Dialog>
  );
}
