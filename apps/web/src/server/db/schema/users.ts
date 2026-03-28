import {
  pgTable,
  uuid,
  text,
  decimal,
  boolean,
  timestamp,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { creditCardProducts, cardBenefits, type SignUpBonus } from "./cards";
import { offers } from "./offers";

// ─── Users ───────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── User Cards (Wallet) ────────────────────────────────────────
export const userCards = pgTable("user_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cardId: uuid("card_id")
    .notNull()
    .references(() => creditCardProducts.id),
  nickname: text("nickname"),
  openedDate: date("opened_date"),
  annualFeeDate: date("annual_fee_date"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  signUpBonusOverride: jsonb("sign_up_bonus_override").$type<SignUpBonus>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── User Offers ─────────────────────────────────────────────────
export const userOffers = pgTable("user_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => offers.id),
  userCardId: uuid("user_card_id")
    .notNull()
    .references(() => userCards.id),
  isAdded: boolean("is_added").notNull().default(false),
  isUsed: boolean("is_used").notNull().default(false),
  addedAt: timestamp("added_at", { withTimezone: true }),
  usedAt: timestamp("used_at", { withTimezone: true }),
  scrapedAt: timestamp("scraped_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── User Benefit Tracking ──────────────────────────────────────
export const userBenefitTracking = pgTable("user_benefit_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  benefitId: uuid("benefit_id")
    .notNull()
    .references(() => cardBenefits.id),
  userCardId: uuid("user_card_id")
    .notNull()
    .references(() => userCards.id),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  amountUsed: decimal("amount_used", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  amountAvailable: decimal("amount_available", { precision: 10, scale: 2 })
    .notNull(),
  lastUpdated: timestamp("last_updated", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Spend Scenarios ─────────────────────────────────────────────
export type ScenarioConfig = {
  monthly_spend: Record<string, number>;
  cards: string[];
  allocation: Record<string, Record<string, number>>;
};

export type ScenarioResults = {
  total_points: number;
  total_cashback: number;
  per_card: Array<{
    card_id: string;
    points: number;
    cashback: number;
    credits_value: number;
    net_annual_fee: number;
  }>;
  calculated_at: string;
};

export const spendScenarios = pgTable("spend_scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  config: jsonb("config").$type<ScenarioConfig>().notNull(),
  results: jsonb("results").$type<ScenarioResults>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Point Valuations ────────────────────────────────────────────
export const pointValuations = pgTable("point_valuations", {
  id: uuid("id").primaryKey().defaultRandom(),
  program: text("program").notNull().unique(),
  cppValue: decimal("cpp_value", { precision: 6, scale: 3 }).notNull(),
  cppPremium: decimal("cpp_premium", { precision: 6, scale: 3 }).notNull(),
  lastUpdated: date("last_updated").notNull(),
  source: text("source"),
});
