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

    // Log global para requisições
    this.api.interceptors.request.use((config) => {
      // Adiciona API Key e Token do Firebase se existirem
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
      // Adiciona o token do Firebase no header para registro de usuário
      if (
        config.url &&
        config.url.includes("/users") &&
        config.method?.toLowerCase() === "post" &&
        token
      ) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      // Log do corpo enviado
      let dataString = "";
      if (config.data) {
        try {
          dataString = typeof config.data === "string" ? config.data : JSON.stringify(config.data, null, 2);
        } catch {
          dataString = String(config.data);
        }
      }
      // Log dos headers enviados
      let headersString = "";
      try {
        headersString = JSON.stringify(config.headers, null, 2);
      } catch {
        headersString = String(config.headers);
      }
      // Log do objeto completo da requisição
      let configString = "";
      try {
        configString = JSON.stringify(config, null, 2);
      } catch {
        configString = String(config);
      }
      console.log(
        `[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}\n` +
        (dataString ? `Corpo enviado:\n${dataString}\n` : "Sem corpo enviado\n") +
        `Headers enviados:\n${headersString}\n` +
        `Requisição completa:\n${configString}\n`
      );
      return config;
    });

    // Log global para respostas
    this.api.interceptors.response.use(
      (response) => {
        let responseString = "";
        if (response.data) {
          try {
            responseString = typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2);
          } catch {
            responseString = String(response.data);
          }
        }
        // Log dos headers recebidos
        let headersString = "";
        try {
          headersString = JSON.stringify(response.headers, null, 2);
        } catch {
          headersString = String(response.headers);
        }
        // Log do objeto completo da resposta
        let responseObjString = "";
        try {
          responseObjString = JSON.stringify(response, null, 2);
        } catch {
          responseObjString = String(response);
        }
        console.log(
          `[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url}\n` +
          (responseString ? `Corpo recebido:\n${responseString}\n` : "Sem corpo recebido\n") +
          `Headers recebidos:\n${headersString}\n` +
          `Resposta completa:\n${responseObjString}\n`
        );
        return response;
      },
      (error) => {
        // Log de erro também
        if (error.response) {
          let responseString = "";
          if (error.response.data) {
            try {
              responseString = typeof error.response.data === "string" ? error.response.data : JSON.stringify(error.response.data, null, 2);
            } catch {
              responseString = String(error.response.data);
            }
          }
          // Log dos headers recebidos no erro
          let headersString = "";
          try {
            headersString = JSON.stringify(error.response.headers, null, 2);
          } catch {
            headersString = String(error.response.headers);
          }
          // Log do objeto completo da resposta de erro
          let responseObjString = "";
          try {
            responseObjString = JSON.stringify(error.response, null, 2);
          } catch {
            responseObjString = String(error.response);
          }
          console.log(
            `[API RESPONSE ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}\n` +
            (responseString ? `Corpo recebido (erro):\n${responseString}\n` : "Sem corpo recebido\n") +
            `Headers recebidos (erro):\n${headersString}\n` +
            `Resposta completa (erro):\n${responseObjString}\n`
          );
        }
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

export default new ApiDataSource();

