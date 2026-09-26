# Stalwart Mail Server Integration & Operations

## Overview

VxMail utilizes **Stalwart Mail Server** (v0.8.x+) as its underlying enterprise mail transfer agent (MTA) and mail delivery agent (MDA). Stalwart is implemented in Rust, providing memory safety, high throughput, and native support for JMAP (RFC 8620), IMAP4rev2, and SMTP submission with modern cryptographic signing.

---

## 1. Directory & Storage Integration

Stalwart is configured to use the shared PostgreSQL instance for directory lookups and mailbox state:

```toml
[directory.sql]
type = "sql"
driver = "postgresql"
address = "postgres:5432"
database = "vxmail"
user = "vxmail"
secret = "vxmail_secret_2026"
```

Message contents and attachments are streamed to S3-compatible object storage (MinIO in local development, AWS S3 or Cloudflare R2 in production):

```toml
[store.blob]
type = "s3"
endpoint = "http://minio:9000"
bucket = "vxmail-attachments"
access-key = "vxmail_s3_admin"
secret-key = "vxmail_s3_supersecret_key"
```

---

## 2. Inbound Mail Flow

1. External MTA connects to `mail.vxmusic.in:25`.
2. Stalwart evaluates reverse DNS, SPF, and DMARC alignment.
3. Anti-abuse filters inspect message rate and connection concurrency.
4. Message is written to S3 object storage; recipient mailbox metadata is saved to PostgreSQL.
5. Stalwart emits a delivery notification webhook to `/api/mail/webhook` or places an event onto the Redis `email-receive` queue.
6. The VxMail Background Worker processes the event, creates a thread record (or appends to an existing conversation), and broadcasts an SSE notification to the recipient's web browser.

---

## 3. Outbound Mail Flow

1. Browser issues authenticated `POST /api/mail/send`.
2. API validates sender address ownership against the user's primary address and active aliases.
3. Message record is created in PostgreSQL with status `QUEUED`.
4. Job is dispatched to BullMQ queue `email-send`.
5. Background worker connects to Stalwart on port 587 via STARTTLS and authenticates with system credentials.
6. Stalwart signs the message with DKIM selector `vxmail2026` using RSA 2048-bit key.
7. Stalwart queries DNS for the recipient domain's MX records and attempts direct SMTP delivery.
8. Stalwart writes the SMTP response (e.g. `250 2.0.0 OK: queued as ...`) to PostgreSQL `EmailEvent` and updates message status to `SENT`.

---

## 4. DKIM Key Generation & Rotation

To generate a new DKIM key pair on the mail server VPS:

```bash
# Generate 2048-bit private key
openssl genrsa -out /opt/stalwart-mail/etc/dkim/vxmail2026.private.key 2048

# Extract public key for DNS TXT record
openssl rsa -in /opt/stalwart-mail/etc/dkim/vxmail2026.private.key -pubout -outform PEM

# Set permissions
chmod 600 /opt/stalwart-mail/etc/dkim/vxmail2026.private.key
chown stalwart:stalwart /opt/stalwart-mail/etc/dkim/vxmail2026.private.key
```

Update `/infrastructure/stalwart/config.toml` selector to the active year/rotation code.

---

## 5. Administration & Monitoring

Stalwart exposes a management interface and Prometheus metrics on port `8080`:

- Web Admin Console: `http://mail.vxmusic.in:8080/admin`
- Metrics: `http://mail.vxmusic.in:8080/metrics`
- Health check: `http://mail.vxmusic.in:8080/health`
