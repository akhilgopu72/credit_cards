import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { offers, userOffers } from "@/server/db/schema";
import type { ApiResponse } from "@cardmax/shared";
import { offerBatchSchema } from "@/types/api";
import {
  resolveMerchantBatch,
  createMerchantFromDomain,
  createMerchantFromName,
  extractDomainFromName,
  normalizeMerchantName,
  type MerchantInput,
} from "@/server/services/merchant-resolution";
import { withTransaction } from "@/server/lib/with-transaction";

// Allow large payloads (Capital One can send 3000+ offers)
export const maxDuration = 60; // seconds

// POST: Receive scraped offers from Chrome extension
export const POST = withTransaction(async (tx, request) => {
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
  const parsed = offerBatchSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Offer validation failed:", parsed.error.issues.slice(0, 5));
    return NextResponse.json(
      { data: null, error: `Invalid offer data: ${parsed.error.issues[0]?.message}` } satisfies ApiResponse<null>,
      { status: 400 }
    );
  }

  const { offers: scrapedOffers } = parsed.data;
  let insertedCount = 0;
  let merchantsResolved = 0;
  let merchantsCreated = 0;

  // ── Merchant Resolution ──────────────────────────────────────
  const merchantInputs: MerchantInput[] = scrapedOffers.map((o) => ({
    merchantName: o.merchantName,
    merchantDomain: o.merchantDomain ?? null,
  }));

  const resolved = await resolveMerchantBatch(merchantInputs);

  // Auto-create merchants for unresolved offers
  const autoCreated = new Map<string, string>(); // dedup key → merchantId
  for (const offer of scrapedOffers) {
    const key = `${offer.merchantDomain ?? ""}|${offer.merchantName.toLowerCase()}`;
    if (resolved.get(key)) continue;

    // Dedup by domain (if present) or by best normalized name
    const candidates = normalizeMerchantName(offer.merchantName);
    const bestNormalized = candidates[0] ?? offer.merchantName.trim();
    const dedupKey = offer.merchantDomain ?? bestNormalized.toLowerCase();
    if (autoCreated.has(dedupKey)) continue;

    try {
      let created;
      if (offer.merchantDomain) {
        // Has explicit domain (Capital One, some Amex)
        created = await createMerchantFromDomain(
          offer.merchantName,
          offer.merchantDomain
        );
      } else {
        // Domain-style name (e.g. "oribe.com") or plain name
        const domainFromName = extractDomainFromName(offer.merchantName);
        if (domainFromName) {
          created = await createMerchantFromDomain(bestNormalized, domainFromName);
        } else {
          created = await createMerchantFromName(offer.merchantName);
        }
      }
      autoCreated.set(dedupKey, created.merchantId);
      merchantsCreated++;
    } catch (err) {
      console.error(`[Offers] Auto-create merchant failed for "${offer.merchantName}":`, err);
    }
  }

  // ── Build rows for insert ───────────────────────────────────
  const rows = scrapedOffers.map((offer) => {
    const key = `${offer.merchantDomain ?? ""}|${offer.merchantName.toLowerCase()}`;
    const match = resolved.get(key);
    const offerCandidates = normalizeMerchantName(offer.merchantName);
    const offerBestNormalized = offerCandidates[0] ?? offer.merchantName.trim();
    const dedupKey = offer.merchantDomain ?? offerBestNormalized.toLowerCase();
    const merchantId =
      match?.merchantId ??
      autoCreated.get(dedupKey) ??
      null;
    if (merchantId) merchantsResolved++;

    return {
      issuer: offer.issuer,
      cardName: offer.cardName ?? null,
      merchantId,
      merchantName: offer.merchantName,
      merchantDomain: offer.merchantDomain ?? null,
      title: offer.title,
      description: offer.description ?? null,
      offerType: offer.offerType,
      value: offer.value.toString(),
      valueType: offer.valueType,
      minSpend: offer.minSpend?.toString() ?? null,
      maxReward: offer.maxReward?.toString() ?? null,
      startDate: offer.startDate ?? null,
      endDate: offer.endDate ?? null,
      useLimit: offer.useLimit ?? null,
      requiresAdd: offer.requiresAdd,
      sourceHash: offer.sourceHash,
      scrapedAt: new Date(),
    };
  });

  // ── Collect unique issuer+cardName pairs from this batch ──
  type Issuer = (typeof offers.issuer.enumValues)[number];
  const issuerCardPairs = new Map<string, { issuer: Issuer; cardName: string | null }>();
  for (const row of rows) {
    const pairKey = `${row.issuer}|${row.cardName ?? ""}`;
    if (!issuerCardPairs.has(pairKey)) {
      issuerCardPairs.set(pairKey, { issuer: row.issuer as Issuer, cardName: row.cardName });
    }
  }

  // ── Delete stale offers, then insert fresh ──
  let deletedCount = 0;

  // Delete stale offers for each issuer+card pair
  for (const { issuer: pairIssuer, cardName: pairCardName } of issuerCardPairs.values()) {
    const cardNameCondition = pairCardName === null
      ? isNull(offers.cardName)
      : eq(offers.cardName, pairCardName);

    // Find stale offer IDs for this issuer+card pair
    const staleOffers = await tx
      .select({ id: offers.id })
      .from(offers)
      .where(and(eq(offers.issuer, pairIssuer), cardNameCondition));

    if (staleOffers.length === 0) continue;

    const staleIds = staleOffers.map((o) => o.id);

    // Delete referencing user_offers rows first (FK constraint)
    await tx
      .delete(userOffers)
      .where(inArray(userOffers.offerId, staleIds));

    // Delete the stale offers
    await tx
      .delete(offers)
      .where(inArray(offers.id, staleIds));

    deletedCount += staleIds.length;
  }

  // Insert fresh offers in chunks
  const CHUNK_SIZE = 500;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await tx
      .insert(offers)
      .values(chunk)
      .onConflictDoNothing({ target: offers.sourceHash });
  }
  insertedCount = rows.length;

  console.log(
    `[Offers] Deleted ${deletedCount} stale, inserted ${insertedCount}/${scrapedOffers.length} offers. ` +
    `Merchants resolved: ${merchantsResolved}, created: ${merchantsCreated}`
  );

  return NextResponse.json({
    data: {
      deleted: deletedCount,
      inserted: insertedCount,
      total: scrapedOffers.length,
      merchantsResolved,
      merchantsCreated,
    },
    error: null,
  } satisfies ApiResponse<{
    deleted: number;
    inserted: number;
    total: number;
    merchantsResolved: number;
    merchantsCreated: number;
  }>);
});

// GET: List offers (optionally filtered by issuer/merchant)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issuer = searchParams.get("issuer");

    const rawOffers = await db.query.offers.findMany({
      ...(issuer && {
        where: (t: any, { eq }: any) => eq(t.issuer, issuer),
      }),
      orderBy: (t: any, { desc }: any) => desc(t.createdAt),
      with: {
        merchant: { columns: { websiteDomain: true } },
      },
    });

    const allOffers = rawOffers.map(({ merchant, ...offer }) => ({
      ...offer,
      merchantWebsiteDomain: merchant?.websiteDomain ?? null,
    }));

    return NextResponse.json({
      data: allOffers,
      error: null,
      meta: { total: allOffers.length },
    } satisfies ApiResponse<typeof allOffers>);
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { data: null, error: "Failed to fetch offers" } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}
