import { AdminListStoresReq, AdminListStoresRes } from "../model/store.model";
import { apiDataSource } from "../datasource/api.datasource";

export class StoreRepository {
  async listStores(params?: AdminListStoresReq): Promise<AdminListStoresRes> {
    return await apiDataSource.get<AdminListStoresRes>('/admin/stores', { params });
  }

  async getStoreById(id: string): Promise<AdminListStoresRes> {
    return await apiDataSource.get<AdminListStoresRes>(`/admin/stores/${id}`);
  }
}
