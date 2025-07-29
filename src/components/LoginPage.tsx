import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

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
  onNavigateToSignup?: () => void;
  onNavigateToForgotPassword?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToSignup, onNavigateToForgotPassword }) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rememberUser, setRememberUser] = useState(false);
  
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-foco no campo e-mail ao carregar página e carregar credenciais salvas
  useEffect(() => {
    // Carregar credenciais salvas se existirem
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    
    if (savedEmail && savedPassword) {
      setFormData({
        email: savedEmail,
        password: savedPassword
      });
      setRememberUser(true);
    }
    
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  // Validação de formato de e-mail
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'E-mail é obrigatório';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Formato de e-mail inválido';
    
    return undefined;
  };

  // Validação de senha
  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Senha é obrigatória';
    return undefined;
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

  // Simulação de API de login
  const authenticateUser = async (email: string, password: string): Promise<{ success: boolean; token?: string; message?: string }> => {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulação de credenciais válidas (para demonstração)
    if (email === 'admin@sensoramadesign.com.br' && password === 'Admin123!') {
      return {
        success: true,
        token: 'jwt_token_example_' + Date.now(),
        message: 'Login realizado com sucesso!'
      };
    }
    
    // Simular diferentes tipos de erro
    if (!email.endsWith('@sensoramadesign.com.br')) {
      throw new Error('E-mail deve ser do domínio @sensoramadesign.com.br');
    }
    
    throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
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
    setSubmitMessage(null);
    setErrors({});

    try {
      // Usar API REST real para autenticação
      const { authService } = await import('../services/authService');
      const response = await authService.login(formData.email, formData.password, rememberUser);
      
      // Salvar ou remover credenciais baseado na opção "Lembrar do meu usuário"
      if (rememberUser) {
        localStorage.setItem('rememberedEmail', formData.email);
        localStorage.setItem('rememberedPassword', formData.password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }
      
      setSubmitMessage({ 
        type: 'success', 
        text: response.message || 'Login realizado com sucesso!' 
      });
      
      // Simular redirecionamento para dashboard após 2 segundos
      setTimeout(() => {
        setSubmitMessage({ 
          type: 'success', 
          text: 'Redirecionando para o dashboard da Senso AI...' 
        });
        
        // Aqui seria o redirecionamento real para o dashboard
        setTimeout(() => {
          console.log('Redirecionando para dashboard...');
          console.log('Usuário logado:', response.user);
          // window.location.href = '/dashboard';
        }, 1000);
      }, 2000);
      
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
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !validateEmail(formData.email) && !validatePassword(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Entrar
          </CardTitle>
          <CardDescription className="text-slate-600">
            Acesse sua conta Sensorama
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                ref={emailInputRef}
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`${errors.email ? 'border-red-500 focus:ring-red-500' : 
                           formData.email && !errors.email ? 'border-green-500 focus:ring-green-500' : ''}`}
                placeholder="seu.email@sensoramadesign.com.br"
                autoComplete="email"
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
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Checkbox Lembrar do meu usuário */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberUser}
                onCheckedChange={(checked) => setRememberUser(checked as boolean)}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm font-normal cursor-pointer"
              >
                Lembrar do meu usuário
              </Label>
            </div>

            {/* Mensagem de erro geral */}
            {errors.general && (
              <div className="p-3 rounded-md text-sm bg-red-50 text-red-800 border border-red-200">
                {errors.general}
              </div>
            )}

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

            {/* Botão Entrar */}
            <Button 
              type="submit" 
              className="w-full" 
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

            {/* Links de navegação */}
            <div className="text-center space-y-2">
              <button
                type="button"
                className="text-sm text-primary hover:underline block w-full"
                onClick={() => onNavigateToForgotPassword ? onNavigateToForgotPassword() : alert('Redirecionamento para recuperação de senha')}
              >
                Esqueci minha senha
              </button>
              
              <div className="text-sm text-slate-600">
                 Não tem conta?{' '}
                 <button
                   type="button"
                   className="text-primary hover:underline font-medium"
                   onClick={() => onNavigateToSignup ? onNavigateToSignup() : alert('Redirecionamento para cadastro')}
                 >
                   Criar conta
                 </button>
               </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;