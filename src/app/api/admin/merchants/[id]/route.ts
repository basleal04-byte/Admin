import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { enqueueOrApply } from "@/lib/mutation-gate";
import { db } from "@/lib/store";
import type { MerchantStatus } from "@/types";

type PatchBody = {
  status?: MerchantStatus;
  cashbackRate?: number;
  category?: string;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("merchants:read");
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  try {
    return NextResponse.json(db.getMerchant(id));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Not found" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("merchants:write", req);
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as PatchBody;
  const actor = auth.session.user.email!;
  const ip = clientIp(req);

  try {
    if (!body.status && body.cashbackRate == null && body.category == null) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const merchant = db.getMerchant(id).merchant;

    if (body.status) {
      const gate = enqueueOrApply({
        req,
        session: auth.session,
        kind: "merchant.status",
        action:
          body.status === "active"
            ? "merchant.activate"
            : body.status === "suspended"
              ? "merchant.suspend"
              : "merchant.deactivate",
        target: id,
        payload: { id, status: body.status },
        oldValue: { status: merchant.status },
        newValue: { status: body.status },
        reason: `Merchant status -> ${body.status}`,
        apply: () => db.setMerchantStatus(id, body.status!, actor, ip),
      });
      if (gate.status === "pending") return gate.response;
      if (body.cashbackRate == null && body.category == null) {
        return NextResponse.json(gate.result);
      }
    }

    if (body.cashbackRate != null || body.category != null) {
      const patch = {
        ...(body.cashbackRate != null ? { cashbackRate: body.cashbackRate } : {}),
        ...(body.category != null ? { category: body.category } : {}),
      };
      const gate = enqueueOrApply({
        req,
        session: auth.session,
        kind: "merchant.update",
        action:
          body.cashbackRate != null
            ? "merchant.rate_update"
            : "merchant.category_update",
        target: id,
        payload: { id, ...patch },
        oldValue: {
          cashbackRate: merchant.cashbackRate,
          category: merchant.category,
        },
        newValue: { ...patch },
        reason: "Merchant profile update",
        apply: () => db.updateMerchant(id, patch, actor, ip),
      });
      if (gate.status === "pending") return gate.response;
      return NextResponse.json(gate.result);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
