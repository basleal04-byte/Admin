import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { appendAudit } from "@/lib/store";
import { requestMeta } from "@/lib/request-meta";
import type { Permission } from "@/types";
import type { Session } from "next-auth";
import type { AdminRole } from "@/types";

export async function requireAdmin(
  permission?: Permission,
  req?: Request
): Promise<
  { session: Session; error?: undefined } | { session?: undefined; error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    if (req && permission) {
      const meta = requestMeta(req);
      appendAudit({
        action: "auth.forbidden",
        actor: "anonymous",
        target: permission,
        detail: "Missing session for protected admin API",
        ip: meta.ip,
        userAgent: meta.userAgent,
        result: "failure",
        reason: "unauthenticated",
      });
    }
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const role = session.user.role as AdminRole;
  if (!role) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  if (permission && !can(role, permission)) {
    if (req) {
      const meta = requestMeta(req, session);
      appendAudit({
        action: "auth.forbidden",
        actor: session.user.email,
        actorId: session.user.id,
        target: permission,
        detail: `Permission denied for ${permission}`,
        ip: meta.ip,
        userAgent: meta.userAgent,
        sessionId: meta.sessionId,
        result: "failure",
        reason: `role ${role} lacks ${permission}`,
      });
    }
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
