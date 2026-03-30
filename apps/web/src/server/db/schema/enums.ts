import { pgEnum } from "drizzle-orm/pg-core";

export const issuerEnum = pgEnum("issuer", [
  "amex",
  "chase",
  "capital_one",
  "citi",
  "us_bank",
  "barclays",
  "wells_fargo",
  "bank_of_america",
]);

export const networkEnum = pgEnum("network", [
  "visa",
  "mastercard",
  "amex",
  "discover",
]);

export const benefitTypeEnum = pgEnum("benefit_type", [
  "statement_credit",
  "travel_credit",
  "lounge_access",
  "insurance",
  "perk",
  "dining_credit",
  "entertainment_credit",
  "hotel_credit",
  "airline_credit",
  "uber_credit",
  "streaming_credit",
  "wellness_credit",
  "shopping_credit",
]);

export const frequencyEnum = pgEnum("frequency", [
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
  "one_time",
]);

export const capPeriodEnum = pgEnum("cap_period", [
  "monthly",
  "quarterly",
  "annually",
  "calendar_year",
  "none",
]);

export const offerTypeEnum = pgEnum("offer_type", [
  "cashback",
  "points_bonus",
  "discount",
  "statement_credit",
]);

export const valueTypeEnum = pgEnum("value_type", [
  "percentage",
  "fixed",
  "points", // @deprecated — use "points_multiplier" or "points_flat" instead. Kept for backwards compat with existing DB rows.
  "points_multiplier",
  "points_flat",
]);
