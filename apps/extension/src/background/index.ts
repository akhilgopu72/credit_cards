import type { ExtensionMessage, CheckoutLookupResponse, CardRecommendation } from "@cardmax/shared";
import { API_BASE } from "../shared/config";

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === "OFFERS_SCRAPED") {
      handleOffersScraped(message.payload)
        .then((result) => sendResponse({ success: true, ...result }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
      return true; // Keep message channel open for async response
    }

    if (message.type === "MERCHANT_LOOKUP") {
      handleMerchantLookup(message.payload)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
      return true;
    }

    if (message.type === "CHECKOUT_MERCHANT_LOOKUP") {
      handleCheckoutMerchantLookup(message.payload)
        .then((result) => sendResponse(result))
        .catch((error) =>
          sendResponse({
            success: false,
            recommendation: null,
            error: error.message,
          } satisfies CheckoutLookupResponse)
        );
      return true;
    }
  }
);

async function handleOffersScraped(
  offers: ExtensionMessage extends { type: "OFFERS_SCRAPED" }
    ? ExtensionMessage["payload"]
    : never
) {
  console.log(`[CardMax BG] Received ${offers.length} offers, posting to API...`);

  const token = await getAuthToken();
  const authToken = token || "cardmax-dev-extension";

  try {
    const response = await fetch(`${API_BASE}/offers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ offers }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[CardMax BG] API error ${response.status}: ${text}`);
      throw new Error(`Failed to sync offers: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[CardMax BG] API response:`, result);
    return result;
  } catch (err) {
    console.error(`[CardMax BG] Fetch failed:`, err);
    throw err;
  }
}

async function handleMerchantLookup(payload: {
  domain: string;
  merchantName: string;
}) {
  const response = await fetch(
    `${API_BASE}/merchants/search?q=${encodeURIComponent(payload.merchantName)}`
  );

  if (!response.ok) {
    throw new Error("Failed to look up merchant");
  }

  return response.json();
}

async function handleCheckoutMerchantLookup(payload: {
  domain: string;
}): Promise<CheckoutLookupResponse> {
  const { domain } = payload;

  // Extract a merchant name from the domain for search
  // e.g. "amazon.com" -> "amazon", "bestbuy.com" -> "bestbuy"
  const merchantQuery = domain
    .replace(/\.(com|org|net|co|io|store|shop)$/i, "")
    .replace(/[.-]/g, " ")
    .trim();

  console.log(`[CardMax BG] Checkout lookup for domain="${domain}", query="${merchantQuery}"`);

  try {
    // Step 1: Search for the merchant by name derived from domain
    const searchResponse = await fetch(
      `${API_BASE}/merchants/search?q=${encodeURIComponent(merchantQuery)}&limit=1`
    );

    if (!searchResponse.ok) {
      return { success: false, recommendation: null, error: "Merchant search failed" };
    }

    const searchResult = await searchResponse.json();
    const merchants = searchResult.data;

    if (!merchants || merchants.length === 0) {
      return { success: false, recommendation: null, error: "Merchant not found" };
    }

    const merchant = merchants[0];

    // Step 2: Get merchant detail with card rankings
    const detailResponse = await fetch(
      `${API_BASE}/merchants/${encodeURIComponent(merchant.slug)}`
    );

    if (!detailResponse.ok) {
      return { success: false, recommendation: null, error: "Merchant detail fetch failed" };
    }

    const detailResult = await detailResponse.json();
    const detail = detailResult.data;

    if (!detail || !detail.cardRankings || detail.cardRankings.length === 0) {
      return { success: false, recommendation: null, error: "No card rankings available" };
    }

    // Pick the top-ranked card
    const topCard = detail.cardRankings[0];

    const recommendation: CardRecommendation = {
      cardName: topCard.cardName,
      issuer: topCard.issuer,
      multiplier: topCard.multiplier,
      currency: topCard.currency,
      merchantName: detail.merchant.name,
      category: detail.merchant.category,
      isBaseRate: topCard.isBaseRate,
    };

    return { success: true, recommendation };
  } catch (err) {
    console.error("[CardMax BG] Checkout lookup failed:", err);
    return {
      success: false,
      recommendation: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["authToken"], (result) => {
      resolve(result.authToken || null);
    });
  });
}

// Badge for offer count
chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === "SCRAPE_STATUS" && message.payload.status === "completed") {
    const count = message.payload.count ?? 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#38a169" });
    }
  }
});
