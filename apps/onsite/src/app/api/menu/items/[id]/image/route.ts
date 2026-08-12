import { NextResponse } from "next/server";
import { PosError } from "@restro/domain/errors";
import { requireRole } from "@/lib/session";
import { readItemImage, saveItemImage } from "@/lib/uploads";
import { handle } from "../../../../respond";

type Ctx = { params: Promise<{ id: string }> };

/** The dish photo shown on the order cards. */
export async function GET(_request: Request, ctx: Ctx) {
  const session = await requireRole("staff").catch(() => null);
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 403 });
  const { id } = await ctx.params;
  const image = await readItemImage(session, id);
  if (!image) return NextResponse.json({ error: "No photo for this item." }, { status: 404 });
  return new NextResponse(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      // Private: this is one outlet's menu, not public content. Short max-age
      // keeps the ordering grid from refetching every photo on each poll.
      "Cache-Control": "private, max-age=300",
    },
  });
}

/** Manager+ uploads/replaces a dish photo (multipart, field "file"). */
export async function POST(request: Request, ctx: Ctx) {
  return handle(async () => {
    const session = await requireRole("manager");
    const { id } = await ctx.params;
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new PosError("VALIDATION", "Attach the photo as 'file'.");
    await saveItemImage(session, id, file);
  });
}
