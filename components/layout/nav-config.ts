import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const all: Role[] = ["owner", "admin", "staff"];
const management: Role[] = ["owner", "admin"];
const ownerOnly: Role[] = ["owner"];

export const navGroups: NavGroup[] = [
  {
    id: "umum",
    label: "Umum",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: all }],
  },
  {
    id: "transaksi",
    label: "Transaksi",
    items: [
      { href: "/transaksi", label: "Kas Masuk & Keluar", icon: ArrowLeftRight, roles: all },
      { href: "/pos", label: "Kasir (POS)", icon: Receipt, roles: all },
      { href: "/pembelian", label: "Pembelian", icon: ShoppingBag, roles: management },
    ],
  },
  {
    id: "data",
    label: "Data Usaha",
    items: [
      { href: "/inventaris", label: "Inventaris", icon: Package, roles: all },
      { href: "/pihak", label: "Pelanggan & Pemasok", icon: Users, roles: management },
    ],
  },
  {
    id: "analisis",
    label: "Analisis",
    items: [{ href: "/laporan", label: "Laporan Keuangan", icon: BarChart3, roles: management }],
  },
  {
    id: "pengaturan",
    label: "Pengaturan",
    items: [
      { href: "/pengaturan/akun-bank", label: "Akun Kas & Bank", icon: Wallet, roles: ownerOnly },
      { href: "/pengaturan/staf", label: "Staf & Peran", icon: Users, roles: ownerOnly },
      { href: "/pengaturan/profil", label: "Profil Usaha", icon: Settings, roles: management },
    ],
  },
];

export const groupIcons: Record<string, typeof BookOpen> = {
  umum: LayoutDashboard,
  transaksi: ArrowLeftRight,
  data: Package,
  analisis: BarChart3,
  pengaturan: Settings,
};

export function visibleGroups(role: Role): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
