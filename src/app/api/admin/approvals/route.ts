import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { AdminRole } from "@/types";

export async function GET(req: Request) {
  const auth = await requireAdmin("approvals:read", req);
  if (auth.error) return auth.error;

  const role = auth.session.user.role as AdminRole;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as
    | "pending"
    | "approved"
    | "rejected"
    | null;

  if (role === "super_admin") {
    return NextResponse.json(
      db.listApprovals(status ? { status } : undefined)
    );
  }

  return NextResponse.json(
    db.listApprovals({
      actor: auth.session.user.email!,
      ...(status ? { status } : {}),
    })
  );
}
