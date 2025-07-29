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

// Componente Alert simples
const Alert: React.FC<{ children: React.ReactNode; variant?: 'default' | 'destructive' }> = ({ children, variant = 'default' }) => (
  <div className={`p-3 rounded-md text-sm border ${
    variant === 'destructive' 
      ? 'bg-red-50 text-red-800 border-red-200' 
      : 'bg-blue-50 text-blue-800 border-blue-200'
  }`}>
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
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Validando token...</p>
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
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <span className="text-red-600 text-xl">✗</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Link inválido
              </CardTitle>
              <CardDescription>
                {error || 'O link de recuperação é inválido ou expirou'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    Solicite um novo link de recuperação de senha.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/forgot-password'}
                >
                  Solicitar novo link
                </Button>
                
                <div className="text-center">
                  <a 
                    href="/login" 
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    ← Voltar ao login
                  </a>
                </div>
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
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Senha redefinida!
              </CardTitle>
              <CardDescription>
                Sua senha foi alterada com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Você será redirecionado para o login em alguns segundos...
                  </AlertDescription>
                </Alert>
                
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/login'}
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
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Redefinir senha
            </CardTitle>
            <CardDescription>
              Defina uma nova senha para {userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
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
                  <p className="text-sm text-red-600">{validationErrors.newPassword}</p>
                )}
                
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
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
                  <p className="text-sm text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
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

              <div className="text-center">
                <a 
                  href="/login" 
                  className="text-sm text-blue-600 hover:text-blue-500"
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