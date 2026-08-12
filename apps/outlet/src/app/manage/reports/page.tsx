import type { Metadata } from "next";
import Link from "next/link";
import { getOutletProfile } from "@/lib/outlet";
import { salesSummary, type ReportGroupBy } from "@/lib/reports";
import { requireRole } from "@/lib/session";
import { addDays, localDate } from "@restro/domain/time";
import { formatPrice } from "@restro/domain/format";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; groupBy?: string }>;
}) {
  const session = await requireRole("manager");
  const outlet = await getOutletProfile(session);

  const today = localDate(new Date(), outlet.timezone);
  const monthStart = `${today.slice(0, 7)}-01`;
  const params = await searchParams;
  const from = params.from ?? monthStart;
  const to = params.to ?? today;
  const groupBy: ReportGroupBy = params.groupBy === "month" ? "month" : "day";

  const summary = await salesSummary(session, { from, to, groupBy }).catch(() => null);

  const ranges = [
    { label: "Today", href: `?from=${today}&to=${today}` },
    { label: "Last 7 days", href: `?from=${addDays(today, -6)}&to=${today}` },
    { label: "This month", href: `?from=${monthStart}&to=${today}` },
    { label: "This year by month", href: `?from=${today.slice(0, 4)}-01-01&to=${today}&groupBy=month` },
  ];

  return (
    <div className="pt-6">
      <h1 className="font-display text-2xl">Reports</h1>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {ranges.map((r) => (
          <Link key={r.label} href={r.href} className="border border-line bg-white px-3 py-2 hover:border-brass">
            {r.label}
          </Link>
        ))}
      </div>

      {!summary ? (
        <p className="mt-6 text-ink-soft">Couldn&apos;t read that date range.</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Sales", value: formatPrice(summary.totals.salesCents, outlet.currency) },
              { label: "Orders", value: String(summary.totals.orderCount) },
              { label: "Customers", value: String(summary.totals.customerCount) },
              { label: "Avg order", value: formatPrice(summary.totals.avgOrderCents, outlet.currency) },
            ].map((stat) => (
              <div key={stat.label} className="border border-line bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-ink-soft">{stat.label}</p>
                <p className="mt-1 font-mono text-lg">{stat.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            {`${summary.from} → ${summary.to} · settled orders only · ${summary.voidCount} voided`}
          </p>

          <div className="mt-6 overflow-x-auto border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-3 py-2">{groupBy === "day" ? "Day" : "Month"}</th>
                  <th className="px-3 py-2 text-right">Sales</th>
                  <th className="px-3 py-2 text-right">Orders</th>
                  <th className="px-3 py-2 text-right">Customers</th>
                  <th className="px-3 py-2 text-right">Avg order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {summary.rows.map((row) => (
                  <tr key={row.bucket}>
                    <td className="px-3 py-2">{row.bucket}</td>
                    <td className="px-3 py-2 text-right">{formatPrice(row.salesCents, outlet.currency)}</td>
                    <td className="px-3 py-2 text-right">{row.orderCount}</td>
                    <td className="px-3 py-2 text-right">{row.customerCount}</td>
                    <td className="px-3 py-2 text-right">{formatPrice(row.avgOrderCents, outlet.currency)}</td>
                  </tr>
                ))}
                {summary.rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center font-sans text-ink-soft">
                      No settled orders in this range yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
