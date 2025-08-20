import React, { useState, useId } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ModelCombobox } from "@/components/ui/combobox";
import { 
  Paperclip, 
  Telescope, 
  Globe, 
  Send,
  Loader2
} from 'lucide-react';
import { chatService } from '@/services/chatService';
import logger from '@/lib/clientLogger';
import type { ChatMessage, Conversation } from '@/services/chatService';
import { useChatStream } from '@/hooks/useChatStream';

interface ChatInputProps {
  onMessageSent?: (message: ChatMessage) => void;
  onConversationCreated?: (conversation: Conversation) => void;
  currentConversationId?: string;
  currentUserId?: string;
  isLoading?: boolean;
  enableStreaming?: boolean;
  chatStreamHook?: ReturnType<typeof useChatStream>;
}

export default function ChatInput({ 
  onMessageSent, 
  onConversationCreated, 
  currentConversationId,
  currentUserId,
  isLoading = false,
  enableStreaming = true,
  chatStreamHook
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [deepResearch, setDeepResearch] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const defaultHook = useChatStream();
  const { startStreaming, isStreaming, isTyping } = chatStreamHook || defaultHook;
  const id = useId();
  
  const isProcessing = isSending || isStreaming || isLoading || isTyping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      setIsSending(true);
      
      try {
        const userMessage = message.trim();
        setMessage('');
        
        if (!currentUserId) {
          throw new Error('Usuário não autenticado');
        }
        
        // Se não há conversa ativa, criar uma nova
        let conversationId = currentConversationId;
        if (!conversationId) {
          const newConversation = await chatService.createConversation(
            currentUserId,
            'Nova Conversa',
            selectedModel
          );
          conversationId = newConversation.id!;
          onConversationCreated?.(newConversation);
        }
        
        // Criar mensagem do usuário primeiro
        const userMessage_obj = await chatService.saveMessage({
          conversation_id: conversationId,
          role: 'user',
          content: userMessage,
          model_used: selectedModel
        });
        onMessageSent?.(userMessage_obj);
        
        if (enableStreaming) {
          // Usar streaming
          await startStreaming({
            message: userMessage,
            conversationId,
            userId: currentUserId,
            preferredProvider: selectedModel
          }, (completedMessage) => {
            onMessageSent?.(completedMessage);
          });
        } else {
          // Processar chat completo sem streaming
          const response = await chatService.processChat({
            message: userMessage,
            conversationId,
            userId: currentUserId,
            preferredProvider: selectedModel
          });
          
          // Buscar a mensagem da IA
          const messages = await chatService.getConversationMessages(conversationId);
          const aiMessage = messages[messages.length - 1];
          if (aiMessage && aiMessage.role === 'assistant') {
            onMessageSent?.(aiMessage);
          }
        }
        
        logger.info('Chat message processed successfully', {
          conversationId,
          model: selectedModel,
          webSearch,
          deepResearch
        });
        
      } catch (error) {
        logger.error('Error sending message', { error });
        console.error('Erro ao enviar mensagem:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const getProcessingStatus = () => {
    if (isTyping) return "IA está digitando...";
    if (isStreaming) return "Recebendo resposta...";
    if (isSending) return "Enviando mensagem...";
    if (isLoading) return "Carregando...";
    return "Processando...";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-[680px] mx-auto">
      {/* Container do Input */}
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Textarea */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte-me qualquer coisa..."
            className="min-h-[120px] max-h-[300px] resize-none border-0 bg-transparent p-4 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ 
              fontSize: '16px',
              lineHeight: '1.5'
            }}
          />
          
          {/* Barra de ferramentas */}
          <div className="flex items-center justify-between p-3 border-t border-gray-100">
            {/* Botões de ação à esquerda */}
            <div className="flex items-center gap-2">
              {/* 1- Seletor de Modelo */}
              <div className="border border-input rounded-lg">
                <ModelCombobox 
                  value={selectedModel} 
                  onValueChange={setSelectedModel} 
                />
              </div>
              
              {/* 2- Upload de arquivos */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-input hover:bg-gray-50"
                title="Anexar arquivo"
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
              </Button>
              
              {/* 3- Web Search Checkbox */}
              <label 
                className={`relative flex h-8 px-3 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-center transition-all outline-none hover:bg-gray-50 ${
                  webSearch 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-input text-gray-500 hover:border-gray-300'
                }`}
                title="Pesquisar na web"
              >
                <Checkbox 
                  id={`${id}-web-search`}
                  checked={webSearch}
                  onCheckedChange={setWebSearch}
                  className="sr-only" 
                />
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium">Web</span>
              </label>
              
              {/* 4- Deep Research Checkbox */}
              <label 
                className={`relative flex h-8 px-3 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-center transition-all outline-none hover:bg-gray-50 ${
                  deepResearch 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-input text-gray-500 hover:border-gray-300'
                }`}
                title="Deep Research"
              >
                <Checkbox 
                  id={`${id}-deep-research`}
                  checked={deepResearch}
                  onCheckedChange={setDeepResearch}
                  className="sr-only" 
                />
                <Telescope className="w-4 h-4" />
                <span className="text-xs font-medium">Investigar</span>
              </label>
            </div>

            {/* Botão de envio à direita */}
            <Button
              type="submit"
              disabled={!message.trim() || isProcessing}
              className="h-8 w-8 p-0 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg"
              title={isProcessing ? getProcessingStatus() : "Enviar mensagem"}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Texto informativo */}
      <p className="text-xs text-gray-500 text-center mt-3">
        Senso AI pode cometer erros. Considere verificar informações importantes.
      </p>
    </div>
  );
}