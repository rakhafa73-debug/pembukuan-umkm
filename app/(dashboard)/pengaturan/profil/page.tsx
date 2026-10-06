import { atLeast, requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { BusinessForm } from "@/components/settings/business-form";

export default async function ProfileSettingsPage() {
  const session = await requireSession();
  const canEdit = atLeast(session, "admin");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengaturan"
        description="Profil bisnis, tim, dan akun keuangan dalam satu tempat."
      />
      <SettingsTabs active="profil" />
      {canEdit ? (
        <BusinessForm session={session} />
      ) : (
        <p className="rounded-card border border-line bg-surface px-4 py-6 text-sm text-ink-500">
          Hanya owner atau admin yang dapat mengubah profil bisnis.
        </p>
      )}
    </div>
  );
}
