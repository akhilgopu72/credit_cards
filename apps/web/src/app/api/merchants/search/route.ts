import { NextResponse } from "next/server";
import type { ApiResponse } from "@cardmax/shared";
import { merchantSearchSchema } from "@/types/api";
import { isDbConfigured, fallbackSearchMerchants } from "@/server/data/fallback";

// ---------------------------------------------------------------------------
// GET /api/merchants/search?q=...&category=...&limit=...&threshold=...
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      threshold: searchParams.get("threshold") ?? undefined,
    };

    const parsed = merchantSearchSchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json({
        data: [],
        error: null,
        meta: { total: 0 },
      } satisfies ApiResponse<any[]>);
    }

    const { q: query, category, limit, threshold } = parsed.data;

    // -----------------------------------------------------------------
    // DB path: pg_trgm similarity search
    // -----------------------------------------------------------------
    if (isDbConfigured()) {
      const { db } = await import("@/server/db");
      const { merchants } = await import("@/server/db/schema");
      const { sql, and, eq } = await import("drizzle-orm");

      // Set the similarity threshold for the % operator
      await db.execute(sql`SELECT set_limit(${threshold})`);

      // Build WHERE conditions
      const conditions = [];

      // Fuzzy match on name via pg_trgm, plus ILIKE fallback and alias match
      conditions.push(
        sql`(
          ${merchants.name} % ${query}
          OR ${merchants.name} ILIKE ${"%" + query + "%"}
          OR EXISTS (
            SELECT 1 FROM unnest(${merchants.aliases}) AS alias
            WHERE alias ILIKE ${"%" + query + "%"}
          )
        )`
      );

      // Optional category filter
      if (category) {
        conditions.push(eq(merchants.category, category));
      }

      const whereClause =
        conditions.length === 1 ? conditions[0] : and(...conditions);

      const results = await db
        .select({
          id: merchants.id,
          name: merchants.name,
          slug: merchants.slug,
          category: merchants.category,
          websiteDomain: merchants.websiteDomain,
          logoUrl: merchants.logoUrl,
          simScore: sql<number>`similarity(${merchants.name}, ${query})`.as(
            "sim_score"
          ),
        })
        .from(merchants)
        .where(whereClause)
        .orderBy(sql`similarity(${merchants.name}, ${query}) DESC`)
        .limit(limit);

      return NextResponse.json({
        data: results,
        error: null,
        meta: { total: results.length },
      } satisfies ApiResponse<typeof results>);
    }

    // -----------------------------------------------------------------
    // Fallback: in-memory search (no DB configured)
    // -----------------------------------------------------------------
    let results = fallbackSearchMerchants(query);

    if (category) {
      results = results.filter((m) => m.category === category);
    }

    results = results.slice(0, limit);

    return NextResponse.json({
      data: results,
      error: null,
      meta: { total: results.length },
    } satisfies ApiResponse<typeof results>);
  } catch (error) {
    console.error("Error searching merchants:", error);

    // Graceful degradation: try fallback on DB errors
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const category = searchParams.get("category");

    if (query && query.length >= 2) {
      let results = fallbackSearchMerchants(query);
      if (category) {
        results = results.filter((m) => m.category === category);
      }
      return NextResponse.json({
        data: results,
        error: null,
        meta: { total: results.length },
      } satisfies ApiResponse<typeof results>);
    }

    return NextResponse.json(
      {
        data: null,
        error: "Failed to search merchants",
      } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}
