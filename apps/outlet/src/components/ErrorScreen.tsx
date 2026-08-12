/**
 * The shell every failure screen shares.
 *
 * Written for the person who actually meets it: a waiter holding a tablet in the
 * middle of service, who is not going to read a stack trace and needs one
 * obvious way back to work. So every error screen says what happened in plain
 * words, reassures that nothing on the order was lost (it wasn't — orders live
 * in SQLite, a render failure can't touch them), and always offers a route to
 * the table board rather than dead-ending.
 *
 * No hooks, so it renders in both server (`not-found`) and client
 * (`error`) boundaries.
 */
export function ErrorScreen({
  eyebrow,
  title,
  message,
  reference,
  reassure = true,
  children,
}: {
  eyebrow: string;
  title: string;
  message: string;
  /** Next's error digest, if any — the thread back to the server log. */
  reference?: string;
  /**
   * Whether to promise that order data survived. True for a crash, where that
   * is the first thing a waiter fears; off for a plain 404, where raising the
   * subject invents an alarm nobody had.
   */
  reassure?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-md border border-line bg-white">
        <div className="dhaka-band" aria-hidden="true" />
        <div className="p-6 sm:p-8">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 font-display text-2xl">{title}</h1>
          <p className="mt-2 text-ink-soft">{message}</p>

          {reassure && (
            <p className="mt-4 border border-line bg-paper px-3 py-2 text-sm">
              Nothing on an open order is lost — bills and orders are saved on this
              restaurant&rsquo;s own server, not in this screen.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">{children}</div>

          {reference && (
            <p className="mt-5 text-xs text-ink-soft">
              {"If this keeps happening, give the owner this reference: "}
              <span className="font-mono">{reference}</span>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
