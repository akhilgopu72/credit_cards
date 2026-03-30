import { z } from "zod";
import { SPEND_CATEGORIES, CHASE_CATEGORY_CODES } from "@cardmax/shared";

// ─── Chase-specific transaction schema ──────────────────────────

const chaseTransactionSchema = z.object({
  issuer: z.literal("chase"),
  cardName: z.string().optional(),
  merchantName: z.string().min(1),
  rawDescription: z.string().optional(),
  date: z.string().min(1), // ISO date YYYY-MM-DD
  amount: z.number(),
  category: z.enum(SPEND_CATEGORIES),
  chaseCategoryCode: z.enum(CHASE_CATEGORY_CODES).optional(),
  chaseCategoryLabel: z.string().optional(),
  isOfferRedemption: z.boolean(),
  offerMerchant: z.string().optional(),
  sourceHash: z.string().min(1),
});

// ─── Amex-specific transaction schema (future) ──────────────────

const amexTransactionSchema = z.object({
  issuer: z.literal("amex"),
  cardName: z.string().optional(),
  merchantName: z.string().min(1),
  rawDescription: z.string().optional(),
  date: z.string().min(1),
  amount: z.number(),
  category: z.enum(SPEND_CATEGORIES),
  amexCategory: z.string().optional(),
  rewardsEarned: z.number().optional(),
  sourceHash: z.string().min(1),
});

// ─── Capital One-specific transaction schema (future) ───────────

const capitalOneTransactionSchema = z.object({
  issuer: z.literal("capital_one"),
  cardName: z.string().optional(),
  merchantName: z.string().min(1),
  rawDescription: z.string().optional(),
  date: z.string().min(1),
  amount: z.number(),
  category: z.enum(SPEND_CATEGORIES),
  capitalOneCategory: z.string().optional(),
  milesEarned: z.number().optional(),
  sourceHash: z.string().min(1),
});

// ─── Discriminated union schema ─────────────────────────────────

export const scrapedTransactionSchema = z.discriminatedUnion("issuer", [
  chaseTransactionSchema,
  amexTransactionSchema,
  capitalOneTransactionSchema,
]);

export type ScrapedTransactionInput = z.infer<typeof scrapedTransactionSchema>;

// ─── Batch request schema ───────────────────────────────────────

export const transactionBatchSchema = z.object({
  transactions: z.array(scrapedTransactionSchema).min(1).max(5000),
});

export type TransactionBatchInput = z.infer<typeof transactionBatchSchema>;

// ─── API response types ─────────────────────────────────────────

export type TransactionBatchResult = {
  received: number;
  parsed: number;
  offerRedemptions: number;
  spendByCategory: Record<string, number>;
  spendByMonth: Record<string, number>;
};
