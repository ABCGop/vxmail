import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { SettingsUpdateSchema } from "@vxmail/config";
import { MailRepository, prisma } from "@vxmail/database";

export async function GET() {
  try {
    const session = await requireAuth();
    const settings = await MailRepository.getUserSettings(session.userId);
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = SettingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const { displayName, ...settingsData } = parsed.data;

    if (displayName) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { displayName },
      });
    }

    const updated = await MailRepository.updateUserSettings(session.userId, settingsData);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
