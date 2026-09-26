import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { MailRepository, prisma } from "@vxmail/database";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    await MailRepository.deleteDraft(session.userId, session.mailboxId, params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
