"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);
    if (res?.ok) {
      router.push("/pos");
      router.refresh();
      return;
    }
    const data = res ? await res.json().catch(() => null) : null;
    setBusy(false);
    setError(data?.error ?? "Couldn't sign in — try again.");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block">
        <span className="block text-sm font-medium">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-line bg-white px-3 py-2.5"
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-line bg-white px-3 py-2.5"
        />
      </label>
      {error && (
        <p role="alert" className="border border-madder/40 bg-madder/5 px-3 py-2 text-sm text-madder-deep">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-40">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
