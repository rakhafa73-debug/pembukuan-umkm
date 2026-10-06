import type { ReactNode } from "react";

export function TableShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-card border border-line bg-surface ${className}`}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-ink-50 text-[11px] uppercase tracking-wide text-ink-500">{children}</thead>;
}

export function TH({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}

export function TR({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`border-t border-line hover:bg-ink-50/60 ${className}`}>{children}</tr>;
}

export function TD({ children, className = "", colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td className={`px-4 py-3 align-middle text-ink-700 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
