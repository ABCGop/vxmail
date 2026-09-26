import { NextRequest, NextResponse } from "next/server";
import { LoginSchema, normalizeEmail, UserRole } from "@vxmail/config";
import { prisma, MailRepository } from "@vxmail/database";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  checkLoginLockout,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Check rate limit lockout
    const lockout = await checkLoginLockout(normalizedIdentifier, ip);
    if (lockout.locked) {
      return NextResponse.json(
        {
          error: "Too many failed attempts. Account temporarily locked for 15 minutes.",
        },
        { status: 429 }
      );
    }

    // Find user by username or primary email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: normalizedIdentifier },
          { email: normalizedIdentifier },
        ],
      },
      include: {
        mailboxes: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });

    if (!user) {
      await prisma.loginAttempt.create({
        data: {
          ipAddress: ip,
          identifier: normalizedIdentifier,
          success: false,
          failureReason: "User not found",
        },
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Account is suspended or locked. Contact support@vxmusic.in" },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);

    if (!isMatch) {
      await prisma.loginAttempt.create({
        data: {
          ipAddress: ip,
          identifier: normalizedIdentifier,
          success: false,
          failureReason: "Incorrect password",
        },
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Successful login
    await prisma.loginAttempt.create({
      data: {
        ipAddress: ip,
        identifier: normalizedIdentifier,
        success: true,
      },
    });

    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "LOGIN_SUCCESS",
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || "Web Client",
        severity: "LOW",
      },
    });

    const primaryMailbox = user.mailboxes[0];
    if (!primaryMailbox) {
      return NextResponse.json({ error: "No active mailbox found for user" }, { status: 500 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as UserRole,
      mailboxId: primaryMailbox.id,
    });

    setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        mailboxId: primaryMailbox.id,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    console.error("[Login API Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
