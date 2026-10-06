import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, PackagePlus, ShoppingCart } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

const actions = [
  { href: "/transaksi/baru?type=INCOME", label: "Kas Masuk", icon: ArrowDownRight, variant: "outline" as const },
  { href: "/transaksi/baru?type=EXPENSE", label: "Kas Keluar", icon: ArrowUpRight, variant: "outline" as const },
  { href: "/pos", label: "Penjualan (POS)", icon: ShoppingCart, variant: "primary" as const },
  { href: "/pembelian", label: "Pembelian", icon: PackagePlus, variant: "outline" as const },
];

export function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className={buttonClass(action.variant, "lg", "w-full justify-start shadow-sm")}
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
