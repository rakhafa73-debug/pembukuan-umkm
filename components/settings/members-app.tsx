"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { inviteMember, updateMember } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonClass, Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { TableShell, TD, TH, THead, TR } from "@/components/ui/table";
import type { Member, Role } from "@/lib/types";

const statusTone: Record<Member["status"], "success" | "warning" | "muted"> = {
  ACTIVE: "success",
  INVITED: "warning",
  DISABLED: "muted",
};

const statusLabel: Record<Member["status"], string> = {
  ACTIVE: "Aktif",
  INVITED: "Diundang",
  DISABLED: "Nonaktif",
};

export function MembersApp({ members }: { members: Member[] }) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function changeMember(member: Member, role: Role, status: Member["status"]) {
    setSavingId(member.id);
    try {
      await updateMember(member.id, role, status);
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-500">
          {members.length} anggota · ubah role atau status langsung dari tabel.
        </p>
        <button type="button" className={buttonClass("primary", "md")} onClick={() => setInviteOpen(true)}>
          <Plus className="h-4 w-4" /> Undang anggota
        </button>
      </div>

      <TableShell>
        <THead>
          <tr>
            <TH>Anggota</TH>
            <TH>Status</TH>
            <TH>Role</TH>
            <TH>Bergabung</TH>
          </tr>
        </THead>
        <tbody>
          {members.map((member) => {
            const isOwner = member.role === "owner";
            const saving = savingId === member.id;
            return (
              <TR key={member.id}>
                <TD>
                  <p className="font-medium text-ink-900">{member.name}</p>
                  <p className="text-xs text-ink-400">{member.email}</p>
                </TD>
                <TD>
                  <span className={saving ? "opacity-50" : ""}>
                    <Badge tone={statusTone[member.status]}>{statusLabel[member.status]}</Badge>
                  </span>
                </TD>
                <TD>
                  <Select
                    value={member.role}
                    disabled={isOwner || Boolean(saving)}
                    className="w-32"
                    onChange={(event) => void changeMember(member, event.target.value as Role, member.status)}
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </Select>
                </TD>
                <TD className="text-xs text-ink-500">{formatDate(member.joinedAt)}</TD>
              </TR>
            );
          })}
        </tbody>
      </TableShell>

      {inviteOpen ? <InviteDialog onClose={() => setInviteOpen(false)} /> : null}
    </div>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "staff" as Role });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await inviteMember(form);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onClose();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Undang anggota"
      description="Undangan akan tercatat dan menunggu aktivasi."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="invite-form" disabled={pending}>
            {pending ? "Mengirim…" : "Kirim undangan"}
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
        {error ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{error}</p> : null}
        <Field label="Nama">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </Field>
        <Field label="Role" required>
          <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
            <option value="staff">Staff — transaksi & kasir</option>
            <option value="admin">Admin — laporan & pengaturan</option>
            <option value="owner">Owner — akses penuh</option>
          </Select>
        </Field>
      </form>
    </Dialog>
  );
}
