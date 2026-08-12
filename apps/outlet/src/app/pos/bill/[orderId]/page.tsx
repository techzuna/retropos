import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOutletProfile } from "@/lib/outlet";
import { getOrder } from "@/lib/orders";
import { requireSession } from "@/lib/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Bill" };

export default async function BillPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await requireSession();
  const { orderId } = await params;

  const order = await getOrder(session, orderId).catch(() => null);
  if (!order) notFound();

  const outlet = await getOutletProfile(session);

  return (
    <div className="pt-6">
      <div className="no-print flex items-center justify-between">
        <p className="text-sm">
          <Link href="/pos" className="text-ink-soft underline underline-offset-4">
            ← Tables
          </Link>
        </p>
        <PrintButton />
      </div>

      {/* The bill itself — thermal-width friendly, print CSS strips the chrome. */}
      <div className="bill mx-auto mt-4 max-w-xs border border-line bg-white px-4 py-5 font-mono text-sm">
        <div className="text-center">
          <p className="font-display text-lg">{outlet.name}</p>
          {outlet.address && <p className="mt-1 text-xs">{outlet.address}</p>}
          {outlet.phone && <p className="text-xs">{outlet.phone}</p>}
        </div>
        <hr className="my-3 border-dashed border-line" />
        <div className="space-y-0.5 text-xs">
          <p>
            {`Table ${order.table.name} · ${order.customerName}`}
          </p>
          <p>{formatDateTime(order.settledAt ?? order.openedAt, outlet.timezone)}</p>
          <p>{`Served by ${order.openedBy.name}`}</p>
          <p className="uppercase">{`Ref ${order.id.slice(-6)}`}</p>
        </div>
        <hr className="my-3 border-dashed border-line" />
        <table className="w-full">
          <tbody>
            {order.items.map((it) => {
              // Extras are priced per unit, so the line reads
              // (item + extras) × qty — the same sum settle froze.
              const extras = it.modifiers.reduce((sum, m) => sum + m.priceCents, 0);
              return (
                <tr key={it.id} className="align-top">
                  <td className="pr-1">{`${it.quantity}×`}</td>
                  <td className="w-full pr-2">
                    {it.name}
                    {it.modifiers.map((m) => (
                      <span key={m.id} className="block pl-2 text-xs">
                        {`+ ${m.name} ${formatPrice(m.priceCents, outlet.currency)}`}
                      </span>
                    ))}
                    {it.notes && <span className="block text-xs text-ink-soft">{it.notes}</span>}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {formatPrice((it.priceCents + extras) * it.quantity, outlet.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <hr className="my-3 border-dashed border-line" />
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{formatPrice(order.runningTotalCents, outlet.currency)}</span>
        </div>
        <div className="mt-1 flex justify-between text-xs">
          <span>Status</span>
          <span className="uppercase">
            {order.status === "settled" ? `paid · ${order.paymentMethod}` : order.status}
          </span>
        </div>
        <p className="mt-4 text-center text-xs">Thank you — see you again!</p>
      </div>
    </div>
  );
}
