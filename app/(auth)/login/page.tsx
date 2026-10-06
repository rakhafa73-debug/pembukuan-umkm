"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const supabaseEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      if (supabaseEnabled) {
        const supabase = supabaseBrowser();
        const { error: signInError } = await supabase!.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError("Email atau password salah");
          return;
        }
      }
      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Masuk ke akun Anda</h1>
        <p className="mt-1 text-sm text-ink-500">
          {supabaseEnabled
            ? "Gunakan email terdaftar untuk melanjutkan."
            : "Mode demo aktif — tanpa Supabase, tekan Masuk untuk melihat aplikasi."}
        </p>
      </div>

      {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}

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

      <Field label="Password" required>
        <Input
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Masuk"}
      </Button>

      <p className="text-center text-sm text-ink-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Daftar bisnis baru
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
