import { DEFAULT_CPP } from "@cardmax/shared";
import type { SignUpBonus, BaseEarnRate } from "@/server/db/schema/cards";
import type { ScenarioResults } from "@/server/db/schema/users";

// ─── Input Types ─────────────────────────────────────────────────

/** A category bonus from a card version */
export type CategoryBonus = {
  category: string;
  multiplier: string; // decimal from DB
  capAmount: string | null;
  capPeriod: "monthly" | "quarterly" | "annually" | "calendar_year" | "none";
};

/** A benefit from a card version */
export type CardBenefit = {
  id: string;
  benefitType: string;
  name: string;
  description: string;
  value: string; // decimal from DB
  frequency: "monthly" | "quarterly" | "semi_annual" | "annual" | "one_time";
};

/** Full card data as fetched from wallet with relations */
export type WalletCard = {
  id: string; // userCard id
  cardId: string; // creditCardProduct id
  nickname: string | null;
  signUpBonusOverride: SignUpBonus | null;
  card: {
    id: string;
    issuer: string;
    name: string;
    slug: string;
    network: string;
    annualFee: string;
    imageUrl: string | null;
    versions: Array<{
      id: string;
      annualFee: string;
      signUpBonus: SignUpBonus | null;
      baseEarnRate: BaseEarnRate;
      isCurrent: boolean;
      categoryBonuses: CategoryBonus[];
      benefits: CardBenefit[];
    }>;
  };
};

/** Allocation: userCardId -> category -> percentage (0-100) */
export type Allocation = Record<string, Record<string, number>>;

export type ScenarioInput = {
  monthly_spend: Record<string, number>;
  cards: WalletCard[];
  allocation: Allocation;
  timeframe_months?: number;
};

// ─── Detailed Output Types ───────────────────────────────────────

export type CategoryBreakdown = {
  category: string;
  monthly_spend: number;
  card_id: string;
  card_name: string;
  allocated_spend: number;
  multiplier: number;
  points_earned_monthly: number;
  points_earned_total: number;
  capped: boolean;
  cap_amount: number | null;
};

export type CardBreakdown = {
  user_card_id: string;
  card_id: string;
  card_name: string;
  issuer: string;
  points_earned: number;
  point_value_dollars: number;
  credits_value: number;
  credits_detail: Array<{
    name: string;
    annual_value: number;
  }>;
  annual_fee: number;
  net_annual_fee: number;
  sign_up_bonus: SignUpBonus | null;
  sign_up_bonus_value: number;
  can_meet_sub_requirement: boolean;
  total_allocated_spend_monthly: number;
};

export type ScenarioOutput = {
  results: ScenarioResults;
  detail: {
    per_card: CardBreakdown[];
    category_breakdown: CategoryBreakdown[];
    timeframe_months: number;
    total_monthly_spend: number;
    net_rewards_value: number;
  };
};

// ─── Credit Benefit Types ────────────────────────────────────────

const CREDIT_BENEFIT_TYPES = new Set([
  "statement_credit",
  "travel_credit",
  "dining_credit",
  "entertainment_credit",
  "hotel_credit",
  "airline_credit",
  "uber_credit",
  "streaming_credit",
  "wellness_credit",
  "shopping_credit",
]);

// ─── Helpers ─────────────────────────────────────────────────────

function getCppForIssuer(issuer: string): number {
  // Map issuer to point program name for DEFAULT_CPP lookup
  const issuerToProgramMap: Record<string, string> = {
    chase: "Chase Ultimate Rewards",
    amex: "Amex Membership Rewards",
    capital_one: "Capital One Miles",
    citi: "Citi ThankYou Points",
  };

  const programName = issuerToProgramMap[issuer];
  if (programName && DEFAULT_CPP[programName]) {
    return DEFAULT_CPP[programName];
  }
  // Default to cash back valuation for unknown issuers
  return DEFAULT_CPP["Cash Back"] ?? 1.0;
}

function annualizeCredits(
  value: number,
  frequency: string
): number {
  switch (frequency) {
    case "monthly":
      return value * 12;
    case "quarterly":
      return value * 4;
    case "semi_annual":
      return value * 2;
    case "annual":
      return value;
    case "one_time":
      return value;
    default:
      return value;
  }
}

/**
 * Compute the cap in monthly spend dollars. For category bonuses with caps,
 * the cap_amount is the max dollars of spend that earn the bonus rate.
 */
function monthlyCap(
  capAmount: string | null,
  capPeriod: string
): number | null {
  if (!capAmount) return null;
  const cap = parseFloat(capAmount);
  if (isNaN(cap) || cap <= 0) return null;

  switch (capPeriod) {
    case "monthly":
      return cap;
    case "quarterly":
      return cap / 3;
    case "annually":
    case "calendar_year":
      return cap / 12;
    case "none":
      return null;
    default:
      return null;
  }
}

// ─── Main Calculation ────────────────────────────────────────────

export function calculateScenario(input: ScenarioInput): ScenarioOutput {
  const {
    monthly_spend,
    cards,
    allocation,
    timeframe_months = 12,
  } = input;

  const categoryBreakdowns: CategoryBreakdown[] = [];
  // cardId (userCard.id) -> accumulated monthly points
  const cardPointsMonthly: Record<string, number> = {};

  // Initialize card points
  for (const walletCard of cards) {
    cardPointsMonthly[walletCard.id] = 0;
  }

  // Step 1: For each category, calculate points earned per card
  for (const [category, monthlyAmount] of Object.entries(monthly_spend)) {
    if (monthlyAmount <= 0) continue;

    for (const walletCard of cards) {
      const cardAllocation = allocation[walletCard.id];
      if (!cardAllocation) continue;

      const pct = cardAllocation[category];
      if (!pct || pct <= 0) continue;

      const allocatedSpend = monthlyAmount * (pct / 100);

      // Get current version
      const currentVersion = walletCard.card.versions.find(
        (v) => v.isCurrent
      );
      if (!currentVersion) continue;

      // Find category-specific multiplier
      const categoryBonus = currentVersion.categoryBonuses.find(
        (b) => b.category === category
      );

      const multiplier = categoryBonus
        ? parseFloat(categoryBonus.multiplier)
        : currentVersion.baseEarnRate.points_per_dollar;

      // Apply cap if present
      let effectiveSpend = allocatedSpend;
      let capped = false;
      let capAmountValue: number | null = null;

      if (categoryBonus) {
        const mCap = monthlyCap(
          categoryBonus.capAmount,
          categoryBonus.capPeriod
        );
        if (mCap !== null) {
          capAmountValue = mCap;
          if (allocatedSpend > mCap) {
            // Spend over cap earns at base rate
            const overCap = allocatedSpend - mCap;
            const baseRate = currentVersion.baseEarnRate.points_per_dollar;
            const pointsFromBonus = mCap * multiplier;
            const pointsFromBase = overCap * baseRate;
            const totalMonthlyPoints = pointsFromBonus + pointsFromBase;

            cardPointsMonthly[walletCard.id] += totalMonthlyPoints;

            categoryBreakdowns.push({
              category,
              monthly_spend: monthlyAmount,
              card_id: walletCard.cardId,
              card_name: walletCard.card.name,
              allocated_spend: allocatedSpend,
              multiplier,
              points_earned_monthly: totalMonthlyPoints,
              points_earned_total: totalMonthlyPoints * timeframe_months,
              capped: true,
              cap_amount: mCap,
            });
            capped = true;
          }
        }
      }

      if (!capped) {
        const pointsEarned = effectiveSpend * multiplier;
        cardPointsMonthly[walletCard.id] += pointsEarned;

        categoryBreakdowns.push({
          category,
          monthly_spend: monthlyAmount,
          card_id: walletCard.cardId,
          card_name: walletCard.card.name,
          allocated_spend: allocatedSpend,
          multiplier,
          points_earned_monthly: pointsEarned,
          points_earned_total: pointsEarned * timeframe_months,
          capped: false,
          cap_amount: capAmountValue,
        });
      }
    }
  }

  // Step 2: Build per-card breakdown
  const perCardBreakdowns: CardBreakdown[] = [];
  let totalPoints = 0;
  let totalCashback = 0;
  let totalCreditsValue = 0;
  let totalAnnualFees = 0;
  let totalMonthlySpendAllCards = 0;

  for (const walletCard of cards) {
    const currentVersion = walletCard.card.versions.find(
      (v) => v.isCurrent
    );
    if (!currentVersion) continue;

    const monthlyPoints = cardPointsMonthly[walletCard.id] ?? 0;
    const totalCardPoints = monthlyPoints * timeframe_months;

    // Calculate point value in dollars
    const cpp = getCppForIssuer(walletCard.card.issuer);
    const pointValueDollars = (totalCardPoints * cpp) / 100;

    // Calculate total credits (annual value)
    const creditsDetail: Array<{ name: string; annual_value: number }> = [];
    let cardCreditsValue = 0;

    for (const benefit of currentVersion.benefits) {
      if (CREDIT_BENEFIT_TYPES.has(benefit.benefitType)) {
        const annualValue = annualizeCredits(
          parseFloat(benefit.value),
          benefit.frequency
        );
        creditsDetail.push({
          name: benefit.name,
          annual_value: annualValue,
        });
        cardCreditsValue += annualValue;
      }
    }

    // Pro-rate credits to timeframe
    const creditsForTimeframe =
      cardCreditsValue * (timeframe_months / 12);

    // Annual fee from the current version
    const annualFee = parseFloat(currentVersion.annualFee);
    const annualFeeForTimeframe = annualFee * (timeframe_months / 12);

    const netAnnualFee = annualFeeForTimeframe - creditsForTimeframe;

    // Sign-up bonus
    const signUpBonus =
      walletCard.signUpBonusOverride ??
      currentVersion.signUpBonus ??
      null;

    let signUpBonusValue = 0;
    let canMeetSubRequirement = false;

    if (signUpBonus) {
      signUpBonusValue = (signUpBonus.points * cpp) / 100;

      // Calculate total spend allocated to this card per month
      const cardAllocation = allocation[walletCard.id] ?? {};
      let monthlySpendOnCard = 0;
      for (const [category, pct] of Object.entries(cardAllocation)) {
        const catSpend = monthly_spend[category] ?? 0;
        monthlySpendOnCard += catSpend * (pct / 100);
      }

      const totalSpendInTimeframe =
        monthlySpendOnCard * signUpBonus.timeframe_months;
      canMeetSubRequirement =
        totalSpendInTimeframe >= signUpBonus.spend_requirement;
    }

    // Calculate total monthly spend allocated to this card
    const cardAllocation = allocation[walletCard.id] ?? {};
    let totalAllocatedSpendMonthly = 0;
    for (const [category, pct] of Object.entries(cardAllocation)) {
      const catSpend = monthly_spend[category] ?? 0;
      totalAllocatedSpendMonthly += catSpend * (pct / 100);
    }
    totalMonthlySpendAllCards += totalAllocatedSpendMonthly;

    const cardBreakdown: CardBreakdown = {
      user_card_id: walletCard.id,
      card_id: walletCard.cardId,
      card_name: walletCard.card.name,
      issuer: walletCard.card.issuer,
      points_earned: totalCardPoints,
      point_value_dollars: pointValueDollars,
      credits_value: creditsForTimeframe,
      credits_detail: creditsDetail,
      annual_fee: annualFeeForTimeframe,
      net_annual_fee: netAnnualFee,
      sign_up_bonus: signUpBonus,
      sign_up_bonus_value: signUpBonusValue,
      can_meet_sub_requirement: canMeetSubRequirement,
      total_allocated_spend_monthly: totalAllocatedSpendMonthly,
    };

    perCardBreakdowns.push(cardBreakdown);

    totalPoints += totalCardPoints;
    totalCashback += pointValueDollars;
    totalCreditsValue += creditsForTimeframe;
    totalAnnualFees += annualFeeForTimeframe;
  }

  const netRewardsValue = totalCashback + totalCreditsValue - totalAnnualFees;

  // Build ScenarioResults (the type stored in DB)
  const results: ScenarioResults = {
    total_points: Math.round(totalPoints),
    total_cashback: Math.round(totalCashback * 100) / 100,
    per_card: perCardBreakdowns.map((cb) => ({
      card_id: cb.card_id,
      points: Math.round(cb.points_earned),
      cashback: Math.round(cb.point_value_dollars * 100) / 100,
      credits_value: Math.round(cb.credits_value * 100) / 100,
      net_annual_fee: Math.round(cb.net_annual_fee * 100) / 100,
    })),
    calculated_at: new Date().toISOString(),
  };

  return {
    results,
    detail: {
      per_card: perCardBreakdowns,
      category_breakdown: categoryBreakdowns,
      timeframe_months,
      total_monthly_spend: totalMonthlySpendAllCards,
      net_rewards_value: Math.round(netRewardsValue * 100) / 100,
    },
  };
}

// ─── Auto-Optimize ───────────────────────────────────────────────

/**
 * For each spend category, assigns 100% to the card with the highest
 * effective multiplier for that category, producing the optimal allocation.
 */
export function autoOptimize(
  monthly_spend: Record<string, number>,
  cards: WalletCard[]
): Allocation {
  const allocation: Allocation = {};

  // Initialize allocation for all cards with empty categories
  for (const walletCard of cards) {
    allocation[walletCard.id] = {};
  }

  const categories = Object.keys(monthly_spend);

  for (const category of categories) {
    let bestCardId: string | null = null;
    let bestMultiplier = -1;

    for (const walletCard of cards) {
      const currentVersion = walletCard.card.versions.find(
        (v) => v.isCurrent
      );
      if (!currentVersion) continue;

      const categoryBonus = currentVersion.categoryBonuses.find(
        (b) => b.category === category
      );

      const multiplier = categoryBonus
        ? parseFloat(categoryBonus.multiplier)
        : currentVersion.baseEarnRate.points_per_dollar;

      if (multiplier > bestMultiplier) {
        bestMultiplier = multiplier;
        bestCardId = walletCard.id;
      }
    }

    // Assign 100% of category spend to the best card
    if (bestCardId) {
      allocation[bestCardId][category] = 100;
      // Set 0 for all other cards for this category
      for (const walletCard of cards) {
        if (walletCard.id !== bestCardId) {
          allocation[walletCard.id][category] = 0;
        }
      }
    }
  }

  return allocation;
}

/**
 * Generate a "uniform" allocation where spend is distributed evenly
 * across all cards for each category.
 */
export function uniformAllocation(
  monthly_spend: Record<string, number>,
  cards: WalletCard[]
): Allocation {
  const allocation: Allocation = {};
  const pctPerCard = cards.length > 0 ? 100 / cards.length : 0;

  for (const walletCard of cards) {
    allocation[walletCard.id] = {};
    for (const category of Object.keys(monthly_spend)) {
      allocation[walletCard.id][category] = pctPerCard;
    }
  }

  return allocation;
}

// ─── Perk Valuation System ──────────────────────────────────────

/**
 * Three tiers of benefit valuation:
 * - auto:     Always counted (statement credits, travel credits, etc.)
 * - toggle:   User chooses whether they'd actually use these perks
 * - excluded: Never counted (too hard to quantify: insurance, lounge, etc.)
 */
export type PerkTier = "auto" | "toggle" | "excluded";

const PERK_TIER_MAP: Record<string, PerkTier> = {
  statement_credit: "auto",
  travel_credit: "auto",
  dining_credit: "auto",
  uber_credit: "auto",
  streaming_credit: "auto",
  entertainment_credit: "toggle",
  hotel_credit: "toggle",
  airline_credit: "toggle",
  wellness_credit: "toggle",
  shopping_credit: "toggle",
  insurance: "excluded",
  perk: "excluded",
  lounge_access: "excluded",
};

/** User's perk preferences: which toggleable perks they actually use */
export type PerkPreferences = {
  /** benefit type -> enabled */
  enabled: Record<string, boolean>;
};

export const DEFAULT_PERK_PREFERENCES: PerkPreferences = {
  enabled: {
    entertainment_credit: false,
    hotel_credit: false,
    airline_credit: true,
    wellness_credit: false,
    shopping_credit: true,
  },
};

function getPerkTier(benefitType: string): PerkTier {
  return PERK_TIER_MAP[benefitType] ?? "excluded";
}

function isBenefitValued(
  benefitType: string,
  prefs: PerkPreferences
): boolean {
  const tier = getPerkTier(benefitType);
  if (tier === "auto") return true;
  if (tier === "excluded") return false;
  return prefs.enabled[benefitType] ?? false;
}

// ─── Mode 2: Card Recommendation Engine ────────────────────────

/** Card data from the full catalog (no wallet wrapper) */
export type CatalogCard = {
  id: string;
  issuer: string;
  name: string;
  slug: string;
  network: string;
  annualFee: string;
  imageUrl: string | null;
  affiliateUrl: string | null;
  versions: Array<{
    id: string;
    annualFee: string;
    signUpBonus: SignUpBonus | null;
    baseEarnRate: BaseEarnRate;
    isCurrent: boolean;
    categoryBonuses: CategoryBonus[];
    benefits: CardBenefit[];
  }>;
};

/** Per-category reward breakdown for a single card */
export type CategoryRewardDetail = {
  category: string;
  monthly_spend: number;
  multiplier: number;
  points_monthly: number;
  points_annual: number;
  dollar_value_annual: number;
  capped: boolean;
  cap_amount_monthly: number | null;
};

/** Benefit valuation detail for a single card */
export type BenefitDetail = {
  name: string;
  benefit_type: string;
  annual_value: number;
  tier: PerkTier;
  included: boolean;
};

/** Full evaluation of a card against a spend profile */
export type CardEvaluation = {
  card_id: string;
  card_name: string;
  issuer: string;
  slug: string;
  network: string;
  image_url: string | null;
  affiliate_url: string | null;
  annual_fee: number;
  // Reward earnings
  total_points_annual: number;
  rewards_value_annual: number;
  category_rewards: CategoryRewardDetail[];
  // Benefits
  credits_value_annual: number;
  benefits_detail: BenefitDetail[];
  // Sign-up bonus (year 1)
  sign_up_bonus: SignUpBonus | null;
  sign_up_bonus_value: number;
  can_meet_sub_requirement: boolean;
  // Net value
  net_value_year1: number;
  net_value_ongoing: number;
};

export type RecommendInput = {
  monthly_spend: Record<string, number>;
  perk_preferences?: PerkPreferences;
  max_results?: number;
  include_year1_sub?: boolean;
};

export type RecommendOutput = {
  recommendations: CardEvaluation[];
  spend_profile: Record<string, number>;
  total_monthly_spend: number;
  perk_preferences: PerkPreferences;
};

/**
 * Evaluate a single card from the full catalog against a spend profile.
 * This is the core function for Mode 2 (Recommend Cards).
 *
 * Net value = annual_rewards + annual_credits + SUB(year1) - annual_fee
 */
export function evaluateCardForSpendProfile(
  card: CatalogCard,
  monthlySpend: Record<string, number>,
  perkPrefs: PerkPreferences = DEFAULT_PERK_PREFERENCES
): CardEvaluation {
  const currentVersion = card.versions.find((v) => v.isCurrent);
  if (!currentVersion) {
    return emptyEvaluation(card);
  }

  const cpp = getCppForIssuer(card.issuer);

  // Step 1: Calculate reward earnings per category
  const categoryRewards: CategoryRewardDetail[] = [];
  let totalPointsAnnual = 0;

  for (const [category, monthlyAmount] of Object.entries(monthlySpend)) {
    if (monthlyAmount <= 0) continue;

    const categoryBonus = currentVersion.categoryBonuses.find(
      (b) => b.category === category
    );

    const multiplier = categoryBonus
      ? parseFloat(categoryBonus.multiplier)
      : currentVersion.baseEarnRate.points_per_dollar;

    let pointsMonthly: number;
    let capped = false;
    let capAmountMonthly: number | null = null;

    if (categoryBonus) {
      const mCap = monthlyCap(categoryBonus.capAmount, categoryBonus.capPeriod);
      if (mCap !== null) {
        capAmountMonthly = mCap;
        if (monthlyAmount > mCap) {
          capped = true;
          const baseRate = currentVersion.baseEarnRate.points_per_dollar;
          pointsMonthly = mCap * multiplier + (monthlyAmount - mCap) * baseRate;
        } else {
          pointsMonthly = monthlyAmount * multiplier;
        }
      } else {
        pointsMonthly = monthlyAmount * multiplier;
      }
    } else {
      pointsMonthly = monthlyAmount * multiplier;
    }

    const pointsAnnual = pointsMonthly * 12;
    totalPointsAnnual += pointsAnnual;

    categoryRewards.push({
      category,
      monthly_spend: monthlyAmount,
      multiplier,
      points_monthly: Math.round(pointsMonthly * 100) / 100,
      points_annual: Math.round(pointsAnnual * 100) / 100,
      dollar_value_annual: Math.round((pointsAnnual * cpp) / 100 * 100) / 100,
      capped,
      cap_amount_monthly: capAmountMonthly,
    });
  }

  const rewardsValueAnnual = (totalPointsAnnual * cpp) / 100;

  // Step 2: Calculate benefit/credit value
  const benefitsDetail: BenefitDetail[] = [];
  let creditsValueAnnual = 0;

  for (const benefit of currentVersion.benefits) {
    const tier = getPerkTier(benefit.benefitType);
    const included = isBenefitValued(benefit.benefitType, perkPrefs);
    const annualValue = annualizeCredits(
      parseFloat(benefit.value),
      benefit.frequency
    );

    benefitsDetail.push({
      name: benefit.name,
      benefit_type: benefit.benefitType,
      annual_value: annualValue,
      tier,
      included,
    });

    if (included) {
      creditsValueAnnual += annualValue;
    }
  }

  // Step 3: Annual fee
  const annualFee = parseFloat(currentVersion.annualFee);

  // Step 4: Sign-up bonus (year 1 only)
  const signUpBonus = currentVersion.signUpBonus ?? null;
  let signUpBonusValue = 0;
  let canMeetSubRequirement = false;

  if (signUpBonus) {
    signUpBonusValue = (signUpBonus.points * cpp) / 100;

    // Check if total monthly spend can meet the SUB requirement in the timeframe
    const totalMonthlySpend = Object.values(monthlySpend).reduce(
      (sum, v) => sum + v,
      0
    );
    const totalSpendInTimeframe =
      totalMonthlySpend * signUpBonus.timeframe_months;
    canMeetSubRequirement =
      totalSpendInTimeframe >= signUpBonus.spend_requirement;
  }

  // Step 5: Net value calculations
  const subValueYear1 = canMeetSubRequirement ? signUpBonusValue : 0;
  const netValueYear1 =
    rewardsValueAnnual + creditsValueAnnual + subValueYear1 - annualFee;
  const netValueOngoing = rewardsValueAnnual + creditsValueAnnual - annualFee;

  return {
    card_id: card.id,
    card_name: card.name,
    issuer: card.issuer,
    slug: card.slug,
    network: card.network,
    image_url: card.imageUrl,
    affiliate_url: card.affiliateUrl,
    annual_fee: annualFee,
    total_points_annual: Math.round(totalPointsAnnual),
    rewards_value_annual: Math.round(rewardsValueAnnual * 100) / 100,
    category_rewards: categoryRewards,
    credits_value_annual: Math.round(creditsValueAnnual * 100) / 100,
    benefits_detail: benefitsDetail,
    sign_up_bonus: signUpBonus,
    sign_up_bonus_value: Math.round(signUpBonusValue * 100) / 100,
    can_meet_sub_requirement: canMeetSubRequirement,
    net_value_year1: Math.round(netValueYear1 * 100) / 100,
    net_value_ongoing: Math.round(netValueOngoing * 100) / 100,
  };
}

function emptyEvaluation(card: CatalogCard): CardEvaluation {
  return {
    card_id: card.id,
    card_name: card.name,
    issuer: card.issuer,
    slug: card.slug,
    network: card.network,
    image_url: card.imageUrl,
    affiliate_url: card.affiliateUrl,
    annual_fee: 0,
    total_points_annual: 0,
    rewards_value_annual: 0,
    category_rewards: [],
    credits_value_annual: 0,
    benefits_detail: [],
    sign_up_bonus: null,
    sign_up_bonus_value: 0,
    can_meet_sub_requirement: false,
    net_value_year1: 0,
    net_value_ongoing: 0,
  };
}

/**
 * Evaluate all cards in the catalog and return ranked recommendations.
 * Sorted by net_value_year1 descending (best value first).
 */
export function recommendCards(input: RecommendInput, catalog: CatalogCard[]): RecommendOutput {
  const {
    monthly_spend,
    perk_preferences = DEFAULT_PERK_PREFERENCES,
    max_results = 20,
    include_year1_sub = true,
  } = input;

  const evaluations = catalog.map((card) =>
    evaluateCardForSpendProfile(card, monthly_spend, perk_preferences)
  );

  // Sort by year1 value (includes SUB) or ongoing value
  evaluations.sort((a, b) => {
    const aVal = include_year1_sub ? a.net_value_year1 : a.net_value_ongoing;
    const bVal = include_year1_sub ? b.net_value_year1 : b.net_value_ongoing;
    return bVal - aVal;
  });

  const totalMonthlySpend = Object.values(monthly_spend).reduce(
    (sum, v) => sum + v,
    0
  );

  return {
    recommendations: evaluations.slice(0, max_results),
    spend_profile: monthly_spend,
    total_monthly_spend: totalMonthlySpend,
    perk_preferences: perk_preferences,
  };
}

// ─── Enhanced Mode 1: Net-Value-Aware Optimizer ─────────────────

/**
 * Enhanced auto-optimize that factors in net value.
 * After greedy multiplier assignment, drops cards whose net contribution
 * is negative (annual fee exceeds the value of their allocated rewards + credits),
 * and reassigns those categories to the next-best card.
 */
export function autoOptimizeNetValue(
  monthly_spend: Record<string, number>,
  cards: WalletCard[],
  perkPrefs: PerkPreferences = DEFAULT_PERK_PREFERENCES
): { allocation: Allocation; dropped_cards: string[] } {
  const droppedCards: string[] = [];
  let activeCards = [...cards];

  // Iterate: assign greedily, then prune negative-value cards
  let stable = false;
  let allocation: Allocation = {};

  while (!stable && activeCards.length > 0) {
    // Greedy assignment: each category to highest multiplier
    allocation = autoOptimize(monthly_spend, activeCards);

    // Compute net value per card with this allocation
    const cardsToRemove: string[] = [];

    for (const walletCard of activeCards) {
      const currentVersion = walletCard.card.versions.find(
        (v) => v.isCurrent
      );
      if (!currentVersion) continue;

      const cpp = getCppForIssuer(walletCard.card.issuer);
      const cardAlloc = allocation[walletCard.id] ?? {};

      // Calculate annual rewards from allocated spend
      let annualRewards = 0;
      for (const [category, pct] of Object.entries(cardAlloc)) {
        if (pct <= 0) continue;
        const catSpend = monthly_spend[category] ?? 0;
        const allocatedSpend = catSpend * (pct / 100);

        const categoryBonus = currentVersion.categoryBonuses.find(
          (b) => b.category === category
        );
        const multiplier = categoryBonus
          ? parseFloat(categoryBonus.multiplier)
          : currentVersion.baseEarnRate.points_per_dollar;

        let pointsMonthly: number;
        if (categoryBonus) {
          const mCap = monthlyCap(categoryBonus.capAmount, categoryBonus.capPeriod);
          if (mCap !== null && allocatedSpend > mCap) {
            const baseRate = currentVersion.baseEarnRate.points_per_dollar;
            pointsMonthly = mCap * multiplier + (allocatedSpend - mCap) * baseRate;
          } else {
            pointsMonthly = allocatedSpend * multiplier;
          }
        } else {
          pointsMonthly = allocatedSpend * multiplier;
        }

        annualRewards += (pointsMonthly * 12 * cpp) / 100;
      }

      // Calculate credits value
      let creditsValue = 0;
      for (const benefit of currentVersion.benefits) {
        if (isBenefitValued(benefit.benefitType, perkPrefs)) {
          creditsValue += annualizeCredits(
            parseFloat(benefit.value),
            benefit.frequency
          );
        }
      }

      const annualFee = parseFloat(currentVersion.annualFee);
      const netValue = annualRewards + creditsValue - annualFee;

      // Only drop cards with fees that aren't justified
      // (don't drop no-fee cards even if they earn nothing in this allocation)
      if (netValue < 0 && annualFee > 0 && activeCards.length > 1) {
        cardsToRemove.push(walletCard.id);
      }
    }

    if (cardsToRemove.length === 0) {
      stable = true;
    } else {
      droppedCards.push(...cardsToRemove);
      activeCards = activeCards.filter(
        (c) => !cardsToRemove.includes(c.id)
      );
    }
  }

  return { allocation, dropped_cards: droppedCards };
}
