import { listDebts, listParties, listTransactions } from "@/lib/data";
import { requireRole, requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { PartiesApp, type PartyRow } from "@/components/parties/parties-app";
import type { PartyType } from "@/lib/types";

export default async function PartiesPage({
  searchParams,
}: PageProps<"/pihak">) {
  const session = await requireSession();
  requireRole(session, ["owner", "admin"]);

  const query = await searchParams;
  const type: PartyType = query.type === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER";

  const [parties, debts, transactions] = await Promise.all([
    listParties(),
    listDebts(),
    listTransactions(),
  ]);

  const rows: PartyRow[] = parties.map((party) => {
    const own = debts.filter((debt) => debt.partyId === party.id && debt.status !== "PAID");
    return {
      party,
      receivable: own.filter((debt) => debt.type === "RECEIVABLE").reduce((sum, debt) => sum + (debt.total - debt.paid), 0),
      payable: own.filter((debt) => debt.type === "PAYABLE").reduce((sum, debt) => sum + (debt.total - debt.paid), 0),
      transactionCount: transactions.filter((tx) => tx.partyId === party.id).length,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pelanggan & Pemasok"
        description="Kelola data pihak beserta ringkasan piutang (hutang mereka) dan utang (hutang Anda)."
      />
      <PartiesApp rows={rows} defaultType={type} />
    </div>
  );
}
