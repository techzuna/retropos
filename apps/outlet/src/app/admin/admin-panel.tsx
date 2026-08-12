"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/Dialog";
import { failureMessage } from "@/lib/fetch-error";

interface OutletRow {
  id: string;
  name: string;
  address: string;
  phone: string;
  currency: string;
  timezone: string;
  qrImagePath: string;
  active: boolean;
}

interface UserRow {
  id: string;
  name: string;
  email: string | null;
  role: string;
  outletId: string | null;
  active: boolean;
}

interface AdminPanelProps {
  currentOutletId: string;
  organizationName: string;
  outlets: OutletRow[];
  users: UserRow[];
  backupSettings: { frequency: string; retention: number; lastBackupAt: string | null };
  backups: Array<{ filename: string; bytes: number; createdAt: string }>;
}

export function AdminPanel(props: AdminPanelProps) {
  const router = useRouter();
  const { ask, confirm, dialog } = useDialog();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = props.outlets.find((o) => o.id === props.currentOutletId);

  async function call(url: string, method: string, body?: unknown, doneMessage?: string) {
    if (busy) return false;
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).catch(() => null);
    const ok = Boolean(res?.ok);
    if (!ok) setError(await failureMessage(res)); else if (doneMessage) {
      setNotice(doneMessage);
    }
    setBusy(false);
    router.refresh();
    return ok;
  }

  // --- new user form state
  const [newUser, setNewUser] = useState({ name: "", role: "staff", email: "", password: "", pin: "", outletId: props.currentOutletId });
  const [newOutletName, setNewOutletName] = useState("");

  return (
    <div className="space-y-10 pt-6">
      {dialog}
      <h1 className="font-display text-2xl">{props.organizationName} — Admin</h1>

      {(error || notice) && (
        <p
          role="alert"
          className={`border px-3 py-2 text-sm ${
            error ? "border-madder/40 bg-madder/5 text-madder-deep" : "border-leaf/40 bg-leaf/10"
          }`}
        >
          {error ?? notice}
        </p>
      )}

      {/* Outlets */}
      <section>
        <h2 className="font-display text-xl text-madder-deep">Outlets</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {props.outlets.map((outlet) => (
            <div key={outlet.id} className={`border bg-white p-4 ${outlet.id === current?.id ? "border-madder" : "border-line"}`}>
              <div className="flex items-baseline justify-between">
                <p className="font-medium">{outlet.name}</p>
                {outlet.id === current?.id ? (
                  <span className="text-xs text-madder-deep">this device</span>
                ) : (
                  <button
                    type="button"
                    className="text-xs underline underline-offset-2"
                    onClick={() => call("/api/auth/outlet", "POST", { outletId: outlet.id }, `Switched to ${outlet.name}.`)}
                  >
                    switch here
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-soft">{`${outlet.address || "No address"} · ${outlet.currency} · ${outlet.timezone}`}</p>
              {outlet.id === current?.id && (
                <p className="mt-1 text-xs text-ink-soft">
                  Staff at this outlet can sign in on this device with their PIN.
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4">
                <button
                  type="button"
                  className="text-sm underline underline-offset-2"
                  onClick={async () => {
                    const v = await ask({
                      title: `Edit ${outlet.name}`,
                      fields: [
                        { name: "name", label: "Outlet name", value: outlet.name, maxLength: 100 },
                        { name: "address", label: "Address", value: outlet.address, maxLength: 300 },
                        { name: "phone", label: "Phone", value: outlet.phone, type: "tel", maxLength: 30 },
                      ],
                      submitLabel: "Save outlet",
                    });
                    if (!v?.name.trim()) return;
                    void call(`/api/outlets/${outlet.id}`, "PATCH", {
                      name: v.name.trim(),
                      address: v.address,
                      phone: v.phone,
                    });
                  }}
                >
                  edit details
                </button>
                <button
                  type="button"
                  className="text-sm underline underline-offset-2"
                  onClick={async () => {
                    // The timezone decides which local day a sale lands in and
                    // what wall clock a service period means, so it is worth
                    // saying so here rather than leaving it a bare field.
                    const v = await ask({
                      title: `Timezone for ${outlet.name}`,
                      message: "Sets which local day a sale counts in, and what wall clock a service period means.",
                      fields: [
                        {
                          name: "timezone",
                          label: "IANA timezone",
                          value: outlet.timezone,
                          maxLength: 64,
                          options: ["UTC", "Asia/Kathmandu", "Asia/Kolkata", "Europe/London", "America/New_York"],
                          hint: "New outlets default to UTC.",
                        },
                      ],
                      submitLabel: "Set timezone",
                    });
                    const timezone = v?.timezone.trim();
                    if (!timezone || timezone === outlet.timezone) return;
                    void call(
                      `/api/outlets/${outlet.id}`,
                      "PATCH",
                      { timezone },
                      `${outlet.name} now keeps time in ${timezone}.`,
                    );
                  }}
                >
                  {`timezone: ${outlet.timezone}`}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            placeholder="New outlet name"
            value={newOutletName}
            onChange={(e) => setNewOutletName(e.target.value)}
            className="border border-line bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!newOutletName.trim() || busy}
            className="btn btn-secondary text-sm disabled:opacity-40"
            onClick={() => {
              const name = newOutletName.trim();
              setNewOutletName("");
              void call("/api/outlets", "POST", { name }, `Outlet "${name}" created.`);
            }}
          >
            Add outlet
          </button>
        </div>
      </section>

      {/* Device pairing */}
      <section>
        <h2 className="font-display text-xl text-madder-deep">This device</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {`Paired to ${current?.name ?? "an outlet"}. Staff sign in and out with PINs all day; unpairing is only for retiring or reassigning a tablet — afterwards someone needs an email and password to set it up again.`}
        </p>
        <button
          type="button"
          disabled={busy}
          className="btn btn-secondary mt-3 text-sm disabled:opacity-40"
          onClick={async () => {
            const ok = await confirm({
              title: "Unpair this device?",
              message:
                "Staff can't sign in here until a manager signs in with their password again. Only for retiring or reassigning a tablet.",
              confirmLabel: "Unpair",
              danger: true,
            });
            if (!ok) return;
            const res = await fetch("/api/auth/unpair", { method: "POST" }).catch(() => null);
            if (res?.ok) {
              router.push("/login");
              router.refresh();
            } else {
              setError("Couldn't unpair — try again.");
            }
          }}
        >
          Unpair this device
        </button>
      </section>

      {/* Payment QR for the attached outlet */}
      <section>
        <h2 className="font-display text-xl text-madder-deep">{`Payment QR — ${current?.name ?? "outlet"}`}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Shown to customers when staff settle an order. Upload the bank/wallet QR for this outlet.
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          {current?.qrImagePath ? (
            // eslint-disable-next-line @next/next/no-img-element -- self-hosted file, no optimizer
            <img src="/api/settings/qr" alt="Current payment QR" className="h-40 w-40 border border-line object-contain" />
          ) : (
            <p className="flex h-40 w-40 items-center justify-center border border-dashed border-line text-center text-xs text-ink-soft">
              No QR yet
            </p>
          )}
          <label className="btn btn-secondary cursor-pointer text-sm">
            {busy ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setError(null);
                const form = new FormData();
                form.append("file", file);
                const res = await fetch("/api/settings/qr", { method: "POST", body: form }).catch(() => null);
                if (!res?.ok) {
                  const data = res ? await res.json().catch(() => null) : null;
                  setError(data?.error ?? "Upload failed — try again.");
                } else {
                  setNotice("QR updated.");
                }
                setBusy(false);
                router.refresh();
              }}
            />
          </label>
        </div>
      </section>

      {/* Users */}
      <section>
        <h2 className="font-display text-xl text-madder-deep">People</h2>
        <ul className="mt-3 divide-y divide-line border border-line bg-white">
          {props.users.map((user) => (
            <li key={user.id} className={`flex flex-wrap items-center gap-2 px-3 py-2 ${user.active ? "" : "opacity-50"}`}>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {user.name} <span className="text-xs font-normal text-ink-soft">{user.role}</span>
                </p>
                <p className="text-xs text-ink-soft">
                  {user.email ?? "PIN only"}
                  {user.outletId ? ` · ${props.outlets.find((o) => o.id === user.outletId)?.name ?? ""}` : " · all outlets"}
                </p>
              </div>
              <button
                type="button"
                className="border border-line px-2 py-1.5 text-xs"
                onClick={async () => {
                  const v = await ask({
                    title: `New PIN for ${user.name}`,
                    fields: [
                      { name: "pin", label: "4-digit PIN", type: "number", maxLength: 4, placeholder: "0000" },
                    ],
                    submitLabel: "Set PIN",
                  });
                  const pin = v?.pin.trim();
                  if (!pin) return;
                  if (!/^\d{4}$/.test(pin)) {
                    setError("PIN must be exactly 4 digits.");
                    return;
                  }
                  void call(`/api/users/${user.id}`, "PATCH", { pin }, `PIN updated for ${user.name}.`);
                }}
              >
                reset PIN
              </button>
              <button
                type="button"
                className="border border-line px-2 py-1.5 text-xs"
                onClick={() => call(`/api/users/${user.id}`, "PATCH", { active: !user.active })}
              >
                {user.active ? "deactivate" : "reactivate"}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 grid gap-2 border border-line bg-white p-3 sm:grid-cols-2">
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser((v) => ({ ...v, name: e.target.value }))}
            className="border border-line px-2 py-2 text-sm"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser((v) => ({ ...v, role: e.target.value }))}
            className="border border-line bg-white px-2 py-2 text-sm"
          >
            <option value="staff">staff — PIN only</option>
            <option value="manager">manager — email + password + PIN</option>
            <option value="owner">owner — email + password + PIN</option>
          </select>
          <select
            value={newUser.outletId}
            onChange={(e) => setNewUser((v) => ({ ...v, outletId: e.target.value }))}
            disabled={newUser.role === "owner"}
            className="border border-line bg-white px-2 py-2 text-sm disabled:opacity-40"
          >
            {props.outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <input
            placeholder="PIN (4 digits)"
            type="password"
            autoComplete="off"
            inputMode="numeric"
            maxLength={4}
            value={newUser.pin}
            onChange={(e) => setNewUser((v) => ({ ...v, pin: e.target.value.replace(/\D/g, "") }))}
            className="border border-line px-2 py-2 text-sm"
          />
          {newUser.role !== "staff" && (
            <>
              <input
                placeholder="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((v) => ({ ...v, email: e.target.value }))}
                className="border border-line px-2 py-2 text-sm"
              />
              <input
                placeholder="Password (8+ chars)"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((v) => ({ ...v, password: e.target.value }))}
                className="border border-line px-2 py-2 text-sm"
              />
            </>
          )}
          <button
            type="button"
            // A partial PIN would otherwise reach the API and come back as a
            // raw schema message. Empty is fine — the field is optional.
            disabled={busy || (newUser.pin !== "" && !/^\d{4}$/.test(newUser.pin))}
            className="btn btn-primary text-sm disabled:opacity-40 sm:col-span-2"
            onClick={async () => {
              const ok = await call(
                "/api/users",
                "POST",
                {
                  name: newUser.name.trim(),
                  role: newUser.role,
                  outletId: newUser.role === "owner" ? undefined : newUser.outletId,
                  email: newUser.email.trim() || undefined,
                  password: newUser.password || undefined,
                  pin: newUser.pin || undefined,
                },
                `${newUser.name.trim()} added.`,
              );
              if (ok) setNewUser({ name: "", role: "staff", email: "", password: "", pin: "", outletId: props.currentOutletId });
            }}
          >
            Add person
          </button>
        </div>
      </section>

      {/* Backups */}
      <section>
        <h2 className="font-display text-xl text-madder-deep">Backups</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {props.backupSettings.lastBackupAt
            ? `Last backup ${new Date(props.backupSettings.lastBackupAt).toLocaleString()}.`
            : "No backup yet."}{" "}
          Files live in data/backups on the server — copy them off-machine regularly.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            className="btn btn-primary text-sm disabled:opacity-40"
            onClick={() => call("/api/backups", "POST", undefined, "Backup written.")}
          >
            Back up now
          </button>
          <label className="text-sm">
            Schedule{" "}
            <select
              defaultValue={props.backupSettings.frequency}
              className="border border-line bg-white px-2 py-2"
              onChange={(e) => call("/api/backups", "PATCH", { backupFrequency: e.target.value })}
            >
              <option value="off">off</option>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
            </select>
          </label>
          <label className="text-sm">
            Keep{" "}
            <select
              defaultValue={String(props.backupSettings.retention)}
              className="border border-line bg-white px-2 py-2"
              onChange={(e) => call("/api/backups", "PATCH", { backupRetention: Number(e.target.value) })}
            >
              {[7, 14, 30, 90, 365].map((n) => (
                <option key={n} value={n}>
                  {n} files
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul className="mt-3 divide-y divide-line border border-line bg-white text-sm">
          {props.backups.length === 0 && <li className="px-3 py-3 text-ink-soft">No backup files yet.</li>}
          {props.backups.map((b) => (
            <li key={b.filename} className="flex items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{b.filename}</span>
              <span className="text-xs text-ink-soft">{`${Math.max(1, Math.round(b.bytes / 1024))} KB`}</span>
              <button
                type="button"
                className="border border-line px-2 py-1.5 text-xs text-madder-deep"
                onClick={async () => {
                  if (
                    await confirm({
                      title: "Restore this backup?",
                      message:
                        "Every order, menu, table and user for this organization is REPLACED with the backup's contents. This cannot be undone.",
                      confirmLabel: "Replace all data",
                      danger: true,
                    })
                  )
                    void call("/api/backups/restore", "POST", { filename: b.filename }, "Restored.");
                }}
              >
                restore
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
