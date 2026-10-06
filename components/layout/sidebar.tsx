"use client";

import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { visibleGroups } from "@/components/layout/nav-config";
import { useSidebar } from "@/components/layout/sidebar-context";
import type { AppSession } from "@/lib/types";

export function Sidebar({ session }: { session: AppSession }) {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggle, closeMobile } = useSidebar();
  const groups = visibleGroups(session.role);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-ink-950/40 lg:hidden"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-ink-950 text-ink-300 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-[76px]" : "lg:w-[260px]",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden" onClick={closeMobile}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
              U
            </span>
            {!collapsed ? (
              <span className="truncate text-sm font-semibold text-white">
                {session.business.name}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-md p-1 text-ink-400 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.id}>
              {!collapsed ? (
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeMobile}
                        title={collapsed ? item.label : undefined}
                        className={[
                          "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          collapsed ? "lg:justify-center lg:px-0" : "",
                          active
                            ? "bg-white/10 text-white"
                            : "text-ink-300 hover:bg-white/5 hover:text-white",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={toggle}
            className={buttonClass("ghost", "sm", "hidden w-full justify-center text-ink-400 hover:bg-white/10 hover:text-white lg:inline-flex")}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed ? <span className="text-xs">Ciutkan menu</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}
