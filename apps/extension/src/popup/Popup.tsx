import { useEffect, useState, useCallback } from "react";
import { MerchantSearch } from "./merchant-search";
import { API_BASE, API_BASE_URL } from "../shared/config";

type ScrapeResult = {
  count: number;
  cardName?: string;
  offers: Array<{
    cardName?: string;
    merchantName: string;
    title: string;
    value: number;
    valueType: string;
    endDate?: string;
    requiresAdd: boolean;
  }>;
};

type MerchantInfo = {
  name: string;
  domain: string;
  bestCard: string | null;
  offers: Array<{ title: string; value: string }>;
};

const SUPPORTED_DOMAINS = [
  "americanexpress.com",
  "global.americanexpress.com",
  "chase.com",
  "secure.chase.com",
  "capitalone.com",
  "myaccounts.capitalone.com",
  "capitaloneoffers.com",
];

function isSupportedSite(hostname: string): boolean {
  return SUPPORTED_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith("." + d)
  );
}

function getContentScriptFile(hostname: string): string | null {
  if (hostname.includes("americanexpress.com")) return "content/amex-scraper.js";
  if (hostname.includes("chase.com")) return "content/chase-scraper.js";
  if (hostname.includes("capitalone")) return "content/capitalone-scraper.js";
  return null;
}

export function Popup() {
  const [currentMerchant, setCurrentMerchant] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [tabId, setTabId] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url && tab.id) {
        try {
          const url = new URL(tab.url);
          const hostname = url.hostname.replace("www.", "");
          setTabId(tab.id);
          setIsSupported(isSupportedSite(url.hostname));
          setCurrentMerchant({
            name: hostname,
            domain: url.hostname,
            bestCard: null,
            offers: [],
          });
        } catch {
          // Not a valid URL
        }
      }
      setLoading(false);
    });
  }, []);

  const handleScrape = useCallback(async () => {
    if (!tabId) return;

    setScraping(true);
    setScrapeError(null);
    setScrapeResult(null);

    try {
      // Try sending message to existing content script first
      const result = await new Promise<ScrapeResult>((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { type: "SCRAPE_NOW" }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response?.success) {
            resolve({ count: response.count, offers: response.offers });
          } else {
            reject(new Error("Scraper returned no results"));
          }
        });
      });

      setScrapeResult(result);
      // Sync to API directly from popup
      syncOffersToApi(result.offers);
    } catch {
      // Content script not loaded — inject it
      try {
        const hostname = currentMerchant?.domain || "";
        const scriptFile = getContentScriptFile(hostname);
        if (!scriptFile) {
          setScrapeError("No scraper available for this site");
          setScraping(false);
          return;
        }

        await chrome.scripting.executeScript({
          target: { tabId },
          files: [scriptFile],
        });

        // Wait a moment for scraper to run, then query results
        await new Promise((r) => setTimeout(r, 4000));

        // Try sending message again
        const result = await new Promise<ScrapeResult>((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, { type: "SCRAPE_NOW" }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (response?.success) {
              resolve({ count: response.count, offers: response.offers });
            } else {
              reject(new Error("Scraper returned no results after injection"));
            }
          });
        });

        setScrapeResult(result);
        syncOffersToApi(result.offers);
      } catch (err) {
        setScrapeError(
          err instanceof Error ? err.message : "Failed to scrape offers"
        );
      }
    }

    setScraping(false);
  }, [tabId, currentMerchant]);

  const syncOffersToApi = useCallback(async (offers: ScrapeResult["offers"]) => {
    setSyncStatus("Syncing to database...");
    try {
      const response = await fetch(`${API_BASE}/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer cardmax-dev-extension",
        },
        body: JSON.stringify({ offers }),
      });
      if (!response.ok) {
        const text = await response.text();
        setSyncStatus(`Sync failed: ${response.status}`);
        console.error("[CardMax] Sync error:", text);
        return;
      }
      const result = await response.json();
      const deleted = result.data?.deleted ?? 0;
      const inserted = result.data?.inserted ?? 0;
      const msg = deleted > 0
        ? `Synced! ${inserted} offers saved (${deleted} stale removed)`
        : `Synced! ${inserted} offers saved`;
      setSyncStatus(msg);
    } catch (err) {
      setSyncStatus(`Sync failed: ${err instanceof Error ? err.message : "Network error"}`);
    }
  }, []);

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#3182ce",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: 14,
          }}
        >
          CM
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>CardMax</div>
          <div style={{ fontSize: 11, color: "#718096" }}>
            Credit Card Optimizer
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 20, color: "#718096" }}>
          Loading...
        </div>
      ) : currentMerchant ? (
        <>
          {/* Current Site */}
          <div
            style={{
              background: "#f7fafc",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, color: "#718096", marginBottom: 4 }}>
              Current Site
            </div>
            <div style={{ fontWeight: 600 }}>{currentMerchant.name}</div>
          </div>

          {/* Merchant Search */}
          <MerchantSearch />

          {/* Scrape Button */}
          {isSupported && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={handleScrape}
                disabled={scraping}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: scraping ? "#a0aec0" : "#38a169",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: scraping ? "not-allowed" : "pointer",
                }}
              >
                {scraping ? "Scraping..." : "Scrape Offers"}
              </button>

              {/* Scrape Results */}
              {scrapeResult && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "#f0fff4",
                    border: "1px solid #c6f6d5",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#276749",
                      marginBottom: 4,
                    }}
                  >
                    Found {scrapeResult.count} offers
                  </div>
                  {scrapeResult.offers[0]?.cardName && (
                    <div style={{ fontSize: 12, color: "#276749", marginBottom: 2 }}>
                      Card: {scrapeResult.offers[0].cardName}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#48bb78" }}>
                    {scrapeResult.offers.filter((o) => !o.requiresAdd).length}{" "}
                    added to card
                    {" | "}
                    {scrapeResult.offers.filter((o) => o.requiresAdd).length}{" "}
                    available
                  </div>
                </div>
              )}

              {syncStatus && (
                <div
                  style={{
                    marginTop: 4,
                    padding: 8,
                    background: syncStatus.includes("failed") ? "#fff5f5" : "#ebf8ff",
                    border: `1px solid ${syncStatus.includes("failed") ? "#fed7d7" : "#bee3f8"}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: syncStatus.includes("failed") ? "#c53030" : "#2b6cb0",
                  }}
                >
                  {syncStatus}
                </div>
              )}

              {scrapeError && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "#fff5f5",
                    border: "1px solid #fed7d7",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#c53030",
                  }}
                >
                  {scrapeError}
                </div>
              )}
            </div>
          )}

          {/* Best Card */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#4a5568",
                marginBottom: 8,
              }}
            >
              BEST CARD TO USE
            </div>
            <div
              style={{
                background: "#ebf8ff",
                border: "1px solid #bee3f8",
                borderRadius: 8,
                padding: 12,
                textAlign: "center",
                color: "#2b6cb0",
              }}
            >
              Add cards to your wallet to see recommendations
            </div>
          </div>

          {/* Scraped Offers Preview */}
          {scrapeResult && scrapeResult.count > 0 && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#4a5568",
                  marginBottom: 8,
                }}
              >
                RECENT OFFERS ({Math.min(scrapeResult.count, 5)} of{" "}
                {scrapeResult.count})
              </div>
              {scrapeResult.offers.slice(0, 5).map((offer, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 6,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    {offer.merchantName}
                  </div>
                  <div style={{ color: "#4a5568", fontSize: 12 }}>
                    {offer.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 4,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: "#38a169", fontWeight: 600 }}>
                      {offer.valueType === "percentage"
                        ? `${offer.value}% back`
                        : offer.valueType === "points"
                        ? `${offer.value.toLocaleString()} pts`
                        : `$${offer.value} back`}
                    </span>
                    {offer.endDate && (
                      <span style={{ color: "#a0aec0" }}>
                        Exp {offer.endDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No offers state (only show if no scrape result) */}
          {!scrapeResult && !isSupported && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#4a5568",
                  marginBottom: 8,
                }}
              >
                ACTIVE OFFERS
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: 16,
                  color: "#a0aec0",
                  fontSize: 13,
                }}
              >
                No offers found for this merchant.
                <br />
                Visit your card issuer portal to sync offers.
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 20, color: "#718096" }}>
          Navigate to a merchant site to see card recommendations.
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #e2e8f0",
          marginTop: 16,
          paddingTop: 12,
          textAlign: "center",
        }}
      >
        <a
          href={`${API_BASE_URL}/dashboard`}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#3182ce",
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          Open Full Dashboard
        </a>
      </div>
    </div>
  );
}
