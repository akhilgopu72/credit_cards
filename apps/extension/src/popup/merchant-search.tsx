import React, { useState, useCallback, useRef } from "react";
import { API_BASE } from "../shared/config";

type MerchantSearchResult = {
  id: string;
  name: string;
  slug: string;
  category: string;
  websiteDomain: string | null;
  logoUrl?: string | null;
  simScore?: number;
};

type MerchantDetail = {
  merchant: {
    id: string;
    name: string;
    slug: string;
    category: string;
    websiteDomain: string | null;
  };
  cardRankings: Array<{
    cardId: string;
    cardName: string;
    issuer: string;
    multiplier: number;
    currency: string;
    isBaseRate: boolean;
  }>;
  offers: Array<{
    id: string;
    merchantName: string;
    title: string;
    value: string;
    valueType: string;
    cardName: string | null;
    endDate: string | null;
  }>;
};

type SearchState = {
  loading: boolean;
  results: MerchantSearchResult[] | null;
  error: string | null;
};

type DetailState = {
  loading: boolean;
  detail: MerchantDetail | null;
  error: string | null;
};

export function MerchantSearch() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({
    loading: false,
    results: null,
    error: null,
  });
  const [detail, setDetail] = useState<DetailState>({
    loading: false,
    detail: null,
    error: null,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearch({ loading: false, results: null, error: null });
      return;
    }

    setSearch({ loading: true, results: null, error: null });
    setDetail({ loading: false, detail: null, error: null });

    try {
      const response = await fetch(
        `${API_BASE}/merchants/search?q=${encodeURIComponent(q)}&limit=5`
      );

      if (!response.ok) {
        throw new Error(`Search failed (${response.status})`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setSearch({ loading: false, results: json.data ?? [], error: null });
    } catch (err) {
      setSearch({
        loading: false,
        results: null,
        error: err instanceof Error ? err.message : "Search failed",
      });
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        doSearch(value.trim());
      }, 300);
    },
    [doSearch]
  );

  const handleMerchantClick = useCallback(async (slug: string) => {
    setDetail({ loading: true, detail: null, error: null });

    try {
      const response = await fetch(`${API_BASE}/merchants/${slug}`);

      if (!response.ok) {
        throw new Error(`Failed to load merchant (${response.status})`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setDetail({ loading: false, detail: json.data, error: null });
    } catch (err) {
      setDetail({
        loading: false,
        detail: null,
        error: err instanceof Error ? err.message : "Failed to load details",
      });
    }
  }, []);

  const handleClearDetail = useCallback(() => {
    setDetail({ loading: false, detail: null, error: null });
  }, []);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#4a5568",
          marginBottom: 8,
        }}
      >
        MERCHANT LOOKUP
      </div>

      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search merchants (e.g. Amazon, Starbucks)"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
            background: "#fff",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#3182ce";
            e.target.style.boxShadow = "0 0 0 1px #3182ce";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Loading */}
      {search.loading && (
        <div
          style={{
            padding: 12,
            textAlign: "center",
            color: "#718096",
            fontSize: 13,
          }}
        >
          Searching...
        </div>
      )}

      {/* Error */}
      {search.error && (
        <div
          style={{
            padding: 10,
            background: "#fff5f5",
            border: "1px solid #fed7d7",
            borderRadius: 8,
            fontSize: 13,
            color: "#c53030",
          }}
        >
          {search.error}
        </div>
      )}

      {/* Search Results */}
      {search.results && !detail.detail && !detail.loading && (
        <div>
          {search.results.length === 0 ? (
            <div
              style={{
                padding: 12,
                textAlign: "center",
                color: "#a0aec0",
                fontSize: 13,
              }}
            >
              No merchants found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            search.results.map((merchant) => (
              <button
                key={merchant.id}
                onClick={() => handleMerchantClick(merchant.slug)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  marginBottom: 4,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#fff";
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{merchant.name}</div>
                  <div style={{ fontSize: 11, color: "#a0aec0" }}>
                    {merchant.category}
                    {merchant.websiteDomain
                      ? ` · ${merchant.websiteDomain}`
                      : ""}
                  </div>
                </div>
                <span style={{ color: "#a0aec0", fontSize: 16 }}>›</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Detail Loading */}
      {detail.loading && (
        <div
          style={{
            padding: 12,
            textAlign: "center",
            color: "#718096",
            fontSize: 13,
          }}
        >
          Loading details...
        </div>
      )}

      {/* Detail Error */}
      {detail.error && (
        <div
          style={{
            padding: 10,
            background: "#fff5f5",
            border: "1px solid #fed7d7",
            borderRadius: 8,
            fontSize: 13,
            color: "#c53030",
            marginBottom: 8,
          }}
        >
          {detail.error}
        </div>
      )}

      {/* Merchant Detail */}
      {detail.detail && <MerchantDetailView detail={detail.detail} onBack={handleClearDetail} />}
    </div>
  );
}

function MerchantDetailView({
  detail,
  onBack,
}: {
  detail: MerchantDetail;
  onBack: () => void;
}) {
  const { merchant, cardRankings, offers } = detail;
  const topCards = cardRankings.slice(0, 3);

  return (
    <div>
      {/* Back button + Merchant name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#3182ce",
            fontSize: 14,
            padding: "2px 4px",
            fontWeight: 600,
          }}
        >
          &larr; Back
        </button>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{merchant.name}</div>
        <div
          style={{
            fontSize: 11,
            color: "#718096",
            background: "#edf2f7",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          {merchant.category}
        </div>
      </div>

      {/* Best Cards */}
      {topCards.length > 0 ? (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#718096",
              marginBottom: 6,
            }}
          >
            TOP CARDS
          </div>
          {topCards.map((card, i) => (
            <div
              key={card.cardId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: i === 0 ? "#ebf8ff" : "#f7fafc",
                border: `1px solid ${i === 0 ? "#bee3f8" : "#e2e8f0"}`,
                borderRadius: 8,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {i === 0 && (
                    <span
                      style={{
                        color: "#d69e2e",
                        marginRight: 4,
                      }}
                    >
                      #1
                    </span>
                  )}
                  {card.cardName}
                </div>
                <div style={{ color: "#718096", fontSize: 11 }}>
                  {card.issuer}
                </div>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  color: i === 0 ? "#2b6cb0" : "#4a5568",
                  fontSize: 14,
                  whiteSpace: "nowrap",
                }}
              >
                {card.multiplier}x{" "}
                <span style={{ fontSize: 10, fontWeight: 400 }}>
                  {card.currency}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: 10,
            background: "#f7fafc",
            borderRadius: 8,
            fontSize: 12,
            color: "#a0aec0",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          No card rankings available
        </div>
      )}

      {/* Active Offers */}
      {offers.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#718096",
              marginBottom: 6,
            }}
          >
            ACTIVE OFFERS ({offers.length})
          </div>
          {offers.slice(0, 3).map((offer) => (
            <div
              key={offer.id}
              style={{
                padding: "8px 10px",
                border: "1px solid #c6f6d5",
                background: "#f0fff4",
                borderRadius: 8,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 600, color: "#276749" }}>
                  {offer.title}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#38a169",
                    whiteSpace: "nowrap",
                    marginLeft: 8,
                  }}
                >
                  {offer.valueType === "percentage"
                    ? `${offer.value}%`
                    : offer.valueType === "points"
                    ? `${Number(offer.value).toLocaleString()} pts`
                    : `$${offer.value}`}
                </div>
              </div>
              {offer.cardName && (
                <div style={{ color: "#68d391", fontSize: 11, marginTop: 2 }}>
                  via {offer.cardName}
                </div>
              )}
              {offer.endDate && (
                <div style={{ color: "#a0aec0", fontSize: 11, marginTop: 2 }}>
                  Expires {offer.endDate}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
