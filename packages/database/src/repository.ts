import { prisma } from "./client";
import { parseEmailSearchQuery } from "@vxmail/email";
import { APP_CONFIG, normalizeEmail } from "@vxmail/config";
import bcrypt from "bcryptjs";

export class MailRepository {
  /**
   * Verify that a mailbox belongs to the user
   */
  static async verifyMailboxOwnership(userId: string, mailboxId: string) {
    const mailbox = await prisma.mailbox.findFirst({
      where: { id: mailboxId, userId },
    });
    if (!mailbox) {
      throw new Error("Mailbox not found or unauthorized access");
    }
    return mailbox;
  }

  /**
   * Get user's primary mailbox
   */
  static async getPrimaryMailbox(userId: string) {
    const mailbox = await prisma.mailbox.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { aliases: true },
    });
    return mailbox;
  }

  /**
   * Fetch thread list with filters (folder, label, search query, pagination)
   */
  static async getThreads({
    userId,
    mailboxId,
    folder = "inbox",
    label,
    query = "",
    page = 1,
    pageSize = 30,
  }: {
    userId: string;
    mailboxId: string;
    folder?: string;
    label?: string;
    query?: string;
    page?: number;
    pageSize?: number;
  }) {
    await this.verifyMailboxOwnership(userId, mailboxId);

    const parsedQuery = parseEmailSearchQuery(query);
    const effectiveFolder = parsedQuery.inFolder || folder;

    const where: any = {
      mailboxId,
    };

    // Folder filtering
    switch (effectiveFolder) {
      case "inbox":
        where.isArchived = false;
        where.isTrash = false;
        where.isSpam = false;
        break;
      case "starred":
        where.isStarred = true;
        where.isTrash = false;
        break;
      case "sent":
        where.isTrash = false;
        where.isSpam = false;
        where.messages = {
          some: {
            from: { contains: "vxmusic.in" },
            isDeleted: false,
          },
        };
        break;
      case "drafts":
        where.drafts = { some: {} };
        where.isTrash = false;
        break;
      case "trash":
        where.isTrash = true;
        break;
      case "spam":
        where.isSpam = true;
        where.isTrash = false;
        break;
      case "important":
        where.isImportant = true;
        where.isTrash = false;
        where.isSpam = false;
        break;
      case "all":
        where.isTrash = false;
        where.isSpam = false;
        break;
    }

    // Label filter
    const effectiveLabel = parsedQuery.label || label;
    if (effectiveLabel) {
      where.labels = {
        some: {
          label: {
            name: { equals: effectiveLabel },
          },
        },
      };
    }

    // Parsed query attributes
    if (parsedQuery.isUnread !== undefined) {
      where.unreadCount = parsedQuery.isUnread ? { gt: 0 } : 0;
    }
    if (parsedQuery.isStarred !== undefined) {
      where.isStarred = parsedQuery.isStarred;
    }
    if (parsedQuery.hasAttachment) {
      where.messages = {
        some: {
          attachments: { some: {} },
        },
      };
    }
    if (parsedQuery.subject) {
      where.subject = { contains: parsedQuery.subject };
    }
    if (parsedQuery.from) {
      where.messages = {
        some: {
          from: { contains: parsedQuery.from },
        },
      };
    }
    if (parsedQuery.to) {
      where.messages = {
        some: {
          to: { contains: parsedQuery.to },
        },
      };
    }

    // Free text tokens search across subject and snippet
    if (parsedQuery.textTokens.length > 0) {
      const tokenConditions = parsedQuery.textTokens.map((token) => ({
        OR: [
          { subject: { contains: token } },
          { snippet: { contains: token } },
          { messages: { some: { textBody: { contains: token } } } },
        ],
      }));
      where.AND = tokenConditions;
    }

    const skip = (page - 1) * pageSize;

    const [threads, totalCount, unreadTotal, draftsCount] = await Promise.all([
      prisma.thread.findMany({
        where,
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: pageSize,
        include: {
          labels: {
            include: { label: true },
          },
          messages: {
            orderBy: { sentAt: "desc" },
            take: 1,
            select: {
              from: true,
              to: true,
              sentAt: true,
              receivedAt: true,
              attachments: {
                select: { id: true, filename: true, mimeType: true, size: true },
              },
            },
          },
          drafts: {
            take: 1,
          },
        },
      }),
      prisma.thread.count({ where }),
      prisma.thread.count({
        where: {
          mailboxId,
          isArchived: false,
          isTrash: false,
          isSpam: false,
          unreadCount: { gt: 0 },
        },
      }),
      prisma.draft.count({
        where: { mailboxId },
      }),
    ]);

    return {
      threads,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      counts: {
        inboxUnread: unreadTotal,
        drafts: draftsCount,
      },
    };
  }

  /**
   * Get complete conversation/thread with all messages and attachments
   */
  static async getThreadById(userId: string, mailboxId: string, threadId: string) {
    await this.verifyMailboxOwnership(userId, mailboxId);

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, mailboxId },
      include: {
        labels: {
          include: { label: true },
        },
        messages: {
          orderBy: { sentAt: "asc" },
          include: {
            attachments: true,
            events: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        drafts: true,
      },
    });

    if (!thread) {
      throw new Error("Thread not found");
    }

    // Automatically mark unread messages as read when opening thread
    if (thread.unreadCount > 0) {
      await prisma.thread.update({
        where: { id: threadId },
        data: { unreadCount: 0 },
      });
      await prisma.message.updateMany({
        where: { threadId, mailboxId, readAt: null },
        data: { readAt: new Date() },
      });
    }

    return thread;
  }

  /**
   * Bulk actions on threads: star, unstar, markRead, markUnread, archive, trash, spam, delete
   */
  static async bulkThreadAction({
    userId,
    mailboxId,
    threadIds,
    action,
    labelId,
  }: {
    userId: string;
    mailboxId: string;
    threadIds: string[];
    action:
      | "star"
      | "unstar"
      | "read"
      | "unread"
      | "archive"
      | "unarchive"
      | "trash"
      | "untrash"
      | "spam"
      | "unspam"
      | "deleteForever"
      | "addLabel"
      | "removeLabel";
    labelId?: string;
  }) {
    await this.verifyMailboxOwnership(userId, mailboxId);

    const validThreads = await prisma.thread.findMany({
      where: {
        id: { in: threadIds },
        mailboxId,
      },
      select: { id: true },
    });
    const ids = validThreads.map((t) => t.id);

    if (ids.length === 0) return { updatedCount: 0 };

    switch (action) {
      case "star":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { isStarred: true },
        });
        break;
      case "unstar":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { isStarred: false },
        });
        break;
      case "read":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { unreadCount: 0 },
        });
        await prisma.message.updateMany({
          where: { threadId: { in: ids } },
          data: { readAt: new Date() },
        });
        break;
      case "unread":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { unreadCount: 1 },
        });
        break;
      case "archive":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { isArchived: true },
        });
        break;
      case "unarchive":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { isArchived: false },
        });
        break;
      case "trash":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { isTrash: true },
        });
        break;
      case "untrash":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { isTrash: false },
        });
        break;
      case "spam":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { isSpam: true },
        });
        break;
      case "unspam":
        await prisma.thread.updateMany({
          where: { id: { in: ids } },
          data: { isSpam: false },
        });
        break;
      case "deleteForever":
        await prisma.thread.deleteMany({
          where: { id: { in: ids }, isTrash: true },
        });
        break;
      case "addLabel":
        if (labelId) {
          for (const threadId of ids) {
            await prisma.threadLabel.upsert({
              where: { threadId_labelId: { threadId, labelId } },
              create: { threadId, labelId },
              update: {},
            });
          }
        }
        break;
      case "removeLabel":
        if (labelId) {
          await prisma.threadLabel.deleteMany({
            where: {
              threadId: { in: ids },
              labelId,
            },
          });
        }
        break;
    }

    return { updatedCount: ids.length };
  }

  /**
   * Save or update draft
   */
  static async saveDraft({
    userId,
    mailboxId,
    draftId,
    threadId,
    to,
    cc,
    bcc,
    subject,
    body,
    attachments,
  }: {
    userId: string;
    mailboxId: string;
    draftId?: string;
    threadId?: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    body?: string;
    attachments?: any[];
  }) {
    await this.verifyMailboxOwnership(userId, mailboxId);

    const toStr = JSON.stringify(to || []);
    const ccStr = JSON.stringify(cc || []);
    const bccStr = JSON.stringify(bcc || []);
    const attachmentsStr = JSON.stringify(attachments || []);

    if (draftId) {
      const existing = await prisma.draft.findFirst({
        where: { id: draftId, mailboxId },
      });
      if (existing) {
        return prisma.draft.update({
          where: { id: draftId },
          data: {
            threadId: threadId || existing.threadId,
            to: toStr,
            cc: ccStr,
            bcc: bccStr,
            subject: subject ?? existing.subject,
            body: body ?? existing.body,
            attachmentsJson: attachmentsStr,
          },
        });
      }
    }

    return prisma.draft.create({
      data: {
        mailboxId,
        threadId,
        to: toStr,
        cc: ccStr,
        bcc: bccStr,
        subject: subject || "",
        body: body || "",
        attachmentsJson: attachmentsStr,
      },
    });
  }

  /**
   * Delete draft
   */
  static async deleteDraft(userId: string, mailboxId: string, draftId: string) {
    await this.verifyMailboxOwnership(userId, mailboxId);
    return prisma.draft.deleteMany({
      where: { id: draftId, mailboxId },
    });
  }

  /**
   * Create outgoing or incoming email message and attach to thread
   */
  static async createMessage({
    mailboxId,
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
    attachments = [],
    deliveryStatus = "QUEUED",
  }: {
    mailboxId: string;
    threadId?: string;
    messageId: string;
    inReplyTo?: string;
    references?: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    textBody?: string;
    htmlBody?: string;
    attachments?: Array<{ filename: string; mimeType: string; size: number; storageKey?: string }>;
    deliveryStatus?: string;
  }) {
    let targetThreadId = threadId;

    const snippet = (textBody || "").slice(0, 150).replace(/\s+/g, " ");

    if (!targetThreadId) {
      // Create new conversation thread
      const newThread = await prisma.thread.create({
        data: {
          mailboxId,
          subject: subject || "(no subject)",
          snippet,
          messageCount: 1,
          unreadCount: 0,
          lastMessageAt: new Date(),
        },
      });
      targetThreadId = newThread.id;
    } else {
      // Update existing thread snippet and message count
      await prisma.thread.update({
        where: { id: targetThreadId },
        data: {
          snippet,
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
          isTrash: false,
          isArchived: false,
        },
      });
    }

    // Create Message record
    const message = await prisma.message.create({
      data: {
        threadId: targetThreadId,
        mailboxId,
        messageId,
        inReplyTo,
        references,
        from,
        to: JSON.stringify(to),
        cc: cc ? JSON.stringify(cc) : "[]",
        bcc: bcc ? JSON.stringify(bcc) : "[]",
        subject,
        textBody,
        htmlBody,
        deliveryStatus,
        sentAt: new Date(),
        readAt: new Date(), // Sent by owner is marked read
        events: {
          create: {
            eventType: deliveryStatus,
            details: `Message registered for processing with status ${deliveryStatus}`,
          },
        },
        attachments: {
          create: attachments.map((att) => ({
            filename: att.filename,
            mimeType: att.mimeType,
            size: att.size,
            storageKey: att.storageKey,
          })),
        },
      },
      include: {
        attachments: true,
        events: true,
      },
    });

    // Update storage used
    if (attachments.length > 0) {
      const totalAttachmentBytes = attachments.reduce((acc, curr) => acc + curr.size, 0);
      await prisma.mailbox.update({
        where: { id: mailboxId },
        data: {
          storageUsed: { increment: BigInt(totalAttachmentBytes) },
        },
      });
    }

    return { threadId: targetThreadId, message };
  }

  /**
   * User Contacts
   */
  static async getContacts(userId: string) {
    return prisma.contact.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  }

  static async createContact(userId: string, data: { name: string; email: string; notes?: string }) {
    const normalized = normalizeEmail(data.email);
    return prisma.contact.upsert({
      where: { userId_email: { userId, email: normalized } },
      create: {
        userId,
        name: data.name,
        email: normalized,
        notes: data.notes,
      },
      update: {
        name: data.name,
        notes: data.notes,
      },
    });
  }

  /**
   * Labels
   */
  static async getLabels(mailboxId: string) {
    return prisma.label.findMany({
      where: { mailboxId },
      orderBy: { name: "asc" },
    });
  }

  static async createLabel(userId: string, mailboxId: string, name: string, color: string) {
    await this.verifyMailboxOwnership(userId, mailboxId);
    return prisma.label.create({
      data: {
        mailboxId,
        name: name.trim(),
        color,
      },
    });
  }

  static async deleteLabel(userId: string, mailboxId: string, labelId: string) {
    await this.verifyMailboxOwnership(userId, mailboxId);
    return prisma.label.deleteMany({
      where: { id: labelId, mailboxId },
    });
  }

  /**
   * User Settings
   */
  static async getUserSettings(userId: string) {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }
    return settings;
  }

  static async updateUserSettings(userId: string, data: any) {
    return prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /**
   * Aliases
   */
  static async addAlias(userId: string, mailboxId: string, aliasAddress: string) {
    await this.verifyMailboxOwnership(userId, mailboxId);
    const normalized = normalizeEmail(aliasAddress);
    return prisma.alias.create({
      data: {
        mailboxId,
        aliasAddress: normalized,
      },
    });
  }

  /**
   * Admin metrics and management
   */
  static async getAdminOverview() {
    const [userCount, mailboxCount, threadCount, messageCount, loginAttempts] = await Promise.all([
      prisma.user.count(),
      prisma.mailbox.count(),
      prisma.thread.count(),
      prisma.message.count(),
      prisma.loginAttempt.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const mailboxes = await prisma.mailbox.findMany({
      include: {
        user: {
          select: { id: true, username: true, displayName: true, role: true, status: true },
        },
        aliases: true,
      },
      take: 25,
      orderBy: { createdAt: "desc" },
    });

    const recentEvents = await prisma.emailEvent.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      include: {
        message: {
          select: { subject: true, from: true, to: true, messageId: true },
        },
      },
    });

    return {
      stats: {
        userCount,
        mailboxCount,
        threadCount,
        messageCount,
      },
      mailboxes: mailboxes.map((m) => ({
        ...m,
        storageQuota: m.storageQuota.toString(),
        storageUsed: m.storageUsed.toString(),
      })),
      recentEvents,
      loginAttempts,
    };
  }
}
