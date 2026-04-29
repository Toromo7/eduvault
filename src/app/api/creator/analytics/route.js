import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyDashboardToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── Auth helper (matches pattern used across all protected routes) ───────────

async function getUserFromCookie(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/auth_token=([^;]+)/);
  const token = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  if (!token) return null;
  const verification = await verifyDashboardToken(token, process.env.JWT_SECRET);
  if (!verification.valid) return null;
  return verification.payload;
}

// ─── GET /api/creator/analytics ───────────────────────────────────────────────

export async function GET(request) {
  try {
    const user = await getUserFromCookie(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creatorAddress = user.walletAddress;
    if (!creatorAddress) {
      return NextResponse.json({ error: "No wallet address on account" }, { status: 400 });
    }

    const db = await getDb();
    const purchases = db.collection("purchases");
    const materials = db.collection("materials");

    // ── 1. Fetch all material IDs owned by this creator ──────────────────────
    const creatorMaterials = await materials
      .find({ userAddress: creatorAddress }, { projection: { _id: 1, title: 1 } })
      .toArray();

    const materialIdStrings = creatorMaterials.map((m) => m._id.toString());
    const materialTitleMap = Object.fromEntries(
      creatorMaterials.map((m) => [m._id.toString(), m.title ?? "Untitled"])
    );

    // ── 2. Total Revenue (sum of `amount` on confirmed purchases) ────────────
    const revenueAgg = await purchases
      .aggregate([
        {
          $match: {
            materialId: { $in: materialIdStrings },
            status: "confirmed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: "$amount" } },
          },
        },
      ])
      .toArray();

    const totalRevenue = revenueAgg[0]?.total ?? 0;

    // ── 3. Monthly Sales (count of purchases in last 30 days) ────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlySalesAgg = await purchases
      .aggregate([
        {
          $match: {
            materialId: { $in: materialIdStrings },
            status: "confirmed",
            purchasedAt: { $gte: thirtyDaysAgo },
          },
        },
        { $count: "count" },
      ])
      .toArray();

    const monthlySales = monthlySalesAgg[0]?.count ?? 0;

    // ── 4. Chart Data — daily revenue for last 7 days ────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const chartAgg = await purchases
      .aggregate([
        {
          $match: {
            materialId: { $in: materialIdStrings },
            status: "confirmed",
            purchasedAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$purchasedAt" },
            },
            value: { $sum: { $toDouble: "$amount" } },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Fill in any missing days so the chart always has 7 points
    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartMap = Object.fromEntries(chartAgg.map((d) => [d._id, d.value]));
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return {
        day: DAY_LABELS[d.getDay()],
        value: chartMap[key] ?? 0,
      };
    });

    // ── 5. Top 5 Materials by sales count ────────────────────────────────────
    const topMaterialsAgg = await purchases
      .aggregate([
        {
          $match: {
            materialId: { $in: materialIdStrings },
            status: "confirmed",
          },
        },
        {
          $group: {
            _id: "$materialId",
            sales: { $sum: 1 },
            revenue: { $sum: { $toDouble: "$amount" } },
          },
        },
        { $sort: { sales: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    const topMaterials = topMaterialsAgg.map((m) => ({
      name: materialTitleMap[m._id] ?? "Unknown Material",
      sales: m.sales,
      revenue: `$${m.revenue.toFixed(2)}`,
    }));

    // ── 6. Recent 5 Withdrawals ───────────────────────────────────────────────
    // MongoDB returns an empty cursor for non-existent collections without throwing,
    // so no try-catch is needed for that case. Any error here is a real failure
    // (connection issue, type mismatch, etc.) and must be logged.
    let withdrawals = [];
    try {
      const payouts = db.collection("payouts");
      const payoutDocs = await payouts
        .find({ creatorAddress })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      withdrawals = payoutDocs.map((p) => ({
        date: new Date(p.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        amount: `$${Number(p.amount ?? 0).toFixed(2)}`,
        status: p.status === "completed" ? "Success" : "Pending",
      }));
    } catch (payoutsError) {
      console.error("[analytics] Failed to fetch withdrawals:", payoutsError);
      // withdrawals stays [] so the rest of the response is still usable,
      // but the error is now visible in logs rather than silently swallowed.
    }

    // -- 7. Available Balance (revenue minus completed payouts) ----------------
    // Sum only payouts with status "completed" � pending payouts have not yet
    // left the creator's balance.
    const completedPayoutsAgg = await db
      .collection("payouts")
      .aggregate([
        { $match: { creatorAddress, status: "completed" } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } },
      ])
      .toArray();

    const completedPayouts = completedPayoutsAgg[0]?.total ?? 0;
    const availableBalance = Math.max(0, totalRevenue - completedPayouts);

    return NextResponse.json({
      totalRevenue,
      availableBalance,
      monthlySales,
      chartData,
      topMaterials,
      withdrawals,
    });
  } catch (error) {
    console.error("[analytics] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
