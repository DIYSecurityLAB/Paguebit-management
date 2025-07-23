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
        // Log da requisição
        console.log('[ApiClient] Request:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data
        });

        const token = localStorage.getItem('token');
        // Não envia o header Authorization para rotas públicas
        const publicRoutes = ['/auth/login', '/auth/me'];
        const urlPath = config.url ? new URL(config.url, this.api.defaults.baseURL).pathname : '';
        const isPublic = publicRoutes.includes(urlPath);
        if (token && !isPublic) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          delete config.headers.Authorization;
        }
        // Adiciona o header x-public-api-token para rotas públicas
        if (isPublic) {
          const publicApiToken = import.meta.env.VITE_PUBLIC_API_TOKEN;
          if (publicApiToken) {
            config.headers['x-public-api-token'] = publicApiToken;
          }
        } else {
          delete config.headers['x-public-api-token'];
        }

        // Sempre adiciona o header x-api-key
        const apiKey = import.meta.env.VITE_API_KEY;
        if (apiKey) {
          config.headers['x-api-key'] = apiKey;
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

      // Se for objeto vazio, troca para null
      if (typeof obj[key] === 'object' && Object.keys(obj[key]).length === 0) {
        obj[key] = null;
        continue;
      }

      if (typeof obj[key] === 'string') {
        // Regex mais flexível para datas ISO
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
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

  private logCleanedData(label: string, data: any) {
    // Remove campos base64 longos do log
    function clean(obj: any): any {
      if (Array.isArray(obj)) {
        return obj.map(clean);
      }
      if (obj && typeof obj === 'object') {
        const copy: any = {};
        for (const key in obj) {
          if (
            (key === 'receipt' || key === 'pictureUrl' || key === 'picture_url') &&
            typeof obj[key] === 'string' &&
            obj[key].length > 50
          ) {
            copy[key] = `[base64 omitido: ${obj[key].length} chars]`;
          } else {
            copy[key] = clean(obj[key]);
          }
        }
        return copy;
      }
      return obj;
    }
    // Log bonito e fácil de copiar
    console.log(label, JSON.stringify(clean(data), null, 2));
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<{ raw: AxiosResponse<T, any>, data: T }> {
    const response: AxiosResponse<T, any> = await this.api.get(url, config);
    this.logCleanedData('[ApiClient] Raw data:', response.data);
    return { raw: response, data: response.data };
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ raw: AxiosResponse<T, any>, data: T }> {
    const response: AxiosResponse<T, any> = await this.api.post(url, data, config);
    this.logCleanedData('[ApiClient] Raw data:', response.data);
    return { raw: response, data: response.data };
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ raw: AxiosResponse<T, any>, data: T }> {
    const response: AxiosResponse<T, any> = await this.api.put(url, data, config);
    this.logCleanedData('[ApiClient] Raw data:', response.data);
    return { raw: response, data: response.data };
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<{ raw: AxiosResponse<T, any>, data: T }> {
    const response: AxiosResponse<T, any> = await this.api.delete(url, config);
    this.logCleanedData('[ApiClient] Raw data:', response.data);
    return { raw: response, data: response.data };
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ raw: AxiosResponse<T, any>, data: T }> {
    const response: AxiosResponse<T, any> = await this.api.patch(url, data, config);
    this.logCleanedData('[ApiClient] Raw data:', response.data);
    return { raw: response, data: response.data };
  }
}

export default ApiClient.getInstance();