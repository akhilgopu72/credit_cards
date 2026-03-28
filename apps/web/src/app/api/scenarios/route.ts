import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { ApiResponse } from "@cardmax/shared";
import { db } from "@/server/db";
import { spendScenarios } from "@/server/db/schema";
import {
  calculateScenario,
  autoOptimize,
  autoOptimizeNetValue,
  recommendCards,
  DEFAULT_PERK_PREFERENCES,
  type WalletCard,
  type CatalogCard,
  type ScenarioOutput,
  type Allocation,
  type RecommendOutput,
  type PerkPreferences,
} from "@/server/services/scenario-engine";
import { recommendSchema } from "@/types/api/scenarios";
import { withTransaction } from "@/server/lib/with-transaction";

// ─── Zod Schemas ─────────────────────────────────────────────────

const allocationSchema = z.record(
  z.string().uuid(),
  z.record(z.string(), z.number().min(0).max(100))
);

const calculateSchema = z.object({
  monthly_spend: z.record(z.string(), z.number().min(0)),
  card_ids: z.array(z.string().uuid()).min(1, "At least one card is required"),
  allocation: allocationSchema,
  timeframe_months: z.number().int().min(1).max(120).default(12),
});

const optimizeSchema = z.object({
  monthly_spend: z.record(z.string(), z.number().min(0)),
  card_ids: z.array(z.string().uuid()).min(1, "At least one card is required"),
  timeframe_months: z.number().int().min(1).max(120).default(12),
  use_net_value: z.boolean().optional().default(false),
  perk_preferences: z.object({
    enabled: z.record(z.string(), z.boolean()),
  }).optional(),
});

const saveSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  config: z.object({
    monthly_spend: z.record(z.string(), z.number().min(0)),
    cards: z.array(z.string().uuid()),
    allocation: allocationSchema,
  }),
  results: z
    .object({
      total_points: z.number(),
      total_cashback: z.number(),
      per_card: z.array(
        z.object({
          card_id: z.string(),
          points: z.number(),
          cashback: z.number(),
          credits_value: z.number(),
          net_annual_fee: z.number(),
        })
      ),
      calculated_at: z.string(),
    })
    .optional(),
});

// ─── Helper: Fetch wallet cards by IDs ───────────────────────────

async function fetchWalletCards(
  userId: string,
  cardIds: string[]
): Promise<WalletCard[]> {
  const wallet = await db.query.userCards.findMany({
    where: (t, { eq, and, inArray }) =>
      and(
        eq(t.userId, userId),
        eq(t.isActive, true),
        inArray(t.id, cardIds)
      ),
    with: {
      card: {
        with: {
          versions: {
            where: (t, { eq }) => eq(t.isCurrent, true),
            with: {
              categoryBonuses: true,
              benefits: true,
            },
          },
        },
      },
    },
  });

  return wallet as unknown as WalletCard[];
}

// ─── Helper: Auth + get user ─────────────────────────────────────

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await db.query.users.findFirst({
    where: (t, { eq }) => eq(t.clerkId, clerkId),
  });

  return user ?? null;
}

// ─── GET: List saved scenarios ───────────────────────────────────

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    const scenarios = await db.query.spendScenarios.findMany({
      where: (t, { eq }) => eq(t.userId, user.id),
      orderBy: (t, { desc }) => [desc(t.updatedAt)],
    });

    return NextResponse.json({
      data: scenarios,
      error: null,
    } satisfies ApiResponse<typeof scenarios>);
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json(
      {
        data: null,
        error: "Failed to fetch scenarios",
      } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// ─── POST: Calculate or Save or Optimize ─────────────────────────

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    // Recommend is public — evaluates catalog cards, no user data needed
    if (action === "recommend") {
      return handleRecommend(request);
    }

    // All other actions require authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    if (action === "optimize") {
      return handleOptimize(request, user.id);
    }

    if (action === "save") {
      return handleSave(request, user.id);
    }

    // Default: calculate
    return handleCalculate(request, user.id);
  } catch (error) {
    console.error("Error in scenarios API:", error);
    return NextResponse.json(
      {
        data: null,
        error: "Internal server error",
      } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// ─── Calculate Handler ───────────────────────────────────────────

async function handleCalculate(request: Request, userId: string) {
  const body = await request.json();
  const parsed = calculateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: `Invalid request: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const { monthly_spend, card_ids, allocation, timeframe_months } =
    parsed.data;

  const walletCards = await fetchWalletCards(userId, card_ids);

  if (walletCards.length === 0) {
    return NextResponse.json(
      {
        data: null,
        error: "No valid cards found. Add cards to your wallet first.",
      } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const output = calculateScenario({
    monthly_spend,
    cards: walletCards,
    allocation,
    timeframe_months,
  });

  return NextResponse.json({
    data: output,
    error: null,
  } satisfies ApiResponse<ScenarioOutput>);
}

// ─── Optimize Handler ────────────────────────────────────────────

async function handleOptimize(request: Request, userId: string) {
  const body = await request.json();
  const parsed = optimizeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: `Invalid request: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const { monthly_spend, card_ids, timeframe_months, use_net_value, perk_preferences } = parsed.data;

  const walletCards = await fetchWalletCards(userId, card_ids);

  if (walletCards.length === 0) {
    return NextResponse.json(
      {
        data: null,
        error: "No valid cards found. Add cards to your wallet first.",
      } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  let optimizedAllocation: Allocation;
  let droppedCards: string[] = [];

  if (use_net_value) {
    // Enhanced Mode 1: factors in annual fees and credits
    const prefs: PerkPreferences = perk_preferences ?? DEFAULT_PERK_PREFERENCES;
    const result = autoOptimizeNetValue(monthly_spend, walletCards, prefs);
    optimizedAllocation = result.allocation;
    droppedCards = result.dropped_cards;
  } else {
    // Classic: greedy multiplier optimization
    optimizedAllocation = autoOptimize(monthly_spend, walletCards);
  }

  // Filter to only active cards for calculation
  const activeCards = droppedCards.length > 0
    ? walletCards.filter((c) => !droppedCards.includes(c.id))
    : walletCards;

  // Calculate with optimized allocation
  const output = calculateScenario({
    monthly_spend,
    cards: activeCards,
    allocation: optimizedAllocation,
    timeframe_months,
  });

  return NextResponse.json({
    data: {
      allocation: optimizedAllocation,
      dropped_cards: droppedCards,
      ...output,
    },
    error: null,
  } satisfies ApiResponse<{ allocation: Allocation; dropped_cards: string[] } & ScenarioOutput>);
}

// ─── Recommend Handler ──────────────────────────────────────────

async function fetchAllCatalogCards(): Promise<CatalogCard[]> {
  const cards = await db.query.creditCardProducts.findMany({
    where: (t, { eq }) => eq(t.isActive, true),
    with: {
      versions: {
        where: (t, { eq }) => eq(t.isCurrent, true),
        with: {
          categoryBonuses: true,
          benefits: true,
        },
      },
    },
  });

  return cards as unknown as CatalogCard[];
}

async function handleRecommend(request: Request) {
  const body = await request.json();
  const parsed = recommendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: `Invalid request: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const catalog = await fetchAllCatalogCards();

  if (catalog.length === 0) {
    return NextResponse.json(
      {
        data: null,
        error: "No cards in catalog. Seed card data first.",
      } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  const output = recommendCards(parsed.data, catalog);

  return NextResponse.json({
    data: output,
    error: null,
    meta: { total: output.recommendations.length },
  } satisfies ApiResponse<RecommendOutput>);
}

// ─── Save Handler ────────────────────────────────────────────────

async function handleSave(request: Request, userId: string) {
  return withTransaction(async (tx, req) => {
    const body = await req.json();
    const parsed = saveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: `Invalid request: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
        } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const [scenario] = await tx
      .insert(spendScenarios)
      .values({
        userId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        config: parsed.data.config,
        results: parsed.data.results ?? null,
      })
      .returning();

    return NextResponse.json({
      data: scenario,
      error: null,
    } satisfies ApiResponse<typeof scenario>);
  })(request);
}
