import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cards } from "@cardmax/card-data";
import {
  creditCardProducts,
  cardVersions,
  cardCategoryBonuses,
  cardBenefits,
  pointValuations,
} from "./schema";
import { seedMerchants } from "./seed-merchants";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("Seeding database...");

  // Seed point valuations
  console.log("Seeding point valuations...");
  await db
    .insert(pointValuations)
    .values([
      {
        program: "Chase Ultimate Rewards",
        cppValue: "1.5",
        cppPremium: "2.0",
        lastUpdated: "2025-01-01",
        source: "The Points Guy",
      },
      {
        program: "Amex Membership Rewards",
        cppValue: "1.2",
        cppPremium: "2.0",
        lastUpdated: "2025-01-01",
        source: "The Points Guy",
      },
      {
        program: "Capital One Miles",
        cppValue: "1.0",
        cppPremium: "1.5",
        lastUpdated: "2025-01-01",
        source: "The Points Guy",
      },
      {
        program: "Citi ThankYou Points",
        cppValue: "1.0",
        cppPremium: "1.5",
        lastUpdated: "2025-01-01",
        source: "The Points Guy",
      },
      {
        program: "Cash Back",
        cppValue: "1.0",
        cppPremium: "1.0",
        lastUpdated: "2025-01-01",
        source: "N/A",
      },
      {
        program: "Delta SkyMiles",
        cppValue: "1.2",
        cppPremium: "1.5",
        lastUpdated: "2025-01-01",
        source: "The Points Guy",
      },
      {
        program: "Hilton Honors",
        cppValue: "0.5",
        cppPremium: "0.8",
        lastUpdated: "2025-01-01",
        source: "The Points Guy",
      },
      {
        program: "Marriott Bonvoy",
        cppValue: "0.7",
        cppPremium: "1.0",
        lastUpdated: "2025-01-01",
        source: "The Points Guy",
      },
    ])
    .onConflictDoNothing();

  // Seed credit cards
  for (const card of cards) {
    console.log(`Seeding: ${card.name}`);

    // Insert card product
    const [product] = await db
      .insert(creditCardProducts)
      .values({
        issuer: card.issuer,
        name: card.name,
        slug: card.slug,
        network: card.network,
        annualFee: card.annual_fee.toString(),
        isActive: true,
      })
      .onConflictDoNothing({ target: creditCardProducts.slug })
      .returning();

    if (!product) {
      console.log(`  Skipping ${card.name} (already exists)`);
      continue;
    }

    // Insert current version
    const [version] = await db
      .insert(cardVersions)
      .values({
        cardId: product.id,
        version: 1,
        effectiveDate: "2025-01-01",
        annualFee: card.annual_fee.toString(),
        signUpBonus: {
          points: card.sign_up_bonus.points,
          spend_requirement: card.sign_up_bonus.spend_requirement,
          timeframe_months: card.sign_up_bonus.timeframe_months,
          currency: card.base_earn_rate.currency,
        },
        baseEarnRate: {
          points_per_dollar: card.base_earn_rate.points_per_dollar,
          currency: card.base_earn_rate.currency,
        },
        isCurrent: true,
      })
      .returning();

    // Insert category bonuses
    if (card.category_bonuses.length > 0) {
      await db.insert(cardCategoryBonuses).values(
        card.category_bonuses.map((bonus) => ({
          cardVersionId: version.id,
          category: bonus.category,
          multiplier: bonus.multiplier.toString(),
          capAmount: bonus.cap_amount?.toString() ?? null,
          capPeriod: mapCapPeriod(bonus.cap_period),
        }))
      );
    }

    // Insert benefits
    if (card.benefits.length > 0) {
      await db.insert(cardBenefits).values(
        card.benefits.map((benefit) => ({
          cardVersionId: version.id,
          benefitType: benefit.benefit_type as any,
          name: benefit.name,
          description: benefit.description,
          value: benefit.value.toString(),
          frequency: benefit.frequency as any,
          autoTrigger: benefit.auto_trigger,
          conditions: benefit.merchant_name
            ? { merchant_name: benefit.merchant_name }
            : null,
        }))
      );
    }

    console.log(
      `  Added: ${card.category_bonuses.length} bonuses, ${card.benefits.length} benefits`
    );
  }

  // Seed merchants
  console.log("\nSeeding merchants...");
  await seedMerchants(db);

  console.log("\nSeed complete!");
  process.exit(0);
}

function mapCapPeriod(
  period: string | null
): "monthly" | "quarterly" | "annually" | "calendar_year" | "none" {
  if (!period) return "none";
  switch (period) {
    case "monthly":
      return "monthly";
    case "quarterly":
      return "quarterly";
    case "annual":
    case "annually":
      return "annually";
    case "calendar_year":
      return "calendar_year";
    default:
      return "none";
  }
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
