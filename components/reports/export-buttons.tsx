"use client";

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { format, parseISO } from "date-fns";
import { buttonClass } from "@/components/ui/button";
import { formatNumber, formatRupiah } from "@/lib/format";
import { tabLabels, type ReportPayload } from "./types";

interface ExportTable {
  title: string;
  head: string[];
  body: (string | number)[][];
  money: number[];
}

function label(payload: ReportPayload) {
  return `${tabLabels[payload.tab]} · ${format(parseISO(payload.range.from), "d MMM yyyy")} – ${format(parseISO(payload.range.to), "d MMM yyyy")}`;
}

function buildTables(payload: ReportPayload): ExportTable[] {
  const { profitLoss: pl } = payload;
  switch (payload.tab) {
    case "labarugi":
      return [
        {
          title: "Laporan Laba Rugi",
          head: ["Uraian", "Nilai"],
          body: [
            ["Pendapatan penjualan", pl.revenue],
            ["Pendapatan lain", pl.otherIncome],
            ["Harga pokok penjualan (pembelian)", pl.purchases],
            ["Laba kotor", pl.grossProfit],
            ["Beban operasional", pl.expenses],
            ["Laba bersih", pl.netProfit],
          ],
          money: [1],
        },
        {
          title: "Beban per Kategori",
          head: ["Kategori", "Beban"],
          body: payload.expenseCategories.map((row) => [row.name, row.amount]),
          money: [1],
        },
      ];
    case "kas":
      return [
        {
          title: "Arus Kas per Akun",
          head: ["Akun", "Masuk", "Keluar", "Bersih"],
          body: payload.cashAccounts.map((row) => [row.name, row.inflow, row.outflow, row.net]),
          money: [1, 2, 3],
        },
        {
          title: "Arus Kas Harian",
          head: ["Tanggal", "Masuk", "Keluar", "Bersih"],
          body: payload.cashflow.map((row) => [row.date, row.masuk, row.keluar, row.masuk - row.keluar]),
          money: [1, 2, 3],
        },
      ];
    case "piutang":
      return [
        {
          title: "Piutang (hutang pelanggan)",
          head: ["Nama", "Jatuh Tempo", "Total", "Dibayar", "Sisa", "Umur"],
          body: payload.receivables.map((row) => [row.partyName, row.dueDate, row.total, row.paid, row.remaining, row.bucket]),
          money: [2, 3, 4],
        },
        {
          title: "Utang (hutang ke pemasok)",
          head: ["Nama", "Jatuh Tempo", "Total", "Dibayar", "Sisa", "Umur"],
          body: payload.payables.map((row) => [row.partyName, row.dueDate, row.total, row.paid, row.remaining, row.bucket]),
          money: [2, 3, 4],
        },
      ];
    case "penjualan":
      return [
        {
          title: "Penjualan per Produk",
          head: ["Produk", "Qty", "Omzet"],
          body: payload.salesProducts.map((row) => [row.name, row.qty, row.amount]),
          money: [2],
        },
        {
          title: "Beban per Kategori",
          head: ["Kategori", "Beban"],
          body: payload.expenseCategories.map((row) => [row.name, row.amount]),
          money: [1],
        },
      ];
    case "persediaan":
      return [
        {
          title: "Nilai Persediaan",
          head: ["SKU", "Produk", "Stok", "Satuan", "Nilai", "Status"],
          body: payload.inventory.items.map((row) => [row.sku, row.name, row.stock, row.unit, row.value, row.low ? "Menipis" : "Aman"]),
          money: [4],
        },
      ];
  }
}

function fileName(payload: ReportPayload, extension: string) {
  return `laporan-${payload.tab}-${payload.range.from}-${payload.range.to}.${extension}`;
}

function exportPdf(payload: ReportPayload) {
  const tables = buildTables(payload);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 44;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(payload.businessName, margin, 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(label(payload), margin, 72);
  doc.text(`Disiapkan oleh ${payload.ownerName}`, margin, 86);
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(2);
  doc.line(margin, 96, 551, 96);

  let y = 124;
  tables.forEach((table, index) => {
    if (index > 0) {
      const previous = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
      if (!previous || previous.finalY > 640) {
        doc.addPage();
        y = 64;
      } else {
        y = previous.finalY + 34;
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(table.title, margin, y);

    autoTable(doc, {
      startY: y + 10,
      head: [table.head],
      body: table.body.map((row) =>
        row.map((cell, columnIndex) =>
          table.money.includes(columnIndex) && typeof cell === "number" ? formatRupiah(cell) : String(cell),
        ),
      ),
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      margin: { left: margin, right: margin },
    });
  });

  doc.save(fileName(payload, "pdf"));
}

async function exportExcel(payload: ReportPayload) {
  const tables = buildTables(payload);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(tabLabels[payload.tab]);

  const titleRow = sheet.addRow([payload.businessName]);
  titleRow.font = { bold: true, size: 14 };
  sheet.addRow([label(payload)]);
  sheet.addRow([]);

  tables.forEach((table) => {
    sheet.addRow([table.title]).font = { bold: true, size: 11 };
    const headRow = sheet.addRow(table.head);
    headRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    });
    table.body.forEach((row) => {
      const added = sheet.addRow(row);
      table.money.forEach((columnIndex) => {
        const cell = added.getCell(columnIndex + 1);
        if (typeof cell.value === "number") cell.numFmt = "#,##0";
      });
    });
    sheet.addRow([]);
  });

  for (let columnIndex = 1; columnIndex <= 7; columnIndex += 1) {
    sheet.getColumn(columnIndex).width = columnIndex === 1 ? 30 : 16;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName(payload, "xlsx");
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ payload }: { payload: ReportPayload }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={buttonClass("outline", "md")} onClick={() => exportPdf(payload)}>
        <FileDown className="h-4 w-4" /> PDF
      </button>
      <button
        type="button"
        className={buttonClass("outline", "md")}
        onClick={() => {
          void exportExcel(payload);
        }}
      >
        <FileSpreadsheet className="h-4 w-4" /> Excel
      </button>
      <button type="button" className={buttonClass("ghost", "md")} onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Cetak
      </button>
      <span className="hidden text-xs text-ink-400 lg:inline">
        {formatNumber(payload.salesProducts.reduce((sum, row) => sum + row.qty, 0))} unit terjual pada periode ini
      </span>
    </div>
  );
}
