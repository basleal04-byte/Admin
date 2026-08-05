import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { PanelUser } from "@/types";

export async function GET() {
  const auth = await requireAdmin("admins:read");
  if (auth.error) return auth.error;
  return NextResponse.json(db.listAdmins());
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin("admins:write");
  if (auth.error) return auth.error;

  const body = (await req.json()) as {
    id: string;
    status: PanelUser["status"];
  };

  try {
    const admin = db.setAdminStatus(
      body.id,
      body.status,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(admin);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
