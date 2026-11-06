import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { requestMeta } from "@/lib/request-meta";
import { db } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    token?: string;
    newPassword?: string;
  };
  const token = body.token?.trim() ?? "";
  const newPassword = body.newPassword ?? "";
  const meta = requestMeta(req);

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: "Token and new password are required" },
      { status: 400 }
    );
  }
  if (newPassword.length < 10) {
    return NextResponse.json(
      { error: "New password must be at least 10 characters" },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    const result = db.resetPasswordWithToken(token, passwordHash, meta);
    return NextResponse.json({
      ok: true,
      message: `Password updated for ${result.email}. You can sign in now.`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reset failed" },
      { status: 400 }
    );
  }
}
