export type Role = "owner" | "admin" | "staff";

export type TxType = "INCOME" | "EXPENSE" | "SALE" | "PURCHASE";

export type PaymentMethod = "CASH" | "TRANSFER" | "QRIS" | "TEMPO";

export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export type PartyType = "CUSTOMER" | "SUPPLIER" | "BOTH";

export type AccountType = "CASH" | "BANK" | "EWALLET";

export type DebtType = "PAYABLE" | "RECEIVABLE";

export type StockMoveType = "IN" | "OUT" | "ADJUSTMENT" | "OPENING";

export type CategoryKind = "INCOME" | "EXPENSE" | "PRODUCT";

export interface Business {
  id: string;
  ownerName: string;
  name: string;
  category: string;
  createdAt: string;
}

export interface Member {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: Role;
  status: "INVITED" | "ACTIVE" | "DISABLED";
  joinedAt: string;
}

export interface Category {
  id: string;
  kind: CategoryKind;
  name: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  balance: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  balance: number;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  status: "ACTIVE" | "INACTIVE";
  imageUrl: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  type: TxType;
  invoiceNo: string;
  date: string;
  categoryId: string | null;
  partyId: string | null;
  bankAccountId: string;
  amount: number;
  discount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string;
  createdBy: string;
  items: TransactionItem[];
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMoveType;
  qtyChange: number;
  stockAfter: number;
  reference: string;
  reason: string;
  date: string;
}

export interface Debt {
  id: string;
  type: DebtType;
  partyId: string;
  transactionId: string | null;
  total: number;
  paid: number;
  dueDate: string;
  status: "OPEN" | "PARTIAL" | "PAID";
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  bankAccountId: string;
  notes: string;
}

export interface AppNotification {
  id: string;
  kind: "STOCK" | "DUE" | "SYSTEM";
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface AppSession {
  user: { id: string; name: string; email: string };
  business: Business;
  role: Role;
}
