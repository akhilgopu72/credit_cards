import type { ScrapedOffer, ExtensionMessage } from "@cardmax/shared";

/**
 * Amex Offer Scraper
 *
 * Activates on:
 *   - global.americanexpress.com/offers (main offers page)
 *   - global.americanexpress.com/offers/enrolled (added-to-card full list)
 *   - americanexpress.com/en-us/benefits/amex-offers
 *
 * Strategy: Find merchant-name headings, walk UP to find the offer card
 * container, then extract description/expiry from within. This approach
 * is resilient to DOM nesting changes since it doesn't rely on flat siblings.
 */

function createSourceHash(offer: Partial<ScrapedOffer>): string {
  const raw = `amex:${offer.cardName || ""}:${offer.merchantName}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `amex_${Math.abs(hash).toString(36)}`;
}

/**
 * Extract card name from the card selector combobox.
 * The aria-label can be stale (shows a different card), so we use
 * the visible leaf text that ends with "Card" and whose parent
 * contains a card number pattern (•••NNNNN).
 */
function getCardName(): string | undefined {
  const allElements = document.querySelectorAll("*");

  for (const el of allElements) {
    if (el.children.length > 0) continue;
    const text = (el.textContent || "").trim();
    if (!/Card[®™]?\s*$/i.test(text) || text.length < 4 || text.length > 80) {
      continue;
    }

    // Verify this is inside the card selector by checking parent for card number
    const parentText = (el.parentElement?.textContent || "").trim();
    if (/[•·]{1,4}\d{4,5}/.test(parentText)) {
      return text;
    }
  }

  return undefined;
}

async function scrapeAmexOffers(): Promise<ScrapedOffer[]> {
  chrome.runtime.sendMessage({
    type: "SCRAPE_STATUS",
    payload: { issuer: "amex", status: "started" },
  } satisfies ExtensionMessage);

  await waitForContent(10000);

  const cardName = getCardName();
  console.log(`[CardMax] Detected card: ${cardName || "unknown"}`);

  const isEnrolledPage = window.location.pathname.includes("/offers/enrolled");
  const offers = scrapeOffersByHeadings(isEnrolledPage ? false : true, cardName);

  // On main page, also try the "Added to Card" carousel
  if (!isEnrolledPage) {
    const carouselOffers = scrapeAddedToCardCarousel(cardName);
    offers.push(...carouselOffers);
  }

  // Assign hashes and deduplicate
  for (const offer of offers) {
    if (!offer.sourceHash) offer.sourceHash = createSourceHash(offer);
  }

  const seen = new Set<string>();
  const deduped = offers.filter((o) => {
    if (seen.has(o.sourceHash)) return false;
    seen.add(o.sourceHash);
    return true;
  });

  if (deduped.length > 0) {
    chrome.runtime.sendMessage({
      type: "OFFERS_SCRAPED",
      payload: deduped,
    } satisfies ExtensionMessage);
  }

  chrome.runtime.sendMessage({
    type: "SCRAPE_STATUS",
    payload: { issuer: "amex", status: "completed", count: deduped.length },
  } satisfies ExtensionMessage);

  console.log(`[CardMax] Scraped ${deduped.length} Amex offers`);
  return deduped;
}

// ─── Visibility check ─────────────────────────────────────────────
/**
 * Check if an element is visible in the DOM. Filters out hidden elements
 * from other cards that the Amex SPA keeps in the DOM when switching cards.
 */
function isElementVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return true;
  // offsetParent is null for hidden elements (display:none or detached)
  // Exception: <body>, position:fixed, and position:sticky always have null offsetParent
  if (
    el.offsetParent === null &&
    getComputedStyle(el).position !== "fixed" &&
    getComputedStyle(el).position !== "sticky" &&
    el !== document.body
  ) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  // Zero-size elements are hidden
  if (rect.width === 0 && rect.height === 0) return false;
  return true;
}

// ─── Headings that are NOT merchant names ────────────────────────
const SKIP_HEADINGS = /^(recommended offers?|added to card|about|products & services|links you may like|additional information|american express® savings|earn \d.*bonus points|your fico|high-yield|loans that fit|stay longer for less|dine with marriott|automate your card|add card to select|spend with amex|add your card to|your referral offer|amex travel app)/i;

/**
 * Core scraping strategy: find all h2/h3/h4 headings, walk UP to the
 * offer card container, then extract description + expiry from within.
 */
function scrapeOffersByHeadings(requiresAdd: boolean, cardName?: string): ScrapedOffer[] {
  const offers: ScrapedOffer[] = [];
  const headings = document.querySelectorAll("h2, h3, h4");

  for (const heading of headings) {
    try {
      const merchantName = (heading.textContent || "").trim();
      if (!merchantName || merchantName.length > 120) continue;
      if (SKIP_HEADINGS.test(merchantName)) continue;

      // Skip hidden headings from other cards (Amex SPA keeps them in the DOM)
      if (!isElementVisible(heading)) {
        console.log(`[CardMax] Skipped hidden heading: "${merchantName}"`);
        continue;
      }

      // Walk UP from heading to find the offer card container
      const container = findOfferContainer(heading);
      if (!container) continue;

      // Extract offer text from within the container
      const { description, expiryText } = extractOfferTexts(
        container,
        merchantName
      );
      if (!description) continue;

      const { value, valueType, minSpend, maxReward, useLimit } =
        parseOfferDescription(description);

      const offerType = valueType === "percentage"
        ? "cashback"
        : valueType === "points_multiplier" || valueType === "points_flat"
          ? "points_bonus"
          : "statement_credit";

      const offer: ScrapedOffer = {
        issuer: "amex",
        cardName,
        merchantName,
        title: description,
        description,
        offerType,
        value,
        valueType,
        minSpend,
        maxReward,
        useLimit,
        endDate: parseExpiryDate(expiryText),
        requiresAdd,
        sourceHash: "",
      };

      offer.sourceHash = createSourceHash(offer);
      offers.push(offer);
    } catch (err) {
      console.error("[CardMax] Error parsing offer:", err);
    }
  }

  return offers;
}

/**
 * Walk UP from a heading to find the offer card container.
 * The container is the nearest ancestor that:
 *  - Contains "Expires" or "$" or "%" text (offer-like content)
 *  - Has at most 2 headings inside (not the whole section)
 *  - Is not the body/html element
 */
function findOfferContainer(heading: Element): Element | null {
  let el: Element | null = heading.parentElement;
  let depth = 0;

  while (el && depth < 8) {
    if (el === document.body || el === document.documentElement) break;

    const text = el.textContent || "";
    const hasExpiry = /expires\s+\d/i.test(text);
    const hasOfferValue = text.includes("$") || text.includes("%") || /\b(points|pts|MR)\b/i.test(text);

    if (hasExpiry && hasOfferValue) {
      // Make sure it's a single offer card, not a whole section
      const innerHeadings = el.querySelectorAll("h2, h3, h4");
      if (innerHeadings.length <= 2) {
        return el;
      }
    }

    el = el.parentElement;
    depth++;
  }

  return null;
}

/**
 * Extract description and expiry text from an offer card container.
 * Walks all descendant text nodes to find the relevant content.
 */
function extractOfferTexts(
  container: Element,
  merchantName: string
): { description: string; expiryText: string } {
  let description = "";
  let expiryText = "";

  // Collect all text from leaf elements within the container
  const elements = container.querySelectorAll("*");

  for (const node of elements) {
    // Only look at leaf-ish elements (minimal nesting)
    if (node.children.length > 3) continue;

    const text = (node.textContent || "").trim();
    if (!text || text === merchantName) continue;

    // Skip button text and badges
    const tag = node.tagName.toLowerCase();
    if (tag === "button" || tag === "svg" || tag === "img") continue;

    // Check for expiry: "Expires M/DD/YY"
    if (/^Expires\s+\d/i.test(text) && !expiryText) {
      expiryText = text;
      continue;
    }

    // Check for offer description (contains value indicators)
    if (
      !description &&
      text.length > 10 &&
      text.length < 200 &&
      (text.includes("$") ||
        text.includes("%") ||
        /\b(earn|spend|back|off)\b/i.test(text))
    ) {
      // Make sure it's not a parent that includes the whole card text
      // by checking the node isn't the container itself
      if (node !== container && !node.querySelector("h2, h3, h4")) {
        description = text;
      }
    }
  }

  return { description, expiryText };
}

/**
 * Scrape "Added to Card" horizontal carousel on the main /offers page.
 * These cards use a simpler structure: img[alt] followed by name/desc/expiry text.
 */
function scrapeAddedToCardCarousel(cardName?: string): ScrapedOffer[] {
  const offers: ScrapedOffer[] = [];

  // Find the "Added to Card" label
  const allElements = document.querySelectorAll("*");
  let addedLabel: Element | null = null;

  for (const el of allElements) {
    if (
      el.children.length === 0 &&
      /^Added to Card/i.test((el.textContent || "").trim())
    ) {
      addedLabel = el;
      break;
    }
  }

  if (!addedLabel) return offers;

  // Find the scrollable container with merchant images
  let container: Element | null = addedLabel.parentElement;
  let depth = 0;
  while (container && depth < 6) {
    if (container.querySelectorAll("img[alt]").length >= 3) break;
    container = container.parentElement;
    depth++;
  }
  if (!container) return offers;

  // Each carousel item has an image - find cards by their heading or image
  const headings = container.querySelectorAll("h2, h3, h4, h5, h6");

  if (headings.length > 0) {
    // If carousel items have headings, use heading-based extraction
    for (const heading of headings) {
      try {
        const merchantName = (heading.textContent || "").trim();
        if (!merchantName) continue;
        if (!isElementVisible(heading)) continue;

        const cardContainer = findOfferContainer(heading);
        if (!cardContainer) continue;

        const { description, expiryText } = extractOfferTexts(
          cardContainer,
          merchantName
        );
        if (!description) continue;

        const { value, valueType, minSpend, maxReward, useLimit } =
          parseOfferDescription(description);
        const offerType = valueType === "percentage"
          ? "cashback"
          : valueType === "points_multiplier" || valueType === "points_flat"
            ? "points_bonus"
            : "statement_credit";
        const offer: ScrapedOffer = {
          issuer: "amex",
          cardName,
          merchantName,
          title: description,
          description,
          offerType,
          value,
          valueType,
          minSpend,
          maxReward,
          useLimit,
          endDate: parseExpiryDate(expiryText),
          requiresAdd: false,
          sourceHash: "",
        };
        offer.sourceHash = createSourceHash(offer);
        offers.push(offer);
      } catch (err) {
        console.error("[CardMax] Error parsing carousel offer:", err);
      }
    }
  } else {
    // Fallback: use images with alt text as anchors
    const images = container.querySelectorAll("img[alt]");
    for (const img of images) {
      try {
        const merchantName = img.getAttribute("alt") || "";
        if (!merchantName || merchantName === "card_art") continue;
        if (!isElementVisible(img)) continue;

        // Walk forward through siblings
        const texts: string[] = [];
        let sibling = img.nextElementSibling;
        let count = 0;
        while (sibling && count < 4) {
          const t = (sibling.textContent || "").trim();
          if (t) texts.push(t);
          sibling = sibling.nextElementSibling;
          count++;
        }

        // Also check parent siblings
        if (texts.length === 0 && img.parentElement) {
          let parentSib = img.parentElement.nextElementSibling;
          count = 0;
          while (parentSib && count < 4) {
            const t = (parentSib.textContent || "").trim();
            if (t) texts.push(t);
            parentSib = parentSib.nextElementSibling;
            count++;
          }
        }

        let description = "";
        let expiryText = "";
        for (const t of texts) {
          if (t === merchantName) continue;
          if (/^Expires\s/i.test(t)) expiryText = t;
          else if (
            !description &&
            (t.includes("$") ||
              t.includes("%") ||
              /\b(earn|spend|back|off)\b/i.test(t))
          )
            description = t;
        }

        if (!description) continue;

        const { value, valueType, minSpend, maxReward, useLimit } =
          parseOfferDescription(description);
        const offerType = valueType === "percentage"
          ? "cashback"
          : valueType === "points_multiplier" || valueType === "points_flat"
            ? "points_bonus"
            : "statement_credit";
        const offer: ScrapedOffer = {
          issuer: "amex",
          cardName,
          merchantName,
          title: description,
          description,
          offerType,
          value,
          valueType,
          minSpend,
          maxReward,
          useLimit,
          endDate: parseExpiryDate(expiryText),
          requiresAdd: false,
          sourceHash: "",
        };
        offer.sourceHash = createSourceHash(offer);
        offers.push(offer);
      } catch (err) {
        console.error("[CardMax] Error parsing carousel offer:", err);
      }
    }
  }

  return offers;
}

// ─── Parsers ─────────────────────────────────────────────────────

function parseOfferDescription(text: string): {
  value: number;
  valueType: "percentage" | "fixed" | "points_multiplier" | "points_flat";
  minSpend?: number;
  maxReward?: number;
  useLimit?: number;
} {
  if (!text) return { value: 0, valueType: "fixed" };

  let minSpend: number | undefined;
  const spendMatch = text.match(/[Ss]pend\s+\$([\d,]+(?:\.\d+)?)/);
  if (spendMatch) minSpend = parseFloat(spendMatch[1].replace(/,/g, ""));

  let maxReward: number | undefined;
  const capMatch = text.match(/(?:up to a )?total of \$([\d,]+(?:\.\d+)?)/i);
  if (capMatch) maxReward = parseFloat(capMatch[1].replace(/,/g, ""));

  // Extract useLimit: "up to N times" or "up to N time(s)"
  let useLimit: number | undefined;
  const useLimitMatch = text.match(/up to (\d+) times?/i);
  if (useLimitMatch) useLimit = parseInt(useLimitMatch[1], 10);

  // Points: split into per-dollar (multiplier) vs flat
  // Handle "+10 Membership Rewards® points per eligible dollar" format
  const pointsPerDollarMatch = text.match(
    /\+?(\d+)\s*(?:Membership\s+Rewards[®™]?\s+)?(?:points?|pts|MR)\s+per\s+(?:eligible\s+)?dollar/i
  );
  if (pointsPerDollarMatch) {
    // Extract maxReward for points: "up to N,NNN pts/points"
    const ptsCapMatch = text.match(/up to ([\d,]+)\s*(?:Membership\s+Rewards[®™]?\s+)?(?:points?|pts)/i);
    if (ptsCapMatch && !maxReward) {
      maxReward = parseInt(ptsCapMatch[1].replace(/,/g, ""), 10);
    }
    return {
      value: parseInt(pointsPerDollarMatch[1], 10),
      valueType: "points_multiplier",
      minSpend,
      maxReward,
      useLimit,
    };
  }

  // Flat points: "earn 50,000 Membership Rewards® points" (any other points match)
  // Handle ® and ™ symbols in "Rewards®"
  const pointsMatch = text.match(
    /(?:earn\s+)?([\d,]+)\s*(?:Membership\s+Rewards[®™]?\s+)?(?:points|pts|MR)/i
  );
  if (pointsMatch) {
    return {
      value: parseInt(pointsMatch[1].replace(/,/g, ""), 10),
      valueType: "points_flat",
      minSpend,
      maxReward,
      useLimit,
    };
  }

  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    return {
      value: parseFloat(pctMatch[1]),
      valueType: "percentage",
      minSpend,
      maxReward,
      useLimit,
    };
  }

  const earnMatch = text.match(
    /earn\s+\$([\d,]+(?:\.\d+)?)\s*(?:back)?/i
  );
  if (earnMatch) {
    return {
      value: parseFloat(earnMatch[1].replace(/,/g, "")),
      valueType: "fixed",
      minSpend,
      maxReward,
      useLimit,
    };
  }

  const backMatch = text.match(/\$([\d,]+(?:\.\d+)?)\s*(?:back|off)/i);
  if (backMatch) {
    return {
      value: parseFloat(backMatch[1].replace(/,/g, "")),
      valueType: "fixed",
      minSpend,
      maxReward,
      useLimit,
    };
  }

  const allDollars = [...text.matchAll(/\$([\d,]+(?:\.\d+)?)/g)].map((m) =>
    parseFloat(m[1].replace(/,/g, ""))
  );
  if (allDollars.length > 0) {
    const val =
      allDollars.length > 1
        ? allDollars[allDollars.length - 1]
        : allDollars[0];
    return { value: val, valueType: "fixed", minSpend, maxReward, useLimit };
  }

  return { value: 0, valueType: "fixed", minSpend, maxReward, useLimit };
}

function parseExpiryDate(text: string): string | undefined {
  if (!text) return undefined;

  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (match) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }

  try {
    const cleaned = text.replace(/^Expires\s*/i, "").trim();
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  } catch {
    // Can't parse
  }

  return undefined;
}

function waitForContent(timeout = 10000): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const headings = document.querySelectorAll("h1, h2, h3, h4");
      return Array.from(headings).some((h) => {
        const text = (h.textContent || "").toLowerCase();
        return (
          text.includes("recommended offer") ||
          text.includes("added to card")
        );
      });
    };

    if (check()) {
      setTimeout(resolve, 2000);
      return;
    }

    const observer = new MutationObserver(() => {
      if (check()) {
        observer.disconnect();
        setTimeout(resolve, 2000);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, timeout);
  });
}

// ─── Message listener for popup-triggered scraping ───────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCRAPE_NOW") {
    scrapeAmexOffers().then((offers) => {
      sendResponse({ success: true, count: offers.length, offers });
    });
    return true;
  }
});

// Auto-scrape on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => scrapeAmexOffers());
} else {
  scrapeAmexOffers();
}
