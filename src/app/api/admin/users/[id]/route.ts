import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { enqueueOrApply } from "@/lib/mutation-gate";
import { db } from "@/lib/store";
import type { ConsumerStatus } from "@/types";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("users:read");
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  try {
    return NextResponse.json(db.getConsumer(id));
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
  const auth = await requireAdmin("users:write", req);
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as { status?: ConsumerStatus };

  if (!body.status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  try {
    const current = db.getConsumer(id).user;
    const gate = enqueueOrApply({
      req,
      session: auth.session,
      kind: "user.status",
      action: "user.suspend",
      target: id,
      payload: { id, status: body.status },
      oldValue: { status: current.status },
      newValue: { status: body.status },
      reason: `Consumer status -> ${body.status}`,
      apply: () =>
        db.setConsumerStatus(
          id,
          body.status!,
          auth.session.user.email!,
          clientIp(req)
        ),
    });
    if (gate.status === "pending") return gate.response;
    return NextResponse.json(gate.result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("users:points", req);
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as { points: number; reason: string };

  try {
    const current = db.getConsumer(id).user;
    const gate = enqueueOrApply({
      req,
      session: auth.session,
      kind: "user.points_adjust",
      action: "user.points_adjust",
      target: id,
      payload: { id, points: body.points, reason: body.reason },
      oldValue: { pointsBalance: current.pointsBalance },
      newValue: {
        pointsBalance: current.pointsBalance + Number(body.points || 0),
        delta: body.points,
      },
      reason: body.reason,
      apply: () =>
        db.adjustPoints(
          id,
          body.points,
          body.reason,
          auth.session.user.email!,
          clientIp(req)
        ),
    });
    if (gate.status === "pending") return gate.response;
    return NextResponse.json(gate.result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Adjust failed" },
      { status: 400 }
    );
  }
}
