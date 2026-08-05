import { NextResponse } from "next/server";
import { clientIp, requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";
import type { BrandCampaign } from "@/types";

type CreateBody = Omit<
  BrandCampaign,
  | "id"
  | "impressions"
  | "bonusesTriggered"
  | "unitsInfluenced"
  | "revenueEtb"
  | "ethioShareEtb"
  | "status"
>;

export async function GET() {
  const auth = await requireAdmin("brand:read");
  if (auth.error) return auth.error;
  return NextResponse.json({
    campaigns: db.listBrandCampaigns(),
    invoices: db.listBrandInvoices(),
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin("brand:write");
  if (auth.error) return auth.error;

  const body = (await req.json()) as CreateBody;

  try {
    const campaign = db.createBrandCampaign(
      body,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(campaign);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin("brand:write");
  if (auth.error) return auth.error;

  const body = (await req.json()) as { campaignId: string };

  try {
    const invoice = db.issueInvoice(
      body.campaignId,
      auth.session.user.email!,
      clientIp(req)
    );
    return NextResponse.json(invoice);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invoice failed" },
      { status: 400 }
    );
  }
}
