import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/store";

export async function GET() {
  const auth = await requireAdmin("transactions:read");
  if (auth.error) return auth.error;
  return NextResponse.json({
    transactions: db.listTransactions(),
    duplicates: db.listDuplicates(),
    volume: db.volume(),
  });
}
