# Hardcoded Data Audit

> Tracks all mock/hardcoded data introduced during the Obsidian Architect UI redesign.
> Each entry needs a real API endpoint or data source before production.

## Dashboard (`apps/web/src/app/dashboard/page.tsx`)

### Already API-backed
- `stats.cardsCount` — from `GET /api/dashboard`
- `stats.totalCreditsAvailable` — from `GET /api/dashboard`
- `stats.totalCreditsUsed` — from `GET /api/dashboard`
- `stats.activeOffersCount` — from `GET /api/dashboard`
- `stats.upcomingFees` — from `GET /api/dashboard`
- `stats.cardSummaries` — from `GET /api/dashboard`

### Hardcoded — needs API
| Data | Current Value | Where | API Needed |
|------|--------------|-------|------------|
| User name ("Alex") | `"Alex"` in welcome header | `DashboardPage` | `GET /api/dashboard` should return `user.name` from Clerk/users table |
| Portfolio performance ("up 12%") | Not shown (simplified) | — | Compute from historical spend data once transactions are stored |
| Best Card recommendation | Static "Chase Sapphire Reserve" + "4X Dining" | `BestCardWidget` | New `GET /api/dashboard/best-card?location=` endpoint using merchant resolution + card ranking |
| Card number "8829" | Hardcoded | `BestCardWidget` card visual | Not needed (decorative) |
| "420 points on $105 dinner" | Static text | `BestCardWidget` | Compute from `calculateTransactionRewards()` with best card for detected merchant |
| Transactions list (5 items) | `MOCK_TRANSACTIONS` array | `TransactionsPanel` | `GET /api/transactions/recent` — needs `user_transactions` table + Plaid integration |
| Reward Velocity chart data | `REWARD_VELOCITY = [40,55,35,70,90,85,95]` | `RewardVelocityChart` | Aggregate from `user_transactions` by day-of-week |
| Points balance (842,901) | Hardcoded | `TransactionsPanel` | Scrape from issuer dashboards or manual entry. New `user_point_balances` table (WS9 Layer 1) |
| "Transfer to Partners" link | Non-functional | `TransactionsPanel` | Future WS9 feature — transfer partner database |

## Landing Page (`apps/web/src/app/page.tsx`)

| Data | Current Value | API Needed |
|------|--------------|------------|
| "4,300+ offers tracked" | Static | `SELECT count(*) FROM offers` |
| "30+ cards supported" | Static | `SELECT count(*) FROM credit_card_products WHERE is_active = true` |
| "$2.1M rewards optimized" | Static | Aggregate from all users' scenario results (future) |

## Remaining Pages (to be filled as redesigned)

### Card Wallet (`apps/web/src/app/dashboard/wallet/page.tsx`)
- Card visuals use API data (card name, issuer, network, bonuses) — already backed
- **Stitch shows**: Total Net Value (+$4,850/yr), Total Credits Used ($2,100 with progress bar), Active Multipliers (14x)
- **Hardcoded in Stitch** (not yet implemented): net value stat tile, credits progress bar, multiplier count, "Optimization Recommendation" banner at bottom
- **Issuer gradients** in `ISSUER_BG` map — decorative, no API needed

### Merchant Lookup (`apps/web/src/app/dashboard/merchants/page.tsx`)
- Header updated to "Maximize every swipe." per Stitch
- Search and card ranking results are fully API-backed (existing)
- **Stitch shows but not yet implemented**: Merchant Intelligence sidebar (MCC code 5411, Apple Pay status, Global Acceptance), "Top Tip" box, multiplier legend dots, estimated $/pt values, "Recent Lookups" sidebar
- **Hardcoded in Stitch**: MCC code display, payment method badges, acceptance status

### Scenario Modeling (`apps/web/src/app/dashboard/scenarios/page.tsx`)
- **NEEDS FULL REDESIGN** from `scenario_modeling/code.html` — completely different layout
- Stitch uses split-panel: left 1/3 for spend inputs, right 2/3 for results visualization
- **Stitch hardcodes to track**: Efficiency Score (94.2/100), "Optimal Allocation Found", reward accumulation stacked bar chart, "Optimized Path Comparison" showing 3 wallet combos with projected yields, "Category Allocation Matrix" table with current vs optimal card + multiplier delta + annual delta
- **API needed**: `POST /api/scenarios?action=optimize` already exists but response needs enrichment with efficiency score, path comparison, and per-category deltas

### Card Recommendations (`apps/web/src/app/dashboard/recommendations/page.tsx`)
- **NEEDS FULL REDESIGN** from `card_recommendations/code.html` — different layout
- Stitch shows: "Elite Recommendations" hero with top card as large featured card, Trust Partners grid (Visa, Amex, Chase, Master), "Data Accuracy: 99.4%", secondary cards as smaller cards below
- **Stitch hardcodes to track**: Trust partner logos, data accuracy percentage, "Apply Now" affiliate CTAs, Financial Disclosure footer text
- **API needed**: Current `POST /api/scenarios?action=recommend` works but response could add confidence score

### Chrome Extension Popup
- TBD — will audit when redesigned from `chrome_extension_popup/code.html`
- **Expected hardcodes**: Current merchant detection, best card recommendation, recent lookups

### Onboarding Flow
- TBD — will audit when redesigned from onboarding step HTML files
- **Expected hardcodes**: "Connect with Plaid" flow, donut chart, rewards projection

---

## Priority API Endpoints to Build

1. **`GET /api/dashboard`** — Add `userName` field to existing endpoint
2. **`GET /api/dashboard/best-card`** — New. Returns best card for user's most frequent category
3. **`GET /api/transactions/recent`** — New. Requires `user_transactions` table (Plaid)
4. **`GET /api/points/balance`** — New. Requires `user_point_balances` table (WS9)
5. **`GET /api/stats/velocity`** — New. Weekly reward aggregation from transactions
