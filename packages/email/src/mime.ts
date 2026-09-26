import { APP_CONFIG } from "@vxmail/config";

/**
 * Generates an RFC 5322 compliant Message-ID header.
 * Format: <unique-timestamp-random@domain>
 */
export function generateMessageId(domain: string = APP_CONFIG.domain): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const pid = Math.floor(Math.random() * 10000).toString(36);
  return `<${timestamp}.${randomPart}.${pid}@${domain}>`;
}

/**
 * Formats a reply subject (avoids stacking Re: Re: Re:)
 */
export function formatReplySubject(originalSubject: string): string {
  const trimmed = originalSubject.trim();
  if (/^re:\s*/i.test(trimmed)) {
    return trimmed;
  }
  return `Re: ${trimmed}`;
}

/**
 * Formats a forward subject (avoids stacking Fwd: Fwd:)
 */
export function formatForwardSubject(originalSubject: string): string {
  const trimmed = originalSubject.trim();
  if (/^fwd:\s*/i.test(trimmed)) {
    return trimmed;
  }
  return `Fwd: ${trimmed}`;
}

/**
 * Builds the References header chain for proper email threading.
 */
export function buildReferencesHeader(existingReferences?: string, inReplyToMessageId?: string): string {
  const refs: string[] = [];
  if (existingReferences) {
    const split = existingReferences.trim().split(/\s+/);
    refs.push(...split);
  }
  if (inReplyToMessageId && !refs.includes(inReplyToMessageId)) {
    refs.push(inReplyToMessageId);
  }
  return refs.join(" ");
}

/**
 * Validates file extension against blocked hazardous extensions.
 */
export function isSafeAttachmentExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  for (const ext of APP_CONFIG.blockedExtensions) {
    if (lower.endsWith(ext)) {
      return false;
    }
  }
  return true;
}

export interface ParsedMimeMessage {
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  text?: string;
  html?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  attachments: Array<{ filename: string; contentType: string; size: number }>;
}

/**
 * Parses raw RFC 5322 MIME messages into structured email components.
 */
export async function parseRawMimeMessage(rawMime: string): Promise<ParsedMimeMessage> {
  const lines = rawMime.split(/\r?\n/);
  const headers: Record<string, string> = {};
  let currentHeader = "";
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "") {
      bodyStartIndex = i + 1;
      break;
    }
    if (/^\s+/.test(line) && currentHeader) {
      headers[currentHeader] += " " + line.trim();
    } else {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        currentHeader = line.substring(0, colonIdx).toLowerCase().trim();
        headers[currentHeader] = line.substring(colonIdx + 1).trim();
      }
    }
  }

  const rawBody = lines.slice(bodyStartIndex).join("\n");
  const parseAddressList = (str?: string) => {
    if (!str) return [];
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  };

  return {
    from: headers["from"] || "unknown@external.com",
    to: parseAddressList(headers["to"]),
    cc: parseAddressList(headers["cc"]),
    subject: headers["subject"] || "(no subject)",
    messageId: headers["message-id"] || generateMessageId(),
    inReplyTo: headers["in-reply-to"],
    references: headers["references"],
    text: rawBody,
    html: `<p>${rawBody.replace(/\n/g, "<br/>")}</p>`,
    attachments: [],
  };
}

