import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  resetUserPassword, 
  validateTokenFromURL, 
  validatePasswordCriteria,
  redirectAfterSuccess,
  showFeedback,
  handlePasswordResetError
} from '../services/passwordResetService';
import logoSensoAI from '../assets/logo_sensoai.svg';

// Componente Alert simples
const Alert: React.FC<{ children: React.ReactNode; variant?: 'default' | 'destructive'; className?: string }> = ({ children, variant = 'default', className = '' }) => (
  <div className={`p-3 rounded-md text-sm border ${
    variant === 'destructive' 
      ? 'bg-red-50 text-red-800 border-red-200' 
      : 'bg-blue-50 text-blue-800 border-blue-200'
  } ${className}`}>
    {children}
  </div>
);

const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

// Componente indicador de força da senha
const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const validation = validatePasswordCriteria(password);
  
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'fraca': return 'bg-red-500';
      case 'média': return 'bg-yellow-500';
      case 'forte': return 'bg-blue-500';
      case 'muito forte': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthWidth = (score: number) => {
    return `${(score / 5) * 100}%`;
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span>Força da senha:</span>
        <span className={`font-medium ${
          validation.strength === 'fraca' ? 'text-red-600' :
          validation.strength === 'média' ? 'text-yellow-600' :
          validation.strength === 'forte' ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {validation.strength}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.strength)}`}
          style={{ width: getStrengthWidth(validation.score) }}
        />
      </div>
      
      <div className="text-xs space-y-1">
        <div className={`flex items-center ${validation.criteria.minLength ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{validation.criteria.minLength ? '✓' : '○'}</span>
          Pelo menos 8 caracteres
        </div>
        <div className={`flex items-center ${validation.criteria.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{validation.criteria.hasUppercase ? '✓' : '○'}</span>
          Letra maiúscula
        </div>
        <div className={`flex items-center ${validation.criteria.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{validation.criteria.hasLowercase ? '✓' : '○'}</span>
          Letra minúscula
        </div>
        <div className={`flex items-center ${validation.criteria.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{validation.criteria.hasNumber ? '✓' : '○'}</span>
          Número
        </div>
        <div className={`flex items-center ${validation.criteria.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{validation.criteria.hasSpecialChar ? '✓' : '○'}</span>
          Caractere especial
        </div>
      </div>
    </div>
  );
};

const ResetPasswordPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Extrair token da URL
  useEffect(() => {
    const tokenValidation = validateTokenFromURL();
    
    if (tokenValidation.isValid && tokenValidation.token) {
      setToken(tokenValidation.token);
      setTokenValid(true);
      setIsValidatingToken(false);
      // Aqui você poderia fazer uma validação adicional no servidor se necessário
    } else {
      setError(tokenValidation.error || 'Token não encontrado na URL');
      setTokenValid(false);
      setIsValidatingToken(false);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    // Esta função pode ser removida ou usada para validação adicional no servidor
    setIsValidatingToken(false);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newPassword) {
      errors.newPassword = 'Nova senha é obrigatória';
    } else {
      const passwordValidation = validatePasswordCriteria(newPassword);
      if (!passwordValidation.isValid) {
        errors.newPassword = 'A senha não atende aos critérios de segurança';
      }
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await resetUserPassword(token, newPassword, confirmPassword);
      
      if (response.success) {
        setSuccess(true);
        console.log('✅ Senha redefinida:', response.message);
        
        // Redirecionar para login após 3 segundos
        redirectAfterSuccess(3000);
      } else {
        setError(response.message);
      }
      
    } catch (err: any) {
      console.error('❌ Erro na redefinição:', err);
      setError('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Estado de carregamento da validação do token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-sm w-full space-y-8 opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_forwards]">
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="pt-6 opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 opacity-0 translate-y-2 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]">Validando token...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Token inválido ou expirado
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-sm w-full space-y-8 opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_forwards]">
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2 opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.2s_forwards]">
                <img src={logoSensoAI} alt="Senso AI" className="h-8 w-auto transition-transform duration-300 hover:scale-105" />
              </div>
            </CardHeader>
            <CardContent className="opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto opacity-0 scale-50 animate-[fadeInScale_0.6s_ease-out_0.6s_forwards]">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.8s_forwards]">
                  Token inválido ou expirado
                </h2>
                <p className="text-gray-600 opacity-0 translate-y-2 animate-[fadeInUp_0.6s_ease-out_1s_forwards]">
                  O link de redefinição de senha não é válido ou já expirou. 
                  Solicite um novo link de redefinição.
                </p>
                <Alert variant="destructive" className="opacity-0 translate-y-2 animate-[fadeInUp_0.6s_ease-out_1.2s_forwards]">
                  <AlertDescription>
                    Por favor, solicite um novo link de redefinição de senha.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => window.location.href = '/forgot-password'}
                  className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.4s_forwards]"
                >
                  Solicitar novo link
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/login'}
                  className="w-full transition-all duration-200 hover:scale-105 opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.6s_forwards]"
                >
                  ← Voltar ao login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Sucesso na redefinição
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-sm w-full space-y-8 opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_forwards]">
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2 opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.2s_forwards]">
                <img src={logoSensoAI} alt="Senso AI" className="h-8 w-auto transition-transform duration-300 hover:scale-105" />
              </div>
            </CardHeader>
            <CardContent className="opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto opacity-0 scale-50 animate-[fadeInScale_0.6s_ease-out_0.6s_forwards]">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.8s_forwards]">
                  Senha redefinida com sucesso!
                </h2>
                <p className="text-gray-600 opacity-0 translate-y-2 animate-[fadeInUp_0.6s_ease-out_1s_forwards]">
                  Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
                </p>
                <Alert className="opacity-0 translate-y-2 animate-[fadeInUp_0.6s_ease-out_1.2s_forwards]">
                  <AlertDescription>
                    Sua conta está segura. Faça login para continuar.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.4s_forwards]"
                >
                  Ir para login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Formulário de redefinição
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full space-y-8 opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_forwards]">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2 opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.2s_forwards]">
              <img src={logoSensoAI} alt="Senso AI" className="h-8 w-auto transition-transform duration-300 hover:scale-105" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.4s_forwards]">
              Redefinir senha
            </CardTitle>
            <CardDescription className="opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.6s_forwards]">
              Digite sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent className="opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="opacity-0 translate-y-2 animate-[fadeInUp_0.4s_ease-out_forwards]">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_1s_forwards]">
                <Label htmlFor="newPassword" className="transition-colors duration-200">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className={validationErrors.newPassword ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.newPassword && (
                  <p className="text-sm text-red-600 animate-in fade-in-0 slide-in-from-left-1 duration-300">{validationErrors.newPassword}</p>
                )}
                
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div className="space-y-2 opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_1.2s_forwards]">
                <Label htmlFor="confirmPassword" className="transition-colors duration-200">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className={validationErrors.confirmPassword ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-red-600 animate-in fade-in-0 slide-in-from-left-1 duration-300">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.4s_forwards]" 
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </Button>

              <div className="text-center opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.6s_forwards]">
                <a 
                  href="/login" 
                  className="text-sm text-blue-600 hover:text-blue-500 transition-all duration-200 hover:scale-105"
                >
                  ← Voltar ao login
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;