import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@cardmax/shared";
import { addCardSchema, updateCardSchema, deleteCardSchema } from "@/types/api";
import { isClerkConfigured, isDbConfigured } from "@/server/data/fallback";
import { users, userCards } from "@/server/db/schema";
import { withTransaction } from "@/server/lib/with-transaction";

async function getAuth() {
  if (!isClerkConfigured()) return { clerkId: null };
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return { clerkId: userId };
}

// GET: List user's cards with full card product details
export async function GET() {
  try {
    const { clerkId } = await getAuth();
    if (!clerkId) {
      return NextResponse.json({
        data: [],
        error: null,
      } satisfies ApiResponse<any[]>);
    }

    if (!isDbConfigured()) {
      return NextResponse.json({
        data: [],
        error: null,
      } satisfies ApiResponse<any[]>);
    }

    const { db } = await import("@/server/db");
    const user = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({
        data: [],
        error: null,
      } satisfies ApiResponse<any[]>);
    }

    const wallet = await db.query.userCards.findMany({
      where: (t, { eq, and }) => and(eq(t.userId, user.id), eq(t.isActive, true)),
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

    return NextResponse.json({
      data: wallet,
      error: null,
      meta: { total: wallet.length },
    } satisfies ApiResponse<typeof wallet>);
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json({
      data: [],
      error: null,
    } satisfies ApiResponse<any[]>);
  }
}

// POST: Add card to wallet
export async function POST(request: Request) {
  const { clerkId } = await getAuth();
  if (!clerkId) {
    return NextResponse.json(
      { data: null, error: "Sign in to add cards to your wallet" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json(
      { data: null, error: "Database not configured" } satisfies ApiResponse<null>,
      { status: 503 }
    );
  }

  return withTransaction(async (tx, req) => {
    const body = await req.json();
    const parsed = addCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? "Invalid request" } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Verify the card product exists
    const cardProduct = await tx.query.creditCardProducts.findFirst({
      where: (t, { eq }) => eq(t.id, parsed.data.cardId),
    });

    if (!cardProduct) {
      return NextResponse.json(
        { data: null, error: "Card not found" } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    // Find or create user
    let user = await tx.query.users.findFirst({
      where: (t, { eq }) => eq(t.clerkId, clerkId),
    });

    if (!user) {
      const [newUser] = await tx
        .insert(users)
        .values({ clerkId, email: "" })
        .returning();
      user = newUser;
    }

    // Check for duplicate active card in wallet
    const existingCard = await tx.query.userCards.findFirst({
      where: (t, { eq, and }) =>
        and(
          eq(t.userId, user.id),
          eq(t.cardId, parsed.data.cardId),
          eq(t.isActive, true)
        ),
    });

    if (existingCard) {
      return NextResponse.json(
        { data: null, error: "This card is already in your wallet" } satisfies ApiResponse<null>,
        { status: 409 }
      );
    }

    const [userCard] = await tx
      .insert(userCards)
      .values({
        userId: user.id,
        cardId: parsed.data.cardId,
        nickname: parsed.data.nickname ?? null,
        openedDate: parsed.data.openedDate ?? null,
        annualFeeDate: parsed.data.annualFeeDate ?? null,
        creditLimit: parsed.data.creditLimit?.toString() ?? null,
        signUpBonusOverride: parsed.data.signUpBonusOverride ?? null,
      })
      .returning();

    return NextResponse.json({
      data: userCard,
      error: null,
    } satisfies ApiResponse<typeof userCard>);
  })(request);
}

// PUT: Update a card in wallet
export async function PUT(request: Request) {
  return handleUpdate(request);
}

// PATCH: Update a card in wallet
export async function PATCH(request: Request) {
  return handleUpdate(request);
}

async function handleUpdate(request: Request) {
  const { clerkId } = await getAuth();
  if (!clerkId) {
    return NextResponse.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json(
      { data: null, error: "Database not configured" } satisfies ApiResponse<null>,
      { status: 503 }
    );
  }

  return withTransaction(async (tx, req) => {
    const body = await req.json();
    const parsed = updateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? "Invalid request" } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const user = await tx.query.users.findFirst({
      where: (t, { eq }) => eq(t.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json(
        { data: null, error: "User not found" } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    const existing = await tx.query.userCards.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.id, parsed.data.userCardId), eq(t.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json(
        { data: null, error: "Card not found in wallet" } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.nickname !== undefined) updates.nickname = parsed.data.nickname;
    if (parsed.data.openedDate !== undefined) updates.openedDate = parsed.data.openedDate;
    if (parsed.data.annualFeeDate !== undefined) updates.annualFeeDate = parsed.data.annualFeeDate;
    if (parsed.data.creditLimit !== undefined) updates.creditLimit = parsed.data.creditLimit.toString();
    if (parsed.data.signUpBonusOverride !== undefined) {
      updates.signUpBonusOverride = parsed.data.signUpBonusOverride;
    }
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

    const [updated] = await tx
      .update(userCards)
      .set(updates)
      .where(eq(userCards.id, parsed.data.userCardId))
      .returning();

    return NextResponse.json({
      data: updated,
      error: null,
    } satisfies ApiResponse<typeof updated>);
  })(request);
}

// DELETE: Remove card from wallet (soft delete)
export async function DELETE(request: Request) {
  const { clerkId } = await getAuth();
  if (!clerkId) {
    return NextResponse.json(
      { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
      { status: 401 }
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json(
      { data: null, error: "Database not configured" } satisfies ApiResponse<null>,
      { status: 503 }
    );
  }

  return withTransaction(async (tx, req) => {
    // Support both body JSON and query param
    let userCardId: string | null = null;

    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("userCardId");

    if (queryId) {
      userCardId = queryId;
    } else {
      try {
        const body = await req.json();
        const parsed = deleteCardSchema.safeParse(body);
        if (parsed.success) {
          userCardId = parsed.data.userCardId;
        }
      } catch {
        // No body provided
      }
    }

    if (!userCardId) {
      return NextResponse.json(
        { data: null, error: "userCardId is required" } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const user = await tx.query.users.findFirst({
      where: (t, { eq }) => eq(t.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json(
        { data: null, error: "User not found" } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    const existing = await tx.query.userCards.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.id, userCardId!), eq(t.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json(
        { data: null, error: "Card not found in wallet" } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    // Soft delete: set isActive to false
    const [deleted] = await tx
      .update(userCards)
      .set({ isActive: false })
      .where(eq(userCards.id, userCardId!))
      .returning();

    return NextResponse.json({
      data: deleted,
      error: null,
    } satisfies ApiResponse<typeof deleted>);
  })(request);
}
