import { z } from "zod";
import type { CouponModel } from "../../data/model/coupon.model";

export const CouponSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  discountPercentage: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  validFrom: z.string().min(1),
  validUntil: z.string().nullable().optional(),
  minPurchaseValue: z.union([z.number(), z.string()]).nullable().optional().transform((v) => v === null || v === undefined ? null : Number(v)),
  maxDiscountValue: z.union([z.number(), z.string()]).nullable().optional().transform((v) => v === null || v === undefined ? null : Number(v)),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CouponType = z.infer<typeof CouponSchema>;

export class Coupon {
  id!: string;
  code!: string;
  discountPercentage!: number;
  validFrom!: string;
  validUntil?: string | null;
  minPurchaseValue?: number | null;
  maxDiscountValue?: number | null;
  isActive!: boolean;
  createdAt!: string;
  updatedAt!: string;

  constructor(data: CouponType) {
    const parsed = CouponSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map(e => e.message).join(", "));
    }
    Object.assign(this, parsed.data);
  }

  static fromModel(model: CouponModel): Coupon {
    return new Coupon(model as CouponType);
  }

  public toModel(): CouponModel {
    return { ...this };
  }
}

