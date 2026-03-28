/**
 * Merchant seed helpers for CardMax.
 *
 * Provides the merchant seed data in a format ready for database insertion.
 * The actual DB operations live in apps/web/src/server/db/seed-merchants.ts.
 *
 * This module can be imported by any consumer that needs the merchant data
 * transformed for DB insertion without depending on drizzle-orm or postgres.
 */

import { merchants, type Merchant } from "./merchants";

/**
 * Merchant data formatted for DB insertion.
 * Maps the seed data field names (snake_case) to the Drizzle schema
 * field names (camelCase) expected by the merchants table.
 */
export interface MerchantInsertData {
  name: string;
  slug: string;
  category: string;
  mccCodes: string[];
  websiteDomain: string | null;
  logoUrl: string | null;
  aliases: string[];
}

/**
 * Transform a single Merchant seed record into the shape expected
 * by the Drizzle `merchants` table insert.
 */
export function toMerchantInsert(merchant: Merchant): MerchantInsertData {
  return {
    name: merchant.name,
    slug: merchant.slug,
    category: merchant.category,
    mccCodes: merchant.mcc_codes,
    websiteDomain: merchant.website_domain || null,
    logoUrl: null,
    aliases: merchant.aliases,
  };
}

/**
 * Get all merchant seed data in the DB-ready insert format.
 */
export function getMerchantInsertData(): MerchantInsertData[] {
  return merchants.map(toMerchantInsert);
}
