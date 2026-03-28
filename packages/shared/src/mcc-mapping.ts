// ─── MCC (Merchant Category Code) to SpendCategory Mapping ──────────────────
//
// Maps ISO 18245 MCC codes to CardMax spend categories for card bonus matching.
// MCC codes are 4-digit strings assigned to merchants by payment processors.
//
// This module provides:
//   - getMccCategory()    — look up the SpendCategory for an MCC code
//   - getMccDescription() — human-readable description for an MCC code
//   - getCategoryMccCodes() — reverse lookup: all MCC codes for a category
// ─────────────────────────────────────────────────────────────────────────────

import type { SpendCategory } from "./index";

// ─── MCC Entry ──────────────────────────────────────────────────────────────

export interface MccEntry {
  code: string;
  description: string;
  category: SpendCategory;
}

// ─── Individual MCC Code Definitions ────────────────────────────────────────
//
// Each entry maps a single MCC code to a spend category and description.
// Grouped by category for readability.
// ─────────────────────────────────────────────────────────────────────────────

const MCC_ENTRIES: MccEntry[] = [
  // =========================================================================
  // AIRLINES (3000–3299: specific airline codes, 4511: general air carriers)
  // =========================================================================
  { code: "3000", description: "United Airlines", category: "airlines" },
  { code: "3001", description: "American Airlines", category: "airlines" },
  { code: "3002", description: "Pan American World Airways", category: "airlines" },
  { code: "3003", description: "Eurofly", category: "airlines" },
  { code: "3004", description: "Dragon Air", category: "airlines" },
  { code: "3005", description: "British Airways", category: "airlines" },
  { code: "3006", description: "Japan Airlines", category: "airlines" },
  { code: "3007", description: "Air France", category: "airlines" },
  { code: "3008", description: "Lufthansa", category: "airlines" },
  { code: "3009", description: "Air Canada", category: "airlines" },
  { code: "3010", description: "KLM Royal Dutch Airlines", category: "airlines" },
  { code: "3011", description: "AeroMexico", category: "airlines" },
  { code: "3012", description: "Qantas Airways", category: "airlines" },
  { code: "3013", description: "Alitalia", category: "airlines" },
  { code: "3014", description: "Saudi Arabian Airlines", category: "airlines" },
  { code: "3015", description: "Swiss International Air Lines", category: "airlines" },
  { code: "3016", description: "SAS Scandinavian Airlines", category: "airlines" },
  { code: "3017", description: "South African Airways", category: "airlines" },
  { code: "3018", description: "Varig Airlines", category: "airlines" },
  { code: "3019", description: "Germanwings", category: "airlines" },
  { code: "3020", description: "Air India", category: "airlines" },
  { code: "3021", description: "Air Algerie", category: "airlines" },
  { code: "3022", description: "Philippine Airlines", category: "airlines" },
  { code: "3023", description: "Mexicana Airlines", category: "airlines" },
  { code: "3024", description: "Southwest Airlines", category: "airlines" },
  { code: "3025", description: "Kenya Airways", category: "airlines" },
  { code: "3026", description: "Aerolineas Argentinas", category: "airlines" },
  { code: "3027", description: "UTA/Interair", category: "airlines" },
  { code: "3028", description: "Air Malta", category: "airlines" },
  { code: "3029", description: "JetBlue Airways", category: "airlines" },
  { code: "3030", description: "Air Lanka", category: "airlines" },
  { code: "3031", description: "Cayman Airways", category: "airlines" },
  { code: "3032", description: "Malaysian Airlines", category: "airlines" },
  { code: "3033", description: "Iberia Airlines", category: "airlines" },
  { code: "3034", description: "Icelandair", category: "airlines" },
  { code: "3035", description: "Japan Air System", category: "airlines" },
  { code: "3036", description: "Pakistan International Airlines", category: "airlines" },
  { code: "3037", description: "Aero Lloyd Airlines", category: "airlines" },
  { code: "3038", description: "Alaska Airlines", category: "airlines" },
  { code: "3039", description: "Yugotours", category: "airlines" },
  { code: "3040", description: "China Xinhua Airlines", category: "airlines" },
  { code: "3041", description: "Ansett Airlines", category: "airlines" },
  { code: "3042", description: "Cruzeiro do Sul Airlines", category: "airlines" },
  { code: "3043", description: "Cubana Airlines", category: "airlines" },
  { code: "3044", description: "Gulf Air", category: "airlines" },
  { code: "3045", description: "China National Aviation", category: "airlines" },
  { code: "3046", description: "Hawaiian Airlines", category: "airlines" },
  { code: "3047", description: "Avianca Airlines", category: "airlines" },
  { code: "3048", description: "Copa Airlines", category: "airlines" },
  { code: "3049", description: "Wien Air Alaska", category: "airlines" },
  { code: "3050", description: "Kenya Airways", category: "airlines" },
  { code: "3051", description: "Austrian Airlines", category: "airlines" },
  { code: "3052", description: "Laker Airways", category: "airlines" },
  { code: "3053", description: "AVIACO Airlines", category: "airlines" },
  { code: "3054", description: "LADECO Airlines", category: "airlines" },
  { code: "3055", description: "LAB Airlines", category: "airlines" },
  { code: "3056", description: "Finnair", category: "airlines" },
  { code: "3057", description: "Aer Lingus", category: "airlines" },
  { code: "3058", description: "Delta Air Lines", category: "airlines" },
  { code: "3059", description: "Emirates Airlines", category: "airlines" },
  { code: "3060", description: "Northwest Airlines", category: "airlines" },
  { code: "3061", description: "US Airways", category: "airlines" },
  { code: "3062", description: "AirCal", category: "airlines" },
  { code: "3063", description: "Cathay Pacific Airlines", category: "airlines" },
  { code: "3064", description: "EVA Air", category: "airlines" },
  { code: "3065", description: "Air New Zealand", category: "airlines" },
  { code: "3066", description: "Air Inter", category: "airlines" },
  { code: "3067", description: "Turkey Airlines", category: "airlines" },
  { code: "3068", description: "Royal Air Maroc", category: "airlines" },
  { code: "3069", description: "Tunis Air", category: "airlines" },
  { code: "3070", description: "Faucett Peru Airlines", category: "airlines" },
  { code: "3071", description: "Aeropostal Airlines", category: "airlines" },
  { code: "3072", description: "TAP Air Portugal", category: "airlines" },
  { code: "3073", description: "Ethiopian Airlines", category: "airlines" },
  { code: "3074", description: "TACA International Airlines", category: "airlines" },
  { code: "3075", description: "Singapore Airlines", category: "airlines" },
  { code: "3076", description: "Aeronaves de Mexico", category: "airlines" },
  { code: "3077", description: "El Al Israel Airlines", category: "airlines" },
  { code: "3078", description: "Korean Air", category: "airlines" },
  { code: "3079", description: "Viasa Airlines", category: "airlines" },
  { code: "3080", description: "Virgin Atlantic", category: "airlines" },
  { code: "3081", description: "Tarom Romanian Airlines", category: "airlines" },
  { code: "3082", description: "Thai Airways International", category: "airlines" },
  { code: "3083", description: "China Airlines", category: "airlines" },
  { code: "3084", description: "Garuda Indonesia", category: "airlines" },
  { code: "3085", description: "Middle East Airlines", category: "airlines" },
  { code: "3086", description: "Vietnam Airlines", category: "airlines" },
  { code: "3087", description: "AirBorne Express", category: "airlines" },
  { code: "3088", description: "Ukraine International Airlines", category: "airlines" },
  { code: "3089", description: "Titan Airways", category: "airlines" },
  { code: "3090", description: "Czech Airlines", category: "airlines" },
  { code: "3091", description: "Lot Polish Airlines", category: "airlines" },
  { code: "3092", description: "Malev Hungarian Airlines", category: "airlines" },
  { code: "3093", description: "Balkan Bulgarian Airlines", category: "airlines" },
  { code: "3094", description: "Azerbaijan Hava Yollary", category: "airlines" },
  { code: "3095", description: "Aerosvit Airlines", category: "airlines" },
  { code: "3096", description: "Asiana Airlines", category: "airlines" },
  { code: "3097", description: "Spirit Airlines", category: "airlines" },
  { code: "3098", description: "Frontier Airlines", category: "airlines" },
  { code: "3099", description: "Sun Country Airlines", category: "airlines" },
  { code: "3100", description: "Cathay Pacific", category: "airlines" },
  { code: "3101", description: "Allegiant Air", category: "airlines" },
  { code: "3102", description: "Vivaaerobus", category: "airlines" },
  { code: "3103", description: "Volaris", category: "airlines" },
  { code: "3104", description: "IcelandExpress", category: "airlines" },
  { code: "3105", description: "WestJet Airlines", category: "airlines" },
  { code: "3106", description: "WOW Air", category: "airlines" },
  { code: "3107", description: "Norwegian Air", category: "airlines" },
  { code: "3108", description: "LATAM Airlines", category: "airlines" },
  { code: "3109", description: "Qatar Airways", category: "airlines" },
  { code: "3110", description: "China Southern Airlines", category: "airlines" },
  { code: "3111", description: "China Eastern Airlines", category: "airlines" },
  { code: "3112", description: "Etihad Airways", category: "airlines" },
  { code: "3113", description: "Jet Airways", category: "airlines" },
  { code: "3114", description: "IndiGo Airlines", category: "airlines" },
  { code: "3115", description: "Ryanair", category: "airlines" },
  { code: "3116", description: "EasyJet", category: "airlines" },
  { code: "3117", description: "Vueling Airlines", category: "airlines" },
  { code: "3118", description: "Pegasus Airlines", category: "airlines" },
  { code: "3119", description: "Scoot Airlines", category: "airlines" },
  { code: "3120", description: "AirAsia", category: "airlines" },
  { code: "3121", description: "Cebu Pacific", category: "airlines" },
  { code: "3122", description: "GoAir", category: "airlines" },
  { code: "3123", description: "SpiceJet", category: "airlines" },
  { code: "3124", description: "Breeze Airways", category: "airlines" },
  { code: "3125", description: "Avelo Airlines", category: "airlines" },
  { code: "3126", description: "Play Airlines", category: "airlines" },
  { code: "3127", description: "Flyr Airlines", category: "airlines" },
  { code: "3128", description: "Bamboo Airways", category: "airlines" },
  { code: "3129", description: "SriLankan Airlines", category: "airlines" },
  { code: "3130", description: "Sundair", category: "airlines" },
  // 3131-3199: remaining airline codes (generic)
  { code: "3171", description: "Airline (unspecified)", category: "airlines" },
  { code: "3172", description: "Airline (unspecified)", category: "airlines" },
  { code: "3173", description: "Airline (unspecified)", category: "airlines" },
  { code: "3174", description: "Airline (unspecified)", category: "airlines" },
  { code: "3175", description: "Airline (unspecified)", category: "airlines" },
  { code: "3176", description: "Airline (unspecified)", category: "airlines" },
  { code: "3177", description: "Airline (unspecified)", category: "airlines" },
  { code: "3178", description: "Airline (unspecified)", category: "airlines" },
  { code: "3179", description: "Airline (unspecified)", category: "airlines" },
  { code: "3180", description: "Airline (unspecified)", category: "airlines" },
  { code: "3181", description: "Airline (unspecified)", category: "airlines" },
  { code: "3182", description: "Airline (unspecified)", category: "airlines" },
  { code: "3183", description: "Airline (unspecified)", category: "airlines" },
  { code: "3184", description: "Airline (unspecified)", category: "airlines" },
  { code: "3185", description: "Airline (unspecified)", category: "airlines" },
  { code: "3186", description: "Airline (unspecified)", category: "airlines" },
  { code: "3187", description: "Airline (unspecified)", category: "airlines" },
  { code: "3188", description: "Airline (unspecified)", category: "airlines" },
  { code: "3189", description: "Airline (unspecified)", category: "airlines" },
  { code: "3190", description: "Airline (unspecified)", category: "airlines" },
  { code: "3191", description: "Airline (unspecified)", category: "airlines" },
  { code: "3192", description: "Airline (unspecified)", category: "airlines" },
  { code: "3193", description: "Airline (unspecified)", category: "airlines" },
  { code: "3194", description: "Airline (unspecified)", category: "airlines" },
  { code: "3195", description: "Airline (unspecified)", category: "airlines" },
  { code: "3196", description: "Airline (unspecified)", category: "airlines" },
  { code: "3197", description: "Airline (unspecified)", category: "airlines" },
  { code: "3198", description: "Airline (unspecified)", category: "airlines" },
  { code: "3199", description: "Airline (unspecified)", category: "airlines" },

  // =========================================================================
  // CAR RENTAL (3300–3499: specific car rental companies, 7512-7523)
  // =========================================================================
  { code: "3300", description: "Car Rental (unspecified)", category: "car_rental" },
  { code: "3351", description: "Hertz", category: "car_rental" },
  { code: "3352", description: "Payless Car Rental", category: "car_rental" },
  { code: "3353", description: "Tempest Car Rental", category: "car_rental" },
  { code: "3354", description: "A-1 Rent-A-Car", category: "car_rental" },
  { code: "3355", description: "Sixt Car Rental", category: "car_rental" },
  { code: "3356", description: "Simply Rent-A-Car", category: "car_rental" },
  { code: "3357", description: "Rent-A-Wreck", category: "car_rental" },
  { code: "3359", description: "Budget Rent-A-Car", category: "car_rental" },
  { code: "3360", description: "Interrent Car Rental", category: "car_rental" },
  { code: "3361", description: "Europcar", category: "car_rental" },
  { code: "3362", description: "National Car Rental", category: "car_rental" },
  { code: "3363", description: "Thrifty Car Rental", category: "car_rental" },
  { code: "3364", description: "Brooks Rent-A-Car", category: "car_rental" },
  { code: "3366", description: "Avis Rent-A-Car", category: "car_rental" },
  { code: "3368", description: "Holiday Rent-A-Car", category: "car_rental" },
  { code: "3370", description: "National Car Rental", category: "car_rental" },
  { code: "3374", description: "Advantage Rent-A-Car", category: "car_rental" },
  { code: "3376", description: "Ajax Rent-A-Car", category: "car_rental" },
  { code: "3380", description: "Alamo Rent-A-Car", category: "car_rental" },
  { code: "3381", description: "Allstate Rent-A-Car", category: "car_rental" },
  { code: "3385", description: "Dollar Rent-A-Car", category: "car_rental" },
  { code: "3386", description: "Enterprise Rent-A-Car", category: "car_rental" },
  { code: "3387", description: "Fox Rent-A-Car", category: "car_rental" },
  { code: "3388", description: "Greenlight Rent-A-Car", category: "car_rental" },
  { code: "3389", description: "Turo", category: "car_rental" },
  { code: "3390", description: "EZ Rent-A-Car", category: "car_rental" },
  { code: "3391", description: "Zipcar", category: "car_rental" },
  { code: "3393", description: "ACE Rent-A-Car", category: "car_rental" },
  { code: "3394", description: "U-Save Auto Rental", category: "car_rental" },
  { code: "3395", description: "Silvercar", category: "car_rental" },
  { code: "3396", description: "Kyte", category: "car_rental" },
  { code: "3398", description: "Midway Car Rental", category: "car_rental" },
  { code: "3400", description: "Auto Europe", category: "car_rental" },
  { code: "3405", description: "Enterprise Fleet", category: "car_rental" },
  { code: "3409", description: "General Rent-A-Car", category: "car_rental" },
  { code: "3412", description: "National Interrent", category: "car_rental" },
  { code: "3420", description: "Ansa International", category: "car_rental" },
  { code: "3421", description: "Allstates Rent-A-Car", category: "car_rental" },
  { code: "3423", description: "Avcar Rent-A-Car", category: "car_rental" },
  { code: "3425", description: "Automate Rent-A-Car", category: "car_rental" },
  { code: "3427", description: "Avon Rent-A-Car", category: "car_rental" },
  { code: "3428", description: "Carey Limousines", category: "car_rental" },
  { code: "3429", description: "Insurance Replacement Rental", category: "car_rental" },
  { code: "3430", description: "Major Rent-A-Car", category: "car_rental" },
  { code: "3431", description: "Replacement Rent-A-Car", category: "car_rental" },
  { code: "3432", description: "Reserve Rent-A-Car", category: "car_rental" },
  { code: "3433", description: "Ugly Duckling Rent-A-Car", category: "car_rental" },
  { code: "3434", description: "USA Rent-A-Car", category: "car_rental" },
  { code: "3435", description: "Value Rent-A-Car", category: "car_rental" },
  { code: "3436", description: "Autohansa Rent-A-Car", category: "car_rental" },
  { code: "3437", description: "Cite Rent-A-Car", category: "car_rental" },
  { code: "3438", description: "InterCity Rent-A-Car", category: "car_rental" },
  { code: "3439", description: "Milleville Rent-A-Car", category: "car_rental" },
  { code: "3441", description: "Advantage Rent-A-Car", category: "car_rental" },
  // Fill remaining 3440-3499 as generic car rental
  { code: "3499", description: "Car Rental (unspecified)", category: "car_rental" },

  // =========================================================================
  // HOTELS (3500–3799: specific lodging, 7011-7033)
  // =========================================================================
  { code: "3500", description: "Holiday Inn", category: "hotels" },
  { code: "3501", description: "Marriott Hotels", category: "hotels" },
  { code: "3502", description: "InterContinental Hotels (IHG)", category: "hotels" },
  { code: "3503", description: "Best Western", category: "hotels" },
  { code: "3504", description: "Hilton Hotels", category: "hotels" },
  { code: "3505", description: "Hyatt Hotels", category: "hotels" },
  { code: "3506", description: "Wyndham Hotels", category: "hotels" },
  { code: "3507", description: "Ramada Inn", category: "hotels" },
  { code: "3508", description: "Sheraton Hotels", category: "hotels" },
  { code: "3509", description: "Motel 6", category: "hotels" },
  { code: "3510", description: "La Quinta Inn", category: "hotels" },
  { code: "3511", description: "Americinn", category: "hotels" },
  { code: "3512", description: "Four Seasons Hotels", category: "hotels" },
  { code: "3513", description: "Carlton Hotels", category: "hotels" },
  { code: "3514", description: "Radisson Hotels", category: "hotels" },
  { code: "3515", description: "Red Roof Inn", category: "hotels" },
  { code: "3516", description: "Fairmont Hotels", category: "hotels" },
  { code: "3517", description: "Loews Hotels", category: "hotels" },
  { code: "3518", description: "Omni Hotels", category: "hotels" },
  { code: "3519", description: "Sofitel Hotels", category: "hotels" },
  { code: "3520", description: "Novotel Hotels", category: "hotels" },
  { code: "3521", description: "Nikko Hotels", category: "hotels" },
  { code: "3522", description: "Extended Stay", category: "hotels" },
  { code: "3523", description: "Doubletree Hotels", category: "hotels" },
  { code: "3524", description: "Embassy Suites", category: "hotels" },
  { code: "3525", description: "Hampton Inn", category: "hotels" },
  { code: "3526", description: "Crowne Plaza", category: "hotels" },
  { code: "3527", description: "Residence Inn", category: "hotels" },
  { code: "3528", description: "Country Inn & Suites", category: "hotels" },
  { code: "3529", description: "Comfort Inn", category: "hotels" },
  { code: "3530", description: "Quality Inn", category: "hotels" },
  { code: "3531", description: "Clarion Hotels", category: "hotels" },
  { code: "3532", description: "Rodeway Inn", category: "hotels" },
  { code: "3533", description: "Econo Lodge", category: "hotels" },
  { code: "3534", description: "Sleep Inn", category: "hotels" },
  { code: "3535", description: "MainStay Suites", category: "hotels" },
  { code: "3536", description: "Suburban Extended Stay", category: "hotels" },
  { code: "3537", description: "Candlewood Suites", category: "hotels" },
  { code: "3538", description: "Staybridge Suites", category: "hotels" },
  { code: "3539", description: "Hotel Indigo", category: "hotels" },
  { code: "3540", description: "Even Hotels", category: "hotels" },
  { code: "3541", description: "Kimpton Hotels", category: "hotels" },
  { code: "3542", description: "Joie de Vivre Hotels", category: "hotels" },
  { code: "3543", description: "Curio Collection", category: "hotels" },
  { code: "3544", description: "Canopy by Hilton", category: "hotels" },
  { code: "3545", description: "Tru by Hilton", category: "hotels" },
  { code: "3546", description: "Motto by Hilton", category: "hotels" },
  { code: "3547", description: "LXR Hotels", category: "hotels" },
  { code: "3548", description: "Signia Hotels", category: "hotels" },
  { code: "3549", description: "Spark by Hilton", category: "hotels" },
  { code: "3550", description: "Waldorf Astoria", category: "hotels" },
  { code: "3551", description: "Conrad Hotels", category: "hotels" },
  { code: "3552", description: "W Hotels", category: "hotels" },
  { code: "3553", description: "St. Regis Hotels", category: "hotels" },
  { code: "3554", description: "The Luxury Collection", category: "hotels" },
  { code: "3555", description: "Le Meridien Hotels", category: "hotels" },
  { code: "3556", description: "Westin Hotels", category: "hotels" },
  { code: "3557", description: "Tribute Portfolio", category: "hotels" },
  { code: "3558", description: "Design Hotels", category: "hotels" },
  { code: "3559", description: "Aloft Hotels", category: "hotels" },
  { code: "3560", description: "Element Hotels", category: "hotels" },
  { code: "3561", description: "AC Hotels", category: "hotels" },
  { code: "3562", description: "Moxy Hotels", category: "hotels" },
  { code: "3563", description: "Protea Hotels", category: "hotels" },
  { code: "3564", description: "City Express Hotels", category: "hotels" },
  { code: "3565", description: "SpringHill Suites", category: "hotels" },
  { code: "3566", description: "Fairfield Inn", category: "hotels" },
  { code: "3567", description: "TownePlace Suites", category: "hotels" },
  { code: "3568", description: "Autograph Collection", category: "hotels" },
  { code: "3569", description: "Gaylord Hotels", category: "hotels" },
  { code: "3570", description: "JW Marriott", category: "hotels" },
  { code: "3571", description: "Ritz-Carlton", category: "hotels" },
  { code: "3572", description: "Edition Hotels", category: "hotels" },
  { code: "3573", description: "Bulgari Hotels", category: "hotels" },
  { code: "3574", description: "Park Hyatt", category: "hotels" },
  { code: "3575", description: "Grand Hyatt", category: "hotels" },
  { code: "3576", description: "Hyatt Regency", category: "hotels" },
  { code: "3577", description: "Hyatt Place", category: "hotels" },
  { code: "3578", description: "Hyatt House", category: "hotels" },
  { code: "3579", description: "Andaz Hotels", category: "hotels" },
  { code: "3580", description: "Thompson Hotels", category: "hotels" },
  { code: "3581", description: "Hyatt Centric", category: "hotels" },
  { code: "3582", description: "Caption by Hyatt", category: "hotels" },
  { code: "3583", description: "UrCove Hotels", category: "hotels" },
  { code: "3584", description: "Miraval Resorts", category: "hotels" },
  { code: "3585", description: "Exhale Spa & Hotels", category: "hotels" },
  { code: "3586", description: "Destination Hotels", category: "hotels" },
  { code: "3587", description: "Joie de Vivre Hotels", category: "hotels" },
  // 3588-3699: additional hotel/lodging brands
  { code: "3600", description: "Accor Hotels", category: "hotels" },
  { code: "3610", description: "Ibis Hotels", category: "hotels" },
  { code: "3620", description: "Mercure Hotels", category: "hotels" },
  { code: "3630", description: "Pullman Hotels", category: "hotels" },
  { code: "3640", description: "Swissotel", category: "hotels" },
  { code: "3650", description: "Raffles Hotels", category: "hotels" },
  { code: "3660", description: "Banyan Tree Hotels", category: "hotels" },
  { code: "3670", description: "Mandarin Oriental", category: "hotels" },
  { code: "3680", description: "Peninsula Hotels", category: "hotels" },
  { code: "3690", description: "Shangri-La Hotels", category: "hotels" },
  { code: "3700", description: "Aman Resorts", category: "hotels" },
  { code: "3710", description: "One&Only Resorts", category: "hotels" },
  { code: "3720", description: "Rosewood Hotels", category: "hotels" },
  { code: "3730", description: "Six Senses Hotels", category: "hotels" },
  { code: "3740", description: "Montage Hotels", category: "hotels" },
  { code: "3750", description: "Oetker Collection", category: "hotels" },
  { code: "3760", description: "Auberge Resorts", category: "hotels" },
  { code: "3770", description: "Relais & Chateaux", category: "hotels" },
  { code: "3780", description: "Small Luxury Hotels", category: "hotels" },
  { code: "3790", description: "Leading Hotels", category: "hotels" },
  { code: "3799", description: "Lodging (unspecified)", category: "hotels" },
  // General hotel/lodging MCCs
  { code: "7011", description: "Hotels and Motels", category: "hotels" },
  { code: "7012", description: "Timeshare Rentals", category: "hotels" },
  { code: "7032", description: "Sporting and Recreational Camps", category: "hotels" },
  { code: "7033", description: "Campgrounds and Trailer Parks", category: "hotels" },

  // =========================================================================
  // TRAVEL (general travel services)
  // =========================================================================
  { code: "4411", description: "Cruise Lines", category: "travel" },
  { code: "4457", description: "Boat Rentals and Leasing", category: "travel" },
  { code: "4468", description: "Marinas and Marine Service/Supplies", category: "travel" },
  { code: "4511", description: "Air Carriers / Airlines", category: "airlines" },
  { code: "4582", description: "Airports, Airport Terminals, Flying Fields", category: "travel" },
  { code: "4722", description: "Travel Agencies and Tour Operators", category: "travel" },
  { code: "4723", description: "Package Tour Operators", category: "travel" },
  { code: "4761", description: "Arrangement of Travel", category: "travel" },
  { code: "4784", description: "Bridge and Road Tolls", category: "travel" },
  { code: "4789", description: "Transportation Services (not elsewhere classified)", category: "travel" },

  // =========================================================================
  // TRANSIT (local transportation, rideshare, commuter)
  // =========================================================================
  { code: "4011", description: "Railroads", category: "transit" },
  { code: "4111", description: "Local/Suburban Commuter, Passenger Transit", category: "transit" },
  { code: "4112", description: "Passenger Railways", category: "transit" },
  { code: "4119", description: "Ambulance Services", category: "general" },
  { code: "4121", description: "Taxicabs and Rideshare (Uber, Lyft)", category: "transit" },
  { code: "4131", description: "Bus Lines", category: "transit" },
  { code: "4214", description: "Motor Freight Carriers / Moving Companies", category: "general" },
  { code: "4215", description: "Courier Services — Air and Ground", category: "general" },
  { code: "4225", description: "Public Warehousing and Storage", category: "general" },

  // =========================================================================
  // TELECOMMUNICATIONS → general (not in SPEND_CATEGORIES)
  // =========================================================================
  { code: "4812", description: "Telecommunication Equipment", category: "general" },
  { code: "4813", description: "Key-entry Telecom Merchant", category: "general" },
  { code: "4814", description: "Telecommunication Services", category: "general" },
  { code: "4815", description: "Monthly Summary Telephone Charges", category: "general" },
  { code: "4816", description: "Computer Network/Information Services", category: "general" },
  { code: "4821", description: "Telegraph Services", category: "general" },

  // =========================================================================
  // UTILITIES → general (not in SPEND_CATEGORIES)
  // =========================================================================
  { code: "4899", description: "Cable/Satellite/Pay Television/Radio Services", category: "streaming" },
  { code: "4900", description: "Electric, Gas, Water, Sanitary Utilities", category: "general" },

  // =========================================================================
  // GROCERIES (5411 and warehouse clubs)
  // =========================================================================
  { code: "5300", description: "Wholesale Clubs (Costco, Sam's Club, BJ's)", category: "groceries" },
  { code: "5411", description: "Grocery Stores and Supermarkets", category: "groceries" },
  { code: "5422", description: "Freezer/Locker Meat Provisioners", category: "groceries" },
  { code: "5441", description: "Candy, Nut, Confectionery Stores", category: "groceries" },
  { code: "5451", description: "Dairy Products Stores", category: "groceries" },
  { code: "5462", description: "Bakeries", category: "groceries" },

  // =========================================================================
  // GAS STATIONS
  // =========================================================================
  { code: "5541", description: "Service Stations (with or without ancillary)", category: "gas" },
  { code: "5542", description: "Automated Fuel Dispensers", category: "gas" },
  { code: "5983", description: "Fuel Dealers (non-automotive)", category: "gas" },

  // =========================================================================
  // DINING / RESTAURANTS
  // =========================================================================
  { code: "5811", description: "Caterers", category: "dining" },
  { code: "5812", description: "Eating Places and Restaurants", category: "dining" },
  { code: "5813", description: "Drinking Places (Bars, Taverns, Nightclubs)", category: "dining" },
  { code: "5814", description: "Fast Food Restaurants", category: "dining" },
  { code: "5921", description: "Package Stores — Beer, Wine, Liquor", category: "dining" },

  // =========================================================================
  // DRUGSTORES / PHARMACIES
  // =========================================================================
  { code: "5912", description: "Drug Stores and Pharmacies", category: "drugstores" },

  // =========================================================================
  // DEPARTMENT STORES → online_shopping (closest SpendCategory match)
  // =========================================================================
  { code: "5310", description: "Discount Stores", category: "online_shopping" },
  { code: "5311", description: "Department Stores", category: "online_shopping" },
  { code: "5331", description: "Variety Stores", category: "online_shopping" },
  { code: "5399", description: "General Merchandise (misc.)", category: "online_shopping" },

  // =========================================================================
  // HOME IMPROVEMENT
  // =========================================================================
  { code: "5200", description: "Home Supply Warehouse Stores", category: "home_improvement" },
  { code: "5211", description: "Building Materials / Lumber Stores", category: "home_improvement" },
  { code: "5231", description: "Glass, Paint, Wallpaper Stores", category: "home_improvement" },
  { code: "5251", description: "Hardware Stores", category: "home_improvement" },
  { code: "5261", description: "Nurseries, Lawn and Garden Supply", category: "home_improvement" },

  // =========================================================================
  // ELECTRONICS → online_shopping
  // =========================================================================
  { code: "5044", description: "Office/Photographic/Photocopy Equipment", category: "online_shopping" },
  { code: "5045", description: "Computers and Computer Peripherals", category: "online_shopping" },
  { code: "5046", description: "Commercial Equipment", category: "online_shopping" },
  { code: "5047", description: "Dental/Medical Equipment", category: "general" },
  { code: "5051", description: "Metal Service Centers", category: "general" },
  { code: "5065", description: "Electrical Parts and Equipment", category: "online_shopping" },
  { code: "5072", description: "Hardware Equipment and Supplies", category: "home_improvement" },
  { code: "5094", description: "Precious Stones, Metals, Watches", category: "online_shopping" },
  { code: "5099", description: "Durable Goods (not elsewhere classified)", category: "online_shopping" },
  { code: "5732", description: "Electronics Stores", category: "online_shopping" },
  { code: "5733", description: "Music Stores", category: "online_shopping" },
  { code: "5734", description: "Computer Software Stores", category: "online_shopping" },
  { code: "5735", description: "Record Stores", category: "online_shopping" },

  // =========================================================================
  // CLOTHING / APPAREL → online_shopping
  // =========================================================================
  { code: "5611", description: "Men's/Boy's Clothing Stores", category: "online_shopping" },
  { code: "5621", description: "Women's Ready-to-Wear Stores", category: "online_shopping" },
  { code: "5631", description: "Women's Accessory Stores", category: "online_shopping" },
  { code: "5641", description: "Children's/Infant's Wear Stores", category: "online_shopping" },
  { code: "5651", description: "Family Clothing Stores", category: "online_shopping" },
  { code: "5655", description: "Sports Apparel/Riding Apparel", category: "online_shopping" },
  { code: "5661", description: "Shoe Stores", category: "online_shopping" },
  { code: "5681", description: "Furriers and Fur Shops", category: "online_shopping" },
  { code: "5691", description: "Men's/Women's Clothing Stores", category: "online_shopping" },
  { code: "5697", description: "Tailors, Seamstresses, Alterations", category: "online_shopping" },
  { code: "5698", description: "Wig and Toupee Stores", category: "online_shopping" },
  { code: "5699", description: "Miscellaneous Apparel/Accessory Shops", category: "online_shopping" },

  // =========================================================================
  // VARIOUS RETAIL → online_shopping
  // =========================================================================
  { code: "5940", description: "Bicycle Shops — Sales and Service", category: "online_shopping" },
  { code: "5941", description: "Sporting Goods Stores", category: "online_shopping" },
  { code: "5942", description: "Book Stores", category: "online_shopping" },
  { code: "5943", description: "Stationery/Office/School Supply Stores", category: "online_shopping" },
  { code: "5944", description: "Jewelry Stores/Watches/Clocks/Silverware", category: "online_shopping" },
  { code: "5945", description: "Hobby, Toy, and Game Shops", category: "online_shopping" },
  { code: "5946", description: "Camera and Photographic Supply Stores", category: "online_shopping" },
  { code: "5947", description: "Gift, Card, Novelty, Souvenir Shops", category: "online_shopping" },
  { code: "5948", description: "Luggage and Leather Goods Stores", category: "online_shopping" },
  { code: "5949", description: "Sewing/Needlework/Fabric/Piece Goods", category: "online_shopping" },
  { code: "5950", description: "Glassware/Crystal Stores", category: "online_shopping" },
  { code: "5970", description: "Artist Supply and Craft Stores", category: "online_shopping" },
  { code: "5971", description: "Art Dealers and Galleries", category: "online_shopping" },
  { code: "5972", description: "Stamp and Coin Stores", category: "online_shopping" },
  { code: "5973", description: "Religious Goods Stores", category: "online_shopping" },
  { code: "5975", description: "Hearing Aids — Sales/Service/Supply", category: "general" },
  { code: "5976", description: "Orthopedic Goods — Prosthetics", category: "general" },
  { code: "5977", description: "Cosmetic Stores", category: "online_shopping" },
  { code: "5978", description: "Typewriter Stores", category: "online_shopping" },
  { code: "5992", description: "Florists", category: "online_shopping" },
  { code: "5993", description: "Cigar Stores and Stands", category: "online_shopping" },
  { code: "5994", description: "News Dealers and Newsstands", category: "online_shopping" },
  { code: "5995", description: "Pet Shops, Pet Food, Pet Supplies", category: "online_shopping" },
  { code: "5996", description: "Swimming Pools — Sales/Service/Supplies", category: "home_improvement" },
  { code: "5997", description: "Electric Razor Stores", category: "online_shopping" },
  { code: "5998", description: "Tent and Awning Shops", category: "home_improvement" },
  { code: "5999", description: "Miscellaneous Specialty Retail", category: "online_shopping" },

  // =========================================================================
  // DIRECT MARKETING / ONLINE SHOPPING
  // =========================================================================
  { code: "5960", description: "Direct Marketing — Insurance Services", category: "online_shopping" },
  { code: "5961", description: "Direct Marketing — Catalog Merchant", category: "online_shopping" },
  { code: "5962", description: "Direct Marketing — Travel", category: "online_shopping" },
  { code: "5963", description: "Door-to-Door Sales", category: "online_shopping" },
  { code: "5964", description: "Direct Marketing — Catalog/Catalog Merchant", category: "online_shopping" },
  { code: "5965", description: "Direct Marketing — Combination Catalog/Retail", category: "online_shopping" },
  { code: "5966", description: "Direct Marketing — Outbound Telemarketing", category: "online_shopping" },
  { code: "5967", description: "Direct Marketing — Inbound Telemarketing", category: "online_shopping" },
  { code: "5968", description: "Direct Marketing — Subscription", category: "online_shopping" },
  { code: "5969", description: "Direct Marketing — Other", category: "online_shopping" },

  // =========================================================================
  // STREAMING / DIGITAL MEDIA
  // =========================================================================
  { code: "5815", description: "Digital Goods — Media (books, movies, music)", category: "streaming" },
  { code: "5816", description: "Digital Goods — Games", category: "streaming" },
  { code: "5817", description: "Digital Goods — Applications (ex. games)", category: "streaming" },
  { code: "5818", description: "Digital Goods — Large Digital Goods Merchant", category: "streaming" },

  // =========================================================================
  // ENTERTAINMENT
  // =========================================================================
  { code: "7829", description: "Motion Picture/Video Tape Production/Distribution", category: "general" },
  { code: "7832", description: "Motion Picture Theaters", category: "general" },
  { code: "7841", description: "Video Tape Rental Stores", category: "general" },
  { code: "7911", description: "Dance Halls, Studios, and Schools", category: "general" },
  { code: "7922", description: "Theatrical Producers/Ticket Agencies", category: "general" },
  { code: "7929", description: "Bands, Orchestras, Entertainers", category: "general" },
  { code: "7932", description: "Billiard/Pool Establishments", category: "general" },
  { code: "7933", description: "Bowling Alleys", category: "general" },
  { code: "7941", description: "Athletic Fields/Stadiums/Sports Promoters", category: "general" },
  { code: "7991", description: "Tourist Attractions and Exhibits", category: "general" },
  { code: "7992", description: "Golf Courses — Public", category: "general" },
  { code: "7993", description: "Video Amusement Game Supplies", category: "general" },
  { code: "7994", description: "Video Game Arcades", category: "general" },
  { code: "7995", description: "Betting (including Lottery Tickets)", category: "general" },
  { code: "7996", description: "Amusement Parks, Carnivals, Circuses", category: "general" },
  { code: "7997", description: "Membership Clubs/Recreation/Sports", category: "general" },
  { code: "7998", description: "Aquariums, Dolphinariums, Zoos", category: "general" },
  { code: "7999", description: "Recreation Services (not elsewhere classified)", category: "general" },

  // =========================================================================
  // MEDICAL / HEALTHCARE → general
  // =========================================================================
  { code: "8011", description: "Doctors (not elsewhere classified)", category: "general" },
  { code: "8021", description: "Dentists and Orthodontists", category: "general" },
  { code: "8031", description: "Osteopathic Physicians", category: "general" },
  { code: "8041", description: "Chiropractors", category: "general" },
  { code: "8042", description: "Optometrists and Ophthalmologists", category: "general" },
  { code: "8043", description: "Opticians, Optical Goods, Eyeglasses", category: "general" },
  { code: "8049", description: "Podiatrists and Chiropodists", category: "general" },
  { code: "8050", description: "Nursing/Personal Care Facilities", category: "general" },
  { code: "8062", description: "Hospitals", category: "general" },
  { code: "8071", description: "Medical and Dental Labs", category: "general" },
  { code: "8099", description: "Health Practitioners (not elsewhere classified)", category: "general" },

  // =========================================================================
  // EDUCATION → general
  // =========================================================================
  { code: "8211", description: "Elementary/Secondary Schools", category: "general" },
  { code: "8220", description: "Colleges/Universities/Professional Schools", category: "general" },
  { code: "8241", description: "Correspondence Schools", category: "general" },
  { code: "8244", description: "Business/Secretarial Schools", category: "general" },
  { code: "8249", description: "Trade/Vocational Schools", category: "general" },
  { code: "8299", description: "Schools and Educational Services (misc.)", category: "general" },

  // =========================================================================
  // PERSONAL SERVICES → general
  // =========================================================================
  { code: "7210", description: "Laundry, Cleaning, Garment Services", category: "general" },
  { code: "7211", description: "Laundry Services — Family/Commercial", category: "general" },
  { code: "7216", description: "Dry Cleaners", category: "general" },
  { code: "7217", description: "Carpet/Upholstery Cleaning", category: "general" },
  { code: "7221", description: "Photographic Studios", category: "general" },
  { code: "7230", description: "Beauty and Barber Shops", category: "general" },
  { code: "7251", description: "Shoe Repair/Shine/Hat Cleaning", category: "general" },
  { code: "7261", description: "Funeral Services and Crematories", category: "general" },
  { code: "7273", description: "Dating and Escort Services", category: "general" },
  { code: "7276", description: "Tax Preparation Services", category: "general" },
  { code: "7277", description: "Counseling Services", category: "general" },
  { code: "7278", description: "Buying/Shopping Services", category: "general" },
  { code: "7296", description: "Clothing Rental", category: "general" },
  { code: "7297", description: "Massage Parlors", category: "general" },
  { code: "7298", description: "Health and Beauty Spas", category: "general" },
  { code: "7299", description: "Miscellaneous Recreation Services", category: "general" },

  // =========================================================================
  // CAR RENTAL (general MCCs)
  // =========================================================================
  { code: "7512", description: "Automobile Rental Agency", category: "car_rental" },
  { code: "7513", description: "Truck/Utility Trailer Rentals", category: "car_rental" },
  { code: "7519", description: "Motor Home and RV Rentals", category: "car_rental" },
  { code: "7523", description: "Parking Lots and Garages", category: "transit" },

  // =========================================================================
  // AUTO SERVICES → general
  // =========================================================================
  { code: "5511", description: "Automobile Dealers (new and used)", category: "general" },
  { code: "5521", description: "Automobile Dealers (used only)", category: "general" },
  { code: "5531", description: "Auto and Home Supply Stores", category: "general" },
  { code: "5532", description: "Automotive Tire Stores", category: "general" },
  { code: "5533", description: "Automotive Parts and Accessories", category: "general" },
  { code: "5551", description: "Boat Dealers", category: "general" },
  { code: "5561", description: "Camper, RV, and Utility Trailer Dealers", category: "general" },
  { code: "5571", description: "Motorcycle Shops and Dealers", category: "general" },
  { code: "5592", description: "Motor Home Dealers", category: "general" },
  { code: "5598", description: "Snowmobile Dealers", category: "general" },
  { code: "5599", description: "Miscellaneous Vehicle Dealers", category: "general" },
  { code: "7531", description: "Automotive Body Repair Shops", category: "general" },
  { code: "7534", description: "Tire Retreading and Repair Shops", category: "general" },
  { code: "7535", description: "Automotive Paint Shops", category: "general" },
  { code: "7538", description: "Automotive Service Shops (non-dealer)", category: "general" },
  { code: "7542", description: "Car Washes", category: "general" },
  { code: "7549", description: "Towing Services", category: "general" },

  // =========================================================================
  // PROFESSIONAL SERVICES → general
  // =========================================================================
  { code: "8111", description: "Legal Services and Attorneys", category: "general" },
  { code: "8351", description: "Child Care Services", category: "general" },
  { code: "8398", description: "Charitable/Social Service Organizations", category: "general" },
  { code: "8641", description: "Civic, Social, Fraternal Associations", category: "general" },
  { code: "8651", description: "Political Organizations", category: "general" },
  { code: "8661", description: "Religious Organizations", category: "general" },
  { code: "8675", description: "Automobile Associations", category: "general" },
  { code: "8699", description: "Membership Organizations", category: "general" },
  { code: "8734", description: "Testing Laboratories", category: "general" },
  { code: "8911", description: "Architectural/Engineering/Surveying", category: "general" },
  { code: "8931", description: "Accounting/Auditing/Bookkeeping", category: "general" },
  { code: "8999", description: "Professional Services (not elsewhere classified)", category: "general" },

  // =========================================================================
  // GOVERNMENT → general
  // =========================================================================
  { code: "9211", description: "Court Costs, Fines, Tax Payments", category: "general" },
  { code: "9222", description: "Fines", category: "general" },
  { code: "9223", description: "Bail and Bond Payments", category: "general" },
  { code: "9311", description: "Tax Payments", category: "general" },
  { code: "9399", description: "Government Services (not elsewhere classified)", category: "general" },
  { code: "9401", description: "Postal Services — Government Only", category: "general" },
  { code: "9402", description: "Postal Services — Government Only", category: "general" },
  { code: "9405", description: "US Federal Government Agencies/Departments", category: "general" },
  { code: "9700", description: "Automated Referral Service", category: "general" },
  { code: "9701", description: "Visa Services", category: "general" },
  { code: "9702", description: "Passport Services", category: "general" },
  { code: "9950", description: "Intra-Company Purchases", category: "general" },

  // =========================================================================
  // FURNITURE / HOME FURNISHINGS → home_improvement
  // =========================================================================
  { code: "5021", description: "Office/Commercial Furniture", category: "home_improvement" },
  { code: "5039", description: "Construction Materials", category: "home_improvement" },
  { code: "5712", description: "Furniture/Home Furnishings Stores", category: "home_improvement" },
  { code: "5713", description: "Floor Covering Stores", category: "home_improvement" },
  { code: "5714", description: "Drapery, Window Covering, Upholstery", category: "home_improvement" },
  { code: "5718", description: "Fireplace/Fireplace Screens/Accessories", category: "home_improvement" },
  { code: "5719", description: "Miscellaneous Home Furnishing Stores", category: "home_improvement" },
  { code: "5722", description: "Household Appliance Stores", category: "home_improvement" },

  // =========================================================================
  // CONTRACTOR SERVICES → home_improvement
  // =========================================================================
  { code: "1520", description: "General Contractors — Residential", category: "home_improvement" },
  { code: "1711", description: "Heating/Plumbing/AC Contractors", category: "home_improvement" },
  { code: "1731", description: "Electrical Contractors", category: "home_improvement" },
  { code: "1740", description: "Masonry/Stonework/Tile/Plastering", category: "home_improvement" },
  { code: "1750", description: "Carpentry Contractors", category: "home_improvement" },
  { code: "1761", description: "Roofing/Siding/Sheet Metal Contractors", category: "home_improvement" },
  { code: "1771", description: "Concrete Work Contractors", category: "home_improvement" },
  { code: "1799", description: "Special Trade Contractors", category: "home_improvement" },

  // =========================================================================
  // MISCELLANEOUS SERVICES → general
  // =========================================================================
  { code: "7010", description: "Lodging — Hotel/Motel/Resort (reserved)", category: "hotels" },
  { code: "7311", description: "Advertising Services", category: "general" },
  { code: "7321", description: "Consumer Credit Reporting Agencies", category: "general" },
  { code: "7333", description: "Commercial Photography/Art/Graphics", category: "general" },
  { code: "7338", description: "Quick Copy/Repro/Blueprinting", category: "general" },
  { code: "7339", description: "Stenographic/Secretarial Support Services", category: "general" },
  { code: "7342", description: "Exterminating/Disinfecting Services", category: "general" },
  { code: "7349", description: "Building Cleaning/Maintenance", category: "general" },
  { code: "7361", description: "Employment Agencies/Temp Services", category: "general" },
  { code: "7372", description: "Computer Programming/Data Processing", category: "general" },
  { code: "7375", description: "Information Retrieval Services", category: "general" },
  { code: "7379", description: "Computer Services (not elsewhere classified)", category: "general" },
  { code: "7392", description: "Management/Consulting/PR Services", category: "general" },
  { code: "7393", description: "Detective/Protective Agencies/Security", category: "general" },
  { code: "7394", description: "Equipment Rental/Leasing", category: "general" },
  { code: "7395", description: "Photofinishing Labs", category: "general" },
  { code: "7399", description: "Business Services (not elsewhere classified)", category: "general" },

  // =========================================================================
  // INSURANCE → general
  // =========================================================================
  { code: "6300", description: "Insurance — Not elsewhere classified", category: "general" },
  { code: "6381", description: "Insurance Premiums", category: "general" },
  { code: "6399", description: "Insurance — Sales/Underwriting", category: "general" },

  // =========================================================================
  // FINANCIAL SERVICES → general
  // =========================================================================
  { code: "6010", description: "Financial Institutions — Manual Cash Disbursement", category: "general" },
  { code: "6011", description: "Financial Institutions — Automated Cash Disbursement (ATM)", category: "general" },
  { code: "6012", description: "Financial Institutions — Merchandise/Services", category: "general" },
  { code: "6051", description: "Non-Financial Institutions — Foreign Currency/Money Orders", category: "general" },
  { code: "6211", description: "Security Brokers/Dealers", category: "general" },
  { code: "6513", description: "Real Estate Agents and Managers — Rentals", category: "general" },
  { code: "6540", description: "Stored Value Card Purchase/Load", category: "general" },

];

// ─── Build Lookup Maps ──────────────────────────────────────────────────────

/** Map from MCC code string to MccEntry for O(1) lookup */
const MCC_CODE_MAP = new Map<string, MccEntry>();

/** Map from SpendCategory to array of MCC code strings for reverse lookup */
const CATEGORY_TO_CODES_MAP = new Map<SpendCategory, string[]>();

function buildMaps(): void {
  for (const entry of MCC_ENTRIES) {
    // Deduplicate: first definition wins
    if (!MCC_CODE_MAP.has(entry.code)) {
      MCC_CODE_MAP.set(entry.code, entry);
    }

    const existing = CATEGORY_TO_CODES_MAP.get(entry.category);
    if (existing) {
      if (!existing.includes(entry.code)) {
        existing.push(entry.code);
      }
    } else {
      CATEGORY_TO_CODES_MAP.set(entry.category, [entry.code]);
    }
  }
}

buildMaps();

// ─── Range-Based Fallback ───────────────────────────────────────────────────
//
// For MCC codes not explicitly listed, fall back to range-based classification.
// This covers the gaps between individually listed codes (e.g., airline codes
// 3131-3170 that aren't specifically named).
// ─────────────────────────────────────────────────────────────────────────────

interface MccRange {
  start: number;
  end: number;
  category: SpendCategory;
  description: string;
}

const MCC_RANGES: MccRange[] = [
  { start: 1, end: 1499, category: "general", description: "Agricultural Services" },
  { start: 1500, end: 1999, category: "home_improvement", description: "Contracted Services" },
  { start: 2000, end: 2999, category: "general", description: "Not Assigned / Reserved" },
  { start: 3000, end: 3299, category: "airlines", description: "Airlines" },
  { start: 3300, end: 3499, category: "car_rental", description: "Car Rental" },
  { start: 3500, end: 3799, category: "hotels", description: "Hotels and Lodging" },
  { start: 3800, end: 3999, category: "travel", description: "Transportation (reserved)" },
  { start: 4000, end: 4099, category: "transit", description: "Railroads" },
  { start: 4100, end: 4199, category: "transit", description: "Local Passenger Transportation" },
  { start: 4200, end: 4299, category: "general", description: "Freight / Moving / Storage" },
  { start: 4300, end: 4399, category: "general", description: "Utilities (reserved)" },
  { start: 4400, end: 4499, category: "travel", description: "Steamship/Cruise Lines" },
  { start: 4500, end: 4599, category: "airlines", description: "Air Carriers" },
  { start: 4600, end: 4699, category: "general", description: "Utilities (reserved)" },
  { start: 4700, end: 4799, category: "travel", description: "Travel Services" },
  { start: 4800, end: 4899, category: "general", description: "Telecommunication Services" },
  { start: 4900, end: 4999, category: "general", description: "Utility Services" },
  { start: 5000, end: 5099, category: "online_shopping", description: "Wholesale — Durable Goods" },
  { start: 5100, end: 5199, category: "online_shopping", description: "Wholesale — Non-Durable Goods" },
  { start: 5200, end: 5299, category: "home_improvement", description: "Building Materials / Home Improvement" },
  { start: 5300, end: 5399, category: "online_shopping", description: "General Retail" },
  { start: 5400, end: 5499, category: "groceries", description: "Food Stores" },
  { start: 5500, end: 5599, category: "general", description: "Automotive Dealers / Gas Stations" },
  { start: 5600, end: 5699, category: "online_shopping", description: "Apparel / Accessories" },
  { start: 5700, end: 5799, category: "home_improvement", description: "Home Furnishing" },
  { start: 5800, end: 5899, category: "dining", description: "Eating / Drinking Places" },
  { start: 5900, end: 5999, category: "online_shopping", description: "Retail Stores (misc.)" },
  { start: 6000, end: 6999, category: "general", description: "Financial / Insurance" },
  { start: 7000, end: 7099, category: "hotels", description: "Lodging" },
  { start: 7100, end: 7199, category: "general", description: "Personal Services (misc.)" },
  { start: 7200, end: 7299, category: "general", description: "Personal Services" },
  { start: 7300, end: 7399, category: "general", description: "Business Services" },
  { start: 7400, end: 7499, category: "general", description: "Repair Services" },
  { start: 7500, end: 7599, category: "car_rental", description: "Auto Rental / Parking" },
  { start: 7600, end: 7699, category: "general", description: "Miscellaneous Repair" },
  { start: 7700, end: 7799, category: "general", description: "Reserved" },
  { start: 7800, end: 7899, category: "general", description: "Entertainment — Motion Pictures" },
  { start: 7900, end: 7999, category: "general", description: "Entertainment — Recreation" },
  { start: 8000, end: 8099, category: "general", description: "Healthcare / Medical" },
  { start: 8100, end: 8199, category: "general", description: "Legal Services" },
  { start: 8200, end: 8299, category: "general", description: "Educational Services" },
  { start: 8300, end: 8399, category: "general", description: "Social Services" },
  { start: 8400, end: 8999, category: "general", description: "Professional Services" },
  { start: 9000, end: 9999, category: "general", description: "Government / Intra-Company" },
];

/**
 * Look up the SpendCategory for a range-based MCC fallback.
 * Returns "general" if no range matches.
 */
function getRangeCategory(numericCode: number): { category: SpendCategory; description: string } {
  for (const range of MCC_RANGES) {
    if (numericCode >= range.start && numericCode <= range.end) {
      return { category: range.category, description: range.description };
    }
  }
  return { category: "general", description: "Unknown" };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get the SpendCategory for a given MCC code.
 *
 * Performs an exact lookup first, then falls back to range-based matching.
 * Returns "general" for unknown or invalid MCC codes.
 *
 * @param mccCode - The 4-digit MCC code as a string (e.g., "5812")
 * @returns The matching SpendCategory
 *
 * @example
 * ```ts
 * getMccCategory("5812") // "dining"
 * getMccCategory("5411") // "groceries"
 * getMccCategory("3058") // "airlines"
 * getMccCategory("9999") // "general"
 * ```
 */
export function getMccCategory(mccCode: string): SpendCategory {
  const normalized = mccCode.trim();

  // Exact match first
  const entry = MCC_CODE_MAP.get(normalized);
  if (entry) {
    return entry.category;
  }

  // Range-based fallback
  const numeric = parseInt(normalized, 10);
  if (!isNaN(numeric) && numeric >= 0 && numeric <= 9999) {
    return getRangeCategory(numeric).category;
  }

  return "general";
}

/**
 * Get a human-readable description for a given MCC code.
 *
 * Performs an exact lookup first, then falls back to a range-based description.
 * Returns "Unknown MCC Code" for unrecognized codes.
 *
 * @param mccCode - The 4-digit MCC code as a string (e.g., "5812")
 * @returns A human-readable description of the merchant category
 *
 * @example
 * ```ts
 * getMccDescription("5812") // "Eating Places and Restaurants"
 * getMccDescription("5411") // "Grocery Stores and Supermarkets"
 * getMccDescription("3058") // "Delta Air Lines"
 * getMccDescription("0000") // "Unknown MCC Code"
 * ```
 */
export function getMccDescription(mccCode: string): string {
  const normalized = mccCode.trim();

  // Exact match first
  const entry = MCC_CODE_MAP.get(normalized);
  if (entry) {
    return entry.description;
  }

  // Range-based fallback
  const numeric = parseInt(normalized, 10);
  if (!isNaN(numeric) && numeric >= 0 && numeric <= 9999) {
    const rangeResult = getRangeCategory(numeric);
    if (rangeResult.description !== "Unknown") {
      return rangeResult.description;
    }
  }

  return "Unknown MCC Code";
}

/**
 * Get all MCC codes that map to a given SpendCategory.
 *
 * Returns explicitly mapped codes only (not range-based).
 * Returns an empty array for categories with no mapped codes.
 *
 * @param category - The SpendCategory to look up
 * @returns Array of MCC code strings for the category, sorted numerically
 *
 * @example
 * ```ts
 * getCategoryMccCodes("dining")     // ["5811", "5812", "5813", "5814", "5921"]
 * getCategoryMccCodes("gas")        // ["5541", "5542", "5983"]
 * getCategoryMccCodes("groceries")  // ["5300", "5411", "5422", "5441", "5451", "5462"]
 * ```
 */
export function getCategoryMccCodes(category: SpendCategory): string[] {
  const codes = CATEGORY_TO_CODES_MAP.get(category);
  if (!codes) {
    return [];
  }
  return [...codes].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

/**
 * Get the full MccEntry for a given code, including category and description.
 *
 * Returns undefined if the code is not explicitly mapped.
 * For range-based fallback, use getMccCategory() and getMccDescription() instead.
 *
 * @param mccCode - The 4-digit MCC code as a string
 * @returns The MccEntry or undefined if not found
 */
export function getMccEntry(mccCode: string): MccEntry | undefined {
  return MCC_CODE_MAP.get(mccCode.trim());
}

/**
 * Check whether a given MCC code has an explicit mapping (not range-based).
 *
 * @param mccCode - The 4-digit MCC code as a string
 * @returns true if the code is explicitly mapped
 */
export function isKnownMccCode(mccCode: string): boolean {
  return MCC_CODE_MAP.has(mccCode.trim());
}

/**
 * Get all explicitly mapped MCC entries.
 *
 * Useful for building admin UIs or debugging the mapping data.
 *
 * @returns A readonly array of all MccEntry records
 */
export function getAllMccEntries(): readonly MccEntry[] {
  return MCC_ENTRIES;
}
