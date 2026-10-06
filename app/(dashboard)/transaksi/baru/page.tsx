import Link from "next/link";
import { listBankAccounts, listCategories, listParties } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { CashForm } from "@/components/transactions/cash-form";
import { PageHeader } from "@/components/ui/page";

export default async function NewTransactionPage({
  searchParams,
}: PageProps<"/transaksi/baru">) {
  await requireSession();
  const query = await searchParams;
  const type = query.type === "EXPENSE" ? "EXPENSE" : "INCOME";

  const [categories, accounts, parties] = await Promise.all([
    listCategories(type),
    listBankAccounts(),
    listParties(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title={type === "INCOME" ? "Catat kas masuk" : "Catat kas keluar"}
        description="Transaksi langsung mengubah saldo kas/bank terkait."
        actions={
          <div className="flex rounded-lg border border-ink-200 bg-white p-0.5">
            <Link
              href="/transaksi/baru?type=INCOME"
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                type === "INCOME" ? "bg-success-500 text-white" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              Kas Masuk
            </Link>
            <Link
              href="/transaksi/baru?type=EXPENSE"
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                type === "EXPENSE" ? "bg-danger-500 text-white" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              Kas Keluar
            </Link>
          </div>
        }
      />
      <CashForm type={type} categories={categories} accounts={accounts} parties={parties} />
    </div>
  );
}
