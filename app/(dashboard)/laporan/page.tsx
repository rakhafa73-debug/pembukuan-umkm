import { eachDayOfInterval } from "date-fns";
import {
  buildCashFlowReport,
  buildExpenseByCategory,
  buildProfitLoss,
  buildSalesByProduct,
  businessInfo,
  debtAging,
  defaultRange,
  filterByRange,
  listBankAccounts,
  listCategories,
  listDebts,
  listParties,
  listProducts,
  listTransactions,
  totalCashBalance,
} from "@/lib/data";
import { requireRole, requireSession } from "@/lib/session";
import { parseISODate, toISODate } from "@/lib/format";
import { ReportView } from "@/components/reports/report-view";
import { tabLabels, type AgingDebt, type ReportPayload, type ReportTab } from "@/components/reports/types";

const validTabs = Object.keys(tabLabels) as ReportTab[];

function isValidDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseISODate(value).getTime()));
}

function agingRows(payload: Awaited<ReturnType<typeof listDebts>>, partyNames: Map<string, string>): AgingDebt[] {
  return debtAging(payload)
    .map((row) => ({
      id: row.id,
      partyName: partyNames.get(row.partyId) ?? "-",
      dueDate: row.dueDate,
      total: row.total,
      paid: row.paid,
      remaining: row.total - row.paid,
      bucket: row.bucket,
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export default async function ReportsPage({ searchParams }: PageProps<"/laporan">) {
  const session = await requireSession();
  requireRole(session, ["owner", "admin"]);

  const query = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const rawTab = one(query.tab);
  const tab = validTabs.includes(rawTab as ReportTab) ? (rawTab as ReportTab) : "labarugi";

  let range = defaultRange(30);
  const from = one(query.from);
  const to = one(query.to);
  if (isValidDate(from) && isValidDate(to)) {
    range = from <= to ? { from, to } : { from: to, to: from };
  }

  const [
    allTransactions,
    allCategories,
    accounts,
    products,
    allDebts,
    parties,
  ] = await Promise.all([
    listTransactions(),
    listCategories(),
    listBankAccounts(),
    listProducts(),
    listDebts(),
    listParties(),
  ]);

  const partyNames = new Map(parties.map((party) => [party.id, party.name]));
  const rangeTransactions = filterByRange(allTransactions, range);
  const profitLoss = buildProfitLoss(rangeTransactions);

  const cashflowDays = eachDayOfInterval({
    start: parseISODate(range.from),
    end: parseISODate(range.to),
  });
  const cashflow = cashflowDays.slice(-180).map((day) => {
    const key = toISODate(day);
    const dayTx = rangeTransactions.filter((transaction) => transaction.date.slice(0, 10) === key);
    return {
      date: key,
      label: key.slice(8, 10) + "/" + key.slice(5, 7),
      masuk: dayTx
        .filter((transaction) => transaction.type === "SALE" || transaction.type === "INCOME")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      keluar: dayTx
        .filter((transaction) => transaction.type === "EXPENSE" || transaction.type === "PURCHASE")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    };
  });

  const inventoryItems = products.map((product) => ({
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    unit: product.unit,
    value: product.costPrice * product.stock,
    low: product.stock <= product.minStock,
  }));

  const business = businessInfo();
  const unpaid = allDebts.filter((debt) => debt.status !== "PAID");

  const payload: ReportPayload = {
    businessName: business.name,
    ownerName: business.ownerName,
    range,
    tab,
    cashBalance: totalCashBalance(accounts),
    profitLoss,
    expenseCategories: buildExpenseByCategory(rangeTransactions, allCategories),
    salesProducts: buildSalesByProduct(rangeTransactions),
    salesCount: rangeTransactions.filter((transaction) => transaction.type === "SALE").length,
    cashAccounts: buildCashFlowReport(rangeTransactions, accounts).map((row) => ({
      name: row.account.name,
      type: row.account.type,
      inflow: row.inflow,
      outflow: row.outflow,
      net: row.net,
    })),
    cashflow,
    receivables: agingRows(unpaid.filter((debt) => debt.type === "RECEIVABLE"), partyNames),
    payables: agingRows(unpaid.filter((debt) => debt.type === "PAYABLE"), partyNames),
    inventory: {
      totalValue: inventoryItems.reduce((sum, item) => sum + item.value, 0),
      totalUnits: inventoryItems.reduce((sum, item) => sum + item.stock, 0),
      lowCount: inventoryItems.filter((item) => item.low).length,
      itemCount: inventoryItems.length,
      items: inventoryItems.sort((a, b) => b.value - a.value),
    },
  };

  return <ReportView payload={payload} />;
}
