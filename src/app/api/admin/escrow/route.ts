import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { enqueueOrApply } from "@/lib/mutation-gate";
import { db } from "@/lib/store";

export async function GET() {
  const auth = await requireAdmin("escrow:read");
  if (auth.error) return auth.error;
  return NextResponse.json(db.getEscrow());
}

export async function POST(req: Request) {
  const auth = await requireAdmin("escrow:write", req);
  if (auth.error) return auth.error;

  try {
    const snap = db.getEscrow();
    const gate = enqueueOrApply({
      req,
      session: auth.session,
      kind: "escrow.reconcile",
      action: "escrow.reconcile",
      target: "escrow",
      payload: {},
      oldValue: snap.snapshot ?? snap,
      newValue: { requested: "reconcile" },
      reason: "Escrow reconciliation",
      apply: () => db.reconcile(auth.session.user.email!, clientIp(req)),
    });
    if (gate.status === "pending") return gate.response;
    return NextResponse.json(gate.result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reconcile failed" },
      { status: 400 }
    );
  }
}
