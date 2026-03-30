import { DEFAULT_CPP } from "@cardmax/shared";
import type { BaseEarnRate } from "@/server/db/schema/cards";

// ─── Types ──────────────────────────────────────────────────────

export type Transaction = {
  merchantId?: string;
  merchantName: string;
  merchantCategory: string;
  amount: number;
  date?: string;
};

export type ActiveOffer = {
  id: string;
  valueType: "percentage" | "fixed" | "points" | "points_multiplier" | "points_flat";
  value: number;
  minSpend?: number | null;
  maxReward?: number | null;
  useLimit?: number | null;
  issuer: string;
};

export type UserCard = {
  id: string;
  cardName: string;
  issuer: string;
  pointProgram: string;
  baseEarnRate: BaseEarnRate;
  categoryBonuses: Array<{
    category: string;
    multiplier: number;
  }>;
};

export type RewardResult = {
  cardId: string;
  cardName: string;
  baseReward: number;
  offerReward: number;
  totalPoints: number;
  totalDollarValue: number;
  offerDetails?: {
    offerId: string;
    valueType: string;
    rawReward: number;
  };
};

export type BatchRewardSummary = {
  totalBaseReward: number;
  totalOfferReward: number;
  totalPoints: number;
  totalDollarValue: number;
  perTransaction: RewardResult[];
};

// ─── Helpers ────────────────────────────────────────────────────

const ISSUER_TO_PROGRAM: Record<string, string> = {
  chase: "Chase Ultimate Rewards",
  amex: "Amex Membership Rewards",
  capital_one: "Capital One Miles",
  citi: "Citi ThankYou Points",
};

function getCpp(issuer: string): number {
  const programName = ISSUER_TO_PROGRAM[issuer];
  if (programName && DEFAULT_CPP[programName]) {
    return DEFAULT_CPP[programName];
  }
  return DEFAULT_CPP["Cash Back"] ?? 1.0;
}

// ─── Offer Reward Calculation ───────────────────────────────────

function calculateOfferReward(
  offer: ActiveOffer,
  amount: number
): number {
  // Check minSpend threshold
  if (offer.minSpend && amount < offer.minSpend) {
    return 0;
  }

  switch (offer.valueType) {
    case "fixed": {
      // Earn a fixed dollar amount (e.g., "$10 back")
      return offer.value;
    }
    case "percentage": {
      // Earn a percentage of the transaction (e.g., "5% back")
      const reward = amount * (offer.value / 100);
      return offer.maxReward ? Math.min(reward, offer.maxReward) : reward;
    }
    case "points_multiplier": {
      // Earn N bonus points per dollar spent (e.g., "+3 pts/dollar")
      const reward = amount * offer.value;
      return offer.maxReward ? Math.min(reward, offer.maxReward) : reward;
    }
    case "points_flat": {
      // Earn a flat amount of points (e.g., "700 miles")
      return offer.value;
    }
    case "points": {
      // @deprecated fallback — treat legacy "points" as points_flat
      return offer.value;
    }
    default:
      return 0;
  }
}

// ─── Main: Single Transaction ───────────────────────────────────

/**
 * Calculate rewards for a single transaction on a given card,
 * considering any active offers.
 */
export function calculateTransactionRewards(
  transaction: Transaction,
  userCard: UserCard,
  activeOffers: ActiveOffer[]
): RewardResult {
  const { amount, merchantCategory } = transaction;
  const cpp = getCpp(userCard.issuer);

  // Base reward: find category bonus or fall back to base earn rate
  const categoryBonus = userCard.categoryBonuses.find(
    (b) => b.category === merchantCategory
  );
  const multiplier = categoryBonus?.multiplier ?? userCard.baseEarnRate.points_per_dollar;
  const baseReward = amount * multiplier;

  // Offer reward: pick the best matching offer for this card's issuer
  let bestOfferReward = 0;
  let bestOfferDetail: RewardResult["offerDetails"] | undefined;

  for (const offer of activeOffers) {
    if (offer.issuer !== userCard.issuer) continue;

    const reward = calculateOfferReward(offer, amount);
    if (reward > bestOfferReward) {
      bestOfferReward = reward;
      bestOfferDetail = {
        offerId: offer.id,
        valueType: offer.valueType,
        rawReward: reward,
      };
    }
  }

  // For dollar-based offers (fixed, percentage), convert to points equivalent
  // For points-based offers, they're already in points
  let offerRewardAsPoints: number;
  if (
    bestOfferDetail?.valueType === "fixed" ||
    bestOfferDetail?.valueType === "percentage"
  ) {
    // Dollar value → points: dollars * 100 / cpp
    offerRewardAsPoints = (bestOfferReward * 100) / cpp;
  } else {
    // points_multiplier and points_flat are already in points
    offerRewardAsPoints = bestOfferReward;
  }

  const totalPoints = baseReward + offerRewardAsPoints;
  const totalDollarValue = (totalPoints * cpp) / 100;

  return {
    cardId: userCard.id,
    cardName: userCard.cardName,
    baseReward,
    offerReward: offerRewardAsPoints,
    totalPoints,
    totalDollarValue,
    offerDetails: bestOfferDetail,
  };
}

// ─── Batch Calculation ──────────────────────────────────────────

/**
 * Calculate rewards across multiple transactions for a single card.
 */
export function calculateBatchRewards(
  transactions: Transaction[],
  userCard: UserCard,
  activeOffers: ActiveOffer[]
): BatchRewardSummary {
  const perTransaction: RewardResult[] = [];
  let totalBaseReward = 0;
  let totalOfferReward = 0;
  let totalPoints = 0;
  let totalDollarValue = 0;

  for (const transaction of transactions) {
    const result = calculateTransactionRewards(
      transaction,
      userCard,
      activeOffers
    );
    perTransaction.push(result);
    totalBaseReward += result.baseReward;
    totalOfferReward += result.offerReward;
    totalPoints += result.totalPoints;
    totalDollarValue += result.totalDollarValue;
  }

  return {
    totalBaseReward,
    totalOfferReward,
    totalPoints,
    totalDollarValue,
    perTransaction,
  };
}

// ─── Card Ranking ───────────────────────────────────────────────

/**
 * Rank multiple cards for a single transaction.
 * Returns results sorted by total dollar value (highest first).
 */
export function rankCardsForTransaction(
  transaction: Transaction,
  userCards: UserCard[],
  offersByCard: Map<string, ActiveOffer[]>
): RewardResult[] {
  const results: RewardResult[] = [];

  for (const card of userCards) {
    const offers = offersByCard.get(card.id) ?? [];
    const result = calculateTransactionRewards(transaction, card, offers);
    results.push(result);
  }

  results.sort((a, b) => b.totalDollarValue - a.totalDollarValue);
  return results;
}
