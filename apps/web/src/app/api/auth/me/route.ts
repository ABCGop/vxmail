import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@vxmail/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        settings: true,
        mailboxes: {
          include: {
            aliases: true,
            labels: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const primaryMailbox = user.mailboxes[0];

    // Compute unread count and draft count
    const [unreadCount, draftCount] = await Promise.all([
      prisma.thread.count({
        where: {
          mailboxId: primaryMailbox?.id,
          isArchived: false,
          isTrash: false,
          isSpam: false,
          unreadCount: { gt: 0 },
        },
      }),
      prisma.draft.count({
        where: { mailboxId: primaryMailbox?.id },
      }),
    ]);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        settings: user.settings,
        mailbox: primaryMailbox
          ? {
              id: primaryMailbox.id,
              emailAddress: primaryMailbox.emailAddress,
              storageQuota: primaryMailbox.storageQuota.toString(),
              storageUsed: primaryMailbox.storageUsed.toString(),
              aliases: primaryMailbox.aliases,
              labels: primaryMailbox.labels,
            }
          : null,
        counts: {
          inboxUnread: unreadCount,
          drafts: draftCount,
        },
      },
    });
  } catch (err: any) {
    console.error("[Me API Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
