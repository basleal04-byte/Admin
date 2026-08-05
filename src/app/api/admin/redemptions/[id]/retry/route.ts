import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("redemptions:write");
  if (auth.error) return auth.error;

  const { id } = await ctx.params;

  try {
    const redemption = db.retryRedemption(
      id,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(redemption);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Retry failed" },
      { status: 400 }
    );
  }
}
