/**
 * In-memory fallback data layer for when DB is unavailable.
 * Uses seed data from @cardmax/card-data to serve API responses.
 */
import { cards, type CreditCard } from "@cardmax/card-data";
import { merchants as merchantSeed, type Merchant } from "@cardmax/card-data";
import { randomUUID } from "crypto";

// Stable UUIDs per card slug (deterministic for consistency across requests)
const cardIdMap = new Map<string, string>();
const versionIdMap = new Map<string, string>();

function getCardId(slug: string): string {
  if (!cardIdMap.has(slug)) cardIdMap.set(slug, randomUUID());
  return cardIdMap.get(slug)!;
}

function getVersionId(slug: string): string {
  if (!versionIdMap.has(slug)) versionIdMap.set(slug, randomUUID());
  return versionIdMap.get(slug)!;
}

/** Transform card-data CreditCard to match Drizzle query shape */
function toApiCard(card: CreditCard) {
  const cardId = getCardId(card.slug);
  const versionId = getVersionId(card.slug);

  return {
    id: cardId,
    name: card.name,
    slug: card.slug,
    issuer: card.issuer,
    network: card.network,
    annualFee: String(card.annual_fee),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [
      {
        id: versionId,
        cardId,
        isCurrent: true,
        signUpBonus: {
          points: card.sign_up_bonus.points,
          spend_requirement: card.sign_up_bonus.spend_requirement,
          timeframe_months: card.sign_up_bonus.timeframe_months,
          currency: card.base_earn_rate.currency,
        },
        baseEarnRate: card.base_earn_rate,
        effectiveDate: "2025-01-01",
        createdAt: new Date().toISOString(),
        categoryBonuses: card.category_bonuses.map((cb, i) => ({
          id: randomUUID(),
          versionId,
          category: cb.category,
          multiplier: String(cb.multiplier),
          capAmount: cb.cap_amount ? String(cb.cap_amount) : null,
          capPeriod: cb.cap_period,
        })),
        benefits: card.benefits.map((b) => ({
          id: randomUUID(),
          versionId,
          benefitType: b.benefit_type,
          name: b.name,
          description: b.description,
          value: String(b.value),
          frequency: b.frequency,
          autoTrigger: b.auto_trigger,
          merchantName: b.merchant_name ?? null,
        })),
      },
    ],
  };
}

const allCardsCache = cards.map(toApiCard);

/** Get all cards, optionally filtered */
export function fallbackGetCards(opts?: { issuer?: string; search?: string }) {
  let result = allCardsCache;

  if (opts?.issuer) {
    result = result.filter((c) => c.issuer === opts.issuer);
  }

  if (opts?.search) {
    const q = opts.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.issuer.toLowerCase().includes(q)
    );
  }

  return result;
}

/** Get single card by slug */
export function fallbackGetCardBySlug(slug: string) {
  return allCardsCache.find((c) => c.slug === slug) ?? null;
}

/** Transform merchant-data to match Drizzle query shape */
function toApiMerchant(m: Merchant) {
  return {
    id: randomUUID(),
    name: m.name,
    slug: m.slug,
    category: m.category,
    mccCodes: m.mcc_codes,
    websiteDomain: m.website_domain,
    aliases: m.aliases,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const allMerchantsCache = merchantSeed.map(toApiMerchant);

/** Search merchants */
export function fallbackSearchMerchants(query: string) {
  const q = query.toLowerCase();
  return allMerchantsCache
    .filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        m.aliases.some((a) => a.toLowerCase().includes(q))
    )
    .slice(0, 20);
}

/** Get merchant by slug with card rankings */
export function fallbackGetMerchantBySlug(slug: string) {
  const merchant = allMerchantsCache.find((m) => m.slug === slug);
  if (!merchant) return null;

  const cardRankings = allCardsCache
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

  return { merchant, cardRankings, offers: [] };
}

/** Check if DB is likely available */
export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

/** Check if Clerk is configured */
export function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return !!key && !key.includes("placeholder");
}
