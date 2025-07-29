// Configuração das rotas da API REST
export const API_ROUTES = {
  // Base URL da API
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  
  // Endpoints de autenticação
  AUTH: {
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh'
  },
  
  // Endpoints de usuário
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
    DELETE: '/api/user/delete'
  }
};

// Função helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_ROUTES.BASE_URL}${endpoint}`;
};

// Headers padrão para requisições
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Configuração de timeout para requisições
export const REQUEST_TIMEOUT = 10000; // 10 segundos