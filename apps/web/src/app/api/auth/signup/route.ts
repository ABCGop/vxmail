import { NextRequest, NextResponse } from "next/server";
import { SignUpSchema, APP_CONFIG, normalizeEmail } from "@vxmail/config";
import { prisma, MailRepository } from "@vxmail/database";
import { generateMessageId } from "@vxmail/email";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const parsed = SignUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { username, displayName, password } = parsed.data;
    const cleanUsername = username.toLowerCase().trim();
    const emailAddress = `${cleanUsername}@${APP_CONFIG.domain}`;

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: emailAddress }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username or email is already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and initial mailbox
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        displayName,
        email: emailAddress,
        passwordHash,
        emailVerified: true,
        role: "USER",
        status: "ACTIVE",
        settings: {
          create: {
            theme: "dark",
            density: "comfortable",
            signature: `--\n${displayName}\n${emailAddress}`,
          },
        },
        mailboxes: {
          create: {
            emailAddress,
            storageQuota: BigInt(APP_CONFIG.limits.defaultStorageQuotaBytes),
            storageUsed: BigInt(0),
            status: "ACTIVE",
          },
        },
      },
      include: {
        mailboxes: true,
      },
    });

    const primaryMailbox = user.mailboxes[0];

    // Create a Welcome Email Thread in the new user's mailbox
    const welcomeThread = await prisma.thread.create({
      data: {
        mailboxId: primaryMailbox.id,
        subject: "Welcome to VxMail & the VxMusic Ecosystem",
        snippet: "Your official VxMusic email identity is ready. Explore your inbox, aliases, and security settings.",
        messageCount: 1,
        unreadCount: 1,
        lastMessageAt: new Date(),
      },
    });

    await prisma.message.create({
      data: {
        threadId: welcomeThread.id,
        mailboxId: primaryMailbox.id,
        messageId: generateMessageId(),
        from: "VxMusic Operations <support@vxmusic.in>",
        to: JSON.stringify([emailAddress]),
        subject: "Welcome to VxMail & the VxMusic Ecosystem",
        textBody: `Welcome to VxMail, ${displayName}!\n\nYour address is ${emailAddress}.\n\nFeatures available in your mailbox:\n- Clean, modern Gmail-style experience\n- Encrypted storage with 15 GB quota\n- Custom aliases (e.g. support@vxmusic.in)\n- Rich conversation threading & search\n\nBest regards,\nThe VxMusic Team`,
        htmlBody: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #f8fafc; background: #0c0e14; padding: 24px; border-radius: 8px;">
            <h2 style="color: #8b5cf6; margin-top: 0;">Welcome to VxMail, ${displayName}!</h2>
            <p>Your official mailbox <strong>${emailAddress}</strong> is active on the <strong>vxmusic.in</strong> ecosystem.</p>
            <div style="background: #161924; border: 1px solid #222634; padding: 16px; border-radius: 6px; margin: 16px 0;">
              <h4 style="margin: 0 0 8px 0; color: #06b6d4;">Quick Start Guide</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Press <kbd style="background:#222;padding:2px 6px;border-radius:4px;">C</kbd> to compose a new message</li>
                <li>Press <kbd style="background:#222;padding:2px 6px;border-radius:4px;">/</kbd> to search with Gmail syntax (e.g. <code>has:attachment</code>)</li>
                <li>Manage aliases and security in Settings</li>
              </ul>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">Sent via Stalwart Mail Server &bull; TLS 1.3 &bull; DKIM Signed</p>
          </div>
        `,
        sentAt: new Date(),
        readAt: null, // marked unread
        deliveryStatus: "DELIVERED",
      },
    });

    // Auto-create default labels
    await prisma.label.createMany({
      data: [
        { mailboxId: primaryMailbox.id, name: "Releases", color: "#8b5cf6" },
        { mailboxId: primaryMailbox.id, name: "Contracts", color: "#06b6d4" },
        { mailboxId: primaryMailbox.id, name: "Studio", color: "#10b981" },
      ],
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: "USER",
      mailboxId: primaryMailbox.id,
    });

    setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        mailboxId: primaryMailbox.id,
      },
    });
  } catch (err: any) {
    console.error("[SignUp API Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
