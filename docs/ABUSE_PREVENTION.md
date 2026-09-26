# VxMail Anti-Abuse & Deliverability Protection System

## 1. Outbound Sending Limits

To prevent newly compromised or spammer accounts from ruining the IP reputation of `mail.vxmusic.in`, VxMail enforces strict tier-based sending limits:

| Account Tier | Max Emails / Hour | Max Emails / Day | Max Recipients / Email | Max Attachment Size |
| :--- | :--- | :--- | :--- | :--- |
| **New Accounts (&lt; 7 Days)** | 25 | 100 | 10 | 10 MB |
| **Verified Accounts** | 100 | 500 | 50 | 25 MB |
| **VIP / Artist Accounts** | 300 | 1,500 | 100 | 25 MB |
| **Admin / Support Accounts** | 1,000 | 5,000 | 200 | 25 MB |

Any attempt to exceed these thresholds causes `POST /api/mail/send` to reject with HTTP 429 (`Rate limit exceeded`).

---

## 2. Signup & Account Creation Throttling

To mitigate automated bot account generation:
1. **IP Throttling**: Maximum 3 account signups per IP address per hour.
2. **Username Verification**: Usernames must be 3–30 lowercase alphanumeric characters (`[a-z0-9._-]`).
3. **Disposable Domain Blocking**: Blacklist matches against known disposable email providers for backup email addresses.
4. **Initial Quarantine**: Accounts created via public signup start in standard tier with outbound rate limits strictly monitored.

---

## 3. Account Moderation & Administrative Suspension

Admins can manage and suspend accounts directly from the Admin Dashboard (`/admin`):
- **Suspension Action**: Instantly revokes all active JWT sessions and sets `User.status = "SUSPENDED"`.
- **Mailbox Lockdown**: Stalwart rejects both inbound delivery and outbound submission for suspended mailboxes.
- **Audit Logging**: Any administrative change (storage quota increase, suspension, deletion) creates an immutable `AuditLog` entry with the acting admin's ID, timestamp, and client IP.

---

## 4. Inbound Spam & Malware Defense

1. **Reputation Filtering**: Inbound connections are checked against Spamhaus ZEN and Barracuda DNSBL.
2. **SPF / DKIM / DMARC Verification**: Inbound messages from senders that fail SPF or DKIM are flagged with warning banners or quarantined.
3. **Attachment Stripping**: Executable files (`.exe`, `.scr`, `.bat`, `.cmd`, `.vbs`, `.ps1`) are discarded at the gateway.
