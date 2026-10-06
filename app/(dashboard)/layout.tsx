import { listNotifications, listParties, listProducts } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import type { SearchEntry } from "@/components/layout/topbar";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const [products, parties, notifications] = await Promise.all([
    listProducts(),
    listParties(),
    listNotifications(),
  ]);

  const searchEntries: SearchEntry[] = [
    ...products.slice(0, 20).map((product) => ({
      href: "/inventaris",
      label: product.name,
      group: "Produk",
      detail: product.sku,
    })),
    ...parties.slice(0, 20).map((party) => ({
      href: party.type === "SUPPLIER" ? "/pihak?type=SUPPLIER" : "/pihak",
      label: party.name,
      group: party.type === "CUSTOMER" ? "Pelanggan" : "Pemasok",
      detail: party.phone,
    })),
  ];

  return (
    <AppShell session={session} notifications={notifications} searchEntries={searchEntries}>
      {children}
    </AppShell>
  );
}
