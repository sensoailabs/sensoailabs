import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { registerUser, getErrorMessage, getFieldErrors, type RegisterRequest } from '../services/authService';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

interface SignupPageProps {
  onNavigateToLogin?: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onNavigateToLogin }) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, label: '', color: '' });

  // Validação de força da senha
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score === 0) return { score: 0, label: '', color: '' };
    if (score <= 2) return { score: 1, label: 'Fraca', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Média', color: 'bg-yellow-500' };
    if (score <= 4) return { score: 3, label: 'Forte', color: 'bg-blue-500' };
    return { score: 4, label: 'Muito Forte', color: 'bg-green-500' };
  };

  // Validações em tempo real
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Nome completo é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        break;
      
      case 'email':
        if (!value) return 'E-mail é obrigatório';
        if (!value.endsWith('@sensoramadesign.com.br')) {
          return 'E-mail deve ser do domínio @sensoramadesign.com.br';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Formato de e-mail inválido';
        break;
      
      case 'password':
        if (!value) return 'Senha é obrigatória';
        const passwordChecks = {
          length: value.length >= 8,
          uppercase: /[A-Z]/.test(value),
          lowercase: /[a-z]/.test(value),
          number: /\d/.test(value),
          special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
        };
        
        const failedChecks = [];
        if (!passwordChecks.length) failedChecks.push('mínimo 8 caracteres');
        if (!passwordChecks.uppercase) failedChecks.push('1 letra maiúscula');
        if (!passwordChecks.lowercase) failedChecks.push('1 letra minúscula');
        if (!passwordChecks.number) failedChecks.push('1 número');
        if (!passwordChecks.special) failedChecks.push('1 caractere especial');
        
        if (failedChecks.length > 0) {
          return `Senha deve conter: ${failedChecks.join(', ')}`;
        }
        break;
      
      case 'confirmPassword':
        if (!value) return 'Confirmação de senha é obrigatória';
        if (value !== formData.password) return 'Senhas não coincidem';
        break;
    }
    return undefined;
  };

  // Atualizar dados do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validação em tempo real
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    // Atualizar força da senha
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
      // Revalidar confirmação de senha se já foi preenchida
      if (formData.confirmPassword) {
        const confirmError = validateField('confirmPassword', formData.confirmPassword);
        setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    }

    // Revalidar confirmação de senha quando senha principal muda
    if (name === 'confirmPassword' || (name === 'password' && formData.confirmPassword)) {
      const confirmValue = name === 'confirmPassword' ? value : formData.confirmPassword;
      const confirmError = validateField('confirmPassword', confirmValue);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos os campos
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) newErrors[key as keyof FormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setSubmitMessage(null);

    try {
      const userData: RegisterRequest = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const response = await registerUser(userData);
      
      setSubmitMessage({ type: 'success', text: response.message || 'Cadastro realizado com sucesso! Bem-vindo à Sensorama.' });
      
      // Limpar formulário após sucesso
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
      setPasswordStrength({ score: 0, label: '', color: '' });
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        // Aqui você pode implementar a navegação para a página de login
        console.log('Redirecionando para login...');
        setSubmitMessage({ type: 'success', text: 'Redirecionando para login...' });
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      // Tratar erros específicos da API
      if (error.status === 400) {
        const fieldErrors = getFieldErrors(error);
        if (Object.keys(fieldErrors).length > 0) {
          setSubmitMessage({ type: 'error', text: `Dados inválidos: ${getErrorMessage(error)}` });
        } else {
          setSubmitMessage({ type: 'error', text: getErrorMessage(error) });
        }
      } else if (error.status === 409) {
        setSubmitMessage({ type: 'error', text: 'E-mail já cadastrado. Tente fazer login ou use outro e-mail.' });
      } else {
        setSubmitMessage({ type: 'error', text: getErrorMessage(error) || 'Erro interno do servidor. Tente novamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Object.keys(errors).every(key => !errors[key as keyof FormErrors]) &&
                     Object.values(formData).every(value => value.trim() !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-slate-600">
            Junte-se à plataforma Sensorama
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`${errors.fullName ? 'border-red-500 focus:ring-red-500' : 
                           formData.fullName && !errors.fullName ? 'border-green-500 focus:ring-green-500' : ''}`}
                placeholder="Digite seu nome completo"
              />
              {errors.fullName && (
                <p className="text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`${errors.email ? 'border-red-500 focus:ring-red-500' : 
                           formData.email && !errors.email ? 'border-green-500 focus:ring-green-500' : ''}`}
                placeholder="seu.nome@sensoramadesign.com.br"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`${errors.password ? 'border-red-500 focus:ring-red-500' : 
                           formData.password && !errors.password ? 'border-green-500 focus:ring-green-500' : ''}`}
                placeholder="Digite sua senha"
              />
              
              {/* Indicador de força da senha */}
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 
                           formData.confirmPassword && !errors.confirmPassword ? 'border-green-500 focus:ring-green-500' : ''}`}
                placeholder="Confirme sua senha"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Mensagem de feedback */}
            {submitMessage && (
              <div className={`p-3 rounded-md text-sm ${
                submitMessage.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {submitMessage.text}
              </div>
            )}

            {/* Botão Cadastrar */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Cadastrando...</span>
                </div>
              ) : (
                'Cadastrar'
              )}
            </Button>

            {/* Link para login */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => onNavigateToLogin ? onNavigateToLogin() : alert('Redirecionamento para página de login')}
              >
                Já tenho conta
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;