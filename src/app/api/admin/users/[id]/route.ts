import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
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
  const auth = await requireAdmin("users:write");
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as { status?: ConsumerStatus };

  if (!body.status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  try {
    const user = db.setConsumerStatus(
      id,
      body.status,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(user);
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
  const auth = await requireAdmin("users:points");
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as { points: number; reason: string };

  try {
    const user = db.adjustPoints(
      id,
      body.points,
      body.reason,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Adjust failed" },
      { status: 400 }
    );
  }
}
