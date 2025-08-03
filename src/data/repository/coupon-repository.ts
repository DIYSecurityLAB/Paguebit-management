import {
  ListCouponsRequest,
  ListCouponsResponse,
  CreateCouponRequest,
  CreateCouponResponse,
  UpdateCouponRequest,
  UpdateCouponResponse,
  GetCouponResponse,
} from "../model/coupon.model";
import { apiDataSource } from "../datasource/api.datasource";

export class CouponRepository {
  async listCoupons(params?: ListCouponsRequest): Promise<ListCouponsResponse> {
    return await apiDataSource.get<ListCouponsResponse>('/admin/coupons', { params });
  }

  async createCoupon(data: CreateCouponRequest): Promise<CreateCouponResponse> {
    return await apiDataSource.post<CreateCouponResponse>('/admin/coupons', data);
  }

  async updateCoupon(id: string, data: UpdateCouponRequest): Promise<UpdateCouponResponse> {
    return await apiDataSource.patch<UpdateCouponResponse>(`/admin/coupons/${id}`, data);
  }

  async getCouponById(id: string): Promise<GetCouponResponse> {
    return await apiDataSource.get<GetCouponResponse>(`/admin/coupons/${id}`);
  }

  async deleteCoupon(id: string): Promise<void> {
    await this.updateCoupon(id, { isActive: false });
  }
}
