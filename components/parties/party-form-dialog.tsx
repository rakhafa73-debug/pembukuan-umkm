"use client";

import { useState, type FormEvent } from "react";
import { saveParty } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { Party, PartyType } from "@/lib/types";

interface PartyFormDialogProps {
  open: boolean;
  party: Party | null;
  defaultType?: PartyType;
  onClose: () => void;
}

export function PartyFormDialog({ open, party, defaultType = "CUSTOMER", onClose }: PartyFormDialogProps) {
  if (!open) return null;
  return <PartyFormInner key={party?.id ?? defaultType} party={party} defaultType={defaultType} onClose={onClose} />;
}

function PartyFormInner({
  party,
  defaultType,
  onClose,
}: Omit<PartyFormDialogProps, "open">) {
  const [form, setForm] = useState(() =>
    party
      ? {
          type: party.type,
          name: party.name,
          phone: party.phone,
          email: party.email,
          address: party.address,
          notes: party.notes,
        }
      : { type: defaultType as PartyType, name: "", phone: "", email: "", address: "", notes: "" },
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
      const result = await saveParty({ id: party?.id, ...form });
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
      title={party ? "Edit data pihak" : "Tambah pihak"}
      description="Pelanggan, pemasok, atau keduanya."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="party-form" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
    >
      <form id="party-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama" required>
            <Input required value={form.name} onChange={(event) => set("name", event.target.value)} />
          </Field>
          <Field label="Jenis" required>
            <Select value={form.type} onChange={(event) => set("type", event.target.value as PartyType)}>
              <option value="CUSTOMER">Pelanggan</option>
              <option value="SUPPLIER">Pemasok</option>
              <option value="BOTH">Pelanggan & Pemasok</option>
            </Select>
          </Field>
          <Field label="No. HP">
            <Input value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="08xx-xxxx-xxxx" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
          </Field>
        </div>
        <Field label="Alamat">
          <Input value={form.address} onChange={(event) => set("address", event.target.value)} />
        </Field>
        <Field label="Catatan">
          <Textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} />
        </Field>
      </form>
    </Dialog>
  );
}
