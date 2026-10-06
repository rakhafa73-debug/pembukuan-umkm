import {
  getCashflow,
  getDashboardSummary,
  listCategories,
  listNotifications,
  listProducts,
  listTransactions,
} from "@/lib/data";
import { requireSession } from "@/lib/session";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AlertsList } from "@/components/dashboard/alerts-list";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { PageHeader } from "@/components/ui/page";

export default async function DashboardPage() {
  const session = await requireSession();
  const [summary, cashflow, transactions, categories, notifications, products] = await Promise.all([
    getDashboardSummary(),
    getCashflow(30),
    listTransactions(),
    listCategories(),
    listNotifications(),
    listProducts(),
  ]);

  const lowStock = products.filter((product) => product.stock <= product.minStock);
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greeting}, ${session.user.name.split(" ")[0]}`}
        description={`Ringkasan ${session.business.name} · ${new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date())}`}
      />

      <SummaryCards data={summary} />
      <QuickActions />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CashflowChart data={cashflow} />
        </div>
        <AlertsList notifications={notifications} lowStockCount={lowStock.length} />
      </div>

      <RecentTransactions transactions={transactions.slice(0, 8)} categories={categories} />
    </div>
  );
}
