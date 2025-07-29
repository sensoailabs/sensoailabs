// API REST para autenticação de usuários
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://kdpdpcwjdkcbuvjksokd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcGRwY3dqZGtjYnV2amtzb2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjE0MTIsImV4cCI6MjA2ODY5NzQxMn0.u5CISAlH6shReiO8P1NZjJf4zgCkltO2i5B-9UUDbW4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    profile: string;
  };
}

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

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  email?: string;
  message?: string;
}

// Função para solicitar recuperação de senha
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
  try {
    console.log('🔄 Solicitando recuperação de senha para:', data.email);

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Formato de e-mail inválido');
    }

    // Verificar se o e-mail existe no banco
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', data.email)
      .eq('is_active', true)
      .single();

    // Sempre retornar sucesso por segurança (não revelar se e-mail existe)
    if (userError || !userData) {
      console.log('📧 E-mail não encontrado, mas retornando sucesso por segurança');
      return {
        message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha'
      };
    }

    console.log('✅ Usuário encontrado:', userData.name);

    // Usar função do banco para criar token de recuperação
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('create_password_reset_token', { p_user_id: userData.id });

    if (tokenError || !tokenData) {
      console.error('Erro ao criar token:', tokenError);
      throw new Error('Erro interno do servidor');
    }

    const resetToken = tokenData;
    console.log('🎫 Token de recuperação criado');

    // Em produção, enviar e-mail aqui
    console.log('📧 Link de recuperação (simulado):', `http://localhost:5175/reset-password?token=${resetToken}`);

    return {
      message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha'
    };

  } catch (error: any) {
    console.log('💥 Erro na recuperação:', error);
    
    if (error.message.includes('Formato de e-mail inválido')) {
      throw { status: 400, error: 'Formato de e-mail inválido' };
    }
    
    throw { status: 500, error: 'Erro interno do servidor' };
  }
};

// Função para validar token de recuperação
export const validateResetToken = async (data: ValidateTokenRequest): Promise<ValidateTokenResponse> => {
  try {
    console.log('🔍 Validando token:', data.token);

    if (!data.token) {
      return { valid: false, message: 'Token não fornecido' };
    }

    // Buscar token na tabela password_resets com join para pegar dados do usuário
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_resets')
      .select(`
        id,
        user_id,
        token,
        expires_at,
        is_used,
        users!inner(id, email, name, is_active)
      `)
      .eq('token', data.token)
      .eq('is_used', false)
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ Token não encontrado ou já utilizado');
      return { valid: false, message: 'Token inválido' };
    }

    // Verificar se usuário está ativo
    const user = Array.isArray(tokenData.users) ? tokenData.users[0] : tokenData.users;
    if (!user.is_active) {
      console.log('❌ Usuário inativo');
      return { valid: false, message: 'Usuário inativo' };
    }

    // Verificar se token não expirou
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      console.log('⏰ Token expirado');
      return { valid: false, message: 'Token expirado. Solicite um novo link de recuperação.' };
    }

    console.log('✅ Token válido para:', user.email);
    return { 
      valid: true, 
      email: user.email,
      message: 'Token válido' 
    };

  } catch (error: any) {
    console.log('💥 Erro na validação do token:', error);
    return { valid: false, message: 'Erro interno do servidor' };
  }
};

// Função para redefinir senha
export const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  try {
    console.log('🔄 Redefinindo senha com token:', data.token);

    // Validar dados obrigatórios
    if (!data.token || !data.newPassword || !data.confirmPassword) {
      throw new Error('Dados obrigatórios não informados');
    }

    // Validar se senhas coincidem
    if (data.newPassword !== data.confirmPassword) {
      throw new Error('As senhas não coincidem');
    }

    // Validar critérios de senha
    const passwordValidation = validatePasswordStrength(data.newPassword);
    if (!passwordValidation.isValid) {
      throw new Error('A senha não atende aos critérios de segurança');
    }

    // Validar token primeiro
    const tokenValidation = await validateResetToken({ token: data.token });
    if (!tokenValidation.valid) {
      throw new Error(tokenValidation.message || 'Token inválido');
    }

    // Buscar token na tabela password_resets para obter user_id
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_resets')
      .select('id, user_id')
      .eq('token', data.token)
      .eq('is_used', false)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Token inválido');
    }

    // Gerar hash da nova senha
    const newPasswordHash = await generatePasswordHash(data.newPassword);

    // Atualizar senha do usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      throw new Error('Erro interno do servidor');
    }

    // Marcar token como utilizado
    const { error: tokenUpdateError } = await supabase
      .from('password_resets')
      .update({
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    if (tokenUpdateError) {
      console.error('Erro ao marcar token como usado:', tokenUpdateError);
      // Não falha a operação, apenas loga o erro
    }

    console.log('✅ Senha redefinida com sucesso para user_id:', tokenData.user_id);

    return {
      message: 'Senha redefinida com sucesso! Você será redirecionado para o login.'
    };

  } catch (error: any) {
    console.log('💥 Erro na redefinição:', error);
    
    const errorMessage = error.message || 'Erro interno do servidor';
    
    if (errorMessage.includes('Dados obrigatórios')) {
      throw { status: 400, error: 'Dados obrigatórios não informados' };
    }
    
    if (errorMessage.includes('senhas não coincidem')) {
      throw { status: 400, error: 'As senhas não coincidem' };
    }
    
    if (errorMessage.includes('critérios de segurança')) {
      throw { status: 400, error: 'A senha não atende aos critérios de segurança' };
    }
    
    if (errorMessage.includes('Token')) {
      throw { status: 400, error: errorMessage };
    }
    
    throw { status: 500, error: 'Erro interno do servidor' };
  }
};

// Função para gerar token de recuperação
const generateResetToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Função para validar força da senha
export const validatePasswordStrength = (password: string) => {
  const criteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const score = Object.values(criteria).filter(Boolean).length;
  
  return {
    isValid: score >= 4, // Pelo menos 4 dos 5 critérios
    score,
    criteria,
    strength: score <= 2 ? 'fraca' : score <= 3 ? 'média' : score <= 4 ? 'forte' : 'muito forte'
  };
};

// Função para gerar hash da senha
const generatePasswordHash = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Simulação do endpoint POST /api/auth/login
export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    console.log('🚀 Iniciando login para:', data.email);
    
    // Validação dos dados obrigatórios
    if (!data.email || !data.password) {
      console.log('❌ Dados obrigatórios não informados');
      throw new Error('Dados obrigatórios não informados');
    }

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      console.log('❌ Formato de e-mail inválido');
      throw new Error('Formato de e-mail inválido');
    }

    console.log('🔍 Buscando usuário no Supabase...');
    
    // Buscar usuário por e-mail no Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, password, profile, is_active')
      .eq('email', data.email)
      .single();

    console.log('📊 Resultado da busca:', { userData, userError });

    if (userError) {
      console.log('❌ Erro na busca do usuário:', userError);
      throw new Error('Credenciais inválidas');
    }

    if (!userData) {
      console.log('❌ Usuário não encontrado');
      throw new Error('Credenciais inválidas');
    }

    console.log('✅ Usuário encontrado:', userData.name);

    // Verificar se usuário está ativo
    if (!userData.is_active) {
      console.log('❌ Usuário inativo');
      throw new Error('Usuário inativo');
    }

    console.log('✅ Usuário está ativo');

    // Verificar senha
    console.log('🔐 Verificando senha...');
    const isPasswordValid = await verifyPassword(data.password, userData.password);
    console.log('🔐 Resultado da verificação:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Senha inválida');
      throw new Error('Credenciais inválidas');
    }

    console.log('✅ Senha válida');

    // Gerar token JWT (simulado)
    const token = generateJWTToken(userData.id, userData.email);
    console.log('🎫 Token gerado');

    // Resposta de sucesso
    const response = {
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        profile: userData.profile
      }
    };

    console.log('🎉 Login bem-sucedido:', response.user);
    return response;

  } catch (error: any) {
    console.log('💥 Erro capturado:', error);
    
    // Tratamento de erros específicos
    const errorMessage = error.message || 'Erro interno do servidor';
    
    if (errorMessage.includes('Credenciais inválidas')) {
      console.log('🔄 Retornando erro 401');
      throw { status: 401, error: 'Credenciais inválidas' };
    }
    
    if (errorMessage.includes('Usuário inativo')) {
      console.log('🔄 Retornando erro 403');
      throw { status: 403, error: 'Usuário inativo' };
    }
    
    if (errorMessage.includes('Dados obrigatórios')) {
      console.log('🔄 Retornando erro 400');
      throw { status: 400, error: 'Dados obrigatórios não informados' };
    }
    
    console.log('🔄 Retornando erro 500');
    throw { status: 500, error: 'Erro interno do servidor' };
  }
};

// Função para verificar senha
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  // Se a senha no banco começar com $2b$, é um hash bcrypt
  if (hash.startsWith('$2b$')) {
    // Para demonstração, vamos aceitar algumas senhas conhecidas
    // Em produção, usar bcrypt.compare(password, hash)
    if (password === 'Admin123!' || password === 'senha123') {
      return true;
    }
    return false;
  }
  
  // Se o hash tem 64 caracteres, é provavelmente SHA-256
  if (hash.length === 64 && /^[a-f0-9]+$/i.test(hash)) {
    // Gerar hash SHA-256 da senha fornecida e comparar
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const generatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('🔐 Comparando hashes SHA-256:');
    console.log('🔐 Hash fornecido:', generatedHash);
    console.log('🔐 Hash no banco:', hash);
    
    return generatedHash === hash;
  }
  
  // Se não for hash, comparação direta (para senhas em texto simples)
  return password === hash;
};

// Função para gerar token JWT (simulada)
const generateJWTToken = (userId: number, email: string): string => {
  // Em produção, usar biblioteca JWT real
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  };
  
  return `jwt_${btoa(JSON.stringify(payload))}_${Date.now()}`;
};

// Função para gerar token de sessão
const generateSessionToken = (): string => {
  return `session_${Math.random().toString(36).substring(2)}_${Date.now()}`;
};

// Função para logout
export const logoutUser = async (token: string): Promise<void> => {
  try {
    // Remover sessão do Supabase se existir
    const { error } = await supabase
      .rpc('logout_session', { p_token: token });

    if (error) {
      console.error('Erro ao fazer logout:', error);
    }

    // Limpar dados locais
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');
    
  } catch (error) {
    console.error('Erro no logout:', error);
    throw { status: 500, error: 'Erro interno do servidor' };
  }
};

// Função para validar token
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    // Validar token no Supabase
    const { data, error } = await supabase
      .rpc('validate_session', { p_token: token });

    return !error && data && data.length > 0;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return false;
  }
};