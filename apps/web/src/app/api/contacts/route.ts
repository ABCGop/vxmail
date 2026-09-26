import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { MailRepository } from "@vxmail/database";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const contacts = await MailRepository.getContacts(session.userId);
    return NextResponse.json({ contacts });
  } catch (err: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const contact = await MailRepository.createContact(session.userId, parsed.data);
    return NextResponse.json({ success: true, contact });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
