import { requirePageSession } from "@/lib/route-guards";
import { AppChrome } from "@/components/AppChrome";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requirePageSession("owner");
  return <AppChrome session={session}>{children}</AppChrome>;
}
