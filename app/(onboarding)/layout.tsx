import type { ReactNode } from "react";
import Link from "next/link";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-4 py-10">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          U
        </span>
        <span className="text-sm font-semibold text-ink-900">Pembukuan UMKM</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
