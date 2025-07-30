import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmailInput } from '@/components/ui/email-input';
import { Notification, useNotification } from '@/components/ui/notification';
import { cn } from '@/lib/utils';
import logoSensoAI from '@/assets/logo_sensoai.svg';
import coverRecovery from '@/assets/cover-recovery.png';
import backgroundImage from '@/assets/background.png';

interface ForgotPasswordPageProps {
  className?: string;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ className, ...props }) => {
  const navigate = useNavigate();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const validateEmail = (value: string): string | undefined => {
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
    return undefined;
  };

  const handleEmailChange = (localPart: string) => {
    setEmail(localPart);
    setError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      showNotification('error', 'E-mail inválido', emailError);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      // Construir email completo se necessário
      const fullEmail = email.includes('@') 
        ? email 
        : `${email}@sensoramadesign.com.br`;

      // Simular chamada da API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Enviando e-mail de recuperação para:', fullEmail);
      showNotification('success', 'E-mail enviado!', 'Instruções de recuperação enviadas para seu e-mail.');
      setIsSuccess(true);
      
    } catch (error: any) {
      console.error('Erro ao enviar e-mail de recuperação:', error);
      showNotification('error', 'Erro no envio', 'Erro ao enviar e-mail de recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() !== '' && !validateEmail(email);

  if (isSuccess) {
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
              <div className="p-16 opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
                <div className="flex flex-col gap-6">
                  {/* Header com logo */}
                  <div className="flex flex-col items-center text-center opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.2s_forwards]">
                    <div className="flex justify-center mb-4">
                      <img src={logoSensoAI} alt="Senso AI" className="h-10 w-auto transition-transform duration-300 hover:scale-105" />
                    </div>
                  </div>

                  {/* Mensagem de sucesso */}
                  <div className="text-center space-y-4 opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold">E-mail enviado!</h2>
                    <p className="text-sm text-muted-foreground">
                      Enviamos as instruções para redefinir sua senha para o seu e-mail.
                      Verifique sua caixa de entrada e siga as instruções.
                    </p>
                  </div>

                  {/* Botão voltar ao login */}
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.2s_forwards]"
                  >
                    Voltar ao Login
                  </Button>
                </div>
              </div>
              
              {/* Imagem lateral */}
              <div className="relative hidden bg-muted md:block opacity-0 translate-x-4 animate-[fadeInRight_0.8s_ease-out_0.4s_forwards]">
                <img 
                  src={coverRecovery} 
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
      </div>
    );
  }

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
              <div className="flex flex-col gap-8">
                {/* Header com logo */}
                <div className="flex flex-col items-center text-center opacity-0 -translate-y-4 animate-[fadeInDown_0.6s_ease-out_0.2s_forwards]">
                  <div className="flex justify-center mb-6">
                    <img src={logoSensoAI} alt="Senso AI" className="h-10 w-auto transition-transform duration-300 hover:scale-105" />
                  </div>
                  <h1 className="text-lg font-semibold tracking-tight">Esqueci minha senha</h1>
                  <p className="text-sm text-muted-foreground mt-3">
                    Digite seu e-mail para receber as instruções de redefinição
                  </p>
                </div>

                {/* Espaçamento para melhor distribuição */}
                <div className="h-4"></div>

                {/* E-mail */}
                <div className="grid gap-3 opacity-0 -translate-x-4 animate-[fadeInLeft_0.6s_ease-out_0.8s_forwards]">
                  <Label htmlFor="email" className="transition-colors duration-200">E-mail</Label>
                  <EmailInput
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    error={error}
                    placeholder="usuario"
                  />
                </div>

                {/* Botão Enviar - aproximado do campo e-mail */}
                <Button 
                  type="submit" 
                  className="w-full rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.2s_forwards]" 
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    'Enviar instruções'
                  )}
                </Button>

                {/* Espaçamento para manter altura do card */}
                <div className="h-8"></div>

                {/* Link para voltar ao login */}
                <div className="text-center text-sm opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_1.4s_forwards]">
                  Lembrou da senha?{' '}
                  <Link
                    to="/login"
                    className="underline underline-offset-4 transition-all duration-200 hover:text-primary hover:scale-105"
                  >
                    Voltar ao login
                  </Link>
                </div>
              </div>
            </form>
            
            {/* Imagem lateral */}
            <div className="relative hidden bg-muted md:block opacity-0 translate-x-4 animate-[fadeInRight_0.8s_ease-out_0.4s_forwards]">
              <img 
                src={coverRecovery} 
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

export default ForgotPasswordPage;