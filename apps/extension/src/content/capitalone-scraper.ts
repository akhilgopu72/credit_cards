import type { ScrapedOffer, ExtensionMessage } from "@cardmax/shared";

/**
 * Capital One Offer Scraper
 *
 * Activates on:
 *   - capitaloneoffers.com/feed* (main shopping offers page)
 *   - myaccounts.capitalone.com/* (account overview with inline offers)
 *
 * Strategy: Capital One Shopping offers are rendered as div[role="button"]
 * elements with data-testid containing base64-encoded JSON metadata that
 * includes the merchant TLD. The visible tile text contains the channel
 * ("Online", "In-Store & Online") and the value ("3X miles", "Up to 4X miles").
 *
 * The React component props (accessible via __reactFiber) contain the full
 * tile data as a fallback. Standard tiles have: merchantTLD, type, text,
 * buttonText. Showcase tiles also have: rateText, headingText, subText, altText.
 *
 * Card name is found in a <p> element with "text-white" class showing
 * "Venture X...6887" format, or from the card selector button.
 *
 * Key differences from Amex/Chase:
 *   - Offers are "affiliate" type (shopping click-throughs, not card-specific)
 *   - No "added to card" status — all are available
 *   - No expiration dates visible on the feed page
 *   - Merchant name is derived from TLD, not displayed as text
 *   - The offers live on capitaloneoffers.com, a separate domain
 */

// ─── Source Hash ──────────────────────────────────────────────────

function createSourceHash(offer: Partial<ScrapedOffer>): string {
  const raw = `capitalone:${offer.cardName || ""}:${offer.merchantDomain || offer.merchantName}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `capitalone_${Math.abs(hash).toString(36)}`;
}

// ─── TLD to Merchant Name ────────────────────────────────────────

/**
 * Convert a merchant TLD to a display name.
 * e.g. "homedepot.com" → "Home Depot", "us.trip.com" → "Trip.com"
 */
function tldToMerchantName(tld: string): string {
  // Known TLD → name mappings for common merchants
  const knownMerchants: Record<string, string> = {
    "homedepot.com": "Home Depot",
    "bedbathandbeyond.com": "Bed Bath & Beyond",
    "turbotax.intuit.com": "TurboTax",
    "us.trip.com": "Trip.com",
    "qatarairways.com": "Qatar Airways",
    "stubhub.com": "StubHub",
    "ihg.com": "IHG Hotels",
    "booking.com": "Booking.com",
    "samsung.com": "Samsung",
    "containerstore.com": "The Container Store",
    "mattressfirm.com": "Mattress Firm",
    "target.com": "Target",
    "macys.com": "Macy's",
    "groupon.com": "Groupon",
    "verizon.com": "Verizon",
    "disneyplus.com": "Disney+",
    "udemy.com": "Udemy",
    "chfresco.com": "Chopt",
    "etsy.com": "Etsy",
    "taxslayer.com": "TaxSlayer",
    "lowes.com": "Lowe's",
    "cookunity.com": "CookUnity",
    "apple.com": "Apple",
    "expedia.com": "Expedia",
    "charlestyrwhitt.com": "Charles Tyrwhitt",
    "babbel.com": "Babbel",
    "lululemon.com": "Lululemon",
    "walmart.com": "Walmart",
    "amazon.com": "Amazon",
    "nike.com": "Nike",
    "adidas.com": "Adidas",
    "bestbuy.com": "Best Buy",
    "costco.com": "Costco",
    "nordstrom.com": "Nordstrom",
    "gap.com": "Gap",
    "oldnavy.com": "Old Navy",
    "sephora.com": "Sephora",
    "ulta.com": "Ulta Beauty",
    "wayfair.com": "Wayfair",
    "chewy.com": "Chewy",
    "doordash.com": "DoorDash",
    "ubereats.com": "Uber Eats",
    "grubhub.com": "Grubhub",
    "instacart.com": "Instacart",
    "hotels.com": "Hotels.com",
    "viator.com": "Viator",
    "priceline.com": "Priceline",
    "kayak.com": "Kayak",
    "southwest.com": "Southwest Airlines",
    "delta.com": "Delta Air Lines",
    "aa.com": "American Airlines",
    "united.com": "United Airlines",
    "hilton.com": "Hilton",
    "marriott.com": "Marriott",
  };

  if (knownMerchants[tld]) return knownMerchants[tld];

  // Fallback: derive name from domain
  // "homedepot.com" → "Homedepot" (not great, but better than raw TLD)
  const domain = tld.replace(/^www\./, "").split(".")[0];
  // Try to split camelCase/concatenated words, capitalize
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

// ─── Card Name Detection ─────────────────────────────────────────

function getCardName(): string | undefined {
  // Strategy 1: Look for the card name in the header area (capitaloneoffers.com)
  // Format: <p class="text-white ...">Venture X...6887</p>
  const whiteTextEls = document.querySelectorAll("p");
  for (const el of whiteTextEls) {
    const text = el.textContent?.trim() || "";
    if (/\.\.\.\d{4}$/.test(text) && text.length < 40) {
      // Strip the "...XXXX" suffix to get card name
      return text.replace(/\.\.\.\d{4}$/, "").trim();
    }
  }

  // Strategy 2: Look for card name in the button at top (capitaloneoffers.com)
  const buttons = document.querySelectorAll('button[type="button"]');
  for (const btn of buttons) {
    const text = btn.textContent?.trim() || "";
    if (/\.\.\.\d{4}$/.test(text) && text.length < 40) {
      return text.replace(/\.\.\.\d{4}$/, "").trim();
    }
  }

  // Strategy 3: Look for card heading on myaccounts.capitalone.com
  // Format: "VENTURE X  ...6887" in the card header
  const headings = document.querySelectorAll("h1, h2, h3, [class*='cardName']");
  for (const h of headings) {
    const text = h.textContent?.trim() || "";
    if (/\.\.\.\d{4}$/.test(text) && text.length < 50) {
      return text.replace(/\s*\.\.\.\d{4}$/, "").trim();
    }
  }

  return undefined;
}

// ─── Value Parsing ───────────────────────────────────────────────

function parseValueText(text: string): {
  value: number;
  valueType: "percentage" | "fixed" | "points_multiplier" | "points_flat";
  offerType: "cashback" | "points_bonus" | "discount" | "statement_credit";
} {
  if (!text) return { value: 0, valueType: "points_flat", offerType: "points_bonus" };

  // "Up to 4X miles" / "3X miles" → multiplier-based miles
  const multiplierMatch = text.match(/(?:Up to\s+)?(\d+)X\s*miles/i);
  if (multiplierMatch) {
    return {
      value: parseInt(multiplierMatch[1], 10),
      valueType: "points_multiplier",
      offerType: "points_bonus",
    };
  }

  // "4,000 miles" / "Up to 6,200 miles" → fixed miles amount
  const fixedMilesMatch = text.match(/(?:Up to\s+)?([\d,]+)\s*miles/i);
  if (fixedMilesMatch) {
    return {
      value: parseInt(fixedMilesMatch[1].replace(/,/g, ""), 10),
      valueType: "points_flat",
      offerType: "points_bonus",
    };
  }

  // "5% back" / "10% off"
  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    return {
      value: parseFloat(pctMatch[1]),
      valueType: "percentage",
      offerType: "cashback",
    };
  }

  // "$10 back" / "$5 off"
  const dollarMatch = text.match(/\$(\d+(?:\.\d+)?)/);
  if (dollarMatch) {
    return {
      value: parseFloat(dollarMatch[1]),
      valueType: "fixed",
      offerType: "statement_credit",
    };
  }

  return { value: 0, valueType: "points_flat", offerType: "points_bonus" };
}

// ─── Data Extraction from data-testid ────────────────────────────

interface TileMetadata {
  merchantTLD: string;
  source: string;
  offers: string[];
}

function decodeTileTestId(testId: string): TileMetadata | null {
  try {
    const b64 = testId.replace("feed-tile-", "");
    const json = JSON.parse(atob(b64));
    return {
      merchantTLD: json.inventory?.merchantTLD || "",
      source: json.inventory?.source || "standard",
      offers: json.offers || [],
    };
  } catch {
    return null;
  }
}

// ─── React Fiber Props Extraction ────────────────────────────────

interface TileProps {
  merchantTLD: string;
  type: string;
  text: string; // channel: "Online", "In-Store & Online", etc.
  buttonText: string; // value: "3X miles", "Up to 4X miles", etc.
  rateText?: string; // Showcase tiles: "Up to 5X miles"
  headingText?: string; // Showcase tiles: promo heading
  subText?: string; // Showcase tiles: promo description
  altText?: string; // Showcase tiles: full alt text with merchant name
}

function getTilePropsFromFiber(el: Element): TileProps | null {
  try {
    const fiberKey = Object.keys(el).find((k) => k.startsWith("__reactFiber"));
    if (!fiberKey) return null;
    const fiber = (el as Record<string, unknown>)[fiberKey] as {
      child?: { memoizedProps?: { tile?: TileProps } };
    };
    return fiber?.child?.memoizedProps?.tile || null;
  } catch {
    return null;
  }
}

// ─── Wait for Content ────────────────────────────────────────────

function waitForOfferTiles(timeout = 15000): Promise<NodeListOf<Element> | null> {
  const selector = 'div[role="button"][data-testid^="feed-tile-"]';

  return new Promise((resolve) => {
    const existing = document.querySelectorAll(selector);
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const els = document.querySelectorAll(selector);
      if (els.length > 0) {
        observer.disconnect();
        resolve(els);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      const els = document.querySelectorAll(selector);
      resolve(els.length > 0 ? els : null);
    }, timeout);
  });
}

// ─── Main Scraper: capitaloneoffers.com ──────────────────────────

async function scrapeCapitalOneOffersFeed(): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = [];
  const cardName = getCardName();
  const seenHashes = new Set<string>();

  console.log(`[CardMax] Capital One scraper: card="${cardName || "unknown"}", waiting for tiles...`);

  const tiles = await waitForOfferTiles();
  if (!tiles || tiles.length === 0) {
    console.log("[CardMax] No offer tiles found on Capital One");
    return offers;
  }

  console.log(`[CardMax] Found ${tiles.length} offer tiles`);

  for (const tile of tiles) {
    try {
      const testId = tile.getAttribute("data-testid") || "";
      const meta = decodeTileTestId(testId);
      const fiberProps = getTilePropsFromFiber(tile);

      // Get merchant TLD from metadata or fiber props
      const merchantTLD = meta?.merchantTLD || fiberProps?.merchantTLD || "";
      if (!merchantTLD) continue;

      const merchantName = tldToMerchantName(merchantTLD);

      // Get value text: from fiber props or visible DOM text
      const valueText =
        fiberProps?.buttonText ||
        fiberProps?.rateText ||
        tile.querySelector(".standard-tile > div:last-child")?.textContent?.trim() ||
        "";

      // Skip "Shop Now" buttons without a rate (showcase tiles where rateText exists)
      const effectiveValue = valueText === "Shop Now" ? fiberProps?.rateText || valueText : valueText;
      if (!effectiveValue || effectiveValue === "Shop Now") continue;

      // Get channel from fiber props or DOM heading
      const channel =
        fiberProps?.text ||
        tile.querySelector("h2")?.textContent?.trim() ||
        "Online";

      const { value, valueType, offerType } = parseValueText(effectiveValue);
      if (value === 0) continue;

      // Build title from value and channel
      const isUpTo = effectiveValue.startsWith("Up to");
      const title = `${isUpTo ? "Up to " : ""}${effectiveValue.replace(/^Up to\s+/i, "")} at ${merchantName}`;

      const offer: ScrapedOffer = {
        issuer: "capital_one",
        cardName,
        merchantName,
        merchantDomain: merchantTLD,
        title,
        description: channel !== "Online" ? `${channel} offer` : undefined,
        offerType,
        value,
        valueType,
        requiresAdd: false, // Capital One Shopping offers are click-through, not add-to-card
        sourceHash: "",
      };

      offer.sourceHash = createSourceHash(offer);

      // Deduplicate
      if (seenHashes.has(offer.sourceHash)) continue;
      seenHashes.add(offer.sourceHash);

      offers.push(offer);
    } catch (err) {
      console.error("[CardMax] Error parsing Capital One offer tile:", err);
    }
  }

  return offers;
}

// ─── Fallback Scraper: myaccounts.capitalone.com ─────────────────

/**
 * Scrape the "Activate shopping offers" section on the account overview page.
 * These are rendered as buttons with accessible names like:
 *   "lululemon, 3X miles, Earn now"
 *   "Macy's, Up to 16X miles, Earn now"
 */
async function scrapeAccountPageOffers(): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = [];
  const cardName = getCardName();
  const seenHashes = new Set<string>();

  // Wait for the offers section to appear
  await new Promise<void>((resolve) => {
    const check = () => {
      const section = document.querySelector('button[aria-label*="miles"]') ||
        [...document.querySelectorAll("button")].find((b) =>
          /miles.*Earn now/i.test(b.textContent || "")
        );
      if (section) { resolve(); return; }
      setTimeout(check, 500);
    };
    check();
    setTimeout(resolve, 8000);
  });

  const buttons = document.querySelectorAll("button");
  for (const btn of buttons) {
    try {
      const text = btn.textContent?.trim() || "";
      const ariaLabel = btn.getAttribute("aria-label") || "";
      const source = ariaLabel || text;

      // Match pattern: "MerchantName, ValueText miles, Earn now"
      const match = source.match(/^(.+?),\s*(.+?\s*miles),\s*Earn now$/i);
      if (!match) continue;

      const merchantName = match[1].trim();
      const valueText = match[2].trim();

      const { value, valueType, offerType } = parseValueText(valueText);
      if (value === 0) continue;

      const title = `${valueText} at ${merchantName}`;

      const offer: ScrapedOffer = {
        issuer: "capital_one",
        cardName,
        merchantName,
        title,
        offerType,
        value,
        valueType,
        requiresAdd: false,
        sourceHash: "",
      };

      offer.sourceHash = createSourceHash(offer);
      if (seenHashes.has(offer.sourceHash)) continue;
      seenHashes.add(offer.sourceHash);

      offers.push(offer);
    } catch (err) {
      console.error("[CardMax] Error parsing account page offer:", err);
    }
  }

  return offers;
}

// ─── Entry Point ─────────────────────────────────────────────────

async function scrapeCapitalOneOffers(): Promise<ScrapedOffer[]> {
  chrome.runtime.sendMessage({
    type: "SCRAPE_STATUS",
    payload: { issuer: "capital_one", status: "started" },
  } satisfies ExtensionMessage);

  let offers: ScrapedOffer[] = [];

  const url = window.location.href;
  if (url.includes("capitaloneoffers.com")) {
    offers = await scrapeCapitalOneOffersFeed();
  } else if (url.includes("myaccounts.capitalone.com")) {
    offers = await scrapeAccountPageOffers();
  }

  if (offers.length > 0) {
    chrome.runtime.sendMessage({
      type: "OFFERS_SCRAPED",
      payload: offers,
    } satisfies ExtensionMessage);
  }

  chrome.runtime.sendMessage({
    type: "SCRAPE_STATUS",
    payload: { issuer: "capital_one", status: "completed", count: offers.length },
  } satisfies ExtensionMessage);

  console.log(`[CardMax] Scraped ${offers.length} Capital One offers`);
  return offers;
}

// ─── Message Listener + Auto-Trigger ─────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCRAPE_NOW") {
    scrapeCapitalOneOffers().then((offers) => {
      sendResponse({ success: true, count: offers.length, offers });
    });
    return true; // Keep channel open for async response
  }
});

// Auto-scrape when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => scrapeCapitalOneOffers());
} else {
  scrapeCapitalOneOffers();
}
