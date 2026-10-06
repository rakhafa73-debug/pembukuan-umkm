import type { AccountType } from "@/lib/types";

export type ReportTab = "labarugi" | "kas" | "piutang" | "penjualan" | "persediaan";

export interface AgingDebt {
  id: string;
  partyName: string;
  dueDate: string;
  total: number;
  paid: number;
  remaining: number;
  bucket: string;
}

export interface ReportPayload {
  businessName: string;
  ownerName: string;
  range: { from: string; to: string };
  tab: ReportTab;
  cashBalance: number;
  profitLoss: {
    revenue: number;
    otherIncome: number;
    purchases: number;
    expenses: number;
    grossProfit: number;
    netProfit: number;
  };
  expenseCategories: { name: string; amount: number }[];
  salesProducts: { name: string; qty: number; amount: number }[];
  salesCount: number;
  cashAccounts: { name: string; type: AccountType; inflow: number; outflow: number; net: number }[];
  cashflow: { date: string; label: string; masuk: number; keluar: number }[];
  receivables: AgingDebt[];
  payables: AgingDebt[];
  inventory: {
    totalValue: number;
    totalUnits: number;
    lowCount: number;
    itemCount: number;
    items: { name: string; sku: string; stock: number; unit: string; value: number; low: boolean }[];
  };
}

export const tabLabels: Record<ReportTab, string> = {
  labarugi: "Laba Rugi",
  kas: "Arus Kas",
  piutang: "Piutang & Utang",
  penjualan: "Penjualan",
  persediaan: "Persediaan",
};
