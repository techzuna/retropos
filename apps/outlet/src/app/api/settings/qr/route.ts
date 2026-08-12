import { NextResponse } from "next/server";
import { PosError } from "@/lib/errors";
import { requireRole } from "@/lib/session";
import { readQrImage, saveQrImage } from "@/lib/uploads";
import { handle } from "../../respond";

/** The outlet's payment QR — staff show this at settle time. */
export async function GET() {
  const session = await requireRole("staff").catch(() => null);
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 403 });
  const image = await readQrImage(session);
  if (!image) return NextResponse.json({ error: "No QR uploaded yet." }, { status: 404 });
  return new NextResponse(new Uint8Array(image.bytes), {
    headers: { "Content-Type": image.contentType, "Cache-Control": "no-store" },
  });
}

/** Manager+ uploads/replaces the outlet's QR (multipart, field "file"). */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireRole("manager");
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new PosError("VALIDATION", "Attach the QR image as 'file'.");
    await saveQrImage(session, file);
  });
}
