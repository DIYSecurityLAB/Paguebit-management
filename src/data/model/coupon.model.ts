export interface CouponModel {
  id: string;
  code: string;
  discountPercentage: number;
  validFrom: string;
  validUntil?: string | null;
  minPurchaseValue?: number | null;
  maxDiscountValue?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListCouponsRequest {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface ListCouponsResponse {
  items: CouponModel[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateCouponRequest {
  code: string;
  discountPercentage: number;
  validFrom: string;
  validUntil?: string | null;
  minPurchaseValue?: number | null;
  maxDiscountValue?: number | null;
  isActive: boolean;
}

export type CreateCouponResponse = CouponModel;

export interface UpdateCouponRequest {
  code?: string;
  discountPercentage?: number;
  validFrom?: string;
  validUntil?: string | null;
  minPurchaseValue?: number | null;
  maxDiscountValue?: number | null;
  isActive?: boolean;
}

export type UpdateCouponResponse = CouponModel;

export type GetCouponResponse = CouponModel;
 
