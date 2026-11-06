import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/mail";
import { requestMeta } from "@/lib/request-meta";
import { appendAudit, db } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const meta = requestMeta(req);

  // Always return the same message to avoid account enumeration.
  const generic = {
    ok: true,
    message:
      "If that email is registered, a password reset link has been sent.",
  };

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const token = db.createPasswordResetToken(email);
  if (!token) {
    appendAudit({
      action: "auth.password_reset_request",
      actor: email,
      target: "panel",
      detail: "Reset requested for unknown or disabled account",
      ip: meta.ip,
      userAgent: meta.userAgent,
      result: "failure",
      reason: "unknown_or_disabled",
    });
    return NextResponse.json(generic);
  }

  const user = db.findAdminByEmail(email)!;
  const origin =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    const mail = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
    if (!mail.sent) {
      // Staging fallback: include reset URL when email is not configured.
      return NextResponse.json({
        ...generic,
        stagingResetUrl: resetUrl,
        warning: mail.reason,
      });
    }
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Failed to send reset email: ${e.message}`
            : "Failed to send reset email",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(generic);
}
