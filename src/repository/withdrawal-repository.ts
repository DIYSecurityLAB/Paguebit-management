import apiClient from '../datasource/api-client';
import { 
  PaginatedResponse, 
  WithdrawalQueryParams, 
  Withdrawal, 
  WithdrawalCompleteInput, 
  WithdrawalStatusUpdate,
  AuditLogInput
} from '../models/types';
import auditRepository from './audit-repository';

class WithdrawalRepository {
  async getWithdrawals(params?: WithdrawalQueryParams & { storeId?: string }): Promise<PaginatedResponse<Withdrawal>> {
    console.log('Solicitando saques com parâmetros:', params);
    
    // Remover parâmetros vazios
    const cleanParams = params ? Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    ) : {};
    
    try {
      const response = await apiClient.get<unknown>('/admin/withdrawals', { params: cleanParams });
      console.log('Resposta bruta da API de saques:', response);

      // Checagem de tipo segura
      if (typeof response === 'object' && response !== null) {
        if ('withdrawals' in response) {
          const r = response as { withdrawals: Withdrawal[]; pagination?: any };
          return {
            data: Array.isArray(r.withdrawals) ? r.withdrawals : [],
            pagination: r.pagination || { total: 0, page: 1, limit: 10 }
          };
        } else if ('data' in response) {
          return response as PaginatedResponse<Withdrawal>;
        } else if (Array.isArray(response)) {
          return {
            data: response as Withdrawal[],
            pagination: { total: response.length, page: 1, limit: response.length }
          };
        }
      }
      
      // Caso não consiga identificar o formato, retorna um objeto vazio
      console.warn('Formato de resposta não reconhecido:', response);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10 }
      };
    } catch (error) {
      console.error('Erro ao buscar saques:', error);
      throw error;
    }
  }

  async getWithdrawalById(id: string): Promise<Withdrawal> {
    return apiClient.get<Withdrawal>(`/withdrawals/${id}`);
  }

  async createWithdrawal(withdrawalData: {
    userId: string;
    amount: number;
    paymentIds: string[];
    destinationWallet: string;
    destinationWalletType: string;
  }, currentUserId?: string): Promise<Withdrawal> {
    const result = await apiClient.post<Withdrawal>('/withdrawals', withdrawalData);
    if (currentUserId) {
      const audit: AuditLogInput = {
        userId: currentUserId,
        action: 'Criação de saque',
        withdrawalId: result.id,
        newValue: JSON.stringify(withdrawalData),
      };
      auditRepository.createAuditLog(audit).catch(() => {});
    }
    return result;
  }

  async completeWithdrawal(data: WithdrawalCompleteInput, currentUserId?: string, previousWithdrawal?: Withdrawal): Promise<Withdrawal> {
    const result = await apiClient.put<Withdrawal>(`/withdrawals/${data.id}/complete`, {
      txId: data.txId,
      notes: data.notes
    });
    if (currentUserId) {
      const audit: AuditLogInput = {
        userId: currentUserId,
        action: 'Conclusão de saque',
        withdrawalId: data.id,
        previousValue: previousWithdrawal ? JSON.stringify(previousWithdrawal) : undefined,
        newValue: JSON.stringify(data),
      };
      auditRepository.createAuditLog(audit).catch(() => {});
    }
    return result;
  }

    async updateWithdrawalStatus(data: WithdrawalStatusUpdate, currentUserId?: string, previousWithdrawal?: Withdrawal): Promise<Withdrawal> {
      const result = await apiClient.put<Withdrawal>(`/withdrawals/${data.id}/status`, {
        status: data.status,
        failedReason: data.failedReason,
        // Envia o hash da transação ao atualizar status para completed
        txId: data.status === 'completed' ? data.txId : undefined
      });
      if (currentUserId) {
        const audit: AuditLogInput = {
          userId: currentUserId,
          action: 'Atualização de status de saque',
          withdrawalId: data.id,
          previousValue: previousWithdrawal ? JSON.stringify(previousWithdrawal) : undefined,
          newValue: JSON.stringify(data),
        };
        auditRepository.createAuditLog(audit).catch(() => {});
      }
      return result;
    }
}

export default new WithdrawalRepository();