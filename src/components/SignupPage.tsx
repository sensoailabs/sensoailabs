import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { EmailInput } from './ui/email-input';
import { PasswordInput } from './ui/password-input';
import { Notification, useNotification } from './ui/notification';
import { registerUser, getErrorMessage, getFieldErrors, type RegisterRequest } from '../services/authService';
import { cn } from '@/lib/utils';
import logoSensoAI from '../assets/logo_sensoai.svg';
import coverRegister from '../assets/cover-register.png';
import backgroundImage from '../assets/background.png';

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

interface SignupPageProps {
  className?: string;
}

const SignupPage: React.FC<SignupPageProps> = ({ className, ...props }) => {
  const navigate = useNavigate();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validações em tempo real
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Nome completo é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        break;
      
      case 'email':
        if (!value) return 'E-mail é obrigatório';
        
        // Se contém @, deve ser o domínio correto
        if (value.includes('@')) {
          if (!value.endsWith('@sensoramadesign.com.br')) {
            return 'E-mail deve ser do domínio @sensoramadesign.com.br';
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) return 'Formato de e-mail inválido';
        } else {
          // Apenas parte local, deve ter pelo menos 3 caracteres
          if (value.length < 3) return 'E-mail deve ter pelo menos 3 caracteres';
        }
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

  // Handler específico para o EmailInput
  const handleEmailChange = (localPart: string) => {
    setFormData(prev => ({ ...prev, email: localPart }));
    
    const error = validateField('email', localPart);
    setErrors(prev => ({ ...prev, email: error }));
  };

  // Atualizar dados do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validação em tempo real
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

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

    try {
      // Construir email completo se necessário
      const fullEmail = formData.email.includes('@') 
        ? formData.email 
        : `${formData.email}@sensoramadesign.com.br`;
        
      const userData: RegisterRequest = {
        name: formData.fullName,
        email: fullEmail,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const response = await registerUser(userData);
      
      showNotification('success', 'Cadastro realizado!', response.message || 'Cadastro realizado com sucesso! Bem-vindo à Sensorama.');
      
      // Limpar formulário após sucesso
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        showNotification('success', 'Redirecionando...', 'Redirecionando para login...');
        setTimeout(() => {
          console.log('Redirecionando para login...');
          if (navigate) navigate('/login');
        }, 1000);
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      // Tratar erros específicos da API
      if (error.status === 400) {
        const fieldErrors = getFieldErrors(error);
        if (Object.keys(fieldErrors).length > 0) {
          showNotification('error', 'Dados inválidos', `Dados inválidos: ${getErrorMessage(error)}`);
        } else {
          showNotification('error', 'Erro de validação', getErrorMessage(error));
        }
      } else if (error.status === 409) {
        showNotification('error', 'E-mail já cadastrado', 'E-mail já cadastrado. Tente fazer login ou use outro e-mail.');
      } else {
        showNotification('error', 'Erro no cadastro', getErrorMessage(error) || 'Erro interno do servidor. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Object.keys(errors).every(key => !errors[key as keyof FormErrors]) &&
                     Object.values(formData).every(value => value.trim() !== '');

  return (
    <div className={cn("relative flex min-h-svh w-full items-center justify-center p-6 md:p-10", className)} {...props}>
      {/* Background com imagem */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{backgroundImage: `url(${backgroundImage})`}}
      >
        {/* Overlay com efeito vidro */}
        <div className="absolute inset-0 bg-[#D9D9D9]/15 backdrop-blur-[12px]"></div>
      </div>
      <div className="relative z-10 w-full max-w-4xl opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_forwards]">
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={handleSubmit} className="p-16 opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
              <div className="flex flex-col gap-6">
                {/* Header com logo */}
                <div className="flex flex-col items-center text-center opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.2s_forwards]">
                  <div className="flex justify-center mb-4">
                    <img src={logoSensoAI} alt="Senso AI" className="h-10 w-auto transition-transform duration-300 hover:scale-105" />
                  </div>
                </div>

                {/* Nome Completo */}
                <div className="grid gap-3 opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_0.8s_forwards]">
                  <Label htmlFor="fullName" className="transition-colors duration-200">Nome Completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`transition-all duration-200 ${errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    placeholder="Digite seu nome completo"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive opacity-0 translate-x-2 animate-[fadeInLeft_0.4s_ease-out_forwards]">{errors.fullName}</p>
                  )}
                </div>

                {/* E-mail */}
                <div className="grid gap-3 opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_1s_forwards]">
                  <Label htmlFor="email" className="transition-colors duration-200">E-mail</Label>
                  <EmailInput
                    id="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    error={errors.email}
                    placeholder="usuario"
                  />
                </div>

                {/* Senha */}
                <div className="opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_1.2s_forwards]">
                  <PasswordInput
                    id="password"
                    label="Senha"
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, password: value }));
                      const error = validateField('password', value);
                      setErrors(prev => ({ ...prev, password: error }));
                      
                      // Revalidar confirmação de senha quando senha principal muda
                      if (formData.confirmPassword) {
                        const confirmError = validateField('confirmPassword', formData.confirmPassword);
                        setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
                      }
                    }}
                    showStrengthIndicator={true}
                  />
                </div>

                {/* Confirmar Senha */}
                <div className="opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_1.4s_forwards]">
                  <PasswordInput
                    id="confirmPassword"
                    label="Confirmar Senha"
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, confirmPassword: value }));
                      const error = validateField('confirmPassword', value);
                      setErrors(prev => ({ ...prev, confirmPassword: error }));
                    }}
                    error={errors.confirmPassword}
                    showStrengthIndicator={false}
                  />
                </div>

                {/* Botão Cadastrar */}
                <Button 
                  type="submit" 
                  className="w-full rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.6s_forwards]" 
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
                <div className="text-center text-sm opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.8s_forwards]">
                  Já tem conta?{' '}
                  <Link
                    to="/login"
                    className="underline underline-offset-4 transition-all duration-200 hover:text-primary hover:scale-105"
                  >
                    Entrar
                  </Link>
                </div>
              </div>
            </form>
            
            {/* Imagem lateral */}
            <div className="relative hidden bg-muted md:block opacity-0 translate-x-4 animate-[fadeInRight_0.8s_ease-out_0.4s_forwards]">
              <img 
                src={coverRegister} 
                alt="Senso AI Cover" 
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Termos de uso */}
        <div className="text-balance text-center text-xs text-muted-foreground mt-6 opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_2s_forwards]">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors duration-200">
            Termos de Serviço
          </a>{' '}
          e{' '}
          <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors duration-200">
            Política de Privacidade
          </a>.
        </div>
      </div>
      
      {/* Componente de Notificação */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
    </div>
  );
};

export default SignupPage;