import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

export async function GET() {
  const auth = await requireAdmin("expiry:read");
  if (auth.error) return auth.error;
  return NextResponse.json(db.getExpiry());
}

export async function POST(req: Request) {
  const auth = await requireAdmin("expiry:write");
  if (auth.error) return auth.error;

  const body = await req.json();
  const actor = auth.session.user.email!;
  const ip = clientIp(req);

  try {
    if (body.action === "remind") {
      const reminder = db.sendExpiryReminder(body.userId, actor, ip);
      return NextResponse.json(reminder);
    }
    if (body.action === "extend") {
      const rows = db.extendExpiry(
        body.userIds,
        body.days,
        body.reason,
        actor,
        ip
      );
      return NextResponse.json(rows);
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
