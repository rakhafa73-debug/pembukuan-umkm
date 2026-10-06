"use client";

import { Bell, ChevronDown, LogOut, Menu, Search, Settings, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { markNotificationsRead, signOut } from "@/lib/actions";
import { visibleGroups } from "@/components/layout/nav-config";
import { useSidebar } from "@/components/layout/sidebar-context";
import { Badge } from "@/components/ui/badge";
import type { AppNotification, AppSession } from "@/lib/types";

export interface SearchEntry {
  href: string;
  label: string;
  group: string;
  detail?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", key);
    };
  }, [open, close]);
  return ref;
}

function GlobalSearch({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 6);
    return entries
      .filter((entry) => entry.label.toLowerCase().includes(q) || entry.detail?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [entries, query]);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Cari menu, produk, pelanggan…"
        className="h-10 w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      {open ? (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-ink-500">Tidak ada hasil untuk “{query}”</p>
          ) : (
            results.map((entry) => (
              <button
                key={`${entry.href}-${entry.label}`}
                type="button"
                onClick={() => {
                  router.push(entry.href);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-ink-50"
              >
                <span className="truncate text-ink-800">{entry.label}</span>
                <span className="shrink-0 text-[11px] text-ink-400">{entry.group}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function NotificationsMenu({ items }: { items: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const router = useRouter();
  const unread = items.filter((item) => !item.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800"
        aria-label="Notifikasi"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Notifikasi</p>
            <button
              type="button"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
              onClick={async () => {
                await markNotificationsRead();
                router.refresh();
              }}
            >
              Tandai dibaca
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-ink-500">Belum ada notifikasi</li>
            ) : (
              items.map((item) => (
                <li key={item.id} className={`border-b border-line px-4 py-3 last:border-0 ${item.read ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        item.kind === "STOCK" ? "bg-warning-500" : item.kind === "DUE" ? "bg-danger-500" : "bg-brand-500"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-ink-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{item.body}</p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function UserMenu({ session }: { session: AppSession }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const router = useRouter();

  const roleLabel = session.role === "owner" ? "Owner" : session.role === "admin" ? "Admin" : "Staf";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg p-1 hover:bg-ink-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {initials(session.user.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-semibold text-ink-900">{session.user.name}</span>
          <span className="block text-[11px] text-ink-500">{roleLabel}</span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-ink-400 sm:block" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink-900">{session.user.name}</p>
            <p className="truncate text-xs text-ink-500">{session.user.email}</p>
          </div>
          <div className="flex items-start gap-2 border-b border-line px-4 py-3">
            <Store className="mt-0.5 h-4 w-4 text-ink-400" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-ink-800">{session.business.name}</p>
              <p className="text-[11px] text-ink-500">{session.business.category}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="flex items-center gap-2 text-xs text-ink-600">
              <UserRound className="h-3.5 w-3.5" /> Peran
            </span>
            <Badge tone={session.role === "owner" ? "brand" : "muted"}>{roleLabel}</Badge>
          </div>
          <div className="border-t border-line p-2">
            <Link
              href="/pengaturan/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-ink-700 hover:bg-ink-50"
            >
              <Settings className="h-3.5 w-3.5" /> Pengaturan
            </Link>
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.refresh();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-danger-700 hover:bg-danger-50"
            >
              <LogOut className="h-3.5 w-3.5" /> Keluar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Topbar({ session, notifications, searchEntries }: { session: AppSession; notifications: AppNotification[]; searchEntries: SearchEntry[] }) {
  const { openMobile } = useSidebar();
  const groups = visibleGroups(session.role);

  const navEntries: SearchEntry[] = groups.flatMap((group) =>
    group.items.map((item) => ({
      href: item.href,
      label: item.label,
      group: group.label,
    })),
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={openMobile}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <GlobalSearch entries={[...navEntries, ...searchEntries]} />

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationsMenu items={notifications} />
        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />
        <UserMenu session={session} />
      </div>
    </header>
  );
}
