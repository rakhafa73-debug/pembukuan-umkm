import {
  type AppNotification,
  type BankAccount,
  type Business,
  type Category,
  type Debt,
  type DebtPayment,
  type Member,
  type Party,
  type Product,
  type StockMovement,
  type Transaction,
  type TransactionItem,
} from "@/lib/types";
import { toISODate } from "@/lib/format";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let counter = 0;
export function nextId(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export const business: Business = {
  id: "biz_demo",
  ownerName: "Raka Fahlevi",
  name: "Kedai Berkah Jaya",
  category: "Makanan & Minuman",
  createdAt: toISODate(new Date()),
};

export const members: Member[] = [
  {
    id: "mem_1",
    businessId: business.id,
    name: "Raka Fahlevi",
    email: "owner@contoh.id",
    role: "owner",
    status: "ACTIVE",
    joinedAt: toISODate(new Date()),
  },
  {
    id: "mem_2",
    businessId: business.id,
    name: "Dina Amelia",
    email: "dina@contoh.id",
    role: "admin",
    status: "ACTIVE",
    joinedAt: toISODate(new Date()),
  },
  {
    id: "mem_3",
    businessId: business.id,
    name: "Yoga Pratama",
    email: "yoga@contoh.id",
    role: "staff",
    status: "ACTIVE",
    joinedAt: toISODate(new Date()),
  },
  {
    id: "mem_4",
    businessId: business.id,
    name: "Rian Saputra",
    email: "rian@contoh.id",
    role: "staff",
    status: "INVITED",
    joinedAt: toISODate(new Date()),
  },
];

export const categories: Category[] = [
  { id: "cat_inc_1", kind: "INCOME", name: "Penjualan" },
  { id: "cat_inc_2", kind: "INCOME", name: "Jasa" },
  { id: "cat_inc_3", kind: "INCOME", name: "Lain-lain" },
  { id: "cat_exp_1", kind: "EXPENSE", name: "Bahan Baku" },
  { id: "cat_exp_2", kind: "EXPENSE", name: "Operasional" },
  { id: "cat_exp_3", kind: "EXPENSE", name: "Gaji" },
  { id: "cat_exp_4", kind: "EXPENSE", name: "Sewa" },
  { id: "cat_exp_5", kind: "EXPENSE", name: "Listrik & Air" },
  { id: "cat_exp_6", kind: "EXPENSE", name: "Transportasi" },
  { id: "cat_exp_7", kind: "EXPENSE", name: "Lain-lain" },
  { id: "cat_prd_1", kind: "PRODUCT", name: "Minuman" },
  { id: "cat_prd_2", kind: "PRODUCT", name: "Makanan" },
  { id: "cat_prd_3", kind: "PRODUCT", name: "Bahan Baku" },
  { id: "cat_prd_4", kind: "PRODUCT", name: "Kemasan" },
];

export const bankAccounts: BankAccount[] = [
  { id: "acc_1", name: "Kas Tunai", type: "CASH", openingBalance: 500_000, balance: 0, status: "ACTIVE" },
  { id: "acc_2", name: "BCA - Berkah", type: "BANK", openingBalance: 5_000_000, balance: 0, status: "ACTIVE" },
  { id: "acc_3", name: "GoPay Merchant", type: "EWALLET", openingBalance: 250_000, balance: 0, status: "ACTIVE" },
];

const productSeed: Array<[string, string, string, string, number, number, number, number]> = [
  ["KM-001", "Kopi Susu Gula Aren", "cat_prd_1", "pcs", 8_000, 15_000, 120, 20],
  ["KM-002", "Es Teh Manis", "cat_prd_1", "pcs", 3_000, 7_000, 200, 30],
  ["KM-003", "Air Mineral 600ml", "cat_prd_1", "botol", 2_500, 4_000, 180, 24],
  ["MM-001", "Roti Bakar Cokelat", "cat_prd_2", "porsi", 6_000, 12_000, 40, 10],
  ["MM-002", "Nasi Goreng Spesial", "cat_prd_2", "porsi", 12_000, 22_000, 25, 8],
  ["MM-003", "Mie Goreng Jawa", "cat_prd_2", "porsi", 10_000, 18_000, 30, 8],
  ["MM-004", "Pisang Goreng 5 pcs", "cat_prd_2", "porsi", 5_000, 10_000, 6, 8],
  ["MM-005", "Kentang Goreng", "cat_prd_2", "porsi", 7_000, 14_000, 18, 6],
  ["BB-001", "Gula Aren Cair 1L", "cat_prd_3", "liter", 25_000, 30_000, 24, 6],
  ["BB-002", "Biji Kopi Robusta 1kg", "cat_prd_3", "kg", 95_000, 110_000, 15, 5],
  ["KM-004", "Sedotan Plastik 50 pcs", "cat_prd_4", "pak", 5_000, 8_000, 60, 12],
  ["KM-005", "Cup 16oz 50 pcs", "cat_prd_4", "pak", 18_000, 25_000, 9, 12],
];

export const products: Product[] = productSeed.map(([sku, name, categoryId, unit, cost, sellPrice, stock, minStock], index) => ({
  id: `prd_${index + 1}`,
  sku,
  barcode: `899${(100000000 + index * 1234567).toString()}`,
  name,
  categoryId,
  unit,
  costPrice: cost,
  sellPrice,
  stock,
  minStock,
  status: "ACTIVE",
  imageUrl: "",
}));

export const parties: Party[] = [
  {
    id: "pty_1",
    type: "CUSTOMER",
    name: "Bu Sari",
    phone: "0812-1111-2222",
    email: "sari@contoh.id",
    address: "Jl. Melati No. 12, Bandung",
    notes: "Pelanggan langganan kantor",
    balance: 0,
    createdAt: toISODate(new Date()),
  },
  {
    id: "pty_2",
    type: "CUSTOMER",
    name: "Kantor Pos Cabang Utama",
    phone: "022-555-8899",
    email: "pos@contoh.id",
    address: "Jl. Merdeka No. 1, Bandung",
    notes: "Pembelian rutin bulanan",
    balance: 0,
    createdAt: toISODate(new Date()),
  },
  {
    id: "pty_3",
    type: "CUSTOMER",
    name: "Warung Sederhana",
    phone: "0857-9999-0001",
    email: "",
    address: "Coblong, Bandung",
    notes: "",
    balance: 0,
    createdAt: toISODate(new Date()),
  },
  {
    id: "pty_4",
    type: "CUSTOMER",
    name: "Rina Kusuma",
    phone: "0813-4444-5555",
    email: "rina@contoh.id",
    address: "Dago, Bandung",
    notes: "Pesanan acara",
    balance: 0,
    createdAt: toISODate(new Date()),
  },
  {
    id: "pty_5",
    type: "SUPPLIER",
    name: "CV Gula Aren Nusantara",
    phone: "0811-2233-4455",
    email: "sales@gulaaren.id",
    address: "Cimahi, Jawa Barat",
    notes: "Supplier gula aren utama",
    balance: 0,
    createdAt: toISODate(new Date()),
  },
  {
    id: "pty_6",
    type: "SUPPLIER",
    name: "Bahan Maju Distribusi",
    phone: "0812-3322-1100",
    email: "order@bahanmaju.id",
    address: "Pasteur, Bandung",
    notes: "",
    balance: 0,
    createdAt: toISODate(new Date()),
  },
  {
    id: "pty_7",
    type: "SUPPLIER",
    name: "Percetakan Cepat",
    phone: "0821-7788-9900",
    email: "",
    address: "Lembang, Bandung",
    notes: "Cetak cup & kemasan",
    balance: 0,
    createdAt: toISODate(new Date()),
  },
  {
    id: "pty_8",
    type: "BOTH",
    name: "Toko Grosir Rejeki",
    phone: "0878-1010-2020",
    email: "rejeki@grosir.id",
    address: "Andir, Bandung",
    notes: "Sekaligus pelanggan & pemasok",
    balance: 0,
    createdAt: toISODate(new Date()),
  },
];

export const notifications: AppNotification[] = [];

export const debts: Debt[] = [];
export const debtPayments: DebtPayment[] = [];
export const transactions: Transaction[] = [];
export const stockMovements: StockMovement[] = [];

const expensePool: Array<[string, string]> = [
  ["cat_exp_1", "Beli bahan baku harian"],
  ["cat_exp_2", "Perlengkapan toko"],
  ["cat_exp_5", "Tagihan listrik"],
  ["cat_exp_6", "Ongkos antar"],
  ["cat_exp_7", "Biaya admin transfer"],
];

function daysAgoISO(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function buildSeed() {
  const rand = mulberry32(20261006);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

  const openingStock = new Map(products.map((p) => [p.id, p.stock]));
  const stockAfter = new Map(products.map((p) => [p.id, p.stock]));

  let saleSeq = 0;
  let purchaseSeq = 0;
  let expenseSeq = 0;
  let incomeSeq = 0;

  for (let day = 29; day >= 0; day -= 1) {
    const date = daysAgoISO(day);
    const dateStr = toISODate(date);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const saleCount = weekend ? int(9, 16) : int(5, 12);

    for (let s = 0; s < saleCount; s += 1) {
      saleSeq += 1;
      const txId = `txn_s_${saleSeq}`;
      const itemCount = int(1, 3);
      const chosen = new Set<number>();
      while (chosen.size < itemCount) chosen.add(int(0, products.length - 1));

      const items: TransactionItem[] = [...chosen].map((idx) => {
        const product = products[idx];
        const qty = int(1, 3);
        const subtotal = product.sellPrice * qty;
        return {
          id: `itm_${txId}_${idx}`,
          transactionId: txId,
          productId: product.id,
          productName: product.name,
          qty,
          unitPrice: product.sellPrice,
          discount: 0,
          subtotal,
        };
      });

      const gross = items.reduce((sum, item) => sum + item.subtotal, 0);
      const discount = rand() > 0.85 ? Math.round(gross * 0.05) : 0;
      const methodRoll = rand();
      const paymentMethod = methodRoll > 0.82 ? "TEMPO" : methodRoll > 0.62 ? "QRIS" : methodRoll > 0.45 ? "TRANSFER" : "CASH";
      const isTempo = paymentMethod === "TEMPO";
      const hour = int(8, 20);
      const minute = int(0, 59);

      transactions.push({
        id: txId,
        type: "SALE",
        invoiceNo: `INV-${dateStr.slice(0, 4)}${dateStr.slice(5, 7)}-${String(saleSeq).padStart(3, "0")}`,
        date: `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
        categoryId: "cat_inc_1",
        partyId: isTempo ? pick(["pty_1", "pty_2", "pty_4"]) : null,
        bankAccountId: paymentMethod === "CASH" ? "acc_1" : paymentMethod === "QRIS" ? "acc_3" : "acc_2",
        amount: gross - discount,
        discount,
        paymentMethod,
        paymentStatus: isTempo ? "UNPAID" : "PAID",
        notes: isTempo ? "Penjualan tempo" : "",
        createdBy: rand() > 0.5 ? "mem_3" : "mem_1",
        items,
      });

      for (const item of items) {
        const after = (stockAfter.get(item.productId) ?? 0) - item.qty;
        stockAfter.set(item.productId, after);
        stockMovements.push({
          id: `mov_${txId}_${item.productId}`,
          productId: item.productId,
          type: "OUT",
          qtyChange: -item.qty,
          stockAfter: after,
          reference: `INV-${dateStr.slice(0, 4)}${dateStr.slice(5, 7)}-${String(saleSeq).padStart(3, "0")}`,
          reason: "Penjualan",
          date: `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
        });
      }
    }

    if (rand() > 0.7) {
      expenseSeq += 1;
      const [categoryId, label] = pick(expensePool);
      const amount = int(3, 25) * 10_000;
      transactions.push({
        id: `txn_e_${expenseSeq}`,
        type: "EXPENSE",
        invoiceNo: `KLR-${dateStr.slice(0, 4)}${dateStr.slice(5, 7)}-${String(expenseSeq).padStart(3, "0")}`,
        date: `${dateStr}T${String(int(9, 17)).padStart(2, "0")}:15:00`,
        categoryId,
        partyId: null,
        bankAccountId: rand() > 0.5 ? "acc_1" : "acc_2",
        amount,
        discount: 0,
        paymentMethod: rand() > 0.5 ? "CASH" : "TRANSFER",
        paymentStatus: "PAID",
        notes: label,
        createdBy: "mem_2",
        items: [],
      });
    }

    if (rand() > 0.9) {
      incomeSeq += 1;
      transactions.push({
        id: `txn_i_${incomeSeq}`,
        type: "INCOME",
        invoiceNo: `KMS-${dateStr.slice(0, 4)}${dateStr.slice(5, 7)}-${String(incomeSeq).padStart(3, "0")}`,
        date: `${dateStr}T${String(int(9, 16)).padStart(2, "0")}:30:00`,
        categoryId: pick(["cat_inc_2", "cat_inc_3"]),
        partyId: null,
        bankAccountId: "acc_2",
        amount: int(5, 30) * 10_000,
        discount: 0,
        paymentMethod: "TRANSFER",
        paymentStatus: "PAID",
        notes: "Pemasukan lain-lain",
        createdBy: "mem_1",
        items: [],
      });
    }

    if (day % 7 === 3) {
      purchaseSeq += 1;
      const supplierId = pick(["pty_5", "pty_6", "pty_7"]);
      const product = pick(products);
      const qty = int(10, 30);
      const txId = `txn_p_${purchaseSeq}`;
      const invoiceNo = `PUK-${dateStr.slice(0, 4)}${dateStr.slice(5, 7)}-${String(purchaseSeq).padStart(3, "0")}`;
      const isTempo = rand() > 0.6;
      const amount = product.costPrice * qty;

      transactions.push({
        id: txId,
        type: "PURCHASE",
        invoiceNo,
        date: `${dateStr}T10:00:00`,
        categoryId: "cat_exp_1",
        partyId: supplierId,
        bankAccountId: "acc_2",
        amount,
        discount: 0,
        paymentMethod: isTempo ? "TEMPO" : "TRANSFER",
        paymentStatus: isTempo ? "UNPAID" : "PAID",
        notes: `Restok ${product.name}`,
        createdBy: "mem_1",
        items: [
          {
            id: `itm_${txId}`,
            transactionId: txId,
            productId: product.id,
            productName: product.name,
            qty,
            unitPrice: product.costPrice,
            discount: 0,
            subtotal: amount,
          },
        ],
      });

      const after = (stockAfter.get(product.id) ?? 0) + qty;
      stockAfter.set(product.id, after);
      stockMovements.push({
        id: `mov_${txId}`,
        productId: product.id,
        type: "IN",
        qtyChange: qty,
        stockAfter: after,
        reference: invoiceNo,
        reason: "Pembelian",
        date: `${dateStr}T10:00:00`,
      });

      if (isTempo) {
        const due = daysAgoISO(day - 14);
        debts.push({
          id: `dbt_p_${purchaseSeq}`,
          type: "PAYABLE",
          partyId: supplierId,
          transactionId: txId,
          total: amount,
          paid: 0,
          dueDate: toISODate(due),
          status: "OPEN",
        });
      }
    }
  }

  const tempoSales = transactions.filter((t) => t.type === "SALE" && t.paymentStatus === "UNPAID");
  tempoSales.slice(-3).forEach((tx, index) => {
    const due = new Date();
    due.setDate(due.getDate() + [4, -9, 12][index % 3]);
    debts.push({
      id: `dbt_r_${index + 1}`,
      type: "RECEIVABLE",
      partyId: tx.partyId ?? "pty_1",
      transactionId: tx.id,
      total: tx.amount,
      paid: index === 1 ? Math.round(tx.amount * 0.4) : 0,
      dueDate: toISODate(due),
      status: index === 1 ? "PARTIAL" : "OPEN",
    });
  });

  products.forEach((product) => {
    const opening = openingStock.get(product.id) ?? 0;
    product.stock = stockAfter.get(product.id) ?? opening;
    stockMovements.unshift({
      id: `mov_open_${product.id}`,
      productId: product.id,
      type: "OPENING",
      qtyChange: opening,
      stockAfter: opening,
      reference: "SALDO AWAL",
      reason: "Saldo awal pembukuan",
      date: `${toISODate(daysAgoISO(30))}T08:00:00`,
    });
  });

  const accountBalances = new Map<string, number>(bankAccounts.map((a) => [a.id, a.openingBalance]));
  transactions.forEach((tx) => {
    const current = accountBalances.get(tx.bankAccountId) ?? 0;
    if (tx.type === "INCOME" || tx.type === "SALE") {
      accountBalances.set(tx.bankAccountId, current + tx.amount);
    } else {
      accountBalances.set(tx.bankAccountId, current - tx.amount);
    }
  });
  bankAccounts.forEach((account) => {
    account.balance = accountBalances.get(account.id) ?? account.openingBalance;
  });

  debts.forEach((debt) => {
    const party = parties.find((p) => p.id === debt.partyId);
    if (!party) return;
    const outstanding = debt.total - debt.paid;
    party.balance += debt.type === "RECEIVABLE" ? outstanding : -outstanding;
  });

  notifications.push(
    ...products
      .filter((product) => product.stock <= product.minStock)
      .map((product) => ({
        id: `ntf_stock_${product.id}`,
        kind: "STOCK" as const,
        title: "Stok menipis",
        body: `${product.name} tersisa ${product.stock} ${product.unit}`,
        date: toISODate(new Date()),
        read: false,
      })),
  );

  debts
    .filter((debt) => debt.status !== "PAID")
    .forEach((debt) => {
      const party = parties.find((p) => p.id === debt.partyId);
      const diff = Math.round(
        (new Date(`${debt.dueDate}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
      );
      if (diff <= 7) {
        notifications.push({
          id: `ntf_due_${debt.id}`,
          kind: "DUE",
          title: diff < 0 ? "Lewat jatuh tempo" : "Jatuh tempo segera",
          body: `${debt.type === "PAYABLE" ? "Utang" : "Piutang"} ${party?.name ?? "-"} jatuh tempo ${Math.abs(diff)} hari lagi`,
          date: toISODate(new Date()),
          read: false,
        });
      }
    });
}

buildSeed();

export const mockSession = {
  user: { id: "mem_1", name: "Raka Fahlevi", email: "owner@contoh.id" },
  business,
  role: "owner" as const,
};
