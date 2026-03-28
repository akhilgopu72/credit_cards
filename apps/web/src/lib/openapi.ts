import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  signUpBonusSchema,
  baseEarnRateSchema,
  addCardSchema,
  updateCardSchema,
  scrapedOfferSchema,
  offerBatchSchema,
  merchantSearchSchema,
  scenarioRequestSchema,
} from "@/types/api";

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

// ─── Registry ────────────────────────────────────────────────────
const registry = new OpenAPIRegistry();

// ─── Common Schemas ──────────────────────────────────────────────

registry.register("SignUpBonus", signUpBonusSchema.openapi("SignUpBonus"));
registry.register("BaseEarnRate", baseEarnRateSchema.openapi("BaseEarnRate"));

// ─── Response Schemas (defined inline since response types are plain TS) ──

const dashboardStatsSchema = z
  .object({
    cardsCount: z.number(),
    totalCreditsAvailable: z.number(),
    totalCreditsUsed: z.number(),
    activeOffersCount: z.number(),
    upcomingFees: z.array(
      z.object({
        cardName: z.string(),
        annualFee: z.string(),
        feeDate: z.string().nullable(),
      })
    ),
    cardSummaries: z.array(
      z.object({
        userCardId: z.string().uuid(),
        cardName: z.string(),
        issuer: z.string(),
        annualFee: z.string(),
        totalCreditsValue: z.number(),
        benefitsCount: z.number(),
        bonusesCount: z.number(),
        signUpBonus: signUpBonusSchema.nullable(),
      })
    ),
  })
  .openapi("DashboardStats");

const cardVersionSchema = z
  .object({
    id: z.string().uuid(),
    annualFee: z.string(),
    signUpBonus: signUpBonusSchema.nullable(),
    baseEarnRate: baseEarnRateSchema,
    categoryBonuses: z.array(
      z.object({
        id: z.string().uuid(),
        category: z.string(),
        multiplier: z.string(),
        capAmount: z.string().nullable(),
        capPeriod: z.string(),
      })
    ),
    benefits: z.array(
      z.object({
        id: z.string().uuid(),
        benefitType: z.string(),
        name: z.string(),
        description: z.string(),
        value: z.string(),
        frequency: z.string(),
      })
    ),
  })
  .openapi("CardVersion");

const cardProductSchema = z
  .object({
    id: z.string().uuid(),
    issuer: z.string(),
    name: z.string(),
    slug: z.string(),
    network: z.string(),
    annualFee: z.string(),
    imageUrl: z.string().nullable().optional(),
    versions: z.array(cardVersionSchema),
  })
  .openapi("CardProduct");

const walletCardSchema = z
  .object({
    id: z.string().uuid(),
    cardId: z.string().uuid(),
    nickname: z.string().nullable(),
    openedDate: z.string().nullable(),
    signUpBonusOverride: signUpBonusSchema.nullable(),
    isActive: z.boolean(),
    card: cardProductSchema,
  })
  .openapi("WalletCard");

const offerSchema = z
  .object({
    id: z.string().uuid(),
    issuer: z.string(),
    cardName: z.string().nullable(),
    cardId: z.string().uuid().nullable(),
    merchantId: z.string().uuid().nullable(),
    merchantName: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    offerType: z.string(),
    value: z.string(),
    valueType: z.string(),
    minSpend: z.string().nullable(),
    maxReward: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    requiresAdd: z.boolean(),
    sourceHash: z.string().nullable(),
    scrapedAt: z.string().nullable(),
  })
  .openapi("Offer");

const merchantSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    category: z.string(),
    websiteDomain: z.string().nullable(),
    logoUrl: z.string().nullable().optional(),
  })
  .openapi("Merchant");

const cardRankingSchema = z
  .object({
    cardId: z.string().uuid(),
    cardName: z.string(),
    issuer: z.string(),
    slug: z.string(),
    annualFee: z.string(),
    multiplier: z.number(),
    currency: z.string(),
    capAmount: z.string().nullable(),
    capPeriod: z.string().nullable(),
    isBaseRate: z.boolean(),
  })
  .openapi("CardRanking");

const merchantOfferSchema = z
  .object({
    id: z.string().uuid(),
    issuer: z.string(),
    cardName: z.string().nullable(),
    merchantName: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    offerType: z.string(),
    value: z.string(),
    valueType: z.string(),
    endDate: z.string().nullable(),
  })
  .openapi("MerchantOffer");

// Helper: wrap data in ApiResponse envelope
function apiResponse(dataSchema: z.ZodTypeAny) {
  return z.object({
    data: dataSchema.nullable(),
    error: z.string().nullable(),
    meta: z
      .object({
        total: z.number().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      })
      .optional(),
  });
}

// ─── Route Registrations ─────────────────────────────────────────

// GET /api/dashboard
registry.registerPath({
  method: "get",
  path: "/api/dashboard",
  summary: "Get dashboard stats",
  tags: ["Dashboard"],
  responses: {
    200: {
      description: "Dashboard statistics for the authenticated user",
      content: {
        "application/json": {
          schema: apiResponse(dashboardStatsSchema),
        },
      },
    },
  },
});

// GET /api/wallet
registry.registerPath({
  method: "get",
  path: "/api/wallet",
  summary: "List wallet cards",
  tags: ["Wallet"],
  responses: {
    200: {
      description: "User's wallet cards with full card product details",
      content: {
        "application/json": {
          schema: apiResponse(z.array(walletCardSchema)),
        },
      },
    },
  },
});

// POST /api/wallet
registry.registerPath({
  method: "post",
  path: "/api/wallet",
  summary: "Add card to wallet",
  tags: ["Wallet"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: addCardSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Newly created wallet card entry",
      content: {
        "application/json": {
          schema: apiResponse(z.object({ id: z.string().uuid() })),
        },
      },
    },
  },
});

// PATCH /api/wallet
registry.registerPath({
  method: "patch",
  path: "/api/wallet",
  summary: "Update a wallet card",
  tags: ["Wallet"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateCardSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated wallet card",
      content: {
        "application/json": {
          schema: apiResponse(z.object({ id: z.string().uuid() })),
        },
      },
    },
  },
});

// GET /api/offers
registry.registerPath({
  method: "get",
  path: "/api/offers",
  summary: "List offers",
  tags: ["Offers"],
  request: {
    query: z.object({
      issuer: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "All scraped offers, optionally filtered by issuer",
      content: {
        "application/json": {
          schema: apiResponse(z.array(offerSchema)),
        },
      },
    },
  },
});

// POST /api/offers
registry.registerPath({
  method: "post",
  path: "/api/offers",
  summary: "Submit scraped offers",
  tags: ["Offers"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: offerBatchSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Insert result",
      content: {
        "application/json": {
          schema: apiResponse(
            z.object({
              deleted: z.number(),
              inserted: z.number(),
              total: z.number(),
            })
          ),
        },
      },
    },
  },
});

// GET /api/merchants/search
registry.registerPath({
  method: "get",
  path: "/api/merchants/search",
  summary: "Search merchants by name",
  tags: ["Merchants"],
  request: {
    query: merchantSearchSchema,
  },
  responses: {
    200: {
      description: "Fuzzy-matched merchant results",
      content: {
        "application/json": {
          schema: apiResponse(
            z.array(
              merchantSchema.extend({
                simScore: z.number().optional(),
              })
            )
          ),
        },
      },
    },
  },
});

// GET /api/merchants/{slug}
registry.registerPath({
  method: "get",
  path: "/api/merchants/{slug}",
  summary: "Get merchant detail with card rankings",
  tags: ["Merchants"],
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Merchant info, ranked cards, and active offers",
      content: {
        "application/json": {
          schema: apiResponse(
            z.object({
              merchant: merchantSchema,
              cardRankings: z.array(cardRankingSchema),
              offers: z.array(merchantOfferSchema),
            })
          ),
        },
      },
    },
    404: {
      description: "Merchant not found",
      content: {
        "application/json": {
          schema: apiResponse(z.null()),
        },
      },
    },
  },
});

// POST /api/scenarios
registry.registerPath({
  method: "post",
  path: "/api/scenarios",
  summary: "Calculate, optimize, or save a spend scenario",
  tags: ["Scenarios"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: scenarioRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Scenario calculation result or save confirmation",
      content: {
        "application/json": {
          schema: apiResponse(z.any()),
        },
      },
    },
  },
});

// GET /api/cards
registry.registerPath({
  method: "get",
  path: "/api/cards",
  summary: "List all credit card products",
  tags: ["Cards"],
  request: {
    query: z.object({
      q: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Credit card products with current version details",
      content: {
        "application/json": {
          schema: apiResponse(z.array(cardProductSchema)),
        },
      },
    },
  },
});

// ─── Generate OpenAPI Document ───────────────────────────────────

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "CardMax API",
      version: "0.1.0",
      description:
        "Credit card optimization API. Manages cards, offers, merchants, and spend scenarios.",
    },
    servers: [
      { url: "http://localhost:3000", description: "Local development" },
    ],
  });
}
