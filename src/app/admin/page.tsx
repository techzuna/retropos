import type { Metadata } from "next";
import { listBackups } from "@/lib/backup";
import { getOrganization, listOutlets, listUsers } from "@/lib/admin";
import { requireRole } from "@/lib/session";
import { AdminPanel } from "./admin-panel";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await requireRole("owner");
  const [outlets, users, org, backups] = await Promise.all([
    listOutlets(session),
    listUsers(session),
    getOrganization(session),
    listBackups(session.orgId),
  ]);

  return (
    <AdminPanel
      currentOutletId={session.outletId}
      organizationName={org.name}
      outlets={outlets}
      users={users}
      backupSettings={{
        frequency: org.backupFrequency,
        retention: org.backupRetention,
        lastBackupAt: org.lastBackupAt?.toISOString() ?? null,
      }}
      backups={backups.map((b) => ({
        filename: b.filename,
        bytes: b.bytes,
        createdAt: b.createdAt.toISOString(),
      }))}
    />
  );
}
