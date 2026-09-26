import { APP_CONFIG, DeliveryStatus } from "@vxmail/config";
import { generateMessageId } from "./mime";

export interface OutboundMailAttachment {
  filename: string;
  contentType: string;
  contentBase64?: string;
  size: number;
}

export interface OutboundMailMessage {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  messageId?: string;
  attachments?: OutboundMailAttachment[];
}

export interface MailDeliveryReceipt {
  messageId: string;
  status: DeliveryStatus;
  smtpResponse?: string;
  acceptedRecipients: string[];
  rejectedRecipients: string[];
  queuedAt: Date;
  dispatchedAt?: Date;
  server: string;
  isMock: boolean;
}

export interface IMailTransport {
  name: string;
  sendMail(message: OutboundMailMessage): Promise<MailDeliveryReceipt>;
  verifyConnection(): Promise<{ ok: boolean; message: string }>;
}

/**
 * In-memory development mail transport for local development and test suites.
 * Never leaks external emails, keeps track of sent messages.
 */
export class DevelopmentMailTransport implements IMailTransport {
  public name = "DevelopmentMailTransport";
  public sentMessages: Array<{ message: OutboundMailMessage; receipt: MailDeliveryReceipt }> = [];

  async verifyConnection(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: "Development mail sandbox active (safe local mode)." };
  }

  async sendMail(message: OutboundMailMessage): Promise<MailDeliveryReceipt> {
    const messageId = message.messageId || generateMessageId();
    const receipt: MailDeliveryReceipt = {
      messageId,
      status: "SENT",
      smtpResponse: "250 2.0.0 OK (Sandbox Mock Dispatch)",
      acceptedRecipients: [...message.to, ...(message.cc || [])],
      rejectedRecipients: [],
      queuedAt: new Date(),
      dispatchedAt: new Date(),
      server: "sandbox.vxmusic.local",
      isMock: true,
    };

    this.sentMessages.push({ message, receipt });
    console.log(`[VxMail Dev Transport] Captured email to ${message.to.join(", ")} | Subject: "${message.subject}" | Message-ID: ${messageId}`);
    return receipt;
  }

  clear() {
    this.sentMessages = [];
  }
}

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Production Stalwart / SMTP Mail Server Transport.
 * Connects via SMTP with TLS and credentials to Stalwart Mail Server or Relay.
 */
export class StalwartMailTransport implements IMailTransport {
  public name = "StalwartMailTransport";
  private host: string;
  private port: number;
  private username?: string;
  private password?: string;
  private useTls: boolean;
  private transporter: Transporter | null = null;

  constructor(config?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    useTls?: boolean;
  }) {
    this.host = config?.host || process.env.SMTP_HOST || "mail.vxmusic.in";
    this.port = config?.port || Number(process.env.SMTP_PORT || 587);
    this.username = config?.username || process.env.SMTP_USERNAME || process.env.SMTP_USER;
    this.password = config?.password || process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    this.useTls = config?.useTls ?? (this.port === 465);
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.useTls,
        auth: (this.username && this.password) ? {
          user: this.username,
          pass: this.password,
        } : undefined,
        tls: {
          rejectUnauthorized: false, // Allow self-signed TLS inside internal Docker network
        },
      });
    }
    return this.transporter;
  }

  async verifyConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return {
        ok: true,
        message: `SMTP connection verified at ${this.host}:${this.port}`,
      };
    } catch (err: any) {
      return { ok: false, message: `SMTP verification failed: ${err.message}` };
    }
  }

  async sendMail(message: OutboundMailMessage): Promise<MailDeliveryReceipt> {
    const messageId = message.messageId || generateMessageId();
    const cleanId = messageId.replace(/^<|>$/g, "");

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: message.from,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc,
        subject: message.subject,
        text: message.text,
        html: message.html,
        messageId: `<${cleanId}>`,
        inReplyTo: message.inReplyTo,
        references: message.references,
        replyTo: message.replyTo,
        attachments: message.attachments?.map((att) => ({
          filename: att.filename,
          contentType: att.contentType,
          content: att.contentBase64 ? Buffer.from(att.contentBase64, "base64") : undefined,
        })),
      });

      console.log(`[VxMail SMTP Dispatch] Sent email to ${message.to.join(", ")} via ${this.host}:${this.port}. Info: ${info.response}`);

      return {
        messageId: `<${cleanId}>`,
        status: "SENT",
        smtpResponse: info.response || "250 OK Message accepted for delivery",
        acceptedRecipients: (info.accepted as string[]) || message.to,
        rejectedRecipients: (info.rejected as string[]) || [],
        queuedAt: new Date(),
        dispatchedAt: new Date(),
        server: this.host,
        isMock: false,
      };
    } catch (err: any) {
      console.error(`[VxMail SMTP Dispatch Error] Failed to send via ${this.host}:${this.port}:`, err.message);

      return {
        messageId: `<${cleanId}>`,
        status: "FAILED",
        smtpResponse: `SMTP Error: ${err.message}`,
        acceptedRecipients: [],
        rejectedRecipients: message.to,
        queuedAt: new Date(),
        server: this.host,
        isMock: false,
      };
    }
  }
}

// Singleton instances
export const devTransportInstance = new DevelopmentMailTransport();
export const stalwartTransportInstance = new StalwartMailTransport();

export function getMailTransport(): IMailTransport {
  // If SMTP_HOST is explicitly configured, use Stalwart/SMTP transport
  if (process.env.SMTP_HOST && process.env.SMTP_HOST !== "sandbox") {
    return stalwartTransportInstance;
  }
  return devTransportInstance;
}
