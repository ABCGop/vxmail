import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@vxmail/database";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const ready = dbHealth.ok;

  if (!ready) {
    return NextResponse.json(
      { ready: false, reason: "Database connection failed" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ready: true,
    timestamp: new Date().toISOString(),
  });
}
