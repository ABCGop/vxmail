/**
 * VxMail Cloudflare Email Inbound Worker
 * Forwards all incoming emails from vxmusic.in to the VxMail inbound webhook.
 *
 * Deploy at: Cloudflare Dashboard → Email Routing → Email Workers
 */
export default {
  async email(message, env, ctx) {
    const INBOUND_URL = "https://mail.vxmusic.in/api/mail/inbound";
    const INBOUND_SECRET = "vxmail_webhook_secure_token_2026";

    try {
      // Stream the raw RFC 5322 email bytes directly to VxMail
      const response = await fetch(INBOUND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "message/rfc822",
          "x-vxmail-secret": INBOUND_SECRET,
          "x-forwarded-to": message.to,
          "x-forwarded-from": message.from,
        },
        body: message.raw,  // ReadableStream - pipe directly without buffering
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(`VxMail inbound rejected: ${response.status} ${body}`);
      } else {
        const result = await response.json();
        console.log(`Email delivered to VxMail: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error(`VxMail inbound worker error: ${err.message}`);
    }
  }
};
