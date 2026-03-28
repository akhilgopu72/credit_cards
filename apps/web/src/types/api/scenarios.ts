import { z } from "zod";

// ─── Scenario API Request Schemas ────────────────────────────────
// POST /api/scenarios (calculate/optimize/save)

export const allocationSchema = z.record(z.record(z.number().min(0).max(100)));

export const calculateSchema = z.object({
  action: z.literal("calculate"),
  monthly_spend: z.record(z.number().min(0)),
  allocation: allocationSchema,
});

export const optimizeSchema = z.object({
  action: z.literal("optimize"),
  monthly_spend: z.record(z.number().min(0)),
});

export const saveSchema = z.object({
  action: z.literal("save"),
  name: z.string().min(1),
  description: z.string().optional(),
  monthly_spend: z.record(z.number().min(0)),
  allocation: allocationSchema,
});

export const perkPreferencesSchema = z.object({
  enabled: z.record(z.string(), z.boolean()),
});

export const recommendSchema = z.object({
  monthly_spend: z.record(z.string(), z.number().min(0)),
  perk_preferences: perkPreferencesSchema.optional(),
  max_results: z.number().int().min(1).max(50).optional(),
  include_year1_sub: z.boolean().optional(),
});

export const scenarioRequestSchema = z.discriminatedUnion("action", [
  calculateSchema,
  optimizeSchema,
  saveSchema,
]);

export type CalculateRequest = z.infer<typeof calculateSchema>;
export type OptimizeRequest = z.infer<typeof optimizeSchema>;
export type SaveRequest = z.infer<typeof saveSchema>;
export type ScenarioRequest = z.infer<typeof scenarioRequestSchema>;
export type RecommendRequest = z.infer<typeof recommendSchema>;
