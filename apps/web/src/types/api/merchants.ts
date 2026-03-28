import { z } from "zod";

// ─── Merchant Search Response Types ──────────────────────────────
// GET /api/merchants/search?q=...

export type MerchantSearchResult = {
  id: string;
  name: string;
  slug: string;
  category: string;
  websiteDomain: string | null;
  logoUrl?: string | null;
  simScore?: number;
};

// ─── Merchant Detail Response Types ──────────────────────────────
// GET /api/merchants/[slug]

export type Merchant = {
  id: string;
  name: string;
  slug: string;
  category: string;
  websiteDomain: string | null;
  logoUrl?: string | null;
};

export type CardRanking = {
  cardId: string;
  cardName: string;
  issuer: string;
  slug: string;
  annualFee: string;
  multiplier: number;
  currency: string;
  capAmount: string | null;
  capPeriod: string | null;
  isBaseRate: boolean;
};

export type MerchantOffer = {
  id: string;
  issuer: string;
  cardName: string | null;
  cardIssuer?: string;
  merchantName: string;
  title: string;
  description: string | null;
  offerType: string;
  value: string;
  valueType: string;
  endDate: string | null;
};

export type MerchantDetail = {
  merchant: Merchant;
  cardRankings: CardRanking[];
  offers: MerchantOffer[];
};

// ─── Merchant Search Request Schema ──────────────────────────────
// GET /api/merchants/search query params

export const merchantSearchSchema = z.object({
  q: z.string().min(2, "Query must be at least 2 characters"),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  threshold: z.coerce.number().min(0).max(1).optional().default(0.1),
});

export type MerchantSearchParams = z.infer<typeof merchantSearchSchema>;
