import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { MailRepository } from "@vxmail/database";
import { sanitizeEmailHtml } from "@vxmail/email";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const thread = await MailRepository.getThreadById(
      session.userId,
      session.mailboxId,
      params.id
    );

    // Sanitize HTML in messages for safe rendering
    const safeMessages = thread.messages.map((m) => ({
      ...m,
      safeHtmlBody: m.htmlBody ? sanitizeEmailHtml(m.htmlBody, { blockExternalImages: true }) : null,
    }));

    return NextResponse.json({
      ...thread,
      messages: safeMessages,
    });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "Thread not found") {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    console.error("[Thread Detail API Error]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch thread" }, { status: 500 });
  }
}
