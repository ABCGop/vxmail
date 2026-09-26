import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@vxmail/database";
import { APP_CONFIG } from "@vxmail/config";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  return NextResponse.json({
    status: dbHealth.ok ? "healthy" : "degraded",
    service: APP_CONFIG.name,
    domain: APP_CONFIG.domain,
    environment: APP_CONFIG.environment,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbHealth.ok ? "connected" : "error",
      latencyMs: dbHealth.latencyMs,
    },
    stalwart: {
      host: APP_CONFIG.mailSubdomain,
      status: "ready",
      mode: process.env.NODE_ENV === "production" ? "live" : "development_sandbox",
    },
  });
}
