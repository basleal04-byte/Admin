import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = (await req.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 10) {
    return NextResponse.json(
      { error: "New password must be at least 10 characters" },
      { status: 400 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current password" },
      { status: 400 }
    );
  }

  const email = auth.session.user.email!;
  const admin =
    (auth.session.user.id
      ? db.findAdminById(auth.session.user.id)
      : undefined) ?? db.findAdminByEmail(email);

  if (!admin || admin.status !== "active") {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const ok = await verifyPassword(currentPassword, admin.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    db.changeAdminPassword(
      admin.id,
      passwordHash,
      email,
      clientIp(req)
    );
    return NextResponse.json({
      ok: true,
      message: "Password updated. Use the new password next time you sign in.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
