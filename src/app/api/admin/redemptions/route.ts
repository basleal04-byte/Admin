import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

export async function GET() {
  const auth = await requireAdmin("redemptions:read");
  if (auth.error) return auth.error;
  return NextResponse.json({
    redemptions: db.listRedemptions(),
    airtime: db.getAirtime(),
    channels: db.channelBreakdown(),
  });
}
