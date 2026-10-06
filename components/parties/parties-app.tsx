"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Users } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";
import { Input } from "@/components/ui/field";
import { TableShell, TD, TH, THead, TR } from "@/components/ui/table";
import { PartyFormDialog } from "@/components/parties/party-form-dialog";
import { formatRupiah } from "@/lib/format";
import type { Party, PartyType } from "@/lib/types";

export interface PartyRow {
  party: Party;
  receivable: number;
  payable: number;
  transactionCount: number;
}

function PartiesList({ rows, defaultType }: { rows: PartyRow[]; defaultType: PartyType }) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const type = (params.get("type") as PartyType | null) ?? defaultType;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => (q ? row.party.name.toLowerCase().includes(q) || row.party.phone.includes(q) : true))
      .sort((a, b) => a.party.name.localeCompare(b.party.name));
  }, [rows, query]);

  function switchType(next: PartyType) {
    router.replace(`/pihak?type=${next}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-ink-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => switchType("CUSTOMER")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium ${
              type === "CUSTOMER" ? "bg-brand-600 text-white" : "text-ink-600 hover:text-ink-900"
            }`}
          >
            Pelanggan
          </button>
          <button
            type="button"
            onClick={() => switchType("SUPPLIER")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium ${
              type === "SUPPLIER" ? "bg-brand-600 text-white" : "text-ink-600 hover:text-ink-900"
            }`}
          >
            Pemasok
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama / no. HP"
              className="pl-9"
            />
          </div>
          <button type="button" className={buttonClass("primary", "md")} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada data"
          description="Tambahkan pelanggan atau pemasok untuk mulai mencatat transaksi tempo."
        />
      ) : (
        <TableShell>
          <THead>
            <tr>
              <TH>Nama</TH>
              <TH>Kontak</TH>
              <TH>Transaksi</TH>
              <TH className="text-right">Piutang</TH>
              <TH className="text-right">Utang</TH>
              <TH className="text-right">Aksi</TH>
            </tr>
          </THead>
          <tbody>
            {filtered.map((row) => (
              <TR key={row.party.id}>
                <TD>
                  <p className="font-medium text-ink-900">{row.party.name}</p>
                  <div className="mt-0.5 flex gap-1">
                    <Badge tone={row.party.type === "CUSTOMER" ? "brand" : row.party.type === "SUPPLIER" ? "warning" : "info"}>
                      {row.party.type === "CUSTOMER" ? "Pelanggan" : row.party.type === "SUPPLIER" ? "Pemasok" : "Keduanya"}
                    </Badge>
                  </div>
                </TD>
                <TD className="text-xs">
                  <p>{row.party.phone || "-"}</p>
                  <p className="text-ink-400">{row.party.address || "-"}</p>
                </TD>
                <TD className="text-xs text-ink-500">{row.transactionCount} transaksi</TD>
                <TD className="text-right text-sm font-semibold text-success-700">
                  {row.receivable > 0 ? formatRupiah(row.receivable) : <span className="font-normal text-ink-300">—</span>}
                </TD>
                <TD className="text-right text-sm font-semibold text-danger-700">
                  {row.payable > 0 ? formatRupiah(row.payable) : <span className="font-normal text-ink-300">—</span>}
                </TD>
                <TD className="text-right">
                  <Link href={`/pihak/${row.party.id}`} className={buttonClass("ghost", "sm")}>
                    Detail
                  </Link>
                </TD>
              </TR>
            ))}
          </tbody>
        </TableShell>
      )}

      <PartyFormDialog open={createOpen} party={null} defaultType={type} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

export function PartiesApp({ rows, defaultType }: { rows: PartyRow[]; defaultType: PartyType }) {
  return (
    <Suspense>
      <PartiesList rows={rows} defaultType={defaultType} />
    </Suspense>
  );
}
