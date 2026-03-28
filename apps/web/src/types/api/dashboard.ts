import type { SignUpBonus } from "./common";

// ─── Dashboard API Response Types ────────────────────────────────
// GET /api/dashboard

export type UpcomingFee = {
  cardName: string;
  annualFee: string;
  feeDate: string | null;
};

export type CardSummary = {
  userCardId: string;
  cardName: string;
  issuer: string;
  annualFee: string;
  totalCreditsValue: number;
  benefitsCount: number;
  bonusesCount: number;
  signUpBonus: SignUpBonus | null;
};

export type DashboardStats = {
  cardsCount: number;
  totalCreditsAvailable: number;
  totalCreditsUsed: number;
  activeOffersCount: number;
  upcomingFees: UpcomingFee[];
  cardSummaries: CardSummary[];
};
