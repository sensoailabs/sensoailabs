import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox"; - removido, não utilizado
import { ModelCombobox } from "@/components/ui/combobox";
import { 
  Paperclip, 
  Telescope, 
  Globe, 
  ArrowUp,
  Loader2,
  WandSparkles,
  Undo2,
  CircleStop
} from 'lucide-react';
import { chatService } from '@/services/chatService';
import logger from '@/lib/clientLogger';
import type { ChatMessage, Conversation } from '@/services/chatService';
import { chatWithAI } from '@/lib/aiProviders';
import type { AIMessage } from '@/lib/aiProviders';
import { useChatStream } from '@/hooks/useChatStream';
import { useFileUpload } from '@/hooks/use-file-upload';
import FileList from '@/components/FileList';


interface ChatInputProps {
  onMessageSent?: (message: ChatMessage) => void;
  onConversationCreated?: (conversation: Conversation) => void;
  currentConversationId?: string;
  currentUserId?: string;
  isLoading?: boolean;
  enableStreaming?: boolean;
  chatStreamHook?: ReturnType<typeof useChatStream>;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export default function ChatInput({ 
  onMessageSent, 
  onConversationCreated, 
  currentConversationId,
  currentUserId,
  isLoading = false,
  enableStreaming = true,
  chatStreamHook,
  selectedModel = 'gpt-4o',
  onModelChange
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const internalSelectedModel = selectedModel;
  const [deepResearch, setDeepResearch] = useState(false);
  const [webSearch, setWebSearch] = useState(false);

  // const [investigateMode, setInvestigateMode] = useState(false); - removido, não utilizado
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [isSending, setIsSending] = useState(false);
  // const [isFocused, setIsFocused] = useState(false); - removido, não utilizado
  const defaultHook = useChatStream();
  const { startStreaming, isStreaming, isTyping, stopStreaming } = chatStreamHook || defaultHook;
  // const id = useId(); - removido, não utilizado
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Hook para upload de arquivos
  const [
    { files, errors, isUploading },
    {
      removeFile,
      clearFiles,
      openFileDialog,
      getInputProps,
      uploadFiles,
      // handleDragEnter - removido, não utilizado
      // handleDragLeave - removido, não utilizado
      // handleDragOver - removido, não utilizado
      // handleDrop - removido, não utilizado
    }
  ] = useFileUpload({
    multiple: true,
    maxFiles: 6,
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: "image/*,application/pdf,.doc,.docx,.txt,.csv,.xls,.xlsx",
    userId: currentUserId,
    enableRealUpload: true
  });
  
  const isProcessing = isSending || isStreaming || isLoading || isTyping || isUploading;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '24px';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(scrollHeight, 300) + 'px';
    }
  }, [message]);

  const optimizeText = async () => {
    if (!message.trim() || isOptimizing) return;
    
    setIsOptimizing(true);
    setOriginalText(message); // Armazenar texto original
    
    try {
      const optimizationMessages: AIMessage[] = [
        {
          role: 'system',
          content: 'Você é um especialista em otimização de prompts. Transforme o texto do usuário em um prompt mais claro, específico e eficaz. Mantenha a intenção original, mas melhore a clareza, adicione contexto relevante e estruture melhor a solicitação. Responda APENAS com o texto otimizado, sem aspas ou explicações.'
        },
        {
          role: 'user',
          content: message.trim()
        }
      ];
      
      const response = await chatWithAI(optimizationMessages, currentUserId || 'anonymous');
      let optimizedText = response.content.trim();
      
      // Remover aspas do início e fim se existirem
      if ((optimizedText.startsWith('"') && optimizedText.endsWith('"')) || 
          (optimizedText.startsWith("'") && optimizedText.endsWith("'"))) {
        optimizedText = optimizedText.slice(1, -1);
      }
      
      setMessage(optimizedText);
      
    } catch (error) {
      logger.error('Error optimizing text:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const undoOptimization = () => {
    if (originalText) {
      setMessage(originalText);
      setOriginalText('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || files.length > 0) && !isProcessing) {
      setIsSending(true);
      
      try {
        const userMessage = message.trim() || '';
        setMessage('');
        
        if (!currentUserId) {
          throw new Error('Usuário não autenticado');
        }
        
        // Fazer upload real dos arquivos se existirem
        let uploadedFileAttachments: any[] = [];
        if (files.length > 0) {
          const uploadedFiles = await uploadFiles();
          uploadedFileAttachments = uploadedFiles;
        }
        
        if (enableStreaming) {
          // Usar streaming com geração automática de título
          await startStreaming({
            message: userMessage,
            conversationId: currentConversationId,
            userId: currentUserId,
            preferredProvider: internalSelectedModel,
            fileAttachments: uploadedFileAttachments.length > 0 ? uploadedFileAttachments : undefined
          }, (completedMessage) => {
            onMessageSent?.(completedMessage);
          }, (newConversation) => {
            onConversationCreated?.(newConversation);
          }, (savedUserMessage) => {
            // Atualizar a mensagem do usuário com dados do banco (ID real, etc.)
            onMessageSent?.(savedUserMessage);
          });
        } else {
          // Processar chat completo sem streaming
          const response = await chatService.processChat({
            message: userMessage,
            conversationId: currentConversationId,
            userId: currentUserId,
            preferredProvider: internalSelectedModel,
            fileAttachments: uploadedFileAttachments.length > 0 ? uploadedFileAttachments : undefined
          });
          
          // Buscar a mensagem da IA
          const messages = await chatService.getConversationMessages(response.conversation.id!);
          const aiMessage = messages[messages.length - 1];
          if (aiMessage && aiMessage.role === 'assistant') {
            onMessageSent?.(aiMessage);
          }
          
          // Notificar sobre nova conversa se foi criada
          if (!currentConversationId) {
            onConversationCreated?.(response.conversation);
          }
        }
        
        // Limpar campos após envio
        clearFiles();
        
        logger.info('Chat message processed successfully', {
          conversationId: currentConversationId,
          model: internalSelectedModel,
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
    if (isUploading) return "Fazendo upload dos arquivos...";
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
    <div className="w-full max-w-4xl mx-auto">
      {/* Container integrado do Input e FileList */}
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Lista de arquivos selecionados */}
        {files.length > 0 && (
          <div className="border-b border-gray-100">
            <FileList
              files={files}
              onRemoveFile={removeFile}
              errors={errors}
            />
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            // onFocus e onBlur removidos - setIsFocused não utilizado
            placeholder="Pergunte-me qualquer coisa..."
            className={`min-h-[24px] max-h-[300px] resize-none border-0 bg-transparent p-4 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 ${
               isOptimizing ? 'optimizing-text' : ''
             }`}
            style={{ 
              fontSize: '16px',
              lineHeight: '1.5',
              height: '24px',
              overflowY: 'hidden'
            }}
            rows={1}
            disabled={isLoading || isSending || isOptimizing}
          />
          
          {/* Barra de ferramentas */}
          <div className="flex items-center justify-between p-3">
            {/* Botões de ação à esquerda */}
            <div className="flex items-center gap-2">
              {/* 1- Seletor de Modelo */}
              <div className="border border-input rounded-lg">
                <ModelCombobox 
                  value={internalSelectedModel} 
                  onValueChange={onModelChange || (() => {})} 
                />
              </div>
              
              {/* 2- Upload de arquivos */}
              <input {...getInputProps()} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-input hover:bg-gray-50"
                title="Anexar arquivo"
                onClick={openFileDialog}
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
              </Button>
              
              {/* 3- Web Search */}
              {!webSearch ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-input hover:bg-gray-50"
                  title="Pesquisar na web"
                  onClick={() => setWebSearch(true)}
                >
                  <Globe className="w-4 h-4 text-gray-500" />
                </Button>
              ) : (
                <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   className="h-8 px-3 border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300"
                   title="Pesquisar na web (ativo)"
                   onClick={() => setWebSearch(false)}
                 >
                   <Globe className="w-4 h-4 mr-0.5" />
                   <span className="text-xs font-medium">Web</span>
                 </Button>
              )}
              
              {/* 4- Deep Research */}
              {!deepResearch ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-input hover:bg-gray-50"
                  title="Investigação profunda"
                  onClick={() => setDeepResearch(true)}
                >
                  <Telescope className="w-4 h-4 text-gray-500" />
                </Button>
              ) : (
                <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   className="h-8 px-3 border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300"
                   title="Investigação profunda (ativo)"
                   onClick={() => setDeepResearch(false)}
                 >
                   <Telescope className="w-4 h-4 mr-0.5" />
                   <span className="text-xs font-medium">Investigar</span>
                 </Button>
              )}
            </div>

            {/* Botões à direita */}
            <div className="flex items-center gap-2">
              {/* Botão Spark */}
               <Button
                 type="button"
                 variant="outline"
                 size="sm"
                 className="h-8 w-8 p-0 border-input hover:bg-gray-50"
                 title={originalText ? "Desfazer otimização" : "Otimizar texto"}
                 onClick={originalText ? undoOptimization : optimizeText}
                 disabled={!message.trim() || isOptimizing}
               >
                 {isOptimizing ? (
                   <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                 ) : originalText ? (
                   <Undo2 className="w-4 h-4 text-gray-500" />
                 ) : (
                   <WandSparkles className="w-4 h-4 text-gray-500" />
                 )}
               </Button>
              
              {/* Botão de envio/parar */}
              {isStreaming || isTyping ? (
                <Button
                  type="button"
                  onClick={() => stopStreaming((cancelMessage) => {
                    // Exibir mensagem de cancelamento
                    onMessageSent?.(cancelMessage);
                  })}
                  className="h-8 w-8 p-0 rounded-lg transition-colors"
                  style={{
                    background: 'linear-gradient(90deg, #4E67FF 0%, #4EAFFF 79.07%, #98D4F8 102.23%)'
                  }}
                  title="Parar geração"
                >
                  <CircleStop className="w-4 h-4 text-white" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={(!message.trim() && files.length === 0) || isProcessing}
                  className="h-8 w-8 p-0 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg"
                  style={{
                    background: (!message.trim() && files.length === 0) || isProcessing 
                      ? undefined 
                      : 'linear-gradient(90deg, #4E67FF 0%, #4EAFFF 79.07%, #98D4F8 102.23%)'
                  }}
                  title={isProcessing ? getProcessingStatus() : "Enviar mensagem"}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4 text-white" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>

      </div>

      {/* Texto informativo */}
      <p className="text-xs text-gray-500 text-center mt-2">
        Senso AI pode cometer erros. Considere verificar informações importantes.
      </p>
    </div>
  );
}