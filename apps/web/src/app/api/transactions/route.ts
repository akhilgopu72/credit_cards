import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { ApiResponse } from "@cardmax/shared";
import type { TransactionBatchResult } from "@/types/api";
import { transactionBatchSchema } from "@/types/api";

export const maxDuration = 60;

// POST: Receive scraped transactions from Chrome extension
export async function POST(request: Request) {
  // Accept Clerk auth OR extension API key for development
  const authHeader = request.headers.get("authorization") || "";
  const isExtensionKey = authHeader === "Bearer cardmax-dev-extension";

  if (!isExtensionKey) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }
  }

  const body = await request.json();
  const parsed = transactionBatchSchema.safeParse(body);
  if (!parsed.success) {
    console.error(
      "Transaction validation failed:",
      parsed.error.issues.slice(0, 5)
    );
    return NextResponse.json(
      {
        data: null,
        error: `Invalid transaction data: ${parsed.error.issues[0]?.message}`,
      } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const { transactions } = parsed.data;

  // ── Aggregate: spend by category ──────────────────────────────
  const spendByCategory: Record<string, number> = {};
  const spendByMonth: Record<string, number> = {};
  let offerRedemptions = 0;

  for (const txn of transactions) {
    // Count offer redemptions regardless of amount sign
    if (txn.issuer === "chase" && txn.isOfferRedemption) {
      offerRedemptions++;
      continue;
    }

    // Only count positive amounts (charges, not payments/credits)
    if (txn.amount <= 0) continue;

    // Aggregate by category
    const cat = txn.category;
    spendByCategory[cat] = (spendByCategory[cat] || 0) + txn.amount;

    // Aggregate by month (YYYY-MM)
    const month = txn.date.slice(0, 7);
    spendByMonth[month] = (spendByMonth[month] || 0) + txn.amount;
  }

  const result: TransactionBatchResult = {
    received: transactions.length,
    parsed: transactions.length,
    offerRedemptions,
    spendByCategory,
    spendByMonth,
  };

  console.log(
    `[Transactions API] Received ${transactions.length} transactions from ${transactions[0]?.issuer}. ` +
      `Categories: ${JSON.stringify(spendByCategory)}. Offer redemptions: ${offerRedemptions}`
  );

  return NextResponse.json({
    data: result,
    error: null,
  } satisfies ApiResponse<TransactionBatchResult>);
}
