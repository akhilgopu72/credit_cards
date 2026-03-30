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
- **REDESIGNED** to Stitch split-panel layout (left inputs, right results)
- **Already API-backed**: Projected yield, total points, optimized allocation, per-category card assignment
- **Hardcoded — needs API**:

| Data | Current Value | API Needed |
|------|--------------|------------|
| Efficiency Score | Static "94.2/100" | New field in optimize response: compute from `(optimized_value / theoretical_max) * 100` |
| "Optimal Allocation Found" | Static text | Derive from whether optimize found improvements vs current |
| CPP Valuation "1.45 cpp" | Static | Already have `point_valuations` table — use weighted avg across user's cards |
| Reward Accumulation chart bars | Static bar heights [75,60,100,15,50] | Compute from actual per-category points earned in optimization response |
| Path Comparison "All-In Chase" combo | Not shown (only recommended + current) | WS5 Mode 3: combinatorial optimizer evaluating multiple wallet strategies |
| Ann. Delta in allocation matrix | Rough estimate `spend * (mult-1) * 0.015 * 12` | Use actual CPP from point_valuations for precise delta calculation |

### Card Recommendations (`apps/web/src/app/dashboard/recommendations/page.tsx`)
- Header updated to "Elite Recommendations" with "Intelligent Insights" green label per Stitch
- Results rendering and spend input flow preserved — fully API-backed
- Trust Partners sidebar added (VISA, AMEX, CHASE, MASTER) with Data Accuracy: 99.4%
- Stitch-style pill buttons for Sort and Find Best Cards
- **Still needs**: Hero featured card layout for #1 result (full-width with card image)
- **Stitch hardcodes to track**: Trust partner logos (VISA, AMEX, CHASE, MASTER), "Data Accuracy: 99.4%", Financial Disclosure footer text, "Apply Now" affiliate CTAs
- **API needed**: Confidence/accuracy score in recommend response, affiliate URL tracking

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
