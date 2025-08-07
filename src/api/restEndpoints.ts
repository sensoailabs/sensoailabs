// APIs REST para recuperação de senha
import { supabase } from '../lib/supabase';
// import { API_ROUTES, buildApiUrl, DEFAULT_HEADERS, REQUEST_TIMEOUT } from '../config/apiRoutes';

// Importação do serviço de e-mail
import { sendPasswordResetEmail } from '../services/emailService';

// Interfaces para os endpoints
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

// ENDPOINT 1: POST /api/auth/forgot-password
export const forgotPasswordEndpoint = async (
  request: ForgotPasswordRequest
): Promise<{ status: number; data: ForgotPasswordResponse | ErrorResponse }> => {
  try {
    const { email } = request;

    // Validação básica
    if (!email || !email.trim()) {
      return {
        status: 400,
        data: { error: 'E-mail é obrigatório' }
      };
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        status: 400,
        data: { error: 'Formato de e-mail inválido' }
      };
    }

    // Verificar se e-mail existe e usuário está ativo
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, is_active')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    // Se usuário não existe ou está inativo, ainda retorna sucesso (segurança)
    if (userError || !userData) {
      console.log('E-mail não encontrado ou usuário inativo:', email);
      return {
        status: 200,
        data: { message: 'Se o e-mail estiver cadastrado, você receberá instruções' }
      };
    }

    // Gerar token seguro usando a função do banco
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('create_password_reset_token', { p_user_id: userData.id });

    if (tokenError) {
      console.error('Erro ao criar token:', tokenError);
      return {
        status: 500,
        data: { error: 'Erro interno do servidor' }
      };
    }

    // Enviar e-mail com link de recuperação
    try {
      await sendPasswordResetEmail(userData.email, userData.name, tokenData);
      console.log('E-mail de recuperação enviado para:', userData.email);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
      // Não falha a operação, apenas loga o erro
    }

    // Sempre retorna sucesso (não revela se e-mail existe)
    return {
      status: 200,
      data: { message: 'Se o e-mail estiver cadastrado, você receberá instruções' }
    };

  } catch (error) {
    console.error('Erro no endpoint forgot-password:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT 2: POST /api/auth/reset-password
export const resetPasswordEndpoint = async (
  request: ResetPasswordRequest
): Promise<{ status: number; data: ResetPasswordResponse | ErrorResponse }> => {
  try {
    const { token, newPassword, confirmPassword } = request;

    // Validações básicas
    if (!token || !newPassword || !confirmPassword) {
      return {
        status: 400,
        data: { error: 'Todos os campos são obrigatórios' }
      };
    }

    // Verificar se senhas coincidem
    if (newPassword !== confirmPassword) {
      return {
        status: 400,
        data: { error: 'As senhas não coincidem' }
      };
    }

    // Validar critérios de segurança da senha
    const passwordValidation = validatePasswordSecurity(newPassword);
    if (!passwordValidation.isValid) {
      return {
        status: 400,
        data: { error: `Nova senha não atende aos critérios: ${passwordValidation.errors.join(', ')}` }
      };
    }

    // Validar token (existe, não expirado, não usado)
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_resets')
      .select(`
        id,
        user_id,
        token,
        expires_at,
        is_used,
        users!inner(id, email, is_active)
      `)
      .eq('token', token)
      .eq('is_used', false)
      .single();

    if (tokenError || !tokenData) {
      return {
        status: 400,
        data: { error: 'Token inválido ou expirado' }
      };
    }

    // Verificar se token não expirou
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return {
        status: 400,
        data: { error: 'Token inválido ou expirado' }
      };
    }

    // Verificar se usuário está ativo
    const user = Array.isArray(tokenData.users) ? tokenData.users[0] : tokenData.users;
    if (!user.is_active) {
      return {
        status: 400,
        data: { error: 'Token inválido ou expirado' }
      };
    }

    // Criptografar nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha do usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return {
        status: 500,
        data: { error: 'Erro interno do servidor' }
      };
    }

    // Marcar token como usado
    const { error: tokenUpdateError } = await supabase
      .from('password_resets')
      .update({
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    if (tokenUpdateError) {
      console.error('Erro ao marcar token como usado:', tokenUpdateError);
    }

    // Invalidar todas as sessões ativas do usuário (se existir tabela de sessões)
    try {
      await invalidateUserSessions(tokenData.user_id);
    } catch (sessionError) {
      console.error('Erro ao invalidar sessões:', sessionError);
    }

    console.log('Senha redefinida com sucesso para user_id:', tokenData.user_id);

    return {
      status: 200,
      data: { message: 'Senha redefinida com sucesso' }
    };

  } catch (error) {
    console.error('Erro no endpoint reset-password:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// Função para validar critérios de segurança da senha
const validatePasswordSecurity = (password: string) => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('mínimo 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('pelo menos 1 letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('pelo menos 1 letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('pelo menos 1 número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('pelo menos 1 caractere especial');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Função para criptografar senha
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Função para invalidar sessões do usuário
const invalidateUserSessions = async (userId: number): Promise<void> => {
  // Implementar quando houver tabela de sessões
  // Por enquanto, apenas loga a ação
  console.log('Invalidando sessões para user_id:', userId);
};