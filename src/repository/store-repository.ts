import apiClient from '../datasource/api-client';
import { Store, PaginatedResponse, StoreQueryParams } from '../models/types';

class StoreRepository {
  async getStores(params?: StoreQueryParams): Promise<PaginatedResponse<Store>> {
    const safeParams = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries(safeParams).filter(([_, value]) =>
        value !== undefined && value !== null && value !== ''
      )
    );
    if (!cleanParams.page) cleanParams.page = 1;
    if (!cleanParams.limit) cleanParams.limit = 10;
    return apiClient.get<PaginatedResponse<Store>>('/admin/stores', { params: cleanParams });
  }

  async getStoreById(id: string, whitelabelId?: string): Promise<Store> {
    const params = whitelabelId ? { whitelabelId } : undefined;
    return apiClient.get<Store>(`/admin/stores/${id}`, { params });
  }
}

export default new StoreRepository();
