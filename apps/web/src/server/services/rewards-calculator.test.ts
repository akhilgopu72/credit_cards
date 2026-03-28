import { describe, it, expect } from "vitest";
import {
  calculateTransactionRewards,
  calculateBatchRewards,
  rankCardsForTransaction,
  type Transaction,
  type UserCard,
  type ActiveOffer,
} from "./rewards-calculator";

// ─── Test Fixtures ──────────────────────────────────────────────

const chaseCard: UserCard = {
  id: "card-chase-1",
  cardName: "Sapphire Preferred",
  issuer: "chase",
  pointProgram: "Chase Ultimate Rewards",
  baseEarnRate: { points_per_dollar: 1, currency: "Chase Ultimate Rewards" },
  categoryBonuses: [
    { category: "dining", multiplier: 3 },
    { category: "travel", multiplier: 2 },
  ],
};

const amexCard: UserCard = {
  id: "card-amex-1",
  cardName: "Gold Card",
  issuer: "amex",
  pointProgram: "Amex Membership Rewards",
  baseEarnRate: { points_per_dollar: 1, currency: "Amex Membership Rewards" },
  categoryBonuses: [
    { category: "dining", multiplier: 4 },
    { category: "groceries", multiplier: 4 },
  ],
};

const capOneCard: UserCard = {
  id: "card-cap1-1",
  cardName: "Venture X",
  issuer: "capital_one",
  pointProgram: "Capital One Miles",
  baseEarnRate: { points_per_dollar: 2, currency: "Capital One Miles" },
  categoryBonuses: [],
};

const diningTransaction: Transaction = {
  merchantName: "Nobu",
  merchantCategory: "dining",
  amount: 100,
};

const groceryTransaction: Transaction = {
  merchantName: "Whole Foods",
  merchantCategory: "groceries",
  amount: 200,
};

const generalTransaction: Transaction = {
  merchantName: "Target",
  merchantCategory: "general",
  amount: 50,
};

// ─── Base Reward Tests ──────────────────────────────────────────

describe("calculateTransactionRewards", () => {
  describe("base rewards", () => {
    it("applies category bonus multiplier", () => {
      const result = calculateTransactionRewards(diningTransaction, chaseCard, []);
      // 100 * 3x dining = 300 points
      expect(result.baseReward).toBe(300);
      expect(result.offerReward).toBe(0);
      expect(result.totalPoints).toBe(300);
    });

    it("falls back to base earn rate for uncategorized spend", () => {
      const result = calculateTransactionRewards(generalTransaction, chaseCard, []);
      // 50 * 1x base = 50 points
      expect(result.baseReward).toBe(50);
      expect(result.totalPoints).toBe(50);
    });

    it("applies correct CPP for dollar value", () => {
      const result = calculateTransactionRewards(diningTransaction, chaseCard, []);
      // 300 points * 1.5 cpp / 100 = $4.50
      expect(result.totalDollarValue).toBe(4.5);
    });

    it("applies flat base earn rate for Capital One", () => {
      const result = calculateTransactionRewards(generalTransaction, capOneCard, []);
      // 50 * 2x base = 100 points
      expect(result.baseReward).toBe(100);
      // 100 points * 1.0 cpp / 100 = $1.00
      expect(result.totalDollarValue).toBe(1);
    });
  });

  // ─── Fixed Offer Tests ──────────────────────────────────────────

  describe("fixed (dollar) offers", () => {
    it("adds fixed dollar reward when minSpend met", () => {
      const offer: ActiveOffer = {
        id: "offer-1",
        valueType: "fixed",
        value: 10,
        minSpend: 50,
        issuer: "chase",
      };
      const result = calculateTransactionRewards(diningTransaction, chaseCard, [offer]);
      // Base: 300 pts. Offer: $10 → 10 * 100 / 1.5 = ~666.67 pts
      expect(result.baseReward).toBe(300);
      expect(result.offerReward).toBeCloseTo(666.67, 1);
      expect(result.offerDetails?.offerId).toBe("offer-1");
    });

    it("skips fixed offer when minSpend not met", () => {
      const offer: ActiveOffer = {
        id: "offer-1",
        valueType: "fixed",
        value: 10,
        minSpend: 200,
        issuer: "chase",
      };
      const result = calculateTransactionRewards(diningTransaction, chaseCard, [offer]);
      expect(result.offerReward).toBe(0);
      expect(result.offerDetails).toBeUndefined();
    });

    it("applies fixed offer with no minSpend", () => {
      const offer: ActiveOffer = {
        id: "offer-1",
        valueType: "fixed",
        value: 5,
        issuer: "chase",
      };
      const result = calculateTransactionRewards(generalTransaction, chaseCard, [offer]);
      expect(result.offerReward).toBeGreaterThan(0);
    });
  });

  // ─── Percentage Offer Tests ─────────────────────────────────────

  describe("percentage offers", () => {
    it("calculates percentage-based reward", () => {
      const offer: ActiveOffer = {
        id: "offer-2",
        valueType: "percentage",
        value: 5,
        issuer: "chase",
      };
      const result = calculateTransactionRewards(diningTransaction, chaseCard, [offer]);
      // Offer: 100 * 5% = $5 → 5 * 100 / 1.5 = ~333.33 pts
      expect(result.offerReward).toBeCloseTo(333.33, 1);
    });

    it("caps percentage reward at maxReward", () => {
      const offer: ActiveOffer = {
        id: "offer-3",
        valueType: "percentage",
        value: 10,
        maxReward: 5,
        issuer: "chase",
      };
      const result = calculateTransactionRewards(diningTransaction, chaseCard, [offer]);
      // 100 * 10% = $10, capped at $5 → 5 * 100 / 1.5 = ~333.33 pts
      expect(result.offerReward).toBeCloseTo(333.33, 1);
    });
  });

  // ─── Points Multiplier Offer Tests ──────────────────────────────

  describe("points_multiplier offers", () => {
    it("calculates per-dollar bonus points", () => {
      const offer: ActiveOffer = {
        id: "offer-4",
        valueType: "points_multiplier",
        value: 3,
        issuer: "capital_one",
      };
      const result = calculateTransactionRewards(generalTransaction, capOneCard, [offer]);
      // Base: 50 * 2 = 100 pts. Offer: 50 * 3 = 150 bonus pts (already in points)
      expect(result.baseReward).toBe(100);
      expect(result.offerReward).toBe(150);
      expect(result.totalPoints).toBe(250);
    });

    it("caps points_multiplier at maxReward", () => {
      const offer: ActiveOffer = {
        id: "offer-5",
        valueType: "points_multiplier",
        value: 10,
        maxReward: 5000,
        issuer: "amex",
      };
      const bigTransaction: Transaction = {
        merchantName: "Hilton",
        merchantCategory: "travel",
        amount: 1000,
      };
      const result = calculateTransactionRewards(bigTransaction, amexCard, [offer]);
      // Offer: 1000 * 10 = 10000, capped at 5000
      expect(result.offerReward).toBe(5000);
    });

    it("applies points_multiplier with minSpend", () => {
      const offer: ActiveOffer = {
        id: "offer-6",
        valueType: "points_multiplier",
        value: 5,
        minSpend: 200,
        issuer: "amex",
      };
      // Transaction of $100 doesn't meet $200 minSpend
      const result = calculateTransactionRewards(diningTransaction, amexCard, [offer]);
      expect(result.offerReward).toBe(0);
    });
  });

  // ─── Points Flat Offer Tests ────────────────────────────────────

  describe("points_flat offers", () => {
    it("adds flat points when minSpend met", () => {
      const offer: ActiveOffer = {
        id: "offer-7",
        valueType: "points_flat",
        value: 700,
        minSpend: 50,
        issuer: "capital_one",
      };
      const result = calculateTransactionRewards(generalTransaction, capOneCard, [offer]);
      // Base: 50 * 2 = 100 pts. Offer: 700 flat pts (already in points)
      expect(result.baseReward).toBe(100);
      expect(result.offerReward).toBe(700);
      expect(result.totalPoints).toBe(800);
    });

    it("skips flat points when minSpend not met", () => {
      const offer: ActiveOffer = {
        id: "offer-8",
        valueType: "points_flat",
        value: 700,
        minSpend: 100,
        issuer: "capital_one",
      };
      const result = calculateTransactionRewards(generalTransaction, capOneCard, [offer]);
      expect(result.offerReward).toBe(0);
    });

    it("adds flat points with no minSpend", () => {
      const offer: ActiveOffer = {
        id: "offer-9",
        valueType: "points_flat",
        value: 500,
        issuer: "amex",
      };
      const result = calculateTransactionRewards(diningTransaction, amexCard, [offer]);
      expect(result.offerReward).toBe(500);
      expect(result.totalPoints).toBe(400 + 500); // 100 * 4x + 500
    });
  });

  // ─── Issuer Matching ────────────────────────────────────────────

  describe("issuer matching", () => {
    it("ignores offers from a different issuer", () => {
      const chaseOffer: ActiveOffer = {
        id: "offer-chase",
        valueType: "fixed",
        value: 20,
        issuer: "chase",
      };
      // Using amex card — offer should be ignored
      const result = calculateTransactionRewards(diningTransaction, amexCard, [chaseOffer]);
      expect(result.offerReward).toBe(0);
    });

    it("picks the best offer among multiple", () => {
      const smallOffer: ActiveOffer = {
        id: "offer-small",
        valueType: "fixed",
        value: 5,
        issuer: "chase",
      };
      const bigOffer: ActiveOffer = {
        id: "offer-big",
        valueType: "fixed",
        value: 20,
        issuer: "chase",
      };
      const result = calculateTransactionRewards(diningTransaction, chaseCard, [
        smallOffer,
        bigOffer,
      ]);
      expect(result.offerDetails?.offerId).toBe("offer-big");
    });
  });
});

// ─── Batch Rewards Tests ──────────────────────────────────────────

describe("calculateBatchRewards", () => {
  it("aggregates rewards across multiple transactions", () => {
    const transactions = [diningTransaction, groceryTransaction, generalTransaction];
    const result = calculateBatchRewards(transactions, amexCard, []);

    // Dining: 100 * 4 = 400, Groceries: 200 * 4 = 800, General: 50 * 1 = 50
    expect(result.totalBaseReward).toBe(1250);
    expect(result.totalOfferReward).toBe(0);
    expect(result.totalPoints).toBe(1250);
    expect(result.perTransaction).toHaveLength(3);
  });

  it("includes offer rewards in batch totals", () => {
    const offer: ActiveOffer = {
      id: "offer-batch",
      valueType: "points_flat",
      value: 1000,
      issuer: "amex",
    };
    const transactions = [diningTransaction, groceryTransaction];
    const result = calculateBatchRewards(transactions, amexCard, [offer]);

    // Each transaction gets the flat offer (best offer per transaction)
    expect(result.totalOfferReward).toBe(2000); // 1000 per transaction
    expect(result.totalBaseReward).toBe(1200); // 400 + 800
    expect(result.totalPoints).toBe(3200);
  });
});

// ─── Card Ranking Tests ─────────────────────────────────────────

describe("rankCardsForTransaction", () => {
  it("ranks cards by total dollar value, highest first", () => {
    const cards = [chaseCard, amexCard, capOneCard];
    const offersByCard = new Map<string, ActiveOffer[]>();

    const results = rankCardsForTransaction(diningTransaction, cards, offersByCard);

    expect(results).toHaveLength(3);
    // Amex: 100 * 4 = 400pts * 1.2cpp = $4.80
    // Chase: 100 * 3 = 300pts * 1.5cpp = $4.50
    // CapOne: 100 * 2 = 200pts * 1.0cpp = $2.00
    expect(results[0].cardName).toBe("Gold Card");
    expect(results[1].cardName).toBe("Sapphire Preferred");
    expect(results[2].cardName).toBe("Venture X");
  });

  it("considers offers when ranking cards", () => {
    const cards = [chaseCard, capOneCard];
    const offersByCard = new Map<string, ActiveOffer[]>();

    // Big offer on Capital One makes it win
    offersByCard.set("card-cap1-1", [
      {
        id: "big-offer",
        valueType: "points_flat",
        value: 5000,
        issuer: "capital_one",
      },
    ]);

    const results = rankCardsForTransaction(diningTransaction, cards, offersByCard);

    // CapOne: 200 base + 5000 offer = 5200pts * 1.0cpp = $52.00
    // Chase: 300 base = 300pts * 1.5cpp = $4.50
    expect(results[0].cardName).toBe("Venture X");
    expect(results[0].totalPoints).toBe(5200);
  });
});
