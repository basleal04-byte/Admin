import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

export async function GET() {
  const auth = await requireAdmin("fis:read");
  if (auth.error) return auth.error;
  return NextResponse.json({
    merchants: db.listFis(),
    referrals: db.listReferrals(),
    licensing: db.listLicensing(),
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin("fis:write");
  if (auth.error) return auth.error;

  const body = (await req.json()) as { merchantId: string; reason: string };

  try {
    const result = db.flagFis(
      body.merchantId,
      body.reason,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Flag failed" },
      { status: 400 }
    );
  }
}
