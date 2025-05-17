import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';

export class ApiClient {
  private api: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'https://organic-couscous-9pvwvj4rgqgfggg-3008.app.github.dev',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        // Não envia o header Authorization para rotas públicas
        const publicRoutes = ['/auth/login', '/auth/me'];
        const isPublic = publicRoutes.some(route => config.url?.includes(route));
        if (token && !isPublic) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          delete config.headers.Authorization;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Format dates
        this.formatDates(response.data);
        return response;
      },
      (error: AxiosError) => {
        // Handle authentication errors
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
        }

        // Handle server errors
        if (error.response?.status === 500) {
          toast.error('Server error. Please try again later.');
        }

        return Promise.reject(error);
      }
    );
  }

  // Recursively find date strings and convert them to Date objects
  private formatDates(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      if (obj[key] === null) continue;

      if (typeof obj[key] === 'string') {
        // Check if string is a valid ISO date
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
        if (isoDateRegex.test(obj[key])) {
          obj[key] = new Date(obj[key]);
        }
      } else if (typeof obj[key] === 'object') {
        this.formatDates(obj[key]);
      }
    }
  }

  // Convert base64 to blob for file downloads
  public base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

 
  downloadBase64File(base64Data: string, fileName: string, contentType: string = 'application/octet-stream'): void {
    // Verifica se já é um Data URL completo ou apenas a string base64
    const dataUrl = base64Data.startsWith('data:') 
      ? base64Data 
      : `data:${contentType};base64,${base64Data}`;
    
    // Cria um elemento <a> temporário para realizar o download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    
    // Adiciona, clica e remove o elemento para iniciar o download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default ApiClient.getInstance();