import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { MailRepository } from "@vxmail/database";
import { SearchQuerySchema } from "@vxmail/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const folder = searchParams.get("folder") || "inbox";
    const label = searchParams.get("label") || undefined;
    const q = searchParams.get("q") || "";
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 25);

    const result = await MailRepository.getThreads({
      userId: session.userId,
      mailboxId: session.mailboxId,
      folder,
      label,
      query: q,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Threads API Error]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch threads" }, { status: 500 });
  }
}
