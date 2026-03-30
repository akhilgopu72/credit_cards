/**
 * Seed demo data for a specific user.
 *
 * Populates wallet with 5 popular cards, adds sample offers,
 * and creates benefit tracking records so the dashboard looks
 * populated (matching the Stitch design references).
 *
 * Usage:
 *   DATABASE_URL="postgresql://localhost:5432/cardmax" pnpm db:seed-demo
 *
 * Prerequisites: Run db:seed first to populate card products.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "./schema";

const {
  users,
  userCards,
  userBenefitTracking,
  spendScenarios,
  creditCardProducts,
  cardVersions,
  cardBenefits,
  offers,
} = schema;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// ─── Config ─────────────────────────────────────────────────────

// The Clerk ID of the user to seed data for.
// Find yours from the Clerk dashboard or from the users table.
const DEMO_CLERK_ID = process.env.DEMO_CLERK_ID || "demo-user";
const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@cardmax.app";
const DEMO_NAME = process.env.DEMO_NAME || "Alex";

// Cards to add to the wallet (must exist in credit_card_products from db:seed)
const WALLET_CARDS = [
  { slug: "chase-sapphire-reserve", nickname: null, openedDate: "2024-06-15", feeDate: "2025-06-15", creditLimit: "30000" },
  { slug: "amex-gold", nickname: null, openedDate: "2024-01-10", feeDate: "2025-01-10", creditLimit: "25000" },
  { slug: "capital-one-venture-x", nickname: null, openedDate: "2024-09-01", feeDate: "2025-09-01", creditLimit: "20000" },
  { slug: "chase-freedom-unlimited", nickname: null, openedDate: "2023-03-20", feeDate: null, creditLimit: "12000" },
  { slug: "amex-blue-cash-preferred", nickname: null, openedDate: "2023-11-05", feeDate: "2025-11-05", creditLimit: "15000" },
];

// Sample offers to create
const SAMPLE_OFFERS = [
  { issuer: "amex" as const, merchantName: "Whole Foods", title: "5% back at Whole Foods", value: 5, valueType: "percentage" as const, offerType: "cashback" as const },
  { issuer: "amex" as const, merchantName: "Amazon", title: "Get 3x points at Amazon", value: 3, valueType: "points_multiplier" as const, offerType: "points_bonus" as const },
  { issuer: "amex" as const, merchantName: "Best Buy", title: "$50 back on $250+", value: 50, valueType: "fixed" as const, offerType: "statement_credit" as const },
  { issuer: "amex" as const, merchantName: "Home Depot", title: "10% back at Home Depot", value: 10, valueType: "percentage" as const, offerType: "cashback" as const },
  { issuer: "amex" as const, merchantName: "Nike", title: "15% back at Nike.com", value: 15, valueType: "percentage" as const, offerType: "cashback" as const },
  { issuer: "chase" as const, merchantName: "Starbucks", title: "5% cash back at Starbucks", value: 5, valueType: "percentage" as const, offerType: "cashback" as const },
  { issuer: "chase" as const, merchantName: "Disney+", title: "15% cash back on Disney+", value: 15, valueType: "percentage" as const, offerType: "cashback" as const },
  { issuer: "chase" as const, merchantName: "Uber", title: "10% back on Uber rides", value: 10, valueType: "percentage" as const, offerType: "cashback" as const },
  { issuer: "chase" as const, merchantName: "DoorDash", title: "Get $10 back on $40+", value: 10, valueType: "fixed" as const, offerType: "statement_credit" as const },
  { issuer: "capital_one" as const, merchantName: "Target", title: "Up to 5% back at Target", value: 5, valueType: "percentage" as const, offerType: "cashback" as const },
  { issuer: "capital_one" as const, merchantName: "Costco", title: "4x miles at Costco", value: 4, valueType: "points_multiplier" as const, offerType: "points_bonus" as const },
  { issuer: "capital_one" as const, merchantName: "Southwest Airlines", title: "3,000 miles on SW flights", value: 3000, valueType: "points_flat" as const, offerType: "points_bonus" as const },
];

// ─── Seed ───────────────────────────────────────────────────────

async function seedDemo() {
  console.log("🌱 Seeding demo data...\n");

  // 1. Find or create user
  let user = await db.query.users.findFirst({
    where: eq(users.clerkId, DEMO_CLERK_ID),
  });

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ clerkId: DEMO_CLERK_ID, email: DEMO_EMAIL, name: DEMO_NAME })
      .returning();
    user = created;
    console.log(`✅ Created user: ${DEMO_NAME} (${DEMO_CLERK_ID})`);
  } else {
    console.log(`✅ Found existing user: ${user.name} (${user.clerkId})`);
  }

  // 2. Add cards to wallet
  console.log("\n📇 Adding cards to wallet...");
  const walletCardIds: string[] = [];

  for (const cardDef of WALLET_CARDS) {
    // Find the card product
    const product = await db.query.creditCardProducts.findFirst({
      where: eq(creditCardProducts.slug, cardDef.slug),
    });

    if (!product) {
      console.log(`  ⚠️  Card not found: ${cardDef.slug} (run db:seed first)`);
      continue;
    }

    // Check if already in wallet
    const existing = await db.query.userCards.findFirst({
      where: and(
        eq(userCards.userId, user.id),
        eq(userCards.cardId, product.id),
        eq(userCards.isActive, true),
      ),
    });

    if (existing) {
      console.log(`  ⏭️  Already in wallet: ${product.name}`);
      walletCardIds.push(existing.id);
      continue;
    }

    const [inserted] = await db
      .insert(userCards)
      .values({
        userId: user.id,
        cardId: product.id,
        nickname: cardDef.nickname,
        openedDate: cardDef.openedDate,
        annualFeeDate: cardDef.feeDate,
        creditLimit: cardDef.creditLimit,
        isActive: true,
      })
      .returning();

    walletCardIds.push(inserted.id);
    console.log(`  ✅ Added: ${product.name} (limit $${cardDef.creditLimit})`);
  }

  // 3. Seed benefit tracking for cards with benefits
  console.log("\n📊 Setting up benefit tracking...");
  for (const userCardId of walletCardIds) {
    const uc = await db.query.userCards.findFirst({
      where: eq(userCards.id, userCardId),
    });
    if (!uc) continue;

    // Find current version benefits
    const version = await db.query.cardVersions.findFirst({
      where: and(
        eq(cardVersions.cardId, uc.cardId),
        eq(cardVersions.isCurrent, true),
      ),
    });
    if (!version) continue;

    const benefits = await db.query.cardBenefits.findMany({
      where: eq(cardBenefits.cardVersionId, version.id),
    });

    for (const benefit of benefits) {
      const existing = await db.query.userBenefitTracking.findFirst({
        where: and(
          eq(userBenefitTracking.userId, user.id),
          eq(userBenefitTracking.benefitId, benefit.id),
          eq(userBenefitTracking.userCardId, userCardId),
        ),
      });

      if (existing) continue;

      // Simulate partial usage (30-80% used)
      const totalValue = Number(benefit.value);
      const usageRate = 0.3 + Math.random() * 0.5;
      const amountUsed = Math.round(totalValue * usageRate * 100) / 100;

      await db.insert(userBenefitTracking).values({
        userId: user.id,
        benefitId: benefit.id,
        userCardId: userCardId,
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        amountUsed: amountUsed.toString(),
        amountAvailable: totalValue.toString(),
      });
    }

    const product = await db.query.creditCardProducts.findFirst({
      where: eq(creditCardProducts.id, uc.cardId),
    });
    console.log(`  ✅ Tracked ${benefits.length} benefits for ${product?.name}`);
  }

  // 4. Seed offers
  console.log("\n🎯 Creating sample offers...");
  let offerCount = 0;

  for (const offerDef of SAMPLE_OFFERS) {
    const sourceHash = `demo_${offerDef.issuer}_${offerDef.merchantName.toLowerCase().replace(/\s/g, "_")}`;

    const existing = await db.query.offers.findFirst({
      where: eq(offers.sourceHash, sourceHash),
    });

    if (existing) {
      offerCount++;
      continue;
    }

    await db.insert(offers).values({
      issuer: offerDef.issuer,
      merchantName: offerDef.merchantName,
      title: offerDef.title,
      description: offerDef.title,
      offerType: offerDef.offerType,
      value: offerDef.value.toString(),
      valueType: offerDef.valueType,
      requiresAdd: Math.random() > 0.5,
      startDate: "2025-01-01",
      endDate: "2026-06-30",
      sourceHash,
      scrapedAt: new Date(),
    });
    offerCount++;
  }
  console.log(`  ✅ ${offerCount} offers (${SAMPLE_OFFERS.length} total)`);

  // 5. Create a saved scenario
  console.log("\n📐 Creating saved scenario...");
  const existingScenario = await db.query.spendScenarios.findFirst({
    where: and(
      eq(spendScenarios.userId, user.id),
      eq(spendScenarios.name, "My Monthly Spend"),
    ),
  });

  if (!existingScenario) {
    await db.insert(spendScenarios).values({
      userId: user.id,
      name: "My Monthly Spend",
      description: "Typical monthly spending pattern",
      config: {
        monthly_spend: {
          dining: 500,
          groceries: 800,
          travel: 300,
          gas: 200,
          streaming: 50,
          online_shopping: 400,
          transit: 150,
          general: 1500,
        },
        cards: walletCardIds,
        allocation: {},
      },
      results: {
        total_points: 284000,
        total_cashback: 4200,
        per_card: [],
        calculated_at: new Date().toISOString(),
      },
    });
    console.log("  ✅ Created 'My Monthly Spend' scenario");
  } else {
    console.log("  ⏭️  Scenario already exists");
  }

  // Summary
  console.log("\n" + "─".repeat(50));
  console.log(`🎉 Demo data seeded successfully!`);
  console.log(`   User: ${DEMO_NAME} (${DEMO_CLERK_ID})`);
  console.log(`   Cards in wallet: ${walletCardIds.length}`);
  console.log(`   Offers: ${offerCount}`);
  console.log(`   Scenario: My Monthly Spend`);
  console.log("─".repeat(50));

  await client.end();
}

seedDemo().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
