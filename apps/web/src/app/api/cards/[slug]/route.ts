import { NextResponse } from "next/server";
import type { ApiResponse } from "@cardmax/shared";
import { isDbConfigured, fallbackGetCardBySlug } from "@/server/data/fallback";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (isDbConfigured()) {
      const { db } = await import("@/server/db");
      const card = await db.query.creditCardProducts.findFirst({
        where: (t, { eq }) => eq(t.slug, slug),
        with: {
          versions: {
            where: (t, { eq }) => eq(t.isCurrent, true),
            with: { categoryBonuses: true, benefits: true },
          },
        },
      });

      if (!card) {
        return NextResponse.json(
          { data: null, error: "Card not found" } satisfies ApiResponse<null>,
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: card,
        error: null,
      } satisfies ApiResponse<typeof card>);
    }

    // Fallback to in-memory
    const card = fallbackGetCardBySlug(slug);
    if (!card) {
      return NextResponse.json(
        { data: null, error: "Card not found" } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: card,
      error: null,
    } satisfies ApiResponse<typeof card>);
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json(
      { data: null, error: "Failed to fetch card" } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}
