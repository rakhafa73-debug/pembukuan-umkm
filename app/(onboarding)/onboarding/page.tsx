"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveBusiness } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

const CATEGORIES = [
  "Makanan & Minuman",
  "Retail",
  "Jasa",
  "Dagang",
  "Pertanian & Peternakan",
  "Fashion",
  "Lainnya",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await saveBusiness({ ownerName, name: businessName, category });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-card border border-line bg-white p-6 shadow-sm">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Langkah 2 dari 2</span>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">Lengkapi profil usaha</h1>
        <p className="mt-1 text-sm text-ink-500">Data ini dipakai pada struk, laporan, dan dashboard Anda.</p>
      </div>

      {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}

      <Field label="Nama pemilik" required>
        <Input
          required
          placeholder="Contoh: Raka Fahlevi"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
        />
      </Field>

      <Field label="Nama usaha" required>
        <Input
          required
          placeholder="Contoh: Kedai Berkah Jaya"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
        />
      </Field>

      <Field label="Kategori bisnis" required>
        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyimpan…" : "Masuk ke dashboard"}
      </Button>
    </form>
  );
}
