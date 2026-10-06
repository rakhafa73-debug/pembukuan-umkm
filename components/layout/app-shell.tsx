"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Topbar, type SearchEntry } from "@/components/layout/topbar";
import type { AppNotification, AppSession } from "@/lib/types";

export function AppShell({
  session,
  notifications,
  searchEntries,
  children,
}: {
  session: AppSession;
  notifications: AppNotification[];
  searchEntries: SearchEntry[];
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar session={session} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar session={session} notifications={notifications} searchEntries={searchEntries} />
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
          <footer className="px-6 py-4 text-center text-[11px] text-ink-400">
            Pembukuan UMKM · Next.js + Supabase
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
