import type { ReactNode } from "react";

type Tone = "brand" | "success" | "warning" | "danger" | "muted" | "info";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  success: "bg-success-50 text-success-700 ring-success-500/25",
  warning: "bg-warning-50 text-warning-700 ring-warning-500/25",
  danger: "bg-danger-50 text-danger-700 ring-danger-500/25",
  muted: "bg-ink-100 text-ink-600 ring-ink-200",
  info: "bg-ink-50 text-ink-700 ring-ink-200",
};

export function Badge({ children, tone = "muted", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
