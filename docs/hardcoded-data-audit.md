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
- TBD — will audit when redesigned from `card_wallet/code.html`

### Merchant Lookup (`apps/web/src/app/dashboard/merchants/page.tsx`)
- TBD — will audit when redesigned from `merchant_lookup/code.html`
- **Expected hardcodes**: MCC code display, "Merchant Intelligence" sidebar, "Top Tip" box

### Scenario Modeling (`apps/web/src/app/dashboard/scenarios/page.tsx`)
- TBD — will audit when redesigned from `scenario_modeling/code.html`
- **Expected hardcodes**: Efficiency score, reward accumulation chart

### Card Recommendations (`apps/web/src/app/dashboard/recommendations/page.tsx`)
- TBD — will audit when redesigned from `card_recommendations/code.html`
- **Expected hardcodes**: Trust partners grid, "Data Accuracy: 99.4%"

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
