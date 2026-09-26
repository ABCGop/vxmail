# VxMail DNS & Mail Authentication Configuration Guide

## Domain: `vxmusic.in` | Mail Host: `mail.vxmusic.in`

This guide specifies the authoritative DNS records required to achieve 10/10 mail deliverability and pass SPF, DKIM, and DMARC alignment checks across major email providers (Gmail, Microsoft 365, Apple iCloud Mail).

> [!IMPORTANT]
> **CRITICAL CLOUDFLARE PROXY RULE**:
> Never enable Cloudflare HTTP Proxy (the orange cloud) on `mail.vxmusic.in`. SMTP, submission, and IMAP protocols cannot pass through Cloudflare's HTTP/HTTPS reverse proxy. `mail.vxmusic.in` must be set to **DNS Only** (Grey Cloud).

---

## 1. Host (A / AAAA) Record

Point the mail server subdomain directly to your dedicated VPS static IP address:

| Type | Name | Content / Value | TTL | Proxy Status |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `mail` | `<YOUR_VPS_PUBLIC_IPV4>` (e.g. `198.51.100.25`) | Auto / 300 | **DNS only (Grey)** |
| **AAAA** (optional) | `mail` | `<YOUR_VPS_PUBLIC_IPV6>` | Auto / 300 | **DNS only (Grey)** |

---

## 2. Mail Exchange (MX) Record

Direct inbound emails for `@vxmusic.in` to the Stalwart mail server:

| Type | Name | Mail Server | Priority | TTL |
| :--- | :--- | :--- | :--- | :--- |
| **MX** | `@` (or `vxmusic.in`) | `mail.vxmusic.in` | `10` | Auto / 300 |

---

## 3. Sender Policy Framework (SPF) Record

Authorize your mail server VPS to dispatch email on behalf of `vxmusic.in`:

| Type | Name | Content | TTL |
| :--- | :--- | :--- | :--- |
| **TXT** | `@` | `v=spf1 mx ip4:<YOUR_VPS_PUBLIC_IPV4> -all` | Auto |

- `v=spf1`: Identifies the record as SPF version 1.
- `mx`: Authorizes the IP address specified in your MX record (`mail.vxmusic.in`).
- `ip4:<YOUR_VPS_PUBLIC_IPV4>`: Explicitly whitelists the static public IPv4 of the VPS.
- `-all`: Strict rejection of any unauthorized servers attempting to send mail from `@vxmusic.in`.

---

## 4. DomainKeys Identified Mail (DKIM) Record

Stalwart generates a 2048-bit RSA key pair during initial setup with selector `vxmail2026`:

| Type | Name | Content | TTL |
| :--- | :--- | :--- | :--- |
| **TXT** | `vxmail2026._domainkey` | `v=DKIM1; k=rsa; p=<PUBLIC_KEY_BASE64_DATA>` | Auto |

To view the public key on the Stalwart VPS:
```bash
stalwart-mail-server --config=/opt/stalwart-mail/etc/config.toml dkim print-key --selector=vxmail2026
```

---

## 5. Domain-based Message Authentication (DMARC) Record

Deploy DMARC policy. In early deployment, monitor delivery with `p=quarantine`:

| Type | Name | Content | TTL |
| :--- | :--- | :--- | :--- |
| **TXT** | `_dmarc` | `v=DMARC1; p=quarantine; sp=quarantine; pct=100; rua=mailto:dmarc-reports@vxmusic.in; ruf=mailto:dmarc-forensics@vxmusic.in; aspf=r; adkim=r` | Auto |

### Explanation of Directives:
- `p=quarantine`: Messages that fail SPF or DKIM are directed to the recipient's Spam/Quarantine folder. Once confident, elevate to `p=reject`.
- `rua`: Destination for aggregate DMARC delivery reports.
- `ruf`: Destination for forensic failure reports.
- `pct=100`: Applies the policy to 100% of outbound messages.

---

## 6. Reverse DNS (PTR Record)

> [!CAUTION]
> PTR records **CANNOT** be configured in Cloudflare or standard DNS registrars. They must be set in your VPS hosting provider's control panel (Hetzner, DigitalOcean, Linode, AWS EC2, or Vultr).

1. Open your hosting provider dashboard for your VPS IP address.
2. Locate the **Reverse DNS** / **PTR** setting.
3. Set the PTR record value for `<YOUR_VPS_PUBLIC_IPV4>` to:
   ```
   mail.vxmusic.in
   ```
4. Verify using `dig`:
   ```bash
   dig -x <YOUR_VPS_PUBLIC_IPV4> +short
   # Must output: mail.vxmusic.in.
   ```

---

## 7. TLS Certificate (Let's Encrypt via Certbot)

Run Certbot on the Stalwart VPS to obtain a valid TLS certificate:

```bash
certbot certonly --standalone -d mail.vxmusic.in --agree-tos -m admin@vxmusic.in
```

Mount the resulting certificates to Stalwart:
```toml
[certificate.default]
cert = "/etc/letsencrypt/live/mail.vxmusic.in/fullchain.pem"
private-key = "/etc/letsencrypt/live/mail.vxmusic.in/privkey.pem"
```

---

## 8. Verification Checklist

Before removing the **DEVELOPMENT** label in VxMail:
- [ ] `dig MX vxmusic.in +short` returns `10 mail.vxmusic.in.`
- [ ] `dig TXT vxmusic.in +short` returns `v=spf1 ...`
- [ ] `dig TXT vxmail2026._domainkey.vxmusic.in +short` returns `v=DKIM1 ...`
- [ ] `dig TXT _dmarc.vxmusic.in +short` returns `v=DMARC1 ...`
- [ ] `dig -x <VPS_IP> +short` returns `mail.vxmusic.in.`
- [ ] Port 25 outbound is unblocked by the VPS host (contact support if default blocked).
- [ ] Test message sent to `check-auth@verifier.port25.com` or `mail-tester.com` scores 10/10.
