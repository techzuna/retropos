import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOutletProfile } from "@/lib/outlet";
import { getOrderingMenu } from "@/lib/menu";
import { listModifiers } from "@/lib/modifiers";
import { getOrder, getTableForOrdering } from "@/lib/orders";
import { requireSession } from "@/lib/session";
import { localTimeLabel } from "@/lib/time";
import { SeatForm } from "./seat-form";
import { OrderScreen } from "./order-screen";

export const metadata: Metadata = { title: "Table" };

export default async function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const session = await requireSession();
  const { tableId } = await params;

  const [found, outlet] = await Promise.all([
    getTableForOrdering(session, tableId),
    getOutletProfile(session),
  ]);
  if (!found) notFound();
  const { table, openOrderId, hold } = found;

  if (!openOrderId) {
    return (
      <SeatForm
        tableId={table.id}
        tableName={table.name}
        capacity={table.capacity}
        hold={
          hold && {
            id: hold.id,
            customerName: hold.customerName,
            partySize: hold.partySize,
            periodLabel: hold.periodLabel,
            allDay: hold.allDay,
            startLabel: localTimeLabel(hold.startAt, outlet.timezone),
            endLabel: localTimeLabel(hold.endAt, outlet.timezone),
            active: hold.active,
          }
        }
      />
    );
  }

  const [order, menu, modifiers] = await Promise.all([
    getOrder(session, openOrderId),
    getOrderingMenu(session),
    listModifiers(session),
  ]);

  return (
    <OrderScreen
      tableName={table.name}
      currency={outlet.currency}
      hasQr={outlet.qrImagePath !== ""}
      menu={menu}
      modifiers={modifiers.map((m) => ({ id: m.id, name: m.name, priceCents: m.priceCents }))}
      initialOrder={{
        id: order.id,
        customerName: order.customerName,
        items: order.items.map((it) => ({
          id: it.id,
          menuItemId: it.menuItemId,
          name: it.name,
          priceCents: it.priceCents,
          quantity: it.quantity,
          notes: it.notes,
          modifiers: it.modifiers,
        })),
      }}
    />
  );
}
