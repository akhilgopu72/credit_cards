// ─── Shared API Types & Schemas ──────────────────────────────────
// Single source of truth for all API request/response shapes.
//
// API routes import schemas for validation + types for responses.
// Frontend pages import types only (no runtime Zod overhead).
//
// Example usage:
//   import type { DashboardStats } from "@/types/api";
//   import { addCardSchema } from "@/types/api";

export {
  signUpBonusSchema,
  baseEarnRateSchema,
  ISSUER_COLORS,
  ISSUER_PALETTE,
  ISSUER_LABELS,
} from "./common";
export type { SignUpBonus, BaseEarnRate } from "./common";

export type {
  DashboardStats,
  CardSummary,
  UpcomingFee,
} from "./dashboard";

export {
  addCardSchema,
  updateCardSchema,
  deleteCardSchema,
} from "./wallet";
export type {
  CardVersion,
  CardProduct,
  WalletCard,
  CategoryBonusItem,
  BenefitItem,
  AddCardRequest,
  UpdateCardRequest,
  DeleteCardRequest,
} from "./wallet";

export {
  scrapedOfferSchema,
  offerBatchSchema,
} from "./offers";
export type {
  Offer,
  ScrapedOfferInput,
  OfferBatchInput,
  OfferBatchResult,
} from "./offers";

export {
  merchantSearchSchema,
} from "./merchants";
export type {
  Merchant,
  MerchantSearchResult,
  CardRanking,
  MerchantOffer,
  MerchantDetail,
  MerchantSearchParams,
} from "./merchants";

export {
  allocationSchema,
  calculateSchema,
  optimizeSchema,
  saveSchema,
  scenarioRequestSchema,
  perkPreferencesSchema,
  recommendSchema,
} from "./scenarios";
export type {
  CalculateRequest,
  OptimizeRequest,
  SaveRequest,
  ScenarioRequest,
  RecommendRequest,
} from "./scenarios";
