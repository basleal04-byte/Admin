import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { AdminRole } from "@/types";

export async function GET(req: Request) {
  const auth = await requireAdmin("profile:read", req);
  if (auth.error) return auth.error;

  const role = auth.session.user.role as AdminRole;
  if (role !== "end_user") {
    return NextResponse.json(
      { error: "Profile endpoint is for sample end-user accounts" },
      { status: 403 }
    );
  }

  const consumerId = auth.session.user.consumerId;
  if (!consumerId) {
    return NextResponse.json(
      { error: "No linked consumer profile" },
      { status: 404 }
    );
  }

  try {
    return NextResponse.json(db.getConsumer(consumerId));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Not found" },
      { status: 404 }
    );
  }
}
