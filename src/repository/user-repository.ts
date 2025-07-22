import apiClient from '../datasource/api-client';
import { PaginatedResponse, PaginationParams, User, UserCreateInput, UserStats, UserUpdateInput } from '../models/types';

interface UserQueryParams extends PaginationParams {
  name?: string;
  email?: string;
}

class UserRepository {
  async getUsers(params?: UserQueryParams & { storeId?: string }): Promise<PaginatedResponse<User>> {
    const safeParams = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries(safeParams).filter(([_, value]) =>
        value !== undefined && value !== null && value !== ''
      )
    );
    console.log("Parâmetros da requisição de usuários:", cleanParams);

    if (!cleanParams.page) cleanParams.page = 1;
    if (!cleanParams.limit) cleanParams.limit = 10;
    if (!cleanParams.orderBy || !['createdAt', 'email', 'firstName'].includes(cleanParams.orderBy)) {
      cleanParams.orderBy = 'createdAt';
      cleanParams.order = 'desc';
    }

    try {
      const { data } = await apiClient.get<any>('/admin/users', { params: cleanParams });
      // Adapta o formato do backend para o frontend
      if (data && Array.isArray(data.data) && typeof data.total === 'number') {
        return {
          data: data.data,
          pagination: {
            total: data.total,
            page: data.page || 1,
            limit: data.limit || 10
          }
        };
      }
      // fallback para formato antigo
      if (data && data.data && data.pagination) {
        return data;
      }
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10 }
      };
    } catch (err) {
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10 }
      };
    }
  }

  async getUserById(id: string): Promise<User> {
    const { data } = await apiClient.get<User>(`/admin/users/${id}`);
    return data;
  }

  async createUser(user: UserCreateInput, currentUserId?: string): Promise<User> {
    const result = await apiClient.post<User>('/users', user);
    return result;
  }

  async updateUser(id: string, userData: UserUpdateInput, currentUserId?: string, previousUser?: User): Promise<User> {
    // Remove campos undefined do objeto enviado
    const patchData: Record<string, any> = {};
    if (userData.active !== undefined) patchData.active = userData.active;
    if (userData.referral !== undefined) patchData.referral = userData.referral;
    if (userData.phoneNumber !== undefined) patchData.phoneNumber = userData.phoneNumber;

    // PATCH na rota admin
    const { data } = await apiClient.patch<User>(`/admin/users/${id}`, patchData);
    return data;
  }

  async deleteUser(id: string, currentUserId?: string, previousUser?: User): Promise<{ message: string }> {
    const result = await apiClient.delete<{ message: string }>(`/users/${id}`);
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