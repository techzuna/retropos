"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinInput } from "@/components/PinInput";

const PIN_LENGTH = 4;
const HINT_ID = "pin-hint";
const ERROR_ID = "pin-error";

interface SignInUser {
  id: string;
  name: string;
  role: string;
}

export function PinSignIn({
  users,
  currentUserId,
}: {
  users: SignInUser[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<SignInUser | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(userId: string, pinValue: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pin: pinValue }),
    }).catch(() => null);
    if (res?.ok) {
      router.push("/pos");
      router.refresh();
      return;
    }
    const data = res ? await res.json().catch(() => null) : null;
    setBusy(false);
    setPin("");
    setError(data?.error ?? "That didn't work — try again.");
  }

  // The last digit signs in — no extra tap mid-service.
  function handlePinChange(next: string) {
    setPin(next);
    if (selected && next.length === PIN_LENGTH && !busy) {
      void submit(selected.id, next);
    }
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            aria-pressed={selected?.id === user.id}
            disabled={busy}
            onClick={() => {
              setSelected(user);
              setPin("");
              setError(null);
            }}
            className={`border p-3 text-left ${
              selected?.id === user.id ? "border-madder bg-madder text-paper" : "border-line bg-white"
            }`}
          >
            <p className="font-medium">
              {user.name}
              {user.id === currentUserId && " ·"}
            </p>
            <p className={`text-xs ${selected?.id === user.id ? "text-paper/80" : "text-ink-soft"}`}>
              {user.role}
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <div>
          <PinInput
            // Remount per user so the autofocus effect re-runs even when the
            // PIN was already empty (picking A then B otherwise swallows keys).
            key={selected.id}
            label={`PIN for ${selected.name}`}
            value={pin}
            onChange={handlePinChange}
            length={PIN_LENGTH}
            autoFocus
            busy={busy}
            invalid={Boolean(error)}
            describedById={error ? `${ERROR_ID} ${HINT_ID}` : HINT_ID}
          />
          {/* WCAG 3.2.2: the last digit changes screen, so say so beforehand. */}
          <p id={HINT_ID} className="mt-2 text-xs text-ink-soft">
            {`Entering all ${PIN_LENGTH} digits signs ${selected.name} in.`}
          </p>
        </div>
      )}

      <div aria-live="polite" className="min-h-5">
        {busy && <p className="text-sm text-ink-soft">Signing in…</p>}
        {error && (
          <p
            id={ERROR_ID}
            role="alert"
            className="border border-madder/40 bg-madder/5 px-3 py-2 text-sm text-madder-deep"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
