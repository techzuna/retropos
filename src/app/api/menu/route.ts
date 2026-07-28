import { NextResponse } from "next/server";
import { getPublishedMenu } from "@/lib/menu";

export async function GET() {
  return NextResponse.json(await getPublishedMenu());
}
