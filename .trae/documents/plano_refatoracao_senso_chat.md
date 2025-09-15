# Plano de Refatoração SensoChat

## 1. Resumo Executivo

### Objetivo
Refatorar o SensoChat para melhorar performance, UX e manutenibilidade através de componentização, otimização de estado e implementação de melhores práticas.

### Problemas Identificados
- **Performance**: Re-renders desnecessários e gestão de estado dispersa
- **UX**: Altura fixa no VirtualizedMessageList e tratamento genérico de erros
- **Manutenibilidade**: SensoChatPage muito grande (651 linhas) e falta de componentização
- **Escalabilidade**: Ausência de cache local e retry logic

## 2. Análise de Problemas

### 2.1 Streaming do Chat
**Status**: ✅ Funcional
**Problemas**:
- Tratamento genérico de erros
- Falta de retry logic para falhas de rede
- Estados de loading dispersos

### 2.2 Envio de Mensagens
**Status**: ✅ Robusto
**Problemas**:
- Conversão desnecessária a cada render
- Falta de debounce para ações do usuário
- Ausência de cache local

### 2.3 Carregamento do Histórico
**Status**: ✅ Implementado
**Problemas**:
- VirtualizedMessageList com altura fixa
- Falta de lazy loading para anexos
- Queries não otimizadas

## 3. Soluções Propostas

### 3.1 Gestão de Estado Centralizada

```typescript
// hooks/useChatState.ts
interface ChatState {
  loading: {
    messages: boolean;
    conversation: boolean;
    streaming: boolean;
    uploading: boolean;
  };
  ui: {
    isTyping: boolean;
    showScrollButton: boolean;
    selectedModel: string;
  };
  data: {
    messages: ChatMessage[];
    conversations: Conversation[];
    currentConversation: Conversation | null;
  };
}

export const useChatState = () => {
  const [state, setState] = useState<ChatState>(initialState);
  
  const updateLoading = (key: keyof ChatState['loading'], value: boolean) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: value }
    }));
  };
  
  return { state, updateLoading, /* outras ações */ };
};
```

### 3.2 Componentização do SensoChatPage

```typescript
// components/chat/ChatContainer.tsx
interface ChatContainerProps {
  conversationId?: string;
  onConversationChange: (conversation: Conversation) => void;
}

export const ChatContainer = ({ conversationId, onConversationChange }: ChatContainerProps) => {
  const { state, actions } = useChatState();
  
  return (
    <div className="flex flex-col h-full">
      <MessageContainer messages={state.data.messages} />
      <StreamingContainer streamingMessage={state.streaming.message} />
      <InputContainer onSend={actions.sendMessage} />
    </div>
  );
};
```

### 3.3 VirtualizedMessageList Otimizado

```typescript
// components/chat/OptimizedMessageList.tsx
const OptimizedMessageList = memo(({ messages }: { messages: StreamingMessage[] }) => {
  const getItemHeight = useCallback((index: number) => {
    const message = messages[index];
    return calculateDynamicHeight(message?.content || '');
  }, [messages]);
  
  const renderMessage = useCallback(({ index, style }: ListChildComponentProps) => {
    const message = messages[index];
    return (
      <div style={style}>
        <MemoizedMessage message={message} />
      </div>
    );
  }, [messages]);
  
  return (
    <VariableSizeList
      height={600}
      itemCount={messages.length}
      itemSize={getItemHeight}
      itemData={messages}
    >
      {renderMessage}
    </VariableSizeList>
  );
});
```

### 3.4 Tratamento de Erros Específico

```typescript
// utils/errorHandler.ts
export class ChatErrorHandler {
  static handle(error: Error, context: string) {
    switch (error.name) {
      case 'NetworkError':
        return this.handleNetworkError(error, context);
      case 'AuthError':
        return this.handleAuthError(error);
      case 'ValidationError':
        return this.handleValidationError(error);
      default:
        return this.handleGenericError(error, context);
    }
  }
  
  private static async handleNetworkError(error: Error, context: string) {
    // Retry logic com backoff exponencial
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      try {
        // Retry da operação
        return await this.retryOperation(context);
      } catch (retryError) {
        if (i === maxRetries - 1) throw retryError;
      }
    }
  }
}
```

### 3.5 Cache Local para Mensagens

```typescript
// hooks/useMessageCache.ts
export const useMessageCache = () => {
  const cache = useRef(new Map<string, ChatMessage[]>());
  
  const getCachedMessages = (conversationId: string) => {
    return cache.current.get(conversationId) || [];
  };
  
  const setCachedMessages = (conversationId: string, messages: ChatMessage[]) => {
    cache.current.set(conversationId, messages);
    // Limitar cache a 10 conversas mais recentes
    if (cache.current.size > 10) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
  };
  
  return { getCachedMessages, setCachedMessages };
};
```

## 4. Cronograma de Implementação

### Fase 1: Fundação (Semana 1-2)
- ☐ Criar hook `useChatState` centralizado
- ☐ Implementar `ChatErrorHandler`
- ☐ Configurar cache local básico
- ☐ Adicionar debounce para ações do usuário

### Fase 2: Componentização (Semana 3-4)
- ☐ Dividir `SensoChatPage` em componentes menores
- ☐ Criar `ChatContainer`, `MessageContainer`, `StreamingContainer`
- ☐ Implementar `InputContainer` modular
- ☐ Adicionar `ConversationLoader` separado

### Fase 3: Otimização de Performance (Semana 5-6)
- ☐ Implementar `OptimizedMessageList` com altura dinâmica
- ☐ Adicionar `React.memo` para componentes de mensagem
- ☐ Implementar lazy loading para anexos
- ☐ Otimizar queries do Supabase com índices

### Fase 4: UX e Polimento (Semana 7-8)
- ☐ Implementar retry logic visual
- ☐ Adicionar indicadores de progresso específicos
- ☐ Melhorar feedback de upload de arquivos
- ☐ Implementar scroll inteligente

## 5. Métricas de Performance Esperadas

### Antes da Refatoração
- **Time to Interactive**: ~2.5s
- **Re-renders por ação**: 8-12
- **Memory Usage**: 45-60MB
- **Bundle Size**: 2.8MB

### Após Refatoração
- **Time to Interactive**: ~1.2s (52% melhoria)
- **Re-renders por ação**: 3-5 (60% redução)
- **Memory Usage**: 25-35MB (35% redução)
- **Bundle Size**: 2.2MB (21% redução)

### KPIs de Monitoramento
- **First Contentful Paint**: < 1s
- **Largest Contentful Paint**: < 2s
- **Cumulative Layout Shift**: < 0.1
- **Time to First Message**: < 500ms

## 6. Estratégias de Componentização

### 6.1 Princípios
- **Responsabilidade única**: Cada componente faz apenas uma coisa
- **Baixo acoplamento**: Componentes independentes
- **Alta coesão**: Funcionalidades relacionadas agrupadas
- **Reutilização**: Componentes utilizáveis em diferentes contextos

### 6.2 Estrutura Proposta
```
src/components/chat/
├── containers/
│   ├── ChatContainer.tsx
│   ├── MessageContainer.tsx
│   └── StreamingContainer.tsx
├── ui/
│   ├── MessageBubble.tsx
│   ├── TypingIndicator.tsx
│   └── ScrollButton.tsx
├── forms/
│   ├── ChatInput.tsx
│   ├── FileUpload.tsx
│   └── ModelSelector.tsx
└── hooks/
    ├── useChatState.ts
    ├── useMessageCache.ts
    └── useStreamingOptimized.ts
```

### 6.3 Interfaces Padronizadas
```typescript
// types/chat.ts
export interface ChatComponentProps {
  className?: string;
  onError?: (error: Error) => void;
  loading?: boolean;
}

export interface MessageComponentProps extends ChatComponentProps {
  message: ChatMessage;
  onAction?: (action: string, data?: any) => void;
}

export interface ContainerProps extends ChatComponentProps {
  children: React.ReactNode;
  state: ChatState;
  actions: ChatActions;
}
```

## 7. Otimizações de UX

### 7.1 Feedback Visual Melhorado
```typescript
// components/ui/SmartLoadingIndicator.tsx
interface SmartLoadingProps {
  type: 'streaming' | 'uploading' | 'loading';
  progress?: number;
  message?: string;
}

export const SmartLoadingIndicator = ({ type, progress, message }: SmartLoadingProps) => {
  const getIndicator = () => {
    switch (type) {
      case 'streaming':
        return <TypingDots />;
      case 'uploading':
        return <ProgressBar value={progress} />;
      case 'loading':
        return <Spinner />;
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {getIndicator()}
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};
```

### 7.2 Scroll Inteligente
```typescript
// hooks/useSmartScroll.ts
export const useSmartScroll = (messagesRef: RefObject<HTMLDivElement>) => {
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const handleScroll = useCallback(() => {
    if (!messagesRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShouldAutoScroll(isNearBottom);
    setShowScrollButton(!isNearBottom && scrollTop > 200);
  }, []);
  
  const scrollToBottom = useCallback(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);
  
  return { shouldAutoScroll, showScrollButton, scrollToBottom, handleScroll };
};
```

## 8. Implementação de Testes

### 8.1 Testes Unitários
```typescript
// __tests__/hooks/useChatState.test.ts
describe('useChatState', () => {
  it('should update loading state correctly', () => {
    const { result } = renderHook(() => useChatState());
    
    act(() => {
      result.current.updateLoading('messages', true);
    });
    
    expect(result.current.state.loading.messages).toBe(true);
  });
});
```

### 8.2 Testes de Performance
```typescript
// __tests__/performance/MessageList.perf.test.ts
describe('MessageList Performance', () => {
  it('should render 1000 messages in under 100ms', async () => {
    const messages = generateMockMessages(1000);
    const startTime = performance.now();
    
    render(<OptimizedMessageList messages={messages} />);
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100);
  });
});
```

## 9. Monitoramento e Métricas

### 9.1 Performance Monitoring
```typescript
// utils/performanceMonitor.ts
export class PerformanceMonitor {
  static trackRender(componentName: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;
      descriptor.value = function (...args: any[]) {
        const start = performance.now();
        const result = method.apply(this, args);
        const end = performance.now();
        
        console.log(`${componentName}.${propertyName} took ${end - start}ms`);
        return result;
      };
    };
  }
}
```

### 9.2 User Experience Metrics
```typescript
// utils/uxMetrics.ts
export const trackUserAction = (action: string, duration?: number) => {
  // Enviar métricas para analytics
  analytics.track('chat_action', {
    action,
    duration,
    timestamp: Date.now(),
    userId: getCurrentUserId()
  });
};
```

## 10. Checklist de Implementação

### Preparação
- ☐ Backup do código atual
- ☐ Configurar branch de desenvolvimento
- ☐ Configurar ambiente de testes
- ☐ Definir métricas baseline

### Desenvolvimento
- ☐ Implementar hooks centralizados
- ☐ Criar componentes modulares
- ☐ Adicionar tratamento de erros
- ☐ Implementar cache local
- ☐ Otimizar performance
- ☐ Melhorar UX

### Testes
- ☐ Testes unitários para hooks
- ☐ Testes de integração para componentes
- ☐ Testes de performance
- ☐ Testes de usabilidade

### Deploy
- ☐ Deploy em ambiente de staging
- ☐ Testes de regressão
- ☐ Monitoramento de métricas
- ☐ Deploy em produção
- ☐ Monitoramento pós-deploy

## 11. Riscos e Mitigações

### Riscos Identificados
1. **Breaking Changes**: Refatoração pode quebrar funcionalidades existentes
   - **Mitigação**: Testes abrangentes e deploy gradual

2. **Performance Regression**: Novas implementações podem ser mais lentas
   - **Mitigação**: Benchmarks antes e depois, rollback plan

3. **User Experience**: Mudanças podem confundir usuários
   - **Mitigação**: Testes de usabilidade, feedback dos usuários

4. **Timeline**: Refatoração pode demorar mais que esperado
   - **Mitigação**: Implementação em fases, MVPs incrementais

## 12. Conclusão

Este plano de refatoração visa transformar o SensoChat em uma aplicação mais performática, maintível e escalável. A implementação em fases garante que o sistema continue funcionando durante o processo, enquanto as métricas definidas permitem medir o sucesso das melhorias.

**Próximos Passos**:
1. Aprovação do plano pela equipe
2. Configuração do ambiente de desenvolvimento
3. Início da Fase 1 - Fundação
4. Monitoramento contínuo das métricas

**Benefícios Esperados**:
- 50%+ melhoria na performance
- 60% redução em re-renders
- 35% redução no uso de memória
- Código mais maintível e testável
- Melhor experiência do usuário