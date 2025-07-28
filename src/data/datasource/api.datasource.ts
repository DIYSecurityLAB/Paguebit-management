import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
 
class ApiDataSource {
  private api: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3008";
    this.api = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 60000,
    });

    // Interceptor de requisição sem logs de corpo e headers
    this.api.interceptors.request.use((config) => {
      const apiKey = import.meta.env.VITE_API_KEY;
      const publicApiToken = import.meta.env.VITE_PUBLIC_API_TOKEN;
      const token = localStorage.getItem("FIREBASE_TOKEN");

      if (apiKey) config.headers["x-api-key"] = apiKey;
      if (token) config.headers["Authorization"] = `Bearer ${token}`;
      if (
        config.url &&
        (config.url.includes("/auth/login") || config.url.includes("/auth/me")) &&
        publicApiToken
      ) {
        config.headers["x-public-api-token"] = publicApiToken;
      }
      if (
        config.url &&
        config.url.includes("/users") &&
        config.method?.toLowerCase() === "post" &&
        token
      ) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      // Nenhum log aqui
      return config;
    });

    // Interceptor de resposta sem logs de corpo e headers
    this.api.interceptors.response.use(
      (response) => {
        // Nenhum log aqui
        return response;
      },
      (error) => {
        // Nenhum log aqui
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    return response.data;
  }

  async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    return response.data;
  }
}

export const apiDataSource = new ApiDataSource();
 