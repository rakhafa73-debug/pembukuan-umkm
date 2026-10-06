import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";
import { mockSession } from "@/lib/data/store";
import type { AppSession, Role } from "@/lib/types";

export async function getSession(): Promise<AppSession | null> {
  if (!isSupabaseConfigured()) return mockSession;

  const supabase = await supabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, memberRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("business_members")
      .select("role, status, business_id, businesses(id, name, owner_name, category)")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .limit(1)
      .maybeSingle(),
  ]);

  const membership = memberRes.data as unknown as {
    role: Role;
    status: string;
    business_id: string;
    businesses: { id: string; name: string; owner_name: string; category: string } | null;
  } | null;

  if (!membership?.businesses) return null;

  return {
    user: {
      id: user.id,
      name: profileRes.data?.full_name ?? user.email ?? "Pengguna",
      email: user.email ?? "",
    },
    business: {
      id: membership.businesses.id,
      name: membership.businesses.name,
      ownerName: membership.businesses.owner_name,
      category: membership.businesses.category,
      createdAt: "",
    },
    role: membership.role,
  };
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

const ROLE_RANK: Record<Role, number> = { staff: 1, admin: 2, owner: 3 };

export function hasRole(session: AppSession, roles: Role[]) {
  return roles.includes(session.role);
}

export function requireRole(session: AppSession, roles: Role[]) {
  if (!hasRole(session, roles)) redirect("/dashboard");
}

export function atLeast(session: AppSession, role: Role) {
  return ROLE_RANK[session.role] >= ROLE_RANK[role];
}
