import { NextResponse } from "next/server";
import { ilike, or } from "drizzle-orm";
import type { ApiResponse } from "@cardmax/shared";
import { isDbConfigured, fallbackGetCards } from "@/server/data/fallback";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issuer = searchParams.get("issuer") ?? undefined;
    const search = searchParams.get("q") ?? undefined;

    if (isDbConfigured()) {
      const { db } = await import("@/server/db");
      const cards = await db.query.creditCardProducts.findMany({
        where: (t, { eq, and }) => {
          const conditions = [eq(t.isActive, true)];
          if (issuer) conditions.push(eq(t.issuer, issuer as any));
          if (search) {
            conditions.push(
              or(
                ilike(t.name, `%${search}%`),
                ilike(t.slug, `%${search}%`)
              )!
            );
          }
          return and(...conditions);
        },
        with: {
          versions: {
            where: (t, { eq }) => eq(t.isCurrent, true),
            with: { categoryBonuses: true, benefits: true },
          },
        },
        orderBy: (t, { asc }) => asc(t.name),
      });

      return NextResponse.json({
        data: cards,
        error: null,
        meta: { total: cards.length },
      } satisfies ApiResponse<typeof cards>);
    }

    // Fallback to in-memory data
    const cards = fallbackGetCards({ issuer, search });
    return NextResponse.json({
      data: cards,
      error: null,
      meta: { total: cards.length },
    } satisfies ApiResponse<typeof cards>);
  } catch (error) {
    console.error("Error fetching cards:", error);
    // Last resort fallback
    const { searchParams } = new URL(request.url);
    const cards = fallbackGetCards({
      issuer: searchParams.get("issuer") ?? undefined,
      search: searchParams.get("q") ?? undefined,
    });
    return NextResponse.json({
      data: cards,
      error: null,
      meta: { total: cards.length },
    });
  }
}
