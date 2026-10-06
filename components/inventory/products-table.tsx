"use client";

import {
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  columnFilteringFeature,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Package, Pencil, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/page";
import { formatNumber, formatRupiah } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
});

const helper = createColumnHelper<typeof features, Product>();

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
  canEdit: boolean;
  initialLow?: boolean;
  onEdit: (product: Product) => void;
  onAdjust: (product: Product) => void;
}

export function ProductsTable({ products, categories, canEdit, initialLow = false, onEdit, onAdjust }: ProductsTableProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [onlyLow, setOnlyLow] = useState(initialLow);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const data = useMemo(
    () =>
      products
        .filter((product) => (categoryId === "all" ? true : product.categoryId === categoryId))
        .filter((product) => (onlyLow ? product.stock <= product.minStock : true)),
    [products, categoryId, onlyLow],
  );

  const columns = useMemo(
    () =>
      helper.columns([
      helper.accessor("name", {
        id: "name",
        header: "Produk",
        sortFn: "alphanumeric",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Package className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-900">{info.getValue()}</p>
              <p className="truncate font-mono text-[11px] text-ink-400">{info.row.original.sku}</p>
            </div>
          </div>
        ),
      }),
      helper.accessor(
        (row) => categories.find((category) => category.id === row.categoryId)?.name ?? "-",
        {
          id: "kategori",
          header: "Kategori",
          sortFn: "alphanumeric",
        },
      ),
      helper.accessor("sellPrice", {
        id: "harga",
        header: "Harga jual",
        sortFn: "basic",
        cell: (info) => <span className="font-medium text-ink-800">{formatRupiah(info.getValue())}</span>,
      }),
      helper.accessor("costPrice", {
        id: "modal",
        header: "Harga beli",
        sortFn: "basic",
        cell: (info) => <span className="text-ink-500">{formatRupiah(info.getValue())}</span>,
      }),
      helper.accessor("stock", {
        id: "stok",
        header: "Stok",
        sortFn: "basic",
        cell: (info) => {
          const product = info.row.original;
          const low = product.stock <= product.minStock;
          return (
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${low ? "text-warning-700" : "text-ink-800"}`}>
                {formatNumber(info.getValue())}
              </span>
              <span className="text-[11px] text-ink-400">{product.unit}</span>
              {low ? <Badge tone="warning">min {product.minStock}</Badge> : null}
            </div>
          );
        },
      }),
      helper.display({
        id: "aksi",
        header: "Aksi",
        cell: (info) => (
          <div className="flex items-center justify-end gap-1.5">
            <button type="button" onClick={() => onAdjust(info.row.original)} className={buttonClass("ghost", "sm")}>
              <SlidersHorizontal className="h-3.5 w-3.5" /> Stok
            </button>
            {canEdit ? (
              <button type="button" onClick={() => onEdit(info.row.original)} className={buttonClass("ghost", "sm")}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            ) : null}
            <Link href={`/inventaris/${info.row.original.id}`} className={buttonClass("ghost", "sm")}>
              Detail
            </Link>
          </div>
        ),
      }),
      ]),
    [categories, canEdit, onEdit, onAdjust],
  );

  const table = useTable({
    features,
    columns,
    data,
    state: { globalFilter: query, columnFilters, sorting, pagination },
    onGlobalFilterChange: setQuery,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize } = table.state.pagination;
  const pageCount = Math.max(1, Math.ceil(data.length / Math.max(pageSize, 1)));

  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama produk atau SKU…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-700">Kategori</span>
            <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="min-w-40">
              <option value="all">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>
          <button
            type="button"
            onClick={() => setOnlyLow((value) => !value)}
            className={`h-10 rounded-lg px-3 text-xs font-medium ${
              onlyLow ? "bg-warning-500 text-white" : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            }`}
          >
            Stok menipis
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Package}
            title="Tidak ada produk"
            description="Ubah kata kunci/filter atau tambah produk baru."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="bg-ink-50 text-[11px] uppercase tracking-wide text-ink-500">
              {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortEntry = sorting.find((entry) => entry.id === header.id);
                    const sortable = header.column.columnDef.enableSorting !== false && header.id !== "aksi";
                    return (
                      <th key={header.id} className="px-4 py-3 font-medium">
                        {header.isPlaceholder ? null : sortable ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSorting(() => {
                                if (!sortEntry) return [{ id: header.id, desc: false }];
                                if (!sortEntry.desc) return [{ id: header.id, desc: true }];
                                return [];
                              })
                            }
                            className="inline-flex items-center gap-1 hover:text-ink-800"
                          >
                            <table.FlexRender header={header} />
                            {sortEntry ? (
                              sortEntry.desc ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronUp className="h-3 w-3" />
                              )
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line hover:bg-ink-50/60">
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle text-ink-700">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
        <p className="text-xs text-ink-500">
          {data.length} produk · halaman {pageIndex + 1} dari {Math.max(pageCount, 1)}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="h-8 w-20 text-xs"
            aria-label="Baris per halaman"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size} / hal
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => setPagination((current) => ({ ...current, pageIndex: Math.max(current.pageIndex - 1, 0) }))}
            disabled={pageIndex <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 disabled:opacity-40"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setPagination((current) => ({ ...current, pageIndex: Math.min(current.pageIndex + 1, pageCount - 1) }))
            }
            disabled={pageIndex >= pageCount - 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 disabled:opacity-40"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
