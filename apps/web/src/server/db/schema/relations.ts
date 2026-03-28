import { relations } from "drizzle-orm";
import {
  creditCardProducts,
  cardVersions,
  cardCategoryBonuses,
  cardBenefits,
} from "./cards";
import { merchants } from "./merchants";
import { offers } from "./offers";
import {
  users,
  userCards,
  userOffers,
  userBenefitTracking,
  spendScenarios,
} from "./users";

// ─── Credit Card Products Relations ─────────────────────────────
export const creditCardProductsRelations = relations(
  creditCardProducts,
  ({ many }) => ({
    versions: many(cardVersions),
  })
);

// ─── Card Versions Relations ────────────────────────────────────
export const cardVersionsRelations = relations(
  cardVersions,
  ({ one, many }) => ({
    card: one(creditCardProducts, {
      fields: [cardVersions.cardId],
      references: [creditCardProducts.id],
    }),
    categoryBonuses: many(cardCategoryBonuses),
    benefits: many(cardBenefits),
  })
);

// ─── Card Category Bonuses Relations ────────────────────────────
export const cardCategoryBonusesRelations = relations(
  cardCategoryBonuses,
  ({ one }) => ({
    cardVersion: one(cardVersions, {
      fields: [cardCategoryBonuses.cardVersionId],
      references: [cardVersions.id],
    }),
  })
);

// ─── Card Benefits Relations ────────────────────────────────────
export const cardBenefitsRelations = relations(cardBenefits, ({ one }) => ({
  cardVersion: one(cardVersions, {
    fields: [cardBenefits.cardVersionId],
    references: [cardVersions.id],
  }),
  merchant: one(merchants, {
    fields: [cardBenefits.merchantId],
    references: [merchants.id],
  }),
}));

// ─── Merchants Relations ────────────────────────────────────────
export const merchantsRelations = relations(merchants, ({ many }) => ({
  offers: many(offers),
}));

// ─── Offers Relations ───────────────────────────────────────────
export const offersRelations = relations(offers, ({ one }) => ({
  card: one(creditCardProducts, {
    fields: [offers.cardId],
    references: [creditCardProducts.id],
  }),
  merchant: one(merchants, {
    fields: [offers.merchantId],
    references: [merchants.id],
  }),
}));

// ─── Users Relations ────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  cards: many(userCards),
  offers: many(userOffers),
  benefitTracking: many(userBenefitTracking),
  scenarios: many(spendScenarios),
}));

// ─── User Cards Relations ───────────────────────────────────────
export const userCardsRelations = relations(userCards, ({ one, many }) => ({
  user: one(users, {
    fields: [userCards.userId],
    references: [users.id],
  }),
  card: one(creditCardProducts, {
    fields: [userCards.cardId],
    references: [creditCardProducts.id],
  }),
  offers: many(userOffers),
  benefitTracking: many(userBenefitTracking),
}));

// ─── User Offers Relations ──────────────────────────────────────
export const userOffersRelations = relations(userOffers, ({ one }) => ({
  user: one(users, {
    fields: [userOffers.userId],
    references: [users.id],
  }),
  offer: one(offers, {
    fields: [userOffers.offerId],
    references: [offers.id],
  }),
  userCard: one(userCards, {
    fields: [userOffers.userCardId],
    references: [userCards.id],
  }),
}));

// ─── User Benefit Tracking Relations ────────────────────────────
export const userBenefitTrackingRelations = relations(
  userBenefitTracking,
  ({ one }) => ({
    user: one(users, {
      fields: [userBenefitTracking.userId],
      references: [users.id],
    }),
    benefit: one(cardBenefits, {
      fields: [userBenefitTracking.benefitId],
      references: [cardBenefits.id],
    }),
    userCard: one(userCards, {
      fields: [userBenefitTracking.userCardId],
      references: [userCards.id],
    }),
  })
);

// ─── Spend Scenarios Relations ──────────────────────────────────
export const spendScenariosRelations = relations(
  spendScenarios,
  ({ one }) => ({
    user: one(users, {
      fields: [spendScenarios.userId],
      references: [users.id],
    }),
  })
);
