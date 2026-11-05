import { NextResponse } from "next/server";
import { sendAdminCredentialsEmail } from "@/lib/mail";
import { generateSecurePassword, hashPassword } from "@/lib/password";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { AdminRole, PanelUser } from "@/types";

const CREATABLE_ROLES: AdminRole[] = [
  "super_admin",
  "ops",
  "finance",
  "support",
];

export async function GET() {
  const auth = await requireAdmin("admins:read");
  if (auth.error) return auth.error;
  return NextResponse.json(db.listAdmins());
}

export async function POST(req: Request) {
  const auth = await requireAdmin("admins:write");
  if (auth.error) return auth.error;

  const body = (await req.json()) as {
    email?: string;
    name?: string;
    role?: AdminRole;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  const name = body.name?.trim() ?? "";
  const role = body.role;

  if (!email || !name || !role) {
    return NextResponse.json(
      { error: "Name, email, and role are required" },
      { status: 400 }
    );
  }

  if (!CREATABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const password = generateSecurePassword(16);
  const passwordHash = await hashPassword(password);

  let admin: Omit<PanelUser, "passwordHash">;
  try {
    admin = db.createAdmin(
      { email, name, passwordHash, role },
      auth.session.user.email!,
      clientIp(req)
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 }
    );
  }

  const loginUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    new URL(req.url).origin;

  try {
    const mail = await sendAdminCredentialsEmail({
      to: email,
      name,
      password,
      role,
      loginUrl: `${loginUrl}/login`,
      mfaHint: process.env.MOCK_MFA_CODE || undefined,
    });

    if (!mail.sent) {
      db.removeAdmin(admin.id);
      return NextResponse.json({ error: mail.reason }, { status: 503 });
    }
  } catch (e) {
    db.removeAdmin(admin.id);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Failed to send invite email: ${e.message}`
            : "Failed to send invite email",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    admin,
    emailSent: true,
    message: `Invite email sent to ${email}. The temporary password is only in that email.`,
  });
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
