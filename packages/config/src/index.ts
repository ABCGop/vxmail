import { z } from "zod";

export const APP_CONFIG = {
  name: "VxMail",
  domain: "vxmusic.in",
  mailDomain: "vxmusic.in",
  mailSubdomain: "mail.vxmusic.in",
  supportEmail: "support@vxmusic.in",
  helloEmail: "hello@vxmusic.in",
  ecosystem: "VxMusic",
  environment: (process.env.NODE_ENV || "development") as "development" | "production" | "test",
  isProductionReadyEmail: false, // Label clearly as DEVELOPMENT until full MX/SPF/DKIM/DMARC verified
  
  limits: {
    maxRecipients: 50,
    maxAttachmentSizeBytes: 25 * 1024 * 1024, // 25 MB
    defaultStorageQuotaBytes: 15 * 1024 * 1024 * 1024, // 15 GB
    draftAutosaveDebounceMs: 1500,
    rateLimitSendPerHour: 100,
    rateLimitSendPerHourAdmin: 1000,
    rateLimitLoginAttempts: 5,
    loginLockoutDurationSec: 900, // 15 mins
    rateLimitSignupPerIpPerHour: 3,
  },
  
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-tar",
    "application/gzip",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "video/mp4",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  
  blockedExtensions: [
    ".exe", ".bat", ".cmd", ".sh", ".com", ".vbs", ".scr", ".pif", ".msi", ".jar", ".ps1"
  ]
} as const;

export type UserRole = "USER" | "SUPPORT" | "ADMIN" | "SUPER_ADMIN";
export type MailboxStatus = "ACTIVE" | "SUSPENDED" | "LOCKED";
export type DeliveryStatus = "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "BOUNCED" | "REJECTED" | "FAILED";

/**
 * Normalizes email address safely.
 * Trims, converts to lowercase, handles basic subaddressing if needed.
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2) return trimmed;
  
  const [localPart, domainPart] = parts;
  // For vxmusic.in or standard domains, clean up whitespace and ensure domain is normalized
  return `${localPart}@${domainPart}`;
}

/**
 * Validates whether an email belongs to vxmusic.in
 */
export function isVxMusicEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.endsWith(`@${APP_CONFIG.domain}`);
}

/**
 * Zod Schemas
 */
export const SignUpSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/, {
    message: "Username may only contain lowercase letters, numbers, dots, dashes, and underscores",
  }),
  displayName: z.string().min(2).max(60),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(128),
  backupEmail: z.string().email().optional(),
});

export const LoginSchema = z.object({
  identifier: z.string().min(3), // username or full email
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const SendEmailSchema = z.object({
  from: z.string().email(),
  to: z.array(z.string().email()).min(1, "At least one recipient is required"),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
  subject: z.string().max(998, "Subject cannot exceed 998 characters").default(""),
  textBody: z.string().optional().default(""),
  htmlBody: z.string().optional().default(""),
  threadId: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
  attachments: z.array(
    z.object({
      id: z.string().optional(),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number().max(APP_CONFIG.limits.maxAttachmentSizeBytes),
      storageKey: z.string().optional(),
      contentBase64: z.string().optional(),
    })
  ).optional().default([]),
});

export const DraftSaveSchema = z.object({
  id: z.string().optional(),
  threadId: z.string().optional(),
  to: z.array(z.string()).optional().default([]),
  cc: z.array(z.string()).optional().default([]),
  bcc: z.array(z.string()).optional().default([]),
  subject: z.string().optional().default(""),
  body: z.string().optional().default(""),
  attachments: z.array(z.any()).optional().default([]),
});

export const SearchQuerySchema = z.object({
  q: z.string().default(""),
  folder: z.enum(["inbox", "starred", "sent", "drafts", "trash", "spam", "important", "all"]).default("inbox"),
  label: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(30),
});

export const SettingsUpdateSchema = z.object({
  theme: z.enum(["dark", "slate", "neon", "light"]).optional(),
  density: z.enum(["comfortable", "compact"]).optional(),
  signature: z.string().max(2000).optional(),
  replyBehavior: z.enum(["reply", "reply_all"]).optional(),
  conversationView: z.boolean().optional(),
  blockExternalImages: z.boolean().optional(),
  desktopNotifications: z.boolean().optional(),
  displayName: z.string().min(2).max(60).optional(),
});

export const CreateAliasSchema = z.object({
  aliasAddress: z.string().email().refine((val) => val.endsWith(`@${APP_CONFIG.domain}`), {
    message: `Alias must end with @${APP_CONFIG.domain}`,
  }),
});

export const CreateLabelSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color code"),
});
