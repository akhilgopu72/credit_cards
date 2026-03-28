import {
  pgTable,
  uuid,
  text,
  decimal,
  boolean,
  timestamp,
  date,
  integer,
} from "drizzle-orm/pg-core";
import { issuerEnum, offerTypeEnum, valueTypeEnum } from "./enums";
import { creditCardProducts } from "./cards";
import { merchants } from "./merchants";

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  issuer: issuerEnum("issuer").notNull(),
  cardName: text("card_name"),
  cardId: uuid("card_id").references(() => creditCardProducts.id),
  merchantId: uuid("merchant_id").references(() => merchants.id),
  merchantName: text("merchant_name").notNull(),
  merchantDomain: text("merchant_domain"),
  title: text("title").notNull(),
  description: text("description"),
  offerType: offerTypeEnum("offer_type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  valueType: valueTypeEnum("value_type").notNull(),
  minSpend: decimal("min_spend", { precision: 10, scale: 2 }),
  maxReward: decimal("max_reward", { precision: 10, scale: 2 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  useLimit: integer("use_limit"),
  requiresAdd: boolean("requires_add").notNull().default(true),
  sourceHash: text("source_hash").unique(),
  scrapedAt: timestamp("scraped_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
