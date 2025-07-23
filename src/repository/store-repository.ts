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

    // Log dos parâmetros usados na busca
    console.log('[StoreRepository] getStores - params:', cleanParams);

    const response = await apiClient.get<PaginatedResponse<Store>>('/admin/stores', { params: cleanParams });

    // Log da resposta bruta da API
    console.log('[StoreRepository] getStores - raw response:', response);

    // Log da estrutura dos dados retornados
    if (response && response.data) {
      console.log('[StoreRepository] getStores - response.data:', response.data);
      if (Array.isArray(response.data.data)) {
        console.log('[StoreRepository] getStores - response.data.data (array):', response.data.data);
      } else {
        console.log('[StoreRepository] getStores - response.data.data (NÃO É ARRAY):', response.data.data);
      }
    } else {
      console.log('[StoreRepository] getStores - response.data está indefinido ou nulo');
    }

    // Log do retorno final
    console.log('[StoreRepository] getStores - retorno final:', response.data);

    return response.data;
  }

  async getStoreById(id: string, whitelabelId?: string): Promise<Store> {
    const params = whitelabelId ? { whitelabelId } : undefined;
    return apiClient.get<Store>(`/admin/stores/${id}`, { params });
  }
}

export default new StoreRepository();
