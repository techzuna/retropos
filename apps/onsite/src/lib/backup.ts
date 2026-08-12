import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveDb, type Db, type OrgContext } from "./db";
import { PosError } from "@restro/domain/errors";
import { backupDir } from "./paths";

// v2 added `reservations`; v3 the extras catalogue and its links; v4 service
// periods. Older files still restore — they simply predate those features, so
// the arrays are treated as empty rather than rejecting an owner's existing
// nightly backups.
const BACKUP_VERSION = 4;
const RESTORABLE_VERSIONS = [1, 2, 3, 4];

export { backupDir };

export interface OrgBackup {
  version: number;
  exportedAt: string;
  organization: Record<string, unknown>;
  outlets: unknown[];
  users: unknown[];
  tables: unknown[];
  menuCategories: unknown[];
  menuItems: unknown[];
  orders: unknown[];
  orderItems: unknown[];
  reservations?: unknown[];
  modifiers?: unknown[];
  menuItemModifiers?: unknown[];
  orderItemModifiers?: unknown[];
  servicePeriods?: unknown[];
}

/**
 * Complete, plain-JSON export of one organization — everything needed to
 * stand the business back up, including credential hashes. Treat the files
 * like the database itself (they live under data/, never the web root).
 */
export async function exportOrganization({ db, orgId }: OrgContext): Promise<OrgBackup> {
  const organization = await db.organization.findUnique({ where: { id: orgId } });
  if (!organization) throw new PosError("NOT_FOUND", "Organization not found.");

  const outlets = await db.outlet.findMany({ where: { organizationId: orgId } });
  const outletIds = outlets.map((o) => o.id);
  const [users, tables, menuCategories, orders] = await Promise.all([
    db.user.findMany({ where: { organizationId: orgId } }),
    db.diningTable.findMany({ where: { outletId: { in: outletIds } } }),
    db.menuCategory.findMany({ where: { outletId: { in: outletIds } } }),
    db.order.findMany({ where: { outletId: { in: outletIds } } }),
  ]);
  const [menuItems, orderItems, reservations, modifiers] = await Promise.all([
    db.menuItem.findMany({ where: { categoryId: { in: menuCategories.map((c) => c.id) } } }),
    db.orderItem.findMany({ where: { orderId: { in: orders.map((o) => o.id) } } }),
    db.reservation.findMany({ where: { outletId: { in: outletIds } } }),
    db.modifier.findMany({ where: { outletId: { in: outletIds } } }),
  ]);
  const [menuItemModifiers, orderItemModifiers, servicePeriods] = await Promise.all([
    db.menuItemModifier.findMany({ where: { menuItemId: { in: menuItems.map((i) => i.id) } } }),
    db.orderItemModifier.findMany({ where: { orderItemId: { in: orderItems.map((i) => i.id) } } }),
    db.servicePeriod.findMany({ where: { outletId: { in: outletIds } } }),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    organization,
    outlets,
    users,
    tables,
    menuCategories,
    menuItems,
    orders,
    orderItems,
    reservations,
    modifiers,
    menuItemModifiers,
    orderItemModifiers,
    servicePeriods,
  };
}

function timestampSlug(d: Date): string {
  return d.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
}

/** Write a backup file for the org and rotate old ones per its retention. */
export async function writeBackup(ctx: OrgContext, now: Date = new Date()): Promise<string> {
  const { db, orgId } = ctx;
  const backup = await exportOrganization(ctx);
  const dir = backupDir();
  await mkdir(dir, { recursive: true });
  const filename = `${orgId}_${timestampSlug(now)}.json`;
  await writeFile(path.join(dir, filename), JSON.stringify(backup, null, 1), "utf8");

  const org = await db.organization.update({
    where: { id: orgId },
    data: { lastBackupAt: now },
    select: { backupRetention: true },
  });

  // Rotation: newest N kept, per the owner's retention setting.
  const mine = (await readdir(dir)).filter((f) => f.startsWith(`${orgId}_`)).sort();
  for (const old of mine.slice(0, Math.max(0, mine.length - org.backupRetention))) {
    await unlink(path.join(dir, old));
  }
  return filename;
}

export async function listBackups(orgId: string) {
  const dir = backupDir();
  await mkdir(dir, { recursive: true });
  const files = (await readdir(dir)).filter((f) => f.startsWith(`${orgId}_`)).sort().reverse();
  return Promise.all(
    files.map(async (filename) => {
      const s = await stat(path.join(dir, filename));
      return { filename, bytes: s.size, createdAt: s.mtime };
    }),
  );
}

/**
 * Restore an organization from a backup: clear it out and recreate every row
 * with its original id, inside one transaction — the round trip is exact,
 * verified by tests.
 *
 * The delete phase is explicit and child-first rather than leaning on a cascade
 * from `Organization`. `Order.outlet`, `Order.table` and `Order.openedBy` are
 * required relations with no `onDelete`, so Prisma defaults them to `Restrict`:
 * deleting an organization that has *any* order fails on a foreign key. Every
 * delete is scoped through the relation back to `orgId`, so a restore can never
 * reach another organization's rows.
 */
export async function restoreOrganization(db: Db, backup: OrgBackup): Promise<void> {
  if (
    !RESTORABLE_VERSIONS.includes(backup.version) ||
    !backup.organization ||
    !Array.isArray(backup.outlets)
  ) {
    throw new PosError("VALIDATION", "That file doesn't look like a RestroReserve backup.");
  }
  const org = backup.organization as { id?: unknown };
  if (typeof org.id !== "string") {
    throw new PosError("VALIDATION", "That file doesn't look like a RestroReserve backup.");
  }

  // Rows round-trip through JSON (dates become ISO strings, which Prisma
  // accepts for DateTime); Prisma re-validates every field on createMany.
  const rows = (xs: unknown[]) => xs.map((x) => ({ ...(x as Record<string, unknown>) })) as never[];

  const orgId = org.id as string;
  const ofOrg = { outlet: { organizationId: orgId } };

  await db.$transaction(async (tx) => {
    // Child-first, deepest dependency first. Each is a no-op when the caller
    // already emptied the table.
    await tx.reservation.deleteMany({ where: ofOrg });
    await tx.servicePeriod.deleteMany({ where: ofOrg });
    await tx.orderItemModifier.deleteMany({ where: { orderItem: { order: ofOrg } } });
    await tx.orderItem.deleteMany({ where: { order: ofOrg } });
    await tx.order.deleteMany({ where: ofOrg });
    await tx.menuItemModifier.deleteMany({ where: { menuItem: { category: ofOrg } } });
    await tx.menuItem.deleteMany({ where: { category: ofOrg } });
    await tx.modifier.deleteMany({ where: ofOrg });
    await tx.menuCategory.deleteMany({ where: ofOrg });
    await tx.diningTable.deleteMany({ where: ofOrg });
    await tx.user.deleteMany({ where: { organizationId: orgId } });
    await tx.outlet.deleteMany({ where: { organizationId: orgId } });
    await tx.organization.deleteMany({ where: { id: orgId } });

    await tx.organization.create({ data: backup.organization as never });
    if (backup.outlets.length) await tx.outlet.createMany({ data: rows(backup.outlets) });
    if (backup.users.length) await tx.user.createMany({ data: rows(backup.users) });
    if (backup.tables.length) await tx.diningTable.createMany({ data: rows(backup.tables) });
    if (backup.menuCategories.length)
      await tx.menuCategory.createMany({ data: rows(backup.menuCategories) });
    if (backup.menuItems.length) await tx.menuItem.createMany({ data: rows(backup.menuItems) });
    // Extras before the links that reference them.
    const modifiers = backup.modifiers ?? [];
    if (modifiers.length) await tx.modifier.createMany({ data: rows(modifiers) });
    const itemLinks = backup.menuItemModifiers ?? [];
    if (itemLinks.length) await tx.menuItemModifier.createMany({ data: rows(itemLinks) });
    if (backup.orders.length) await tx.order.createMany({ data: rows(backup.orders) });
    if (backup.orderItems.length) await tx.orderItem.createMany({ data: rows(backup.orderItems) });
    const lineExtras = backup.orderItemModifiers ?? [];
    if (lineExtras.length) await tx.orderItemModifier.createMany({ data: rows(lineExtras) });
    // Periods before the reservations that point at them.
    const servicePeriods = backup.servicePeriods ?? [];
    if (servicePeriods.length) await tx.servicePeriod.createMany({ data: rows(servicePeriods) });
    // Last: a reservation can point at a table, a period, and the order it became.
    const reservations = backup.reservations ?? [];
    if (reservations.length) await tx.reservation.createMany({ data: rows(reservations) });
  });
}

export async function restoreFromFile({ db, orgId }: OrgContext, filename: string): Promise<void> {
  // The filename must be one of this org's own backups — no path traversal,
  // no restoring some other organization's data over yours.
  if (!/^[\w-]+\.json$/.test(filename) || !filename.startsWith(`${orgId}_`)) {
    throw new PosError("VALIDATION", "Pick one of this organization's backup files.");
  }
  const raw = await readFile(path.join(backupDir(), filename), "utf8").catch(() => null);
  if (!raw) throw new PosError("NOT_FOUND", "Backup file not found.");
  const backup = JSON.parse(raw) as OrgBackup;
  const backupOrgId = (backup.organization as { id?: unknown })?.id;
  if (backupOrgId !== orgId) {
    throw new PosError("FORBIDDEN", "That backup belongs to a different organization.");
  }
  await restoreOrganization(db, backup);
}

/** The owner's schedule, for the admin screen and the backups API. */
export async function getBackupSettings({ db, orgId }: OrgContext) {
  return db.organization.findUnique({
    where: { id: orgId },
    select: { backupFrequency: true, backupRetention: true, lastBackupAt: true },
  });
}

export async function updateBackupSettings(
  { db, orgId }: OrgContext,
  input: { backupFrequency?: string; backupRetention?: number },
): Promise<void> {
  const { count } = await db.organization.updateMany({ where: { id: orgId }, data: input });
  if (count === 0) throw new PosError("NOT_FOUND", "Organization not found.");
}

const FREQUENCY_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Run by the scheduler: back up every org whose schedule is due.
 *
 * One of only two callers with no session to carry a handle, so it resolves its
 * own (the provisioner would be the other, hosted). Hosted, this iterates the
 * tenant registry and opens each tenant's database in turn — which is why the
 * loop body already takes a context rather than reaching for a shared client.
 */
export async function runDueBackups(now: Date = new Date()): Promise<string[]> {
  const db = await resolveDb();
  const orgs = await db.organization.findMany({
    where: { backupFrequency: { in: ["daily", "weekly"] } },
    select: { id: true, backupFrequency: true, lastBackupAt: true },
  });
  const written: string[] = [];
  for (const org of orgs) {
    const interval = FREQUENCY_MS[org.backupFrequency];
    if (!interval) continue;
    if (!org.lastBackupAt || now.getTime() - org.lastBackupAt.getTime() >= interval) {
      try {
        written.push(await writeBackup({ db, orgId: org.id }, now));
      } catch (err) {
        console.error(`[backup] scheduled backup failed for org ${org.id}:`, err);
      }
    }
  }
  return written;
}
