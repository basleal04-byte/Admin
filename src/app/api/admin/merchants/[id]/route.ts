import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
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
  const auth = await requireAdmin("merchants:write");
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as PatchBody;
  const actor = auth.session.user.email!;
  const ip = clientIp(req);

  try {
    let result;
    if (body.status) {
      result = db.setMerchantStatus(id, body.status, actor, ip);
    }
    if (body.cashbackRate != null || body.category != null) {
      result = db.updateMerchant(
        id,
        {
          ...(body.cashbackRate != null ? { cashbackRate: body.cashbackRate } : {}),
          ...(body.category != null ? { category: body.category } : {}),
        },
        actor,
        ip
      );
    }
    if (!body.status && body.cashbackRate == null && body.category == null) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
