import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { CampaignStatus } from "@/types";

type Body = { status: CampaignStatus };

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as Body;
  const allowed: CampaignStatus[] = ["active", "paused", "ended", "draft"];
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const campaign = db.setCampaignStatus(
      id,
      body.status,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(campaign);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
