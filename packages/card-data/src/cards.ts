// CardMax Seed Data - Top 30 Credit Cards
// Data based on publicly available card terms as of early 2025.
// Note: Card terms change periodically. Verify against issuer websites for latest details.

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type Issuer =
  | "amex"
  | "chase"
  | "capital_one"
  | "citi"
  | "wells_fargo"
  | "bank_of_america"
  | "us_bank";

export type Network = "visa" | "mastercard" | "amex";

export type SpendCategory =
  | "dining"
  | "travel"
  | "groceries"
  | "gas"
  | "streaming"
  | "online_shopping"
  | "drugstores"
  | "home_improvement"
  | "transit"
  | "hotels"
  | "airlines"
  | "car_rental"
  | "entertainment"
  | "general";

export type BenefitType =
  | "statement_credit"
  | "travel_credit"
  | "lounge_access"
  | "insurance"
  | "perk"
  | "dining_credit"
  | "entertainment_credit"
  | "hotel_credit"
  | "airline_credit"
  | "uber_credit"
  | "streaming_credit"
  | "wellness_credit"
  | "shopping_credit";

export type Frequency =
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual"
  | "one_time";

export type CapPeriod =
  | "monthly"
  | "quarterly"
  | "annual"
  | "calendar_year"
  | null;

export type PointsCurrency =
  | "Ultimate Rewards"
  | "Membership Rewards"
  | "Capital One Miles"
  | "ThankYou Points"
  | "Cash Back"
  | "Delta SkyMiles"
  | "Hilton Honors"
  | "Marriott Bonvoy";

export interface SignUpBonus {
  points: number;
  spend_requirement: number;
  timeframe_months: number;
}

export interface BaseEarnRate {
  points_per_dollar: number;
  currency: PointsCurrency;
}

export interface CategoryBonus {
  category: SpendCategory;
  multiplier: number;
  cap_amount: number | null;
  cap_period: CapPeriod;
}

export interface Benefit {
  benefit_type: BenefitType;
  name: string;
  description: string;
  value: number;
  frequency: Frequency;
  auto_trigger: boolean;
  merchant_name?: string;
}

export interface CreditCard {
  issuer: Issuer;
  name: string;
  slug: string;
  network: Network;
  annual_fee: number;
  sign_up_bonus: SignUpBonus;
  base_earn_rate: BaseEarnRate;
  category_bonuses: CategoryBonus[];
  benefits: Benefit[];
}

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

export const cards: CreditCard[] = [
  // =========================================================================
  // CHASE CARDS (7)
  // =========================================================================

  // 1. Chase Sapphire Reserve
  {
    issuer: "chase",
    name: "Chase Sapphire Reserve",
    slug: "chase-sapphire-reserve",
    network: "visa",
    annual_fee: 550,
    sign_up_bonus: {
      points: 60000,
      spend_requirement: 4000,
      timeframe_months: 3,
    },
    base_earn_rate: {
      points_per_dollar: 1,
      currency: "Ultimate Rewards",
    },
    category_bonuses: [
      {
        category: "travel",
        multiplier: 3,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "dining",
        multiplier: 3,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "airlines",
        multiplier: 5,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "hotels",
        multiplier: 10,
        cap_amount: null,
        cap_period: null,
      },
    ],
    benefits: [
      {
        benefit_type: "travel_credit",
        name: "Annual Travel Credit",
        description:
          "$300 annual travel credit automatically applied to travel purchases.",
        value: 300,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "lounge_access",
        name: "Priority Pass Select",
        description:
          "Complimentary Priority Pass Select membership with unlimited lounge visits for cardholder and two guests.",
        value: 429,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "lounge_access",
        name: "Chase Sapphire Lounge Access",
        description:
          "Access to Chase Sapphire Lounges by The Club at select airports.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "Points Worth 50% More for Travel",
        description:
          "Ultimate Rewards points are worth 50% more when redeemed for travel through Chase Travel.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "statement_credit",
        name: "DoorDash DashPass",
        description:
          "Complimentary DashPass membership and annual DoorDash statement credits.",
        value: 60,
        frequency: "annual",
        auto_trigger: false,
        merchant_name: "DoorDash",
      },
      {
        benefit_type: "perk",
        name: "Global Entry / TSA PreCheck Credit",
        description:
          "Up to $100 credit for Global Entry or TSA PreCheck application fee.",
        value: 100,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Primary Car Rental Insurance",
        description:
          "Primary auto rental collision damage waiver when renting for business or personal use.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Trip Cancellation / Interruption Insurance",
        description:
          "Up to $10,000 per person and $20,000 per trip for pre-paid, non-refundable travel expenses.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "entertainment_credit",
        name: "Lyft Pink Membership",
        description:
          "Complimentary Lyft Pink All Access membership and 5x points on Lyft rides.",
        value: 0,
        frequency: "annual",
        auto_trigger: false,
        merchant_name: "Lyft",
      },
    ],
  },

  // 2. Chase Sapphire Preferred
  {
    issuer: "chase",
    name: "Chase Sapphire Preferred Card",
    slug: "chase-sapphire-preferred",
    network: "visa",
    annual_fee: 95,
    sign_up_bonus: {
      points: 60000,
      spend_requirement: 4000,
      timeframe_months: 3,
    },
    base_earn_rate: {
      points_per_dollar: 1,
      currency: "Ultimate Rewards",
    },
    category_bonuses: [
      {
        category: "travel",
        multiplier: 2,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "dining",
        multiplier: 3,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "online_shopping",
        multiplier: 3,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "streaming",
        multiplier: 3,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "hotels",
        multiplier: 5,
        cap_amount: null,
        cap_period: null,
      },
    ],
    benefits: [
      {
        benefit_type: "perk",
        name: "Points Worth 25% More for Travel",
        description:
          "Ultimate Rewards points are worth 25% more when redeemed for travel through Chase Travel.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "travel_credit",
        name: "Annual Hotel Credit",
        description:
          "$50 annual hotel credit for hotel stays purchased through Chase Travel.",
        value: 50,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "Anniversary Points Bonus",
        description:
          "Earn 10% more points on all purchases made in the previous year, awarded on account anniversary.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "Global Entry / TSA PreCheck Credit",
        description:
          "Up to $100 credit for Global Entry or TSA PreCheck application fee.",
        value: 100,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Primary Car Rental Insurance",
        description:
          "Primary auto rental collision damage waiver when renting for business or personal use.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Trip Cancellation / Interruption Insurance",
        description:
          "Up to $5,000 per person and $10,000 per trip for pre-paid, non-refundable travel expenses.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "statement_credit",
        name: "DoorDash DashPass",
        description:
          "Complimentary DashPass membership and DoorDash statement credits.",
        value: 60,
        frequency: "annual",
        auto_trigger: false,
        merchant_name: "DoorDash",
      },
    ],
  },

  // 3. Chase Freedom Unlimited
  {
    issuer: "chase",
    name: "Chase Freedom Unlimited",
    slug: "chase-freedom-unlimited",
    network: "visa",
    annual_fee: 0,
    sign_up_bonus: {
      points: 20000,
      spend_requirement: 500,
      timeframe_months: 3,
    },
    base_earn_rate: {
      points_per_dollar: 1.5,
      currency: "Ultimate Rewards",
    },
    category_bonuses: [
      {
        category: "dining",
        multiplier: 3,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "drugstores",
        multiplier: 3,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "travel",
        multiplier: 5,
        cap_amount: null,
        cap_period: null,
      },
    ],
    benefits: [
      {
        benefit_type: "perk",
        name: "No Annual Fee",
        description: "No annual fee for the life of the account.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "0% Intro APR",
        description:
          "0% intro APR for 15 months from account opening on purchases and balance transfers.",
        value: 0,
        frequency: "one_time",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Purchase Protection",
        description:
          "Covers new purchases for 120 days against damage or theft up to $500 per claim.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Extended Warranty Protection",
        description:
          "Extends the manufacturer warranty by an additional year on eligible purchases.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
    ],
  },

  // 4. Chase Freedom Flex
  {
    issuer: "chase",
    name: "Chase Freedom Flex",
    slug: "chase-freedom-flex",
    network: "mastercard",
    annual_fee: 0,
    sign_up_bonus: {
      points: 20000,
      spend_requirement: 500,
      timeframe_months: 3,
    },
    base_earn_rate: {
      points_per_dollar: 1,
      currency: "Ultimate Rewards",
    },
    category_bonuses: [
      {
        category: "dining",
        multiplier: 3,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "drugstores",
        multiplier: 3,
        cap_amount: null,
        cap_period: null,
      },
      {
        category: "travel",
        multiplier: 5,
        cap_amount: null,
        cap_period: null,
      },
      {
        // Rotating quarterly categories - 5% on up to $1,500 per quarter
        category: "general",
        multiplier: 5,
        cap_amount: 1500,
        cap_period: "quarterly",
      },
    ],
    benefits: [
      {
        benefit_type: "perk",
        name: "5% Rotating Quarterly Categories",
        description:
          "Earn 5% cash back on up to $1,500 in combined purchases in bonus categories each quarter you activate.",
        value: 0,
        frequency: "quarterly",
        auto_trigger: false,
      },
      {
        benefit_type: "perk",
        name: "No Annual Fee",
        description: "No annual fee for the life of the account.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "0% Intro APR",
        description:
          "0% intro APR for 15 months from account opening on purchases and balance transfers.",
        value: 0,
        frequency: "one_time",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Cell Phone Protection",
        description:
          "Up to $800 per claim for cell phone damage or theft when you pay your monthly bill with your card. $50 deductible, 2 claims per 12 months.",
        value: 800,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Purchase Protection",
        description:
          "Covers new purchases for 120 days against damage or theft up to $500 per claim.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Extended Warranty Protection",
        description:
          "Extends the manufacturer warranty by an additional year on eligible purchases.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
    ],
  },

  // 5. Chase Ink Business Preferred
  {
    issuer: "chase",
    name: "Ink Business Preferred Credit Card",
    slug: "chase-ink-business-preferred",
    network: "visa",
    annual_fee: 95,
    sign_up_bonus: {
      points: 100000,
      spend_requirement: 8000,
      timeframe_months: 3,
    },
    base_earn_rate: {
      points_per_dollar: 1,
      currency: "Ultimate Rewards",
    },
    category_bonuses: [
      {
        category: "travel",
        multiplier: 3,
        cap_amount: 150000,
        cap_period: "calendar_year",
      },
      {
        category: "online_shopping",
        multiplier: 3,
        cap_amount: 150000,
        cap_period: "calendar_year",
      },
      {
        category: "transit",
        multiplier: 3,
        cap_amount: 150000,
        cap_period: "calendar_year",
      },
    ],
    benefits: [
      {
        benefit_type: "perk",
        name: "Points Worth 25% More for Travel",
        description:
          "Ultimate Rewards points are worth 25% more when redeemed for travel through Chase Travel.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "Transfer to Travel Partners",
        description:
          "Transfer points 1:1 to leading airline and hotel loyalty programs.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Cell Phone Protection",
        description:
          "Up to $1,000 per claim for cell phone damage or theft when you pay your monthly bill with this card. $100 deductible, 3 claims per 12 months.",
        value: 1000,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Trip Cancellation / Interruption Insurance",
        description:
          "Up to $5,000 per person and $10,000 per trip for pre-paid, non-refundable travel expenses.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Purchase Protection",
        description:
          "Covers new purchases for 120 days against damage or theft up to $10,000 per claim.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Extended Warranty Protection",
        description:
          "Extends the manufacturer warranty by an additional year on eligible purchases.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "No Foreign Transaction Fees",
        description: "No foreign transaction fees on purchases made abroad.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "Employee Cards at No Extra Cost",
        description:
          "Free employee cards to help you earn rewards faster and manage expenses.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
    ],
  },

  // 6. Chase Ink Business Cash
  {
    issuer: "chase",
    name: "Ink Business Cash Credit Card",
    slug: "chase-ink-business-cash",
    network: "visa",
    annual_fee: 0,
    sign_up_bonus: {
      points: 75000,
      spend_requirement: 6000,
      timeframe_months: 3,
    },
    base_earn_rate: {
      points_per_dollar: 1,
      currency: "Ultimate Rewards",
    },
    category_bonuses: [
      {
        category: "online_shopping",
        multiplier: 5,
        cap_amount: 25000,
        cap_period: "calendar_year",
      },
      {
        category: "gas",
        multiplier: 2,
        cap_amount: 25000,
        cap_period: "calendar_year",
      },
      {
        category: "dining",
        multiplier: 2,
        cap_amount: 25000,
        cap_period: "calendar_year",
      },
    ],
    benefits: [
      {
        benefit_type: "perk",
        name: "No Annual Fee",
        description: "No annual fee for the life of the account.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "0% Intro APR",
        description:
          "0% intro APR for 12 months on purchases from date of account opening.",
        value: 0,
        frequency: "one_time",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Purchase Protection",
        description:
          "Covers new purchases for 120 days against damage or theft up to $10,000 per claim.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Extended Warranty Protection",
        description:
          "Extends the manufacturer warranty by an additional year on eligible purchases.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "Employee Cards at No Extra Cost",
        description:
          "Free employee cards to help you earn rewards faster and manage expenses.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
    ],
  },

  // 7. Chase Ink Business Unlimited
  {
    issuer: "chase",
    name: "Ink Business Unlimited Credit Card",
    slug: "chase-ink-business-unlimited",
    network: "visa",
    annual_fee: 0,
    sign_up_bonus: {
      points: 75000,
      spend_requirement: 6000,
      timeframe_months: 3,
    },
    base_earn_rate: {
      points_per_dollar: 1.5,
      currency: "Ultimate Rewards",
    },
    category_bonuses: [],
    benefits: [
      {
        benefit_type: "perk",
        name: "No Annual Fee",
        description: "No annual fee for the life of the account.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "0% Intro APR",
        description:
          "0% intro APR for 12 months on purchases from date of account opening.",
        value: 0,
        frequency: "one_time",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Purchase Protection",
        description:
          "Covers new purchases for 120 days against damage or theft up to $10,000 per claim.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Extended Warranty Protection",
        description:
          "Extends the manufacturer warranty by an additional year on eligible purchases.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "Employee Cards at No Extra Cost",
        description:
          "Free employee cards to help you earn rewards faster and manage expenses.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "No Foreign Transaction Fees",
        description: "No foreign transaction fees on purchases made abroad.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
    ],
  },

  // =========================================================================
  // AMERICAN EXPRESS CARDS (9)
  // =========================================================================

  // 8. American Express Platinum
  {
    issuer: "amex",
    name: "The Platinum Card from American Express",
    slug: "amex-platinum",
    network: "amex",
    annual_fee: 695,
    sign_up_bonus: {
      points: 80000,
      spend_requirement: 8000,
      timeframe_months: 6,
    },
    base_earn_rate: {
      points_per_dollar: 1,
      currency: "Membership Rewards",
    },
    category_bonuses: [
      { category: "airlines", multiplier: 5, cap_amount: null, cap_period: null },
      { category: "hotels", multiplier: 5, cap_amount: null, cap_period: null },
    ],
    benefits: [
      {
        benefit_type: "uber_credit",
        name: "Uber Cash",
        description:
          "$200 in Uber Cash annually: $15 per month plus $20 bonus in December.",
        value: 200,
        frequency: "monthly",
        auto_trigger: true,
        merchant_name: "Uber",
      },
      {
        benefit_type: "airline_credit",
        name: "Airline Fee Credit",
        description:
          "Up to $200 per calendar year in statement credits for incidental fees at one selected qualifying airline.",
        value: 200,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "hotel_credit",
        name: "Hotel Credit",
        description:
          "$200 annual hotel credit when booking prepaid Fine Hotels + Resorts or The Hotel Collection through AmexTravel.com.",
        value: 200,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "lounge_access",
        name: "Centurion Lounge Access",
        description:
          "Access to The Centurion Lounge network. Guests $50 each or free with $75k+ spend in a calendar year.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "lounge_access",
        name: "Priority Pass Select",
        description:
          "Complimentary Priority Pass Select membership for airport lounge access worldwide.",
        value: 429,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "lounge_access",
        name: "Delta Sky Club Access",
        description: "Access to Delta Sky Clubs when flying Delta.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "entertainment_credit",
        name: "Digital Entertainment Credit",
        description:
          "Up to $240 per year ($20/month) in statement credits for eligible digital entertainment subscriptions (Disney+, Hulu, ESPN+, The New York Times, etc.).",
        value: 240,
        frequency: "monthly",
        auto_trigger: true,
      },
      {
        benefit_type: "statement_credit",
        name: "Saks Fifth Avenue Credit",
        description:
          "Up to $100 in Saks Fifth Avenue statement credits annually: $50 January-June, $50 July-December.",
        value: 100,
        frequency: "semi_annual",
        auto_trigger: true,
        merchant_name: "Saks Fifth Avenue",
      },
      {
        benefit_type: "perk",
        name: "Global Entry / TSA PreCheck Credit",
        description: "Up to $100 credit for Global Entry or TSA PreCheck every 4 years.",
        value: 100,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "travel_credit",
        name: "CLEAR Plus Credit",
        description: "Up to $189 per year in statement credits for a CLEAR Plus membership.",
        value: 189,
        frequency: "annual",
        auto_trigger: true,
        merchant_name: "CLEAR",
      },
      {
        benefit_type: "perk",
        name: "Walmart+ Membership",
        description: "Complimentary Walmart+ membership (up to $12.95/month in statement credits).",
        value: 155,
        frequency: "monthly",
        auto_trigger: true,
        merchant_name: "Walmart",
      },
      {
        benefit_type: "hotel_credit",
        name: "Fine Hotels + Resorts",
        description:
          "Elite-like benefits at 1,200+ properties: room upgrade, late checkout, complimentary breakfast, experience credit.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "perk",
        name: "Marriott Bonvoy / Hilton Gold Status",
        description:
          "Complimentary Marriott Bonvoy Gold Elite status and Hilton Honors Gold status.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Car Rental Loss and Damage Insurance",
        description: "Secondary coverage for theft or damage when renting a car.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Trip Cancellation / Interruption Insurance",
        description: "Up to $10,000 per covered trip for pre-paid, non-refundable expenses.",
        value: 0,
        frequency: "annual",
        auto_trigger: true,
      },
    ],
  },

  // 9. American Express Gold
  {
    issuer: "amex",
    name: "American Express Gold Card",
    slug: "amex-gold",
    network: "amex",
    annual_fee: 325,
    sign_up_bonus: { points: 60000, spend_requirement: 6000, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 1, currency: "Membership Rewards" },
    category_bonuses: [
      { category: "dining", multiplier: 4, cap_amount: null, cap_period: null },
      { category: "groceries", multiplier: 4, cap_amount: 25000, cap_period: "calendar_year" },
      { category: "airlines", multiplier: 3, cap_amount: null, cap_period: null },
    ],
    benefits: [
      {
        benefit_type: "uber_credit",
        name: "Uber Cash",
        description: "$120 in Uber Cash annually: $10 per month in Uber Cash for Uber Eats orders or Uber rides.",
        value: 120, frequency: "monthly", auto_trigger: true, merchant_name: "Uber",
      },
      {
        benefit_type: "dining_credit",
        name: "Dining Credit",
        description: "$120 in dining credits annually: $10 per month at participating partners including Grubhub, The Cheesecake Factory, Goldbelly, Wine.com, Milk Bar, and select Shake Shack locations.",
        value: 120, frequency: "monthly", auto_trigger: true,
      },
      {
        benefit_type: "statement_credit",
        name: "Dunkin' Credit",
        description: "Up to $7 in monthly statement credits at Dunkin'.",
        value: 84, frequency: "monthly", auto_trigger: true, merchant_name: "Dunkin'",
      },
      {
        benefit_type: "perk",
        name: "Marriott Bonvoy / Hilton Gold Status",
        description: "Complimentary Hilton Honors Gold status.",
        value: 0, frequency: "annual", auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Purchase Protection",
        description: "Coverage for eligible purchases against accidental damage and theft for up to 90 days, up to $10,000 per occurrence.",
        value: 0, frequency: "annual", auto_trigger: true,
      },
      {
        benefit_type: "insurance",
        name: "Return Protection",
        description: "Return eligible items within 90 days for up to $300 per item if the merchant won't accept the return.",
        value: 0, frequency: "annual", auto_trigger: true,
      },
    ],
  },

  // 10. American Express Green
  {
    issuer: "amex",
    name: "American Express Green Card",
    slug: "amex-green",
    network: "amex",
    annual_fee: 150,
    sign_up_bonus: { points: 40000, spend_requirement: 3000, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 1, currency: "Membership Rewards" },
    category_bonuses: [
      { category: "travel", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "transit", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "dining", multiplier: 3, cap_amount: null, cap_period: null },
    ],
    benefits: [
      {
        benefit_type: "lounge_access", name: "LoungeBuddy Credit",
        description: "Up to $100 per year in LoungeBuddy credits for airport lounge access.",
        value: 100, frequency: "annual", auto_trigger: false,
      },
      {
        benefit_type: "travel_credit", name: "CLEAR Plus Credit",
        description: "Up to $189 per year in statement credits for a CLEAR Plus membership.",
        value: 189, frequency: "annual", auto_trigger: true, merchant_name: "CLEAR",
      },
      {
        benefit_type: "perk", name: "Global Entry / TSA PreCheck Credit",
        description: "Up to $100 credit for Global Entry or TSA PreCheck application fee.",
        value: 100, frequency: "annual", auto_trigger: true,
      },
      {
        benefit_type: "insurance", name: "Car Rental Loss and Damage Insurance",
        description: "Secondary coverage for theft or damage when renting a car.",
        value: 0, frequency: "annual", auto_trigger: true,
      },
      {
        benefit_type: "insurance", name: "Trip Cancellation / Interruption Insurance",
        description: "Coverage for pre-paid, non-refundable trip expenses.",
        value: 0, frequency: "annual", auto_trigger: true,
      },
      {
        benefit_type: "insurance", name: "Baggage Insurance Plan",
        description: "Coverage for lost, damaged, or stolen baggage when the entire fare is charged to the card.",
        value: 0, frequency: "annual", auto_trigger: true,
      },
    ],
  },

  // 11. American Express Blue Cash Preferred
  {
    issuer: "amex",
    name: "Blue Cash Preferred Card from American Express",
    slug: "amex-blue-cash-preferred",
    network: "amex",
    annual_fee: 0,
    sign_up_bonus: { points: 25000, spend_requirement: 3000, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 1, currency: "Cash Back" },
    category_bonuses: [
      { category: "groceries", multiplier: 6, cap_amount: 6000, cap_period: "calendar_year" },
      { category: "streaming", multiplier: 6, cap_amount: null, cap_period: null },
      { category: "transit", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "gas", multiplier: 3, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee (previously $95, changed to $0).", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "0% Intro APR", description: "0% intro APR for 12 months on purchases and balance transfers from date of account opening.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "insurance", name: "Return Protection", description: "Return eligible items within 90 days for up to $300 per item if the merchant won't accept the return.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Purchase Protection", description: "Coverage for eligible purchases against accidental damage or theft for up to 90 days.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Car Rental Loss and Damage Insurance", description: "Secondary car rental insurance when you decline the rental company's collision damage waiver.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "entertainment_credit", name: "Disney Bundle Credit", description: "Up to $7 per month in statement credits for an eligible Disney Bundle subscription.", value: 84, frequency: "monthly", auto_trigger: true, merchant_name: "Disney" },
    ],
  },

  // 12. American Express Blue Cash Everyday
  {
    issuer: "amex",
    name: "Blue Cash Everyday Card from American Express",
    slug: "amex-blue-cash-everyday",
    network: "amex",
    annual_fee: 0,
    sign_up_bonus: { points: 20000, spend_requirement: 2000, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 1, currency: "Cash Back" },
    category_bonuses: [
      { category: "groceries", multiplier: 3, cap_amount: 6000, cap_period: "calendar_year" },
      { category: "online_shopping", multiplier: 3, cap_amount: 6000, cap_period: "calendar_year" },
      { category: "gas", multiplier: 3, cap_amount: 6000, cap_period: "calendar_year" },
    ],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "0% Intro APR", description: "0% intro APR for 15 months on purchases and balance transfers from date of account opening.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "insurance", name: "Car Rental Loss and Damage Insurance", description: "Secondary car rental insurance when you decline the rental company's collision damage waiver.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Purchase Protection", description: "Coverage for eligible purchases against accidental damage or theft for up to 90 days.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Return Protection", description: "Return eligible items within 90 days for up to $300 per item if the merchant won't accept the return.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 13. Amex Delta SkyMiles Gold
  {
    issuer: "amex",
    name: "Delta SkyMiles Gold American Express Card",
    slug: "amex-delta-skymiles-gold",
    network: "amex",
    annual_fee: 150,
    sign_up_bonus: { points: 70000, spend_requirement: 3000, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 1, currency: "Delta SkyMiles" },
    category_bonuses: [
      { category: "airlines", multiplier: 2, cap_amount: null, cap_period: null },
      { category: "dining", multiplier: 2, cap_amount: null, cap_period: null },
      { category: "groceries", multiplier: 2, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "perk", name: "First Checked Bag Free on Delta", description: "First checked bag free on Delta flights for you and up to 8 companions on the same reservation.", value: 60, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Priority Boarding on Delta", description: "Priority boarding on Delta flights with Main Cabin priority.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "20% Back on Delta In-Flight Purchases", description: "20% back as statement credit on eligible Delta in-flight purchases including food, beverages, and Wi-Fi.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Car Rental Loss and Damage Insurance", description: "Secondary coverage for theft or damage when renting a car.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 14. Amex Delta SkyMiles Platinum
  {
    issuer: "amex",
    name: "Delta SkyMiles Platinum American Express Card",
    slug: "amex-delta-skymiles-platinum",
    network: "amex",
    annual_fee: 350,
    sign_up_bonus: { points: 90000, spend_requirement: 4000, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 1, currency: "Delta SkyMiles" },
    category_bonuses: [
      { category: "airlines", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "hotels", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "dining", multiplier: 2, cap_amount: null, cap_period: null },
      { category: "groceries", multiplier: 2, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "perk", name: "First Checked Bag Free on Delta", description: "First checked bag free on Delta flights for you and up to 8 companions on the same reservation.", value: 60, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Companion Certificate", description: "Domestic Main Cabin round-trip companion certificate each year after spending $10,000 in purchases.", value: 300, frequency: "annual", auto_trigger: false },
      { benefit_type: "lounge_access", name: "Delta Sky Club Access", description: "Access to Delta Sky Clubs when flying on a same-day Delta-marketed or Delta-operated flight.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Priority Boarding on Delta", description: "Priority boarding on Delta flights.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Global Entry / TSA PreCheck Credit", description: "Up to $100 credit for Global Entry or TSA PreCheck fee every 4.5 years.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "20% Back on Delta In-Flight Purchases", description: "20% back as statement credit on eligible Delta in-flight purchases.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Car Rental Loss and Damage Insurance", description: "Secondary coverage for theft or damage when renting a car.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 15. Amex Hilton Honors
  {
    issuer: "amex",
    name: "Hilton Honors American Express Card",
    slug: "amex-hilton-honors",
    network: "amex",
    annual_fee: 0,
    sign_up_bonus: { points: 80000, spend_requirement: 2000, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 3, currency: "Hilton Honors" },
    category_bonuses: [
      { category: "hotels", multiplier: 7, cap_amount: null, cap_period: null },
      { category: "dining", multiplier: 5, cap_amount: null, cap_period: null },
      { category: "groceries", multiplier: 5, cap_amount: null, cap_period: null },
      { category: "gas", multiplier: 5, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Hilton Honors Silver Status", description: "Complimentary Hilton Honors Silver status with benefits like a 5th night free on reward stays.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Car Rental Loss and Damage Insurance", description: "Secondary coverage for theft or damage when renting a car.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Purchase Protection", description: "Coverage for eligible purchases against accidental damage or theft for up to 90 days.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 16. Amex Marriott Bonvoy Brilliant
  {
    issuer: "amex",
    name: "Marriott Bonvoy Brilliant American Express Card",
    slug: "amex-marriott-bonvoy-brilliant",
    network: "amex",
    annual_fee: 650,
    sign_up_bonus: { points: 95000, spend_requirement: 6000, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 2, currency: "Marriott Bonvoy" },
    category_bonuses: [
      { category: "hotels", multiplier: 6, cap_amount: null, cap_period: null },
      { category: "airlines", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "dining", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "groceries", multiplier: 3, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "hotel_credit", name: "Marriott Hotel Credit", description: "Up to $300 per year in statement credits for eligible purchases at hotels participating in Marriott Bonvoy.", value: 300, frequency: "annual", auto_trigger: true },
      { benefit_type: "dining_credit", name: "Monthly Dining Credit", description: "$25 per month in dining credits at eligible restaurants worldwide.", value: 300, frequency: "monthly", auto_trigger: true },
      { benefit_type: "perk", name: "Marriott Bonvoy Platinum Elite Status", description: "Complimentary Marriott Bonvoy Platinum Elite status with room upgrades, lounge access, and late checkout.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Free Night Award", description: "One free night award each account anniversary (value up to 85,000 points).", value: 500, frequency: "annual", auto_trigger: true },
      { benefit_type: "lounge_access", name: "Priority Pass Select", description: "Complimentary Priority Pass Select membership for unlimited lounge visits.", value: 429, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Global Entry / TSA PreCheck Credit", description: "Up to $100 credit for Global Entry or TSA PreCheck application fee.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Trip Cancellation / Interruption Insurance", description: "Up to $10,000 per covered trip for pre-paid, non-refundable expenses.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Car Rental Loss and Damage Insurance", description: "Secondary coverage for theft or damage when renting a car.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // =========================================================================
  // CAPITAL ONE CARDS (4)
  // =========================================================================

  // 17. Capital One Venture X
  {
    issuer: "capital_one",
    name: "Capital One Venture X Rewards Credit Card",
    slug: "capital-one-venture-x",
    network: "visa",
    annual_fee: 395,
    sign_up_bonus: { points: 75000, spend_requirement: 4000, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 2, currency: "Capital One Miles" },
    category_bonuses: [
      { category: "hotels", multiplier: 10, cap_amount: null, cap_period: null },
      { category: "car_rental", multiplier: 10, cap_amount: null, cap_period: null },
      { category: "airlines", multiplier: 5, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "travel_credit", name: "Annual Travel Credit", description: "$300 annual travel credit for bookings made through Capital One Travel.", value: 300, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Anniversary Bonus Miles", description: "10,000 bonus miles on each account anniversary (worth $100 in travel).", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "lounge_access", name: "Capital One Lounge Access", description: "Unlimited complimentary access to Capital One Lounges for cardholder and 2 guests.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "lounge_access", name: "Priority Pass Membership", description: "Complimentary Priority Pass membership with unlimited lounge visits. Guests at $39 per person.", value: 429, frequency: "annual", auto_trigger: true },
      { benefit_type: "lounge_access", name: "Plaza Premium Lounge Access", description: "Complimentary access to Plaza Premium Lounges worldwide.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Global Entry / TSA PreCheck Credit", description: "Up to $100 credit for Global Entry or TSA PreCheck every 4 years.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Hertz President's Circle Status", description: "Complimentary Hertz President's Circle status for car rentals.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Primary Car Rental Insurance", description: "Primary collision damage waiver for rental cars.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Trip Cancellation / Interruption Insurance", description: "Up to $2,000 per person and $10,000 per trip for pre-paid, non-refundable expenses.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Cell Phone Protection", description: "Up to $800 per claim for damage or theft when you pay your monthly bill with this card. $50 deductible, 2 claims per 12 months.", value: 800, frequency: "annual", auto_trigger: true },
    ],
  },

  // 18. Capital One Venture
  {
    issuer: "capital_one",
    name: "Capital One Venture Rewards Credit Card",
    slug: "capital-one-venture",
    network: "visa",
    annual_fee: 95,
    sign_up_bonus: { points: 75000, spend_requirement: 4000, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 2, currency: "Capital One Miles" },
    category_bonuses: [
      { category: "hotels", multiplier: 5, cap_amount: null, cap_period: null },
      { category: "car_rental", multiplier: 5, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "perk", name: "Global Entry / TSA PreCheck Credit", description: "Up to $100 credit for Global Entry or TSA PreCheck every 4 years.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Transfer Partners", description: "Transfer miles to 15+ airline and hotel loyalty programs, often at a 1:1 ratio.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Travel Accident Insurance", description: "Coverage for accidental death or dismemberment during covered trips.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Auto Rental Collision Damage Waiver", description: "Secondary coverage for damage or theft of rental vehicles.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 19. Capital One SavorOne
  {
    issuer: "capital_one",
    name: "Capital One SavorOne Cash Rewards Credit Card",
    slug: "capital-one-savorone",
    network: "visa",
    annual_fee: 0,
    sign_up_bonus: { points: 20000, spend_requirement: 500, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 1, currency: "Cash Back" },
    category_bonuses: [
      { category: "dining", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "groceries", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "streaming", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "entertainment", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "hotels", multiplier: 8, cap_amount: null, cap_period: null },
      { category: "car_rental", multiplier: 8, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "0% Intro APR", description: "0% intro APR for 15 months on purchases and balance transfers.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Extended Warranty", description: "Extends the manufacturer warranty by an additional year on eligible purchases.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 20. Capital One Quicksilver
  {
    issuer: "capital_one",
    name: "Capital One Quicksilver Cash Rewards Credit Card",
    slug: "capital-one-quicksilver",
    network: "visa",
    annual_fee: 0,
    sign_up_bonus: { points: 20000, spend_requirement: 500, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 1.5, currency: "Cash Back" },
    category_bonuses: [],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "0% Intro APR", description: "0% intro APR for 15 months on purchases and balance transfers.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Extended Warranty", description: "Extends the manufacturer warranty by an additional year on eligible purchases.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Travel Accident Insurance", description: "Coverage for accidental death or dismemberment during covered trips.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // =========================================================================
  // CITI CARDS (4)
  // =========================================================================

  // 21. Citi Strata Premier
  {
    issuer: "citi",
    name: "Citi Strata Premier Card",
    slug: "citi-strata-premier",
    network: "mastercard",
    annual_fee: 95,
    sign_up_bonus: { points: 75000, spend_requirement: 4000, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 1, currency: "ThankYou Points" },
    category_bonuses: [
      { category: "airlines", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "hotels", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "dining", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "groceries", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "gas", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "transit", multiplier: 3, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "hotel_credit", name: "Annual Hotel Savings Benefit", description: "$100 annual hotel savings on a single hotel booking of $500+ through the Citi Travel portal.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Global Entry / TSA PreCheck Credit", description: "Up to $100 credit for Global Entry or TSA PreCheck application fee.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Transfer Partners", description: "Transfer ThankYou Points to airline and hotel loyalty programs at a 1:1 ratio.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Trip Cancellation / Interruption Protection", description: "Up to $5,000 per trip for pre-paid, non-refundable expenses.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Trip Delay Protection", description: "Coverage for expenses due to trip delay of 3+ hours (up to $500 per trip).", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Baggage Delay Insurance", description: "Up to $500 per trip for essential purchases when bags are delayed 3+ hours.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 22. Citi Double Cash
  {
    issuer: "citi",
    name: "Citi Double Cash Card",
    slug: "citi-double-cash",
    network: "mastercard",
    annual_fee: 0,
    sign_up_bonus: { points: 20000, spend_requirement: 1500, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 2, currency: "ThankYou Points" },
    category_bonuses: [],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "2% on Every Purchase", description: "Earn 2% on every purchase: 1% when you buy + 1% when you pay your statement. Converted to ThankYou Points for transfer partner access when paired with a Strata card.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "0% Intro APR on Balance Transfers", description: "0% intro APR for 18 months on balance transfers.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "insurance", name: "Citi Entertainment", description: "Access to presale tickets and preferred seating for concerts, sports, and dining experiences.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 23. Citi Custom Cash
  {
    issuer: "citi",
    name: "Citi Custom Cash Card",
    slug: "citi-custom-cash",
    network: "mastercard",
    annual_fee: 0,
    sign_up_bonus: { points: 20000, spend_requirement: 1500, timeframe_months: 6 },
    base_earn_rate: { points_per_dollar: 1, currency: "ThankYou Points" },
    category_bonuses: [
      { category: "dining", multiplier: 5, cap_amount: 500, cap_period: "monthly" },
      { category: "groceries", multiplier: 5, cap_amount: 500, cap_period: "monthly" },
      { category: "gas", multiplier: 5, cap_amount: 500, cap_period: "monthly" },
      { category: "travel", multiplier: 5, cap_amount: 500, cap_period: "monthly" },
      { category: "transit", multiplier: 5, cap_amount: 500, cap_period: "monthly" },
      { category: "streaming", multiplier: 5, cap_amount: 500, cap_period: "monthly" },
      { category: "drugstores", multiplier: 5, cap_amount: 500, cap_period: "monthly" },
      { category: "home_improvement", multiplier: 5, cap_amount: 500, cap_period: "monthly" },
    ],
    benefits: [
      { benefit_type: "perk", name: "Auto Top Category", description: "Automatically earns 5% cash back on your top eligible spend category each billing cycle, up to $500 in purchases. No activation needed.", value: 0, frequency: "monthly", auto_trigger: true },
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "0% Intro APR", description: "0% intro APR for 15 months on purchases and balance transfers.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "insurance", name: "Citi Entertainment", description: "Access to presale tickets and preferred seating for concerts, sports, and dining experiences.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 24. Citi Premier
  {
    issuer: "citi",
    name: "Citi Premier Card",
    slug: "citi-premier",
    network: "mastercard",
    annual_fee: 95,
    sign_up_bonus: { points: 60000, spend_requirement: 4000, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 1, currency: "ThankYou Points" },
    category_bonuses: [
      { category: "airlines", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "hotels", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "dining", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "groceries", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "gas", multiplier: 3, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "hotel_credit", name: "Annual Hotel Savings Benefit", description: "$100 annual hotel savings on a single hotel booking of $500+ through the Citi Travel portal.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Transfer Partners", description: "Transfer ThankYou Points 1:1 to airline and hotel loyalty programs.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Trip Cancellation / Interruption Protection", description: "Up to $5,000 per trip for pre-paid, non-refundable expenses.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Trip Delay Protection", description: "Coverage for expenses due to trip delay of 3+ hours.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Baggage Delay Insurance", description: "Coverage for essential purchases when bags are delayed 3+ hours.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // =========================================================================
  // WELLS FARGO CARDS (2)
  // =========================================================================

  // 25. Wells Fargo Active Cash
  {
    issuer: "wells_fargo",
    name: "Wells Fargo Active Cash Card",
    slug: "wells-fargo-active-cash",
    network: "visa",
    annual_fee: 0,
    sign_up_bonus: { points: 20000, spend_requirement: 500, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 2, currency: "Cash Back" },
    category_bonuses: [],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "0% Intro APR", description: "0% intro APR for 15 months on purchases and qualifying balance transfers.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "insurance", name: "Cell Phone Protection", description: "Up to $600 per claim for cell phone damage or theft when you pay your monthly bill with this card. $25 deductible, 2 claims per 12 months.", value: 600, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Visa Signature Benefits", description: "Visa Signature benefits including concierge service, extended warranty, and purchase protection.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 26. Wells Fargo Autograph
  {
    issuer: "wells_fargo",
    name: "Wells Fargo Autograph Card",
    slug: "wells-fargo-autograph",
    network: "visa",
    annual_fee: 0,
    sign_up_bonus: { points: 20000, spend_requirement: 1000, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 1, currency: "Cash Back" },
    category_bonuses: [
      { category: "dining", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "travel", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "gas", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "transit", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "streaming", multiplier: 3, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "0% Intro APR", description: "0% intro APR for 12 months on purchases and qualifying balance transfers.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "insurance", name: "Cell Phone Protection", description: "Up to $600 per claim for cell phone damage or theft when you pay your monthly bill with this card. $25 deductible, 2 claims per 12 months.", value: 600, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // =========================================================================
  // US BANK CARDS (2)
  // =========================================================================

  // 27. US Bank Altitude Reserve
  {
    issuer: "us_bank",
    name: "U.S. Bank Altitude Reserve Visa Infinite Card",
    slug: "us-bank-altitude-reserve",
    network: "visa",
    annual_fee: 400,
    sign_up_bonus: { points: 50000, spend_requirement: 4500, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 1, currency: "Cash Back" },
    category_bonuses: [
      { category: "travel", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "dining", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "gas", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "transit", multiplier: 3, cap_amount: null, cap_period: null },
      { category: "streaming", multiplier: 3, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "travel_credit", name: "Annual Travel & Dining Credit", description: "$325 annual credit for purchases on eligible travel and dining.", value: 325, frequency: "annual", auto_trigger: true },
      { benefit_type: "lounge_access", name: "Priority Pass Select", description: "Complimentary Priority Pass Select membership with unlimited lounge visits.", value: 429, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Points Worth 50% More for Travel", description: "Points are worth 50% more when redeemed for travel through the Real-Time Rewards program.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Global Entry / TSA PreCheck Credit", description: "Up to $100 credit for Global Entry or TSA PreCheck application fee every 4 years.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Primary Car Rental Insurance", description: "Primary auto rental collision damage waiver for rentals.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Trip Cancellation / Interruption Insurance", description: "Coverage for pre-paid, non-refundable trip expenses.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Cell Phone Protection", description: "Up to $600 per claim for cell phone damage or theft when you pay your monthly bill with this card. $25 deductible, 2 claims per 12 months.", value: 600, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 28. US Bank Cash+
  {
    issuer: "us_bank",
    name: "U.S. Bank Cash+ Visa Signature Card",
    slug: "us-bank-cash-plus",
    network: "visa",
    annual_fee: 0,
    sign_up_bonus: { points: 20000, spend_requirement: 1000, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 1, currency: "Cash Back" },
    category_bonuses: [
      { category: "home_improvement", multiplier: 5, cap_amount: 2000, cap_period: "quarterly" },
      { category: "gas", multiplier: 5, cap_amount: 2000, cap_period: "quarterly" },
      { category: "streaming", multiplier: 5, cap_amount: 2000, cap_period: "quarterly" },
      { category: "groceries", multiplier: 2, cap_amount: null, cap_period: null },
      { category: "dining", multiplier: 2, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Choose Your Categories", description: "Choose two categories earning 5% (up to $2,000/quarter combined) and one everyday category earning 2%. Categories can be changed each quarter.", value: 0, frequency: "quarterly", auto_trigger: false },
      { benefit_type: "perk", name: "0% Intro APR", description: "0% intro APR for 15 months on purchases and balance transfers.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "insurance", name: "Purchase Protection", description: "Coverage for eligible purchases against accidental damage or theft for up to 90 days.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Extended Warranty", description: "Extends the manufacturer warranty by an additional year on eligible purchases.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // =========================================================================
  // BANK OF AMERICA CARDS (2)
  // =========================================================================

  // 29. Bank of America Premium Rewards
  {
    issuer: "bank_of_america",
    name: "Bank of America Premium Rewards Credit Card",
    slug: "boa-premium-rewards",
    network: "visa",
    annual_fee: 95,
    sign_up_bonus: { points: 60000, spend_requirement: 4000, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 1.5, currency: "Cash Back" },
    category_bonuses: [
      { category: "dining", multiplier: 2, cap_amount: null, cap_period: null },
      { category: "travel", multiplier: 2, cap_amount: null, cap_period: null },
    ],
    benefits: [
      { benefit_type: "travel_credit", name: "Airline Incidental Statement Credit", description: "Up to $100 per year in statement credits for incidental travel expenses like airline fees.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Global Entry / TSA PreCheck Credit", description: "Up to $100 credit for Global Entry or TSA PreCheck application fee every 4 years.", value: 100, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Preferred Rewards Boost", description: "Preferred Rewards members earn 25-75% more points on every purchase depending on tier.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "No Foreign Transaction Fees", description: "No foreign transaction fees on purchases made abroad.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Trip Cancellation / Interruption Insurance", description: "Up to $5,000 per trip for pre-paid, non-refundable expenses.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Trip Delay Reimbursement", description: "Up to $500 per trip for eligible expenses when your trip is delayed by 12+ hours.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Purchase Protection", description: "Coverage for eligible purchases against damage or theft for 90 days.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Extended Warranty", description: "Extends the manufacturer warranty by an additional year on eligible purchases.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },

  // 30. Bank of America Customized Cash Rewards
  {
    issuer: "bank_of_america",
    name: "Bank of America Customized Cash Rewards Credit Card",
    slug: "boa-customized-cash",
    network: "visa",
    annual_fee: 0,
    sign_up_bonus: { points: 20000, spend_requirement: 1000, timeframe_months: 3 },
    base_earn_rate: { points_per_dollar: 1, currency: "Cash Back" },
    category_bonuses: [
      { category: "gas", multiplier: 3, cap_amount: 2500, cap_period: "quarterly" },
      { category: "online_shopping", multiplier: 3, cap_amount: 2500, cap_period: "quarterly" },
      { category: "dining", multiplier: 3, cap_amount: 2500, cap_period: "quarterly" },
      { category: "travel", multiplier: 3, cap_amount: 2500, cap_period: "quarterly" },
      { category: "drugstores", multiplier: 3, cap_amount: 2500, cap_period: "quarterly" },
      { category: "home_improvement", multiplier: 3, cap_amount: 2500, cap_period: "quarterly" },
      { category: "groceries", multiplier: 2, cap_amount: 2500, cap_period: "quarterly" },
    ],
    benefits: [
      { benefit_type: "perk", name: "No Annual Fee", description: "No annual fee.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "Choose Your 3% Category", description: "Choose one category to earn 3% cash back on up to $2,500 in combined purchases per quarter. Categories include gas, online shopping, dining, travel, drug stores, and home improvement/furnishings.", value: 0, frequency: "quarterly", auto_trigger: false },
      { benefit_type: "perk", name: "Preferred Rewards Boost", description: "Preferred Rewards members earn 25-75% more cash back on every purchase depending on tier.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "perk", name: "0% Intro APR", description: "0% intro APR for 15 billing cycles on purchases and balance transfers made within 60 days.", value: 0, frequency: "one_time", auto_trigger: true },
      { benefit_type: "insurance", name: "Purchase Protection", description: "Coverage for eligible purchases against damage or theft for 90 days.", value: 0, frequency: "annual", auto_trigger: true },
      { benefit_type: "insurance", name: "Extended Warranty", description: "Extends the manufacturer warranty by an additional year on eligible purchases.", value: 0, frequency: "annual", auto_trigger: true },
    ],
  },
];

export default cards;
