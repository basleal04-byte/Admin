export type RequestMeta = {
  ip: string;
  userAgent: string;
  sessionId?: string;
};

export function requestMeta(
  req: Request,
  session?: { user?: { id?: string | null; email?: string | null } } | null
): RequestMeta {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0]?.trim() : null) ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const sessionId = session?.user?.id
    ? `sess_${session.user.id}`
    : undefined;
  return { ip, userAgent, sessionId };
}

export function stringifyValue(value: unknown): string | null {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
