import { listBankAccounts } from "@/lib/data";
import { requireRole, requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { BankAccountsApp } from "@/components/settings/bank-accounts-app";

export default async function BankAccountsSettingsPage() {
  const session = await requireSession();
  requireRole(session, ["owner", "admin"]);
  const accounts = await listBankAccounts();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Akun Keuangan"
        description="Rekening bank, kas, dan e-wallet yang digunakan untuk transaksi."
      />
      <SettingsTabs active="akun-bank" />
      <BankAccountsApp accounts={accounts} />
    </div>
  );
}
