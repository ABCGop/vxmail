import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { CreateLabelSchema } from "@vxmail/config";
import { MailRepository } from "@vxmail/database";

export async function GET() {
  try {
    const session = await requireAuth();
    const labels = await MailRepository.getLabels(session.mailboxId);
    return NextResponse.json({ labels });
  } catch (err: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = CreateLabelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const label = await MailRepository.createLabel(
      session.userId,
      session.mailboxId,
      parsed.data.name,
      parsed.data.color
    );

    return NextResponse.json({ success: true, label });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 });
  }
}
