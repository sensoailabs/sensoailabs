// Integração Front-End com APIs REST de recuperação de senha
import { 
  forgotPasswordEndpoint, 
  resetPasswordEndpoint
} from '../api/restEndpoints';
import type { 
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from '../api/restEndpoints';

// Função para solicitar recuperação de senha
export const requestPasswordReset = async (email: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const request: ForgotPasswordRequest = { email };
    const response = await forgotPasswordEndpoint(request);
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'message' in response.data ? response.data.message : 'Sucesso'
      };
    }
    
    return {
      success: false,
      message: 'error' in response.data ? response.data.error : 'Erro desconhecido'
    };
    
  } catch (error) {
    console.error('Erro na solicitação de recuperação:', error);
    return {
      success: false,
      message: 'Erro de conexão. Tente novamente.'
    };
  }
};

// Função para redefinir senha
export const resetUserPassword = async (
  token: string, 
  newPassword: string, 
  confirmPassword: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const request: ResetPasswordRequest = {
      token,
      newPassword,
      confirmPassword
    };
    
    const response = await resetPasswordEndpoint(request);
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'message' in response.data ? response.data.message : 'Sucesso'
      };
    }
    
    return {
      success: false,
      message: 'error' in response.data ? response.data.error : 'Erro desconhecido'
    };
    
  } catch (error) {
    console.error('Erro na redefinição de senha:', error);
    return {
      success: false,
      message: 'Erro de conexão. Tente novamente.'
    };
  }
};

// Função para validar token na URL
export const validateTokenFromURL = (): {
  isValid: boolean;
  token: string | null;
  error?: string;
} => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
      return {
        isValid: false,
        token: null,
        error: 'Token não encontrado na URL'
      };
    }
    
    // Validação básica do formato do token
    if (token.length < 10) {
      return {
        isValid: false,
        token: null,
        error: 'Token inválido'
      };
    }
    
    return {
      isValid: true,
      token
    };
    
  } catch (error) {
    console.error('Erro ao validar token da URL:', error);
    return {
      isValid: false,
      token: null,
      error: 'Erro ao processar token'
    };
  }
};

// Função para redirecionamento automático após sucesso
export const redirectAfterSuccess = (delay: number = 3000): void => {
  setTimeout(() => {
    window.location.href = '/login';
  }, delay);
};

// Função para mostrar feedback visual
export const showFeedback = (
  message: string, 
  type: 'success' | 'error' | 'info' = 'info'
): void => {
  // Remover feedback anterior se existir
  const existingFeedback = document.getElementById('password-reset-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  // Criar elemento de feedback
  const feedbackElement = document.createElement('div');
  feedbackElement.id = 'password-reset-feedback';
  feedbackElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 9999;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
  `;
  
  // Definir cor baseada no tipo
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };
  
  feedbackElement.style.backgroundColor = colors[type];
  feedbackElement.textContent = message;
  
  // Adicionar animação CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Adicionar ao DOM
  document.body.appendChild(feedbackElement);
  
  // Remover após 5 segundos
  setTimeout(() => {
    feedbackElement.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (feedbackElement.parentNode) {
        feedbackElement.parentNode.removeChild(feedbackElement);
      }
    }, 300);
  }, 5000);
};

// Função para validar critérios de senha em tempo real
export const validatePasswordCriteria = (password: string): {
  isValid: boolean;
  criteria: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  score: number;
  strength: string;
} => {
  const criteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(criteria).filter(Boolean).length;
  
  const strengthLevels = {
    0: 'Muito fraca',
    1: 'Muito fraca',
    2: 'Fraca',
    3: 'Média',
    4: 'Forte',
    5: 'Muito forte'
  };
  
  return {
    isValid: score >= 4,
    criteria,
    score,
    strength: strengthLevels[score as keyof typeof strengthLevels]
  };
};

// Função para tratamento de todos os cenários de erro
export const handlePasswordResetError = (error: string): string => {
  const errorMappings: { [key: string]: string } = {
    'Token inválido ou expirado': 'O link de recuperação expirou ou é inválido. Solicite um novo link.',
    'Nova senha não atende aos critérios': 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.',
    'As senhas não coincidem': 'As senhas digitadas não são iguais. Verifique e tente novamente.',
    'Todos os campos são obrigatórios': 'Preencha todos os campos obrigatórios.',
    'E-mail é obrigatório': 'Digite seu e-mail para continuar.',
    'Formato de e-mail inválido': 'Digite um e-mail válido.',
    'Erro interno do servidor': 'Ocorreu um erro interno. Tente novamente em alguns minutos.',
    'Erro de conexão. Tente novamente.': 'Verifique sua conexão com a internet e tente novamente.'
  };
  
  return errorMappings[error] || error;
};

// Função para loading state durante requisições
export const setLoadingState = (isLoading: boolean, buttonId: string): void => {
  const button = document.getElementById(buttonId) as HTMLButtonElement;
  if (!button) return;
  
  if (isLoading) {
    button.disabled = true;
    button.style.opacity = '0.6';
    button.style.cursor = 'not-allowed';
    
    // Adicionar spinner se não existir
    if (!button.querySelector('.loading-spinner')) {
      const spinner = document.createElement('span');
      spinner.className = 'loading-spinner';
      spinner.style.cssText = `
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      `;
      
      // Adicionar animação de rotação
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      button.insertBefore(spinner, button.firstChild);
    }
  } else {
    button.disabled = false;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
    
    // Remover spinner
    const spinner = button.querySelector('.loading-spinner');
    if (spinner) {
      spinner.remove();
    }
  }
};