import { listMembers } from "@/lib/data";
import { requireRole, requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { MembersApp } from "@/components/settings/members-app";

export default async function StaffSettingsPage() {
  const session = await requireSession();
  requireRole(session, ["owner", "admin"]);
  const members = await listMembers();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staf & Anggota"
        description="Atur siapa saja yang boleh mengakses aplikasi beserta perannya."
      />
      <SettingsTabs active="staf" />
      <MembersApp members={members} />
    </div>
  );
}
