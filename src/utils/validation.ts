// Utilitários centralizados de validação

export interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface PasswordValidation {
  isValid: boolean;
  criteria: PasswordCriteria;
  score: number;
  strength: 'Muito fraca' | 'Fraca' | 'Média' | 'Forte' | 'Muito forte';
  errors: string[];
}

// Validação centralizada de senha
export const validatePassword = (password: string): PasswordValidation => {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(criteria).filter(Boolean).length;
  
  const strengthLevels: Record<number, PasswordValidation['strength']> = {
    0: 'Muito fraca',
    1: 'Muito fraca', 
    2: 'Fraca',
    3: 'Média',
    4: 'Forte',
    5: 'Muito forte'
  };
  
  const errors: string[] = [];
  if (!criteria.minLength) errors.push('Pelo menos 8 caracteres');
  if (!criteria.hasUppercase) errors.push('Uma letra maiúscula');
  if (!criteria.hasLowercase) errors.push('Uma letra minúscula');
  if (!criteria.hasNumber) errors.push('Um número');
  if (!criteria.hasSpecialChar) errors.push('Um caractere especial');
  
  return {
    isValid: score >= 4,
    criteria,
    score,
    strength: strengthLevels[score] || 'Muito fraca',
    errors
  };
};

// Validação de confirmação de senha
export const validatePasswordConfirmation = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return '';
  if (password !== confirmPassword) return 'As senhas não coincidem';
  return '';
};

// Validação de email
export const validateEmail = (email: string): string => {
  if (!email) return 'E-mail é obrigatório';
  
  // Se contém @, deve ser o domínio correto
  if (email.includes('@')) {
    if (!email.endsWith('@sensoramadesign.com.br')) {
      return 'E-mail deve ser do domínio @sensoramadesign.com.br';
    }
  }
  
  return '';
};

// Validação de nome
export const validateName = (name: string): string => {
  if (!name.trim()) return 'Nome é obrigatório';
  if (name.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
  return '';
};

// Tipo para erros de formulário
export interface FormErrors {
  [key: string]: string;
}

// Função genérica para validar campos
export const validateField = (fieldName: string, value: string, confirmValue?: string): string => {
  switch (fieldName) {
    case 'name':
    case 'fullName':
      return validateName(value);
    case 'email':
      return validateEmail(value);
    case 'password':
    case 'newPassword':
    case 'currentPassword':
      if (!value) return 'Senha é obrigatória';
      return validatePassword(value).isValid ? '' : validatePassword(value).errors[0] || 'Senha inválida';
    case 'confirmPassword':
      return validatePasswordConfirmation(confirmValue || '', value);
    default:
      return '';
  }
};