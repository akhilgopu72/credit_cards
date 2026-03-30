import type {
  ChaseScrapedTransaction,
  ChaseCategoryCode,
  ExtensionMessage,
} from "@cardmax/shared";
import { CHASE_CATEGORY_CODES, CHASE_CATEGORY_MAP } from "@cardmax/shared";

/**
 * Chase Transaction Scraper
 *
 * Activates on secure.chase.com card activity pages.
 * Scrapes the MDS activity table for transaction data including:
 *   - Date, merchant name, amount
 *   - Chase's category code (TRAV, FOOD, etc.) → mapped to CardMax spend categories
 *   - Offer redemptions (detected via "Offer:MerchantName" pattern)
 *
 * DOM structure:
 *   table.mds-activity-table > tbody > tr.mds-activity-table__row
 *   Each <tr> has data-values="MM/DD/YYYY,Merchant,(...NNNN),,amount,"
 *   Category: .option--selected[data-value="TRAV"] inside each row's select
 */

const LOG_PREFIX = "[CardMax Txn]";

// ─── Source Hash ────────────────────────────────────────────────

function createSourceHash(txn: Partial<ChaseScrapedTransaction>): string {
  const raw = `chase:${txn.cardName || ""}:${txn.date}:${txn.merchantName}:${txn.amount}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `chase_txn_${Math.abs(hash).toString(36)}`;
}

// ─── Card Name Detection ────────────────────────────────────────

function getCardName(): string | undefined {
  // Breadcrumb on card detail page: "Account: Ink Preferred (...1327)"
  const breadcrumb = document.querySelector(".breadcrumb-label");
  if (breadcrumb) {
    const text = (breadcrumb.textContent || "").trim();
    const match = text.match(/^Account:\s*(.+)$/i);
    if (match) return match[1].trim();
  }

  // Fallback: heading on card detail page
  const heading = document.querySelector('[data-testid="dataItem-label"][role="heading"]');
  if (heading) {
    const text = (heading.textContent || "").trim();
    if (text.includes("...")) return text;
  }

  return undefined;
}

// ─── Parse Amount ───────────────────────────────────────────────

function parseAmount(raw: string): number {
  // Remove currency symbols, commas, whitespace
  const cleaned = raw.replace(/[,$\s]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

// ─── Parse Date ─────────────────────────────────────────────────

function parseDate(raw: string): string {
  // Input: "MM/DD/YYYY" → Output: "YYYY-MM-DD"
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[1]}-${match[2]}`;
  }
  // Fallback: try parsing as-is
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return raw;
}

// ─── Extract Category from Row ──────────────────────────────────

function extractCategory(row: Element): {
  code?: ChaseCategoryCode;
  label?: string;
} {
  // Primary: find the selected option's data-value (e.g., "TRAV")
  const selectedOption = row.querySelector(".option--selected[data-value]");
  if (selectedOption) {
    const code = selectedOption.getAttribute("data-value") || "";
    const label = selectedOption.getAttribute("data-label") || "";
    if (CHASE_CATEGORY_CODES.includes(code as ChaseCategoryCode)) {
      return { code: code as ChaseCategoryCode, label };
    }
  }

  // Fallback: read the category button text
  const categoryBtn = row.querySelector(
    'button[name="transactionCategory"]'
  );
  if (categoryBtn) {
    const label = (categoryBtn.textContent || "").trim();
    // Reverse-map label to code
    const entry = Object.entries(CHASE_CATEGORY_MAP).find(
      ([, ]) => label.toLowerCase().includes(label.toLowerCase())
    );
    return { label, code: entry?.[0] as ChaseCategoryCode | undefined };
  }

  return {};
}

// ─── Main Scraper ───────────────────────────────────────────────

function scrapeTransactions(): ChaseScrapedTransaction[] {
  const table = document.querySelector(
    'table[data-testid="ACTIVITY-dataTableId-mds-diy-data-table"]'
  );

  if (!table) {
    console.log(`${LOG_PREFIX} No activity table found on this page`);
    return [];
  }

  const cardName = getCardName();
  console.log(`${LOG_PREFIX} Detected card: ${cardName || "unknown"}`);

  const rows = table.querySelectorAll("tbody tr.mds-activity-table__row");
  const transactions: ChaseScrapedTransaction[] = [];

  for (const row of rows) {
    try {
      // ── Fast path: data-values CSV ───────────────────────
      const dataValues = row.getAttribute("data-values");
      if (!dataValues) continue;

      // Format: "MM/DD/YYYY,MerchantName,(...NNNN),,amount,"
      // Note: amount may contain commas inside (e.g., "$1,057.00")
      // We split carefully — the CSV uses , as delimiter but amounts have commas too
      // Chase puts: "01/26/2026,AUTOMATIC PAYMENT - THANK,(...1327),,-$1,057.00,"
      const parts = dataValues.split(",");
      if (parts.length < 5) continue;

      const dateRaw = parts[0];
      const merchantRaw = parts[1];
      // Card is parts[2], skip parts[3] (empty)
      // Amount is everything from parts[4] to second-to-last (handles commas in amount)
      const amountRaw = parts.slice(4, -1).join(",");

      if (!dateRaw || !merchantRaw) continue;

      const date = parseDate(dateRaw);
      const amount = parseAmount(amountRaw);

      // Skip zero-amount rows
      if (amount === 0) continue;

      // ── Merchant name (prefer rich text from DOM) ────────
      const richTextEl = row.querySelector(
        '[data-testid="rich-text-accessible-text"]'
      );
      const richText = richTextEl
        ? (richTextEl.textContent || "").trim()
        : merchantRaw;

      // Split "Uber Eats, Uber" → primary "Uber Eats"
      const merchantParts = richText.split(", ");
      const merchantName = merchantParts[0] || merchantRaw;

      // ── Offer redemption detection ───────────────────────
      const isOfferRedemption = merchantName.startsWith("Offer:");
      const offerMerchant = isOfferRedemption
        ? merchantName.replace(/^Offer:/, "").trim()
        : undefined;

      // ── Category ─────────────────────────────────────────
      const { code: chaseCategoryCode, label: chaseCategoryLabel } =
        extractCategory(row);

      const category =
        chaseCategoryCode && CHASE_CATEGORY_MAP[chaseCategoryCode]
          ? CHASE_CATEGORY_MAP[chaseCategoryCode]
          : "general";

      // ── Build transaction ────────────────────────────────
      const txn: ChaseScrapedTransaction = {
        issuer: "chase",
        cardName,
        merchantName: isOfferRedemption
          ? offerMerchant || merchantName
          : merchantName,
        rawDescription: merchantRaw,
        date,
        amount,
        category,
        chaseCategoryCode,
        chaseCategoryLabel,
        isOfferRedemption,
        offerMerchant,
        sourceHash: "",
      };

      txn.sourceHash = createSourceHash(txn);
      transactions.push(txn);
    } catch (err) {
      console.error(`${LOG_PREFIX} Error parsing row:`, err);
    }
  }

  return transactions;
}

// ─── Check for Activity Table ───────────────────────────────────

function findActivityTable(): HTMLTableElement | null {
  // Primary: exact data-testid on the table itself
  const byTestId = document.querySelector<HTMLTableElement>(
    'table[data-testid="ACTIVITY-dataTableId-mds-diy-data-table"]'
  );
  if (byTestId) return byTestId;

  // Chase uses web components — the data-testid may be on an mds-tile wrapper,
  // not the table. Look for any table with the MDS activity class.
  const byClass = document.querySelector<HTMLTableElement>("table.mds-activity-table");
  if (byClass) return byClass;

  // Broadest fallback: find the table inside the activity container
  const container = document.querySelector('[data-testid*="ACTIVITY"]');
  if (container) {
    const nested = container.querySelector<HTMLTableElement>("table");
    if (nested) return nested;
  }

  // Last resort: find any table that contains activity rows
  const allTables = document.querySelectorAll("table");
  for (const t of allTables) {
    if (t.querySelector("tr.mds-activity-table__row") || t.querySelector("tr[data-values]")) {
      return t as HTMLTableElement;
    }
  }

  return null;
}

// ─── Scrape and Send ────────────────────────────────────────────

let lastScrapeHash = "";

export function scrapeAndSendTransactions() {
  scrapeAndSend();
}

function scrapeAndSend() {
  const table = findActivityTable();
  if (!table) return;

  console.log(`${LOG_PREFIX} Activity table detected, scraping transactions...`);

  const transactions = scrapeTransactions();

  // Deduplicate by sourceHash
  const seen = new Set<string>();
  const deduped = transactions.filter((t) => {
    if (seen.has(t.sourceHash)) return false;
    seen.add(t.sourceHash);
    return true;
  });

  // Avoid re-sending identical data
  const scrapeHash = deduped.map((t) => t.sourceHash).join(",");
  if (scrapeHash === lastScrapeHash) {
    console.log(`${LOG_PREFIX} No new transactions since last scrape`);
    return;
  }
  lastScrapeHash = scrapeHash;

  console.log(
    `${LOG_PREFIX} Scraped ${deduped.length} transactions (${transactions.length - deduped.length} dupes removed)`
  );

  if (deduped.length > 0) {
    chrome.runtime.sendMessage({
      type: "SCRAPE_STATUS",
      payload: { issuer: "chase", status: "started", resource: "transactions" },
    } satisfies ExtensionMessage);

    chrome.runtime.sendMessage({
      type: "TRANSACTIONS_SCRAPED",
      payload: deduped,
    } satisfies ExtensionMessage);

    chrome.runtime.sendMessage({
      type: "SCRAPE_STATUS",
      payload: {
        issuer: "chase",
        status: "completed",
        count: deduped.length,
        resource: "transactions",
      },
    } satisfies ExtensionMessage);
  }
}

// ─── Persistent Observer ────────────────────────────────────────
// Chase is a SPA — the activity table can appear/disappear as the
// user navigates between overview and card detail pages. We keep a
// MutationObserver running and scrape whenever the table appears.

export function startTransactionObserver() {
  startObserver();
}

function startObserver() {
  // Try immediately
  if (findActivityTable()) {
    setTimeout(scrapeAndSend, 1500);
  }

  const observer = new MutationObserver(() => {
    if (findActivityTable()) {
      // Debounce: wait for rows to finish rendering
      setTimeout(scrapeAndSend, 2000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also listen for SPA hash navigation
  window.addEventListener("hashchange", () => {
    console.log(`${LOG_PREFIX} Hash changed, checking for activity table...`);
    lastScrapeHash = ""; // Reset so we re-scrape on navigation
    setTimeout(() => {
      if (findActivityTable()) {
        setTimeout(scrapeAndSend, 2000);
      }
    }, 3000); // Give Chase time to render
  });
}

// This module is imported by chase-scraper.ts, not loaded as a standalone content script.
// The chase-scraper detects card activity pages and calls startTransactionObserver().
