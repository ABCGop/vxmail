import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { DraftSaveSchema } from "@vxmail/config";
import { MailRepository, prisma } from "@vxmail/database";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const drafts = await prisma.draft.findMany({
      where: { mailboxId: session.mailboxId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ drafts });
  } catch (err: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = DraftSaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const draft = await MailRepository.saveDraft({
      userId: session.userId,
      mailboxId: session.mailboxId,
      draftId: parsed.data.id,
      threadId: parsed.data.threadId,
      to: parsed.data.to,
      cc: parsed.data.cc,
      bcc: parsed.data.bcc,
      subject: parsed.data.subject,
      body: parsed.data.body,
      attachments: parsed.data.attachments,
    });

    return NextResponse.json({ success: true, draft });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Draft Autosave API Error]", err);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
