import { prisma } from "./client";
import bcrypt from "bcryptjs";
import { generateMessageId } from "@vxmail/email";

async function main() {
  console.log("[VxMail Seed] Cleaning existing database records...");
  await prisma.auditLog.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.emailEvent.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.messageLabel.deleteMany();
  await prisma.threadLabel.deleteMany();
  await prisma.message.deleteMany();
  await prisma.draft.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.label.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.alias.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.mailbox.deleteMany();
  await prisma.user.deleteMany();

  console.log("[VxMail Seed] Creating default users and mailboxes...");

  const salt = await bcrypt.genSalt(10);
  const userPasswordHash = await bcrypt.hash("password123", salt);
  const adminPasswordHash = await bcrypt.hash("adminpassword123", salt);

  // 1. Alex Rivera (Primary Demo User)
  const alexUser = await prisma.user.create({
    data: {
      email: "alex@vxmusic.in",
      username: "alex",
      displayName: "Alex Rivera",
      passwordHash: userPasswordHash,
      emailVerified: true,
      role: "USER",
      status: "ACTIVE",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face",
      settings: {
        create: {
          theme: "dark",
          density: "comfortable",
          signature: "--\nAlex Rivera\nProducer & Music Architect | VxMusic\nalex@vxmusic.in\nhttps://vxmusic.in",
          replyBehavior: "reply",
          conversationView: true,
          blockExternalImages: true,
          desktopNotifications: true,
        },
      },
    },
  });

  const alexMailbox = await prisma.mailbox.create({
    data: {
      userId: alexUser.id,
      emailAddress: "alex@vxmusic.in",
      storageQuota: BigInt(16106127360), // 15 GB
      storageUsed: BigInt(48234496), // ~48 MB
      status: "ACTIVE",
      aliases: {
        create: [
          { aliasAddress: "support@vxmusic.in" },
          { aliasAddress: "hello@vxmusic.in" },
        ],
      },
    },
  });

  // 2. Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@vxmusic.in",
      username: "admin",
      displayName: "VxMusic Systems Administrator",
      passwordHash: adminPasswordHash,
      emailVerified: true,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      settings: {
        create: {
          theme: "dark",
          density: "compact",
          signature: "VxMusic Security & Infra Operations",
        },
      },
    },
  });

  await prisma.mailbox.create({
    data: {
      userId: adminUser.id,
      emailAddress: "admin@vxmusic.in",
      status: "ACTIVE",
    },
  });

  // 3. Sarah Chen (Engineer)
  const sarahUser = await prisma.user.create({
    data: {
      email: "sarah@vxmusic.in",
      username: "sarah",
      displayName: "Sarah Chen",
      passwordHash: userPasswordHash,
      emailVerified: true,
      role: "USER",
      status: "ACTIVE",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&h=128&fit=crop&crop=face",
    },
  });

  await prisma.mailbox.create({
    data: {
      userId: sarahUser.id,
      emailAddress: "sarah@vxmusic.in",
      status: "ACTIVE",
    },
  });

  console.log("[VxMail Seed] Creating labels & contacts for Alex...");

  const labelReleases = await prisma.label.create({
    data: { mailboxId: alexMailbox.id, name: "Releases", color: "#8b5cf6" },
  });
  const labelContracts = await prisma.label.create({
    data: { mailboxId: alexMailbox.id, name: "Contracts", color: "#06b6d4" },
  });
  const labelMastering = await prisma.label.create({
    data: { mailboxId: alexMailbox.id, name: "Mastering", color: "#f59e0b" },
  });
  const labelVIP = await prisma.label.create({
    data: { mailboxId: alexMailbox.id, name: "VxVIP", color: "#ec4899" },
  });

  await prisma.contact.createMany({
    data: [
      {
        userId: alexUser.id,
        name: "Sarah Chen",
        email: "sarah@vxmusic.in",
        notes: "Lead Mastering Engineer at VxMusic Studio Berlin",
      },
      {
        userId: alexUser.id,
        name: "Marcus Vance",
        email: "licensing@sonymusic.example.com",
        notes: "Senior Sync & Placement Agent",
      },
      {
        userId: alexUser.id,
        name: "Maya Lin",
        email: "art@vxmusic.in",
        notes: "Art Director & Visual Identity",
      },
      {
        userId: alexUser.id,
        name: "Support Desk",
        email: "support@vxmusic.in",
        notes: "Internal Helpdesk & Ticket Router",
      },
    ],
  });

  console.log("[VxMail Seed] Seeding realistic email threads...");

  // Thread 1: Multi-turn Mastering Conversation
  const t1 = await prisma.thread.create({
    data: {
      mailboxId: alexMailbox.id,
      subject: "VxMusic Vol. 4 Master Stems & Final Delivery",
      snippet: "Clamped to 60Hz and re-rendered. Ready for digital distribution across Spotify, Apple Music & Tidal.",
      messageCount: 3,
      unreadCount: 0,
      isStarred: true,
      isImportant: true,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
      labels: {
        create: [
          { labelId: labelReleases.id },
          { labelId: labelMastering.id },
        ],
      },
    },
  });

  const m1Id = generateMessageId();
  const m2Id = generateMessageId();
  const m3Id = generateMessageId();

  await prisma.message.create({
    data: {
      threadId: t1.id,
      mailboxId: alexMailbox.id,
      messageId: m1Id,
      from: "Sarah Chen <sarah@vxmusic.in>",
      to: JSON.stringify(["alex@vxmusic.in"]),
      subject: "VxMusic Vol. 4 Master Stems & Final Delivery",
      textBody: "Hey Alex,\n\nI uploaded the final 24-bit / 96kHz master stems for Vol. 4. Please review Track 3 ('Midnight Echoes') - particularly the low-end compression on the sub.\n\nBest,\nSarah",
      htmlBody: "<p>Hey Alex,</p><p>I uploaded the final 24-bit / 96kHz master stems for Vol. 4. Please review Track 3 (<em>Midnight Echoes</em>) &mdash; particularly the low-end compression on the sub.</p><p>Best,<br><strong>Sarah</strong></p>",
      sentAt: new Date(Date.now() - 1000 * 60 * 180),
      readAt: new Date(),
      dkimVerified: true,
      spfVerified: true,
      deliveryStatus: "DELIVERED",
      attachments: {
        create: [
          {
            filename: "vol4_master_audit_v2.pdf",
            mimeType: "application/pdf",
            size: 1420500,
            storageKey: "attachments/vol4_master_audit_v2.pdf",
          },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      threadId: t1.id,
      mailboxId: alexMailbox.id,
      messageId: m2Id,
      inReplyTo: m1Id,
      references: m1Id,
      from: "Alex Rivera <alex@vxmusic.in>",
      to: JSON.stringify(["sarah@vxmusic.in"]),
      subject: "Re: VxMusic Vol. 4 Master Stems & Final Delivery",
      textBody: "Thanks Sarah! Checked track 3 on the studio monitors. The punch is solid, but let's make sure the sidechain is clamped tight around 60Hz so it doesn't muddy club subwoofers.",
      htmlBody: "<p>Thanks Sarah! Checked track 3 on the studio monitors. The punch is solid, but let's make sure the sidechain is clamped tight around 60Hz so it doesn't muddy club subwoofers.</p>",
      sentAt: new Date(Date.now() - 1000 * 60 * 120),
      readAt: new Date(),
      dkimVerified: true,
      spfVerified: true,
      deliveryStatus: "DELIVERED",
    },
  });

  await prisma.message.create({
    data: {
      threadId: t1.id,
      mailboxId: alexMailbox.id,
      messageId: m3Id,
      inReplyTo: m2Id,
      references: `${m1Id} ${m2Id}`,
      from: "Sarah Chen <sarah@vxmusic.in>",
      to: JSON.stringify(["alex@vxmusic.in"]),
      subject: "Re: VxMusic Vol. 4 Master Stems & Final Delivery",
      textBody: "Done! Clamped to 60Hz and re-rendered with 1.2 dB true-peak headroom. Ready for digital distribution across Spotify, Apple Music & Tidal.",
      htmlBody: "<p>Done! Clamped to 60Hz and re-rendered with 1.2 dB true-peak headroom. Ready for digital distribution across Spotify, Apple Music &amp; Tidal.</p><p>All stems synced to the S3 bucket.</p>",
      sentAt: new Date(Date.now() - 1000 * 60 * 45),
      readAt: new Date(),
      dkimVerified: true,
      spfVerified: true,
      deliveryStatus: "DELIVERED",
    },
  });

  // Thread 2: Sync License Contract (Unread, VIP, Starred)
  const t2 = await prisma.thread.create({
    data: {
      mailboxId: alexMailbox.id,
      subject: "Exclusive Sync Licensing Agreement: Netflix Cyberpunk Odyssey (Ep. 4)",
      snippet: "Attached is the countersigned sync contract and cue-sheet schedule for 'Neon Horizon'. Payout schedule enclosed.",
      messageCount: 1,
      unreadCount: 1,
      isStarred: true,
      isImportant: true,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      labels: {
        create: [
          { labelId: labelContracts.id },
          { labelId: labelVIP.id },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      threadId: t2.id,
      mailboxId: alexMailbox.id,
      messageId: generateMessageId(),
      from: "Marcus Vance <licensing@sonymusic.example.com>",
      to: JSON.stringify(["alex@vxmusic.in"]),
      subject: "Exclusive Sync Licensing Agreement: Netflix Cyberpunk Odyssey (Ep. 4)",
      textBody: "Hi Alex,\n\nCongratulations! The music supervisors for Cyberpunk Odyssey have locked in 'Neon Horizon' for the rooftop confrontation scene in Episode 4.\n\nAttached is the countersigned agreement and cue-sheet. Initial advance of $45,000 will be wired upon invoice receipt.\n\nBest,\nMarcus Vance",
      htmlBody: "<p>Hi Alex,</p><p>Congratulations! The music supervisors for <strong>Cyberpunk Odyssey</strong> have locked in <em>'Neon Horizon'</em> for the rooftop confrontation scene in Episode 4.</p><p>Attached is the countersigned agreement and cue-sheet. Initial advance of <strong>$45,000</strong> will be wired upon invoice receipt.</p><p>Best regards,<br><strong>Marcus Vance</strong><br>Senior Sync Director</p>",
      sentAt: new Date(Date.now() - 1000 * 60 * 15),
      readAt: null, // Unread!
      dkimVerified: true,
      spfVerified: true,
      deliveryStatus: "DELIVERED",
      attachments: {
        create: [
          {
            filename: "netflix_cyberpunk_sync_agreement_signed.pdf",
            mimeType: "application/pdf",
            size: 3250000,
            storageKey: "attachments/netflix_cyberpunk_sync_agreement_signed.pdf",
          },
          {
            filename: "cue_sheet_ep4_neon_horizon.xlsx",
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            size: 184000,
            storageKey: "attachments/cue_sheet_ep4.xlsx",
          },
        ],
      },
    },
  });

  // Thread 3: VxMail Infrastructure & Security Report
  const t3 = await prisma.thread.create({
    data: {
      mailboxId: alexMailbox.id,
      subject: "VxMail System Advisory: Stalwart Mail Server & DKIM Keys Rotated",
      snippet: "Quarterly security report: Inbound TLS 1.3 enforced, SPF alignment verified for vxmusic.in, and 0 relay vulnerabilities detected.",
      messageCount: 1,
      unreadCount: 0,
      isStarred: false,
      isImportant: true,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 360),
    },
  });

  await prisma.message.create({
    data: {
      threadId: t3.id,
      mailboxId: alexMailbox.id,
      messageId: generateMessageId(),
      from: "VxMusic Security Team <support@vxmusic.in>",
      to: JSON.stringify(["alex@vxmusic.in"]),
      subject: "VxMail System Advisory: Stalwart Mail Server & DKIM Keys Rotated",
      textBody: "VxMail Production Security Advisory:\n\n- Mail Domain: vxmusic.in\n- Mail Host: mail.vxmusic.in\n- DKIM: 2048-bit RSA active selector 'vxmail2026'\n- DMARC Policy: p=quarantine\n- Anti-abuse: Rate limits configured at 100 msgs/hour per user.",
      htmlBody: "<div style='font-family:sans-serif;'><h3>VxMail Security Advisory &mdash; Q3 Audit</h3><p>Status: <span style='color:#10b981;font-weight:bold;'>ALL SYSTEMS OPERATIONAL</span></p><ul><li>Mail Server: <strong>Stalwart Mail Server (v0.8.x)</strong></li><li>Inbound/Outbound TLS: Enforced (TLS 1.3 / ECDHE-RSA)</li><li>DKIM Signature Selector: <code>vxmail2026</code></li><li>DMARC Policy: <code>v=DMARC1; p=quarantine; sp=quarantine</code></li></ul><p>Reverse DNS (PTR) mapped to <code>mail.vxmusic.in</code>.</p></div>",
      sentAt: new Date(Date.now() - 1000 * 60 * 360),
      readAt: new Date(),
      dkimVerified: true,
      spfVerified: true,
      deliveryStatus: "DELIVERED",
    },
  });

  // Thread 4: Draft item
  const t4 = await prisma.thread.create({
    data: {
      mailboxId: alexMailbox.id,
      subject: "Proposal: VxMusic Festival 2027 Ambient Stage Design",
      snippet: "[Draft] Working on the acoustic spatial audio setup and LED monolith concept...",
      messageCount: 0,
      unreadCount: 0,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 70),
    },
  });

  await prisma.draft.create({
    data: {
      mailboxId: alexMailbox.id,
      threadId: t4.id,
      to: JSON.stringify(["maya@vxmusic.in", "director@festivals.example.com"]),
      subject: "Proposal: VxMusic Festival 2027 Ambient Stage Design",
      body: "<p>Hi Maya,</p><p>Here is the initial concept for the ambient stage at the 2027 festival. We want an immersive 16-channel Ambisonics dome coupled with dark obsidian kinetic fixtures.</p><p>Let me know your thoughts on budget allocation before Friday.</p>",
    },
  });

  // Thread 5: Spam thread
  const t5 = await prisma.thread.create({
    data: {
      mailboxId: alexMailbox.id,
      subject: "URGENT: Inherited 4.5M USD Investment Funds Waiting",
      snippet: "Dear sir, kindly provide bank credentials to release crypto wire payout immediately.",
      messageCount: 1,
      unreadCount: 1,
      isSpam: true,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 1400),
    },
  });

  await prisma.message.create({
    data: {
      threadId: t5.id,
      mailboxId: alexMailbox.id,
      messageId: generateMessageId(),
      from: "Foreign Claims Bureau <claims@spambot-fake.biz>",
      to: JSON.stringify(["alex@vxmusic.in"]),
      subject: "URGENT: Inherited 4.5M USD Investment Funds Waiting",
      textBody: "Kindly provide personal bank account and password to release funds.",
      htmlBody: "<p>Kindly provide personal bank account and password to release funds.</p>",
      isSpam: true,
      dkimVerified: false,
      spfVerified: false,
      sentAt: new Date(Date.now() - 1000 * 60 * 1400),
    },
  });

  // Thread 6: Trash thread
  const t6 = await prisma.thread.create({
    data: {
      mailboxId: alexMailbox.id,
      subject: "Old Receipt: Plugin Alliance Holiday Sale (Order #89312)",
      snippet: "Thank you for your purchase of bx_console SSL 4000 E.",
      messageCount: 1,
      unreadCount: 0,
      isTrash: true,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 5000),
    },
  });

  await prisma.message.create({
    data: {
      threadId: t6.id,
      mailboxId: alexMailbox.id,
      messageId: generateMessageId(),
      from: "Plugin Alliance <billing@plugin-alliance.example.com>",
      to: JSON.stringify(["alex@vxmusic.in"]),
      subject: "Old Receipt: Plugin Alliance Holiday Sale (Order #89312)",
      textBody: "Your order #89312 has been processed. Amount: $29.99.",
      htmlBody: "<p>Your order #89312 has been processed. Amount: $29.99.</p>",
      isDeleted: true,
      sentAt: new Date(Date.now() - 1000 * 60 * 5000),
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: alexUser.id,
        title: "Sync Agreement Received",
        message: "Marcus Vance sent the signed Netflix sync license contract.",
        link: `/thread/${t2.id}`,
        type: "SUCCESS",
        read: false,
      },
      {
        userId: alexUser.id,
        title: "Mailbox Storage Quota",
        message: "You are currently using 48.2 MB of your 15 GB quota (0.3%).",
        link: "/settings",
        type: "INFO",
        read: true,
      },
    ],
  });

  // Security Events & Login Attempts
  await prisma.loginAttempt.createMany({
    data: [
      { ipAddress: "127.0.0.1", identifier: "alex", success: true },
      { ipAddress: "127.0.0.1", identifier: "admin", success: true },
      { ipAddress: "198.51.100.42", identifier: "unknown_bot", success: false, failureReason: "Invalid credentials" },
    ],
  });

  await prisma.securityEvent.createMany({
    data: [
      {
        userId: alexUser.id,
        eventType: "LOGIN_SUCCESS",
        ipAddress: "127.0.0.1",
        userAgent: "VxMail Web Client 1.0 (Windows NT 10.0; Win64; x64)",
        severity: "LOW",
      },
      {
        userId: adminUser.id,
        eventType: "DKIM_KEY_ROTATED",
        ipAddress: "127.0.0.1",
        userAgent: "VxMail System Worker",
        severity: "LOW",
        metadata: "Rotated selector vxmail2026",
      },
    ],
  });

  console.log("[VxMail Seed] Seed completed successfully!");
  console.log("Demo Credentials:");
  console.log("User: alex@vxmusic.in (username: alex) / password123");
  console.log("Admin: admin@vxmusic.in (username: admin) / adminpassword123");
}

main()
  .catch((e) => {
    console.error("[VxMail Seed Error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
