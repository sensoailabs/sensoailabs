import React from 'react';
import { MessageCircleX, RefreshCw, Send } from 'lucide-react';
import ErrorBoundary from './error-boundary';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

interface ChatErrorBoundaryProps {
  children: React.ReactNode;
  onRetryMessage?: () => void;
  onClearChat?: () => void;
  conversationId?: string;
  lastMessage?: string;
}

const ChatErrorFallback: React.FC<{
  onRetryMessage?: () => void;
  onClearChat?: () => void;
  lastMessage?: string;
}> = ({ onRetryMessage, onClearChat, lastMessage }) => {
  return (
    <div className="flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <MessageCircleX className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-lg">
            Erro no Chat
          </CardTitle>
          <CardDescription>
            Ocorreu um problema durante a conversa. Você pode tentar reenviar a mensagem ou limpar o chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastMessage && (
            <div className="text-sm bg-muted p-3 rounded-md">
              <strong>Última mensagem:</strong>
              <p className="mt-1 text-muted-foreground truncate">
                {lastMessage.length > 100 ? `${lastMessage.substring(0, 100)}...` : lastMessage}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {onRetryMessage && (
              <Button 
                onClick={onRetryMessage}
                className="w-full"
                variant="default"
              >
                <Send className="h-4 w-4 mr-2" />
                Reenviar Mensagem
              </Button>
            )}
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Chat
            </Button>
            
            {onClearChat && (
              <Button 
                onClick={onClearChat}
                variant="destructive"
                className="w-full"
              >
                Limpar Conversa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ChatErrorBoundary: React.FC<ChatErrorBoundaryProps> = ({
  children,
  onRetryMessage,
  onClearChat,
  conversationId,
  lastMessage
}) => {
  const handleChatError = (error: Error, errorInfo: any) => {
    // Log específico para erros de chat
    console.error('[ChatErrorBoundary] Erro no chat:', {
      error: error.message,
      conversationId,
      lastMessage: lastMessage?.substring(0, 100),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Aqui poderia enviar para serviço de monitoramento
    // trackError('chat_error', { conversationId, error: error.message });
  };

  return (
    <ErrorBoundary
      contextName="Chat"
      onError={handleChatError}
      maxRetries={2}
      resetKeys={[conversationId || '']}
      resetOnPropsChange={true}
      fallback={
        <ChatErrorFallback 
          onRetryMessage={onRetryMessage}
          onClearChat={onClearChat}
          lastMessage={lastMessage}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ChatErrorBoundary;

// Hook específico para erros de chat
export const useChatErrorHandler = () => {
  const handleStreamingError = React.useCallback((error: Error, context?: {
    conversationId?: string;
    messageId?: string;
    provider?: string;
  }) => {
    console.error('[ChatError] Erro no streaming:', {
      error: error.message,
      ...context,
      timestamp: new Date().toISOString()
    });

    // Aqui poderia implementar retry automático ou fallback
    // para diferentes providers
  }, []);

  const handleMessageError = React.useCallback((error: Error, context?: {
    messageContent?: string;
    conversationId?: string;
  }) => {
    console.error('[ChatError] Erro na mensagem:', {
      error: error.message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    handleStreamingError,
    handleMessageError
  };
};

// Wrapper para componentes de chat
export const withChatErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  chatErrorProps?: Omit<ChatErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ChatErrorBoundary {...chatErrorProps}>
      <Component {...props} />
    </ChatErrorBoundary>
  );
  
  WrappedComponent.displayName = `withChatErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};