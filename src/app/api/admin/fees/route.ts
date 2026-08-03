import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { FeeConfig } from "@/types";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json(db.getFees());
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = (await req.json()) as Partial<
    Pick<
      FeeConfig,
      "marketingFeeRate" | "userShare" | "birrbackShare" | "pointsPerEtb"
    >
  >;

  try {
    const fees = db.updateFees(body, auth.session.user.email!, clientIp(req));
    return NextResponse.json(fees);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
