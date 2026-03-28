# Capital One Offers - DOM Research

> Researched via live browser DOM inspection on 2026-02-20

## Two Offer Sources

Capital One has two separate offer systems:

### 1. Capital One Shopping (capitaloneoffers.com) - PRIMARY TARGET
- **URL**: `capitaloneoffers.com/feed?viewInstanceId=XXX&initialContentSlug=ease-web-l2`
- **Type**: Affiliate shopping offers (miles multipliers at merchants)
- **Volume**: 88+ offers visible, with "View More Offers" pagination
- **This is the equivalent of Amex Offers / Chase Offers**

### 2. Card Offers (myaccounts.capitalone.com/Card/.../offerCenter)
- **Type**: Product upsells (savings accounts), balance transfers, referrals
- **Volume**: 2-3 offers typically
- **NOT useful for merchant offer scraping**

The account overview page (`myaccounts.capitalone.com/Card/...`) also shows an
"Activate shopping offers" section with 4-5 featured shopping offers inline.

## capitaloneoffers.com DOM Structure

### Card Name
```
<p class="text-white hidden md:block">Venture X...6887</p>
```
- Located in the top header area
- Format: `{CardName}...{last4digits}`
- Parse with regex: `/^(.+?)\.\.\.\d{4}$/` → card name

### Offer Tiles
```
div[role="button"][data-testid^="feed-tile-"]
  └── div.standard-tile.relative.flex.flex-col.justify-between
      ├── div.flex.flex-col.items-center  (logo + channel)
      │   ├── img.max-w-full  (merchant logo, alt is EMPTY for standard tiles)
      │   └── h2.text-[13px]  → "Online" | "In-Store & Online" | "In-Store & In-App" | "At the Pump"
      └── div.flex.items-center.justify-center  (value)
          → "3X miles" | "Up to 4X miles" | "4,000 miles"
```

### data-testid Encoding (HIGH CONFIDENCE)
The `data-testid` attribute is `feed-tile-{base64}` where the base64 decodes to:
```json
{
  "v": 1,
  "viewContext": "{\"id\":\"...\",\"src\":\"ease-web-l2\",\"rwd\":\"feed\"}",
  "inventory": {
    "source": "standard",        // or "showcase"
    "merchantTLD": "homedepot.com"  // THE KEY FIELD - merchant domain
  },
  "offers": ["affiliate"]
}
```

### React Component Props (HIGH CONFIDENCE)
Accessible via `element.__reactFiber$XXX.child.memoizedProps.tile`:

**Standard tiles:**
```ts
{
  merchantTLD: "homedepot.com",
  type: "Standard",
  text: "Online",           // channel
  buttonText: "2X miles",   // displayed value
  imageSrc: "...",           // merchant logo URL
  id: "..."                  // same base64 as data-testid
}
```

**Showcase tiles (featured/promoted):**
```ts
{
  merchantTLD: "us.trip.com",
  type: "Showcase",
  text: "Online",
  buttonText: "Shop Now",         // CTA, not the value!
  rateText: "Up to 5X miles",     // THE ACTUAL VALUE
  headingText: "Travel More...",   // promo headline
  subText: "Find great deals...", // promo description
  altText: "us.trip.com offer...", // full accessibility text
  imageSrc: "...",
  defaultAssetPath: "...",
  staticAssetPath: "..."
}
```

### Value Formats Observed
- Multiplier: `"2X miles"`, `"3X miles"`, `"Up to 4X miles"`, `"Up to 16X miles"`
- Fixed miles: `"700 miles"`, `"1,500 miles"`, `"4,000 miles"`, `"Up to 6,200 miles"`
- CTA (showcase only): `"Shop Now"` → use `rateText` instead

### Channel Types
- `"Online"` (most common)
- `"In-Store & Online"`
- `"In-Store & In-App"`
- `"At the Pump"` (gas stations)

### Page Sections
1. **Card selector** — button at top-left with card name
2. **Bonus banner** — "Earn an additional +2X miles with your Venture X card"
3. **Search bar** — `input[placeholder="Search for stores & categories"]`
4. **Featured Offers for You** — horizontal scroll of 4-5 tiles
5. **Today's Top Offer** — special large tile with "Get This Offer" button
6. **New Offers Revealed Daily** — countdown tiles for upcoming offers
7. **Additional Offers for You** — main grid with category filter tabs
8. **View More Offers** — pagination button at bottom

### Category Filters
New, Apparel, Travel & Entertainment, Home, General Retail, Beauty,
Dining & Grocery, Hobbies & Gifts, Shoes & Accessories, Luxury Goods,
Health & Wellness, Electronics & Online Services, Office

### Framework
- React-based SPA
- Tailwind CSS utility classes
- React fiber keys: `__reactFiber$XXXXX`, `__reactProps$XXXXX`

## myaccounts.capitalone.com - Inline Offers

### "Activate shopping offers" Section
On the account overview page, offers appear as buttons:
```
button "lululemon, 3X miles, Earn now"
button "Macy's, Up to 16X miles, Earn now"
button "Walmart, 2X miles, Earn now"
```
- Accessible name format: `"{MerchantName}, {Value}, Earn now"`
- Parse with regex: `/^(.+?),\s*(.+?\s*miles),\s*Earn now$/i`
- Only shows 4-5 featured offers (not the full list)

## Key Differences from Amex/Chase

| Aspect | Amex | Chase | Capital One |
|--------|------|-------|-------------|
| Domain | americanexpress.com | chase.com | capitaloneoffers.com |
| Offer type | Card-specific targeted | Card-specific targeted | Affiliate shopping |
| "Add to card" | Yes | Yes | No (click-through) |
| Merchant name | In DOM text | In DOM text | Only as TLD in metadata |
| Expiration dates | Visible | Not on list view | Not visible |
| Card selector | Combobox with stale aria-label | role="heading" | `<p>` with "...XXXX" |
| Tile element | Heading-based containers | `div[role="button"]` | `div[role="button"][data-testid]` |

## What Still Needs Live Testing

- [ ] Clicking "View More Offers" — does it load inline or navigate?
- [ ] Clicking an offer tile — does it show detail with expiration?
- [ ] Multiple cards — does the card selector change offers?
- [ ] Does the feed URL change with different cards?
- [ ] Full merchant name from offer detail pages
