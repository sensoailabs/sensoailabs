import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ChatInput from '@/components/ChatInput';
import LogoAnimated from '@/components/LogoAnimated';
import { Bot, User } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { SidebarChat } from '@/components/SidebarChat';
import { MessageActions } from '@/components/MessageActions';
import { UserMessageActions } from '@/components/UserMessageActions';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { chatService } from '@/services/chatService';
import type { ChatMessage, Conversation, ChatRequest } from '@/services/chatService';
import { useChatStream } from '@/hooks/useChatStream';
import StreamingMessage from '@/components/StreamingMessage';
import TypingIndicator from '@/components/TypingIndicator';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/clientLogger';

// Usando ChatMessage do serviço

export default function SensoChatPage() {
  const { userData } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFirstMessage, setHasFirstMessage] = useState(false);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);
  const { streamingMessage, isTyping, startStreaming, isStreaming, stopStreaming } = useChatStream();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Verificar usuário autenticado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    checkUser();
  }, []);

  // Função para posicionar mensagem específica no topo da viewport
  const scrollToMessage = (messageId: string) => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
          // Obter a posição da mensagem relativa ao container de scroll
          const messageOffsetTop = messageElement.offsetTop;
          // Ajustar para considerar o padding do container (24px = p-6)
          const adjustedScrollTop = messageOffsetTop - 24;
          
          messagesContainerRef.current.scrollTo({
            top: Math.max(0, adjustedScrollTop),
            behavior: 'smooth'
          });
        }
      }
    }, 150);
  };

  // Auto-scroll para posicionar nova mensagem no topo quando enviada
  useEffect(() => {
    if (newMessageId && hasFirstMessage) {
      scrollToMessage(newMessageId);
    }
  }, [newMessageId, hasFirstMessage]);

  // Efeito para destacar nova mensagem
  useEffect(() => {
    if (newMessageId) {
      const timer = setTimeout(() => {
        setNewMessageId(null);
      }, 2000); // Remove destaque após 2 segundos
      return () => clearTimeout(timer);
    }
  }, [newMessageId]);

  const handleUserMessage = (message: ChatMessage) => {
    // Adicionar mensagem do usuário ao estado
    setMessages(prev => [...prev, message]);
    
    // Ativar posicionamento fixo após primeira mensagem
    if (!hasFirstMessage) {
      setHasFirstMessage(true);
    }
    
    // Destacar nova mensagem
    setNewMessageId(message.id || null);
  };

  const handleAIMessage = (message: ChatMessage) => {
    // Adicionar mensagem da IA ao estado SEM rolagem automática
    setMessages(prev => [...prev, message]);
  };

  const handleMessageSent = async (content: string, conversationId?: string) => {
    if (!currentUserId) {
      logger.error('Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    
    // Ativar posicionamento fixo após primeira mensagem
    if (!hasFirstMessage) {
      setHasFirstMessage(true);
    }
    
    try {
      // Adicionar mensagem do usuário imediatamente
       const userMessage: ChatMessage = {
          id: Date.now().toString(),
          content,
          role: 'user',
          conversation_id: conversationId || currentConversation?.id || ''
        };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Destacar nova mensagem
      setNewMessageId(userMessage.id || null);
      
      // Iniciar streaming da resposta
         const chatRequest: ChatRequest = {
           message: content,
           conversationId: conversationId || currentConversation?.id,
           userId: currentUserId || '',
           preferredProvider: 'gpt-4'
         };
         
         startStreaming(chatRequest, (aiMessage) => {
           handleAIMessage(aiMessage);
         });
         
         const response = await chatService.saveMessage(userMessage);
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsLoading(false);
      stopStreaming();
    }
  };

  const handleConversationCreated = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const handleRegenerateMessage = async (messageIndex: number) => {
    if (!currentUserId) {
      logger.error('Usuário não autenticado');
      return;
    }

    // Encontrar a mensagem do usuário anterior à mensagem da IA
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') {
      logger.error('Não foi possível encontrar a mensagem do usuário correspondente');
      return;
    }

    // Remover a mensagem da IA atual e todas as posteriores
    setMessages(prev => prev.slice(0, messageIndex));

    // Reenviar a mensagem do usuário
    try {
      const chatRequest: ChatRequest = {
            message: userMessage.content,
            conversationId: currentConversation?.id,
            userId: currentUserId,
            preferredProvider: 'gpt-4'
          };
      
      startStreaming(chatRequest, (aiMessage) => {
        handleAIMessage(aiMessage);
      });
    } catch (error) {
      logger.error('Erro ao regenerar mensagem:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return '🤖';
      case 'gemini':
        return '✨';
      case 'claude':
        return '🧠';
      default:
        return '🤖';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Main Content with Sidebar */}
      <main className="">
        <SidebarProvider>
          <SidebarChat />
          <SidebarInset className="flex flex-col min-h-[calc(100vh-4rem)] relative">
            <header
              className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 animate-smooth-fade-up"
              style={{ animationDelay: '80ms', willChange: 'transform, opacity' }}
            >
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                        Senso AI Labs
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Chat</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            {/* Conteúdo do chat com espaço condicional para input */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto flex justify-center px-4 sm:px-6 lg:px-8" 
              style={{maxHeight: hasFirstMessage ? 'calc(100vh - 340px)' : 'calc(100vh - 200px)'}}
            >
                 <div className="w-full max-w-4xl" style={{paddingBottom: hasFirstMessage ? '20px' : '200px', minHeight: hasFirstMessage ? 'calc(100vh - 340px)' : 'calc(100vh - 200px)'}}>
                  <div
                    className="bg-white rounded-2xl animate-smooth-fade-up mb-6"
                    style={{ animationDelay: '160ms', willChange: 'transform, opacity' }}
                  >
              {messages.length === 0 ? (
                <div
                  className="p-12 text-center animate-smooth-fade-up"
                  style={{ animationDelay: '220ms', willChange: 'transform, opacity' }}
                >
                  <div className="mx-auto mb-4 flex justify-center animate-smooth-fade-up" style={{ animationDelay: '260ms' }}>
                    <LogoAnimated />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 animate-smooth-fade-up" style={{ animationDelay: '300ms' }}>
                    Boas vindas ao Senso Chat
                  </h3>
                  <p className="text-gray-500 mb-6 animate-smooth-fade-up" style={{ animationDelay: '340ms' }}>
                    Digite sua primeira mensagem abaixo para começar a conversar.
                  </p>
                </div>
              ) : (
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {messages.map((message, idx) => (
                    <div
                      key={message.id}
                      id={`message-${message.id}`}
                      className={`flex items-start gap-4 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                    >
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-blue-600 text-white">
                          {userData?.photo_url ? (
                            <img 
                              src={userData.photo_url} 
                              alt="User" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                      )}
                      <div className={`${
                        message.role === 'user' 
                          ? 'flex flex-col items-end group' 
                          : 'inline-block max-w-fit group'
                      } transition-all duration-200 ease-in-out`}>
                        {message.role === 'user' ? (
                          <>
                            <div className="bg-[#F5F5F5] rounded-xl px-4 py-2 inline-block max-w-fit">
                              <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <UserMessageActions 
                              content={message.content}
                              onEdit={() => console.log('Editar mensagem:', message.content)}
                            />
                          </>
                        ) : (
                          <>
                            <MarkdownRenderer content={message.content} />
                            <MessageActions 
                                content={message.content}
                                onRegenerate={() => handleRegenerateMessage(idx)}
                              />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Indicador de digitação - apenas quando não há streaming */}
                  {isTyping && !streamingMessage && (
                    <div className="flex items-start">
                      <div className="inline-block max-w-fit">
                         <TypingIndicator isVisible={true} />
                       </div>
                    </div>
                  )}
                  
                  {/* Mensagem em streaming */}
                  {streamingMessage && (
                    <div className="flex items-start">
                      <div className="inline-block max-w-fit">
                         <StreamingMessage message={streamingMessage} getModelIcon={(model?: string) => getProviderIcon(model || 'openai')} />
                      </div>
                    </div>
                  )}
                  


                </div>
              )}
              
              {/* Input do chat quando não há mensagens (posição normal) */}
              {!hasFirstMessage && (
                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                  <ChatInput 
                     onMessageSent={handleUserMessage}
                     onConversationCreated={handleConversationCreated}
                     currentConversationId={currentConversation?.id}
                     currentUserId={currentUserId || undefined}
                     isLoading={isLoading}
                     chatStreamHook={{ streamingMessage, isTyping, startStreaming, isStreaming, stopStreaming }}
                   />
                </div>
              )}              
                </div>
              </div>
              
            </div>

            {/* Input do chat fixo na parte inferior (após primeira mensagem) */}
            {hasFirstMessage && (
              <div className="py-6 flex justify-center px-4 sm:px-6 lg:px-8" style={{height: 'auto', minHeight: '240px'}}>
                <div className="w-full max-w-4xl">
                  <ChatInput 
                     onMessageSent={handleUserMessage}
                     onConversationCreated={handleConversationCreated}
                     currentConversationId={currentConversation?.id}
                     currentUserId={currentUserId || undefined}
                     isLoading={isLoading}
                     chatStreamHook={{ streamingMessage, isTyping, startStreaming, isStreaming, stopStreaming }}
                   />
                </div>
              </div>              
            )}
          </SidebarInset>
        </SidebarProvider>
      </main>
    </div>
  );
}