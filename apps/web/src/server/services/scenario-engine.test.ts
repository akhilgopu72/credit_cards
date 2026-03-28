import { describe, it, expect } from "vitest";
import { DEFAULT_CPP } from "@cardmax/shared";
import type { SignUpBonus, BaseEarnRate } from "@/server/db/schema/cards";
import {
  calculateScenario,
  autoOptimize,
  uniformAllocation,
  evaluateCardForSpendProfile,
  recommendCards,
  autoOptimizeNetValue,
  DEFAULT_PERK_PREFERENCES,
  type WalletCard,
  type CatalogCard,
  type CategoryBonus,
  type CardBenefit,
  type Allocation,
  type PerkPreferences,
} from "./scenario-engine";

// ─── Test Fixture Helpers ─────────────────────────────────────────

function mockCardVersion(
  overrides: Partial<{
    id: string;
    annualFee: string;
    signUpBonus: SignUpBonus | null;
    baseEarnRate: BaseEarnRate;
    isCurrent: boolean;
    categoryBonuses: CategoryBonus[];
    benefits: CardBenefit[];
  }> = {}
) {
  return {
    id: overrides.id ?? "version-1",
    annualFee: overrides.annualFee ?? "0",
    signUpBonus: overrides.signUpBonus ?? null,
    baseEarnRate: overrides.baseEarnRate ?? {
      points_per_dollar: 1,
      currency: "points",
    },
    isCurrent: overrides.isCurrent ?? true,
    categoryBonuses: overrides.categoryBonuses ?? [],
    benefits: overrides.benefits ?? [],
  };
}

function mockWalletCard(
  overrides: Partial<{
    id: string;
    cardId: string;
    nickname: string | null;
    signUpBonusOverride: SignUpBonus | null;
    issuer: string;
    name: string;
    slug: string;
    network: string;
    annualFee: string;
    imageUrl: string | null;
    versions: ReturnType<typeof mockCardVersion>[];
  }> = {}
): WalletCard {
  const versions = overrides.versions ?? [mockCardVersion()];
  return {
    id: overrides.id ?? "wallet-card-1",
    cardId: overrides.cardId ?? "card-1",
    nickname: overrides.nickname ?? null,
    signUpBonusOverride: overrides.signUpBonusOverride ?? null,
    card: {
      id: overrides.cardId ?? "card-1",
      issuer: overrides.issuer ?? "chase",
      name: overrides.name ?? "Test Card",
      slug: overrides.slug ?? "test-card",
      network: overrides.network ?? "visa",
      annualFee: overrides.annualFee ?? "0",
      imageUrl: overrides.imageUrl ?? null,
      versions,
    },
  };
}

function mockCatalogCard(
  overrides: Partial<{
    id: string;
    issuer: string;
    name: string;
    slug: string;
    network: string;
    annualFee: string;
    imageUrl: string | null;
    affiliateUrl: string | null;
    versions: ReturnType<typeof mockCardVersion>[];
  }> = {}
): CatalogCard {
  return {
    id: overrides.id ?? "card-1",
    issuer: overrides.issuer ?? "chase",
    name: overrides.name ?? "Test Card",
    slug: overrides.slug ?? "test-card",
    network: overrides.network ?? "visa",
    annualFee: overrides.annualFee ?? "0",
    imageUrl: overrides.imageUrl ?? null,
    affiliateUrl: overrides.affiliateUrl ?? null,
    versions: overrides.versions ?? [mockCardVersion()],
  };
}

function mockBenefit(
  overrides: Partial<CardBenefit> = {}
): CardBenefit {
  return {
    id: overrides.id ?? "benefit-1",
    benefitType: overrides.benefitType ?? "statement_credit",
    name: overrides.name ?? "Test Credit",
    description: overrides.description ?? "A test credit benefit",
    value: overrides.value ?? "100",
    frequency: overrides.frequency ?? "annual",
  };
}

// ─── evaluateCardForSpendProfile() ────────────────────────────────

describe("evaluateCardForSpendProfile", () => {
  it("evaluates a basic spend profile with dining and groceries", () => {
    const card = mockCatalogCard({
      issuer: "chase",
      name: "Sapphire Preferred",
      versions: [
        mockCardVersion({
          annualFee: "95",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "dining",
              multiplier: "3",
              capAmount: null,
              capPeriod: "none",
            },
            {
              category: "groceries",
              multiplier: "2",
              capAmount: null,
              capPeriod: "none",
            },
          ],
        }),
      ],
    });

    const spend = { dining: 500, groceries: 600 };
    const result = evaluateCardForSpendProfile(card, spend);

    // dining: 500 * 3 = 1500 pts/mo, groceries: 600 * 2 = 1200 pts/mo
    // Annual: (1500 + 1200) * 12 = 32400 pts
    expect(result.total_points_annual).toBe(32400);

    // Chase CPP = 1.5
    // Value: 32400 * 1.5 / 100 = $486
    expect(result.rewards_value_annual).toBe(486);

    // Net ongoing: 486 - 95 = $391
    expect(result.net_value_ongoing).toBe(391);

    // Category breakdown should have 2 entries
    expect(result.category_rewards).toHaveLength(2);

    const diningReward = result.category_rewards.find(
      (r) => r.category === "dining"
    );
    expect(diningReward).toBeDefined();
    expect(diningReward!.multiplier).toBe(3);
    expect(diningReward!.points_monthly).toBe(1500);
    expect(diningReward!.capped).toBe(false);
  });

  it("uses base earn rate when card has no category bonuses", () => {
    const card = mockCatalogCard({
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1.5, currency: "points" },
          categoryBonuses: [],
        }),
      ],
    });

    const spend = { dining: 400, groceries: 300, gas: 200 };
    const result = evaluateCardForSpendProfile(card, spend);

    // All categories at base rate: (400 + 300 + 200) * 1.5 = 1350 pts/mo
    // Annual: 1350 * 12 = 16200 pts
    expect(result.total_points_annual).toBe(16200);

    // Every category should use the base multiplier
    for (const reward of result.category_rewards) {
      expect(reward.multiplier).toBe(1.5);
    }
  });

  it("handles multiple category bonuses with different multipliers", () => {
    const card = mockCatalogCard({
      issuer: "amex",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "dining",
              multiplier: "4",
              capAmount: null,
              capPeriod: "none",
            },
            {
              category: "groceries",
              multiplier: "6",
              capAmount: null,
              capPeriod: "none",
            },
            {
              category: "transit",
              multiplier: "3",
              capAmount: null,
              capPeriod: "none",
            },
          ],
        }),
      ],
    });

    const spend = { dining: 300, groceries: 500, transit: 100, gas: 200 };
    const result = evaluateCardForSpendProfile(card, spend);

    const diningReward = result.category_rewards.find(
      (r) => r.category === "dining"
    );
    const groceryReward = result.category_rewards.find(
      (r) => r.category === "groceries"
    );
    const transitReward = result.category_rewards.find(
      (r) => r.category === "transit"
    );
    const gasReward = result.category_rewards.find(
      (r) => r.category === "gas"
    );

    expect(diningReward!.multiplier).toBe(4);
    expect(groceryReward!.multiplier).toBe(6);
    expect(transitReward!.multiplier).toBe(3);
    expect(gasReward!.multiplier).toBe(1); // base rate
  });

  describe("capped category bonuses", () => {
    it("applies full bonus rate when spend is below cap", () => {
      const card = mockCatalogCard({
        issuer: "chase",
        versions: [
          mockCardVersion({
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
            categoryBonuses: [
              {
                category: "groceries",
                multiplier: "5",
                capAmount: "1500",
                capPeriod: "quarterly",
              },
            ],
          }),
        ],
      });

      // Quarterly cap $1500 -> monthly cap = $500
      // Spend $400/mo which is below $500 cap
      const spend = { groceries: 400 };
      const result = evaluateCardForSpendProfile(card, spend);

      const groceryReward = result.category_rewards.find(
        (r) => r.category === "groceries"
      );
      expect(groceryReward!.capped).toBe(false);
      // 400 * 5 = 2000 pts/mo
      expect(groceryReward!.points_monthly).toBe(2000);
      expect(groceryReward!.cap_amount_monthly).toBe(500);
    });

    it("splits earnings at bonus and base rate when spend exceeds cap", () => {
      const card = mockCatalogCard({
        issuer: "chase",
        versions: [
          mockCardVersion({
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
            categoryBonuses: [
              {
                category: "groceries",
                multiplier: "5",
                capAmount: "1500",
                capPeriod: "quarterly",
              },
            ],
          }),
        ],
      });

      // Quarterly cap $1500 -> monthly cap = $500
      // Spend $800/mo which exceeds $500 cap
      const spend = { groceries: 800 };
      const result = evaluateCardForSpendProfile(card, spend);

      const groceryReward = result.category_rewards.find(
        (r) => r.category === "groceries"
      );
      expect(groceryReward!.capped).toBe(true);
      // $500 at 5x = 2500 pts + $300 at 1x = 300 pts = 2800 pts/mo
      expect(groceryReward!.points_monthly).toBe(2800);
    });

    it("converts annual cap to monthly correctly", () => {
      const card = mockCatalogCard({
        issuer: "chase",
        versions: [
          mockCardVersion({
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
            categoryBonuses: [
              {
                category: "dining",
                multiplier: "3",
                capAmount: "6000",
                capPeriod: "annually",
              },
            ],
          }),
        ],
      });

      // Annual cap $6000 -> monthly = $500
      // Spend $600/mo exceeds $500 cap
      const spend = { dining: 600 };
      const result = evaluateCardForSpendProfile(card, spend);

      const diningReward = result.category_rewards.find(
        (r) => r.category === "dining"
      );
      expect(diningReward!.capped).toBe(true);
      expect(diningReward!.cap_amount_monthly).toBe(500);
      // $500 at 3x = 1500, $100 at 1x = 100, total = 1600
      expect(diningReward!.points_monthly).toBe(1600);
    });

    it("treats capPeriod 'none' as unlimited (no cap)", () => {
      const card = mockCatalogCard({
        issuer: "chase",
        versions: [
          mockCardVersion({
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
            categoryBonuses: [
              {
                category: "dining",
                multiplier: "3",
                capAmount: "500",
                capPeriod: "none",
              },
            ],
          }),
        ],
      });

      const spend = { dining: 1000 };
      const result = evaluateCardForSpendProfile(card, spend);

      const diningReward = result.category_rewards.find(
        (r) => r.category === "dining"
      );
      // capPeriod "none" means no cap applied, full bonus on all spend
      expect(diningReward!.capped).toBe(false);
      expect(diningReward!.points_monthly).toBe(3000);
    });
  });

  describe("sign-up bonus", () => {
    it("includes SUB in year1 value when spend requirement is meetable", () => {
      const card = mockCatalogCard({
        issuer: "chase",
        versions: [
          mockCardVersion({
            annualFee: "95",
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
            signUpBonus: {
              points: 60000,
              spend_requirement: 4000,
              timeframe_months: 3,
              currency: "points",
            },
          }),
        ],
      });

      // Total monthly spend: $500 + $1000 = $1500/mo
      // Over 3 months: $4500 >= $4000 requirement => meetable
      const spend = { dining: 500, groceries: 1000 };
      const result = evaluateCardForSpendProfile(card, spend);

      expect(result.can_meet_sub_requirement).toBe(true);
      // SUB value: 60000 * 1.5 / 100 = $900
      expect(result.sign_up_bonus_value).toBe(900);

      // Annual rewards: (500 + 1000) * 1 * 12 = 18000 pts => 18000 * 1.5 / 100 = $270
      // Year1: $270 + $900 - $95 = $1075
      expect(result.net_value_year1).toBe(1075);
      // Ongoing: $270 - $95 = $175
      expect(result.net_value_ongoing).toBe(175);
    });

    it("excludes SUB from year1 value when spend requirement cannot be met", () => {
      const card = mockCatalogCard({
        issuer: "chase",
        versions: [
          mockCardVersion({
            annualFee: "95",
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
            signUpBonus: {
              points: 60000,
              spend_requirement: 4000,
              timeframe_months: 3,
              currency: "points",
            },
          }),
        ],
      });

      // Total monthly spend: $100 + $200 = $300/mo
      // Over 3 months: $900 < $4000 requirement => NOT meetable
      const spend = { dining: 100, groceries: 200 };
      const result = evaluateCardForSpendProfile(card, spend);

      expect(result.can_meet_sub_requirement).toBe(false);
      // SUB value is calculated but not added to year1
      expect(result.sign_up_bonus_value).toBe(900);

      // Annual rewards: (100 + 200) * 1 * 12 = 3600 pts => $54
      // Year1: $54 + 0 (SUB not met) - $95 = -$41
      expect(result.net_value_year1).toBe(-41);
      expect(result.net_value_ongoing).toBe(-41);
    });
  });

  it("calculates net value correctly: year1 with SUB vs ongoing without", () => {
    const card = mockCatalogCard({
      issuer: "amex",
      versions: [
        mockCardVersion({
          annualFee: "250",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          signUpBonus: {
            points: 80000,
            spend_requirement: 6000,
            timeframe_months: 6,
            currency: "points",
          },
          categoryBonuses: [
            {
              category: "dining",
              multiplier: "4",
              capAmount: null,
              capPeriod: "none",
            },
          ],
          benefits: [
            mockBenefit({
              benefitType: "dining_credit",
              value: "20",
              frequency: "monthly",
            }),
          ],
        }),
      ],
    });

    // Monthly spend: dining $400, groceries $600 = $1000/mo
    // Over 6 months: $6000 >= $6000 => meetable
    const spend = { dining: 400, groceries: 600 };
    const result = evaluateCardForSpendProfile(card, spend);

    expect(result.can_meet_sub_requirement).toBe(true);

    // Dining: 400 * 4 = 1600 pts/mo, Groceries: 600 * 1 = 600 pts/mo => 2200 pts/mo
    // Annual: 2200 * 12 = 26400 pts
    // Amex CPP = 1.2 => 26400 * 1.2 / 100 = $316.80
    expect(result.rewards_value_annual).toBe(316.8);

    // Credits: $20/mo * 12 = $240/yr
    expect(result.credits_value_annual).toBe(240);

    // SUB: 80000 * 1.2 / 100 = $960
    expect(result.sign_up_bonus_value).toBe(960);

    // Year1: $316.80 + $240 + $960 - $250 = $1266.80
    expect(result.net_value_year1).toBe(1266.8);

    // Ongoing: $316.80 + $240 - $250 = $306.80
    expect(result.net_value_ongoing).toBe(306.8);
  });

  it("produces negative net value for high annual fee card with low spend", () => {
    const card = mockCatalogCard({
      issuer: "amex",
      versions: [
        mockCardVersion({
          annualFee: "695",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    // Very low monthly spend
    const spend = { dining: 50 };
    const result = evaluateCardForSpendProfile(card, spend);

    // Annual: 50 * 1 * 12 = 600 pts => 600 * 1.2 / 100 = $7.20
    expect(result.rewards_value_annual).toBe(7.2);
    // Ongoing: $7.20 - $695 = -$687.80
    expect(result.net_value_ongoing).toBe(-687.8);
    expect(result.net_value_ongoing).toBeLessThan(0);
  });

  it("handles zero annual fee card correctly", () => {
    const card = mockCatalogCard({
      issuer: "chase",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1.5, currency: "points" },
        }),
      ],
    });

    const spend = { dining: 300, groceries: 400 };
    const result = evaluateCardForSpendProfile(card, spend);

    expect(result.annual_fee).toBe(0);
    // (300 + 400) * 1.5 * 12 = 12600 pts => 12600 * 1.5 / 100 = $189
    expect(result.rewards_value_annual).toBe(189);
    // With no fee: net = rewards
    expect(result.net_value_ongoing).toBe(189);
    expect(result.net_value_year1).toBe(189);
  });

  it("returns empty evaluation when card has no current version", () => {
    const card = mockCatalogCard({
      versions: [
        mockCardVersion({ isCurrent: false }),
      ],
    });

    const spend = { dining: 500 };
    const result = evaluateCardForSpendProfile(card, spend);

    expect(result.total_points_annual).toBe(0);
    expect(result.rewards_value_annual).toBe(0);
    expect(result.net_value_year1).toBe(0);
    expect(result.net_value_ongoing).toBe(0);
    expect(result.category_rewards).toHaveLength(0);
  });

  it("skips categories with zero or negative spend", () => {
    const card = mockCatalogCard({
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    const spend = { dining: 0, groceries: -50, gas: 200 };
    const result = evaluateCardForSpendProfile(card, spend);

    // Only gas should have a reward entry
    expect(result.category_rewards).toHaveLength(1);
    expect(result.category_rewards[0].category).toBe("gas");
  });

  it("uses cash back CPP for unknown issuers", () => {
    const card = mockCatalogCard({
      issuer: "unknown_bank",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 2, currency: "points" },
        }),
      ],
    });

    const spend = { dining: 100 };
    const result = evaluateCardForSpendProfile(card, spend);

    // Cash Back CPP = 1.0
    // 100 * 2 * 12 = 2400 pts => 2400 * 1.0 / 100 = $24
    expect(result.rewards_value_annual).toBe(24);
  });
});

// ─── Perk Valuation System ────────────────────────────────────────

describe("perk valuation system", () => {
  const baseBenefits: CardBenefit[] = [
    mockBenefit({
      id: "b1",
      benefitType: "statement_credit",
      name: "Statement Credit",
      value: "100",
      frequency: "annual",
    }),
    mockBenefit({
      id: "b2",
      benefitType: "travel_credit",
      name: "Travel Credit",
      value: "300",
      frequency: "annual",
    }),
    mockBenefit({
      id: "b3",
      benefitType: "entertainment_credit",
      name: "Entertainment Credit",
      value: "20",
      frequency: "monthly",
    }),
    mockBenefit({
      id: "b4",
      benefitType: "hotel_credit",
      name: "Hotel Credit",
      value: "200",
      frequency: "annual",
    }),
    mockBenefit({
      id: "b5",
      benefitType: "lounge_access",
      name: "Lounge Access",
      value: "400",
      frequency: "annual",
    }),
    mockBenefit({
      id: "b6",
      benefitType: "insurance",
      name: "Travel Insurance",
      value: "500",
      frequency: "annual",
    }),
  ];

  function cardWithBenefits(benefits: CardBenefit[]): CatalogCard {
    return mockCatalogCard({
      issuer: "chase",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          benefits,
        }),
      ],
    });
  }

  it("always counts auto-tier benefits (statement_credit, travel_credit)", () => {
    const card = cardWithBenefits([
      mockBenefit({
        benefitType: "statement_credit",
        value: "100",
        frequency: "annual",
      }),
      mockBenefit({
        benefitType: "travel_credit",
        value: "300",
        frequency: "annual",
      }),
    ]);

    // Pass perk prefs with everything disabled to prove auto perks are counted regardless
    const noPrefs: PerkPreferences = { enabled: {} };
    const result = evaluateCardForSpendProfile(card, { dining: 100 }, noPrefs);

    expect(result.credits_value_annual).toBe(400);
    const autoBenefits = result.benefits_detail.filter(
      (b) => b.tier === "auto"
    );
    expect(autoBenefits).toHaveLength(2);
    for (const b of autoBenefits) {
      expect(b.included).toBe(true);
    }
  });

  it("respects PerkPreferences for toggleable benefits", () => {
    const card = cardWithBenefits([
      mockBenefit({
        benefitType: "entertainment_credit",
        value: "20",
        frequency: "monthly",
      }),
      mockBenefit({
        benefitType: "hotel_credit",
        value: "200",
        frequency: "annual",
      }),
    ]);

    // Enable entertainment, disable hotel
    const prefs: PerkPreferences = {
      enabled: {
        entertainment_credit: true,
        hotel_credit: false,
      },
    };

    const result = evaluateCardForSpendProfile(card, { dining: 100 }, prefs);

    // Entertainment: $20/mo * 12 = $240 (enabled)
    // Hotel: $200/yr (disabled, not counted)
    expect(result.credits_value_annual).toBe(240);

    const entertainment = result.benefits_detail.find(
      (b) => b.benefit_type === "entertainment_credit"
    );
    expect(entertainment!.included).toBe(true);
    expect(entertainment!.tier).toBe("toggle");

    const hotel = result.benefits_detail.find(
      (b) => b.benefit_type === "hotel_credit"
    );
    expect(hotel!.included).toBe(false);
    expect(hotel!.tier).toBe("toggle");
  });

  it("never counts excluded-tier benefits", () => {
    const card = cardWithBenefits([
      mockBenefit({
        benefitType: "lounge_access",
        value: "400",
        frequency: "annual",
      }),
      mockBenefit({
        benefitType: "insurance",
        value: "500",
        frequency: "annual",
      }),
    ]);

    // Even if we try to "enable" these in prefs, they should still be excluded
    const prefs: PerkPreferences = {
      enabled: {
        lounge_access: true,
        insurance: true,
      },
    };

    const result = evaluateCardForSpendProfile(card, { dining: 100 }, prefs);

    expect(result.credits_value_annual).toBe(0);
    for (const b of result.benefits_detail) {
      expect(b.included).toBe(false);
      expect(b.tier).toBe("excluded");
    }
  });

  it("applies custom perk preferences overriding defaults", () => {
    const card = cardWithBenefits([
      mockBenefit({
        benefitType: "airline_credit",
        value: "200",
        frequency: "annual",
      }),
      mockBenefit({
        benefitType: "wellness_credit",
        value: "25",
        frequency: "monthly",
      }),
    ]);

    // Default prefs: airline_credit=true, wellness_credit=false
    // Custom: flip both
    const customPrefs: PerkPreferences = {
      enabled: {
        airline_credit: false,
        wellness_credit: true,
      },
    };

    const resultDefault = evaluateCardForSpendProfile(card, { dining: 100 });
    const resultCustom = evaluateCardForSpendProfile(
      card,
      { dining: 100 },
      customPrefs
    );

    // Default: airline $200 counted, wellness not counted
    expect(resultDefault.credits_value_annual).toBe(200);

    // Custom: airline not counted, wellness $25 * 12 = $300 counted
    expect(resultCustom.credits_value_annual).toBe(300);
  });

  it("uses DEFAULT_PERK_PREFERENCES when none provided", () => {
    const card = cardWithBenefits([
      mockBenefit({
        benefitType: "airline_credit",
        value: "200",
        frequency: "annual",
      }),
      mockBenefit({
        benefitType: "shopping_credit",
        value: "50",
        frequency: "annual",
      }),
      mockBenefit({
        benefitType: "hotel_credit",
        value: "100",
        frequency: "annual",
      }),
    ]);

    // No prefs passed (uses defaults)
    const result = evaluateCardForSpendProfile(card, { dining: 100 });

    // airline_credit: default=true => counted ($200)
    // shopping_credit: default=true => counted ($50)
    // hotel_credit: default=false => not counted
    expect(result.credits_value_annual).toBe(250);
  });

  it("annualizes benefits with different frequencies correctly", () => {
    const card = cardWithBenefits([
      mockBenefit({
        benefitType: "statement_credit",
        value: "10",
        frequency: "monthly",
      }),
      mockBenefit({
        benefitType: "travel_credit",
        value: "50",
        frequency: "quarterly",
      }),
      mockBenefit({
        benefitType: "dining_credit",
        value: "100",
        frequency: "semi_annual",
      }),
      mockBenefit({
        benefitType: "uber_credit",
        value: "200",
        frequency: "annual",
      }),
      mockBenefit({
        benefitType: "streaming_credit",
        value: "15",
        frequency: "one_time",
      }),
    ]);

    const result = evaluateCardForSpendProfile(card, { dining: 100 });

    // monthly: 10 * 12 = 120
    // quarterly: 50 * 4 = 200
    // semi_annual: 100 * 2 = 200
    // annual: 200 * 1 = 200
    // one_time: 15 * 1 = 15
    // Total: 120 + 200 + 200 + 200 + 15 = 735
    expect(result.credits_value_annual).toBe(735);
  });
});

// ─── recommendCards() ─────────────────────────────────────────────

describe("recommendCards", () => {
  it("returns cards sorted by net_value_year1 descending", () => {
    const catalog: CatalogCard[] = [
      mockCatalogCard({
        id: "low",
        name: "Low Value Card",
        issuer: "chase",
        versions: [
          mockCardVersion({
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
          }),
        ],
      }),
      mockCatalogCard({
        id: "high",
        name: "High Value Card",
        issuer: "chase",
        versions: [
          mockCardVersion({
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
            categoryBonuses: [
              {
                category: "dining",
                multiplier: "5",
                capAmount: null,
                capPeriod: "none",
              },
            ],
          }),
        ],
      }),
      mockCatalogCard({
        id: "mid",
        name: "Mid Value Card",
        issuer: "chase",
        versions: [
          mockCardVersion({
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
            categoryBonuses: [
              {
                category: "dining",
                multiplier: "3",
                capAmount: null,
                capPeriod: "none",
              },
            ],
          }),
        ],
      }),
    ];

    const result = recommendCards(
      { monthly_spend: { dining: 500 } },
      catalog
    );

    expect(result.recommendations).toHaveLength(3);
    expect(result.recommendations[0].card_id).toBe("high");
    expect(result.recommendations[1].card_id).toBe("mid");
    expect(result.recommendations[2].card_id).toBe("low");

    // Verify descending order
    for (let i = 0; i < result.recommendations.length - 1; i++) {
      expect(result.recommendations[i].net_value_year1).toBeGreaterThanOrEqual(
        result.recommendations[i + 1].net_value_year1
      );
    }
  });

  it("respects max_results limit", () => {
    const catalog: CatalogCard[] = Array.from({ length: 10 }, (_, i) =>
      mockCatalogCard({
        id: `card-${i}`,
        name: `Card ${i}`,
        issuer: "chase",
        versions: [
          mockCardVersion({
            baseEarnRate: {
              points_per_dollar: i + 1,
              currency: "points",
            },
          }),
        ],
      })
    );

    const result = recommendCards(
      { monthly_spend: { dining: 500 }, max_results: 3 },
      catalog
    );

    expect(result.recommendations).toHaveLength(3);
    // Top 3 should be the highest base earn rate cards (10x, 9x, 8x)
    expect(result.recommendations[0].card_id).toBe("card-9");
    expect(result.recommendations[1].card_id).toBe("card-8");
    expect(result.recommendations[2].card_id).toBe("card-7");
  });

  it("sorts by ongoing value when include_year1_sub is false", () => {
    const catalog: CatalogCard[] = [
      mockCatalogCard({
        id: "big-sub",
        name: "Big SUB Card",
        issuer: "chase",
        versions: [
          mockCardVersion({
            annualFee: "550",
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
            signUpBonus: {
              points: 100000,
              spend_requirement: 1000,
              timeframe_months: 3,
              currency: "points",
            },
          }),
        ],
      }),
      mockCatalogCard({
        id: "steady",
        name: "Steady Card",
        issuer: "chase",
        versions: [
          mockCardVersion({
            annualFee: "0",
            baseEarnRate: { points_per_dollar: 2, currency: "points" },
          }),
        ],
      }),
    ];

    const spend = { dining: 500 };

    // With SUB (default): big-sub should win due to massive SUB
    const withSub = recommendCards(
      { monthly_spend: spend, include_year1_sub: true },
      catalog
    );
    expect(withSub.recommendations[0].card_id).toBe("big-sub");

    // Without SUB: steady should win (no fee, 2x earn rate)
    const withoutSub = recommendCards(
      { monthly_spend: spend, include_year1_sub: false },
      catalog
    );
    expect(withoutSub.recommendations[0].card_id).toBe("steady");
  });

  it("returns empty recommendations for empty catalog", () => {
    const result = recommendCards(
      { monthly_spend: { dining: 500 } },
      []
    );

    expect(result.recommendations).toHaveLength(0);
    expect(result.total_monthly_spend).toBe(500);
  });

  it("includes spend profile and perk preferences in output", () => {
    const spend = { dining: 300, groceries: 400 };
    const prefs: PerkPreferences = {
      enabled: { airline_credit: true },
    };

    const result = recommendCards(
      { monthly_spend: spend, perk_preferences: prefs },
      [mockCatalogCard()]
    );

    expect(result.spend_profile).toEqual(spend);
    expect(result.total_monthly_spend).toBe(700);
    expect(result.perk_preferences).toEqual(prefs);
  });
});

// ─── autoOptimizeNetValue() ───────────────────────────────────────

describe("autoOptimizeNetValue", () => {
  it("drops cards with negative net value from high fees and low rewards", () => {
    const expensiveCard = mockWalletCard({
      id: "expensive",
      cardId: "card-exp",
      issuer: "amex",
      name: "Expensive Card",
      versions: [
        mockCardVersion({
          annualFee: "695",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    const freeCard = mockWalletCard({
      id: "free",
      cardId: "card-free",
      issuer: "chase",
      name: "Free Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1.5, currency: "points" },
        }),
      ],
    });

    const spend = { dining: 100 };
    const result = autoOptimizeNetValue(spend, [expensiveCard, freeCard]);

    // Expensive card's rewards won't justify $695 fee with only $100/mo dining
    expect(result.dropped_cards).toContain("expensive");
    expect(result.dropped_cards).not.toContain("free");
  });

  it("keeps no-fee cards even with low rewards", () => {
    const noFeeCard = mockWalletCard({
      id: "no-fee",
      cardId: "card-nf",
      issuer: "chase",
      name: "No Fee Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    const betterCard = mockWalletCard({
      id: "better",
      cardId: "card-better",
      issuer: "chase",
      name: "Better Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 2, currency: "points" },
        }),
      ],
    });

    const spend = { dining: 50 };
    const result = autoOptimizeNetValue(spend, [noFeeCard, betterCard]);

    // No-fee cards should never be dropped (net value is >= 0)
    expect(result.dropped_cards).not.toContain("no-fee");
    expect(result.dropped_cards).not.toContain("better");
  });

  it("does not drop the last remaining card", () => {
    const singleCard = mockWalletCard({
      id: "only-card",
      cardId: "card-1",
      issuer: "amex",
      name: "Sole Card",
      versions: [
        mockCardVersion({
          annualFee: "695",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    // Even with tiny spend and huge fee, we don't drop the last card
    const spend = { dining: 10 };
    const result = autoOptimizeNetValue(spend, [singleCard]);

    expect(result.dropped_cards).toHaveLength(0);
    // Allocation should still exist for the only card
    expect(result.allocation["only-card"]).toBeDefined();
  });

  it("returns dropped_cards list correctly with multiple dropped cards", () => {
    const cards = [
      mockWalletCard({
        id: "expensive-1",
        cardId: "c1",
        issuer: "amex",
        name: "Expensive 1",
        versions: [
          mockCardVersion({
            annualFee: "500",
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
          }),
        ],
      }),
      mockWalletCard({
        id: "expensive-2",
        cardId: "c2",
        issuer: "amex",
        name: "Expensive 2",
        versions: [
          mockCardVersion({
            annualFee: "600",
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
          }),
        ],
      }),
      mockWalletCard({
        id: "keeper",
        cardId: "c3",
        issuer: "chase",
        name: "Keeper Card",
        versions: [
          mockCardVersion({
            annualFee: "0",
            baseEarnRate: { points_per_dollar: 2, currency: "points" },
          }),
        ],
      }),
    ];

    const spend = { dining: 50 };
    const result = autoOptimizeNetValue(spend, cards);

    // Both expensive cards should be dropped
    expect(result.dropped_cards).toContain("expensive-1");
    expect(result.dropped_cards).toContain("expensive-2");
    expect(result.dropped_cards).not.toContain("keeper");
  });

  it("reassigns categories after dropping a card", () => {
    const specialistCard = mockWalletCard({
      id: "specialist",
      cardId: "c-spec",
      issuer: "amex",
      name: "Dining Specialist",
      versions: [
        mockCardVersion({
          annualFee: "695",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "dining",
              multiplier: "4",
              capAmount: null,
              capPeriod: "none",
            },
          ],
        }),
      ],
    });

    const generalistCard = mockWalletCard({
      id: "generalist",
      cardId: "c-gen",
      issuer: "chase",
      name: "Generalist Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 2, currency: "points" },
        }),
      ],
    });

    // With very low spend, the specialist's fee won't be justified
    const spend = { dining: 50, groceries: 50 };
    const result = autoOptimizeNetValue(spend, [specialistCard, generalistCard]);

    if (result.dropped_cards.includes("specialist")) {
      // After dropping specialist, dining should be reassigned to generalist
      expect(result.allocation["generalist"]["dining"]).toBe(100);
      expect(result.allocation["generalist"]["groceries"]).toBe(100);
    }
  });

  it("considers benefit credits when evaluating card net value", () => {
    const cardWithCredits = mockWalletCard({
      id: "credit-card",
      cardId: "c-credit",
      issuer: "chase",
      name: "Credit Rich Card",
      versions: [
        mockCardVersion({
          annualFee: "550",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          benefits: [
            // Auto-valued credits totaling $600/yr offset the fee
            mockBenefit({
              benefitType: "statement_credit",
              value: "300",
              frequency: "annual",
            }),
            mockBenefit({
              benefitType: "travel_credit",
              value: "300",
              frequency: "annual",
            }),
          ],
        }),
      ],
    });

    const otherCard = mockWalletCard({
      id: "other",
      cardId: "c-other",
      issuer: "chase",
      name: "Other Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    const spend = { dining: 100 };
    const result = autoOptimizeNetValue(spend, [cardWithCredits, otherCard]);

    // $600 credits > $550 fee, so net value is positive even with low rewards
    // Card should NOT be dropped
    expect(result.dropped_cards).not.toContain("credit-card");
  });
});

// ─── calculateScenario() ──────────────────────────────────────────

describe("calculateScenario", () => {
  it("calculates a basic scenario with a single card", () => {
    const card = mockWalletCard({
      id: "wc-1",
      cardId: "c-1",
      issuer: "chase",
      name: "Freedom Unlimited",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1.5, currency: "points" },
        }),
      ],
    });

    const allocation: Allocation = {
      "wc-1": { dining: 100, groceries: 100 },
    };

    const result = calculateScenario({
      monthly_spend: { dining: 500, groceries: 400 },
      cards: [card],
      allocation,
      timeframe_months: 12,
    });

    // Monthly: (500 + 400) * 1.5 = 1350 pts
    // Annual: 1350 * 12 = 16200 pts
    expect(result.results.total_points).toBe(16200);

    // Chase CPP = 1.5 => 16200 * 1.5 / 100 = $243
    expect(result.results.total_cashback).toBe(243);

    // Category breakdowns
    expect(result.detail.category_breakdown).toHaveLength(2);
    expect(result.detail.total_monthly_spend).toBe(900);
    expect(result.detail.timeframe_months).toBe(12);
  });

  it("calculates multi-card scenario with custom allocation", () => {
    const card1 = mockWalletCard({
      id: "wc-dining",
      cardId: "c-dining",
      issuer: "chase",
      name: "Dining Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "dining",
              multiplier: "3",
              capAmount: null,
              capPeriod: "none",
            },
          ],
        }),
      ],
    });

    const card2 = mockWalletCard({
      id: "wc-grocery",
      cardId: "c-grocery",
      issuer: "amex",
      name: "Grocery Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "groceries",
              multiplier: "6",
              capAmount: null,
              capPeriod: "none",
            },
          ],
        }),
      ],
    });

    const allocation: Allocation = {
      "wc-dining": { dining: 100, groceries: 0 },
      "wc-grocery": { dining: 0, groceries: 100 },
    };

    const result = calculateScenario({
      monthly_spend: { dining: 500, groceries: 600 },
      cards: [card1, card2],
      allocation,
      timeframe_months: 12,
    });

    // Card 1: dining 500 * 3x = 1500 pts/mo
    // Card 2: groceries 600 * 6x = 3600 pts/mo
    // Total: (1500 + 3600) * 12 = 61200 pts
    expect(result.results.total_points).toBe(61200);

    // Per-card breakdown
    expect(result.detail.per_card).toHaveLength(2);

    const diningCardResult = result.detail.per_card.find(
      (c) => c.user_card_id === "wc-dining"
    );
    expect(diningCardResult!.points_earned).toBe(18000); // 1500 * 12

    const groceryCardResult = result.detail.per_card.find(
      (c) => c.user_card_id === "wc-grocery"
    );
    expect(groceryCardResult!.points_earned).toBe(43200); // 3600 * 12
  });

  it("handles category cap in scenario calculation", () => {
    const card = mockWalletCard({
      id: "wc-cap",
      cardId: "c-cap",
      issuer: "chase",
      name: "Capped Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "groceries",
              multiplier: "5",
              capAmount: "6000",
              capPeriod: "annually",
            },
          ],
        }),
      ],
    });

    const allocation: Allocation = {
      "wc-cap": { groceries: 100 },
    };

    // Annual cap $6000 -> monthly $500
    // Spend $800/mo exceeds cap
    const result = calculateScenario({
      monthly_spend: { groceries: 800 },
      cards: [card],
      allocation,
      timeframe_months: 12,
    });

    const groceryBreakdown = result.detail.category_breakdown.find(
      (b) => b.category === "groceries"
    );
    expect(groceryBreakdown!.capped).toBe(true);
    // $500 at 5x = 2500, $300 at 1x = 300, total = 2800 pts/mo
    expect(groceryBreakdown!.points_earned_monthly).toBe(2800);
    expect(groceryBreakdown!.points_earned_total).toBe(2800 * 12);
  });

  it("evaluates sign-up bonus eligibility based on allocated spend", () => {
    const card = mockWalletCard({
      id: "wc-sub",
      cardId: "c-sub",
      issuer: "chase",
      name: "SUB Card",
      versions: [
        mockCardVersion({
          annualFee: "95",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          signUpBonus: {
            points: 80000,
            spend_requirement: 4000,
            timeframe_months: 3,
            currency: "points",
          },
        }),
      ],
    });

    // Only 50% of spend allocated to this card
    const allocation: Allocation = {
      "wc-sub": { dining: 50, groceries: 50 },
    };

    // Monthly spend on card: 500 * 0.5 + 1000 * 0.5 = $750/mo
    // Over 3 months: $2250 < $4000 => cannot meet SUB
    const result = calculateScenario({
      monthly_spend: { dining: 500, groceries: 1000 },
      cards: [card],
      allocation,
      timeframe_months: 12,
    });

    const cardBreakdown = result.detail.per_card[0];
    expect(cardBreakdown.can_meet_sub_requirement).toBe(false);
    expect(cardBreakdown.total_allocated_spend_monthly).toBe(750);
  });

  it("defaults timeframe to 12 months when not specified", () => {
    const card = mockWalletCard({
      id: "wc-def",
      cardId: "c-def",
      issuer: "chase",
      name: "Default Timeframe Card",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    const allocation: Allocation = {
      "wc-def": { dining: 100 },
    };

    const result = calculateScenario({
      monthly_spend: { dining: 100 },
      cards: [card],
      allocation,
    });

    expect(result.detail.timeframe_months).toBe(12);
    // 100 * 1 = 100 pts/mo, 100 * 12 = 1200 pts
    expect(result.results.total_points).toBe(1200);
  });

  it("pro-rates credits and fees to the specified timeframe", () => {
    const card = mockWalletCard({
      id: "wc-prorated",
      cardId: "c-prorated",
      issuer: "chase",
      name: "Prorated Card",
      versions: [
        mockCardVersion({
          annualFee: "120",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          benefits: [
            mockBenefit({
              benefitType: "statement_credit",
              value: "10",
              frequency: "monthly",
            }),
          ],
        }),
      ],
    });

    const allocation: Allocation = {
      "wc-prorated": { dining: 100 },
    };

    // 6-month timeframe
    const result = calculateScenario({
      monthly_spend: { dining: 100 },
      cards: [card],
      allocation,
      timeframe_months: 6,
    });

    const cardBreakdown = result.detail.per_card[0];

    // Annual fee prorated: $120 * 6/12 = $60
    expect(cardBreakdown.annual_fee).toBe(60);

    // Credits: $10/mo * 12 = $120/yr, prorated: $120 * 6/12 = $60
    expect(cardBreakdown.credits_value).toBe(60);

    // Net fee: $60 - $60 = $0
    expect(cardBreakdown.net_annual_fee).toBe(0);
  });

  it("skips categories with zero allocation percentage", () => {
    const card = mockWalletCard({
      id: "wc-skip",
      cardId: "c-skip",
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    const allocation: Allocation = {
      "wc-skip": { dining: 100, groceries: 0 },
    };

    const result = calculateScenario({
      monthly_spend: { dining: 200, groceries: 300 },
      cards: [card],
      allocation,
    });

    // Only dining should appear in breakdown (groceries has 0% allocation)
    expect(result.detail.category_breakdown).toHaveLength(1);
    expect(result.detail.category_breakdown[0].category).toBe("dining");

    // Points should only come from dining
    // 200 * 1 * 12 = 2400 pts
    expect(result.results.total_points).toBe(2400);
  });

  it("handles walletCard signUpBonusOverride taking precedence over version SUB", () => {
    const card = mockWalletCard({
      id: "wc-override",
      cardId: "c-override",
      issuer: "chase",
      name: "Override Card",
      signUpBonusOverride: {
        points: 100000,
        spend_requirement: 5000,
        timeframe_months: 3,
        currency: "points",
      },
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          signUpBonus: {
            points: 60000,
            spend_requirement: 4000,
            timeframe_months: 3,
            currency: "points",
          },
        }),
      ],
    });

    const allocation: Allocation = {
      "wc-override": { dining: 100 },
    };

    const result = calculateScenario({
      monthly_spend: { dining: 2000 },
      cards: [card],
      allocation,
    });

    // Should use override (100k points) not version (60k points)
    const cardBreakdown = result.detail.per_card[0];
    expect(cardBreakdown.sign_up_bonus!.points).toBe(100000);
    // 100000 * 1.5 / 100 = $1500
    expect(cardBreakdown.sign_up_bonus_value).toBe(1500);
  });
});

// ─── autoOptimize() ───────────────────────────────────────────────

describe("autoOptimize", () => {
  it("assigns each category to the card with the highest multiplier", () => {
    const diningCard = mockWalletCard({
      id: "wc-din",
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "dining",
              multiplier: "3",
              capAmount: null,
              capPeriod: "none",
            },
          ],
        }),
      ],
    });

    const groceryCard = mockWalletCard({
      id: "wc-groc",
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "groceries",
              multiplier: "5",
              capAmount: null,
              capPeriod: "none",
            },
          ],
        }),
      ],
    });

    const spend = { dining: 500, groceries: 600, gas: 200 };
    const allocation = autoOptimize(spend, [diningCard, groceryCard]);

    // Dining: diningCard has 3x, groceryCard has 1x base => diningCard wins
    expect(allocation["wc-din"]["dining"]).toBe(100);
    expect(allocation["wc-groc"]["dining"]).toBe(0);

    // Groceries: groceryCard has 5x, diningCard has 1x base => groceryCard wins
    expect(allocation["wc-groc"]["groceries"]).toBe(100);
    expect(allocation["wc-din"]["groceries"]).toBe(0);

    // Gas: both at 1x base, first card should win (>= comparison favors it)
    expect(allocation["wc-din"]["gas"]).toBe(100);
    expect(allocation["wc-groc"]["gas"]).toBe(0);
  });

  it("assigns to the first card that achieves the highest multiplier on ties", () => {
    const card1 = mockWalletCard({
      id: "wc-first",
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 2, currency: "points" },
        }),
      ],
    });

    const card2 = mockWalletCard({
      id: "wc-second",
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 2, currency: "points" },
        }),
      ],
    });

    const spend = { dining: 500 };
    const allocation = autoOptimize(spend, [card1, card2]);

    // Both at 2x, first card processed wins (strictly greater comparison)
    // Since it checks > (not >=), the first card found stays as best
    expect(allocation["wc-first"]["dining"]).toBe(100);
    expect(allocation["wc-second"]["dining"]).toBe(0);
  });

  it("handles a single card by assigning all categories to it", () => {
    const card = mockWalletCard({
      id: "wc-solo",
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    const spend = { dining: 500, groceries: 400, gas: 200 };
    const allocation = autoOptimize(spend, [card]);

    expect(allocation["wc-solo"]["dining"]).toBe(100);
    expect(allocation["wc-solo"]["groceries"]).toBe(100);
    expect(allocation["wc-solo"]["gas"]).toBe(100);
  });

  it("initializes all cards with empty category objects", () => {
    const card1 = mockWalletCard({ id: "wc-a" });
    const card2 = mockWalletCard({ id: "wc-b" });

    const spend = { dining: 100 };
    const allocation = autoOptimize(spend, [card1, card2]);

    // Both cards should have entries in the allocation
    expect(allocation["wc-a"]).toBeDefined();
    expect(allocation["wc-b"]).toBeDefined();
  });

  it("skips cards without a current version", () => {
    const activeCard = mockWalletCard({
      id: "wc-active",
      issuer: "chase",
      versions: [
        mockCardVersion({
          isCurrent: true,
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    const inactiveCard = mockWalletCard({
      id: "wc-inactive",
      issuer: "chase",
      versions: [
        mockCardVersion({
          isCurrent: false,
          baseEarnRate: { points_per_dollar: 5, currency: "points" },
        }),
      ],
    });

    const spend = { dining: 500 };
    const allocation = autoOptimize(spend, [activeCard, inactiveCard]);

    // Active card should get the allocation since inactive has no current version
    expect(allocation["wc-active"]["dining"]).toBe(100);
    expect(allocation["wc-inactive"]["dining"]).toBe(0);
  });
});

// ─── uniformAllocation() ──────────────────────────────────────────

describe("uniformAllocation", () => {
  it("distributes spend evenly across all cards for each category", () => {
    const cards = [
      mockWalletCard({ id: "wc-1" }),
      mockWalletCard({ id: "wc-2" }),
      mockWalletCard({ id: "wc-3" }),
      mockWalletCard({ id: "wc-4" }),
    ];

    const spend = { dining: 500, groceries: 400, gas: 200 };
    const allocation = uniformAllocation(spend, cards);

    const expectedPct = 100 / 4; // 25%

    for (const card of cards) {
      for (const category of Object.keys(spend)) {
        expect(allocation[card.id][category]).toBe(expectedPct);
      }
    }
  });

  it("gives 100% to a single card", () => {
    const cards = [mockWalletCard({ id: "wc-solo" })];

    const spend = { dining: 500 };
    const allocation = uniformAllocation(spend, cards);

    expect(allocation["wc-solo"]["dining"]).toBe(100);
  });

  it("gives 50% each to two cards", () => {
    const cards = [
      mockWalletCard({ id: "wc-a" }),
      mockWalletCard({ id: "wc-b" }),
    ];

    const spend = { dining: 500, groceries: 400 };
    const allocation = uniformAllocation(spend, cards);

    expect(allocation["wc-a"]["dining"]).toBe(50);
    expect(allocation["wc-a"]["groceries"]).toBe(50);
    expect(allocation["wc-b"]["dining"]).toBe(50);
    expect(allocation["wc-b"]["groceries"]).toBe(50);
  });

  it("returns empty allocation for empty cards array", () => {
    const spend = { dining: 500 };
    const allocation = uniformAllocation(spend, []);

    expect(Object.keys(allocation)).toHaveLength(0);
  });

  it("handles multiple categories consistently", () => {
    const cards = [
      mockWalletCard({ id: "wc-x" }),
      mockWalletCard({ id: "wc-y" }),
      mockWalletCard({ id: "wc-z" }),
    ];

    const spend = {
      dining: 500,
      groceries: 400,
      gas: 200,
      travel: 1000,
      streaming: 50,
    };

    const allocation = uniformAllocation(spend, cards);
    const expectedPct = 100 / 3;

    // Every card gets the same percentage for every category
    for (const card of cards) {
      const categories = Object.keys(allocation[card.id]);
      expect(categories).toHaveLength(5);
      for (const category of categories) {
        expect(allocation[card.id][category]).toBeCloseTo(expectedPct, 10);
      }
    }
  });
});

// ─── Integration: autoOptimize + calculateScenario ────────────────

describe("integration: autoOptimize + calculateScenario", () => {
  it("produces valid scenario output when using auto-optimized allocation", () => {
    const diningCard = mockWalletCard({
      id: "wc-d",
      cardId: "c-d",
      issuer: "chase",
      name: "Dining Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "dining",
              multiplier: "3",
              capAmount: null,
              capPeriod: "none",
            },
          ],
        }),
      ],
    });

    const groceryCard = mockWalletCard({
      id: "wc-g",
      cardId: "c-g",
      issuer: "amex",
      name: "Grocery Card",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "groceries",
              multiplier: "6",
              capAmount: null,
              capPeriod: "none",
            },
          ],
        }),
      ],
    });

    const spend = { dining: 500, groceries: 600, gas: 200 };
    const cards = [diningCard, groceryCard];

    const allocation = autoOptimize(spend, cards);
    const result = calculateScenario({
      monthly_spend: spend,
      cards,
      allocation,
    });

    // Dining -> diningCard (3x): 500 * 3 = 1500 pts/mo
    // Groceries -> groceryCard (6x): 600 * 6 = 3600 pts/mo
    // Gas -> diningCard (1x, first with same base wins): 200 * 1 = 200 pts/mo

    // diningCard: (1500 + 200) * 12 = 20400 pts
    // groceryCard: 3600 * 12 = 43200 pts
    const dResult = result.detail.per_card.find(
      (c) => c.user_card_id === "wc-d"
    );
    const gResult = result.detail.per_card.find(
      (c) => c.user_card_id === "wc-g"
    );

    expect(dResult!.points_earned).toBe(20400);
    expect(gResult!.points_earned).toBe(43200);

    // Total points: 20400 + 43200 = 63600
    expect(result.results.total_points).toBe(63600);

    // Net rewards value should be positive (no fees)
    expect(result.detail.net_rewards_value).toBeGreaterThan(0);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles empty monthly_spend gracefully", () => {
    const card = mockWalletCard({ id: "wc-empty" });

    const allocation = autoOptimize({}, [card]);
    expect(Object.keys(allocation["wc-empty"])).toHaveLength(0);

    const result = calculateScenario({
      monthly_spend: {},
      cards: [card],
      allocation,
    });

    expect(result.results.total_points).toBe(0);
    expect(result.detail.category_breakdown).toHaveLength(0);
  });

  it("handles no cards in scenario gracefully", () => {
    const result = calculateScenario({
      monthly_spend: { dining: 500 },
      cards: [],
      allocation: {},
    });

    expect(result.results.total_points).toBe(0);
    expect(result.detail.per_card).toHaveLength(0);
  });

  it("rounds currency values to two decimal places", () => {
    const card = mockCatalogCard({
      issuer: "amex",
      versions: [
        mockCardVersion({
          annualFee: "0",
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
        }),
      ],
    });

    // 333 * 1 * 12 = 3996 pts * 1.2 / 100 = $47.952
    const spend = { dining: 333 };
    const result = evaluateCardForSpendProfile(card, spend);

    // Should be rounded to 2 decimal places
    expect(result.rewards_value_annual).toBe(47.95);
    const decimalStr = result.rewards_value_annual.toString();
    const decimalPart = decimalStr.split(".")[1] ?? "";
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });

  it("uses correct CPP values per issuer", () => {
    const issuers = [
      { issuer: "chase", expectedCpp: 1.5 },
      { issuer: "amex", expectedCpp: 1.2 },
      { issuer: "capital_one", expectedCpp: 1.0 },
      { issuer: "citi", expectedCpp: 1.0 },
    ];

    for (const { issuer, expectedCpp } of issuers) {
      const card = mockCatalogCard({
        issuer,
        versions: [
          mockCardVersion({
            baseEarnRate: { points_per_dollar: 1, currency: "points" },
          }),
        ],
      });

      // 100 * 1 * 12 = 1200 pts
      const result = evaluateCardForSpendProfile(card, { dining: 100 });
      // 1200 * cpp / 100
      const expectedValue = (1200 * expectedCpp) / 100;
      expect(result.rewards_value_annual).toBe(expectedValue);
    }
  });

  it("handles a card with monthly cap period", () => {
    const card = mockCatalogCard({
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "dining",
              multiplier: "3",
              capAmount: "500",
              capPeriod: "monthly",
            },
          ],
        }),
      ],
    });

    const spend = { dining: 700 };
    const result = evaluateCardForSpendProfile(card, spend);

    const diningReward = result.category_rewards.find(
      (r) => r.category === "dining"
    );
    expect(diningReward!.capped).toBe(true);
    expect(diningReward!.cap_amount_monthly).toBe(500);
    // $500 at 3x = 1500, $200 at 1x = 200 => 1700 pts/mo
    expect(diningReward!.points_monthly).toBe(1700);
  });

  it("handles a card with calendar_year cap period", () => {
    const card = mockCatalogCard({
      issuer: "chase",
      versions: [
        mockCardVersion({
          baseEarnRate: { points_per_dollar: 1, currency: "points" },
          categoryBonuses: [
            {
              category: "groceries",
              multiplier: "3",
              capAmount: "12000",
              capPeriod: "calendar_year",
            },
          ],
        }),
      ],
    });

    const spend = { groceries: 1500 };
    const result = evaluateCardForSpendProfile(card, spend);

    const groceryReward = result.category_rewards.find(
      (r) => r.category === "groceries"
    );
    // calendar_year cap $12000 -> monthly $1000
    expect(groceryReward!.cap_amount_monthly).toBe(1000);
    expect(groceryReward!.capped).toBe(true);
    // $1000 at 3x = 3000, $500 at 1x = 500 => 3500 pts/mo
    expect(groceryReward!.points_monthly).toBe(3500);
  });
});
