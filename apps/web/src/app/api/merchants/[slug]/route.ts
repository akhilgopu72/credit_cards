import { NextResponse } from "next/server";
import type { ApiResponse } from "@cardmax/shared";
import {
  isDbConfigured,
  fallbackGetMerchantBySlug,
} from "@/server/data/fallback";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (isDbConfigured()) {
      const { db } = await import("@/server/db");
      const { sql } = await import("drizzle-orm");

      // ---------------------------------------------------------------
      // 1. Fetch merchant
      // ---------------------------------------------------------------
      const merchant = await db.query.merchants.findFirst({
        where: (t, { eq }) => eq(t.slug, slug),
      });

      if (!merchant) {
        return NextResponse.json(
          {
            data: null,
            error: "Merchant not found",
          } satisfies ApiResponse<null>,
          { status: 404 }
        );
      }

      // ---------------------------------------------------------------
      // 2. Card rankings: find cards with bonuses for this category
      // ---------------------------------------------------------------
      const allCards = await db.query.creditCardProducts.findMany({
        where: (t, { eq }) => eq(t.isActive, true),
        with: {
          versions: {
            where: (t, { eq }) => eq(t.isCurrent, true),
            with: { categoryBonuses: true, benefits: true },
          },
        },
      });

      const cardRankings = allCards
        .map((card) => {
          const version = card.versions[0];
          if (!version) return null;

          const categoryBonus = version.categoryBonuses.find(
            (cb) => cb.category === merchant.category
          );
          const multiplier = categoryBonus
            ? Number(categoryBonus.multiplier)
            : version.baseEarnRate.points_per_dollar;

          return {
            cardId: card.id,
            cardName: card.name,
            issuer: card.issuer,
            slug: card.slug,
            annualFee: card.annualFee,
            multiplier,
            currency: version.baseEarnRate.currency,
            capAmount: categoryBonus?.capAmount ?? null,
            capPeriod: categoryBonus?.capPeriod ?? null,
            isBaseRate: !categoryBonus,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b!.multiplier - a!.multiplier);

      // ---------------------------------------------------------------
      // 3. Active offers for this merchant
      //    Match by merchant_id OR merchant_name, and filter to
      //    non-expired offers only.
      // ---------------------------------------------------------------
      const { offers: offersTable } = await import("@/server/db/schema");

      const today = new Date().toISOString().split("T")[0];

      const merchantOffers = await db
        .select()
        .from(offersTable)
        .where(
          sql`(
            ${offersTable.merchantId} = ${merchant.id}
            OR ${offersTable.merchantName} = ${merchant.name}
          ) AND (
            ${offersTable.endDate} IS NULL
            OR ${offersTable.endDate} >= ${today}
          )`
        );

      // Attach offer card info for enriched response
      const offersWithCardInfo = merchantOffers.map((offer) => {
        const matchedCard = allCards.find((c) => c.id === offer.cardId);
        return {
          ...offer,
          cardName: offer.cardName ?? matchedCard?.name ?? null,
          cardIssuer: matchedCard?.issuer ?? offer.issuer,
        };
      });

      return NextResponse.json({
        data: {
          merchant,
          cardRankings,
          offers: offersWithCardInfo,
        },
        error: null,
        meta: {
          totalCards: cardRankings.length,
          totalOffers: offersWithCardInfo.length,
        },
      });
    }

    // -----------------------------------------------------------------
    // Fallback to in-memory
    // -----------------------------------------------------------------
    const result = fallbackGetMerchantBySlug(slug);
    if (!result) {
      return NextResponse.json(
        {
          data: null,
          error: "Merchant not found",
        } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: result,
      error: null,
      meta: {
        totalCards: result.cardRankings.length,
        totalOffers: result.offers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching merchant detail:", error);
    const { slug } = await params;
    const result = fallbackGetMerchantBySlug(slug);
    if (result) {
      return NextResponse.json({
        data: result,
        error: null,
        meta: {
          totalCards: result.cardRankings.length,
          totalOffers: result.offers.length,
        },
      });
    }
    return NextResponse.json(
      {
        data: null,
        error: "Failed to fetch merchant",
      } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}
