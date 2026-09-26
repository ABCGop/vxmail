import { Worker, Job } from "bullmq";
import { QUEUE_NAMES, getRedisClient, EmailSendJobData } from "./queues";
import { getMailTransport } from "@vxmail/email";
import { prisma } from "@vxmail/database";

export function startWorkers() {
  const redis = getRedisClient();

  if (!redis) {
    console.log("[VxMail Worker] Redis not connected. Background worker running in standby mode.");
    return;
  }

  // 1. Email Send Worker
  const sendWorker = new Worker<EmailSendJobData>(
    QUEUE_NAMES.EMAIL_SEND,
    async (job: Job<EmailSendJobData>) => {
      console.log(`[VxMail Send Worker] Processing job ${job.id} for message ${job.data.messageId}`);
      const transport = getMailTransport();

      try {
        const receipt = await transport.sendMail({
          from: job.data.from,
          to: job.data.to,
          cc: job.data.cc,
          bcc: job.data.bcc,
          subject: job.data.subject,
          text: job.data.text,
          html: job.data.html,
          messageId: job.data.messageId,
          attachments: job.data.attachments,
        });

        // Update database message status and add delivery event
        await prisma.message.updateMany({
          where: { messageId: job.data.messageId },
          data: {
            deliveryStatus: receipt.status,
            sentAt: receipt.dispatchedAt || new Date(),
          },
        });

        const targetMessage = await prisma.message.findFirst({
          where: { messageId: job.data.messageId },
        });

        if (targetMessage) {
          await prisma.emailEvent.create({
            data: {
              messageId: targetMessage.id,
              eventType: receipt.status,
              details: receipt.smtpResponse || "Dispatched successfully",
            },
          });
        }

        console.log(`[VxMail Send Worker] Completed delivery for ${job.data.messageId}: ${receipt.status}`);
        return receipt;
      } catch (error: any) {
        console.error(`[VxMail Send Worker] Failed to send ${job.data.messageId}:`, error);

        await prisma.message.updateMany({
          where: { messageId: job.data.messageId },
          data: { deliveryStatus: "FAILED" },
        });

        throw error;
      }
    },
    { connection: redis }
  );

  sendWorker.on("completed", (job) => {
    console.log(`[VxMail Send Worker] Job ${job.id} completed successfully.`);
  });

  sendWorker.on("failed", (job, err) => {
    console.error(`[VxMail Send Worker] Job ${job?.id} failed with error:`, err);
  });

  console.log("[VxMail Worker] Background queue workers initialized.");
}
