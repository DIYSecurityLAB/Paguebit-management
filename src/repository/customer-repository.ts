import apiClient from '../datasource/api-client';
import { CustomerModel, PaginatedResponse, PaginationParams } from '../models/types';

class CustomerRepository {
  async getCustomers(params: PaginationParams & {
    userId: string;
    email?: string;
    name?: string;
  }): Promise<PaginatedResponse<CustomerModel>> {
    return apiClient.get<PaginatedResponse<CustomerModel>>('/customers', { params });
  }

  async getCustomerById(id: string): Promise<CustomerModel> {
    return apiClient.get<CustomerModel>(`/customers/${id}`);
  }

  async createCustomer(customerData: {
    userId: string;
    email: string;
    name?: string;
    phone?: string;
  }): Promise<CustomerModel> {
    return apiClient.post<CustomerModel>('/customers', customerData);
  }

  async updateCustomer(id: string, customerData: {
    name?: string;
    phone?: string;
  }): Promise<CustomerModel> {
    return apiClient.put<CustomerModel>(`/customers/${id}`, customerData);
  }

  async deleteCustomer(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/customers/${id}`);
  }
}

export default new CustomerRepository();