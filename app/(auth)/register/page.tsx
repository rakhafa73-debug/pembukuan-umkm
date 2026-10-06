"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const supabaseEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    setPending(true);
    try {
      if (supabaseEnabled) {
        const supabase = supabaseBrowser();
        const { error: signUpError } = await supabase!.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
      }
      router.push("/onboarding");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Daftarkan bisnis Anda</h1>
        <p className="mt-1 text-sm text-ink-500">Langkah 1 dari 2 — buat akun, lalu lengkapi profil usaha.</p>
      </div>

      {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}

      <Field label="Nama lengkap" required>
        <Input
          autoComplete="name"
          required
          placeholder="Nama Anda"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>

      <Field label="Email" required>
        <Input
          type="email"
          autoComplete="email"
          required
          placeholder="nama@bisnis.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <Field label="Password" required hint="Minimal 8 karakter">
        <Input
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Lanjut ke profil usaha"}
      </Button>

      <p className="text-center text-sm text-ink-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Masuk
        </Link>
      </p>
    </form>
  );
}
