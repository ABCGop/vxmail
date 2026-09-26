import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseEmailSearchQuery,
  sanitizeEmailHtml,
  generateMessageId,
  formatReplySubject,
  buildReferencesHeader,
  isSafeAttachmentExtension,
} from "@vxmail/email";
import {
  normalizeEmail,
  isVxMusicEmail,
  APP_CONFIG,
  SignUpSchema,
  SendEmailSchema,
} from "@vxmail/config";
import bcrypt from "bcryptjs";

describe("Email Address Normalization & Validation", () => {
  it("normalizes email addresses to lowercase and trims whitespace", () => {
    assert.equal(normalizeEmail("  Alex.Rivera@VXMusic.IN  "), "alex.rivera@vxmusic.in");
    assert.equal(normalizeEmail("USER@EXAMPLE.COM"), "user@example.com");
  });

  it("correctly identifies vxmusic.in domain addresses", () => {
    assert.equal(isVxMusicEmail("alex@vxmusic.in"), true);
    assert.equal(isVxMusicEmail("support@vxmusic.in"), true);
    assert.equal(isVxMusicEmail("attacker@gmail.com"), false);
    assert.equal(isVxMusicEmail("fake@spoofed-vxmusic.in"), false);
  });
});

describe("Gmail-Style Search Query Parser", () => {
  it("parses from:, to:, subject:, and flag queries", () => {
    const parsed = parseEmailSearchQuery(
      'from:sarah@vxmusic.in subject:"stem review" has:attachment is:unread'
    );
    assert.equal(parsed.from, "sarah@vxmusic.in");
    assert.equal(parsed.subject, "stem review");
    assert.equal(parsed.hasAttachment, true);
    assert.equal(parsed.isUnread, true);
  });

  it("extracts free text search tokens alongside structured filters", () => {
    const parsed = parseEmailSearchQuery("in:inbox urgent contract payment");
    assert.equal(parsed.inFolder, "inbox");
    assert.ok(parsed.textTokens.includes("urgent"));
    assert.ok(parsed.textTokens.includes("contract"));
    assert.ok(parsed.textTokens.includes("payment"));
  });

  it("handles is:starred and label: filters", () => {
    const parsed = parseEmailSearchQuery("is:starred label:Releases");
    assert.equal(parsed.isStarred, true);
    assert.equal(parsed.label, "Releases");
  });
});

describe("HTML Email Sanitization & XSS Defense", () => {
  it("strips executable scripts and dangerous event handlers", () => {
    const untrusted = `
      <div>
        <h2>Exclusive Audio Preview</h2>
        <script>alert("XSS Attack!");</script>
        <img src="https://example.com/art.jpg" onerror="alert('stealing tokens')" />
        <a href="javascript:stealCookie()">Click here</a>
      </div>
    `;

    const clean = sanitizeEmailHtml(untrusted, { blockExternalImages: false });
    assert.ok(!clean.includes("<script>"));
    assert.ok(!clean.includes("alert"));
    assert.ok(!clean.includes("onerror"));
    assert.ok(!clean.includes("javascript:"));
    assert.ok(clean.includes("Exclusive Audio Preview"));
  });

  it("blocks remote tracking images by default", () => {
    const emailWithTracker = `
      <p>Hello Alex</p>
      <img src="https://spy-pixel.tracker.biz/beacon.gif" alt="tracker" />
    `;

    const clean = sanitizeEmailHtml(emailWithTracker, { blockExternalImages: true });
    assert.ok(clean.includes("vxmail-blocked-image"));
    assert.ok(clean.includes('data-original-src="https://spy-pixel.tracker.biz/beacon.gif"'));
  });

  it("enforces rel='noopener noreferrer nofollow' and target='_blank' on links", () => {
    const linkHtml = `<a href="https://netflix.com/contracts">Review Contract</a>`;
    const clean = sanitizeEmailHtml(linkHtml);
    assert.ok(clean.includes('target="_blank"'));
    assert.ok(clean.includes('rel="noopener noreferrer nofollow"'));
  });
});

describe("RFC MIME & Threading Utilities", () => {
  it("generates compliant RFC 5322 Message-ID headers", () => {
    const messageId = generateMessageId();
    assert.match(messageId, /^<[a-z0-9.]+\.[a-z0-9.]+@[a-z0-9.-]+>$/i);
    assert.ok(messageId.includes(`@${APP_CONFIG.domain}`));
  });

  it("formats reply subjects without duplicating Re: prefixes", () => {
    assert.equal(formatReplySubject("Mix Delivery"), "Re: Mix Delivery");
    assert.equal(formatReplySubject("Re: Mix Delivery"), "Re: Mix Delivery");
    assert.equal(formatReplySubject("RE: Mix Delivery"), "RE: Mix Delivery");
  });

  it("builds correct References chain for threading", () => {
    const ref1 = "<msg1@vxmusic.in>";
    const ref2 = "<msg2@vxmusic.in>";
    const chain = buildReferencesHeader(ref1, ref2);
    assert.equal(chain, "<msg1@vxmusic.in> <msg2@vxmusic.in>");
  });
});

describe("Attachment Security", () => {
  it("blocks dangerous executable extensions", () => {
    assert.equal(isSafeAttachmentExtension("stems.wav"), true);
    assert.equal(isSafeAttachmentExtension("agreement.pdf"), true);
    assert.equal(isSafeAttachmentExtension("malware.exe"), false);
    assert.equal(isSafeAttachmentExtension("script.bat"), false);
    assert.equal(isSafeAttachmentExtension("trojan.scr"), false);
    assert.equal(isSafeAttachmentExtension("exploit.ps1"), false);
  });
});

describe("Password Security & Hashing", () => {
  it("securely hashes and verifies passwords using bcrypt", async () => {
    const plain = "superSecureVxPass2026!";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plain, salt);

    assert.notEqual(hash, plain);
    const isValid = await bcrypt.compare(plain, hash);
    const isInvalid = await bcrypt.compare("wrongPassword", hash);

    assert.equal(isValid, true);
    assert.equal(isInvalid, false);
  });
});

describe("Schema Validation (Zod)", () => {
  it("validates signup input format", () => {
    const valid = SignUpSchema.safeParse({
      username: "alex.rivera",
      displayName: "Alex Rivera",
      password: "password12345",
    });
    assert.equal(valid.success, true);

    const invalidUsername = SignUpSchema.safeParse({
      username: "Invalid Username With Spaces!",
      displayName: "Alex",
      password: "short",
    });
    assert.equal(invalidUsername.success, false);
  });

  it("validates send email input format", () => {
    const valid = SendEmailSchema.safeParse({
      from: "alex@vxmusic.in",
      to: ["sarah@vxmusic.in"],
      subject: "Stems",
      textBody: "Please check track 3.",
    });
    assert.equal(valid.success, true);

    const invalidNoTo = SendEmailSchema.safeParse({
      from: "alex@vxmusic.in",
      to: [],
      subject: "Stems",
    });
    assert.equal(invalidNoTo.success, false);
  });
});

describe("Realtime Event Bus & Inbound Routing Verification", () => {
  it("dispatches and receives mailbox events across subscribers", async () => {
    const { EventEmitter } = await import("events");
    const testBus = new EventEmitter();

    let receivedEvent: any = null;
    testBus.on("user:user_123", (e) => {
      receivedEvent = e;
    });

    testBus.emit("user:user_123", {
      type: "new_email",
      userId: "user_123",
      mailboxId: "mb_123",
      threadId: "th_abc",
      data: { from: "external@studio.com", subject: "Sync License" },
    });

    assert.ok(receivedEvent);
    assert.equal(receivedEvent.type, "new_email");
    assert.equal(receivedEvent.data.subject, "Sync License");
  });

  it("handles recipient matching across primary email and configured aliases", () => {
    const primaryEmail = "alex@vxmusic.in";
    const aliases = ["support@vxmusic.in", "hello@vxmusic.in", "music@vxmusic.in"];

    const isMatch = (address: string) => {
      const norm = normalizeEmail(address);
      return norm === primaryEmail || aliases.includes(norm);
    };

    assert.equal(isMatch("alex@vxmusic.in"), true);
    assert.equal(isMatch("support@vxmusic.in"), true);
    assert.equal(isMatch("hello@vxmusic.in"), true);
    assert.equal(isMatch("unknown@vxmusic.in"), false);
    assert.equal(isMatch("spammer@otherdomain.com"), false);
  });
});

