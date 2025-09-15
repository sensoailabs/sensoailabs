import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ChatInput from '@/components/ChatInput';
import LogoAnimated from '@/components/LogoAnimated';
import MessageFilePreview from '@/components/MessageFilePreview';
import VirtualizedMessageList from '@/components/VirtualizedMessageList';
import type { VirtualizedMessageListRef } from '@/components/VirtualizedMessageList';
import { User, CircleStop } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { SidebarChat } from '@/components/SidebarChat';
import { MessageActions } from '@/components/MessageActions';
import { UserMessageActions } from '@/components/UserMessageActions';
import ChatErrorBoundary from '@/components/ui/chat-error-boundary';
import StreamingErrorBoundary from '@/components/ui/streaming-error-boundary';
import { Spinner } from '@/components/ui/spinner';
import { useDebounce } from '@/hooks/useDebounce';
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
import { getConversationMessagesPaginated, chatService } from '@/services/chatService';
import type { ChatMessage, Conversation, ChatRequest } from '@/services/chatService';
import { useChatStream } from '@/hooks/useChatStream';
import type { StreamingMessage } from '@/hooks/useChatStream';
import StreamingMessageComponent from '@/components/StreamingMessage';
import TypingIndicator from '@/components/TypingIndicator';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/clientLogger';

// Usando ChatMessage do serviço

export default function SensoChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { userData } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Converter ChatMessage para StreamingMessage para o VirtualizedMessageList
   const convertToStreamingMessages = (chatMessages: ChatMessage[]): StreamingMessage[] => {
     return chatMessages.map(msg => ({
       id: msg.id || `msg-${Date.now()}-${Math.random()}`,
       content: msg.content,
       role: msg.role as 'assistant',
       isStreaming: false,
       isComplete: true
     }));
   };
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading] = useState(false);
  const [hasFirstMessage, setHasFirstMessage] = useState(false);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);
  const [refreshSidebar, setRefreshSidebar] = useState(0); // Trigger para atualizar sidebar
  // Modelo padrão deve ser um modelo válido do combobox (não apenas provedor)
  const [selectedModel, setSelectedModel] = useState('gpt-4o'); // Estado do modelo selecionado
  
  // Estados para paginação de mensagens (cursor-based)
  const [prevCursor, setPrevCursor] = useState<string | undefined>(undefined);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [hasPrevMessages, setHasPrevMessages] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const debouncedIsLoadingConversation = useDebounce(isLoadingConversation, 50);
  const [totalMessageCount, setTotalMessageCount] = useState(0);
  const { streamingMessage, isTyping, startStreaming, isStreaming, stopStreaming, wasCancelled } = useChatStream();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const virtualizedListRef = useRef<VirtualizedMessageListRef>(null);

  // Sincronizar currentUserId com userData
  useEffect(() => {
    if (userData?.id) {
      setCurrentUserId(String(userData.id));
    }
  }, [userData?.id]);

  // Carregar conversa da URL quando conversationId estiver presente
  useEffect(() => {
    const loadConversationFromUrl = async () => {
      if (conversationId && currentUserId) {
        // Mostrar interface imediatamente com loading
        setIsLoadingMessages(true);
        
        try {
          const context = await chatService.getConversationContext(conversationId);
          
          // Verificar se a conversa pertence ao usuário atual
          if (context.conversation.user_id !== currentUserId) {
            logger.error('Acesso negado: conversa não pertence ao usuário');
            navigate('/chat');
            return;
          }
          
          setCurrentConversation(context.conversation);
          setMessages(context.messages);
          setHasFirstMessage(context.messages.length > 0);
          
          // Configurar paginação cursor-based
          setPrevCursor(undefined);
          setHasMoreMessages(context.totalMessages > 50);
          setHasPrevMessages(false);
          setTotalMessageCount(context.totalMessages);
          
          // Rolar para a mensagem mais recente
          scrollToLatestMessage();
          
          logger.info('Conversa carregada da URL:', {
            conversationId,
            title: context.conversation.title,
            messageCount: context.messages.length
          });
        } catch (error) {
          logger.error('Erro ao carregar conversa da URL:', error);
          navigate('/chat');
        } finally {
          setIsLoadingMessages(false);
          setIsLoadingConversation(false);
        }
      }
    };
    
    loadConversationFromUrl();
  }, [conversationId, currentUserId, navigate]);

  // Carregar mensagens de uma conversa com cursor-based pagination
  const loadMessages = async (conversationId: string, cursor?: string, direction: 'forward' | 'backward' = 'forward', reset: boolean = false) => {
    setIsLoadingMessages(true);
    try {
      const result = await getConversationMessagesPaginated(conversationId, cursor, 50, direction);
      
      if (reset) {
        setMessages(result.messages);
      } else {
        if (direction === 'backward') {
          setMessages(prev => [...result.messages, ...prev]); // Adicionar mensagens antigas no início
        } else {
          setMessages(prev => [...prev, ...result.messages]); // Adicionar mensagens novas no final
        }
      }
      
      setHasMoreMessages(result.hasMore);
      setHasPrevMessages(result.hasPrev);
      setPrevCursor(result.prevCursor);
      setTotalMessageCount(messages.length + result.messages.length);
      
      logger.info('Messages loaded:', {
        conversationId,
        cursor,
        direction,
        hasMore: result.hasMore,
        hasPrev: result.hasPrev,
        loadedCount: result.messages.length
      });
    } catch (error) {
      logger.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Carregar mais mensagens antigas
  const loadMoreMessages = () => {
    if (!isLoadingMessages && hasPrevMessages && currentConversation?.id && prevCursor) {
      loadMessages(currentConversation.id, prevCursor, 'backward', false);
    }
  };

  // Handler para seleção de conversa na sidebar
  const handleConversationSelect = async (conversation: Conversation) => {
    try {
      // Definir loading state imediatamente para feedback visual
      setIsLoadingConversation(true);
      
      // Limpar mensagens atuais e mostrar loading imediatamente
      setMessages([]);
      setIsLoadingMessages(true);
      
      // Navegar para a URL da conversa
      navigate(`/chat/${conversation.id}`);
      
      logger.info('Navegando para conversa:', {
        title: conversation.title,
        conversationId: conversation.id
      });
    } catch (error) {
      logger.error('Erro ao navegar para conversa:', error);
      setIsLoadingMessages(false);
      setIsLoadingConversation(false);
    }
  };

  // Handler para novo chat
  const handleNewChat = () => {
    // Navegar para /chat sem parâmetros
    navigate('/chat');
    logger.info('Navegando para novo chat');
  };
  
  // Limpar estado quando não há conversationId na URL
  useEffect(() => {
    if (!conversationId) {
      setCurrentConversation(null);
      setMessages([]);
      setHasFirstMessage(false);
      setNewMessageId(null);
      setPrevCursor(undefined);
      setHasMoreMessages(false);
      setHasPrevMessages(false);
      setTotalMessageCount(0);
    }
  }, [conversationId]);
  
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
      if (virtualizedListRef.current && messages.length > 0) {
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          virtualizedListRef.current.scrollToIndex(messageIndex);
        }
      } else if (messagesContainerRef.current) {
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

  // Função para rolar para a mensagem mais recente (última mensagem)
  const scrollToLatestMessage = () => {
    setTimeout(() => {
      if (virtualizedListRef.current && messages.length > 0) {
        virtualizedListRef.current.scrollToBottom();
      } else if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
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

  // Função handleMessageSent removida - não utilizada

  const handleConversationCreated = (conversation: Conversation) => {
    // Navegar para a nova conversa
    navigate(`/chat/${conversation.id}`);
    // Atualizar sidebar para mostrar a nova conversa
    setRefreshSidebar(prev => prev + 1);
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

    // Obter o modelo original da mensagem que está sendo regenerada
    const originalMessage = messages[messageIndex];
    const originalModel = originalMessage?.model_used || selectedModel;

    // DEBUG: Log para verificar o modelo
    console.log('🔄 REGENERATE DEBUG:', {
      messageIndex,
      originalMessage: originalMessage?.model_used,
      selectedModel,
      finalModel: originalModel,
      userMessage: userMessage.content.substring(0, 50)
    });

    // Remover a mensagem da IA atual e todas as posteriores
    setMessages(prev => prev.slice(0, messageIndex));

    // Reenviar a mensagem do usuário com o modelo original
    try {
      const chatRequest: ChatRequest = {
            message: userMessage.content,
            conversationId: currentConversation?.id,
            userId: currentUserId,
            preferredProvider: originalModel
          };
      
      console.log('🚀 CHAT REQUEST:', chatRequest);
      
      startStreaming(chatRequest, (aiMessage) => {
        handleAIMessage(aiMessage);
      });
    } catch (error) {
      logger.error('Erro ao regenerar mensagem:', error);
    }
  };

  const getProviderIcon = (provider?: string) => {
    if (!provider) return '🤖';
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
          <SidebarChat 
          onConversationSelect={handleConversationSelect}
          onNewChat={handleNewChat}
          currentConversationId={currentConversation?.id}
          refreshTrigger={refreshSidebar}
        />
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
              className="flex-1 overflow-y-auto flex justify-center px-4 sm:px-6 lg:px-8 mr-2" 
              style={{maxHeight: hasFirstMessage ? 'calc(100vh - 340px)' : 'calc(100vh - 200px)'}}
            >
                 <div className="w-full max-w-4xl" style={{paddingBottom: hasFirstMessage ? '20px' : '200px', minHeight: hasFirstMessage ? 'calc(100vh - 340px)' : 'calc(100vh - 200px)'}}>
                  <div
                    className="bg-white rounded-2xl animate-smooth-fade-up mb-6"
                    style={{ animationDelay: '160ms', willChange: 'transform, opacity' }}
                  >
              {messages.length === 0 && !debouncedIsLoadingConversation && !conversationId ? (
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
                {/* Botão para carregar mensagens anteriores */}
                {hasMoreMessages && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={loadMoreMessages}
                      disabled={isLoadingMessages}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingMessages && <Spinner size="sm" />}
                      {isLoadingMessages ? 'Carregando...' : 'Carregar mensagens anteriores'}
                    </button>
                  </div>
                )}
                
                {/* Contador de mensagens */}
                {totalMessageCount > 0 && (
                  <div className="text-center text-xs text-gray-500 py-2">
                    {messages.length} de {totalMessageCount} mensagens
                  </div>
                )}
                
                {/* Virtual Scrolling para performance com muitas mensagens */}
                {messages.length > 20 ? (
                  <VirtualizedMessageList
                    ref={virtualizedListRef}
                    messages={convertToStreamingMessages(messages)}
                    height={Math.min(600, messages.length * 120)}
                    isLoadingConversation={debouncedIsLoadingConversation}
                  />
                ) : (
                  messages.map((message, idx) => (
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
                              {message.file_attachments && message.file_attachments.length > 0 && (
                                <MessageFilePreview files={message.file_attachments} />
                              )}
                            </div>
                            <UserMessageActions 
                              content={message.content}
                              onEdit={() => console.log('Editar mensagem:', message.content)}
                            />
                          </>
                        ) : (
                          <>
                            {message.isCancelled ? (
                              <div className="flex items-center gap-2 text-gray-500 italic">
                                <CircleStop className="w-4 h-4" />
                                <span>Geração interrompida pelo usuário</span>
                              </div>
                            ) : (
                              <>
                                <MarkdownRenderer content={message.content} />
                                <MessageActions 
                                    content={message.content}
                                    onRegenerate={() => handleRegenerateMessage(idx)}
                                    modelUsed={message.model_used}
                                  />
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
                  
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
                        <StreamingErrorBoundary
                          onRetryStreaming={() => {
                            // Retry do streaming atual
                            if (messages.length > 0) {
                              const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                              if (lastUserMessage?.content) {
                                handleUserMessage(lastUserMessage);
                              }
                            }
                          }}
                          onPauseStreaming={() => stopStreaming()}
                        >
                          <StreamingMessageComponent message={streamingMessage} getModelIcon={(model?: string) => getProviderIcon(model || 'openai')} modelUsed={selectedModel} />
                        </StreamingErrorBoundary>
                      </div>
                    </div>
                  )}
                  


                </div>
              )}
              
              {/* Input do chat quando não há mensagens (posição normal) */}
              {!hasFirstMessage && (
                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                  <ChatErrorBoundary 
                    conversationId={currentConversation?.id}
                    onRetryMessage={() => {
                      // Retry da última mensagem se houver
                      if (messages.length > 0) {
                        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                        if (lastUserMessage?.content) {
                          handleUserMessage(lastUserMessage);
                        }
                      }
                    }}
                    onClearChat={() => {
                      setMessages([]);
                      setHasFirstMessage(false);
                    }}
                  >
                    <ChatInput 
                       onMessageSent={handleUserMessage}
                       onConversationCreated={handleConversationCreated}
                       currentConversationId={currentConversation?.id}
                       currentUserId={currentUserId || undefined}
                       isLoading={isLoading}
                       chatStreamHook={{ streamingMessage, isTyping, startStreaming, isStreaming, stopStreaming, wasCancelled }}
                       selectedModel={selectedModel}
                       onModelChange={setSelectedModel}
                     />
                  </ChatErrorBoundary>
                </div>
              )}              
                </div>
              </div>
              
            </div>

            {/* Input do chat fixo na parte inferior (após primeira mensagem) */}
            {hasFirstMessage && (
              <div className="py-6 flex justify-center px-4 sm:px-6 lg:px-8" style={{height: 'auto', minHeight: '240px'}}>
                <div className="w-full max-w-4xl">
                  <ChatErrorBoundary 
                    conversationId={currentConversation?.id}
                    onRetryMessage={() => {
                      // Retry da última mensagem se houver
                      if (messages.length > 0) {
                        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                        if (lastUserMessage?.content) {
                          handleUserMessage(lastUserMessage);
                        }
                      }
                    }}
                    onClearChat={() => {
                      setMessages([]);
                      setHasFirstMessage(false);
                    }}
                  >
                    <ChatInput 
                       onMessageSent={handleUserMessage}
                       onConversationCreated={handleConversationCreated}
                       currentConversationId={currentConversation?.id}
                       currentUserId={currentUserId || undefined}
                       isLoading={isLoading}
                       chatStreamHook={{ streamingMessage, isTyping, startStreaming, isStreaming, stopStreaming, wasCancelled }}
                       selectedModel={selectedModel}
                       onModelChange={setSelectedModel}
                     />
                  </ChatErrorBoundary>
                </div>
              </div>              
            )}
          </SidebarInset>
        </SidebarProvider>
      </main>
    </div>
  );
}
