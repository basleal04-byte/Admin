import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { enqueueOrApply } from "@/lib/mutation-gate";
import { db } from "@/lib/store";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("redemptions:write", req);
  if (auth.error) return auth.error;

  const { id } = await ctx.params;

  try {
    const gate = enqueueOrApply({
      req,
      session: auth.session,
      kind: "redemption.retry",
      action: "redemption.retry",
      target: id,
      payload: { id },
      oldValue: { status: "failed" },
      newValue: { status: "retry_requested" },
      reason: "Retry failed redemption",
      apply: () =>
        db.retryRedemption(id, auth.session.user.email!, clientIp(req)),
    });
    if (gate.status === "pending") return gate.response;
    return NextResponse.json(gate.result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Retry failed" },
      { status: 400 }
    );
  }
}
