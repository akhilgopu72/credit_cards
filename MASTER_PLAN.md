# CardMax - Credit Card Optimization Platform
## Master Plan v1.3

> **Mission**: Help people maximize credit card rewards, statement credits, and offers — turning complexity into a competitive advantage.

> **Revenue Model**: Affiliate referral commissions on credit card sign-ups, premium subscription tiers.

> **Prototype Target**: June 1, 2026

---

## Table of Contents
1. [Product Overview](#product-overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Workstreams](#workstreams)
5. [Prototype Scope (Month 1)](#prototype-scope)
6. [Post-Prototype Roadmap](#post-prototype-roadmap)
7. [Technical Decisions](#technical-decisions)
8. [Agent/Worker Assignment Guide](#agent-worker-guide)
9. [Scraper Findings & Technical Notes](#scraper-findings)

---

## 1. Product Overview <a name="product-overview"></a>

### Core Value Propositions
1. **Offer Aggregation** — Surface all active Chase/Amex/CapitalOne offers in one place
2. **Spend Optimization** — Show users which card to use for each merchant/category
3. **Scenario Modeling** — "What if I moved all dining spend to Card X?" projections
4. **Statement Credit Tracking** — Never miss a credit you're entitled to
5. **Merchant Lookup** — Search a merchant, see all earnings/offers across your wallet
6. **Chrome Extension** — At-checkout overlay showing optimal card + active offers
7. **Travel Goal Planning** (post-prototype) — Roadmap a credit card strategy to hit travel goals
8. **Points Usage & Redemption** (post-prototype) — Unified points balances, transfer partner intelligence, and redemption optimization

### User Journey (Prototype)
```
Sign Up → Add Cards to Wallet → See Dashboard (offers, credits, optimization tips)
                                       ↓
                              Search Merchant → See card rankings + offers
                                       ↓
                              Run Scenario → Compare spend strategies
                                       ↓
                              Chrome Extension → See optimal card at checkout
```

---

## 2. Architecture <a name="architecture"></a>

### High-Level System Design
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│   ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐  │
│   │  Web App      │   │  Chrome Ext   │   │  Mobile (future)  │  │
│   │  (Next.js)    │   │  (React)      │   │                   │  │
│   └──────┬───────┘   └──────┬───────┘   └───────────────────┘  │
│          │                   │                                    │
└──────────┼───────────────────┼────────────────────────────────────┘
           │                   │
           ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  API Gateway / Next.js API Routes                         │  │
│   │  - Auth (Clerk)                                           │  │
│   │  - Rate Limiting                                          │  │
│   │  - Request Validation                                     │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐  │
│   │  Card        │ │  Offer       │ │  Scenario               │  │
│   │  Service     │ │  Service     │ │  Engine                 │  │
│   └─────────────┘ └─────────────┘ └─────────────────────────┘  │
│                                                                  │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐  │
│   │  Merchant    │ │  User        │ │  Scraper                │  │
│   │  Service     │ │  Wallet      │ │  Orchestrator           │  │
│   └─────────────┘ └─────────────┘ └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│                                                                  │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│   │  PostgreSQL   │   │  Redis        │   │  S3/Blob         │   │
│   │  (Raw/Neon)   │   │  (Upstash)    │   │  (Scraper Data)  │   │
│   └──────────────┘   └──────────────┘   └──────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SCRAPER LAYER                                │
│                                                                  │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐   │
│   │  Amex Offer   │ │  Chase Offer  │ │  CapOne Offer        │   │
│   │  Scraper      │ │  Scraper      │ │  Scraper             │   │
│   └──────────────┘ └──────────────┘ └──────────────────────┘   │
│                                                                  │
│   Key: User authenticates directly in browser (no credential     │
│   storage). Extension scrapes offers from authenticated session. │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) + TypeScript | Full-stack framework, SSR, API routes |
| **UI Library** | Chakra UI v3 | Component library, theming, accessibility |
| **Database** | PostgreSQL (Neon or self-hosted) | Raw Postgres, no vendor lock-in |
| **ORM** | Drizzle ORM | Type-safe, lightweight, great migrations |
| **Cache** | Redis (Upstash) | Offer caching, rate limiting |
| **Auth** | Clerk | Quick setup, social login, session management |
| **Chrome Extension** | React + Vite (Manifest V3) | Modern extension architecture |
| **Scraper Runtime** | Content scripts via extension | No credential storage needed |
| **Hosting** | Vercel (app) + Neon (db) | Fast deploys, serverless Postgres |
| **Payments** | Stripe (future) | Subscription billing |

---

## 3. Data Model <a name="data-model"></a>

### Core Entities

```
┌─────────────────────────────────────────────────────────────┐
│ credit_card_products                                         │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ issuer          ENUM (amex, chase, capital_one, citi, etc)   │
│ name            TEXT (e.g. "Chase Sapphire Reserve")          │
│ slug            TEXT UNIQUE                                   │
│ network         ENUM (visa, mastercard, amex)                │
│ annual_fee      DECIMAL                                      │
│ is_active       BOOLEAN                                      │
│ image_url       TEXT                                          │
│ affiliate_url   TEXT                                          │
│ created_at      TIMESTAMP                                    │
│ updated_at      TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ card_versions                                                │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ card_id         UUID FK → credit_card_products               │
│ version         INT                                          │
│ effective_date  DATE                                         │
│ end_date        DATE NULLABLE                                │
│ annual_fee      DECIMAL                                      │
│ sign_up_bonus   JSONB                                        │
│   {points, spend_requirement, timeframe_months}              │
│ base_earn_rate  JSONB                                        │
│   {points_per_dollar, currency}                              │
│ is_current      BOOLEAN                                      │
│ created_at      TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ card_category_bonuses                                        │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ card_version_id UUID FK → card_versions                      │
│ category        TEXT (dining, travel, groceries, gas, etc)   │
│ multiplier      DECIMAL (e.g. 3.0 for 3x)                   │
│ cap_amount      DECIMAL NULLABLE (annual cap)                │
│ cap_period      ENUM (monthly, quarterly, annually, none)    │
│ conditions      JSONB (special conditions/restrictions)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ card_benefits                                                │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ card_version_id UUID FK → card_versions                      │
│ benefit_type    ENUM (statement_credit, travel_credit,       │
│                       lounge_access, insurance, perk, etc)   │
│ name            TEXT                                          │
│ description     TEXT                                          │
│ value           DECIMAL                                      │
│ frequency       ENUM (monthly, quarterly, semi_annual,       │
│                       annual, one_time)                       │
│ auto_trigger    BOOLEAN (auto-applied vs needs enrollment)   │
│ merchant_id     UUID FK → merchants NULLABLE                 │
│ conditions      JSONB                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ merchants                                                    │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ name            TEXT                                          │
│ slug            TEXT UNIQUE                                   │
│ category        TEXT                                          │
│ mcc_codes       TEXT[] (merchant category codes)             │
│ website_domain  TEXT                                          │
│ logo_url        TEXT                                          │
│ aliases         TEXT[] (alternative names)                    │
│ created_at      TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ offers                                                       │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ issuer          ENUM                                         │
│ card_name       TEXT (raw from scraper, e.g. "Platinum Card®")│
│ card_id         UUID FK → credit_card_products NULLABLE      │
│ merchant_id     UUID FK → merchants NULLABLE                 │
│ merchant_name   TEXT (raw from scraper)                       │
│ merchant_domain TEXT NULLABLE (TLD from scraper, e.g.         │
│                   "homedepot.com" — strongest for CapOne)     │
│ title           TEXT                                          │
│ description     TEXT                                          │
│ offer_type      ENUM (cashback, points_bonus, discount,      │
│                       statement_credit)                       │
│ value           DECIMAL                                      │
│ value_type      ENUM (percentage, fixed, points_multiplier,  │
│                       points_flat)                            │
│ min_spend       DECIMAL NULLABLE                             │
│ max_reward      DECIMAL NULLABLE                             │
│ use_limit       INT NULLABLE (times offer can be used;       │
│                   null=single use)                            │
│ start_date      DATE                                         │
│ end_date        DATE                                         │
│ requires_add    BOOLEAN (needs to be added to card)          │
│ source_hash     TEXT UNIQUE (dedup key)                       │
│ scraped_at      TIMESTAMP                                    │
│ created_at      TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ users                                                        │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ clerk_id        TEXT UNIQUE                                   │
│ email           TEXT                                          │
│ name            TEXT                                          │
│ created_at      TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ user_cards (wallet)                                          │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ user_id         UUID FK → users                              │
│ card_id         UUID FK → credit_card_products               │
│ nickname        TEXT NULLABLE                                 │
│ opened_date     DATE NULLABLE                                │
│ annual_fee_date DATE NULLABLE                                │
│ credit_limit    DECIMAL NULLABLE                             │
│ sign_up_bonus_override JSONB NULLABLE                        │
│   {points, spend_requirement, timeframe_months, currency}    │
│   Overrides the public SUB from card_versions when set.      │
│   Supports targeted/elevated offers that vary by user.       │
│ is_active       BOOLEAN                                      │
│ created_at      TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ user_offers                                                  │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ user_id         UUID FK → users                              │
│ offer_id        UUID FK → offers                             │
│ user_card_id    UUID FK → user_cards                         │
│ is_added        BOOLEAN (has user added offer to card)       │
│ is_used         BOOLEAN                                      │
│ added_at        TIMESTAMP NULLABLE                           │
│ used_at         TIMESTAMP NULLABLE                           │
│ scraped_at      TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ user_benefit_tracking                                        │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ user_id         UUID FK → users                              │
│ benefit_id      UUID FK → card_benefits                      │
│ user_card_id    UUID FK → user_cards                         │
│ period_start    DATE                                         │
│ period_end      DATE                                         │
│ amount_used     DECIMAL                                      │
│ amount_available DECIMAL                                     │
│ last_updated    TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ spend_scenarios                                              │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ user_id         UUID FK → users                              │
│ name            TEXT                                          │
│ description     TEXT NULLABLE                                │
│ config          JSONB                                        │
│   {                                                          │
│     monthly_spend: {                                         │
│       dining: 500,                                           │
│       groceries: 800,                                        │
│       travel: 300,                                           │
│       gas: 200,                                              │
│       general: 1500                                          │
│     },                                                       │
│     cards: [card_id, card_id],                               │
│     allocation: {                                            │
│       card_id: { dining: 100%, groceries: 50% }              │
│     }                                                        │
│   }                                                          │
│ results         JSONB (cached calculation results)           │
│ created_at      TIMESTAMP                                    │
│ updated_at      TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘
```

### User Transactions (for Scenario Modeling)
```
┌─────────────────────────────────────────────────────────────┐
│ user_transactions                                            │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ user_id         UUID FK → users                              │
│ user_card_id    UUID FK → user_cards                         │
│ transaction_date DATE                                        │
│ merchant_name   TEXT (raw from statement)                     │
│ merchant_id     UUID FK → merchants NULLABLE (resolved)      │
│ amount          DECIMAL                                      │
│ category        TEXT (mapped spend category)                  │
│ mcc_code        TEXT NULLABLE                                │
│ source          ENUM (csv_upload, extension_scrape, plaid)   │
│ raw_category    TEXT NULLABLE (original category from bank)  │
│ source_hash     TEXT UNIQUE (dedup across imports)            │
│ created_at      TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────┘
```

### Point Valuation Reference Table
```
┌─────────────────────────────────────────────────────────────┐
│ point_valuations                                             │
│─────────────────────────────────────────────────────────────│
│ id              UUID PK                                      │
│ program         TEXT (Chase UR, Amex MR, CapOne Miles, etc)  │
│ cpp_value       DECIMAL (cents per point)                    │
│ cpp_premium     DECIMAL (transfer partner premium value)     │
│ last_updated    DATE                                         │
│ source          TEXT                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Workstreams <a name="workstreams"></a>

### WS1: Card Database & Benefits Engine
**Owner**: Backend Agent
**Priority**: P0 (Foundation)
**Description**: Build and seed the credit card product database with versioned benefits, category bonuses, and statement credits.

**Tasks**:
- [x] Define Drizzle schema for all card-related tables
- [x] Build seed script with top 30 popular credit cards (`packages/card-data/src/cards.ts` — 30 cards across 7 issuers with full categoryBonuses + benefits)
- [x] Build point valuation system (8 programs: Chase UR, Amex MR, CapOne Miles, Citi TYP, Delta SkyMiles, Hilton Honors, Marriott Bonvoy, Cash Back)
- [ ] Create card version management system
- [x] Build API endpoint: GET /api/cards (returns all card products)
- [ ] Build API endpoints: GET /cards/:slug, GET /cards/:slug/benefits
- [ ] Build category bonus calculation engine
- [ ] Create admin interface for managing card data

**Key Cards to Seed (Phase 1)**:
- Chase: Sapphire Reserve, Sapphire Preferred, Freedom Unlimited, Freedom Flex, Ink Business Preferred, Ink Business Cash, Ink Business Unlimited
- Amex: Platinum, Gold, Green, Blue Cash Preferred, Blue Cash Everyday, Hilton Honors, Delta SkyMiles Gold/Platinum/Reserve, Marriott Bonvoy Brilliant
- Capital One: Venture X, Venture, SavorOne, Quicksilver
- Citi: Premier, Double Cash, Custom Cash, Strata Premier

---

### WS2: User Wallet & Dashboard
**Owner**: Frontend Agent
**Priority**: P0 (Core UX)
**Description**: Build the user-facing dashboard where users manage their card wallet, see optimization tips, and track benefits.

**Tasks**:
- [x] Set up Next.js 15 project with App Router
- [x] Integrate Clerk auth (keys configured, middleware protecting dashboard routes)
- [x] Integrate Chakra UI v3 with custom theme (`apps/web/src/lib/theme.ts` — custom colors, fonts, component recipes)
- [x] Build dashboard layout with sidebar navigation (`apps/web/src/app/dashboard/layout.tsx`)
- [x] Build card wallet page — add cards from database, view wallet, edit/remove (`apps/web/src/app/dashboard/wallet/page.tsx`)
- [x] Build dashboard homepage with:
  - [x] Card count, active offers, credits available/used
  - [x] Upcoming annual fee dates
  - [x] Card summaries with issuer badges
- [x] Build offers page with filtering/sorting by issuer, value, expiry (`apps/web/src/app/dashboard/offers/page.tsx`)
- [x] Build card detail view (`apps/web/src/app/dashboard/cards/[slug]/page.tsx`)
- [x] Responsive design + polish (Merchants, Scenarios, Recommendations refactored to semantic theme tokens, responsive flex/grid, mobile-friendly tables)

---

### WS3: Offer Scraping System
**Owner**: Scraper Agent
**Priority**: P0 (Core Value)
**Description**: Build scrapers that extract offers from card issuer portals. Users authenticate directly in their browser — we never store credentials.

**Architecture**:
```
Chrome Extension detects user on issuer portal
  → Injects content script
  → Scrapes offer data from DOM
  → Sends to our API
  → API normalizes + deduplicates
  → Offers appear in dashboard
```

**Tasks**:
- [x] Research Amex offer DOM structure (amexoffers page)
- [x] Research Chase offer DOM structure (chase.com/offers)
- [x] Research Capital One offer DOM structure (capitaloneoffers.com live DOM analysis — see Section 9)
- [x] Build Amex content script (heading-based container-walking approach)
- [x] Build Chase content script (role="button" div parsing)
- [x] Build offer normalization pipeline
- [x] Build deduplication logic (source_hash with cardName for per-card dedup)
- [x] Fix stale/duplicate offers on re-scrape (identity-based sourceHash + delete-before-insert)
  - Root cause: `createSourceHash` included `value`/`title`, so value changes → new hash → new row; `onConflictDoNothing` never updated old rows
  - Fix: sourceHash uses only `issuer:cardName:merchantDomain|merchantName` (identity fields); POST handler deletes all offers for the `issuer+cardName` pair in a transaction before inserting the fresh batch
  - Edge case: `user_offers` FK handled by deleting referencing rows first within the transaction
  - Edge case: `cardName IS NULL` from prior scrapes treated as a separate pair; cleaned up manually
- [x] Build API endpoint to receive scraped offers (POST /api/offers)
- [x] Build Capital One content script (`apps/extension/src/content/capital-one-scraper.ts` — rewritten based on live DOM)
- [x] Test Capital One scraper end-to-end (3,865 offers scraped, all with `merchantDomain` from TLD)
- [x] Build merchant resolution service (`apps/web/src/server/services/merchant-resolution.ts`)
  - 4-tier resolution: exact domain → exact alias → exact name → fuzzy (pg_trgm > 0.3)
  - Batch mode pre-loads all merchants into memory for O(1) exact matching
  - Auto-creates merchants from high-confidence Capital One domains
- [x] Integrate merchant resolution into offer ingestion (POST /api/offers resolves on ingest)
- [x] Build name normalization pipeline for Amex/Chase offers (`normalizeMerchantName()`, `extractDomainFromName()`)
  - Strips dash taglines ("Arlo - Smart Home Security Cameras" → "Arlo")
  - Strips parentheticals ("Air France (through Amex Travel only)" → "Air France")
  - Detects domain-style names ("oribe.com" → domain lookup + friendly name "Oribe")
  - Strips card qualifiers ("Breitling - Platinum Card Offer" → "Breitling")
  - Strips trademark symbols (®, ™, ©)
  - Generates ordered candidate list, most-normalized first, raw fallback last
- [x] Test merchant resolution on Amex/Chase offers — **100% resolution on all issuers**
  - Amex: 62% → 100% (423/423 resolved)
  - Chase: 78% → 100% (108/108 resolved)
  - Capital One: 100% unchanged (3,865/3,865)
- [x] Auto-create merchants from name-only offers (Amex/Chase) via `createMerchantFromName()`
  - Uses best normalized name as canonical merchant record
  - Deduplicates by normalized name to avoid creating "Arlo" twice
  - 53 new merchants auto-created from Amex/Chase name-only offers
- [x] Unit tests for normalization functions (20 tests, `merchant-resolution.test.ts`)
- [ ] Handle offer expiration and cleanup

**Scraper Approach Details**:
- **No credential storage**: Extension only activates when user is already logged in
- **Content scripts**: Inject into issuer pages to read offer cards/tiles
- **Normalization**: Parse merchant name, discount amount, expiration, terms
- **Dedup**: Hash offer attributes to avoid duplicates across scrape sessions

---

### WS4: Merchant Lookup & Optimization
**Owner**: Backend + Frontend Agent
**Priority**: P0 (Key Feature)
**Description**: Enable users to search for a merchant and see all earning rates, active offers, and sign-up bonus opportunities across their wallet.

**Tasks**:
- [x] Build merchant database + search (pg_trgm full-text search with fuzzy matching)
- [x] Seed 73 merchants across 12 categories (`apps/web/src/server/db/seed-merchants.ts`)
- [x] Auto-expand merchant DB via Capital One domain matching (73 seeded → 3,813 total merchants)
- [x] Create pg_trgm migration for fuzzy search (`apps/web/drizzle/0001_add_trgm.sql`)
- [x] Build merchant search API: GET /api/merchants/search?q= (Zod-validated, configurable threshold/limit)
- [x] Build merchant detail API: GET /api/merchants/:slug (card rankings + active offers)
- [x] Build merchant lookup page with card rankings, offers, issuer badges (`apps/web/src/app/merchants/page.tsx`)
- [ ] Build MCC code → category mapping
- [ ] Build "best card for this purchase" recommendation engine
- [ ] Integrate merchant data with Chrome extension

---

### WS5: Scenario Modeling & Card Recommendation Engine
**Owner**: Backend Agent
**Priority**: P0 (Core Value + Monetization)
**Description**: Three-mode engine that optimizes the user's wallet, recommends new cards from the full catalog, and builds optimal multi-card strategies. This is the primary affiliate revenue driver.

**Completed Tasks**:
- [x] Build scenario input UI (monthly spend by category) (`apps/web/src/app/scenarios/page.tsx`)
- [x] Build allocation engine (assign categories to cards) (`apps/web/src/server/services/scenario-engine.ts`)
- [x] Build projection calculator (base earn rates, category caps, SUB progress, credits, annual fees, CPP)
- [x] Build comparison view (current vs. proposed)
- [x] Build "optimize for me" auto-allocation (greedy: highest multiplier per category)
- [x] Save/load scenarios (POST /api/scenarios with calculate/optimize/save actions)
- [x] Build scenario API endpoint with Zod-validated discriminated union schema
- [x] MCC code → spend category mapping (`packages/shared/src/mcc-mapping.ts` — 580+ codes)

**Three Engine Modes**:

```
Mode 1: "Optimize My Wallet"              Mode 2: "Recommend Cards"              Mode 3: "Build Optimal Wallet"
(existing, enhanced)                       (new — affiliate engine)               (new — killer feature)
┌─────────────────────────┐               ┌─────────────────────────┐            ┌─────────────────────────┐
│ Input: user's wallet    │               │ Input: spend profile    │            │ Input: spend profile +  │
│ cards + spend profile   │               │ only                    │            │ constraints (max cards, │
│                         │               │                         │            │ issuers, budget)        │
│ Output: best allocation │               │ Evaluates ALL cards in  │            │                         │
│ of spend across cards   │               │ database against spend  │            │ Finds optimal N-card    │
│ user already has        │               │                         │            │ combination from full   │
│                         │               │ Output: ranked card     │            │ catalog                 │
│ Enhanced: factors in    │               │ recommendations with    │            │                         │
│ net value (rewards +    │               │ net value breakdown +   │            │ Output: recommended     │
│ credits - fees)         │               │ affiliate links         │            │ wallet + allocation +   │
│                         │               │                         │            │ comparison vs current   │
└─────────────────────────┘               └─────────────────────────┘            └─────────────────────────┘
```

**Mode 1: Optimize My Wallet** (enhance existing):
- [x] Basic allocation engine (greedy highest multiplier)
- [x] Enhance optimizer to consider net value: (category_rewards + credits_value - annual_fee)
  - `autoOptimizeNetValue()` — greedy allocation then prunes cards with negative net contribution
  - API: `POST /api/scenarios?action=optimize` with `use_net_value: true`
- [ ] Factor in category bonus caps when comparing cards (a 5x card with $1,500 quarterly cap isn't best for $2,000/mo dining)
- [ ] Show per-card net value breakdown in results

**Mode 2: Recommend Cards** (new — the affiliate revenue driver):
- [x] Build `evaluateCardForSpendProfile(card, monthlySpend)` function:
  - Compute annual category rewards (spend × multiplier × CPP, respecting caps)
  - Compute total credit/benefit value (annualized, with user perk toggles)
  - Compute annual fee
  - Compute sign-up bonus value (year 1 only, if SUB requirement meetable from spend profile)
  - Net value = rewards + credits + SUB(year1) - annual_fee
- [x] Build `POST /api/scenarios?action=recommend` endpoint:
  - Input: `{ monthly_spend, perk_preferences?, max_results? }`
  - Evaluates all `creditCardProducts` (not just wallet cards)
  - Returns ranked list with full breakdown per card
  - Include `affiliate_url` from `creditCardProducts` table in response
- [x] Build perk/benefit valuation toggle system:
  - **Auto-valued** (always counted): statement_credit, travel_credit, dining_credit, uber_credit, streaming_credit
  - **User-toggled** (opt-in with default values): entertainment_credit, hotel_credit, airline_credit, wellness_credit, shopping_credit
  - **Excluded by default**: insurance, perk, lounge_access (hard to quantify)
  - `PerkPreferences` type + `DEFAULT_PERK_PREFERENCES` in scenario-engine.ts
- [x] Build recommendation UI page (`/recommendations`):
  - Spend profile input (reuse existing component)
  - Perk toggle panel (which perks do you actually use?)
  - Ranked card results with: card name, issuer, net value, value breakdown, "Apply Now" affiliate CTA
  - Comparison: "vs. your best current card" delta
- [x] Build card comparison view (select 2-3 cards, side-by-side breakdown)

**Mode 3: Build Optimal Wallet** (new — documented for post-prototype):
- [ ] Build combinatorial optimizer: given spend profile + max N cards, find the N-card combination that maximizes total net value
  - Algorithm: evaluate all C(cards, N) combinations, score each by optimal allocation net value
  - With ~30 cards: C(30,2)=435, C(30,3)=4060, C(30,4)=27405 — all tractable
  - For each combination, run autoOptimize to find best allocation, then calculate net value
  - Optimization: prune cards with negative net value before combinatorial search
  - Edge case: consider issuer rules (Chase 5/24, Amex once-per-lifetime) as constraints
- [ ] Build optimal wallet UI:
  - Input: spend profile + "How many cards?" slider + issuer preferences + perk toggles
  - Output: recommended N-card wallet with full allocation map
  - Comparison: "Your current wallet: $X/year net value → Recommended wallet: $Y/year net value"
  - Per-category breakdown: "Dining → Amex Gold (4x), Groceries → Amex Gold (4x), Travel → CSR (3x), Everything else → CFU (1.5x)"
  - "How to get there" roadmap: which cards to apply for first, spend requirements, timeline
- [ ] Factor in cross-card synergies (e.g., Amex ecosystem: Platinum + Gold + BBP share MR pool)
- [ ] Factor in application rules (Chase 5/24, Amex once-per-lifetime) as constraints

**Offer Schema Fixes** (needed for accurate rewards):
- [x] Split `value_type: "points"` into `"points_multiplier"` and `"points_flat"`
  - Schema already supported both; deprecated old `"points"` enum with backwards-compat fallback in rewards calculator
  - Amex scraper: already parsed correctly into `points_multiplier` / `points_flat`
  - Capital One scraper: already parsed correctly (multiplier miles vs flat miles)
  - Chase scraper: added `points_multiplier` detection (`/(\d+)[Xx]\s*(?:bonus\s+)?(?:points|pts)/i`) + updated `offerType` derivation
- [x] Fix Amex points-per-dollar parsing (already correct — `parseOfferDescription()` handles both per-dollar and flat points)
- [x] Fix Capital One scraper to tag multipliers vs flat amounts at parse time (already correct — `parseValueText()` distinguishes "4X miles" vs "4,000 miles")
- [x] Add `use_limit INT NULLABLE` column to offers table (already in schema + Zod validation + Amex scraper extracts it)

**Rewards Calculation Engine** (`rewards-calculator.ts` — enhances existing):
- [x] `calculateTransactionRewards(transaction, card, activeOffers) → RewardResult`
- [x] Offer bonus rewards by type (fixed, percentage, points_multiplier, points_flat)
- [ ] Batch mode: `calculateBatchRewards(transactions[]) → { perTransaction[], summary }`
- [ ] "Best card" per transaction: rank all cards by total reward

**Transaction Import** (post-prototype):
- [ ] Phase 1: CSV/OFX upload → parse → categorize → feed into scenario engine
- [ ] Phase 2: Chrome extension transaction scraping from bank activity pages
- [ ] Phase 3: Plaid integration (premium tier)
- [ ] "Actual vs. optimized" comparison (what you earned vs. what you could have)

**Transaction Import Strategy** (replaces manual spend input with real data):
```
Phase 1: CSV/OFX Upload (Prototype)
┌────────────────────────────────────────────────────────────────┐
│ User downloads statement CSV/OFX from bank portal               │
│   → Uploads to CardMax                                          │
│   → Parser extracts: date, merchant, amount, category (if any)  │
│   → Categorization engine maps merchant → spend category         │
│   → Populates scenario engine with actual monthly spend          │
│   → Shows "actual vs. optimized" comparison                      │
│                                                                  │
│ Supported formats: Chase CSV, Amex CSV, Capital One CSV,        │
│   generic OFX/QFX, Mint/Copilot export                          │
└────────────────────────────────────────────────────────────────┘

Phase 2: Chrome Extension Transaction Scraping
┌────────────────────────────────────────────────────────────────┐
│ Extension detects user on bank transaction/activity page         │
│   → Content script scrapes transaction list from DOM             │
│   → Same pattern as offer scraping (no credential storage)       │
│   → Sends batch to API with user auth token                      │
│   → Transactions categorized + aggregated into monthly spend     │
│                                                                  │
│ Issuer pages:                                                    │
│   Chase: chase.com/web/auth/dashboard (activity tab)             │
│   Amex: americanexpress.com/activity                             │
│   Capital One: myaccounts.capitalone.com/accountSummary          │
└────────────────────────────────────────────────────────────────┘

Phase 3: Plaid Integration (Post-Prototype / Premium)
┌────────────────────────────────────────────────────────────────┐
│ Connect bank accounts via Plaid Link                             │
│   → Auto-sync transactions (categorized by Plaid)               │
│   → Continuous background refresh                                │
│   → Best UX but has per-connection cost                          │
│   → Premium tier feature                                         │
└────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions**:
- Transactions stored in `user_transactions` table, linked to `user_cards`
- MCC code → spend category mapping reused from WS4 merchant data
- Aggregation layer summarizes transactions into monthly-spend-by-category format the scenario engine already accepts
- "Actual vs. optimized" shows: "You earned X points, but if you'd used Card Y for dining, you'd have earned Z"
- Privacy: raw transactions stay server-side, never exposed to extension or third parties

**Rewards Calculation Pipeline** (transaction → rewards):
```
Transaction ingested (merchant, amount, card, date)
  → Resolve merchant_id (existing merchant resolution)
  → Look up card's base earn rate for merchant's category
  → Find active offers matching merchant_id + card + date range
  → Calculate rewards:
      Base:  category_bonus.multiplier × amount × point_value
      Offer: depends on offer value_type:
        fixed:            value (if amount >= min_spend, uses remaining)
        percentage:       min(amount × value/100, max_reward remaining)
        points_multiplier: amount × value bonus points
        points_flat:      value flat points (if amount >= min_spend)
  → Sum: total_reward = base + offer bonus
  → Store: user_transaction_rewards (link txn → reward breakdown)
  → Aggregate: dashboard stats, actual vs optimized comparison
```

---

### WS6: Chrome Extension
**Owner**: Extension Agent
**Priority**: P1 (Differentiator)
**Description**: Build Manifest V3 Chrome extension that shows optimal card + offers at checkout.

**Tasks**:
- [x] Set up Vite + React Chrome extension scaffold (Manifest V3)
- [x] Build popup UI (mini dashboard with scrape button, results, API sync status)
- [x] Build checkout page detection (detect when user is on payment page)
- [x] Build merchant identification from current page URL/content
- [x] Build overlay showing:
  - Best card to use
  - Active offers for this merchant
  - Points you'll earn
  - Remaining spend needed for sign-up bonus
- [x] Build offer scraper content scripts (WS3 integration — Amex + Chase working)
- [x] Build communication between extension ↔ web app API (popup direct sync + background worker)
- [ ] Publish to Chrome Web Store (unlisted for beta)

---

### WS8: Card Benefits Data Pipeline
**Owner**: Backend Agent
**Priority**: P1 (Data Freshness)
**Description**: Automated pipeline to keep card benefits, category bonuses, and terms up to date by scraping public issuer product pages. Eventually ingest PDF benefit guides for precise terms.

**Architecture**:
```
Phase 1: Public Page Scraping
┌────────────────────────────────────────────────────────────┐
│ Scheduled Job (cron / Vercel Cron)                          │
│   → Fetch public card product pages                         │
│       e.g. chase.com/personal/credit-cards/sapphire/reserve │
│       e.g. americanexpress.com/us/credit-cards/card/platinum│
│   → LLM extracts structured data from HTML                  │
│       (annual fee, earn rates, bonuses, benefits, credits)  │
│   → Diff against current card_versions                      │
│   → If changes detected:                                    │
│       → Create pending_card_update record                   │
│       → Flag for admin review (or auto-publish if high      │
│         confidence)                                         │
│   → Admin approves → new card_version created               │
│       (old version: is_current=false, end_date=today)       │
│       (new version: is_current=true)                        │
└────────────────────────────────────────────────────────────┘

Phase 2: PDF Benefit Guide Ingestion (Post-Prototype)
┌────────────────────────────────────────────────────────────┐
│ Upload or auto-fetch benefit guide PDFs                      │
│   → PDF parsing (pdf-parse or similar)                      │
│   → LLM extracts detailed benefit terms                     │
│       (insurance coverage, purchase protection limits,      │
│        exact credit terms, enrollment requirements)         │
│   → Merges with existing card_version data                  │
│   → Surfaces precise terms in benefit detail views          │
└────────────────────────────────────────────────────────────┘
```

**Public Product Page URLs (Phase 1 Targets)**:
- Chase: `chase.com/personal/credit-cards/{product-family}/{card-name}`
- Amex: `americanexpress.com/us/credit-cards/card/{card-slug}`
- Capital One: `capitalone.com/credit-cards/{card-slug}`
- Citi: `citi.com/credit-cards/citi-{card-slug}`

**Tasks**:
- [ ] Build URL registry of public card product pages
- [ ] Build HTML fetcher with rate limiting + caching
- [ ] Build LLM extraction prompt for structured card data
- [ ] Build diff engine (compare extracted vs current card_version)
- [ ] Build pending_card_update review queue
- [ ] Build admin approval UI (accept/reject/edit changes)
- [ ] Set up cron schedule (weekly scan)
- [ ] Phase 2: PDF upload + parsing pipeline
- [ ] Phase 2: LLM extraction for detailed benefit terms

---

### WS7: Travel Goal Planning (Post-Prototype)
**Owner**: TBD
**Priority**: P2 (Growth Feature)
**Description**: Ingest travel goals and reverse-engineer a credit card strategy.

**Tasks** (future):
- [ ] Build travel goal input (destination, class, hotel, dates)
- [ ] Build transfer partner database (which points transfer where)
- [ ] Build award chart database (approximate)
- [ ] Build strategy generator:
  - Which cards to open
  - In what order
  - How to allocate spend to hit bonuses
  - When to apply (respect 5/24 rules, etc.)
- [ ] Integrate affiliate links into recommendations
- [ ] Build timeline/roadmap visualization

### WS9: Points Usage & Redemption Optimization (Post-Prototype)
**Owner**: TBD
**Priority**: P2 (Growth Feature — high user value)
**Description**: Close the loop from earning to burning. Give users unified visibility into their points balances, transfer partner intelligence, and AI-powered redemption recommendations to maximize the value of their rewards.

**Competitive context**: Miso (miso.com) is building "agentic travel" — AI that books flights/hotels using points via text. Their approach is full-service booking. CardMax's approach is **recommendation + optimization** — we help users understand *how* to use points, not book on their behalf. This keeps us lightweight and avoids the regulatory/liability surface of acting as a travel agent.

**Layer 1: Points Balance Dashboard**
- [ ] Build balance scraping via Chrome extension (detect issuer dashboard pages, extract point/mile balances)
  - Chase UR balance from chase.com dashboard
  - Amex MR balance from americanexpress.com dashboard
  - Capital One Miles from capitalone.com dashboard
  - Airline/hotel loyalty balances (Delta, United, Hilton, Marriott, etc.)
- [ ] Build manual balance entry as fallback (user inputs balances directly)
- [ ] Build `user_point_balances` table (user_id, program, balance, last_updated, source)
- [ ] Build unified balance dashboard UI showing all programs with real-time valuations
  - e.g., "80,000 Chase UR = ~$1,200 travel value" using existing `point_valuations` CPP data
- [ ] Build balance history tracking (trend over time, earn rate visualization)

**Layer 2: Transfer Partner Intelligence**
- [ ] Build `transfer_partners` table:
  - `id`, `from_program` (Chase UR, Amex MR, etc.), `to_program` (United, Hyatt, etc.)
  - `transfer_ratio` (e.g., 1:1, 1:1.5), `minimum_transfer`, `transfer_time`
  - `is_active`, `last_verified`
- [ ] Build `transfer_bonuses` table (periodic promotions):
  - `partner_id`, `bonus_percentage`, `start_date`, `end_date`, `source_url`
- [ ] Build transfer partner map UI (which points go where, at what ratio)
- [ ] Build transfer bonus alerts (e.g., "30% bonus to British Airways this month — your 60k MR → 78k Avios")
- [ ] Seed transfer partner data for Chase UR, Amex MR, Capital One Miles, Citi TYP

**Layer 3: Redemption Optimizer**
- [ ] Build trip input UI (origin, destination, dates, class, hotel tier)
- [ ] Build redemption comparison engine:
  - Portal booking value (e.g., Chase Travel Portal at 1.5 cpp)
  - Transfer to airline X (e.g., 43k United miles for economy)
  - Transfer to airline Y (e.g., 50k ANA miles for business via Virgin Atlantic)
  - Cash price comparison (is it worth using points or paying cash?)
- [ ] Build "best redemption path" recommendation (considering user's actual balances)
- [ ] Integrate with scenario engine: "If I earn 50k more UR over 6 months, here's what I unlock"
- [ ] Build redemption value scoring (cpp achieved per redemption vs. baseline)

**Layer 4: Award Availability Integration (Advanced)**
- [ ] Research award search APIs (Seats.aero, AwardFares, etc.) for pricing/availability
- [ ] Build award availability cache (refresh periodically for popular routes)
- [ ] Surface real-time award seat availability in redemption recommendations
- [ ] Build "sweet spot" database (known high-value redemptions per program)
  - e.g., "ANA First Class LAX→TYO for 110k Virgin Atlantic miles = 8+ cpp"
- [ ] Build alerts: "Award space opened on your saved route"

**Data Model Additions**:
```
user_point_balances (user_id, program, balance, last_updated, source)
transfer_partners (from_program, to_program, ratio, min_transfer, transfer_time)
transfer_bonuses (partner_id, bonus_pct, start_date, end_date)
award_sweet_spots (program, route_type, cabin, points_required, typical_cash_value, cpp)
```

**Key Design Decisions**:
- Balance scraping reuses existing extension content script pattern — incremental, not a new architecture
- Transfer partner data is relatively static (quarterly changes) — seed once, maintain via WS8 pipeline
- Redemption optimizer is read-only recommendation — we never book or transact on user's behalf
- Layer 4 (award availability) depends on third-party API access — evaluate cost/reliability before committing
- Privacy: point balances are sensitive financial data, server-side only, never exposed to extension or third parties

---

## 5. Prototype Scope (Target: June 1, 2026) <a name="prototype-scope"></a>

### Week 1: Foundation (Feb 19 - Feb 25)
- [x] Create master plan
- [x] **WS1**: Set up project (Next.js, PostgreSQL, Drizzle, Clerk)
- [x] **WS1**: Define and migrate database schema (offers, credit_card_products, merchants, users, etc.)
- [x] **WS1**: Created `cardmax` PostgreSQL database, pushed schema via drizzle-kit
- [x] **WS1**: Seed top 30 credit cards with full benefits data (30 cards, 7 issuers, 8 point programs)
- [x] **WS2**: Set up auth flow (Clerk keys configured, middleware protecting routes)
- [x] **WS2**: Built card wallet page (add cards from database, edit/remove)
- [x] **WS3**: Built Amex offer scraper (heading-based container-walking, card name detection)
- [x] **WS3**: Built Chase offer scraper (role="button" div parsing, card detection)
- [x] **WS3**: Built offer normalization + dedup pipeline (sourceHash with cardName)
- [x] **WS6**: Set up Chrome extension scaffold (Vite + React, Manifest V3)
- [x] **WS6**: Built popup with scrape button, results display, direct API sync
- [x] **WS6**: End-to-end pipeline working: scraper → popup → API → PostgreSQL
- [x] **Milestone**: 455 offers scraped across 3 cards (172 Amex Gold, 179 Amex Platinum, 104 Chase Ink Preferred)

### Week 2: Core Features (Feb 26 - Mar 4)
- [x] **WS1**: Complete seeding of top 30 cards (done — 30 cards with full benefits in `packages/card-data`)
- [x] **WS2**: Build dashboard with stats, offers page, wallet page
- [x] **WS2**: Integrate Chakra UI v3 with custom theme + sidebar layout
- [x] **WS3**: Research Capital One DOM + rewrite scraper based on live findings
- [x] **WS4**: Build merchant database + search (70+ merchants, pg_trgm fuzzy search)
- [x] **WS4**: Build merchant lookup page with card rankings + active offers
- [x] **WS5**: Build scenario engine + UI (calculate, optimize, save)
- [x] **Infra**: Build shared API types system (Zod schemas → OpenAPI spec → React hook codegen)
- [x] **WS3**: Test Capital One scraper end-to-end (3,865 offers, 100% merchant resolution)
- [x] **WS4**: Build merchant resolution service (domain → alias → name → fuzzy)
- [x] **WS4**: Integrate resolution into offer ingestion pipeline
- [x] **Milestone**: 4,320 offers (351 Amex + 104 Chase + 3,865 Capital One), 3,813 merchants in DB

### Week 3: Integration & Polish (Mar 5 - Mar 11)
- [x] **WS3**: Build name normalization pipeline (strips taglines, parentheticals, domains, trademarks)
- [x] **WS3**: Test merchant resolution on Amex/Chase — **100% resolution across all 3 issuers**
- [x] **WS3**: Auto-create merchants from name-only Amex/Chase offers (53 new merchants)
- [x] **WS3**: Unit tests for normalization functions (20 tests passing)
- [x] **Milestone**: 4,396 offers, **100% merchant resolution** across all issuers (3,873 merchants in DB)
- [x] **WS3**: Fix stale/duplicate offers on re-scrape (identity-based sourceHash + delete-before-insert transaction)
- [ ] **WS3**: Build offer expiration/cleanup logic
- [x] **WS4**: Build MCC code → category mapping (`packages/shared/src/mcc-mapping.ts` — 580+ codes)
- [x] **WS2**: Build card detail view (`apps/web/src/app/dashboard/cards/[slug]/page.tsx`)
- [x] **WS2**: Complete Wallet API CRUD (GET/POST/PUT/PATCH/DELETE with validation)
- [ ] **WS3**: Build offer expiration/cleanup logic
- [x] **WS6**: Build checkout page detection + overlay
- [ ] **WS8**: Begin public page scraping for card data freshness

### Week 4: Card Recommendation Engine (Mar 12 - Mar 18)
- [x] **WS5**: Build `evaluateCardForSpendProfile()` — net value calculation for any card against a spend profile
- [x] **WS5**: Build perk/benefit valuation toggle system (auto-valued credits vs user-toggled perks)
- [x] **WS5**: Build `POST /api/scenarios?action=recommend` — evaluate all cards in catalog
- [x] **WS5**: Enhance Mode 1 optimizer to use net value (rewards + credits - fees) instead of greedy multiplier

### Week 5: Recommendation UI & Extension (Mar 19 - Mar 25)
- [x] **WS5**: Build recommendation UI page with spend input, perk toggles, ranked card results, affiliate CTAs (`/recommendations`)
- [x] **WS5**: Build card comparison view (2-3 cards side-by-side, per-category winner highlighting)
- [x] **WS6**: Build extension popup with merchant lookup (MerchantSearch component + shared config)
- [x] **WS6**: Build checkout page detection + overlay (Shadow DOM banner, SPA-aware, domain exclusions)
- [x] **Testing**: 57 unit tests for scenario engine (evaluateCardForSpendProfile, recommendCards, autoOptimizeNetValue, perk tiers, caps)
- [x] **Infra**: Moved Merchants/Scenarios/Recommendations pages under `/dashboard/` layout (sidebar was missing)
- [x] **WS5**: Fixed recommend endpoint auth — made public (catalog evaluation doesn't need user context)
- [x] **Testing**: E2E browser testing — dashboard, offers (381), merchants, scenarios, recommendations (full flow: spend input → API → ranked results → card detail expansion → 3-card comparison table)
- [x] **Infra**: Formatting consistency pass (import ordering, unused imports removed across 16 files)

### Week 6: Polish & Responsive (Mar 26 - Apr 1)
- [x] **Bugfix**: Fixed `isDbConfigured()` excluding local dev DB — was routing to fallback layer with random UUIDs
- [x] **Bugfix**: Fixed cards search API — `ilike` on enum column (`issuer`) caused PostgreSQL error; removed issuer from text search (exact filter still works via `?issuer=` param)
- [x] **Testing**: API endpoint verification — all 7 public endpoints passing (cards list/search/filter/slug, merchants search/slug, recommend)
- [x] **WS5**: Offer schema fixes — split points into `points_multiplier`/`points_flat` across all 3 scrapers + rewards calculator fallback for deprecated `"points"` enum
- [x] **WS2**: Dashboard polish — Merchants, Scenarios, Recommendations pages refactored to semantic theme tokens (`bg.surface`, `fg.muted`, `success.fg`, `danger.fg`, `brand.fg`, etc.), responsive flex/grid, mobile-friendly tables
- [x] **Testing**: Chrome browser visual verification — all polished pages rendering correctly (search results, card rankings, scenario inputs, recommendation results with MiniStat cards)
- [ ] **WS3**: Build offer expiration/cleanup logic
- [x] User onboarding flow — built 3-step wizard matching Stitch designs (card selection → spend profile → rewards reveal)
- [x] **Testing**: E2E API testing — wallet CRUD (add/update/delete/duplicate-guard/error-cases), scenario calculate/optimize/net-value/save/list, dashboard stats (cards/credits/fees/summaries)

### Week 7: Obsidian Architect Design System & Transaction Scraping (Mar 29 - Apr 1)
- [x] **WS5**: Chase transaction scraper — discriminated union types (`ChaseScrapedTransaction` | `AmexScrapedTransaction` | `CapitalOneScrapedTransaction`), Chase category code mapping, `POST /api/transactions` endpoint, extension content script (26 txns scraped from live Chase account)
- [x] **WS5**: Pivoted transaction source from DOM scraping to Plaid after discovering Chase's rich internal API (MCC codes, rewards earned, enriched merchants)
- [x] **Design**: Generated "Obsidian Architect" design system via Google Stitch — 10 screens (dashboard, wallet, merchants, scenarios, recommendations, landing page, onboarding 3-step, chrome popup, heatmap)
- [x] **Design**: Full Chakra theme rewrite — dark surfaces (#0e0e0e → #2c2c2c), green (#3fff8b) + blue (#6e9bff) accents, Manrope/Inter fonts, ghost borders, ambient glow shadows
- [x] **WS2**: Landing page rewrite — "Maximize Every Swipe" hero, partner logos, feature grid, stats, CTAs
- [x] **WS2**: Dashboard redesign — bento grid layout with "Best Card Right Now" widget, Transactions panel, Reward Velocity chart, Points Balance
- [x] **WS2**: Scenarios redesign — split-panel layout (left inputs, right results), metrics tiles, Optimized Path Comparison, Category Allocation Matrix
- [x] **WS2**: Recommendations update — "Elite Recommendations" header, Trust Partners sidebar, Stitch pill buttons
- [x] **WS2**: Sidebar redesign — Substrate Shift active state, green accent indicator, "PREMIUM REWARDS" subtitle
- [x] **WS2**: Wallet/Merchants/Offers visual updates — darker card gradients, "Maximize every swipe" hero, larger headings
- [x] **WS2**: New onboarding flow (`/onboarding`) — 3-step wizard (card selection → spend profile → rewards reveal), glassmorphism footer, progress bar
- [x] **Infra**: Demo seed script (`db:seed-demo`) — populates 5 wallet cards, 12 offers, benefit tracking, saved scenario
- [x] **Infra**: Zero hardcoded light-mode colors remaining across all dashboard pages (verified via grep)
- [x] **Docs**: Stitch progress tracker (`docs/stitch-progress.md`), hardcoded data audit (`docs/hardcoded-data-audit.md`)

### Week 8: Integration & Deploy (Apr 2 - Apr 15)
- [ ] **WS5**: Document and plan Mode 3 "Build Optimal Wallet" combinatorial optimizer for post-prototype
- [ ] **Testing**: Written integration tests — wallet CRUD API (add/edit/remove cards, verify DB roundtrip)
- [ ] **Testing**: Written integration tests — scenarios API (calculate, optimize, save/load with real DB data)
- [ ] **Testing**: Written integration tests — merchant search + card ranking (fuzzy search, correct ordering)
- [ ] **Testing**: Written integration tests — offer ingestion pipeline (batch upsert, dedup, re-scrape idempotency)
- [ ] **Testing**: Written integration tests — dashboard stats aggregation (counts, upcoming fees, credits)
- [ ] Performance optimization + error handling audit
- [ ] Deploy beta to Vercel + Chrome Web Store (unlisted)
- [ ] Smoke test full user journey: sign up → add cards → scrape offers → search merchants → run scenario

### Prototype Deliverables
1. Web app with auth, card wallet, dashboard, merchant search
2. Scenario modeling (basic)
3. Chrome extension with merchant lookup + checkout overlay
4. Amex + Chase + Capital One offer scraping via extension
5. Benefit/credit tracking
6. Card detail views with full benefits breakdown

---

## 6. Post-Prototype Roadmap <a name="post-prototype-roadmap"></a>

### Month 2-3: Growth & Polish
- **WS8 Phase 1**: Automated card benefits scraping from public product pages
- Capital One scraper completion
- Citi offer scraper
- Travel goal planning (WS7)
- **WS9 Layers 1-2**: Points balance dashboard + transfer partner intelligence
- Affiliate link integration
- User onboarding flow
- Email notifications (expiring offers, upcoming credits)
- Mobile-optimized PWA

### Month 4-6: Scale
- **WS8 Phase 2**: PDF benefit guide ingestion for precise terms
- **WS9 Layers 3-4**: Redemption optimizer + award availability integration
- Additional card issuers (US Bank, Barclays, etc.)
- Community features (deal sharing, offer comparisons)
- Premium tier with advanced features
- API for third-party integrations
- Marketing site + SEO content

---

## 7. Technical Decisions <a name="technical-decisions"></a>

### Why Raw PostgreSQL (Neon) over Supabase?
- No vendor lock-in — standard Postgres everywhere
- Full control over schema, extensions, and configuration
- Neon offers serverless Postgres with branching (great for dev)
- Can migrate to any Postgres host later

### Why Drizzle over Prisma?
- Lighter weight, faster cold starts on Vercel
- SQL-like syntax, more transparent
- Better for complex queries (scenario engine)

### Why Chakra UI over Tailwind?
- Component library with built-in accessibility
- Theming system for consistent brand
- Faster prototyping with pre-built components
- Good dark mode support out of the box

### Why Chrome Extension for scraping?
- **No credential storage risk** — users are already logged in
- Runs in user's browser context with their session
- Can access DOM of issuer portals directly
- Similar pattern to Honey, Rakuten, Capital One Shopping

### Why Clerk for auth?
- Drop-in components, fast setup
- Social login support
- Good Next.js integration
- Webhook support for user events

### Transaction Import Strategy (for Scenario Modeling)
Three-phase approach, progressively better UX:
- **Phase 1 — CSV Upload** (prototype): User downloads bank statement CSV → uploads to CardMax → parser extracts transactions → categorization engine maps to spend categories. Low cost, works everywhere, manual but functional.
- **Phase 2 — Extension scraping** (post-prototype): Same pattern as offer scraping — extension detects user on bank activity page → scrapes transaction list from DOM → sends to API. Zero cost, leverages existing extension infra, but fragile to DOM changes.
- **Phase 3 — Plaid** (premium tier): Plaid Link for auto-sync. Best UX but has per-connection cost ($0.30-$1.50/connection/month). Reserved for premium subscribers.

Key insight: The scenario engine already accepts `monthly_spend: Record<category, amount>`. Transactions just need to be aggregated into that shape — no engine changes required. The real value-add is "actual vs. optimized" comparison: showing what users actually earned vs. what they could have earned with optimal card usage.

### Card Benefits Data Freshness Strategy
Two-layer approach:
- **Layer 1 — Public page scraping**: Weekly cron fetches public card product pages (no login needed), LLM extracts structured benefit data, diffs against current version. Changes flagged for review or auto-published.
- **Layer 2 — PDF benefit guides** (future): Detailed benefit terms PDFs parsed via LLM for precise coverage limits, insurance terms, enrollment requirements.
- **Sign-up bonus overrides**: Public-facing SUB stored on `card_versions`. Users can override with their targeted offer on `user_cards.sign_up_bonus_override`. Scenario engine resolves: `override ?? public`.

### Offer Scraping Strategy
```
1. User installs Chrome extension
2. User visits amex.com/offers (or chase.com, etc.)
3. Extension detects the issuer portal via URL matching
4. Content script activates:
   a. Waits for offer tiles to load
   b. Parses each offer tile (merchant, amount, expiry, terms)
   c. Normalizes data into our schema
   d. Sends batch to our API with user auth token
5. API deduplicates + stores offers
6. Dashboard reflects latest offers
```

### Shared API Types & Codegen Pipeline
Single source of truth for API types, eliminating duplication between backend routes and frontend pages:
```
Zod schemas (types/api/) → OpenAPI 3.0.3 spec (openapi.json) → React hooks (generated/api-client.ts)
```
- **Zod schemas** define request validation (used by API routes) AND TypeScript types (used by frontend)
- **OpenAPI generation**: `@asteasolutions/zod-to-openapi` v7 (v8 needs Zod 4, we use Zod 3)
- **Client codegen**: Custom script generates typed fetch-based React hooks — no React Query dependency
- **Commands**: `pnpm openapi:generate` (spec only), `pnpm api:generate` (spec + client hooks)
- **Generated files are gitignored** — recreate with `pnpm api:generate`

### Merchant Matching Strategy
**Resolution pipeline** (in priority order, first match wins):
1. **Exact domain** — explicit `merchantDomain` field (Capital One provides TLDs)
2. **Domain-from-name** — detect domain-style names like `"oribe.com"` and look up in domain index
3. **Normalized name matching** — generate candidate names via `normalizeMerchantName()` (strips taglines, parentheticals, card qualifiers, trademarks), try each against alias index then name index
4. **Fuzzy** — pg_trgm similarity > 0.3 using the best normalized candidate (not raw name, for higher scores)
5. **Auto-create** — if still unresolved, create merchant from best normalized name (deduped)

**Key design**: `merchantName` on offers table keeps the raw scraped value as display name (e.g., "Air France (through Amex Travel only)"). `merchantId` links to the canonical "Air France" merchant for aggregation/search. No information is lost.

---

## 8. Agent/Worker Assignment Guide <a name="agent-worker-guide"></a>

When spinning up agents to work on this project, reference the workstream assignments above. Each agent should:

1. **Read this MASTER_PLAN.md** before starting any work
2. **Read CLAUDE.md** for project conventions and patterns
3. **Check their workstream's task list** in the relevant docs
4. **Follow the tech stack decisions** — do not introduce new dependencies without updating this plan
5. **Update progress** by checking off tasks in this document

### Agent Roles
| Agent | Workstreams | Focus |
|-------|-------------|-------|
| **Backend Agent** | WS1, WS4, WS5, WS8 | Schema, APIs, calculation engines, data pipeline |
| **Frontend Agent** | WS2 | Web app UI, dashboard, pages |
| **Scraper Agent** | WS3 | Content scripts, normalization |
| **Extension Agent** | WS6 | Chrome extension, popup, overlays |
| **Data Agent** | WS1 (seed) | Research + seed card data |
| **Infra Agent** | All | CI/CD, deployments, monitoring |

### File Structure Convention
```
credit_cards/
├── MASTER_PLAN.md              # This file - source of truth
├── CLAUDE.md                   # Project conventions for AI agents
├── package.json
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── scripts/            # Build scripts
│   │   │   ├── generate-openapi.ts      # Generates openapi.json from Zod schemas
│   │   │   ├── generate-api-client.ts   # Generates typed React hooks from OpenAPI
│   │   │   └── seed-merchants.ts        # Seeds 70+ merchants into database
│   │   ├── drizzle/            # Database migrations
│   │   │   └── 0001_add_trgm.sql        # pg_trgm extension for fuzzy search
│   │   ├── openapi.json        # Generated — do not edit (gitignored)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages + API routes
│   │   │   │   ├── dashboard/  # Dashboard layout + pages (wallet, offers)
│   │   │   │   ├── merchants/  # Merchant lookup page
│   │   │   │   ├── scenarios/  # Scenario modeling page
│   │   │   │   └── api/        # API route handlers
│   │   │   ├── components/     # React components
│   │   │   ├── generated/      # Auto-generated code (gitignored)
│   │   │   │   └── api-client.ts  # Generated React hooks + types
│   │   │   ├── lib/            # Utilities
│   │   │   │   ├── theme.ts    # Chakra UI v3 custom theme
│   │   │   │   └── openapi.ts  # OpenAPI registry (Zod → OpenAPI)
│   │   │   ├── server/         # Server-side code
│   │   │   │   ├── db/         # Drizzle schema + migrations
│   │   │   │   └── services/   # Business logic
│   │   │   │       ├── scenario-engine.ts       # Spend optimization engine
│   │   │   │       ├── merchant-resolution.ts   # Merchant matching (domain/alias/name/fuzzy + normalization)
│   │   │   │       └── merchant-resolution.test.ts  # Unit tests for normalization (20 tests)
│   │   │   └── types/
│   │   │       └── api/        # Shared API types (single source of truth)
│   │   │           ├── common.ts     # Shared schemas (SignUpBonus, issuer constants)
│   │   │           ├── dashboard.ts  # DashboardStats types
│   │   │           ├── wallet.ts     # WalletCard types + validation schemas
│   │   │           ├── offers.ts     # Offer types + scraper schemas
│   │   │           ├── merchants.ts  # Merchant types + search schema
│   │   │           ├── scenarios.ts  # Scenario request schemas
│   │   │           └── index.ts      # Barrel re-export
│   │   └── ...
│   └── extension/              # Chrome extension
│       ├── manifest.json
│       ├── src/
│       │   ├── popup/          # Extension popup UI
│       │   ├── content/        # Content scripts (scrapers)
│       │   │   ├── amex-scraper.ts
│       │   │   ├── chase-scraper.ts
│       │   │   └── capital-one-scraper.ts
│       │   ├── background/     # Service worker
│       │   └── shared/         # Shared utilities
│       └── ...
├── packages/
│   ├── shared/                 # Shared types, constants
│   └── card-data/              # Card database seed data (30 cards, 8 point programs)
└── docs/                       # Additional documentation
    ├── api.md
    ├── scraping.md
    └── data-model.md
```

---

## 9. Scraper Findings & Technical Notes <a name="scraper-findings"></a>

### Amex Scraper (`apps/extension/src/content/amex-scraper.ts`)
**Approach**: Heading-based container-walking. Amex organizes offers under headings like "Added to Card" and "Add to Card". The scraper finds these headings, walks sibling elements to extract offer cards.

**Key Findings**:
- Offers are organized under section headings — the scraper uses heading text to determine `requiresAdd` status
- Card name detection was tricky: the combobox selector has a **stale `aria-label`** that doesn't update when switching cards. The visible child text does update. Solution: find leaf elements ending with "Card" whose parent contains card number dot pattern (`[•·]{1,4}\d{4,5}`)
- Added "Amex Venue Collection"-style headings to skip list since they don't contain standard merchant offers
- sourceHash includes cardName for per-card deduplication
- Tested: 172 offers (Amex Gold), 179 offers (Amex Platinum)

**DOM Structure**:
```
Card selector: combobox → generic (stale aria-label) → generic "American Express Gold Card" + generic "•45000"
Offer sections: heading "Added to Card" → sibling offer containers → merchant name, value, expiry
```

### Chase Scraper (`apps/extension/src/content/chase-scraper.ts`)
**Approach**: Button-pattern matching. Chase renders offers as `<div role="button">` (not `<button>` elements) with merchant logos, names, and cashback values.

**Key Findings**:
- Chase uses ARIA roles extensively: `role="button"` for offer tiles, `role="heading"` for card names
- The accessible name (from `<img alt>`) differs from `textContent` — the alt contains "1 of 97 Stitch Fix..." but textContent is just "Stitch Fix$12 cash back"
- Card name format: `"Ink Preferred (...1327)"` — parsed with regex `^(.+?)\s*\((?:\.{3}|…)\d{4}\)$`
- Offer values parsed from text patterns: "$X cash back", "X% back", etc.
- "Added" status detected from both explicit text labels and accessible name
- Expiry dates not available on the offer hub list view (only on individual offer detail pages)
- Tested: 102 offers (Chase Ink Preferred, 2 added + 100 available)

**DOM Structure**:
```
Card heading: [role="heading"] → "Ink Preferred (...1327)"
Offer tile: [role="button"] → img (alt="1 of 97 MerchantName CashBack") + text children
```

### Capital One Scraper (`apps/extension/src/content/capital-one-scraper.ts`)
**Approach**: Category-container parsing. Capital One organizes offers on `capitaloneoffers.com` by merchant category sections.

**Key Findings** (from live DOM analysis on capitaloneoffers.com):
- Offers live at `capitaloneoffers.com` (NOT `myaccounts.capitalone.com`)
- Page uses a React app with offers organized in category containers
- Each category has a heading (e.g., "Dining", "Travel") with offer cards beneath
- Offer cards contain: merchant name, offer value (e.g., "5% back"), expiration date, terms
- Card selector available in top nav — need to detect which card is selected
- Auth required: user must be logged into Capital One to see personalized offers
- Manifest URL patterns updated to include `capitaloneoffers.com/*`

**DOM Structure**:
```
Category section → heading ("Dining") → offer grid → offer card
  → merchant logo/name
  → offer value text ("5% back" / "$10 off")
  → expiry text ("Expires MM/DD/YYYY")
  → "Add to Card" / "Added" status button
```

**Status**: End-to-end tested and operational (Feb 20, 2026)
- 3,865 offers scraped from capitaloneoffers.com
- `merchantTLD` now passed through as `merchantDomain` on each offer
- 100% merchant resolution via domain matching (exact domain → auto-create)
- ~3,740 new merchants auto-created from Capital One TLDs (added to 73 seeded)

### Extension Architecture Notes
- **Popup → API sync is more reliable** than background service worker message flow. The popup `syncOffersToApi()` posts directly to `POST /api/offers`
- **Auth flow**: Currently using dev key `"cardmax-dev-extension"`. Production needs proper Clerk token transfer from web app to extension via `chrome.storage`
- **`host_permissions`**: Must include `http://localhost:3000/*` for the extension to fetch the API (even from service worker)
- **Manifest V3**: Vite build uses a custom `copyManifest()` plugin to copy `manifest.json` to `dist/` directory
- **Offer schema**: Both `card_name` (denormalized text from scraper) and `card_id` (FK to credit_card_products) exist on offers table. The scraper populates `card_name`; `card_id` will be resolved via matching logic later

### Database State (as of Feb 21, 2026)
```
 issuer      | total | resolved | rate
-------------+-------+----------+------
 amex        |   423 |      423 | 100%
 chase       |   108 |      108 | 100%
 capital_one | 2,583 |    2,583 | 100%
```
3,114 total offers. ~3,873 merchants in DB.

**Note**: Capital One count dropped from 3,865 to 2,583 after fixing re-scrape duplicates. The previous count included stale rows from value changes creating new hashes. Current count reflects a clean single snapshot for Venture X.

**Merchant resolution pipeline**: Integrated into `POST /api/offers`. Capital One resolves via exact domain match. Amex/Chase resolve via name normalization pipeline (strips taglines, parentheticals, domain-style names, trademarks, card qualifiers) → alias/name index → fuzzy → auto-create. **100% resolution across all issuers.**

### Offer Refresh Strategy (implemented Feb 21, 2026)
Each scrape is treated as a **complete snapshot** for an `issuer + cardName` pair. The POST handler:
1. Collects unique `{issuer, cardName}` pairs from the incoming batch
2. In a single DB transaction: deletes all existing offers for those pairs (plus `user_offers` FK refs), then inserts the fresh batch
3. `sourceHash` is identity-based (`issuer:cardName:merchantDomain|merchantName`) — value/title changes reuse the same hash, so `onConflictDoNothing` acts as a within-batch safety net only
4. Response includes `deleted` count alongside `inserted` for visibility into data churn

**Known edge case**: If the card name detection fails on one scrape (producing `cardName: null`) but succeeds on the next (producing `cardName: "Venture X"`), the NULL-cardName rows become orphans. These must be cleaned up manually. A future improvement could delete NULL-cardName offers when a non-null batch arrives for the same issuer.

---

## Appendix: Competitive Landscape

| Competitor | What They Do | Our Advantage |
|-----------|-------------|---------------|
| The Points Guy | Content/reviews | We're a tool, not content |
| AwardWallet | Tracks loyalty balances | We optimize spend + scrape offers |
| CardPointers | Card recommendations at checkout | We add scenario modeling + benefit tracking |
| MaxRewards | Offer tracking | We add scenario modeling + travel planning |
| Kudos | Card recommendations | We're deeper on offer aggregation |

Our moat: **Comprehensive scenario modeling + offer scraping + travel goal planning** in one integrated platform.

---

*Last updated: 2026-02-21*
*Version: 1.7 — Fix stale/duplicate offers on re-scrape (identity-based sourceHash, delete-before-insert transaction)*
