import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getParty, listBankAccounts, listDebts, listTransactions } from "@/lib/data";
import { requireRole, requireSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page";
import { PartyDetail } from "@/components/parties/party-detail";

export default async function PartyDetailPage({ params }: PageProps<"/pihak/[id]">) {
  const session = await requireSession();
  requireRole(session, ["owner", "admin"]);

  const { id } = await params;
  const party = await getParty(id);
  if (!party) notFound();

  const [debts, transactions, accounts] = await Promise.all([
    listDebts({ partyId: party.id }),
    listTransactions(),
    listBankAccounts(),
  ]);

  return (
    <div className="space-y-5">
      <Link href="/pihak" className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke daftar pihak
      </Link>

      <PageHeader
        title={party.name}
        description={[party.phone, party.address].filter(Boolean).join(" · ") || "Tanpa kontak tercatat"}
        actions={
          <Badge tone={party.type === "CUSTOMER" ? "brand" : party.type === "SUPPLIER" ? "warning" : "info"}>
            {party.type === "CUSTOMER" ? "Pelanggan" : party.type === "SUPPLIER" ? "Pemasok" : "Pelanggan & Pemasok"}
          </Badge>
        }
      />

      {party.notes ? (
        <p className="rounded-card border border-line bg-white px-4 py-3 text-sm text-ink-600">{party.notes}</p>
      ) : null}

      <PartyDetail
        party={party}
        debts={debts}
        transactions={transactions.filter((tx) => tx.partyId === party.id)}
        accounts={accounts}
      />
    </div>
  );
}
