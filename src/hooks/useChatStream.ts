import { useState, useCallback } from 'react';
import { chatService } from '@/services/chatService';
import type { ChatMessage, ChatRequest, Conversation } from '@/services/chatService';
import logger from '@/lib/clientLogger';

export interface StreamingMessage {
  id: string;
  content: string;
  role: 'assistant';
  isStreaming: boolean;
  isComplete: boolean;
}

export const useChatStream = () => {
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [wasCancelled, setWasCancelled] = useState(false);

  const startStreaming = useCallback(async (
    request: ChatRequest,
    onMessageComplete?: (message: ChatMessage) => void,
    onConversationCreated?: (conversation: Conversation) => void,
    onUserMessageSaved?: (message: ChatMessage) => void
  ) => {
    try {
      setIsTyping(true);
      setIsStreaming(true);
      
      setIsTyping(false);
      
      // Criar mensagem de streaming inicial
      const streamId = `stream-${Date.now()}`;
      setStreamingMessage({
        id: streamId,
        content: '',
        role: 'assistant',
        isStreaming: true,
        isComplete: false
      });

      let fullContent = '';
      
      // Processar stream
      for await (const chunk of chatService.processChatStream(request)) {
        if (chunk.type === 'message') {
          // Nova conversa foi criada
          if (!request.conversationId && onConversationCreated && chunk.data.conversation) {
            onConversationCreated(chunk.data.conversation);
          }
          
          // Mensagem do usuário foi salva
          if (onUserMessageSaved && chunk.data.userMessage) {
            onUserMessageSaved(chunk.data.userMessage);
          }
        } else if (chunk.type === 'chunk') {
          fullContent += chunk.data.content || '';
          setStreamingMessage(prev => prev ? {
            ...prev,
            content: fullContent
          } : null);
        } else if (chunk.type === 'complete') {
          // Finalizar streaming
          setStreamingMessage(prev => prev ? {
            ...prev,
            isStreaming: false,
            isComplete: true
          } : null);
          
          // Notificar mensagem completa
          if (onMessageComplete && chunk.data.message) {
            onMessageComplete(chunk.data.message);
          }
          
          // Limpar streaming imediatamente para transição fluida
          setStreamingMessage(null);
          
          break;
        }
      }
      
    } catch (error) {
      logger.error('Error in chat streaming', { error });
      setStreamingMessage(null);
      setIsTyping(false);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stopStreaming = useCallback((onCancelled?: (cancelMessage: ChatMessage) => void) => {
    setWasCancelled(true);
    setIsStreaming(false);
    setIsTyping(false);
    
    // Criar mensagem de cancelamento
    const cancelMessage: ChatMessage = {
      id: `cancelled-${Date.now()}`,
      content: 'Geração interrompida pelo usuário',
      role: 'assistant',
      timestamp: new Date(),
      isCancelled: true,
      conversation_id: ''
    };
    
    setStreamingMessage(null);
    
    // Notificar sobre o cancelamento
    if (onCancelled) {
      onCancelled(cancelMessage);
    }
  }, []);

  return {
    streamingMessage,
    isStreaming,
    isTyping,
    wasCancelled,
    startStreaming,
    stopStreaming
  };
};