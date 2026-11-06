import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

/** Audit log is restricted to roles with audit:read (security admin only). */
export async function GET(req: Request) {
  const auth = await requireAdmin("audit:read", req);
  if (auth.error) return auth.error;
  return NextResponse.json(db.listAudit());
}
