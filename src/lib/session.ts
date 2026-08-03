import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

export async function requireAdmin(): Promise<
  { session: Session; error?: undefined } | { session?: undefined; error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.user.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session };
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}
