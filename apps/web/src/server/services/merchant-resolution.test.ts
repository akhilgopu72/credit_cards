import { describe, it, expect } from "vitest";
import { normalizeMerchantName, extractDomainFromName } from "./merchant-resolution";

// ─── extractDomainFromName ──────────────────────────────────────

describe("extractDomainFromName", () => {
  it("detects simple .com domains", () => {
    expect(extractDomainFromName("oribe.com")).toBe("oribe.com");
  });

  it("detects hyphenated domains", () => {
    expect(extractDomainFromName("kipling-usa.com")).toBe("kipling-usa.com");
  });

  it("detects .co.uk style domains", () => {
    expect(extractDomainFromName("marks-spencer.co.uk")).toBe("marks-spencer.co.uk");
  });

  it("detects .net domains", () => {
    expect(extractDomainFromName("example.net")).toBe("example.net");
  });

  it("returns null for regular names", () => {
    expect(extractDomainFromName("Arlo")).toBeNull();
    expect(extractDomainFromName("Air France")).toBeNull();
    expect(extractDomainFromName("Dell Technologies")).toBeNull();
  });

  it("returns null for names with dots but not domain-like", () => {
    expect(extractDomainFromName("St. Regis Hotels")).toBeNull();
  });

  it("handles whitespace", () => {
    expect(extractDomainFromName("  oribe.com  ")).toBe("oribe.com");
  });
});

// ─── normalizeMerchantName ──────────────────────────────────────

describe("normalizeMerchantName", () => {
  it("handles dash-separated taglines", () => {
    const result = normalizeMerchantName("Arlo - Smart Home Security Cameras");
    expect(result[0]).toBe("Arlo");
    expect(result).toContain("Arlo - Smart Home Security Cameras");
  });

  it("handles parenthetical qualifiers", () => {
    const result = normalizeMerchantName("Air France (through Amex Travel only)");
    expect(result[0]).toBe("Air France");
    expect(result).toContain("Air France (through Amex Travel only)");
  });

  it("handles domain-style names", () => {
    const result = normalizeMerchantName("oribe.com");
    expect(result[0]).toBe("Oribe");
    expect(result).toContain("oribe.com");
  });

  it("handles hyphenated domain names", () => {
    const result = normalizeMerchantName("kipling-usa.com");
    expect(result[0]).toBe("Kipling-usa");
    expect(result).toContain("kipling-usa.com");
  });

  it("handles trademark symbols", () => {
    const result = normalizeMerchantName("Bose®");
    expect(result[0]).toBe("Bose");
    // First candidate should be clean; raw fallback may still have ®
    expect(result[0]!.includes("®")).toBe(false);
  });

  it("handles card-specific qualifiers", () => {
    const result = normalizeMerchantName("Breitling - Platinum Card Offer");
    expect(result[0]).toBe("Breitling");
  });

  it("handles combined patterns (dash + parens)", () => {
    const result = normalizeMerchantName("SoulCycle - Indoor Cycling (Amex Exclusive)");
    expect(result).toContain("SoulCycle");
    // Should have stripped both patterns
    expect(result.some((c) => c === "SoulCycle")).toBe(true);
  });

  it("returns clean names unchanged as first candidate", () => {
    const result = normalizeMerchantName("Hilton");
    expect(result[0]).toBe("Hilton");
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("deduplicates candidates", () => {
    const result = normalizeMerchantName("Hilton");
    const unique = new Set(result);
    expect(result.length).toBe(unique.size);
  });

  it("handles em dashes", () => {
    const result = normalizeMerchantName("Arlo — Smart Home Security");
    expect(result[0]).toBe("Arlo");
  });

  it("handles en dashes", () => {
    const result = normalizeMerchantName("Arlo – Smart Home Security");
    expect(result[0]).toBe("Arlo");
  });

  it("handles multiple trademark symbols", () => {
    const result = normalizeMerchantName("Nike™ Air Max®");
    expect(result[0]).toBe("Nike Air Max");
  });

  it("handles Gold Card Offer qualifier", () => {
    const result = normalizeMerchantName("Saks Fifth Avenue - Gold Card Offer");
    expect(result[0]).toBe("Saks Fifth Avenue");
  });
});
