import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PosError } from "./errors";
import { uploadsDir } from "./paths";
import type { SessionContext } from "./session";

const MAX_QR_BYTES = 2 * 1024 * 1024;
const MAX_ITEM_BYTES = 4 * 1024 * 1024; // dish photos come straight off a phone
const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Reverse the extension map for serving; defaults to PNG for an odd file. */
function contentTypeOf(filename: string): string {
  const ext = filename.split(".").pop() ?? "png";
  return Object.entries(EXT_BY_MIME).find(([, e]) => e === ext)?.[0] ?? "image/png";
}

/** Store the outlet's payment QR image and remember its path. */
export async function saveQrImage(ctx: SessionContext, file: File): Promise<void> {
  const ext = EXT_BY_MIME[file.type];
  if (!ext) throw new PosError("VALIDATION", "Upload the QR as a PNG, JPEG, or WebP image.");
  if (file.size > MAX_QR_BYTES) throw new PosError("VALIDATION", "QR image must be under 2 MB.");

  await mkdir(uploadsDir(), { recursive: true });
  const filename = `qr_${ctx.outletId}.${ext}`;
  await writeFile(path.join(uploadsDir(), filename), Buffer.from(await file.arrayBuffer()));
  await ctx.db.outlet.update({ where: { id: ctx.outletId }, data: { qrImagePath: filename } });
}

/**
 * Store a menu item's photo. Same shape as the QR upload: the filename is
 * server-generated from the item id, so nothing user-supplied reaches the path.
 */
export async function saveItemImage(
  ctx: SessionContext,
  menuItemId: string,
  file: File,
): Promise<void> {
  const ext = EXT_BY_MIME[file.type];
  if (!ext) throw new PosError("VALIDATION", "Upload the photo as a PNG, JPEG, or WebP image.");
  if (file.size > MAX_ITEM_BYTES) throw new PosError("VALIDATION", "Photo must be under 4 MB.");

  const item = await ctx.db.menuItem.findFirst({
    where: { id: menuItemId, category: { outletId: ctx.outletId } },
    select: { id: true },
  });
  if (!item) throw new PosError("NOT_FOUND", "Item not found.");

  await mkdir(uploadsDir(), { recursive: true });
  const filename = `item_${item.id}.${ext}`;
  await writeFile(path.join(uploadsDir(), filename), Buffer.from(await file.arrayBuffer()));
  await ctx.db.menuItem.update({ where: { id: item.id }, data: { imagePath: filename } });
}

/** Read a menu item's photo for serving; null when none uploaded. */
export async function readItemImage(
  ctx: SessionContext,
  menuItemId: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const item = await ctx.db.menuItem.findFirst({
    where: { id: menuItemId, category: { outletId: ctx.outletId } },
    select: { imagePath: true },
  });
  if (!item?.imagePath) return null;
  // Path is server-generated (item_<id>.<ext>), never user input.
  const bytes = await readFile(path.join(uploadsDir(), item.imagePath)).catch(() => null);
  if (!bytes) return null;
  return { bytes, contentType: contentTypeOf(item.imagePath) };
}

/** Read the outlet's QR for serving; null when none uploaded. */
export async function readQrImage(
  ctx: SessionContext,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const outlet = await ctx.db.outlet.findUnique({
    where: { id: ctx.outletId },
    select: { qrImagePath: true },
  });
  if (!outlet?.qrImagePath) return null;
  // Path is server-generated (qr_<outletId>.<ext>), never user input.
  const bytes = await readFile(path.join(uploadsDir(), outlet.qrImagePath)).catch(() => null);
  if (!bytes) return null;
  return { bytes, contentType: contentTypeOf(outlet.qrImagePath) };
}
