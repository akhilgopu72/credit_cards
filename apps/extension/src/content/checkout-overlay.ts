import type { ExtensionMessage, CheckoutLookupResponse } from "@cardmax/shared";
import { injectOverlay, removeOverlay } from "./checkout-overlay-ui";

/**
 * Checkout Overlay Content Script
 *
 * Detects checkout/payment pages and shows a floating card recommendation
 * banner with the best card to use at this merchant.
 *
 * Detection strategy:
 *   1. URL pattern matching (e.g. /checkout, /cart, /payment)
 *   2. Payment form field detection (credit card inputs, payment forms)
 *
 * On detection, extracts the merchant domain and asks the background
 * script to look up the best card recommendation via the CardMax API.
 */

// ─── URL Patterns that indicate checkout pages ──────────────────
const CHECKOUT_URL_PATTERNS = [
  /\/checkout/i,
  /\/cart/i,
  /\/payment/i,
  /\/order/i,
  /\/billing/i,
  /\/purchase/i,
  /\/pay\b/i,
  /\/subscribe/i,
  /\/book(ing)?/i,
];

// ─── Selectors for payment-related form fields ──────────────────
const PAYMENT_FIELD_SELECTORS = [
  'input[autocomplete="cc-number"]',
  'input[autocomplete="cc-name"]',
  'input[autocomplete="cc-exp"]',
  'input[autocomplete="cc-csc"]',
  'input[name*="card" i][name*="number" i]',
  'input[name*="credit" i]',
  'input[name*="ccnum" i]',
  'input[name*="cardnumber" i]',
  'input[id*="card-number" i]',
  'input[id*="cardNumber" i]',
  'input[data-testid*="card" i]',
  'input[placeholder*="card number" i]',
  'input[aria-label*="card number" i]',
  'form[action*="payment" i]',
  'form[action*="checkout" i]',
  'form[id*="payment" i]',
  'form[id*="checkout" i]',
  '[data-testid*="payment" i]',
  '[data-testid*="checkout" i]',
];

// ─── Domains to exclude (banking, card issuer sites, etc.) ──────
const EXCLUDED_DOMAINS = [
  "americanexpress.com",
  "chase.com",
  "capitalone.com",
  "citi.com",
  "bankofamerica.com",
  "wellsfargo.com",
  "usbank.com",
  "barclays.com",
  "paypal.com",
  "venmo.com",
  "localhost",
];

let hasInjected = false;
let observerActive = false;

/**
 * Check if the current URL matches checkout patterns.
 */
function isCheckoutUrl(): boolean {
  const url = window.location.pathname + window.location.search;
  return CHECKOUT_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Check if the page contains payment-related form fields.
 */
function hasPaymentFields(): boolean {
  return PAYMENT_FIELD_SELECTORS.some(
    (selector) => document.querySelector(selector) !== null
  );
}

/**
 * Check if the current domain should be excluded.
 */
function isExcludedDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return EXCLUDED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

/**
 * Extract a clean merchant name from the hostname.
 * e.g. "www.amazon.com" -> "amazon.com"
 */
function extractMerchantDomain(): string {
  return window.location.hostname.replace(/^www\./, "").toLowerCase();
}

/**
 * Detect if this is a checkout page and trigger the overlay.
 */
function detectCheckout(): void {
  if (hasInjected || isExcludedDomain()) return;

  const isCheckout = isCheckoutUrl() || hasPaymentFields();
  if (!isCheckout) return;

  hasInjected = true;
  const domain = extractMerchantDomain();
  console.log(`[CardMax] Checkout detected on ${domain}`);

  // Send lookup request to background script
  const message: ExtensionMessage = {
    type: "CHECKOUT_MERCHANT_LOOKUP",
    payload: { domain },
  };

  chrome.runtime.sendMessage(message, (response: CheckoutLookupResponse) => {
    if (chrome.runtime.lastError) {
      console.error("[CardMax] Message error:", chrome.runtime.lastError.message);
      return;
    }

    if (response?.success && response.recommendation) {
      console.log("[CardMax] Card recommendation:", response.recommendation);
      injectOverlay(response.recommendation);
    } else {
      console.log("[CardMax] No recommendation available:", response?.error);
    }
  });
}

/**
 * Observe DOM mutations to detect dynamically loaded payment forms
 * (e.g. SPAs that load the checkout step after initial page load).
 */
function observeForPaymentFields(): void {
  if (observerActive) return;
  observerActive = true;

  const observer = new MutationObserver(() => {
    if (hasInjected) {
      observer.disconnect();
      return;
    }
    if (hasPaymentFields()) {
      observer.disconnect();
      detectCheckout();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Stop observing after 30 seconds to avoid performance impact
  setTimeout(() => {
    observer.disconnect();
    observerActive = false;
  }, 30000);
}

/**
 * Handle SPA navigation (URL changes without full page reload).
 */
function watchForNavigation(): void {
  let lastUrl = window.location.href;

  const check = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Reset state for new page
      hasInjected = false;
      removeOverlay();
      detectCheckout();
    }
  };

  // Listen for pushState/replaceState
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(check, 100);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(check, 100);
  };

  window.addEventListener("popstate", () => setTimeout(check, 100));
}

// ─── Initialize ─────────────────────────────────────────────────
function init(): void {
  detectCheckout();

  // If no checkout detected yet, watch for dynamically loaded payment forms
  if (!hasInjected) {
    observeForPaymentFields();
  }

  // Watch for SPA navigation
  watchForNavigation();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
