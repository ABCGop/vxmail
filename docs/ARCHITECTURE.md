# VxMail System Architecture & Design Specification

## Overview

**VxMail** is a modern, production-oriented email service operating within the **VxMusic** ecosystem (`vxmusic.in`). It combines a fast, dark-first Gmail-style web application with a dedicated, mature self-hosted mail server infrastructure (**Stalwart Mail Server**) to offer enterprise-grade email delivery, encryption, and mailbox management.

```
                              Internet / External Mail
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ DNS / Cloudflare (MX, SPF,│
                        │    DKIM, DMARC, PTR)      │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
               ┌─────────────────────────────────────────────┐
               │    Dedicated VPS: Stalwart Mail Server      │
               │   - Inbound SMTP (25)                       │
               │   - Outbound Submission (587 STARTTLS)      │
               │   - IMAP4/JMAP (993/8080)                   │
               │   - DKIM Engine (rsa-sha256: vxmail2026)    │
               │   - Spam & Antivirus Filters                │
               └──────────────┬──────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌───────────────────┐                   ┌───────────────────┐
│ PostgreSQL 16     │                   │ MinIO / S3        │
│ - Mailbox store   │                   │ - Attachment      │
│ - Normalized DB   │                   │   binary blobs    │
└─────────▲─────────┘                   └─────────▲─────────┘
          │                                       │
          │             ┌───────────────────┐     │
          ├─────────────┤ Redis 7 / BullMQ  ├─────┤
          │             │ - Background jobs │     │
          │             │ - Event stream    │     │
          │             └─────────▲─────────┘     │
          │                       │               │
          ▼                       ▼               ▼
┌───────────────────────────────────────────────────────────┐
│     VxMail Background Worker (/apps/worker)               │
│ - email-send: dispatches to Stalwart SMTP & tracks events  │
│ - email-receive: parses incoming MIME & thread grouping   │
│ - attachment-processing: S3 sync & MIME verification       │
│ - notification: real-time updates via SSE                 │
└─────────────────────────▲─────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│     VxMail Web Application (/apps/web)                    │
│ - Next.js 14 App Router, TypeScript, React 18             │
│ - Tailwind CSS, VxMusic Dark Brand Aesthetics             │
│ - Realtime SSE streams & Gmail-style conversation views   │
│ - Zero-trust HTML email sanitizer (anti-XSS/anti-tracking)│
└───────────────────────────────────────────────────────────┘
```

---

## Component Distribution

| Component | Host Environment | Primary Function |
| :--- | :--- | :--- |
| **Web Frontend & API** | Vercel or Containerized VPS | Next.js 14 web app, REST API routes, Server-Sent Events stream, user authentication, HTML sanitization. |
| **Background Worker** | Dedicated VPS | BullMQ worker executing outbound SMTP dispatch, attachment scanning, fulltext index updates, cleanup jobs. |
| **Mail Server** | Dedicated Linux VPS | Stalwart Mail Server (v0.8.x) handling raw SMTP (port 25), Submission (port 587), IMAP, DKIM signing, and TLS 1.3 termination. |
| **Relational Database** | Managed PostgreSQL 16 | ACID-compliant storage for users, mailboxes, threads, messages, delivery events, audit logs, and settings. |
| **Cache & Queue Broker** | Redis 7 | BullMQ message broker, login lockout counters, session state. |
| **Blob Storage** | S3 / MinIO | Encrypted object storage for email attachments (up to 25 MB per file). |
| **DNS Management** | Cloudflare / Authoritative DNS | MX routing, SPF TXT records, DKIM public key selectors, DMARC policies, PTR reverse DNS. |

---

## Conversation & Threading Engine

Rather than displaying isolated email messages, VxMail groups communications into **conversations**:
- Every message carries an **RFC 5322 compliant Message-ID** (`<timestamp.random.pid@vxmusic.in>`).
- Replies reference earlier messages via `In-Reply-To` and `References` headers.
- Threads store cached metadata (`unreadCount`, `lastMessageAt`, `snippet`, `isStarred`, `labels`) to ensure lightning-fast inbox pagination and infinite scrolling without querying all child messages.

---

## Security Model

1. **Strict Zero-Trust HTML Sanitization**: Untrusted HTML received from outside senders is stripped of `<script>`, `<iframe>`, forms, and inline event handlers using `sanitize-html`.
2. **Spy Pixel & Image Protection**: External remote HTTP/HTTPS image requests are replaced with privacy placeholders by default, preventing senders from fingerprinting user IP addresses or tracking email open rates.
3. **Sender Address Authorization**: Users can only send mail from their registered primary address or verified aliases. Outbound sender spoofing is prevented at the API layer.
4. **Brute Force & Lockout**: Failed login attempts are recorded by IP and username. 5 consecutive failures trigger an automatic 15-minute lockout.
5. **No Passwords in Plaintext**: All passwords hashed using `bcrypt` with salt rounds &ge; 10.
