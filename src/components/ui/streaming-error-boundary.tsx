import React from 'react';
import { Wifi, WifiOff, RefreshCw, Pause, Play } from 'lucide-react';
import ErrorBoundary from './error-boundary';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Progress } from './progress';

interface StreamingErrorBoundaryProps {
  children: React.ReactNode;
  onRetryStreaming?: () => void;
  onPauseStreaming?: () => void;
  onResumeStreaming?: () => void;
  onSwitchProvider?: (provider: string) => void;
  streamingProgress?: number;
  currentProvider?: string;
  availableProviders?: string[];
  isStreaming?: boolean;
  messageId?: string;
}

const StreamingErrorFallback: React.FC<{
  onRetryStreaming?: () => void;
  onPauseStreaming?: () => void;
  onResumeStreaming?: () => void;
  onSwitchProvider?: (provider: string) => void;
  streamingProgress?: number;
  currentProvider?: string;
  availableProviders?: string[];
  isStreaming?: boolean;
}> = ({ 
  onRetryStreaming,
  onPauseStreaming,
  onResumeStreaming,
  onSwitchProvider,
  streamingProgress,
  currentProvider,
  availableProviders,
  isStreaming
}) => {
  const getErrorMessage = () => {
    if (streamingProgress && streamingProgress > 0) {
      return 'A conexão foi interrompida durante o streaming. Você pode tentar continuar ou reiniciar.';
    }
    return 'Falha na conexão de streaming. Verifique sua internet e tente novamente.';
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <WifiOff className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-lg">
            Erro no Streaming
          </CardTitle>
          <CardDescription>
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentProvider && (
            <div className="text-sm bg-muted p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Provider:</strong> {currentProvider}
                  <div className="text-muted-foreground">
                    Status: {isStreaming ? 'Streaming' : 'Parado'}
                  </div>
                </div>
                <div className="flex items-center">
                  {isStreaming ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              
              {streamingProgress !== undefined && streamingProgress > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progresso</span>
                    <span>{streamingProgress}%</span>
                  </div>
                  <Progress value={streamingProgress} className="h-2" />
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {onRetryStreaming && (
              <Button 
                onClick={onRetryStreaming}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reiniciar Streaming
              </Button>
            )}
            
            <div className="flex gap-2">
              {onPauseStreaming && isStreaming && (
                <Button 
                  onClick={onPauseStreaming}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              )}
              
              {onResumeStreaming && !isStreaming && streamingProgress && streamingProgress > 0 && (
                <Button 
                  onClick={onResumeStreaming}
                  variant="outline"
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continuar
                </Button>
              )}
            </div>
            
            {availableProviders && availableProviders.length > 1 && onSwitchProvider && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Tentar com outro provider:</div>
                <div className="flex flex-wrap gap-1">
                  {availableProviders
                    .filter(provider => provider !== currentProvider)
                    .map(provider => (
                      <Button
                        key={provider}
                        onClick={() => onSwitchProvider(provider)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {provider}
                      </Button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Possíveis causas:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Conexão instável com a internet</li>
              <li>Sobrecarga no servidor do provider</li>
              <li>Limite de rate limiting atingido</li>
              <li>Timeout na resposta do modelo</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StreamingErrorBoundary: React.FC<StreamingErrorBoundaryProps> = ({
  children,
  onRetryStreaming,
  onPauseStreaming,
  onResumeStreaming,
  onSwitchProvider,
  streamingProgress,
  currentProvider,
  availableProviders,
  isStreaming,
  messageId
}) => {
  const handleStreamingError = (error: Error, errorInfo: any) => {
    // Log específico para erros de streaming
    console.error('[StreamingErrorBoundary] Erro no streaming:', {
      error: error.message,
      currentProvider,
      streamingProgress,
      isStreaming,
      messageId,
      availableProviders,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Aqui poderia enviar para serviço de monitoramento
    // trackError('streaming_error', { 
    //   provider: currentProvider, 
    //   progress: streamingProgress,
    //   error: error.message 
    // });
  };

  return (
    <ErrorBoundary
      contextName="Streaming"
      onError={handleStreamingError}
      maxRetries={2}
      resetKeys={[messageId || '', currentProvider || '']}
      resetOnPropsChange={true}
      fallback={
        <StreamingErrorFallback 
          onRetryStreaming={onRetryStreaming}
          onPauseStreaming={onPauseStreaming}
          onResumeStreaming={onResumeStreaming}
          onSwitchProvider={onSwitchProvider}
          streamingProgress={streamingProgress}
          currentProvider={currentProvider}
          availableProviders={availableProviders}
          isStreaming={isStreaming}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default StreamingErrorBoundary;

// Hook específico para erros de streaming
export const useStreamingErrorHandler = () => {
  const handleConnectionError = React.useCallback((error: Error, context?: {
    provider?: string;
    messageId?: string;
    progress?: number;
    retryCount?: number;
  }) => {
    console.error('[StreamingError] Erro de conexão:', {
      error: error.message,
      ...context,
      timestamp: new Date().toISOString()
    });

    // Determinar tipo de erro de streaming
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return 'timeout_error';
    }
    if (error.message.includes('rate') || error.message.includes('limit')) {
      return 'rate_limit_error';
    }
    if (error.message.includes('network') || error.message.includes('connection')) {
      return 'network_error';
    }
    if (error.message.includes('abort') || error.message.includes('cancel')) {
      return 'aborted_error';
    }
    return 'unknown_streaming_error';
  }, []);

  const handleProviderSwitch = React.useCallback((fromProvider: string, toProvider: string, reason?: string) => {
    console.log('[StreamingError] Mudança de provider:', {
      from: fromProvider,
      to: toProvider,
      reason,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    handleConnectionError,
    handleProviderSwitch
  };
};

// Wrapper para componentes de streaming
export const withStreamingErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  streamingErrorProps?: Omit<StreamingErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <StreamingErrorBoundary {...streamingErrorProps}>
      <Component {...props} />
    </StreamingErrorBoundary>
  );
  
  WrappedComponent.displayName = `withStreamingErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};