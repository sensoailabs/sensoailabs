import React, { useState, useEffect, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { EmailInput } from '@/components/ui/email-input';
import { Card, CardContent } from '@/components/ui/card';
import { Notification, useNotification } from '@/components/ui/notification';
import { cn } from '@/lib/utils';
import logoSensoAI from '../assets/logo_sensoai.svg';
import coverLogin from '../assets/_banners/cover-login.png';
import backgroundImage from '../assets/background.png';
import { Eye, EyeOff } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface LoginPageProps {
  className?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  className,
  ...props 
}) => {
  const navigate = useNavigate();
  const checkboxId = useId();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberUser, setRememberUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-foco no campo e-mail ao carregar página e carregar e-mail salvo
  useEffect(() => {
    // Carregar apenas e-mail salvo se existir (por segurança, não salvamos senhas)
    const savedEmail = localStorage.getItem('rememberedEmail');
    
    if (savedEmail) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail
      }));
      setRememberUser(true);
    }
  }, []);

  // Validação de formato de e-mail
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'E-mail é obrigatório';
    
    // Se contém @, deve ser o domínio correto
    if (email.includes('@')) {
      if (!email.endsWith('@sensoramadesign.com.br')) {
        return 'E-mail deve ser do domínio @sensoramadesign.com.br';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return 'Formato de e-mail inválido';
    } else {
      // Apenas parte local, deve ter pelo menos 3 caracteres
      if (email.length < 3) return 'E-mail deve ter pelo menos 3 caracteres';
    }
    
    return undefined;
  };

  // Validação de senha
  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Senha é obrigatória';
    return undefined;
  };

  // Handler específico para o EmailInput
  const handleEmailChange = (localPart: string) => {
    setFormData(prev => ({ ...prev, email: localPart }));
    
    const error = validateEmail(localPart);
    setErrors(prev => ({ ...prev, email: error, general: undefined }));
  };

  // Atualizar dados do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validação em tempo real
    let error: string | undefined;
    if (name === 'email') {
      error = validateEmail(value);
    } else if (name === 'password') {
      error = validatePassword(value);
    }
    
    setErrors(prev => ({ ...prev, [name]: error, general: undefined }));
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos os campos
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    const newErrors: FormErrors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Construir email completo se necessário
      const fullEmail = formData.email.includes('@') 
        ? formData.email 
        : `${formData.email}@sensoramadesign.com.br`;
        
      // Usar API REST real para autenticação
      const { authService } = await import('../services/authService');
      const response = await authService.login(fullEmail, formData.password, rememberUser);
      
      // Salvar ou remover e-mail baseado na opção "Lembrar do meu usuário"
      // Por segurança, salvamos apenas o e-mail, nunca a senha
      if (rememberUser) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Remover senha salva anteriormente (se existir) por segurança
      localStorage.removeItem('rememberedPassword');
      
      showNotification(
        'success',
        'Login realizado com sucesso!',
        response.message || 'Bem-vindo de volta à Senso AI'
      );
      
      // O redirecionamento será automático via App.tsx quando o estado de auth mudar
      console.log('Login bem-sucedido, aguardando redirecionamento automático...');
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Tratar diferentes tipos de erro da API
      let errorMessage = 'Erro interno do servidor. Tente novamente.';
      
      if (error.status === 401) {
        errorMessage = 'Credenciais inválidas. Verifique seu e-mail e senha.';
      } else if (error.status === 403) {
        errorMessage = 'Usuário inativo. Entre em contato com o administrador.';
      } else if (error.status === 400) {
        errorMessage = 'Dados obrigatórios não informados.';
      } else if (error.error) {
        errorMessage = error.error;
      }
      
      showNotification(
        'error',
        'Erro no login',
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !validateEmail(formData.email) && !validatePassword(formData.password);

  return (
    <div className={cn("relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 overflow-hidden", className)} {...props}>
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

                {/* E-mail */}
                <div className="grid gap-3 opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_0.8s_forwards]">
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
                <div className="grid gap-3 opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_1s_forwards]">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="transition-colors duration-200">Senha</Label>
                    <Link
                      to="/forgot-password"
                      className="ml-auto text-sm underline-offset-2 hover:underline transition-all duration-200 hover:text-primary"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pr-10 transition-all duration-200 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive opacity-0 translate-x-2 animate-[fadeInLeft_0.4s_ease-out_forwards]">{errors.password}</p>
                  )}
                </div>

                {/* Checkbox Lembrar do meu usuário */}
                <div className="flex items-center gap-2 opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_1.2s_forwards]">
                  <Checkbox 
                    id={checkboxId} 
                    checked={rememberUser}
                    onCheckedChange={(checked) => setRememberUser(checked as boolean)}
                    className="transition-all duration-200"
                  />
                  <Label 
                    htmlFor={checkboxId} 
                    className="text-sm font-normal cursor-pointer transition-colors duration-200 hover:text-primary"
                  >
                    Lembrar meu e-mail
                  </Label>
                </div>

                {/* Botão Entrar */}
                <Button 
                  type="submit" 
                  className="w-full rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.4s_forwards]" 
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </Button>

                {/* Link para cadastro */}
                <div className="text-center text-sm opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.6s_forwards]">
                  Não tem conta?{' '}
                  <Link
                    to="/signup"
                    className="underline underline-offset-4 transition-all duration-200 hover:text-primary hover:scale-105"
                  >
                    Criar conta
                  </Link>
                </div>
              </div>
            </form>
            
            {/* Imagem lateral */}
            <div className="relative hidden bg-muted md:block opacity-0 translate-x-4 animate-[fadeInRight_0.8s_ease-out_0.4s_forwards]">
              <img 
                src={coverLogin} 
                alt="Senso AI Cover" 
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Termos de uso */}
        <div className="text-balance text-center text-xs text-muted-foreground mt-6 opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.8s_forwards]">
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
      
      {/* Notificação */}
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

export default LoginPage;