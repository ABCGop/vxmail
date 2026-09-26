# VxMail — Full Gmail-Style Email Platform

**VxMail** is a modern, production-oriented email service operated under the **VxMusic** ecosystem (`vxmusic.in`). It delivers a polished, dark-first Gmail-style email interface backed by a dedicated self-hosted mail server infrastructure (**Stalwart Mail Server**), PostgreSQL, Prisma ORM, Redis, BullMQ background queues, and S3-compatible object storage.

---

## Features

- **Sleek VxMusic Aesthetics**: Dark-first obsidian aesthetic with subtle glass accents, glowing indicators, responsive design, and smooth transitions.
- **Gmail-Style Conversation Threading**: Multi-turn message grouping with RFC 5322 Message-ID, `In-Reply-To`, and `References` tracking.
- **Dockable Floating Compose**: Gmail-style floating composer with minimize, expand, contact autocomplete, rich formatting, and debounced draft autosave.
- **Mailbox Identities & Aliases**: Support for primary mailboxes (e.g. `alex@vxmusic.in`) and aliases (e.g. `support@vxmusic.in`, `hello@vxmusic.in`).
- **Comprehensive Mailbox Folders**: Inbox, Starred, Sent, Drafts, Important, Spam, Trash, and custom color-coded labels.
- **Gmail Search Engine**: Parse advanced queries like `from:user@domain`, `to:...`, `has:attachment`, `is:unread`, `subject:"mix review"`.
- **Zero-Trust Security**: Multi-tier HTML email sanitization, external image blocking for privacy, brute-force lockout, and CSRF/XSS protection.
- **Realtime Notifications**: Server-Sent Events (SSE) stream for live message arrival and notifications.
- **Admin Dashboard**: System metrics, mailboxes, BullMQ queue monitor, delivery events, and security logs.
- **Keyboard Shortcuts**: `c` (compose), `r` (reply), `e` (archive), `s` (star), `u` (unread), `#` (trash), `/` (search), `?` (cheat sheet).

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Generate Prisma Client
```bash
npm run db:migrate
npm run db:seed
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts (Local Development)

The seed script (`npm run db:seed`) creates realistic demo accounts and sample threads:

| Account | Email Address | Password | Role |
| :--- | :--- | :--- | :--- |
| **Alex Rivera** | `alex@vxmusic.in` (aliases: `support@`, `hello@`) | `password123` | `USER` |
| **System Admin** | `admin@vxmusic.in` | `adminpassword123` | `SUPER_ADMIN` |
| **Sarah Chen** | `sarah@vxmusic.in` | `password123` | `USER` |

---

## Production Deployment with Docker Compose

To run the complete production stack (PostgreSQL 16, Redis 7, Stalwart Mail Server, MinIO, Web, and Worker):

```bash
docker compose up -d --build
```

### Services Port Map:
- **Web Interface**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Stalwart SMTP**: `localhost:25` (Inbound) / `localhost:587` (Submission STARTTLS)
- **Stalwart IMAPS**: `localhost:993`
- **Stalwart Admin Console**: `http://localhost:8080`
- **MinIO S3 Console**: `http://localhost:9001`

---

## Project Structure

```
/
├── apps/
│   ├── web/            # Next.js 14 web application & API layer
│   └── worker/         # BullMQ queue worker for background email jobs
├── packages/
│   ├── database/       # Prisma schema, client, migrations & repository
│   ├── email/          # RFC MIME utilities, sanitizer, search parser, transports
│   └── config/         # Shared configuration, limits, and Zod schemas
├── infrastructure/
│   ├── stalwart/       # Stalwart Mail Server configuration
│   ├── redis/          # Redis config
│   ├── postgres/       # PostgreSQL init scripts
│   └── docker-compose.yml
├── docs/
│   ├── ARCHITECTURE.md # System architecture & design specification
│   ├── DNS_SETUP.md    # Exact instructions for MX, SPF, DKIM, DMARC, PTR
│   ├── MAIL_SERVER.md  # Stalwart Mail Server operations guide
│   ├── SECURITY.md     # Security architecture & threat model
│   ├── DEPLOYMENT.md   # VPS, Vercel & Docker deployment guide
│   ├── BACKUPS.md      # Backup & disaster recovery procedures
│   └── ABUSE_PREVENTION.md # Sending limits & spam prevention
├── docker-compose.yml  # Root Docker Compose
└── package.json
```

---

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [DNS & Authentication Setup (MX, SPF, DKIM, DMARC)](docs/DNS_SETUP.md)
- [Stalwart Mail Server Guide](docs/MAIL_SERVER.md)
- [Security Model & Threat Prevention](docs/SECURITY.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [Backup & Disaster Recovery](docs/BACKUPS.md)
- [Anti-Abuse & Rate Limits](docs/ABUSE_PREVENTION.md)

---

## Environment Notice

> [!NOTE]
> This application is currently operating in **DEVELOPMENT MODE** until public DNS records (MX, SPF, DKIM selector `vxmail2026`, DMARC, and PTR) are configured on `vxmusic.in`.
