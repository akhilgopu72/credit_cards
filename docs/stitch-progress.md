# Stitch Design Implementation Progress

> Tracking the implementation of Google Stitch "Obsidian Architect" designs into the CardMax web app.
> Stitch assets: `/Users/rengoaidev/Downloads/stitch/`
> Design spec: `stitch/obsidian_reserve/DESIGN.md`

## Design System

**Status: Complete**

- Theme rewrite: `apps/web/src/theme/index.ts` — Obsidian dark tokens, Manrope/Inter fonts, ambient glow shadows, ghost borders, pill radii
- Global CSS: dark input overrides, heading letter-spacing
- Font setup: `apps/web/src/app/layout.tsx` — next/font/google for Manrope + Inter

**Key tokens:**
- Surfaces: #0e0e0e → #1a1919 → #201f1f → #262626 → #2c2c2c
- Green accent: #3fff8b (rewards, positive values)
- Blue accent: #6e9bff (brand, secondary data)
- Text: #ffffff / #adaaaa / #767575
- Borders: rgba(255,255,255,0.08) ghost borders

---

## Pages

### Landing Page — 90% Complete
- **File**: `apps/web/src/app/page.tsx`
- **Stitch ref**: `stitch/marketing_landing_page/`
- **Done**: Hero ("Maximize Every Swipe"), partner logos, 6 feature cards, stats row (4,300+ / 30+ / $2.1M), CTA sections, dark nav with green pill button, footer
- **Remaining**: Add dashboard mockup image in hero, animate stats on scroll

### Dashboard — 85% Complete
- **File**: `apps/web/src/app/dashboard/page.tsx`
- **Stitch ref**: `stitch/main_dashboard/`
- **Done**: "Welcome back, Alex." header, 4 stat tiles (uppercase labels, large values), "Best Card Right Now" bento widget with card art visual + OPTIMIZED pill + 4X multiplier, Transactions panel (5 items with category pills + points earned), Reward Velocity bar chart, Current Points Balance (842,901)
- **Remaining**: Make Best Card widget use real recommendation API, replace mock transactions with real data (Plaid), dynamic reward velocity from transaction history
- **Hardcodes**: User name, transactions, velocity chart, points balance, Best Card recommendation

### Wallet — 70% Complete
- **File**: `apps/web/src/app/dashboard/wallet/page.tsx`
- **Stitch ref**: `stitch/card_wallet/`
- **Done**: "My Wallet" Manrope header, darker issuer card gradients, dark theme tokens throughout, 5 seeded cards showing with bonuses/fees
- **Remaining**: Add Stitch stat tiles (Total Net Value +$4,850/yr, Total Credits Used with progress bar, Active Multipliers 14x), card art visual in card headers, "Optimization Recommendation" banner at bottom

### Merchants — 65% Complete
- **File**: `apps/web/src/app/dashboard/merchants/page.tsx`
- **Stitch ref**: `stitch/merchant_lookup/`
- **Done**: "Maximize every swipe." hero headline, dark theme, search + results fully API-backed, ranking left-border colors (green/yellow/orange)
- **Remaining**: Merchant Intelligence sidebar (MCC code display, Apple Pay status, acceptance), multiplier legend dots (5x+/3x+/1x-2x), "Top Tip" box, estimated $/pt values, "Recent Lookups" sidebar

### Scenarios — 85% Complete
- **File**: `apps/web/src/app/dashboard/scenarios/page.tsx`
- **Stitch ref**: `stitch/scenario_modeling/`
- **Done**: Full split-panel redesign (left 1/3 inputs, right 2/3 results), "MONTHLY ESTIMATES" recessed inputs, "INCLUDED ASSETS" pill badges, 3 metric tiles (Projected Yield, Efficiency Score, Points/Miles), Reward Accumulation chart, Optimized Path Comparison, Category Allocation Matrix table with optimal card + multiplier + annual delta
- **Remaining**: Real chart data (currently static bar heights), efficiency score from API, precise CPP-based delta calculation
- **Hardcodes**: Efficiency Score 94.2, CPP 1.45, chart bar heights, delta formula approximation

### Recommendations — 70% Complete
- **File**: `apps/web/src/app/dashboard/recommendations/page.tsx`
- **Stitch ref**: `stitch/card_recommendations/`
- **Done**: "INTELLIGENT INSIGHTS" / "Elite Recommendations" header, Stitch pill toggle buttons (Year 1 / Ongoing), Trust Partners sidebar (VISA, AMEX, CHASE, MASTER), Data Accuracy badge (99.4%), results grid layout
- **Remaining**: Hero featured card layout for #1 result (full-width with card image, feature pills, Apply Now CTA), Financial Disclosure footer, card grid for #2-4 results
- **Hardcodes**: Trust partner logos, data accuracy percentage

### Offers — 75% Complete
- **File**: `apps/web/src/app/dashboard/offers/page.tsx`
- **Stitch ref**: None (no Stitch design for this page)
- **Done**: Dark theme, larger Manrope heading, fully API-backed (393 offers showing), search/filter/sort working
- **Remaining**: Could benefit from Stitch-style card redesign, but functional as-is

### Onboarding — 90% Complete (NEW)
- **File**: `apps/web/src/app/onboarding/page.tsx`
- **Stitch ref**: `stitch/onboarding_step_1/`, `stitch/onboarding_step_2/`, `stitch/onboarding_step_3/`
- **Done**: Full 3-step wizard — Step 1 card selection grid with green checkmarks, Step 2 spend category inputs with defaults, Step 3 "+$4,200" reveal with points + optimization upside + best card per category. Progress bar, glassmorphism footer, ambient background glows, Back/Continue flow, "Go to Dashboard" CTA
- **Remaining**: Connect to real APIs (card search, recommend endpoint), Plaid integration for Step 2 pre-fill
- **Hardcodes**: Popular cards array, default spend values, results projections ($4,200, 284K pts, $800 upside, best card per category)

### Sidebar — 90% Complete
- **File**: `apps/web/src/app/dashboard/layout.tsx`
- **Done**: Substrate Shift active state (bright bg + green left border indicator), dimmed inactive items, "PREMIUM REWARDS" subtitle, Support link, green CardMax logo mark
- **Remaining**: Material icons instead of Unicode characters

---

## Not Yet Implemented

### Chrome Extension Popup
- **Stitch ref**: `stitch/chrome_extension_popup/`
- **Scope**: Separate codebase (`apps/extension/src/popup/`)
- **Design**: Compact dark popup with merchant detection, best card recommendation, active offers, quick actions, recent lookups
- **Priority**: P2 — tackle after web app design is finalized

### Mobile Responsive
- **Stitch ref**: Not generated (skipped mobile prompt)
- **Priority**: P2 — generate Stitch mobile designs and implement responsive breakpoints

---

## Reference Files

- **Design Spec**: `/Users/rengoaidev/Downloads/stitch/obsidian_reserve/DESIGN.md`
- **Hardcoded Data Audit**: `/Users/rengoaidev/credit_cards/docs/hardcoded-data-audit.md`
- **Competitive Analysis**: `/Users/rengoaidev/credit_cards/docs/competitive-analysis-miso.md`

## Stitch HTML Sources (for future reference)

Each folder in `/Users/rengoaidev/Downloads/stitch/` contains:
- `code.html` — Full Tailwind HTML source (translate to Chakra)
- `screen.png` — Screenshot of the generated design

| Folder | Page | Lines |
|--------|------|-------|
| `main_dashboard/` | Dashboard | 425 |
| `card_wallet/` | Wallet | 351 |
| `merchant_lookup/` | Merchants | 310 |
| `scenario_modeling/` | Scenarios | 410 |
| `card_recommendations/` | Recommendations | 354 |
| `marketing_landing_page/` | Landing | ~350 |
| `chrome_extension_popup/` | Extension popup | ~200 |
| `onboarding_step_1_build_your_wallet/` | Onboarding Step 1 | ~210 |
| `onboarding_step_2_spending_profile_updated/` | Onboarding Step 2 | ~250 |
| `onboarding_step_3_rewards_unlocked/` | Onboarding Step 3 | ~180 |
| `heatmap_of_card_recommendations/` | UX heatmap overlay | — |
| `obsidian_reserve/` | Design system spec | DESIGN.md |
