import { addDays, format, startOfDay, subDays } from "date-fns";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";
import { parseISODate, toISODate } from "@/lib/format";
import {
  bankAccounts,
  business,
  categories,
  debts,
  debtPayments,
  members,
  notifications,
  parties,
  products,
  stockMovements,
  transactions,
} from "@/lib/data/store";
import type {
  AppNotification,
  BankAccount,
  Category,
  CategoryKind,
  Debt,
  DebtPayment,
  DebtType,
  Member,
  Party,
  PartyType,
  Product,
  Role,
  StockMovement,
  Transaction,
  TransactionItem,
  TxType,
} from "@/lib/types";

type Row = Record<string, unknown>;

const asStr = (value: unknown) => (value == null ? "" : String(value));
const asNum = (value: unknown) => (value == null ? 0 : Number(value));

function mapCategory(row: Row): Category {
  return { id: asStr(row.id), kind: asStr(row.kind) as CategoryKind, name: asStr(row.name) };
}

function mapProduct(row: Row): Product {
  return {
    id: asStr(row.id),
    sku: asStr(row.sku),
    barcode: asStr(row.barcode),
    name: asStr(row.name),
    categoryId: asStr(row.category_id),
    unit: asStr(row.unit),
    costPrice: asNum(row.cost_price),
    sellPrice: asNum(row.sell_price),
    stock: asNum(row.stock_qty),
    minStock: asNum(row.min_stock),
    status: asStr(row.status) === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    imageUrl: asStr(row.image_url),
  };
}

function mapParty(row: Row): Party {
  return {
    id: asStr(row.id),
    type: asStr(row.type) as PartyType,
    name: asStr(row.name),
    phone: asStr(row.phone),
    email: asStr(row.email),
    address: asStr(row.address),
    notes: asStr(row.notes),
    balance: asNum(row.balance),
    createdAt: asStr(row.created_at).slice(0, 10),
  };
}

function mapAccount(row: Row): BankAccount {
  return {
    id: asStr(row.id),
    name: asStr(row.name),
    type: asStr(row.type) as BankAccount["type"],
    openingBalance: asNum(row.opening_balance),
    balance: asNum(row.balance),
    status: asStr(row.status) === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
}

function mapMember(row: Row): Member {
  return {
    id: asStr(row.id),
    businessId: asStr(row.business_id),
    name: asStr(row.name),
    email: asStr(row.email),
    role: asStr(row.role) as Role,
    status: asStr(row.status) as Member["status"],
    joinedAt: asStr(row.joined_at).slice(0, 10),
  };
}

function mapItem(row: Row): TransactionItem {
  return {
    id: asStr(row.id),
    transactionId: asStr(row.transaction_id),
    productId: asStr(row.product_id),
    productName: asStr(row.product_name),
    qty: asNum(row.qty),
    unitPrice: asNum(row.unit_price),
    discount: asNum(row.discount),
    subtotal: asNum(row.subtotal),
  };
}

function mapTransaction(row: Row, items: TransactionItem[]): Transaction {
  return {
    id: asStr(row.id),
    type: asStr(row.type) as TxType,
    invoiceNo: asStr(row.invoice_no),
    date: asStr(row.transaction_date ?? row.created_at),
    categoryId: row.category_id ? asStr(row.category_id) : null,
    partyId: row.party_id ? asStr(row.party_id) : null,
    bankAccountId: asStr(row.bank_account_id),
    amount: asNum(row.total_amount),
    discount: asNum(row.discount),
    paymentMethod: asStr(row.payment_method) as Transaction["paymentMethod"],
    paymentStatus: asStr(row.payment_status) as Transaction["paymentStatus"],
    notes: asStr(row.notes),
    createdBy: asStr(row.created_by),
    items,
  };
}

function mapDebt(row: Row): Debt {
  return {
    id: asStr(row.id),
    type: asStr(row.type) as DebtType,
    partyId: asStr(row.party_id),
    transactionId: row.transaction_id ? asStr(row.transaction_id) : null,
    total: asNum(row.total_amount),
    paid: asNum(row.paid_amount),
    dueDate: asStr(row.due_date).slice(0, 10),
    status: asStr(row.status) as Debt["status"],
  };
}

function mapDebtPayment(row: Row): DebtPayment {
  return {
    id: asStr(row.id),
    debtId: asStr(row.debt_id),
    amount: asNum(row.amount),
    date: asStr(row.paid_at).slice(0, 10),
    bankAccountId: asStr(row.bank_account_id),
    notes: asStr(row.notes),
  };
}

function mapMovement(row: Row): StockMovement {
  return {
    id: asStr(row.id),
    productId: asStr(row.product_id),
    type: asStr(row.type) as StockMovement["type"],
    qtyChange: asNum(row.qty_change),
    stockAfter: asNum(row.stock_after),
    reference: asStr(row.reference),
    reason: asStr(row.reason),
    date: asStr(row.created_at),
  };
}

export async function listCategories(kind?: CategoryKind): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return kind ? categories.filter((c) => c.kind === kind) : categories;
  }
  const supabase = await supabaseServer();
  if (!supabase) return [];
  let query = supabase.from("categories").select("*").order("name");
  if (kind) query = query.eq("kind", kind);
  const { data } = await query;
  return (data ?? []).map((row) => mapCategory(row as Row));
}

export async function listProducts(options: { q?: string; categoryId?: string; lowStock?: boolean } = {}): Promise<Product[]> {
  const { q, categoryId, lowStock } = options;
  if (!isSupabaseConfigured()) {
    return products
      .filter((p) => p.status === "ACTIVE")
      .filter((p) => (categoryId && categoryId !== "all" ? p.categoryId === categoryId : true))
      .filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((p) => (lowStock ? p.stock <= p.minStock : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  const supabase = await supabaseServer();
  if (!supabase) return [];
  let query = supabase.from("products").select("*").eq("status", "ACTIVE").order("name");
  if (categoryId && categoryId !== "all") query = query.eq("category_id", categoryId);
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  const { data } = await query;
  const list = (data ?? []).map((row) => mapProduct(row as Row));
  return lowStock ? list.filter((p) => p.stock <= p.minStock) : list;
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return products.find((p) => p.id === id) ?? null;
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return data ? mapProduct(data as Row) : null;
}

export async function listStockMovements(productId: string): Promise<StockMovement[]> {
  if (!isSupabaseConfigured()) {
    return stockMovements
      .filter((m) => m.productId === productId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapMovement(row as Row));
}

export async function listTransactions(filter: {
  type?: TxType | "ALL";
  from?: string;
  to?: string;
  q?: string;
  categoryId?: string;
} = {}): Promise<Transaction[]> {
  const { type = "ALL", from, to, q, categoryId } = filter;
  if (!isSupabaseConfigured()) {
    return transactions
      .filter((t) => (type === "ALL" ? true : t.type === type))
      .filter((t) => (from ? t.date.slice(0, 10) >= from : true))
      .filter((t) => (to ? t.date.slice(0, 10) <= to : true))
      .filter((t) => (categoryId && categoryId !== "all" ? t.categoryId === categoryId : true))
      .filter((t) =>
        q
          ? t.invoiceNo.toLowerCase().includes(q.toLowerCase()) ||
            t.notes.toLowerCase().includes(q.toLowerCase()) ||
            t.items.some((i) => i.productName.toLowerCase().includes(q.toLowerCase()))
          : true,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  const supabase = await supabaseServer();
  if (!supabase) return [];
  let query = supabase
    .from("transactions")
    .select("*, transaction_items(*)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (type !== "ALL") query = query.eq("type", type);
  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);
  if (categoryId && categoryId !== "all") query = query.eq("category_id", categoryId);
  const { data } = await query;
  return (data ?? []).map((row) => {
    const typed = row as Row;
    const items = Array.isArray(typed.transaction_items)
      ? (typed.transaction_items as Row[]).map(mapItem)
      : [];
    return mapTransaction(typed, items);
  });
}

export async function listParties(type?: PartyType): Promise<Party[]> {
  if (!isSupabaseConfigured()) {
    return parties
      .filter((p) => (type ? p.type === type || p.type === "BOTH" : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  const supabase = await supabaseServer();
  if (!supabase) return [];
  let query = supabase.from("parties").select("*").order("name");
  if (type) query = query.or(`type.eq.${type},type.eq.BOTH`);
  const { data } = await query;
  return (data ?? []).map((row) => mapParty(row as Row));
}

export async function getParty(id: string): Promise<Party | null> {
  if (!isSupabaseConfigured()) return parties.find((p) => p.id === id) ?? null;
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.from("parties").select("*").eq("id", id).maybeSingle();
  return data ? mapParty(data as Row) : null;
}

export async function listDebts(filter: { type?: DebtType; partyId?: string } = {}): Promise<Debt[]> {
  const { type, partyId } = filter;
  if (!isSupabaseConfigured()) {
    return debts
      .filter((d) => (type ? d.type === type : true))
      .filter((d) => (partyId ? d.partyId === partyId : true))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
  const supabase = await supabaseServer();
  if (!supabase) return [];
  let query = supabase.from("debts").select("*").order("due_date");
  if (type) query = query.eq("type", type);
  if (partyId) query = query.eq("party_id", partyId);
  const { data } = await query;
  return (data ?? []).map((row) => mapDebt(row as Row));
}

export async function listDebtPayments(debtId: string): Promise<DebtPayment[]> {
  if (!isSupabaseConfigured()) {
    return debtPayments.filter((p) => p.debtId === debtId).sort((a, b) => b.date.localeCompare(a.date));
  }
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("debt_payments")
    .select("*")
    .eq("debt_id", debtId)
    .order("paid_at", { ascending: false });
  return (data ?? []).map((row) => mapDebtPayment(row as Row));
}

export async function listBankAccounts(): Promise<BankAccount[]> {
  if (!isSupabaseConfigured()) return bankAccounts.filter((a) => a.status === "ACTIVE");
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data } = await supabase.from("bank_accounts").select("*").order("name");
  return (data ?? []).map((row) => mapAccount(row as Row));
}

export async function listMembers(): Promise<Member[]> {
  if (!isSupabaseConfigured()) return members;
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data } = await supabase.from("business_members").select("*").order("joined_at");
  return (data ?? []).map((row) => mapMember(row as Row));
}

export async function listNotifications(): Promise<AppNotification[]> {
  if (!isSupabaseConfigured()) {
    return [...notifications].sort((a, b) => Number(a.read) - Number(b.read));
  }
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map((row) => {
    const typed = row as Row;
    return {
      id: asStr(typed.id),
      kind: asStr(typed.kind) as AppNotification["kind"],
      title: asStr(typed.title),
      body: asStr(typed.body),
      date: asStr(typed.created_at).slice(0, 10),
      read: Boolean(typed.read),
    };
  });
}

export function totalCashBalance(accounts: BankAccount[]) {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}

function sumByType(list: Transaction[], types: TxType[], date: string) {
  return list
    .filter((t) => types.includes(t.type) && t.date.slice(0, 10) === date)
    .reduce((sum, t) => sum + t.amount, 0);
}

export async function getDashboardSummary() {
  const [all, accounts] = await Promise.all([listTransactions(), listBankAccounts()]);
  const today = toISODate(new Date());
  const yesterday = toISODate(subDays(new Date(), 1));
  const monthStart = toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const salesToday = sumByType(all, ["SALE"], today);
  const salesYesterday = sumByType(all, ["SALE"], yesterday);
  const purchasesToday = sumByType(all, ["PURCHASE"], today);
  const expensesMonth = all
    .filter((t) => t.type === "EXPENSE" && t.date.slice(0, 10) >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);
  const salesMonth = all
    .filter((t) => t.type === "SALE" && t.date.slice(0, 10) >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    cashBalance: totalCashBalance(accounts),
    salesToday,
    salesYesterday,
    salesCountToday: all.filter((t) => t.type === "SALE" && t.date.slice(0, 10) === today).length,
    purchasesToday,
    expensesMonth,
    salesMonth,
    receivables: debts.filter((d) => d.type === "RECEIVABLE" && d.status !== "PAID").reduce((s, d) => s + (d.total - d.paid), 0),
    payables: debts.filter((d) => d.type === "PAYABLE" && d.status !== "PAID").reduce((s, d) => s + (d.total - d.paid), 0),
  };
}

export async function getCashflow(days: number) {
  const all = await listTransactions();
  const result: Array<{ date: string; label: string; masuk: number; keluar: number }> = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = subDays(new Date(), i);
    const key = toISODate(date);
    const dayTx = all.filter((t) => t.date.slice(0, 10) === key);
    result.push({
      date: key,
      label: format(date, "dd/MM"),
      masuk: dayTx.filter((t) => t.type === "SALE" || t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
      keluar: dayTx.filter((t) => t.type === "EXPENSE" || t.type === "PURCHASE").reduce((s, t) => s + t.amount, 0),
    });
  }
  return result;
}

export function debtAging(debtsList: Debt[]) {
  const today = startOfDay(new Date());
  return debtsList.map((debt) => {
    const due = parseISODate(debt.dueDate);
    const overdueDays = Math.round((today.getTime() - due.getTime()) / 86_400_000);
    const bucket = overdueDays > 60 ? ">60" : overdueDays > 30 ? "31-60" : overdueDays > 0 ? "1-30" : "Belum jatuh tempo";
    return { ...debt, overdueDays, bucket };
  });
}

export function partyOutstanding(partyId: string) {
  const list = debts.filter((d) => d.partyId === partyId && d.status !== "PAID");
  const receivable = list.filter((d) => d.type === "RECEIVABLE").reduce((s, d) => s + (d.total - d.paid), 0);
  const payable = list.filter((d) => d.type === "PAYABLE").reduce((s, d) => s + (d.total - d.paid), 0);
  return { receivable, payable };
}

export interface ReportRange {
  from: string;
  to: string;
}

export function filterByRange(list: Transaction[], range: ReportRange) {
  return list.filter((t) => t.date.slice(0, 10) >= range.from && t.date.slice(0, 10) <= range.to);
}

export function buildProfitLoss(list: Transaction[]) {
  const revenue = list.filter((t) => t.type === "SALE").reduce((s, t) => s + t.amount, 0);
  const otherIncome = list.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const purchases = list.filter((t) => t.type === "PURCHASE").reduce((s, t) => s + t.amount, 0);
  const expenses = list.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  return {
    revenue,
    otherIncome,
    purchases,
    expenses,
    grossProfit: revenue - purchases,
    netProfit: revenue + otherIncome - purchases - expenses,
  };
}

export function buildExpenseByCategory(list: Transaction[], categoryList: Category[]) {
  const map = new Map<string, number>();
  list
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      const key = t.categoryId ?? "tanpa-kategori";
      map.set(key, (map.get(key) ?? 0) + t.amount);
    });
  return [...map.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      name: categoryList.find((c) => c.id === categoryId)?.name ?? "Tanpa kategori",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildSalesByProduct(list: Transaction[]) {
  const map = new Map<string, { name: string; qty: number; amount: number }>();
  list
    .filter((t) => t.type === "SALE")
    .forEach((t) =>
      t.items.forEach((item) => {
        const current = map.get(item.productId) ?? { name: item.productName, qty: 0, amount: 0 };
        current.qty += item.qty;
        current.amount += item.subtotal - item.discount;
        map.set(item.productId, current);
      }),
    );
  return [...map.entries()]
    .map(([productId, value]) => ({ productId, ...value }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildCashFlowReport(list: Transaction[], accountList: BankAccount[]) {
  const rows = accountList.map((account) => {
    const accountTx = list.filter((t) => t.bankAccountId === account.id);
    const inflow = accountTx.filter((t) => t.type === "SALE" || t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const outflow = accountTx.filter((t) => t.type === "EXPENSE" || t.type === "PURCHASE").reduce((s, t) => s + t.amount, 0);
    return { account, inflow, outflow, net: inflow - outflow };
  });
  return rows;
}

export function businessInfo() {
  return business;
}

export function defaultRange(days = 30): ReportRange {
  return { from: toISODate(addDays(new Date(), -days)), to: toISODate(new Date()) };
}
