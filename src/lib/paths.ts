import path from "node:path";

/**
 * Where the restaurant's own files live: the SQLite database, the payment-QR
 * and dish images, and the backup JSONs.
 *
 * Defaults to `data/` beside the app, which is right for a box on the shop LAN.
 * `DATA_DIR` exists for hosts where the app root is inside a web-served
 * directory — shared cPanel plans name a subdomain's document root after the
 * domain, and anything under one is downloadable by URL. Pointing DATABASE_URL
 * elsewhere is not enough on its own: the backups are the worst thing to leak
 * (a whole-organization dump including every password and PIN hash) and they
 * are written here, not wherever the database happens to live.
 *
 * Set it to an absolute path outside every document root, e.g.
 *   DATA_DIR=/home/USER/restroreserve-data
 */
export function dataDir(): string {
  const configured = process.env.DATA_DIR?.trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), "data");
}

/** Payment-QR and dish images. */
export function uploadsDir(): string {
  return path.join(dataDir(), "uploads");
}

/** Whole-organization JSON exports. Never serve this directory. */
export function backupDir(): string {
  return path.join(dataDir(), "backups");
}
