import Link from "next/link";

const items = [
  { key: "profil", href: "/pengaturan/profil", label: "Profil Bisnis" },
  { key: "staf", href: "/pengaturan/staf", label: "Staf & Anggota" },
  { key: "akun-bank", href: "/pengaturan/akun-bank", label: "Akun Keuangan" },
];

export function SettingsTabs({ active }: { active: string }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-ink-200 bg-white p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            active === item.key ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
