import apiClient from '../datasource/api-client';
import { PaginatedResponse, PaginationParams, User, UserCreateInput, UserStats, AuditLogInput } from '../models/types';
import auditRepository from './audit-repository';

interface UserQueryParams extends PaginationParams {
  name?: string;
  email?: string;
}

class UserRepository {
  async getUsers(params?: UserQueryParams): Promise<PaginatedResponse<User>> {
    // Garantir que o parâmetro é um objeto
    const safeParams = params || {};
    
    // Remover propriedades vazias ou indefinidas dos parâmetros
    const cleanParams = Object.fromEntries(
      Object.entries(safeParams).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );
    
    console.log("Parâmetros da requisição de usuários:", cleanParams);
    
    // Garantir que sempre incluímos paginação básica mesmo que os filtros estejam vazios
    if (!cleanParams.page) {
      cleanParams.page = 1;
    }
    
    if (!cleanParams.limit) {
      cleanParams.limit = 10;
    }
    
    // Garantir que o orderBy seja um dos valores permitidos pela API
    if (!cleanParams.orderBy || !['createdAt', 'email', 'firstName'].includes(cleanParams.orderBy)) {
      cleanParams.orderBy = 'createdAt';
      cleanParams.order = 'desc';
    }
    
    return apiClient.get<PaginatedResponse<User>>('/users', { params: cleanParams });
  }

  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  async createUser(user: UserCreateInput, currentUserId?: string): Promise<User> {
    const result = await apiClient.post<User>('/users', user);
    if (currentUserId) {
      const audit: AuditLogInput = {
        userId: currentUserId,
        action: 'Criação de usuário',
        affectedUserId: result.id,
        newValue: JSON.stringify(user),
      };
      auditRepository.createAuditLog(audit).catch(() => {});
    }
    return result;
  }

  async updateUser(id: string, userData: Partial<User>, currentUserId?: string, previousUser?: User): Promise<User> {
    const result = await apiClient.put<User>(`/users/${id}`, userData);
    if (currentUserId) {
      const audit: AuditLogInput = {
        userId: currentUserId,
        action: 'Atualização de usuário',
        affectedUserId: id,
        previousValue: previousUser ? JSON.stringify(previousUser) : undefined,
        newValue: JSON.stringify(userData),
      };
      auditRepository.createAuditLog(audit).catch(() => {});
    }
    return result;
  }

  async deleteUser(id: string, currentUserId?: string, previousUser?: User): Promise<{ message: string }> {
    const result = await apiClient.delete<{ message: string }>(`/users/${id}`);
    if (currentUserId) {
      const audit: AuditLogInput = {
        userId: currentUserId,
        action: 'Exclusão de usuário',
        affectedUserId: id,
        previousValue: previousUser ? JSON.stringify(previousUser) : undefined,
      };
      auditRepository.createAuditLog(audit).catch(() => {});
    }
    return result;
  }

  async getUserStats(): Promise<UserStats> {
    return apiClient.get<UserStats>('/users/stats');
  }

  async exportUsers(): Promise<User[]> {
    try {
      // Usa a API padrão de usuários com parâmetros otimizados para exportação
      const response = await this.getUsers({
        page: 1,
        limit: 1000, // Limite alto para exportar o máximo possível
        orderBy: 'createdAt',
        order: 'desc'
      });
      
      if (!response?.data || !Array.isArray(response.data)) {
        throw new Error('Formato de dados inválido recebido da API');
      }
      
      // Enriquecer dados para melhor apresentação, se necessário
      const enrichedData = response.data.map(user => ({
        ...user,
        // Aqui pode-se adicionar campos calculados ou formatados se necessário
      }));
      
      return enrichedData;
    } catch (error) {
      console.error('Erro ao obter dados para exportação:', error);
      throw error;
    }
  }
}

export default new UserRepository();