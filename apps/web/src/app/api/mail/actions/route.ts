import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { MailRepository } from "@vxmail/database";
import { realtimeEventBus } from "@/lib/realtime-events";
import { z } from "zod";

const ActionSchema = z.object({
  threadIds: z.array(z.string()).min(1),
  action: z.enum([
    "star",
    "unstar",
    "read",
    "unread",
    "archive",
    "unarchive",
    "trash",
    "untrash",
    "spam",
    "unspam",
    "deleteForever",
    "addLabel",
    "removeLabel",
  ]),
  labelId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const result = await MailRepository.bulkThreadAction({
      userId: session.userId,
      mailboxId: session.mailboxId,
      threadIds: parsed.data.threadIds,
      action: parsed.data.action,
      labelId: parsed.data.labelId,
    });

    realtimeEventBus.publish({
      type: "thread_updated",
      userId: session.userId,
      mailboxId: session.mailboxId,
      data: {
        action: parsed.data.action,
        threadIds: parsed.data.threadIds,
      },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Bulk Action API Error]", err);
    return NextResponse.json({ error: err.message || "Failed to perform action" }, { status: 500 });
  }
}
