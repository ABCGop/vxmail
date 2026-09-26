import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { MailRepository } from "@vxmail/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const data = await MailRepository.getAdminOverview();
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[Admin API Error]", err);
    return NextResponse.json({ error: "Failed to load admin metrics" }, { status: 500 });
  }
}
