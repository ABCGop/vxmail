import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { SendEmailSchema, normalizeEmail } from "@vxmail/config";
import { MailRepository, prisma } from "@vxmail/database";
import { generateMessageId, getMailTransport } from "@vxmail/email";
import { realtimeEventBus } from "@/lib/realtime-events";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = SendEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { from, to, cc, bcc, subject, textBody, htmlBody, threadId, inReplyTo, references, attachments } = parsed.data;

    // Verify sender address ownership (must be primary mailbox email or verified alias)
    const normalizedFrom = normalizeEmail(from);
    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: session.mailboxId,
        userId: session.userId,
      },
      include: { aliases: true },
    });

    if (!mailbox) {
      return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
    }

    const validFromAddresses = [
      mailbox.emailAddress.toLowerCase(),
      ...mailbox.aliases.map((a) => a.aliasAddress.toLowerCase()),
    ];

    if (!validFromAddresses.includes(normalizedFrom)) {
      return NextResponse.json(
        { error: `Unauthorized sender address: ${from}. You may only send from your mailbox or configured aliases.` },
        { status: 403 }
      );
    }

    // Generate RFC 5322 Message-ID
    const messageId = generateMessageId();

    // Store in Database
    const { threadId: targetThreadId, message } = await MailRepository.createMessage({
      mailboxId: session.mailboxId,
      threadId,
      messageId,
      inReplyTo,
      references,
      from,
      to,
      cc,
      bcc,
      subject,
      textBody,
      htmlBody,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
        storageKey: att.storageKey,
      })),
      deliveryStatus: "QUEUED",
    });

    // Send through mail transport (Stalwart SMTP in production or Development sandbox)
    const transport = getMailTransport();
    const receipt = await transport.sendMail({
      from,
      to,
      cc,
      bcc,
      subject,
      text: textBody,
      html: htmlBody,
      messageId,
      inReplyTo,
      references,
    });

    // Update message status based on mail server dispatch
    await prisma.message.update({
      where: { id: message.id },
      data: {
        deliveryStatus: receipt.status,
      },
    });

    await prisma.emailEvent.create({
      data: {
        messageId: message.id,
        eventType: receipt.status,
        details: receipt.smtpResponse || "Accepted for delivery",
      },
    });

    // Realtime notification dispatch
    realtimeEventBus.publish({
      type: "thread_updated",
      userId: session.userId,
      mailboxId: session.mailboxId,
      threadId: targetThreadId,
      messageId: message.id,
      data: {
        action: "sent",
        subject,
      },
    });

    return NextResponse.json({
      success: true,
      messageId,
      threadId: targetThreadId,
      status: receipt.status,
      isMock: receipt.isMock,
    });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Send Mail API Error]", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
