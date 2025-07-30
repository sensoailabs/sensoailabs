import { supabase } from '../lib/supabase';

// Serviço de autenticação integrado com Supabase
export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login usando Supabase Auth
  public async login(email: string, password: string, rememberMe: boolean = false): Promise<any> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Buscar dados do usuário na tabela public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, profile, photo_url, is_active')
        .eq('email', email)
        .single();

      if (userError) {
        console.warn('Usuário não encontrado na tabela users:', userError);
      }

      // Salvar preferência de lembrar usuário
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      return {
        success: true,
        message: 'Login realizado com sucesso!',
        user: data.user,
        session: data.session,
        userData: userData // Dados da tabela public.users
      };
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw {
        status: error.status || 400,
        error: error.message || 'Erro interno do servidor'
      };
    }
  }

  // Logout
  public async logout(): Promise<void> {
    try {
      // Limpar dados locais primeiro
      localStorage.removeItem('rememberedEmail');
      
      // Limpar dados do Supabase Auth do localStorage
      // Isso força o logout sem fazer requisições de rede
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-kdpdpcwjdkcbuvjksokd-auth-token')) {
          localStorage.removeItem(key);
        }
      });
      
      // Tentar signOut silencioso (pode falhar, mas não importa)
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (signOutError) {
        // Ignorar erro do signOut, pois já limpamos manualmente
        console.log('SignOut ignorado, logout manual realizado');
      }
      
    } catch (error) {
      console.warn('Erro no logout, mas dados foram limpos:', error);
    }
  }

  // Verificar se está autenticado
  public async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  // Obter usuário atual
  public async getUser(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
  }

  // Obter sessão atual
  public async getSession(): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
  }

  // Obter dados completos do usuário da tabela public.users
  public async getUserData(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, email, profile, photo_url, is_active, created_at, updated_at, last_login')
        .eq('email', user.email)
        .single();

      if (error) {
        console.warn('Usuário não encontrado na tabela users:', error);
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
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