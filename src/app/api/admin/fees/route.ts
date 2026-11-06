import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { enqueueOrApply } from "@/lib/mutation-gate";
import { db } from "@/lib/store";
import type { FeeConfig } from "@/types";

export async function GET() {
  const auth = await requireAdmin("dashboard:read");
  if (auth.error) return auth.error;
  return NextResponse.json(db.getFees());
}

export async function PUT(req: Request) {
  const auth = await requireAdmin("fees:write", req);
  if (auth.error) return auth.error;

  const body = (await req.json()) as Partial<
    Pick<
      FeeConfig,
      "marketingFeeRate" | "userShare" | "birrbackShare" | "pointsPerEtb"
    >
  >;

  const current = db.getFees();
  const gate = enqueueOrApply({
    req,
    session: auth.session,
    kind: "fees.update",
    action: "fees.update",
    target: "fee_config",
    payload: body as Record<string, unknown>,
    oldValue: {
      marketingFeeRate: current.marketingFeeRate,
      userShare: current.userShare,
      birrbackShare: current.birrbackShare,
      pointsPerEtb: current.pointsPerEtb,
    },
    newValue: { ...current, ...body },
    reason: "Fee configuration change",
    apply: () => db.updateFees(body, auth.session.user.email!, clientIp(req)),
  });

  if (gate.status === "pending") return gate.response;
  return NextResponse.json(gate.result);
}
