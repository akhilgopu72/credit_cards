import type { CardRecommendation } from "@cardmax/shared";

/**
 * Checkout Overlay UI
 *
 * Injects a floating card recommendation banner into the page using
 * Shadow DOM to isolate styles from the host page.
 */

const OVERLAY_HOST_ID = "cardmax-checkout-overlay";

/**
 * Remove the overlay from the page if it exists.
 */
export function removeOverlay(): void {
  const existing = document.getElementById(OVERLAY_HOST_ID);
  if (existing) {
    existing.remove();
  }
}

/**
 * Format the reward rate for display.
 * e.g. 3x points, 5% cash back
 */
function formatReward(recommendation: CardRecommendation): string {
  const { multiplier, currency } = recommendation;
  if (currency.toLowerCase().includes("cash") || currency.toLowerCase().includes("back")) {
    return `${multiplier}% cash back`;
  }
  return `${multiplier}x ${currency}`;
}

/**
 * Inject the card recommendation overlay into the page.
 */
export function injectOverlay(recommendation: CardRecommendation): void {
  removeOverlay();

  // Create host element
  const host = document.createElement("div");
  host.id = OVERLAY_HOST_ID;
  host.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    pointer-events: auto !important;
  `;

  // Attach shadow DOM for style isolation
  const shadow = host.attachShadow({ mode: "closed" });

  const reward = formatReward(recommendation);
  const merchantDisplay = recommendation.merchantName || recommendation.category;
  const rateLabel = recommendation.isBaseRate ? "(base rate)" : "";

  shadow.innerHTML = `
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .cardmax-overlay {
        background: #1a1a2e;
        color: #ffffff;
        border-radius: 12px;
        padding: 14px 18px;
        max-width: 360px;
        min-width: 280px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
        font-size: 14px;
        line-height: 1.4;
        animation: cardmax-slide-in 0.3s ease-out;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      @keyframes cardmax-slide-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .cardmax-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .cardmax-logo {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 600;
        color: #a0aec0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .cardmax-logo-icon {
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #38a169, #2f855a);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: bold;
      }

      .cardmax-dismiss {
        background: none;
        border: none;
        color: #718096;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 2px 4px;
        border-radius: 4px;
        transition: color 0.15s, background 0.15s;
      }

      .cardmax-dismiss:hover {
        color: #e2e8f0;
        background: rgba(255, 255, 255, 0.1);
      }

      .cardmax-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .cardmax-recommendation {
        font-size: 15px;
        font-weight: 500;
        color: #f7fafc;
      }

      .cardmax-card-name {
        color: #68d391;
        font-weight: 700;
      }

      .cardmax-reward {
        color: #fbd38d;
        font-weight: 700;
      }

      .cardmax-merchant {
        color: #90cdf4;
      }

      .cardmax-meta {
        font-size: 11px;
        color: #718096;
        margin-top: 2px;
      }
    </style>

    <div class="cardmax-overlay">
      <div class="cardmax-header">
        <div class="cardmax-logo">
          <div class="cardmax-logo-icon">C</div>
          CardMax
        </div>
        <button class="cardmax-dismiss" aria-label="Dismiss" title="Dismiss">&times;</button>
      </div>
      <div class="cardmax-body">
        <div class="cardmax-recommendation">
          Use <span class="cardmax-card-name">${escapeHtml(recommendation.cardName)}</span>
          for <span class="cardmax-reward">${escapeHtml(reward)}</span>
          at <span class="cardmax-merchant">${escapeHtml(merchantDisplay)}</span>
        </div>
        <div class="cardmax-meta">
          ${escapeHtml(recommendation.issuer)} &middot; ${escapeHtml(recommendation.category)} category ${rateLabel ? `&middot; ${escapeHtml(rateLabel)}` : ""}
        </div>
      </div>
    </div>
  `;

  // Dismiss button handler
  const dismissBtn = shadow.querySelector(".cardmax-dismiss");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      host.style.animation = "none";
      host.style.transition = "opacity 0.2s, transform 0.2s";
      host.style.opacity = "0";
      host.style.transform = "translateY(10px)";
      setTimeout(() => removeOverlay(), 200);
    });
  }

  document.body.appendChild(host);
}

/**
 * Escape HTML to prevent XSS from merchant names or card data.
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
