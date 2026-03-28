import { z } from "zod";

// ─── Offers API Response Types ───────────────────────────────────
// GET /api/offers

export type Offer = {
  id: string;
  issuer: string;
  cardName: string | null;
  cardId: string | null;
  merchantId: string | null;
  merchantName: string;
  merchantDomain: string | null;
  merchantWebsiteDomain: string | null;
  title: string;
  description: string | null;
  offerType: string;
  value: string;
  valueType: string;
  minSpend: string | null;
  maxReward: string | null;
  startDate: string | null;
  endDate: string | null;
  requiresAdd: boolean;
  sourceHash: string | null;
  scrapedAt: string | null;
  createdAt: string;
};

// ─── Offers API Request Schemas ──────────────────────────────────
// POST /api/offers (from Chrome extension)

export const scrapedOfferSchema = z.object({
  issuer: z.enum(["amex", "chase", "capital_one", "citi"]),
  cardName: z.string().optional(),
  merchantName: z.string().min(1),
  merchantDomain: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  offerType: z.enum(["cashback", "points_bonus", "discount", "statement_credit"]),
  value: z.number().positive(),
  valueType: z.enum(["percentage", "fixed", "points_multiplier", "points_flat"]),
  minSpend: z.number().optional(),
  maxReward: z.number().optional(),
  useLimit: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  requiresAdd: z.boolean(),
  sourceHash: z.string(),
});

export const offerBatchSchema = z.object({
  offers: z.array(scrapedOfferSchema),
});

export type ScrapedOfferInput = z.infer<typeof scrapedOfferSchema>;
export type OfferBatchInput = z.infer<typeof offerBatchSchema>;

export type OfferBatchResult = {
  deleted: number;
  inserted: number;
  total: number;
  merchantsResolved: number;
  merchantsCreated: number;
};
