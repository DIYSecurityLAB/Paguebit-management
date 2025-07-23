import apiClient from '../datasource/api-client';
import { 
  PaginatedResponse, 
  WithdrawalQueryParams, 
  Withdrawal, 
  WithdrawalStatusUpdate,
  AdminUpdateWithdrawalStatusDto
} from '../models/types';

class WithdrawalRepository {
  async getWithdrawals(params?: WithdrawalQueryParams & { storeId?: string }): Promise<PaginatedResponse<Withdrawal>> {
    console.log('Solicitando saques com parâmetros:', params);
    
    // Remover parâmetros vazios
    const cleanParams = params ? Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    ) : {};
    
    try {
      const { data } = await apiClient.get<any>('/admin/withdrawals', { params: cleanParams });
      console.log('Resposta da API de saques (data):', data);
      
      // Adapta o formato do backend para o frontend (igual aos outros repositórios)
      if (data && Array.isArray(data.data) && typeof data.total === 'number') {
        return {
          data: data.data,
          pagination: {
            total: data.total,
            page: data.page || 1,
            limit: data.limit || 10,
            pages: data.pages || Math.ceil(data.total / (data.limit || 10))
          }
        };
      }
      
      // Fallback para formato antigo
      if (data && data.data && data.pagination) {
        return data;
      }
      
      console.warn('Formato inesperado de resposta da API de saques:', data);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 1 }
      };
    } catch (error) {
      console.error('Erro ao buscar saques:', error);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 1 }
      };
    }
  }

  async getWithdrawalById(id: string): Promise<Withdrawal & { payments?: any[]; store?: any }> {
    // Usa a rota admin e retorna o modelo completo, incluindo arrays e campos extras
    const { data } = await apiClient.get<Withdrawal & { payments?: any[]; store?: any }>(`/admin/withdrawals/${id}`);
    return data;
  }

  async updateWithdrawalStatus(data: WithdrawalStatusUpdate): Promise<Withdrawal> {
    // PATCH na rota admin
    const patchData: AdminUpdateWithdrawalStatusDto = {
      status: data.status,
      // Só inclui txId se existir
      ...(data.txId ? { txId: data.txId } : {}),
      // Só inclui failedReason se existir
      ...(data.failedReason ? { failedReason: data.failedReason } : {}),
    };
    const { data: updated } = await apiClient.patch<Withdrawal>(`/admin/withdrawals/${data.id}/status`, patchData);
    return updated;
  }

  async completeWithdrawal(data: { id: string; txId: string; notes?: string }): Promise<Withdrawal> {
    // PATCH na rota admin, status = 'completed'
    const patchData: AdminUpdateWithdrawalStatusDto = {
      status: 'completed',
      txId: data.txId,
    };
    const { data: updated } = await apiClient.patch<Withdrawal>(`/admin/withdrawals/${data.id}/status`, patchData);
    return updated;
  }

}

export default new WithdrawalRepository();