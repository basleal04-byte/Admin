import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

export async function GET() {
  const auth = await requireAdmin("reports:read");
  if (auth.error) return auth.error;
  return NextResponse.json(db.getReports());
}
