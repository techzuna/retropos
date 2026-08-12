/**
 * The shape of a screen that is on its way.
 *
 * This exists because every page here is `force-dynamic` — it must ask the
 * database who is signed in before it can render anything — so a navigation
 * costs a full server round trip. On the shop LAN that is milliseconds; on a
 * shared host it was measured at ~1.3s, during which a tap otherwise produces
 * no visible change at all and staff tap again.
 *
 * Paired with a `loading.tsx`, React shows this the instant a link is
 * followed, so the screen always answers immediately even when the data does
 * not.
 */
export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`h-4 animate-pulse rounded bg-line/70 ${className}`} />;
}

export function SkeletonCards({ count = 6, label }: { count?: number; label: string }) {
  return (
    <div className="pt-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <SkeletonLine className="h-7 w-40" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="border border-line bg-white p-3">
            <SkeletonLine className="w-16" />
            <SkeletonLine className="mt-3 w-full" />
            <SkeletonLine className="mt-2 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonRows({ count = 5, label }: { count?: number; label: string }) {
  return (
    <div className="pt-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <SkeletonLine className="h-7 w-44" />
      <div className="mt-5 divide-y divide-line border border-line bg-white">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="ml-auto w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
