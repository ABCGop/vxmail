import dotenv from "dotenv";
dotenv.config();

import { startWorkers } from "./worker";

console.log("==========================================");
console.log("   VxMail Background Worker Service");
console.log("   Domain: vxmusic.in | Env:", process.env.NODE_ENV || "development");
console.log("==========================================");

startWorkers();

process.on("SIGINT", () => {
  console.log("[VxMail Worker] Shutting down gracefully...");
  process.exit(0);
});
