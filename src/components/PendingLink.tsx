"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";

/**
 * A link that admits it is working.
 *
 * `loading.tsx` covers a navigation once React swaps the page, but the gap
 * before that — the server round trip — still shows nothing. On a slow host
 * that gap is over a second, and the honest failure mode for a POS is a
 * waiter tapping a table twice because the first tap looked ignored.
 *
 * `useLinkStatus` only reports pending inside a `<Link>`, hence the small
 * inner component.
 */
function Spinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden="true"
      className="ml-2 inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent align-middle opacity-70"
    />
  );
}

export function PendingLink({
  href,
  className,
  children,
  prefetch,
  title,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  prefetch?: boolean;
  title?: string;
}) {
  return (
    <Link href={href} className={className} prefetch={prefetch} title={title}>
      {children}
      <Spinner />
    </Link>
  );
}

/**
 * Dims a card-sized link while its navigation is in flight. Used where a
 * spinner beside the text would be lost — the table board, where the whole
 * tile is the target.
 */
export function PendingCardLink({
  href,
  className,
  children,
  prefetch,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  prefetch?: boolean;
}) {
  return (
    <Link href={href} className={className} prefetch={prefetch}>
      <CardBody>{children}</CardBody>
    </Link>
  );
}

function CardBody({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span
      className={`block transition-opacity ${pending ? "animate-pulse opacity-60" : ""}`}
      aria-busy={pending || undefined}
    >
      {children}
    </span>
  );
}
