import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { MerchantStatus } from "@/types";

type Body = { status: MerchantStatus };

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as Body;

  if (body.status !== "active" && body.status !== "suspended") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const merchant = db.setMerchantStatus(
      id,
      body.status,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(merchant);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
