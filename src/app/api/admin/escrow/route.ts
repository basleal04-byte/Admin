import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

export async function GET() {
  const auth = await requireAdmin("escrow:read");
  if (auth.error) return auth.error;
  return NextResponse.json(db.getEscrow());
}

export async function POST(req: Request) {
  const auth = await requireAdmin("escrow:write");
  if (auth.error) return auth.error;

  try {
    const run = db.reconcile(auth.session.user.email!, clientIp(req));
    return NextResponse.json(run);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reconcile failed" },
      { status: 400 }
    );
  }
}
