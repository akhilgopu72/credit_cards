import type { ScrapedOffer, ExtensionMessage } from "@cardmax/shared";

/**
 * Chase Offer Scraper
 *
 * Activates on secure.chase.com offer pages
 *
 * Strategy: Chase renders offers as buttons with pattern
 *   "N of TOTAL MerchantName ValueText [New] [Expiring soon]"
 * Each button has child elements for merchant name and cash back value.
 * Card name comes from a heading like "Ink Preferred (...1327)".
 */

function createSourceHash(offer: Partial<ScrapedOffer>): string {
  const raw = `chase:${offer.cardName || ""}:${offer.merchantName}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `chase_${Math.abs(hash).toString(36)}`;
}

async function scrapeChaseOffers(): Promise<ScrapedOffer[]> {
  chrome.runtime.sendMessage({
    type: "SCRAPE_STATUS",
    payload: { issuer: "chase", status: "started" },
  } satisfies ExtensionMessage);

  await waitForOffers(10000);

  const cardName = getCardName();
  console.log(`[CardMax] Detected card: ${cardName || "unknown"}`);

  const offers = scrapeOfferButtons(cardName);

  // Deduplicate by sourceHash
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
    payload: { issuer: "chase", status: "completed", count: deduped.length },
  } satisfies ExtensionMessage);

  console.log(`[CardMax] Scraped ${deduped.length} Chase offers`);
  return deduped;
}

/**
 * Extract card name from page heading.
 * Chase shows "Ink Preferred (...1327)" or "Sapphire Reserve (...4521)" etc.
 */
function getCardName(): string | undefined {
  // Chase uses role="heading" divs, not always native h1-h4
  const candidates = document.querySelectorAll(
    'h1, h2, h3, h4, h5, [role="heading"]'
  );
  for (const h of candidates) {
    const text = (h.textContent || "").trim();
    // Match "CardName (...NNNN)" pattern
    const match = text.match(/^(.+?)\s*\((?:\.{3}|…)\d{4}\)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return undefined;
}

// ─── Patterns to skip (non-offer headings/buttons) ──────────────
const SKIP_BUTTON_TEXT = /^(keep the shopping going|visit chase|go to website|back to top|add offer|see how|skip)/i;

/**
 * Core scraping: find all offer buttons matching "N of TOTAL ..." pattern.
 * Each button contains child elements for merchant name and value.
 */
function scrapeOfferButtons(cardName?: string): ScrapedOffer[] {
  const offers: ScrapedOffer[] = [];
  // Chase uses role="button" divs, not always native <button> elements
  const buttons = document.querySelectorAll('button, [role="button"]');

  for (const btn of buttons) {
    try {
      const btnText = (btn.textContent || "").trim();

      // Identify offer buttons: must contain a cash back value
      if (
        !btnText.includes("cash back") &&
        !btnText.includes("% back") &&
        !/\$\d+.*back/i.test(btnText)
      ) {
        continue;
      }
      if (SKIP_BUTTON_TEXT.test(btnText)) continue;

      // Also check the img alt or aria-label for the "N of TOTAL" pattern
      // to confirm this is an offer card
      const img = btn.querySelector("img");
      const altText = img?.getAttribute("alt") || "";
      const ariaLabel = btn.getAttribute("aria-label") || "";
      const accessibleName = altText || ariaLabel;

      // Extract structured data from child elements
      let merchantName = "";
      let valueText = "";
      let isAdded = false;

      const children = btn.querySelectorAll("*");
      for (const child of children) {
        // Only look at leaf-ish elements
        if (child.children.length > 1) continue;
        const t = (child.textContent || "").trim();
        if (!t) continue;

        const tag = child.tagName.toLowerCase();
        if (tag === "img" || tag === "svg") continue;

        // Skip status badges
        if (t === "New" || t === "Success") continue;
        if (/^Expiring soon$/i.test(t)) continue;
        if (/^\d+d?\s*left$/i.test(t)) continue;
        if (/^Added$/i.test(t)) {
          isAdded = true;
          continue;
        }
        if (t === "Add Offer") continue;

        // Value text contains "$" or "%" with "cash back" / "back"
        if (
          !valueText &&
          (t.includes("cash back") ||
            t.includes("% back") ||
            /^\$[\d,]+\s*(cash\s+)?back/i.test(t) ||
            /^\d+%\s*(cash\s+)?back/i.test(t))
        ) {
          valueText = t;
          continue;
        }

        // Remaining short text is likely the merchant name
        if (!merchantName && t.length > 0 && t.length < 100) {
          merchantName = t;
        }
      }

      // Fallback: detect "Added" from accessible name
      if (!isAdded && /Added/i.test(accessibleName)) {
        isAdded = true;
      }

      if (!merchantName || !valueText) continue;

      const { value, valueType } = parseValueText(valueText);

      const offer: ScrapedOffer = {
        issuer: "chase",
        cardName,
        merchantName,
        title: valueText,
        description: valueText,
        offerType: valueType === "percentage" ? "cashback" : "statement_credit",
        value,
        valueType,
        requiresAdd: !isAdded,
        sourceHash: "",
      };

      offer.sourceHash = createSourceHash(offer);
      offers.push(offer);
    } catch (err) {
      console.error("[CardMax] Error parsing Chase offer:", err);
    }
  }

  return offers;
}

// ─── Parsers ─────────────────────────────────────────────────────

function parseValueText(text: string): {
  value: number;
  valueType: "percentage" | "fixed" | "points_flat";
} {
  if (!text) return { value: 0, valueType: "fixed" };

  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) return { value: parseFloat(pctMatch[1]), valueType: "percentage" };

  const dollarMatch = text.match(/\$([\d,]+(?:\.\d+)?)/);
  if (dollarMatch) {
    return { value: parseFloat(dollarMatch[1].replace(/,/g, "")), valueType: "fixed" };
  }

  const pointsMatch = text.match(/([\d,]+)\s*(?:points|pts)/i);
  if (pointsMatch) {
    return {
      value: parseInt(pointsMatch[1].replace(/,/g, ""), 10),
      valueType: "points_flat",
    };
  }

  return { value: 0, valueType: "fixed" };
}

function waitForOffers(timeout = 10000): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      // Look for "All offers" heading or offer buttons
      const headings = document.querySelectorAll("h1, h2, h3, h4");
      return Array.from(headings).some((h) => {
        const text = (h.textContent || "").toLowerCase();
        return text.includes("all offers") || text.includes("offer");
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
    scrapeChaseOffers().then((offers) => {
      sendResponse({ success: true, count: offers.length, offers });
    });
    return true;
  }
});

// Auto-scrape on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => scrapeChaseOffers());
} else {
  scrapeChaseOffers();
}
