# VxMail Security Specification & Threat Model

## 1. Authentication & Session Management

- **Password Hashing**: Passwords are never stored in plaintext. VxMail utilizes `bcrypt` with dynamic salt generation (minimum 10 rounds).
- **Session Tokens**: JWT tokens signed with HMAC-SHA256 (`HS256`) using high-entropy secrets (&ge; 32 bytes).
- **Cookie Security**:
  - `HttpOnly`: Inaccessible to client-side JavaScript, preventing token theft via XSS.
  - `Secure`: Transmitted strictly over HTTPS in production.
  - `SameSite=Lax`: Mitigates Cross-Site Request Forgery (CSRF).
- **Login Throttling & Lockout**: Failed attempts are recorded in `LoginAttempt`. If an IP or identifier accumulates 5 failures in 15 minutes, authentication requests are rejected with HTTP 429.

---

## 2. Object-Level Access Control (BOLA / IDOR Prevention)

> [!IMPORTANT]
> **Strict Mailbox Ownership Invariant**:
> Every query accessing messages, threads, drafts, labels, or attachments **must verify that the target mailbox belongs to the authenticated user**.

Example implementation in `MailRepository`:
```typescript
static async verifyMailboxOwnership(userId: string, mailboxId: string) {
  const mailbox = await prisma.mailbox.findFirst({
    where: { id: mailboxId, userId },
  });
  if (!mailbox) {
    throw new Error("Mailbox not found or unauthorized access");
  }
  return mailbox;
}
```
Attempting `GET /api/mail/threads/123` with a foreign thread ID yields `HTTP 404/403` and logs a security event.

---

## 3. Email Content Sanitization & Privacy

Email rendering is one of the highest-risk attack surfaces in web development. VxMail enforces strict multi-layered isolation:

1. **Tag Stripping**: `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<button>`, `<link>` tags are stripped via `sanitize-html`.
2. **Event Handler Neutralization**: Attributes starting with `on*` (`onclick`, `onload`, `onerror`) are completely removed.
3. **Safe Link Schemes**: Only `http:`, `https:`, `mailto:`, and `tel:` URIs are permitted. Any `javascript:` or `vbscript:` schemes are neutralized.
4. **Target & Rel Attributes**: All external links are rewritten with `target="_blank" rel="noopener noreferrer nofollow"`.
5. **External Image Blocking (Anti-Tracking)**:
   Remote HTTP/HTTPS image requests are replaced with privacy SVG placeholders by default. This prevents senders from recording open times, geographic location, or user IP addresses. Users can explicitly click "Show remote images" to reveal external media.

---

## 4. Attachment Security

- **Extension Blacklist**: Executable and script extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.vbs`, `.ps1`, `.scr`, `.msi`) are strictly blocked.
- **MIME Verification**: Client-provided MIME types are validated against magic number byte signatures before persisting to S3.
- **Size Limit**: Enforced maximum of 25 MB per attachment and 50 MB total per outgoing message.
- **Storage Isolation**: Attachments are stored as unexecutable blobs in S3 with unique UUID storage keys, preventing directory traversal.

---

## 5. Network & HTTP Security Headers

Next.js is configured with strict security response headers:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:;
```
