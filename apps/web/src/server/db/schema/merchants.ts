import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const merchants = pgTable("merchants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  mccCodes: text("mcc_codes").array(),
  websiteDomain: text("website_domain"),
  logoUrl: text("logo_url"),
  aliases: text("aliases").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
