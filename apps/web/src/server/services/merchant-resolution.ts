import { db } from "@/server/db";
import { merchants } from "@/server/db/schema";
import { eq, sql, ilike } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────

export type MerchantInput = {
  merchantName: string;
  merchantDomain?: string | null;
};

export type ResolvedMerchant = {
  merchantId: string;
  merchantName: string;
  slug: string;
  confidence: "exact_domain" | "exact_alias" | "exact_name" | "fuzzy";
};

type MerchantRow = {
  id: string;
  name: string;
  slug: string;
  websiteDomain: string | null;
  aliases: string[] | null;
};

// ─── Name Normalization ─────────────────────────────────────────

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/i;
const TRADEMARK_RE = /[®™©]/g;
const DASH_SEPARATOR_RE = /\s+[-–—]\s+.+$/;
const PARENTHETICAL_RE = /\s*\([^)]*\)\s*$/;
const CARD_QUALIFIER_RE =
  /\s*[-–—]\s*(Platinum Card Offer|Gold Card Offer|Green Card Offer|Card Member Offer|Special Offer)$/i;

/**
 * Detect domain-style names like "oribe.com" or "kipling-usa.com".
 * Returns the domain string or null.
 */
export function extractDomainFromName(rawName: string): string | null {
  const trimmed = rawName.trim();
  if (DOMAIN_RE.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

/**
 * Generate ordered candidate names from a raw scraped merchant name.
 * Most-normalized first, raw fallback last. Deduplicated.
 */
export function normalizeMerchantName(rawName: string): string[] {
  const candidates: string[] = [];
  const stripped = rawName.replace(TRADEMARK_RE, "").trim();

  // If entire name is a domain, extract friendly name
  const domain = extractDomainFromName(stripped);
  if (domain) {
    // "oribe.com" → "oribe"
    const namePart = domain.split(".")[0]!;
    const friendly = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    candidates.push(friendly);
    candidates.push(domain);
    candidates.push(stripped);
    return [...new Set(candidates.filter(Boolean))];
  }

  // Strip card-specific qualifiers first (most specific)
  const noCardQualifier = stripped.replace(CARD_QUALIFIER_RE, "").trim();
  if (noCardQualifier !== stripped) candidates.push(noCardQualifier);

  // Strip dash-separated taglines: "Arlo - Smart Home Security Cameras" → "Arlo"
  const noDash = stripped.replace(DASH_SEPARATOR_RE, "").trim();
  if (noDash !== stripped && noDash.length > 0) candidates.push(noDash);

  // Strip parentheticals: "Air France (through Amex Travel only)" → "Air France"
  const noParens = stripped.replace(PARENTHETICAL_RE, "").trim();
  if (noParens !== stripped && noParens.length > 0) candidates.push(noParens);

  // Combined: strip both dash and parens
  const noBoth = stripped
    .replace(CARD_QUALIFIER_RE, "")
    .replace(DASH_SEPARATOR_RE, "")
    .replace(PARENTHETICAL_RE, "")
    .trim();
  if (noBoth !== stripped && noBoth.length > 0) candidates.push(noBoth);

  // Base trademark-stripped form
  candidates.push(stripped);

  // Raw fallback
  candidates.push(rawName.trim());

  return [...new Set(candidates.filter(Boolean))];
}

// ─── In-memory cache for single lookups ─────────────────────────

const cache = new Map<string, ResolvedMerchant | null>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cacheTimestamp = 0;

function clearCacheIfStale(): void {
  if (Date.now() - cacheTimestamp > CACHE_TTL) {
    cache.clear();
    cacheTimestamp = Date.now();
  }
}

// ─── Single Merchant Resolution ─────────────────────────────────

export async function resolveMerchant(
  input: MerchantInput
): Promise<ResolvedMerchant | null> {
  clearCacheIfStale();

  const cacheKey = `${input.merchantDomain ?? ""}|${input.merchantName.toLowerCase()}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  let result: ResolvedMerchant | null = null;

  // 1. Exact domain match
  if (input.merchantDomain) {
    const [match] = await db
      .select({ id: merchants.id, name: merchants.name, slug: merchants.slug })
      .from(merchants)
      .where(eq(merchants.websiteDomain, input.merchantDomain))
      .limit(1);

    if (match) {
      result = {
        merchantId: match.id,
        merchantName: match.name,
        slug: match.slug,
        confidence: "exact_domain",
      };
    }
  }

  // 1b. Domain-style name match (e.g. "oribe.com")
  if (!result) {
    const domainFromName = extractDomainFromName(input.merchantName);
    if (domainFromName) {
      const [match] = await db
        .select({ id: merchants.id, name: merchants.name, slug: merchants.slug })
        .from(merchants)
        .where(eq(merchants.websiteDomain, domainFromName))
        .limit(1);

      if (match) {
        result = {
          merchantId: match.id,
          merchantName: match.name,
          slug: match.slug,
          confidence: "exact_domain",
        };
      }
    }
  }

  // 2. Normalized name matching — try each candidate against alias then name
  const candidates = normalizeMerchantName(input.merchantName);

  if (!result) {
    for (const candidate of candidates) {
      // Alias match
      const [aliasMatch] = await db
        .select({ id: merchants.id, name: merchants.name, slug: merchants.slug })
        .from(merchants)
        .where(
          sql`EXISTS (SELECT 1 FROM unnest(${merchants.aliases}) AS a WHERE LOWER(a) = LOWER(${candidate}))`
        )
        .limit(1);

      if (aliasMatch) {
        result = {
          merchantId: aliasMatch.id,
          merchantName: aliasMatch.name,
          slug: aliasMatch.slug,
          confidence: "exact_alias",
        };
        break;
      }

      // Name match
      const [nameMatch] = await db
        .select({ id: merchants.id, name: merchants.name, slug: merchants.slug })
        .from(merchants)
        .where(ilike(merchants.name, candidate))
        .limit(1);

      if (nameMatch) {
        result = {
          merchantId: nameMatch.id,
          merchantName: nameMatch.name,
          slug: nameMatch.slug,
          confidence: "exact_name",
        };
        break;
      }
    }
  }

  // 3. Fuzzy match via pg_trgm — use best normalized candidate
  if (!result) {
    const fuzzyName = candidates[0] ?? input.merchantName;
    const [match] = await db
      .select({
        id: merchants.id,
        name: merchants.name,
        slug: merchants.slug,
        similarity: sql<number>`similarity(${merchants.name}, ${fuzzyName})`,
      })
      .from(merchants)
      .where(sql`similarity(${merchants.name}, ${fuzzyName}) > 0.3`)
      .orderBy(sql`similarity(${merchants.name}, ${fuzzyName}) DESC`)
      .limit(1);

    if (match) {
      result = {
        merchantId: match.id,
        merchantName: match.name,
        slug: match.slug,
        confidence: "fuzzy",
      };
    }
  }

  cache.set(cacheKey, result);
  return result;
}

// ─── Batch Merchant Resolution ──────────────────────────────────

export async function resolveMerchantBatch(
  inputs: MerchantInput[]
): Promise<Map<string, ResolvedMerchant | null>> {
  if (inputs.length === 0) return new Map();

  // Pre-load all merchants into memory for fast exact matching
  const allMerchants = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      slug: merchants.slug,
      websiteDomain: merchants.websiteDomain,
      aliases: merchants.aliases,
    })
    .from(merchants);

  // Build lookup indexes
  const byDomain = new Map<string, MerchantRow>();
  const byNameLower = new Map<string, MerchantRow>();
  const byAliasLower = new Map<string, MerchantRow>();

  for (const m of allMerchants) {
    if (m.websiteDomain) byDomain.set(m.websiteDomain.toLowerCase(), m);
    byNameLower.set(m.name.toLowerCase(), m);
    if (m.aliases) {
      for (const alias of m.aliases) {
        byAliasLower.set(alias.toLowerCase(), m);
      }
    }
  }

  const results = new Map<string, ResolvedMerchant | null>();
  const needsFuzzy: MerchantInput[] = [];

  // Phase 1: In-memory exact matching with normalization
  for (const input of inputs) {
    const key = `${input.merchantDomain ?? ""}|${input.merchantName.toLowerCase()}`;
    if (results.has(key)) continue;

    let match: MerchantRow | undefined;
    let confidence: ResolvedMerchant["confidence"] | undefined;

    // 1a. Domain match (from explicit domain field)
    if (input.merchantDomain) {
      match = byDomain.get(input.merchantDomain.toLowerCase());
      if (match) confidence = "exact_domain";
    }

    // 1b. Domain-style name match (e.g. "oribe.com")
    if (!match) {
      const domainFromName = extractDomainFromName(input.merchantName);
      if (domainFromName) {
        match = byDomain.get(domainFromName);
        if (match) confidence = "exact_domain";
      }
    }

    // 2. Normalized name matching — try each candidate against alias then name
    if (!match) {
      const candidates = normalizeMerchantName(input.merchantName);
      for (const candidate of candidates) {
        const lower = candidate.toLowerCase();

        // Alias match
        match = byAliasLower.get(lower);
        if (match) {
          confidence = "exact_alias";
          break;
        }

        // Name match
        match = byNameLower.get(lower);
        if (match) {
          confidence = "exact_name";
          break;
        }
      }
    }

    if (match && confidence) {
      results.set(key, {
        merchantId: match.id,
        merchantName: match.name,
        slug: match.slug,
        confidence,
      });
    } else {
      needsFuzzy.push(input);
    }
  }

  // Phase 2: Fuzzy matching via pg_trgm for unresolved
  // Use best normalized candidate for better fuzzy match scores
  const fuzzyNameMap = new Map<string, string>(); // rawLower → best normalized
  for (const input of needsFuzzy) {
    const rawLower = input.merchantName.toLowerCase();
    if (!fuzzyNameMap.has(rawLower)) {
      const candidates = normalizeMerchantName(input.merchantName);
      fuzzyNameMap.set(rawLower, candidates[0] ?? input.merchantName);
    }
  }

  const uniqueFuzzyNames = [...new Set(fuzzyNameMap.values())].map((n) => n.toLowerCase());

  if (uniqueFuzzyNames.length > 0) {
    const fuzzyResults = new Map<string, ResolvedMerchant | null>();

    // Batch fuzzy queries (avoid N+1 — query one at a time but only unique names)
    for (const name of uniqueFuzzyNames) {
      const [match] = await db
        .select({
          id: merchants.id,
          name: merchants.name,
          slug: merchants.slug,
          similarity: sql<number>`similarity(${merchants.name}, ${name})`,
        })
        .from(merchants)
        .where(sql`similarity(${merchants.name}, ${name}) > 0.3`)
        .orderBy(sql`similarity(${merchants.name}, ${name}) DESC`)
        .limit(1);

      fuzzyResults.set(
        name,
        match
          ? {
              merchantId: match.id,
              merchantName: match.name,
              slug: match.slug,
              confidence: "fuzzy",
            }
          : null
      );
    }

    // Map fuzzy results back to inputs using normalized name
    for (const input of needsFuzzy) {
      const key = `${input.merchantDomain ?? ""}|${input.merchantName.toLowerCase()}`;
      if (results.has(key)) continue;
      const normalizedName = fuzzyNameMap.get(input.merchantName.toLowerCase())?.toLowerCase();
      results.set(key, (normalizedName ? fuzzyResults.get(normalizedName) : null) ?? null);
    }
  }

  return results;
}

// ─── Auto-create merchant from domain ───────────────────────────

export async function createMerchantFromDomain(
  merchantName: string,
  domain: string,
  category = "general"
): Promise<ResolvedMerchant> {
  const slug = merchantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const [created] = await db
    .insert(merchants)
    .values({
      name: merchantName,
      slug,
      category,
      websiteDomain: domain,
      aliases: [merchantName],
    })
    .onConflictDoNothing({ target: merchants.slug })
    .returning({ id: merchants.id, name: merchants.name, slug: merchants.slug });

  // If conflict on slug, fetch existing
  if (!created) {
    const [existing] = await db
      .select({ id: merchants.id, name: merchants.name, slug: merchants.slug })
      .from(merchants)
      .where(eq(merchants.slug, slug))
      .limit(1);

    return {
      merchantId: existing!.id,
      merchantName: existing!.name,
      slug: existing!.slug,
      confidence: "exact_domain",
    };
  }

  return {
    merchantId: created.id,
    merchantName: created.name,
    slug: created.slug,
    confidence: "exact_domain",
  };
}

// ─── Auto-create merchant from name (no domain) ─────────────────

export async function createMerchantFromName(
  rawMerchantName: string,
  category = "general"
): Promise<ResolvedMerchant> {
  // Use best normalized name for the canonical merchant record
  const candidates = normalizeMerchantName(rawMerchantName);
  const bestName = candidates[0] ?? rawMerchantName.trim();

  const slug = bestName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check if domain-style name — if so, set websiteDomain
  const domain = extractDomainFromName(rawMerchantName);

  const [created] = await db
    .insert(merchants)
    .values({
      name: bestName,
      slug,
      category,
      websiteDomain: domain,
      aliases: bestName !== rawMerchantName.trim() ? [bestName, rawMerchantName.trim()] : [bestName],
    })
    .onConflictDoNothing({ target: merchants.slug })
    .returning({ id: merchants.id, name: merchants.name, slug: merchants.slug });

  // If conflict on slug, fetch existing
  if (!created) {
    const [existing] = await db
      .select({ id: merchants.id, name: merchants.name, slug: merchants.slug })
      .from(merchants)
      .where(eq(merchants.slug, slug))
      .limit(1);

    return {
      merchantId: existing!.id,
      merchantName: existing!.name,
      slug: existing!.slug,
      confidence: "exact_name",
    };
  }

  return {
    merchantId: created.id,
    merchantName: created.name,
    slug: created.slug,
    confidence: "exact_name",
  };
}
