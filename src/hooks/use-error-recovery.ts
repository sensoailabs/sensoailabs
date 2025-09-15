import { useState, useCallback, useRef, useEffect } from 'react';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

interface ErrorRecoveryState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  lastRetryAt: Date | null;
}

const DEFAULT_OPTIONS: Required<ErrorRecoveryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  onRetry: () => {},
  onMaxRetriesReached: () => {},
  shouldRetry: () => true
};

export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
    lastRetryAt: null
  });

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const calculateDelay = useCallback((attempt: number): number => {
    if (!opts.exponentialBackoff) {
      return opts.retryDelay;
    }
    return opts.retryDelay * Math.pow(2, attempt - 1);
  }, [opts.retryDelay, opts.exponentialBackoff]);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({
      ...prev,
      error,
      retryCount: error ? prev.retryCount : 0,
      canRetry: error ? prev.retryCount < opts.maxRetries : true,
      isRetrying: false
    }));
  }, [opts.maxRetries]);

  const retry = useCallback(async (actionFn?: () => Promise<void> | void) => {
    if (!state.error || !state.canRetry || state.isRetrying) {
      return;
    }

    const nextAttempt = state.retryCount + 1;
    
    if (!opts.shouldRetry(state.error, nextAttempt)) {
      setState(prev => ({ ...prev, canRetry: false }));
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: nextAttempt,
      lastRetryAt: new Date()
    }));

    opts.onRetry(nextAttempt, state.error);

    const delay = calculateDelay(nextAttempt);
    
    return new Promise<void>((resolve, reject) => {
      retryTimeoutRef.current = setTimeout(async () => {
        try {
          if (actionFn) {
            await actionFn();
          }
          
          setState(prev => ({
            ...prev,
            error: null,
            isRetrying: false,
            canRetry: true
          }));
          
          resolve();
        } catch (error) {
          const newError = error instanceof Error ? error : new Error(String(error));
          const canRetryAgain = nextAttempt < opts.maxRetries;
          
          setState(prev => ({
            ...prev,
            error: newError,
            isRetrying: false,
            canRetry: canRetryAgain
          }));

          if (!canRetryAgain) {
            opts.onMaxRetriesReached(newError);
          }
          
          reject(newError);
        }
      }, delay);
    });
  }, [state, opts, calculateDelay]);

  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
      lastRetryAt: null
    });
  }, []);

  const executeWithRecovery = useCallback(async <T>(
    actionFn: () => Promise<T>,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      const result = await actionFn();
      
      // Sucesso - limpar erro anterior se houver
      if (state.error) {
        setError(null);
      }
      
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setError(errorObj);
      
      if (onError) {
        onError(errorObj);
      }
      
      return null;
    }
  }, [state.error, setError]);

  return {
    // Estado
    error: state.error,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    canRetry: state.canRetry,
    lastRetryAt: state.lastRetryAt,
    
    // Ações
    setError,
    retry,
    reset,
    executeWithRecovery,
    
    // Utilitários
    hasError: !!state.error,
    nextRetryDelay: state.canRetry ? calculateDelay(state.retryCount + 1) : null
  };
};

// Hook específico para operações de chat
export const useChatErrorRecovery = () => {
  return useErrorRecovery({
    maxRetries: 3,
    retryDelay: 2000,
    exponentialBackoff: true,
    shouldRetry: (error, attempt) => {
      // Não tentar novamente para erros de autenticação
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return false;
      }
      
      // Não tentar novamente para erros de validação
      if (error.message.includes('400') || error.message.includes('validation')) {
        return false;
      }
      
      return attempt <= 3;
    },
    onRetry: (attempt, error) => {
      console.log(`[ChatErrorRecovery] Tentativa ${attempt} para erro:`, error.message);
    },
    onMaxRetriesReached: (error) => {
      console.error('[ChatErrorRecovery] Máximo de tentativas atingido:', error.message);
    }
  });
};

// Hook específico para operações de upload
export const useUploadErrorRecovery = () => {
  return useErrorRecovery({
    maxRetries: 2,
    retryDelay: 3000,
    exponentialBackoff: false,
    shouldRetry: (error, attempt) => {
      // Não tentar novamente para arquivos muito grandes
      if (error.message.includes('file too large') || error.message.includes('413')) {
        return false;
      }
      
      // Não tentar novamente para tipos de arquivo inválidos
      if (error.message.includes('invalid file type') || error.message.includes('unsupported')) {
        return false;
      }
      
      return attempt <= 2;
    },
    onRetry: (attempt, error) => {
      console.log(`[UploadErrorRecovery] Tentativa ${attempt} para erro:`, error.message);
    }
  });
};

// Hook específico para operações de streaming
export const useStreamingErrorRecovery = () => {
  return useErrorRecovery({
    maxRetries: 5,
    retryDelay: 1500,
    exponentialBackoff: true,
    shouldRetry: (error, attempt) => {
      // Tentar novamente para erros de rede
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return attempt <= 5;
      }
      
      // Tentar novamente para erros de rate limit (com delay maior)
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return attempt <= 3;
      }
      
      // Não tentar novamente para erros de autenticação
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      
      return attempt <= 2;
    },
    onRetry: (attempt, error) => {
      console.log(`[StreamingErrorRecovery] Tentativa ${attempt} para erro:`, error.message);
    }
  });
};

// Utilitário para criar hooks personalizados de recovery
export const createErrorRecoveryHook = (options: ErrorRecoveryOptions) => {
  return () => useErrorRecovery(options);
};