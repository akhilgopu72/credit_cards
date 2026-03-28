import {
  pgTable,
  uuid,
  text,
  decimal,
  boolean,
  timestamp,
  integer,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import {
  issuerEnum,
  networkEnum,
  benefitTypeEnum,
  frequencyEnum,
  capPeriodEnum,
} from "./enums";
import { merchants } from "./merchants";

// ─── Credit Card Products ────────────────────────────────────────
export const creditCardProducts = pgTable("credit_card_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  issuer: issuerEnum("issuer").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  network: networkEnum("network").notNull(),
  annualFee: decimal("annual_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  isActive: boolean("is_active").notNull().default(true),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Card Versions ───────────────────────────────────────────────
export type SignUpBonus = {
  points: number;
  spend_requirement: number;
  timeframe_months: number;
  currency: string;
};

export type BaseEarnRate = {
  points_per_dollar: number;
  currency: string;
};

export const cardVersions = pgTable("card_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => creditCardProducts.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  effectiveDate: date("effective_date").notNull(),
  endDate: date("end_date"),
  annualFee: decimal("annual_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  signUpBonus: jsonb("sign_up_bonus").$type<SignUpBonus>(),
  baseEarnRate: jsonb("base_earn_rate").$type<BaseEarnRate>().notNull(),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Card Category Bonuses ───────────────────────────────────────
export const cardCategoryBonuses = pgTable("card_category_bonuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardVersionId: uuid("card_version_id")
    .notNull()
    .references(() => cardVersions.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  multiplier: decimal("multiplier", { precision: 4, scale: 1 }).notNull(),
  capAmount: decimal("cap_amount", { precision: 10, scale: 2 }),
  capPeriod: capPeriodEnum("cap_period").notNull().default("none"),
  conditions: jsonb("conditions").$type<Record<string, unknown>>(),
});

// ─── Card Benefits ───────────────────────────────────────────────
export const cardBenefits = pgTable("card_benefits", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardVersionId: uuid("card_version_id")
    .notNull()
    .references(() => cardVersions.id, { onDelete: "cascade" }),
  benefitType: benefitTypeEnum("benefit_type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull().default("0"),
  frequency: frequencyEnum("frequency").notNull(),
  autoTrigger: boolean("auto_trigger").notNull().default(false),
  merchantId: uuid("merchant_id").references(() => merchants.id),
  conditions: jsonb("conditions").$type<Record<string, unknown>>(),
});
