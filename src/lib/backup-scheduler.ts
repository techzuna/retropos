import { runDueBackups } from "./backup";

const CHECK_EVERY_MS = 60 * 60 * 1000; // hourly is plenty for daily/weekly schedules

const globalForScheduler = globalThis as unknown as { rrBackupTimer?: ReturnType<typeof setInterval> };

/** Started once per server process from instrumentation.ts. */
export function startBackupScheduler(): void {
  if (globalForScheduler.rrBackupTimer) return;

  const tick = async () => {
    try {
      const written = await runDueBackups();
      if (written.length > 0) console.info(`[backup] wrote ${written.length} scheduled backup(s)`);
    } catch (err) {
      console.error("[backup] scheduler tick failed:", err);
    }
  };

  // First check shortly after boot (catches schedules missed while off),
  // then hourly for as long as the process lives.
  setTimeout(tick, 60 * 1000);
  globalForScheduler.rrBackupTimer = setInterval(tick, CHECK_EVERY_MS);
}
