"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const supabase = supabaseBrowser();
    if (supabase) {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: "/login" });
    }
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Lupa password</h1>
        <p className="mt-1 text-sm text-ink-500">
          Masukkan email terdaftar, kami kirim tautan pemulihan.
        </p>
      </div>

      {sent ? (
        <p className="rounded-lg bg-success-50 px-3 py-2 text-xs text-success-700">
          Jika email terdaftar, tautan pemulihan sudah dikirim. Periksa kotak masuk Anda.
        </p>
      ) : null}

      <Field label="Email" required>
        <Input
          type="email"
          required
          placeholder="nama@bisnis.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <Button type="submit" className="w-full">
        Kirim tautan pemulihan
      </Button>

      <p className="text-center text-sm text-ink-500">
        Ingat password?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Kembali masuk
        </Link>
      </p>
    </form>
  );
}
