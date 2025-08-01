import {
  AdminListStoresReq,
  AdminListStoresRes,
  CreateFeeRuleRequest,
  UpdateFeeRuleRequest,
  CreateFeeRuleResponse,
  UpdateFeeRuleResponse,
  ListFeeRulesResponse,
} from "../model/store.model";
import { apiDataSource } from "../datasource/api.datasource";

export class StoreRepository {
  async listStores(params?: AdminListStoresReq): Promise<AdminListStoresRes> {
    return await apiDataSource.get<AdminListStoresRes>('/admin/stores', { params });
  }

  async getStoreById(id: string): Promise<AdminListStoresRes> {
    return await apiDataSource.get<AdminListStoresRes>(`/admin/stores/${id}`);
  }

  async listStoreFeeRules(storeId: string): Promise<ListFeeRulesResponse> {
    return await apiDataSource.get<ListFeeRulesResponse>(`/admin/stores/${storeId}/fee-rules`);
  }

  async createStoreFeeRule(storeId: string, data: CreateFeeRuleRequest): Promise<CreateFeeRuleResponse> {
    return await apiDataSource.post<CreateFeeRuleResponse>(`/admin/stores/${storeId}/fee-rules`, data);
  }

  async updateFeeRule(id: string, data: UpdateFeeRuleRequest): Promise<UpdateFeeRuleResponse> {
    return await apiDataSource.patch<UpdateFeeRuleResponse>(`/admin/fee-rules/${id}`, data);
  }
}
