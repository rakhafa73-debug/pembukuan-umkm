import Link from "next/link";
import { AlertTriangle, CalendarClock, PackageSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AppNotification } from "@/lib/types";

export function AlertsList({ notifications, lowStockCount }: { notifications: AppNotification[]; lowStockCount: number }) {
  const items = notifications.slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Perlu perhatian</CardTitle>
        <Badge tone={items.length > 0 ? "warning" : "success"}>{items.length} item</Badge>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-ink-500">Semua aman. Tidak ada peringatan stok maupun jatuh tempo.</p>
        ) : (
          items.map((item) => {
            const Icon = item.kind === "STOCK" ? PackageSearch : item.kind === "DUE" ? CalendarClock : AlertTriangle;
            return (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-line bg-ink-50/60 px-3 py-2.5">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    item.kind === "STOCK" ? "bg-warning-50 text-warning-700" : "bg-danger-50 text-danger-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-900">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-500">{item.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-ink-500">{lowStockCount} produk stok di bawah minimum</span>
          <Link href="/inventaris?low=1" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            Lihat inventaris →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
