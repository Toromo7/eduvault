export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyDashboardToken } from "@/lib/auth/session";
import { ObjectId } from "mongodb";

/**
 * Verifies the request carries a valid dashboard token AND that the
 * resolved user holds admin privileges.
 *
 * Privilege is granted when ANY of the following is true (in order):
 *   1. The user document in MongoDB has `role === "admin"`.
 *   2. The user's wallet address appears in the ADMIN_WALLETS env var
 *      (comma-separated list of addresses, case-insensitive).
 *
 * Returns the user document on success, or null on any failure.
 */
async function getAdminUser(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/auth_token=([^;]+)/);
  const token = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  if (!token) return null;

  const verification = await verifyDashboardToken(token, process.env.JWT_SECRET);
  if (!verification.valid) return null;

  const { sub, walletAddress } = verification.payload;

  // Fetch the live user document so role changes take effect without
  // requiring a new token to be issued.
  let dbUser = null;
  try {
    const db = await getDb();
    dbUser = await db.collection("users").findOne({ _id: new ObjectId(sub) });
  } catch {
    return null;
  }

  if (!dbUser) return null;

  // Check 1: explicit role field on the user document
  if (dbUser.role === "admin") return dbUser;

  // Check 2: wallet address allowlist from environment variable
  const allowlist = (process.env.ADMIN_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);

  const userWallet = (dbUser.walletAddress ?? walletAddress ?? "").toLowerCase();
  if (allowlist.length > 0 && userWallet && allowlist.includes(userWallet)) {
    return dbUser;
  }

  // No admin privilege found
  return null;
}

export async function GET(request) {
  try {
    const user = await getAdminUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const disputes = await db
      .collection("disputes")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("[admin/disputes] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getAdminUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { disputeId, status, resolution } = await request.json();
    if (!disputeId || !status) {
      return NextResponse.json({ error: "disputeId and status are required" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("disputes").updateOne(
      { _id: disputeId },
      {
        $set: {
          status,
          resolution: resolution ?? null,
          resolvedBy: user._id,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/disputes] PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
