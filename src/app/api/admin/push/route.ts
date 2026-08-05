import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { PushAudience } from "@/types";

type SendBody = {
  title: string;
  body: string;
  audience: PushAudience;
  target: string;
};

export async function GET() {
  const auth = await requireAdmin("push:read");
  if (auth.error) return auth.error;
  return NextResponse.json(db.listPush());
}

export async function POST(req: Request) {
  const auth = await requireAdmin("push:write");
  if (auth.error) return auth.error;

  const body = (await req.json()) as SendBody;

  try {
    const message = db.sendPush(
      body,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(message);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 400 }
    );
  }
}
