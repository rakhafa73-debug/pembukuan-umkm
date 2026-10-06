"use client";

import { useState, type FormEvent } from "react";
import { updateBusiness } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import type { AppSession } from "@/lib/types";

const categories = ["Kuliner", "Retail", "Fashion", "Jasa", "Pertanian", "Kerajinan", "Lainnya"];

export function BusinessForm({ session }: { session: AppSession }) {
  const [name, setName] = useState(session.business.name);
  const [ownerName, setOwnerName] = useState(session.business.ownerName);
  const [category, setCategory] = useState(session.business.category);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    try {
      const result = await updateBusiness({ name, ownerName, category });
      if (result.ok) setMessage(result.message);
      else setError(result.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Profil bisnis</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}
            {message ? <p className="rounded-lg bg-success-50 px-3 py-2 text-xs text-success-700">{message}</p> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama usaha" required>
                <Input required value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Field label="Nama pemilik" required>
                <Input required value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
              </Field>
            </div>
            <Field label="Kategori usaha">
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan…" : "Simpan perubahan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Akun Anda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-ink-500">Nama</p>
            <p className="font-medium text-ink-900">{session.user.name}</p>
          </div>
          <div>
            <p className="text-xs text-ink-500">Email</p>
            <p className="font-medium text-ink-900">{session.user.email}</p>
          </div>
          <div>
            <p className="text-xs text-ink-500">Role</p>
            <p className="font-medium capitalize text-ink-900">{session.role}</p>
          </div>
          <div>
            <p className="text-xs text-ink-500">Bergabung</p>
            <p className="font-medium text-ink-900">{session.business.createdAt || "-"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
