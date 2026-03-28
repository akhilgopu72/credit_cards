import { z } from "zod";
import type { SignUpBonus, BaseEarnRate } from "./common";
import { signUpBonusSchema } from "./common";

// ─── Wallet API Response Types ───────────────────────────────────
// GET /api/wallet

export type CategoryBonusItem = {
  id: string;
  category: string;
  multiplier: string;
  capAmount: string | null;
  capPeriod: string;
};

export type BenefitItem = {
  id: string;
  benefitType: string;
  name: string;
  description: string;
  value: string;
  frequency: string;
};

export type CardVersion = {
  id: string;
  annualFee: string;
  signUpBonus: SignUpBonus | null;
  baseEarnRate: BaseEarnRate;
  categoryBonuses: CategoryBonusItem[];
  benefits: BenefitItem[];
};

export type CardProduct = {
  id: string;
  issuer: string;
  name: string;
  slug: string;
  network: string;
  annualFee: string;
  imageUrl?: string | null;
  versions: CardVersion[];
};

export type WalletCard = {
  id: string;
  cardId: string;
  nickname: string | null;
  openedDate: string | null;
  signUpBonusOverride: SignUpBonus | null;
  isActive: boolean;
  card: CardProduct;
};

// ─── Wallet API Request Schemas ──────────────────────────────────
// POST /api/wallet

export const addCardSchema = z.object({
  cardId: z.string().uuid(),
  nickname: z.string().optional(),
  openedDate: z.string().optional(),
  annualFeeDate: z.string().optional(),
  creditLimit: z.number().nonnegative().optional(),
  signUpBonusOverride: signUpBonusSchema.optional(),
});

export type AddCardRequest = z.infer<typeof addCardSchema>;

// PUT/PATCH /api/wallet

export const updateCardSchema = z.object({
  userCardId: z.string().uuid(),
  nickname: z.string().optional(),
  openedDate: z.string().optional(),
  annualFeeDate: z.string().optional(),
  creditLimit: z.number().nonnegative().optional(),
  signUpBonusOverride: signUpBonusSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCardRequest = z.infer<typeof updateCardSchema>;

// DELETE /api/wallet

export const deleteCardSchema = z.object({
  userCardId: z.string().uuid(),
});

export type DeleteCardRequest = z.infer<typeof deleteCardSchema>;
