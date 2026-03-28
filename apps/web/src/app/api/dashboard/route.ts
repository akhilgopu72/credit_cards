import { NextResponse } from "next/server";
import type { ApiResponse } from "@cardmax/shared";
import type { DashboardStats } from "@/types/api";
import { isClerkConfigured, isDbConfigured } from "@/server/data/fallback";

const emptyStats: DashboardStats = {
  cardsCount: 0,
  totalCreditsAvailable: 0,
  totalCreditsUsed: 0,
  activeOffersCount: 0,
  upcomingFees: [],
  cardSummaries: [],
};

export async function GET() {
  try {
    // When Clerk or DB aren't configured, return empty dashboard
    if (!isClerkConfigured() || !isDbConfigured()) {
      return NextResponse.json({
        data: emptyStats,
        error: null,
      } satisfies ApiResponse<DashboardStats>);
    }

    const { auth } = await import("@clerk/nextjs/server");
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    const { db } = await import("@/server/db");

    const user = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({
        data: emptyStats,
        error: null,
      } satisfies ApiResponse<DashboardStats>);
    }

    const wallet = await db.query.userCards.findMany({
      where: (t, { eq, and }) =>
        and(eq(t.userId, user.id), eq(t.isActive, true)),
      with: {
        card: {
          with: {
            versions: {
              where: (t, { eq }) => eq(t.isCurrent, true),
              with: { categoryBonuses: true, benefits: true },
            },
          },
        },
      },
    });

    const userOffers = await db.query.userOffers.findMany({
      where: (t, { eq }) => eq(t.userId, user.id),
    });

    const benefitTracking = await db.query.userBenefitTracking.findMany({
      where: (t, { eq }) => eq(t.userId, user.id),
    });

    let totalCreditsAvailable = 0;
    let totalCreditsUsed = 0;
    const cardSummaries: DashboardStats["cardSummaries"] = [];
    const upcomingFees: DashboardStats["upcomingFees"] = [];

    for (const wc of wallet) {
      const version = wc.card.versions[0];
      if (!version) continue;

      const creditBenefits = version.benefits.filter((b) =>
        [
          "statement_credit", "travel_credit", "dining_credit",
          "entertainment_credit", "hotel_credit", "airline_credit",
          "uber_credit", "streaming_credit", "wellness_credit", "shopping_credit",
        ].includes(b.benefitType)
      );

      let cardCreditsValue = 0;
      for (const benefit of creditBenefits) {
        const val = Number(benefit.value);
        switch (benefit.frequency) {
          case "monthly": cardCreditsValue += val * 12; break;
          case "quarterly": cardCreditsValue += val * 4; break;
          case "semi_annual": cardCreditsValue += val * 2; break;
          default: cardCreditsValue += val; break;
        }
      }

      totalCreditsAvailable += cardCreditsValue;

      const cardTracking = benefitTracking.filter((bt) => bt.userCardId === wc.id);
      const usedForCard = cardTracking.reduce((sum, bt) => sum + Number(bt.amountUsed), 0);
      totalCreditsUsed += usedForCard;

      const effectiveSub = wc.signUpBonusOverride ?? version.signUpBonus;

      cardSummaries.push({
        userCardId: wc.id,
        cardName: wc.card.name,
        issuer: wc.card.issuer,
        annualFee: wc.card.annualFee,
        totalCreditsValue: cardCreditsValue,
        benefitsCount: version.benefits.length,
        bonusesCount: version.categoryBonuses.length,
        signUpBonus: effectiveSub,
      });

      if (Number(wc.card.annualFee) > 0) {
        upcomingFees.push({
          cardName: wc.card.name,
          annualFee: wc.card.annualFee,
          feeDate: wc.annualFeeDate,
        });
      }
    }

    const stats: DashboardStats = {
      cardsCount: wallet.length,
      totalCreditsAvailable,
      totalCreditsUsed,
      activeOffersCount: userOffers.length,
      upcomingFees,
      cardSummaries,
    };

    return NextResponse.json({
      data: stats,
      error: null,
    } satisfies ApiResponse<DashboardStats>);
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json({
      data: emptyStats,
      error: null,
    } satisfies ApiResponse<DashboardStats>);
  }
}
