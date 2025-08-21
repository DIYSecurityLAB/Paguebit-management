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
        // Log seguro, sem headers
        if (error.response) {
          console.error("[API][ERRO]", error.message, "Status:", error.response.status);
        } else {
          console.error("[API][ERRO]", error.message);
        }
        // Remove headers do erro antes de propagar
        if (error.config && error.config.headers) {
          error.config.headers = undefined;
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log("[API][GET] Enviando para:", url);
    const response: AxiosResponse<T> = await this.api.get(url, config);
    console.log("[API][GET] Resposta de:", url);
    return response.data;
  }

  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    console.log("[API][POST] Enviando para:", url);
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    console.log("[API][POST] Resposta de:", url);
    return response.data;
  }

  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    console.log("[API][PUT] Enviando para:", url);
    const response: AxiosResponse<T> = await this.api.put(url, data, config);
    console.log("[API][PUT] Resposta de:", url);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log("[API][DELETE] Enviando para:", url);
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    console.log("[API][DELETE] Resposta de:", url);
    return response.data;
  }

  async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    console.log("[API][PATCH] Enviando para:", url);
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    console.log("[API][PATCH] Resposta de:", url);
    return response.data;
  }
}

export const apiDataSource = new ApiDataSource();
