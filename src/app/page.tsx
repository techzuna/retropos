import { redirect } from "next/navigation";
import { getDevice, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (await getSession()) redirect("/pos");
  // Paired but nobody on shift → the floor PIN screen; unpaired → password.
  redirect((await getDevice()) ? "/signin" : "/login");
}
