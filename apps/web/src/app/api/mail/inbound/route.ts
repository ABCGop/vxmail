import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@vxmail/database";
import { sanitizeEmailHtml, parseRawMimeMessage, generateMessageId } from "@vxmail/email";
import { realtimeEventBus } from "@/lib/realtime-events";
import { normalizeEmail } from "@vxmail/config";

// Inbound webhook authorization secret
const INBOUND_SECRET = process.env.INBOUND_WEBHOOK_SECRET || "vxmail_inbound_secret_default";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate webhook caller (Stalwart, Postfix, or Cloudflare Worker)
    const authHeader = req.headers.get("authorization") || "";
    const customHeader = req.headers.get("x-vxmail-secret") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    const isAuthorized =
      bearerToken === INBOUND_SECRET ||
      customHeader === INBOUND_SECRET ||
      process.env.NODE_ENV !== "production"; // Permissive in local dev

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid inbound webhook secret" },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let emailData: {
      from: string;
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      text?: string;
      html?: string;
      messageId: string;
      inReplyTo?: string;
      references?: string;
      attachments?: Array<{
        filename: string;
        mimeType: string;
        size: number;
        storageKey?: string;
      }>;
      dkimVerified?: boolean;
      spfVerified?: boolean;
    };

    // 2. Parse payload: JSON or Raw RFC 5322 MIME
    if (contentType.includes("application/json")) {
      const json = await req.json();
      emailData = {
        from: json.from || "unknown@external.com",
        to: Array.isArray(json.to) ? json.to : [json.to],
        cc: Array.isArray(json.cc) ? json.cc : json.cc ? [json.cc] : [],
        bcc: Array.isArray(json.bcc) ? json.bcc : json.bcc ? [json.bcc] : [],
        subject: json.subject || "(no subject)",
        text: json.text || json.textBody || "",
        html: json.html || json.htmlBody || "",
        messageId: json.messageId || generateMessageId(),
        inReplyTo: json.inReplyTo,
        references: json.references,
        attachments: json.attachments || [],
        dkimVerified: json.dkimVerified ?? true,
        spfVerified: json.spfVerified ?? true,
      };
    } else {
      // Raw RFC 5322 MIME stream from Stalwart/Postfix pipe
      const rawMime = await req.text();
      const parsed = await parseRawMimeMessage(rawMime);
      emailData = {
        from: parsed.from,
        to: parsed.to,
        cc: parsed.cc,
        subject: parsed.subject,
        text: parsed.text,
        html: parsed.html,
        messageId: parsed.messageId || generateMessageId(),
        inReplyTo: parsed.inReplyTo,
        references: parsed.references,
        attachments: parsed.attachments.map((att) => ({
          filename: att.filename,
          mimeType: att.contentType,
          size: att.size,
        })),
        dkimVerified: true,
        spfVerified: true,
      };
    }

    // 3. Resolve Target Mailbox(es) in the VxMusic ecosystem
    const recipientCandidates = [
      ...emailData.to.map(normalizeEmail),
      ...(emailData.cc || []).map(normalizeEmail),
    ];

    // Find all mailboxes matching primary address or configured alias
    const matchingMailboxes = await prisma.mailbox.findMany({
      where: {
        OR: [
          { emailAddress: { in: recipientCandidates } },
          { aliases: { some: { aliasAddress: { in: recipientCandidates } } } },
        ],
        status: "ACTIVE",
      },
      include: {
        user: true,
      },
    });

    if (matchingMailboxes.length === 0) {
      console.warn(`[VxMail Inbound] No local mailbox found for recipients: ${recipientCandidates.join(", ")}`);
      // Return 404 so mail server can bounce or route to catch-all
      return NextResponse.json(
        { error: "No matching recipient mailbox found on this domain", recipients: recipientCandidates },
        { status: 404 }
      );
    }

    const deliveredReceipts: Array<{ mailboxId: string; threadId: string; messageId: string }> = [];

    // 4. Ingest and route email into each recipient mailbox
    for (const mailbox of matchingMailboxes) {
      // Sanitize HTML body for XSS defense
      const rawHtmlInput = emailData.html || `<p>${emailData.text?.replace(/\n/g, "<br/>") || ""}</p>`;
      const safeHtml = sanitizeEmailHtml(rawHtmlInput);
      const snippet = (emailData.text || rawHtmlInput.replace(/<[^>]*>/g, " ")).slice(0, 150).replace(/\s+/g, " ").trim();

      // Thread resolution by Message-ID references chain
      let targetThreadId: string | null = null;
      const parentMessageIds = [
        emailData.inReplyTo,
        ...(emailData.references ? emailData.references.split(/\s+/) : []),
      ].filter(Boolean) as string[];

      if (parentMessageIds.length > 0) {
        const parentMessage = await prisma.message.findFirst({
          where: {
            mailboxId: mailbox.id,
            messageId: { in: parentMessageIds },
          },
        });
        if (parentMessage) {
          targetThreadId = parentMessage.threadId;
        }
      }

      if (!targetThreadId) {
        // Create new conversation thread
        const newThread = await prisma.thread.create({
          data: {
            mailboxId: mailbox.id,
            subject: emailData.subject,
            snippet,
            messageCount: 1,
            unreadCount: 1,
            lastMessageAt: new Date(),
            isArchived: false,
            isTrash: false,
            isSpam: false,
          },
        });
        targetThreadId = newThread.id;
      } else {
        // Update existing conversation thread
        await prisma.thread.update({
          where: { id: targetThreadId },
          data: {
            snippet,
            lastMessageAt: new Date(),
            messageCount: { increment: 1 },
            unreadCount: { increment: 1 },
            isTrash: false,
            isArchived: false,
          },
        });
      }

      // Create incoming Message
      const message = await prisma.message.create({
        data: {
          threadId: targetThreadId,
          mailboxId: mailbox.id,
          messageId: emailData.messageId,
          inReplyTo: emailData.inReplyTo,
          references: emailData.references,
          from: emailData.from,
          to: JSON.stringify(emailData.to),
          cc: emailData.cc ? JSON.stringify(emailData.cc) : null,
          bcc: emailData.bcc ? JSON.stringify(emailData.bcc) : null,
          subject: emailData.subject,
          textBody: emailData.text,
          htmlBody: safeHtml,
          deliveryStatus: "DELIVERED",
          dkimVerified: emailData.dkimVerified ?? true,
          spfVerified: emailData.spfVerified ?? true,
          sentAt: new Date(),
          readAt: null,
          attachments: {
            create: (emailData.attachments || []).map((att) => ({
              filename: att.filename,
              mimeType: att.mimeType,
              size: att.size,
              storageKey: att.storageKey,
            })),
          },
        },
      });

      // Log delivery event
      await prisma.emailEvent.create({
        data: {
          messageId: message.id,
          eventType: "DELIVERED",
          details: `Inbound email routed to ${mailbox.emailAddress} via Stalwart Ingestion`,
        },
      });

      // 5. Emit Real-time SSE / Redis PubSub Event to recipient's browser
      realtimeEventBus.publish({
        type: "new_email",
        userId: mailbox.userId,
        mailboxId: mailbox.id,
        threadId: targetThreadId,
        messageId: message.id,
        data: {
          from: emailData.from,
          subject: emailData.subject,
          snippet,
          receivedAt: new Date().toISOString(),
        },
      });

      deliveredReceipts.push({
        mailboxId: mailbox.id,
        threadId: targetThreadId,
        messageId: message.id,
      });

      console.log(`[VxMail Inbound] Successfully delivered message ${emailData.messageId} to ${mailbox.emailAddress}`);
    }

    return NextResponse.json({
      success: true,
      messageId: emailData.messageId,
      deliveredTo: deliveredReceipts,
    });
  } catch (error: any) {
    console.error("[VxMail Inbound Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process inbound email" },
      { status: 500 }
    );
  }
}
