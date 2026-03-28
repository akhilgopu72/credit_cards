import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { merchants as merchantData } from "@cardmax/card-data";
import { merchants } from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

// ---------------------------------------------------------------------------
// pg_trgm extension & index setup
// ---------------------------------------------------------------------------

async function ensureTrgmExtension(
  database: ReturnType<typeof drizzle>
): Promise<void> {
  console.log("Ensuring pg_trgm extension is enabled...");
  await database.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  console.log("Creating trigram indexes...");
  await database.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_merchants_name_trgm ON merchants USING GIN (name gin_trgm_ops)`
  );
  // Note: GIN index on aliases array uses a workaround since array_to_string
  // is not IMMUTABLE. We create an immutable wrapper function.
  await database.execute(sql`
    CREATE OR REPLACE FUNCTION immutable_array_to_string(arr text[], sep text)
    RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
    $$SELECT array_to_string(arr, sep)$$
  `);
  await database.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_merchants_aliases_trgm ON merchants USING GIN (immutable_array_to_string(aliases, ' ') gin_trgm_ops)`
  );
}

// ---------------------------------------------------------------------------
// Seed function (idempotent upsert by slug)
// ---------------------------------------------------------------------------

export async function seedMerchants(
  database?: ReturnType<typeof drizzle>
): Promise<void> {
  const targetDb = database ?? db;

  // Ensure pg_trgm and indexes exist before seeding
  await ensureTrgmExtension(targetDb);

  console.log(`Seeding ${merchantData.length} merchants...`);

  for (const merchant of merchantData) {
    const [result] = await targetDb
      .insert(merchants)
      .values({
        name: merchant.name,
        slug: merchant.slug,
        category: merchant.category,
        mccCodes: merchant.mcc_codes,
        websiteDomain: merchant.website_domain || null,
        logoUrl: null,
        aliases: merchant.aliases,
      })
      .onConflictDoUpdate({
        target: merchants.slug,
        set: {
          name: sql`EXCLUDED.name`,
          category: sql`EXCLUDED.category`,
          mccCodes: sql`EXCLUDED.mcc_codes`,
          websiteDomain: sql`EXCLUDED.website_domain`,
          aliases: sql`EXCLUDED.aliases`,
        },
      })
      .returning();

    if (result) {
      console.log(`  Upserted: ${merchant.name}`);
    }
  }

  console.log(`Merchant seeding complete! (${merchantData.length} merchants)`);
}

// Allow running standalone via: npx tsx src/server/db/seed-merchants.ts
if (require.main === module) {
  seedMerchants()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Merchant seed error:", err);
      process.exit(1);
    });
}
