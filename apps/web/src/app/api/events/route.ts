import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { realtimeEventBus, MailboxEvent } from "@/lib/realtime-events";

export async function GET(req: NextRequest) {
  const session = await getSession();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send event helper
  const sendEvent = async (event: string, data: any) => {
    try {
      await writer.write(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      );
    } catch {
      // client disconnected
    }
  };

  // Initial connection handshake
  sendEvent("connected", {
    userId: session?.userId,
    mailboxId: session?.mailboxId,
    serverTime: new Date().toISOString(),
    status: "online",
  });

  // Subscribe to real-time events for this user and mailbox
  const unsubscribe = session?.userId
    ? realtimeEventBus.subscribe(
        { userId: session.userId, mailboxId: session.mailboxId },
        (event: MailboxEvent) => {
          sendEvent(event.type, event);
        }
      )
    : () => {};

  // Keep connection alive with periodic heartbeat
  const interval = setInterval(() => {
    sendEvent("heartbeat", { timestamp: Date.now() });
  }, 15000);

  req.signal.addEventListener("abort", () => {
    unsubscribe();
    clearInterval(interval);
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in Nginx
    },
  });
}
