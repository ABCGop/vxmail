# VxMail Production Deployment Guide

## Architecture Overview

```
                      [Cloudflare Authoritative DNS]
                       (MX, SPF, DKIM, DMARC, A, PTR)
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
   [Web & API Layer]                               [Mail Infrastructure]
   Host: Vercel or VPS Docker                      Host: Dedicated VPS (Ubuntu 24.04)
   - apps/web (Next.js 14)                         - Stalwart Mail Server (Rust)
   - apps/worker (BullMQ)                          - Ports: 25, 587, 465, 993, 8080
             │                                               │
             └───────────────────────┬───────────────────────┘
                                     │
                   ┌─────────────────┴─────────────────┐
                   ▼                                   ▼
        [Managed PostgreSQL 16]                [S3 / MinIO Storage]
        Host: Supabase / Neon / AWS RDS        Host: Cloudflare R2 / AWS S3
```

---

## Phase 1: Dedicated Mail Server Setup (VPS)

1. **Provision VPS**:
   - Recommended: Hetzner Cloud CPX21 or DigitalOcean Standard (2 vCPU, 4GB RAM).
   - OS: Ubuntu 24.04 LTS.
   - Assign a static public IPv4 address.
   - Contact VPS support to verify that **Outbound Port 25 is unblocked**.

2. **Configure Hostname & Reverse DNS**:
   ```bash
   hostnamectl set-hostname mail.vxmusic.in
   ```
   In your VPS hosting console, set the **PTR Record** for your IPv4 address to `mail.vxmusic.in`.

3. **Install Docker & Docker Compose**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   usermod -aG docker ubuntu
   ```

4. **Deploy Stalwart**:
   Clone the repository to `/opt/vxmail` and start the mail server:
   ```bash
   cd /opt/vxmail
   docker compose up -d postgres redis minio stalwart
   ```

---

## Phase 2: DNS Records Configuration

Follow [DNS_SETUP.md](./DNS_SETUP.md) to add:
- `mail.vxmusic.in` A record pointing to VPS IP (Grey Cloud).
- `vxmusic.in` MX record pointing to `mail.vxmusic.in` (Priority 10).
- SPF TXT record: `v=spf1 mx ip4:<VPS_IP> -all`.
- DKIM TXT record: `vxmail2026._domainkey.vxmusic.in`.
- DMARC TXT record: `_dmarc.vxmusic.in`.

---

## Phase 3: Database & Web Application Deployment

### Option A: Deploying Web App on Vercel
1. Import repository into Vercel.
2. Set Environment Variables:
   - `DATABASE_URL`: Connection string to PostgreSQL instance (e.g. Supabase or Neon).
   - `REDIS_URL`: Redis connection string (e.g. Upstash or self-hosted Redis).
   - `NEXTAUTH_SECRET`: Random 64-character secret.
   - `SMTP_HOST`: `mail.vxmusic.in`.
   - `SMTP_PORT`: `587`.
   - `SMTP_USERNAME`: Stalwart submission user.
   - `SMTP_PASSWORD`: Secure password.
   - `S3_ENDPOINT`: S3 endpoint URL.
   - `S3_BUCKET`: `vxmail-attachments`.
   - `NODE_ENV`: `production`.
3. Build Command: `npm --workspace=@vxmail/database run generate && npm --workspace=@vxmail/web run build`.

### Option B: Deploying Full Stack via Docker Compose
Run on your server:
```bash
docker compose -f docker-compose.yml up -d --build
```

---

## Phase 4: Database Migrations & Initial Admin Setup

Run Prisma migrations against the production database:
```bash
npm run db:migrate
```

To create the initial admin user and seed demo accounts:
```bash
npm run db:seed
```

Default credentials created:
- **Admin**: `admin@vxmusic.in` / `adminpassword123`
- **Demo User**: `alex@vxmusic.in` / `password123`
*(Change passwords immediately in production via Settings).*
