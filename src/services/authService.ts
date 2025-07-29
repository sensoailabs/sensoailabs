import { loginUser, logoutUser, validateToken } from '../api/auth';
import type { LoginRequest, LoginResponse } from '../api/auth';

// Serviço de autenticação integrado com API REST
export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: any = null;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login usando API REST
  public async login(email: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> {
    try {
      const loginData: LoginRequest = { email, password, rememberMe };
      const response = await loginUser(loginData);

      // Armazenar dados de autenticação
      this.token = response.token;
      this.user = response.user;

      // Salvar no storage apropriado
      if (rememberMe) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        localStorage.setItem('userEmail', response.user.email);
      } else {
        sessionStorage.setItem('authToken', response.token);
        sessionStorage.setItem('userData', JSON.stringify(response.user));
      }

      return response;
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Logout
  public async logout(): Promise<void> {
    try {
      if (this.token) {
        await logoutUser(this.token);
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar dados locais
      this.token = null;
      this.user = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('userEmail');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userData');
    }
  }

  // Verificar se está autenticado
  public async isAuthenticated(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const isValid = await validateToken(this.token);
      if (!isValid) {
        await this.logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      await this.logout();
      return false;
    }
  }

  // Obter token atual
  public getToken(): string | null {
    return this.token;
  }

  // Obter dados do usuário
  public getUser(): any {
    return this.user;
  }

  // Carregar dados do storage
  private loadFromStorage(): void {
    // Tentar localStorage primeiro (remember me)
    let token = localStorage.getItem('authToken');
    let userData = localStorage.getItem('userData');

    // Se não encontrar, tentar sessionStorage
    if (!token) {
      token = sessionStorage.getItem('authToken');
      userData = sessionStorage.getItem('userData');
    }

    if (token && userData) {
      this.token = token;
      try {
        this.user = JSON.parse(userData);
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
        this.logout();
      }
    }
  }

  // Interceptador para requisições HTTP
  public setupAxiosInterceptor(axiosInstance: any): void {
    // Request interceptor - adicionar token
    axiosInstance.interceptors.request.use(
      (config: any) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - tratar expiração de token
    axiosInstance.interceptors.response.use(
      (response: any) => {
        return response;
      },
      async (error: any) => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          await this.logout();
          // Redirecionar para login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Método para refresh token (se implementado no backend)
  public async refreshToken(): Promise<boolean> {
    try {
      // Implementar refresh token se necessário
      // Por enquanto, apenas validar token atual
      return await this.isAuthenticated();
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  }
}

// Instância singleton
export const authService = AuthService.getInstance();

// Serviço de autenticação para integração com a API
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  message: string;
  userId: number;
}

export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// URL base da API Supabase Edge Functions
const API_BASE_URL = 'https://kdpdpcwjdkcbuvjksokd.supabase.co/functions/v1';

/**
 * Função para registrar novo usuário
 */
export async function registerUser(userData: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data
      };
    }

    return data as RegisterResponse;
  } catch (error) {
    // Se é um erro da nossa API, re-throw
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }

    // Erro de rede ou outro erro
    throw {
      status: 500,
      error: 'Erro de conexão. Tente novamente.',
    };
  }
}

/**
 * Função para tratar erros da API
 */
export function getErrorMessage(error: any): string {
  if (error.details && Array.isArray(error.details)) {
    return error.details.map((detail: any) => detail.message).join(', ');
  }
  
  return error.error || 'Erro desconhecido';
}

/**
 * Função para obter erros específicos por campo
 */
export function getFieldErrors(error: any): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  if (error.details && Array.isArray(error.details)) {
    error.details.forEach((detail: any) => {
      fieldErrors[detail.field] = detail.message;
    });
  }
  
  return fieldErrors;
}