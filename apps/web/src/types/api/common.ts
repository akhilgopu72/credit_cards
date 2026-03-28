import { z } from "zod";

// ─── Reusable Sub-Schemas ────────────────────────────────────────
// These mirror the JSONB types defined in the Drizzle schema
// (apps/web/src/server/db/schema/cards.ts) but as Zod schemas
// so they can be used for both validation and type inference.

export const signUpBonusSchema = z.object({
  points: z.number(),
  spend_requirement: z.number(),
  timeframe_months: z.number(),
  currency: z.string(),
});

export type SignUpBonus = z.infer<typeof signUpBonusSchema>;

export const baseEarnRateSchema = z.object({
  points_per_dollar: z.number(),
  currency: z.string(),
});

export type BaseEarnRate = z.infer<typeof baseEarnRateSchema>;

// ─── Issuer Constants ────────────────────────────────────────────

export const ISSUER_COLORS: Record<string, string> = {
  chase: "#003087",
  amex: "#006fcf",
  capital_one: "#d03027",
  citi: "#003b70",
};

export const ISSUER_PALETTE: Record<string, string> = {
  chase: "blue",
  amex: "cyan",
  capital_one: "red",
  citi: "purple",
};

export const ISSUER_LABELS: Record<string, string> = {
  amex: "Amex",
  chase: "Chase",
  capital_one: "Capital One",
  citi: "Citi",
};
