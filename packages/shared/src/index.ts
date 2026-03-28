// ─── Spend Categories ────────────────────────────────────────────
export const SPEND_CATEGORIES = [
  "dining",
  "travel",
  "groceries",
  "gas",
  "streaming",
  "online_shopping",
  "drugstores",
  "home_improvement",
  "transit",
  "hotels",
  "airlines",
  "car_rental",
  "general",
] as const;

export type SpendCategory = (typeof SPEND_CATEGORIES)[number];

// ─── Card Issuers ────────────────────────────────────────────────
export const ISSUERS = [
  "amex",
  "chase",
  "capital_one",
  "citi",
  "us_bank",
  "barclays",
  "wells_fargo",
  "bank_of_america",
] as const;

export type Issuer = (typeof ISSUERS)[number];

// ─── Networks ────────────────────────────────────────────────────
export const NETWORKS = ["visa", "mastercard", "amex", "discover"] as const;
export type Network = (typeof NETWORKS)[number];

// ─── Point Programs ──────────────────────────────────────────────
export const POINT_PROGRAMS = {
  chase_ur: { name: "Chase Ultimate Rewards", issuer: "chase" as const },
  amex_mr: { name: "Amex Membership Rewards", issuer: "amex" as const },
  capital_one_miles: { name: "Capital One Miles", issuer: "capital_one" as const },
  citi_typ: { name: "Citi ThankYou Points", issuer: "citi" as const },
  cashback: { name: "Cash Back", issuer: null },
} as const;

// ─── Default Point Valuations (cents per point) ──────────────────
export const DEFAULT_CPP: Record<string, number> = {
  "Chase Ultimate Rewards": 1.5,
  "Amex Membership Rewards": 1.2,
  "Capital One Miles": 1.0,
  "Citi ThankYou Points": 1.0,
  "Cash Back": 1.0,
};

// ─── API Response Types ──────────────────────────────────────────
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

// ─── Offer Scraper Types ─────────────────────────────────────────
export type ScrapedOffer = {
  issuer: Issuer;
  cardName?: string;
  merchantName: string;
  merchantDomain?: string;
  title: string;
  description?: string;
  offerType: "cashback" | "points_bonus" | "discount" | "statement_credit";
  value: number;
  valueType: "percentage" | "fixed" | "points_multiplier" | "points_flat";
  minSpend?: number;
  maxReward?: number;
  useLimit?: number;
  startDate?: string;
  endDate?: string;
  requiresAdd: boolean;
  sourceHash: string;
};

// ─── Extension Message Types ─────────────────────────────────────
export type ExtensionMessage =
  | { type: "OFFERS_SCRAPED"; payload: ScrapedOffer[] }
  | { type: "MERCHANT_LOOKUP"; payload: { domain: string; merchantName: string } }
  | { type: "CHECKOUT_MERCHANT_LOOKUP"; payload: { domain: string } }
  | { type: "AUTH_TOKEN"; payload: { token: string } }
  | { type: "SCRAPE_STATUS"; payload: { issuer: Issuer; status: "started" | "completed" | "error"; count?: number } };

// ─── Checkout Overlay Types ─────────────────────────────────────
export type CardRecommendation = {
  cardName: string;
  issuer: string;
  multiplier: number;
  currency: string;
  merchantName: string;
  category: string;
  isBaseRate: boolean;
};

export type CheckoutLookupResponse = {
  success: boolean;
  recommendation: CardRecommendation | null;
  error?: string;
};

// ─── MCC Mapping ────────────────────────────────────────────────
export {
  getMccCategory,
  getMccDescription,
  getCategoryMccCodes,
  getMccEntry,
  isKnownMccCode,
  getAllMccEntries,
  type MccEntry,
} from "./mcc-mapping";
