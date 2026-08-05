import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { HappyHourCampaign } from "@/types";

type Body = { status: HappyHourCampaign["status"] };

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("merchants:write");
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as Body;

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
