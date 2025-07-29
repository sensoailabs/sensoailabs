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