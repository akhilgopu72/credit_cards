// CardMax Merchant Seed Data
// Comprehensive merchant directory for spend categorization and card recommendation.
// MCC codes are based on ISO 18245 standard where known.

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type MerchantCategory =
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
  | "general"
  | "department_store"
  | "electronics"
  | "clothing"
  | "fitness"
  | "telecom"
  | "insurance"
  | "utilities"
  | "pet"
  | "subscription";

export interface Merchant {
  name: string;
  slug: string;
  category: MerchantCategory;
  mcc_codes: string[];
  website_domain: string;
  aliases: string[];
}

// ---------------------------------------------------------------------------
// Merchant Seed Data
// ---------------------------------------------------------------------------

export const merchants: Merchant[] = [
  // =========================================================================
  // DINING (11)
  // =========================================================================

  {
    name: "McDonald's",
    slug: "mcdonalds",
    category: "dining",
    mcc_codes: ["5812", "5814"],
    website_domain: "mcdonalds.com",
    aliases: ["McD", "Mickey D's", "MCD"],
  },
  {
    name: "Starbucks",
    slug: "starbucks",
    category: "dining",
    mcc_codes: ["5812", "5814"],
    website_domain: "starbucks.com",
    aliases: ["Sbux", "Starbucks Coffee"],
  },
  {
    name: "Chipotle",
    slug: "chipotle",
    category: "dining",
    mcc_codes: ["5812"],
    website_domain: "chipotle.com",
    aliases: ["Chipotle Mexican Grill", "CMG"],
  },
  {
    name: "Chick-fil-A",
    slug: "chick-fil-a",
    category: "dining",
    mcc_codes: ["5812", "5814"],
    website_domain: "chick-fil-a.com",
    aliases: ["CFA", "Chickfila", "Chic-fil-A"],
  },
  {
    name: "Domino's",
    slug: "dominos",
    category: "dining",
    mcc_codes: ["5812", "5814"],
    website_domain: "dominos.com",
    aliases: ["Domino's Pizza", "Dominos Pizza"],
  },
  {
    name: "Panera Bread",
    slug: "panera-bread",
    category: "dining",
    mcc_codes: ["5812", "5814"],
    website_domain: "panerabread.com",
    aliases: ["Panera", "Panera Cafe"],
  },
  {
    name: "Subway",
    slug: "subway",
    category: "dining",
    mcc_codes: ["5812", "5814"],
    website_domain: "subway.com",
    aliases: ["Subway Sandwiches"],
  },
  {
    name: "Olive Garden",
    slug: "olive-garden",
    category: "dining",
    mcc_codes: ["5812"],
    website_domain: "olivegarden.com",
    aliases: ["OG", "Olive Garden Italian Restaurant"],
  },
  {
    name: "DoorDash",
    slug: "doordash",
    category: "dining",
    mcc_codes: ["5812", "5811"],
    website_domain: "doordash.com",
    aliases: ["Door Dash", "DashPass"],
  },
  {
    name: "Uber Eats",
    slug: "uber-eats",
    category: "dining",
    mcc_codes: ["5812"],
    website_domain: "ubereats.com",
    aliases: ["UberEats", "Uber Eats Delivery"],
  },
  {
    name: "Grubhub",
    slug: "grubhub",
    category: "dining",
    mcc_codes: ["5812"],
    website_domain: "grubhub.com",
    aliases: ["Grub Hub", "Seamless"],
  },

  // =========================================================================
  // GROCERIES (9)
  // =========================================================================

  {
    name: "Walmart",
    slug: "walmart",
    category: "groceries",
    mcc_codes: ["5411", "5311"],
    website_domain: "walmart.com",
    aliases: ["Wal-Mart", "Walmart Supercenter", "Walmart Neighborhood Market"],
  },
  {
    name: "Costco",
    slug: "costco",
    category: "groceries",
    mcc_codes: ["5300", "5411"],
    website_domain: "costco.com",
    aliases: ["Costco Wholesale", "Costco.com"],
  },
  {
    name: "Target",
    slug: "target",
    category: "groceries",
    mcc_codes: ["5311", "5411"],
    website_domain: "target.com",
    aliases: ["Target Store", "SuperTarget", "Target.com"],
  },
  {
    name: "Whole Foods",
    slug: "whole-foods",
    category: "groceries",
    mcc_codes: ["5411"],
    website_domain: "wholefoodsmarket.com",
    aliases: ["Whole Foods Market", "WFM", "Amazon Whole Foods"],
  },
  {
    name: "Trader Joe's",
    slug: "trader-joes",
    category: "groceries",
    mcc_codes: ["5411"],
    website_domain: "traderjoes.com",
    aliases: ["Trader Joes", "TJ's", "TJs"],
  },
  {
    name: "Kroger",
    slug: "kroger",
    category: "groceries",
    mcc_codes: ["5411"],
    website_domain: "kroger.com",
    aliases: ["Kroger Grocery", "Kroger Marketplace", "Fred Meyer", "Ralphs"],
  },
  {
    name: "Safeway",
    slug: "safeway",
    category: "groceries",
    mcc_codes: ["5411"],
    website_domain: "safeway.com",
    aliases: ["Safeway Grocery", "Albertsons", "Vons"],
  },
  {
    name: "Aldi",
    slug: "aldi",
    category: "groceries",
    mcc_codes: ["5411"],
    website_domain: "aldi.us",
    aliases: ["ALDI", "Aldi Foods"],
  },
  {
    name: "Sam's Club",
    slug: "sams-club",
    category: "groceries",
    mcc_codes: ["5300", "5411"],
    website_domain: "samsclub.com",
    aliases: ["Sam's", "Sams Club", "Sam's Club Wholesale"],
  },

  // =========================================================================
  // GAS (4)
  // =========================================================================

  {
    name: "Shell",
    slug: "shell",
    category: "gas",
    mcc_codes: ["5541", "5542"],
    website_domain: "shell.com",
    aliases: ["Shell Gas", "Shell Oil", "Shell Station"],
  },
  {
    name: "ExxonMobil",
    slug: "exxonmobil",
    category: "gas",
    mcc_codes: ["5541", "5542"],
    website_domain: "exxon.com",
    aliases: ["Exxon", "Mobil", "Exxon Mobil", "Mobil Gas"],
  },
  {
    name: "Chevron",
    slug: "chevron",
    category: "gas",
    mcc_codes: ["5541", "5542"],
    website_domain: "chevron.com",
    aliases: ["Chevron Gas", "Texaco"],
  },
  {
    name: "BP",
    slug: "bp",
    category: "gas",
    mcc_codes: ["5541", "5542"],
    website_domain: "bp.com",
    aliases: ["BP Gas", "British Petroleum", "Amoco"],
  },

  // =========================================================================
  // AIRLINES (6)
  // =========================================================================

  {
    name: "United Airlines",
    slug: "united-airlines",
    category: "airlines",
    mcc_codes: ["3000", "4511"],
    website_domain: "united.com",
    aliases: ["United", "UA", "United Air"],
  },
  {
    name: "Delta Air Lines",
    slug: "delta-air-lines",
    category: "airlines",
    mcc_codes: ["3058", "4511"],
    website_domain: "delta.com",
    aliases: ["Delta", "DL", "Delta Airlines"],
  },
  {
    name: "American Airlines",
    slug: "american-airlines",
    category: "airlines",
    mcc_codes: ["3001", "4511"],
    website_domain: "aa.com",
    aliases: ["AA", "American", "American Air"],
  },
  {
    name: "Southwest Airlines",
    slug: "southwest-airlines",
    category: "airlines",
    mcc_codes: ["3024", "4511"],
    website_domain: "southwest.com",
    aliases: ["Southwest", "SWA", "SW Airlines"],
  },
  {
    name: "JetBlue",
    slug: "jetblue",
    category: "airlines",
    mcc_codes: ["3029", "4511"],
    website_domain: "jetblue.com",
    aliases: ["JetBlue Airways", "B6", "Jet Blue"],
  },

  // =========================================================================
  // TRAVEL (2)
  // =========================================================================

  {
    name: "Expedia",
    slug: "expedia",
    category: "travel",
    mcc_codes: ["4722"],
    website_domain: "expedia.com",
    aliases: ["Expedia.com", "Expedia Travel"],
  },
  {
    name: "Booking.com",
    slug: "booking-com",
    category: "travel",
    mcc_codes: ["4722"],
    website_domain: "booking.com",
    aliases: ["Booking", "Bookingcom"],
  },

  // =========================================================================
  // HOTELS (4)
  // =========================================================================

  {
    name: "Marriott",
    slug: "marriott",
    category: "hotels",
    mcc_codes: ["3501", "7011"],
    website_domain: "marriott.com",
    aliases: [
      "Marriott Hotels",
      "Marriott Bonvoy",
      "Marriott International",
      "Courtyard by Marriott",
      "Westin",
      "Sheraton",
      "W Hotels",
      "Ritz-Carlton",
    ],
  },
  {
    name: "Hilton",
    slug: "hilton",
    category: "hotels",
    mcc_codes: ["3504", "7011"],
    website_domain: "hilton.com",
    aliases: [
      "Hilton Hotels",
      "Hilton Honors",
      "Hampton Inn",
      "DoubleTree",
      "Embassy Suites",
      "Conrad",
      "Waldorf Astoria",
    ],
  },
  {
    name: "Hyatt",
    slug: "hyatt",
    category: "hotels",
    mcc_codes: ["3505", "7011"],
    website_domain: "hyatt.com",
    aliases: [
      "Hyatt Hotels",
      "World of Hyatt",
      "Park Hyatt",
      "Grand Hyatt",
      "Hyatt Regency",
      "Andaz",
    ],
  },
  {
    name: "IHG",
    slug: "ihg",
    category: "hotels",
    mcc_codes: ["3502", "7011"],
    website_domain: "ihg.com",
    aliases: [
      "IHG Hotels",
      "InterContinental",
      "Holiday Inn",
      "Holiday Inn Express",
      "Crowne Plaza",
      "Kimpton",
    ],
  },

  // =========================================================================
  // TRANSIT / RIDESHARE (3)
  // =========================================================================

  {
    name: "Uber",
    slug: "uber",
    category: "transit",
    mcc_codes: ["4121"],
    website_domain: "uber.com",
    aliases: ["Uber Rides", "Uber Technologies"],
  },
  {
    name: "Lyft",
    slug: "lyft",
    category: "transit",
    mcc_codes: ["4121"],
    website_domain: "lyft.com",
    aliases: ["Lyft Rides", "Lyft Inc"],
  },
  {
    name: "Public Transit",
    slug: "public-transit",
    category: "transit",
    mcc_codes: ["4111", "4112", "4131"],
    website_domain: "",
    aliases: [
      "MTA",
      "Metro",
      "Subway",
      "Bus",
      "BART",
      "CTA",
      "WMATA",
      "SEPTA",
      "NJ Transit",
      "Metra",
      "Caltrain",
    ],
  },

  // =========================================================================
  // STREAMING (7)
  // =========================================================================

  {
    name: "Netflix",
    slug: "netflix",
    category: "streaming",
    mcc_codes: ["4899", "5815"],
    website_domain: "netflix.com",
    aliases: ["Netflix Streaming", "Netflix Inc"],
  },
  {
    name: "Spotify",
    slug: "spotify",
    category: "streaming",
    mcc_codes: ["4899", "5815"],
    website_domain: "spotify.com",
    aliases: ["Spotify Premium", "Spotify Music", "Spotify AB"],
  },
  {
    name: "Disney+",
    slug: "disney-plus",
    category: "streaming",
    mcc_codes: ["4899", "5815"],
    website_domain: "disneyplus.com",
    aliases: ["Disney Plus", "DisneyPlus", "Disney+ Streaming"],
  },
  {
    name: "Hulu",
    slug: "hulu",
    category: "streaming",
    mcc_codes: ["4899", "5815"],
    website_domain: "hulu.com",
    aliases: ["Hulu Streaming", "Hulu + Live TV"],
  },
  {
    name: "YouTube Premium",
    slug: "youtube-premium",
    category: "streaming",
    mcc_codes: ["4899", "5815"],
    website_domain: "youtube.com",
    aliases: ["YouTube Music", "YT Premium", "YouTube TV", "Google YouTube"],
  },
  {
    name: "Apple Music",
    slug: "apple-music",
    category: "streaming",
    mcc_codes: ["5815"],
    website_domain: "apple.com/apple-music",
    aliases: ["Apple Music Subscription", "iTunes Music"],
  },
  {
    name: "HBO Max",
    slug: "hbo-max",
    category: "streaming",
    mcc_codes: ["4899", "5815"],
    website_domain: "max.com",
    aliases: ["Max", "HBO", "HBO Max Streaming", "Warner Bros Max"],
  },

  // =========================================================================
  // ONLINE SHOPPING (5)
  // =========================================================================

  {
    name: "Amazon",
    slug: "amazon",
    category: "online_shopping",
    mcc_codes: ["5942", "5999", "5310"],
    website_domain: "amazon.com",
    aliases: [
      "Amazon.com",
      "AMZN",
      "Amazon Prime",
      "Amazon Fresh",
      "Amazon Marketplace",
    ],
  },
  {
    name: "eBay",
    slug: "ebay",
    category: "online_shopping",
    mcc_codes: ["5999"],
    website_domain: "ebay.com",
    aliases: ["eBay.com", "eBay Inc"],
  },
  {
    name: "Etsy",
    slug: "etsy",
    category: "online_shopping",
    mcc_codes: ["5999"],
    website_domain: "etsy.com",
    aliases: ["Etsy.com", "Etsy Inc", "Etsy Marketplace"],
  },
  {
    name: "Best Buy",
    slug: "best-buy",
    category: "electronics",
    mcc_codes: ["5732", "5734"],
    website_domain: "bestbuy.com",
    aliases: ["BestBuy", "Best Buy Electronics", "BBY"],
  },
  {
    name: "Apple",
    slug: "apple",
    category: "electronics",
    mcc_codes: ["5732", "5045"],
    website_domain: "apple.com",
    aliases: [
      "Apple Store",
      "Apple.com",
      "Apple Inc",
      "Apple Retail",
    ],
  },

  // =========================================================================
  // GENERAL RETAIL / HOME IMPROVEMENT / DRUGSTORES (8)
  // =========================================================================

  {
    name: "Home Depot",
    slug: "home-depot",
    category: "home_improvement",
    mcc_codes: ["5200", "5211"],
    website_domain: "homedepot.com",
    aliases: ["The Home Depot", "HomeDepot", "HD"],
  },
  {
    name: "Lowe's",
    slug: "lowes",
    category: "home_improvement",
    mcc_codes: ["5200", "5211"],
    website_domain: "lowes.com",
    aliases: ["Lowes", "Lowe's Home Improvement"],
  },
  {
    name: "CVS",
    slug: "cvs",
    category: "drugstores",
    mcc_codes: ["5912"],
    website_domain: "cvs.com",
    aliases: ["CVS Pharmacy", "CVS Health", "CVS Drugstore"],
  },
  {
    name: "Walgreens",
    slug: "walgreens",
    category: "drugstores",
    mcc_codes: ["5912"],
    website_domain: "walgreens.com",
    aliases: ["Walgreens Pharmacy", "Walgreens Drugstore"],
  },
  {
    name: "Rite Aid",
    slug: "rite-aid",
    category: "drugstores",
    mcc_codes: ["5912"],
    website_domain: "riteaid.com",
    aliases: ["RiteAid", "Rite Aid Pharmacy"],
  },
  {
    name: "Nike",
    slug: "nike",
    category: "clothing",
    mcc_codes: ["5661", "5699"],
    website_domain: "nike.com",
    aliases: ["Nike Store", "Nike.com", "Nike Inc"],
  },
  {
    name: "Nordstrom",
    slug: "nordstrom",
    category: "department_store",
    mcc_codes: ["5311"],
    website_domain: "nordstrom.com",
    aliases: ["Nordstrom Rack", "Nordstrom.com", "Nordy"],
  },
  {
    name: "Macy's",
    slug: "macys",
    category: "department_store",
    mcc_codes: ["5311"],
    website_domain: "macys.com",
    aliases: ["Macys", "Macy's Department Store"],
  },

  // =========================================================================
  // SUBSCRIPTION / TELECOM / OTHER (8)
  // =========================================================================

  {
    name: "Apple Subscriptions",
    slug: "apple-subscriptions",
    category: "subscription",
    mcc_codes: ["5815"],
    website_domain: "apple.com",
    aliases: [
      "Apple TV+",
      "Apple iCloud",
      "Apple Arcade",
      "Apple One",
      "iCloud Storage",
      "Apple News+",
      "Apple Fitness+",
    ],
  },
  {
    name: "Google Services",
    slug: "google-services",
    category: "subscription",
    mcc_codes: ["5815", "4899"],
    website_domain: "google.com",
    aliases: [
      "Google One",
      "Google Cloud",
      "Google Play",
      "Google Workspace",
      "Google Fi",
      "Google Store",
    ],
  },
  {
    name: "T-Mobile",
    slug: "t-mobile",
    category: "telecom",
    mcc_codes: ["4812", "4814"],
    website_domain: "t-mobile.com",
    aliases: ["TMobile", "T Mobile", "T-Mobile US", "Sprint"],
  },
  {
    name: "Verizon",
    slug: "verizon",
    category: "telecom",
    mcc_codes: ["4812", "4814"],
    website_domain: "verizon.com",
    aliases: ["Verizon Wireless", "VZW", "Verizon Communications"],
  },
  {
    name: "AT&T",
    slug: "att",
    category: "telecom",
    mcc_codes: ["4812", "4814"],
    website_domain: "att.com",
    aliases: ["ATT", "AT and T", "AT&T Wireless", "AT&T Mobility"],
  },
  {
    name: "Amazon Prime",
    slug: "amazon-prime",
    category: "subscription",
    mcc_codes: ["5968"],
    website_domain: "amazon.com/prime",
    aliases: [
      "Prime Membership",
      "Amazon Prime Video",
      "Prime Video",
    ],
  },

  // =========================================================================
  // CAR RENTAL (3)
  // =========================================================================

  {
    name: "Hertz",
    slug: "hertz",
    category: "car_rental",
    mcc_codes: ["3351", "7512"],
    website_domain: "hertz.com",
    aliases: ["Hertz Rental", "Hertz Car Rental"],
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    category: "car_rental",
    mcc_codes: ["3386", "7512"],
    website_domain: "enterprise.com",
    aliases: ["Enterprise Rent-A-Car", "Enterprise Car Rental"],
  },
  {
    name: "National Car Rental",
    slug: "national-car-rental",
    category: "car_rental",
    mcc_codes: ["3370", "7512"],
    website_domain: "nationalcar.com",
    aliases: ["National", "National Rental"],
  },

  // =========================================================================
  // ENTERTAINMENT (2)
  // =========================================================================

  {
    name: "AMC Theatres",
    slug: "amc-theatres",
    category: "entertainment",
    mcc_codes: ["7832"],
    website_domain: "amctheatres.com",
    aliases: ["AMC", "AMC Movies", "AMC Entertainment"],
  },
  {
    name: "Ticketmaster",
    slug: "ticketmaster",
    category: "entertainment",
    mcc_codes: ["7922", "7941"],
    website_domain: "ticketmaster.com",
    aliases: ["Ticketmaster.com", "Live Nation", "TM"],
  },

  // =========================================================================
  // FITNESS (2)
  // =========================================================================

  {
    name: "Planet Fitness",
    slug: "planet-fitness",
    category: "fitness",
    mcc_codes: ["7941", "7997"],
    website_domain: "planetfitness.com",
    aliases: ["Planet Fitness Gym", "PF"],
  },
  {
    name: "Peloton",
    slug: "peloton",
    category: "fitness",
    mcc_codes: ["5940", "7997"],
    website_domain: "onepeloton.com",
    aliases: ["Peloton Interactive", "Peloton Membership"],
  },

  // =========================================================================
  // PET (1)
  // =========================================================================

  {
    name: "Petco",
    slug: "petco",
    category: "pet",
    mcc_codes: ["5995"],
    website_domain: "petco.com",
    aliases: ["Petco Animal Supplies", "Petco.com"],
  },

  // =========================================================================
  // UTILITIES (1)
  // =========================================================================

  {
    name: "Comcast Xfinity",
    slug: "comcast-xfinity",
    category: "utilities",
    mcc_codes: ["4899"],
    website_domain: "xfinity.com",
    aliases: ["Xfinity", "Comcast", "Xfinity Internet", "Xfinity Mobile"],
  },
];

export default merchants;
