import { NextResponse } from "next/server";
import { requestMeta } from "@/lib/request-meta";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("approvals:write", req);
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    decision?: "approved" | "rejected";
    note?: string;
  };

  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json(
      { error: "decision must be approved or rejected" },
      { status: 400 }
    );
  }

  try {
    const meta = requestMeta(req, auth.session);
    const item = db.decideApproval(
      id,
      body.decision,
      auth.session.user.email!,
      body.note,
      meta
    );
    return NextResponse.json(item);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Decision failed" },
      { status: 400 }
    );
  }
}
