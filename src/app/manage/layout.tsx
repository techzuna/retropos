import { requirePageSession } from "@/lib/route-guards";
import { AppChrome } from "@/components/AppChrome";

export const dynamic = "force-dynamic";

export default async function ManageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requirePageSession("manager");
  return <AppChrome session={session}>{children}</AppChrome>;
}
