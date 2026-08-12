export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <h1 className="font-display text-3xl">RestroReserve Cloud</h1>
      <p className="mt-3 text-ink-soft">
        The hosted service. Sign-up, tenant branding and the shared POS screens
        are being built on top of the same domain package the self-hosted build
        uses, so both stay in step.
      </p>
      <p className="mt-6 text-sm text-ink-soft">
        Health: <code className="font-mono">/api/health</code>
      </p>
    </main>
  );
}
