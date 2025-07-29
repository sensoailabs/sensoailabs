import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { requestPasswordReset } from '../services/passwordResetService';

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

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor, informe seu e-mail');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await requestPasswordReset(email.trim());
      if (response.success) {
        setSuccess(true);
        console.log('✅ Recuperação solicitada:', response.message);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      console.error('❌ Erro na recuperação:', err);
      setError('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

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
                E-mail enviado!
              </CardTitle>
              <CardDescription>
                Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Verifique sua caixa de entrada e spam. O link expira em 1 hora.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = '/login'}
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Recuperar senha
            </CardTitle>
            <CardDescription>
              Informe seu e-mail para receber um link de recuperação
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
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar link de recuperação
                  </>
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

export default ForgotPasswordPage;