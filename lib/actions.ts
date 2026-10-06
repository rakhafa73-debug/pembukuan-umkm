"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, format } from "date-fns";
import { getSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";
import { toISODate } from "@/lib/format";
import { nextId } from "@/lib/data/store";
import {
  bankAccounts,
  business,
  categories,
  debtPayments,
  debts,
  members,
  notifications,
  parties,
  products,
  stockMovements,
  transactions,
} from "@/lib/data/store";
import type {
  AccountType,
  CategoryKind,
  Member,
  PaymentMethod,
  PartyType,
  Product,
  Role,
  TxType,
} from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message: string;
  id?: string;
  invoiceNo?: string;
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}

function ok(message: string, extra: Partial<ActionResult> = {}): ActionResult {
  return { ok: true, message, ...extra };
}

function invoicePrefix(type: TxType) {
  if (type === "SALE") return "INV";
  if (type === "PURCHASE") return "PUK";
  if (type === "INCOME") return "KMS";
  return "KLR";
}

function buildInvoiceNo(type: TxType) {
  const now = new Date();
  const period = format(now, "yyyyMM");
  const count = transactions.filter((t) => t.type === type && t.date.slice(0, 7) === toISODate(now).slice(0, 7)).length + 1;
  return `${invoicePrefix(type)}-${period}-${String(count).padStart(3, "0")}`;
}

function updateAccountBalance(accountId: string, delta: number) {
  const account = bankAccounts.find((a) => a.id === accountId);
  if (account) account.balance += delta;
}

export interface CashInput {
  type: Extract<TxType, "INCOME" | "EXPENSE">;
  amount: number;
  categoryId: string | null;
  bankAccountId: string;
  partyId: string | null;
  notes: string;
  date: string;
}

export async function saveCashTransaction(input: CashInput): Promise<ActionResult> {
  if (!input.amount || input.amount <= 0) return fail("Nominal harus lebih dari 0");
  if (!input.bankAccountId) return fail("Pilih sumber dana");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const { data, error } = await supabase.rpc("record_cash", {
      p_type: input.type,
      p_amount: input.amount,
      p_category_id: input.categoryId,
      p_bank_account_id: input.bankAccountId,
      p_party_id: input.partyId,
      p_notes: input.notes,
      p_date: input.date,
    });
    if (error) return fail(error.message);
    revalidatePath("/transaksi");
    revalidatePath("/dashboard");
    return ok("Transaksi tersimpan", { id: String(data ?? "") });
  }

  const id = nextId("txn");
  const invoiceNo = buildInvoiceNo(input.type);
  transactions.unshift({
    id,
    type: input.type,
    invoiceNo,
    date: `${input.date}T${format(new Date(), "HH:mm")}:00`,
    categoryId: input.categoryId,
    partyId: input.partyId,
    bankAccountId: input.bankAccountId,
    amount: input.amount,
    discount: 0,
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    notes: input.notes,
    createdBy: "mem_1",
    items: [],
  });
  updateAccountBalance(input.bankAccountId, input.type === "INCOME" ? input.amount : -input.amount);
  revalidatePath("/transaksi");
  revalidatePath("/dashboard");
  return ok("Transaksi tersimpan", { id, invoiceNo });
}

export interface SaleLine {
  productId: string;
  qty: number;
  discount: number;
}

export interface SaleInput {
  lines: SaleLine[];
  discount: number;
  paymentMethod: PaymentMethod;
  bankAccountId: string;
  partyId: string | null;
  notes: string;
  allowStockOverride: boolean;
}

export async function createSale(input: SaleInput): Promise<ActionResult> {
  if (input.lines.length === 0) return fail("Keranjang masih kosong");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const { data, error } = await supabase.rpc("record_sale", {
      p_items: input.lines.map((l) => ({ product_id: l.productId, qty: l.qty, discount: l.discount })),
      p_discount: input.discount,
      p_payment_method: input.paymentMethod,
      p_bank_account_id: input.bankAccountId,
      p_party_id: input.partyId,
      p_notes: input.notes,
      p_allow_stock_override: input.allowStockOverride,
    });
    if (error) return fail(error.message);
    revalidatePath("/pos");
    revalidatePath("/dashboard");
    revalidatePath("/inventaris");
    return ok("Penjualan tersimpan", { id: String((data as { id?: string })?.id ?? ""), invoiceNo: String((data as { invoice_no?: string })?.invoice_no ?? "") });
  }

  const unavailable = input.lines
    .map((line) => ({ line, product: products.find((p) => p.id === line.productId) }))
    .find(({ line, product }) => product && product.stock < line.qty);

  if (unavailable && !input.allowStockOverride) {
    return fail(`Stok ${unavailable.product?.name} tidak cukup (tersisa ${unavailable.product?.stock})`);
  }

  const id = nextId("txn");
  const invoiceNo = buildInvoiceNo("SALE");
  let total = 0;

  const items = input.lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    const unitPrice = product?.sellPrice ?? 0;
    const subtotal = unitPrice * line.qty - line.discount;
    total += subtotal;
    return {
      id: nextId("itm"),
      transactionId: id,
      productId: line.productId,
      productName: product?.name ?? "Produk",
      qty: line.qty,
      unitPrice,
      discount: line.discount,
      subtotal,
    };
  });

  const grandTotal = Math.max(total - input.discount, 0);
  const isTempo = input.paymentMethod === "TEMPO";
  const now = new Date();

  transactions.unshift({
    id,
    type: "SALE",
    invoiceNo,
    date: `${toISODate(now)}T${format(now, "HH:mm")}:00`,
    categoryId: "cat_inc_1",
    partyId: input.partyId,
    bankAccountId: input.bankAccountId,
    amount: grandTotal,
    discount: input.discount,
    paymentMethod: input.paymentMethod,
    paymentStatus: isTempo ? "UNPAID" : "PAID",
    notes: input.notes,
    createdBy: "mem_1",
    items,
  });

  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    product.stock -= item.qty;
    stockMovements.push({
      id: nextId("mov"),
      productId: product.id,
      type: "OUT",
      qtyChange: -item.qty,
      stockAfter: product.stock,
      reference: invoiceNo,
      reason: "Penjualan",
      date: `${toISODate(now)}T${format(now, "HH:mm")}:00`,
    });
  });

  if (!isTempo) updateAccountBalance(input.bankAccountId, grandTotal);

  if (isTempo && input.partyId) {
    debts.push({
      id: nextId("dbt"),
      type: "RECEIVABLE",
      partyId: input.partyId,
      transactionId: id,
      total: grandTotal,
      paid: 0,
      dueDate: toISODate(addDays(now, 14)),
      status: "OPEN",
    });
    const party = parties.find((p) => p.id === input.partyId);
    if (party) party.balance += grandTotal;
  }

  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/inventaris");
  return ok("Penjualan tersimpan", { id, invoiceNo });
}

export interface PurchaseLine {
  productId: string;
  qty: number;
  unitCost: number;
}

export interface PurchaseInput {
  partyId: string;
  lines: PurchaseLine[];
  paymentMethod: PaymentMethod;
  bankAccountId: string;
  notes: string;
}

export async function createPurchase(input: PurchaseInput): Promise<ActionResult> {
  if (input.lines.length === 0) return fail("Daftar item masih kosong");
  if (!input.partyId) return fail("Pilih pemasok");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const { data, error } = await supabase.rpc("record_purchase", {
      p_party_id: input.partyId,
      p_items: input.lines.map((l) => ({ product_id: l.productId, qty: l.qty, unit_cost: l.unitCost })),
      p_payment_method: input.paymentMethod,
      p_bank_account_id: input.bankAccountId,
      p_notes: input.notes,
    });
    if (error) return fail(error.message);
    revalidatePath("/pembelian");
    revalidatePath("/inventaris");
    return ok("Pembelian tersimpan", { id: String(data ?? ""), invoiceNo: "" });
  }

  const id = nextId("txn");
  const invoiceNo = buildInvoiceNo("PURCHASE");
  const now = new Date();
  let total = 0;

  const items = input.lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    const subtotal = line.unitCost * line.qty;
    total += subtotal;
    return {
      id: nextId("itm"),
      transactionId: id,
      productId: line.productId,
      productName: product?.name ?? "Produk",
      qty: line.qty,
      unitPrice: line.unitCost,
      discount: 0,
      subtotal,
    };
  });

  const isTempo = input.paymentMethod === "TEMPO";

  transactions.unshift({
    id,
    type: "PURCHASE",
    invoiceNo,
    date: `${toISODate(now)}T${format(now, "HH:mm")}:00`,
    categoryId: "cat_exp_1",
    partyId: input.partyId,
    bankAccountId: input.bankAccountId,
    amount: total,
    discount: 0,
    paymentMethod: input.paymentMethod,
    paymentStatus: isTempo ? "UNPAID" : "PAID",
    notes: input.notes,
    createdBy: "mem_1",
    items,
  });

  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    product.stock += item.qty;
    stockMovements.push({
      id: nextId("mov"),
      productId: product.id,
      type: "IN",
      qtyChange: item.qty,
      stockAfter: product.stock,
      reference: invoiceNo,
      reason: "Pembelian",
      date: `${toISODate(now)}T${format(now, "HH:mm")}:00`,
    });
  });

  if (!isTempo) updateAccountBalance(input.bankAccountId, -total);

  if (isTempo) {
    debts.push({
      id: nextId("dbt"),
      type: "PAYABLE",
      partyId: input.partyId,
      transactionId: id,
      total,
      paid: 0,
      dueDate: toISODate(addDays(now, 14)),
      status: "OPEN",
    });
    const party = parties.find((p) => p.id === input.partyId);
    if (party) party.balance -= total;
  }

  revalidatePath("/pembelian");
  revalidatePath("/inventaris");
  return ok("Pembelian tersimpan", { id, invoiceNo });
}

export interface ProductInput {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  if (!input.name.trim()) return fail("Nama produk wajib diisi");
  if (!input.sku.trim()) return fail("SKU wajib diisi");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const payload = {
      name: input.name,
      sku: input.sku,
      barcode: input.barcode,
      category_id: input.categoryId,
      unit: input.unit,
      cost_price: input.costPrice,
      sell_price: input.sellPrice,
      min_stock: input.minStock,
    };
    const { data, error } = input.id
      ? await supabase.from("products").update(payload).eq("id", input.id).select("id").single()
      : await supabase
          .from("products")
          .insert({ ...payload, stock_qty: input.stock })
          .select("id")
          .single();
    if (error) return fail(error.message);
    revalidatePath("/inventaris");
    return ok("Produk tersimpan", { id: String(data?.id ?? input.id ?? "") });
  }

  if (input.id) {
    const product = products.find((p) => p.id === input.id);
    if (!product) return fail("Produk tidak ditemukan");
    Object.assign(product, {
      name: input.name,
      sku: input.sku,
      barcode: input.barcode,
      categoryId: input.categoryId,
      unit: input.unit,
      costPrice: input.costPrice,
      sellPrice: input.sellPrice,
      minStock: input.minStock,
    });
    revalidatePath("/inventaris");
    return ok("Produk diperbarui", { id: product.id });
  }

  const duplicate = products.find((p) => p.sku.toLowerCase() === input.sku.toLowerCase());
  if (duplicate) return fail(`SKU ${input.sku} sudah dipakai`);

  const product: Product = {
    id: nextId("prd"),
    name: input.name,
    sku: input.sku,
    barcode: input.barcode,
    categoryId: input.categoryId,
    unit: input.unit,
    costPrice: input.costPrice,
    sellPrice: input.sellPrice,
    stock: input.stock,
    minStock: input.minStock,
    status: "ACTIVE",
    imageUrl: "",
  };
  products.push(product);
  stockMovements.push({
    id: nextId("mov"),
    productId: product.id,
    type: "OPENING",
    qtyChange: input.stock,
    stockAfter: input.stock,
    reference: "SALDO AWAL",
    reason: "Produk baru",
    date: new Date().toISOString(),
  });
  revalidatePath("/inventaris");
  return ok("Produk ditambahkan", { id: product.id });
}

export async function adjustStock(productId: string, qtyChange: number, reason: string): Promise<ActionResult> {
  if (!reason.trim()) return fail("Alasan penyesuaian wajib diisi");
  if (qtyChange === 0) return fail("Selisih stok tidak boleh 0");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const { error } = await supabase.rpc("adjust_stock", {
      p_product_id: productId,
      p_qty_change: qtyChange,
      p_reason: reason,
    });
    if (error) return fail(error.message);
    revalidatePath("/inventaris");
    return ok("Stok disesuaikan");
  }

  const product = products.find((p) => p.id === productId);
  if (!product) return fail("Produk tidak ditemukan");
  if (product.stock + qtyChange < 0) return fail("Stok hasil penyesuaian tidak boleh negatif");

  product.stock += qtyChange;
  stockMovements.push({
    id: nextId("mov"),
    productId,
    type: "ADJUSTMENT",
    qtyChange,
    stockAfter: product.stock,
    reference: "OPNAME",
    reason,
    date: new Date().toISOString(),
  });
  revalidatePath("/inventaris");
  return ok("Stok disesuaikan");
}

export interface PartyInput {
  id?: string;
  type: PartyType;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export async function saveParty(input: PartyInput): Promise<ActionResult> {
  if (!input.name.trim()) return fail("Nama pihak wajib diisi");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const payload = {
      type: input.type,
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      notes: input.notes,
    };
    const { data, error } = input.id
      ? await supabase.from("parties").update(payload).eq("id", input.id).select("id").single()
      : await supabase.from("parties").insert(payload).select("id").single();
    if (error) return fail(error.message);
    revalidatePath("/pihak");
    return ok("Data pihak tersimpan", { id: String(data?.id ?? input.id ?? "") });
  }

  if (input.id) {
    const party = parties.find((p) => p.id === input.id);
    if (!party) return fail("Data tidak ditemukan");
    Object.assign(party, {
      type: input.type,
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      notes: input.notes,
    });
    revalidatePath("/pihak");
    return ok("Data pihak diperbarui", { id: party.id });
  }

  const party = {
    id: nextId("pty"),
    type: input.type,
    name: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address,
    notes: input.notes,
    balance: 0,
    createdAt: toISODate(new Date()),
  };
  parties.push(party);
  revalidatePath("/pihak");
  return ok("Data pihak ditambahkan", { id: party.id });
}

export async function payDebt(
  debtId: string,
  amount: number,
  bankAccountId: string,
  notes: string,
): Promise<ActionResult> {
  if (!amount || amount <= 0) return fail("Nominal pembayaran harus lebih dari 0");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const { error } = await supabase.rpc("pay_debt", {
      p_debt_id: debtId,
      p_amount: amount,
      p_bank_account_id: bankAccountId,
      p_notes: notes,
    });
    if (error) return fail(error.message);
    revalidatePath("/pihak");
    revalidatePath("/dashboard");
    return ok("Pembayaran tercatat");
  }

  const debt = debts.find((d) => d.id === debtId);
  if (!debt) return fail("Data utang/piutang tidak ditemukan");
  const outstanding = debt.total - debt.paid;
  if (amount > outstanding) return fail("Melebihi sisa tagihan");

  debt.paid += amount;
  debt.status = debt.paid >= debt.total ? "PAID" : "PARTIAL";

  debtPayments.push({
    id: nextId("dbtp"),
    debtId,
    amount,
    date: toISODate(new Date()),
    bankAccountId,
    notes,
  });

  const delta = debt.type === "RECEIVABLE" ? amount : -amount;
  updateAccountBalance(bankAccountId, delta);

  const party = parties.find((p) => p.id === debt.partyId);
  if (party) party.balance -= delta;

  revalidatePath("/pihak");
  revalidatePath("/dashboard");
  return ok("Pembayaran tercatat");
}

export interface BankAccountInput {
  id?: string;
  name: string;
  type: AccountType;
  openingBalance: number;
}

export async function saveBankAccount(input: BankAccountInput): Promise<ActionResult> {
  if (!input.name.trim()) return fail("Nama akun wajib diisi");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const payload = { name: input.name, type: input.type, opening_balance: input.openingBalance };
    const { error } = input.id
      ? await supabase.from("bank_accounts").update(payload).eq("id", input.id)
      : await supabase.from("bank_accounts").insert(payload);
    if (error) return fail(error.message);
    revalidatePath("/pengaturan/akun-bank");
    revalidatePath("/dashboard");
    return ok("Akun tersimpan");
  }

  if (input.id) {
    const account = bankAccounts.find((a) => a.id === input.id);
    if (!account) return fail("Akun tidak ditemukan");
    account.balance += input.openingBalance - account.openingBalance;
    account.openingBalance = input.openingBalance;
    account.name = input.name;
    account.type = input.type;
  } else {
    bankAccounts.push({
      id: nextId("acc"),
      name: input.name,
      type: input.type,
      openingBalance: input.openingBalance,
      balance: input.openingBalance,
      status: "ACTIVE",
    });
  }
  revalidatePath("/pengaturan/akun-bank");
  revalidatePath("/dashboard");
  return ok("Akun tersimpan");
}

export async function saveCategory(name: string, kind: CategoryKind): Promise<ActionResult> {
  if (!name.trim()) return fail("Nama kategori wajib diisi");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const { error } = await supabase.from("categories").insert({ name, kind });
    if (error) return fail(error.message);
    revalidatePath("/transaksi");
    return ok("Kategori ditambahkan");
  }

  categories.push({ id: nextId("cat"), kind, name });
  revalidatePath("/transaksi");
  return ok("Kategori ditambahkan");
}

export interface MemberInput {
  name: string;
  email: string;
  role: Role;
}

export async function inviteMember(input: MemberInput): Promise<ActionResult> {
  if (!input.email.trim()) return fail("Email wajib diisi");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const session = await getSession();
    if (!session) return fail("Sesi berakhir, silakan login kembali");
    const { data: existing } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", session.business.id)
      .eq("email", input.email)
      .limit(1);
    if (existing && existing.length > 0) return fail("Email sudah terdaftar di bisnis ini");
    const { error } = await supabase.from("business_members").insert({
      business_id: session.business.id,
      name: input.name || input.email,
      email: input.email,
      role: input.role,
      status: "INVITED",
    });
    if (error) return fail(error.message);
    revalidatePath("/pengaturan/staf");
    return ok("Anggota diundang");
  }

  if (members.some((m) => m.email.toLowerCase() === input.email.toLowerCase())) {
    return fail("Email sudah terdaftar di bisnis ini");
  }

  members.push({
    id: nextId("mem"),
    businessId: business.id,
    name: input.name || input.email,
    email: input.email,
    role: input.role,
    status: "INVITED",
    joinedAt: toISODate(new Date()),
  });
  revalidatePath("/pengaturan/staf");
  return ok("Anggota diundang");
}

export async function updateMember(memberId: string, role: Role, status: Member["status"]): Promise<ActionResult> {
  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const { error } = await supabase.from("business_members").update({ role, status }).eq("id", memberId);
    if (error) return fail(error.message);
    revalidatePath("/pengaturan/staf");
    return ok("Anggota diperbarui");
  }

  const member = members.find((m) => m.id === memberId);
  if (!member) return fail("Anggota tidak ditemukan");
  if (member.role === "owner") return fail("Role owner tidak bisa diubah");
  member.role = role;
  member.status = status;
  revalidatePath("/pengaturan/staf");
  return ok("Anggota diperbarui");
}

export interface BusinessInput {
  ownerName: string;
  name: string;
  category: string;
}

export async function saveBusiness(input: BusinessInput): Promise<ActionResult> {
  if (!input.name.trim()) return fail("Nama usaha wajib diisi");
  if (!input.ownerName.trim()) return fail("Nama pemilik wajib diisi");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Sesi berakhir, silakan login kembali");
    const { data, error } = await supabase
      .from("businesses")
      .insert({ name: input.name, owner_name: input.ownerName, category: input.category })
      .select("id")
      .single();
    if (error) return fail(error.message);
    await supabase.from("business_members").insert({
      business_id: data.id,
      user_id: user.id,
      name: input.ownerName,
      email: user.email ?? "",
      role: "owner",
      status: "ACTIVE",
    });
    revalidatePath("/dashboard");
    return ok("Bisnis dibuat", { id: String(data.id) });
  }

  business.name = input.name;
  business.ownerName = input.ownerName;
  business.category = input.category;
  revalidatePath("/dashboard");
  return ok("Profil bisnis disimpan");
}

export interface BusinessProfileInput {
  ownerName: string;
  name: string;
  category: string;
}

export async function updateBusiness(input: BusinessProfileInput): Promise<ActionResult> {
  if (!input.name.trim()) return fail("Nama usaha wajib diisi");
  if (!input.ownerName.trim()) return fail("Nama pemilik wajib diisi");

  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    const session = await getSession();
    if (!session) return fail("Sesi berakhir, silakan login kembali");
    const { error } = await supabase
      .from("businesses")
      .update({ name: input.name, owner_name: input.ownerName, category: input.category })
      .eq("id", session.business.id);
    if (error) return fail(error.message);
    revalidatePath("/pengaturan/profil");
    revalidatePath("/dashboard");
    return ok("Profil bisnis disimpan");
  }

  business.name = input.name;
  business.ownerName = input.ownerName;
  business.category = input.category;
  revalidatePath("/pengaturan/profil");
  revalidatePath("/dashboard");
  return ok("Profil bisnis disimpan");
}

export async function markNotificationsRead(): Promise<ActionResult> {
  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    if (!supabase) return fail("Supabase tidak tersedia");
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    revalidatePath("/dashboard");
    return ok("Notifikasi ditandai dibaca");
  }
  notifications.forEach((n) => {
    n.read = true;
  });
  revalidatePath("/dashboard");
  return ok("Notifikasi ditandai dibaca");
}

export async function signOut(): Promise<ActionResult> {
  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    await supabase?.auth.signOut();
  }
  redirect("/login");
  return ok("Berhasil keluar");
}
