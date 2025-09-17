import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ChatInput from '@/components/ChatInput';
import LogoAnimated from '@/components/LogoAnimated';
import MessageFilePreview from '@/components/MessageFilePreview';
import VirtualizedMessageList from '@/components/VirtualizedMessageList';
import type { VirtualizedMessageListRef } from '@/components/VirtualizedMessageList';
import { User, CircleStop, Home } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import ChatSidebar from '@/components/ChatSidebar';
import { MessageActions } from '@/components/MessageActions';
import { UserMessageActions } from '@/components/UserMessageActions';
import ChatErrorBoundary from '@/components/ui/chat-error-boundary';
import StreamingErrorBoundary from '@/components/ui/streaming-error-boundary';
import { Spinner } from '@/components/ui/spinner';
import { ChatSkeleton } from '@/components/ui/chat-skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useSmartScroll } from '@/hooks/useSmartScroll';
import {
  SidebarProvider,
  SidebarInset,

} from "@/components/ui/sidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getConversationMessagesPaginated, chatService } from '@/services/chatService';
import type { ChatMessage, Conversation, ChatRequest } from '@/services/chatService';
import { useChatStream } from '@/hooks/useChatStream';
import type { StreamingMessage } from '@/hooks/useChatStream';
import StreamingMessageComponent from '@/components/StreamingMessage';
import TypingIndicator from '@/components/TypingIndicator';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/clientLogger';
import GradientAnimation from '@/components/GradientAnimation';
import AiAnimation from '@/components/AiAnimation';

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
  
  // Estados para o dialog de edição do título
  const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Hook para rolagem inteligente
  const { scrollToBottom, scrollToElement } = useSmartScroll(chatContainerRef);

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

  // Função para salvar o novo título do chat
  const handleSaveTitle = async () => {
    if (!editingTitle.trim() || !currentConversation) return;

    try {
      // Atualiza o título localmente
      setCurrentConversation(prev => 
        prev ? { ...prev, title: editingTitle.trim() } : null
      );
      
      // Fecha o dialog
      setIsEditTitleDialogOpen(false);
      
      // Atualiza a sidebar para refletir a mudança
      setRefreshSidebar(prev => prev + 1);
      
      // Aqui você pode adicionar a chamada para a API para salvar no backend
      // await chatService.updateConversationTitle(currentConversation.id, editingTitle.trim());
      
    } catch (error) {
      console.error('Erro ao salvar título:', error);
      // Em caso de erro, reverte a mudança local
      setCurrentConversation(prev => 
        prev ? { ...prev, title: currentConversation.title } : null
      );
    }
  };

  // Handler para seleção de conversa na sidebar - Otimizado para feedback imediato
  const handleConversationSelect = (conversation: Conversation) => {
    try {
      // 1. Feedback imediato - definir estados de loading
      setIsLoadingConversation(true);
      setCurrentConversation(conversation); // Mostrar título imediatamente
      
      // 2. Limpar estado anterior de forma não-bloqueante
      setMessages([]);
      setHasFirstMessage(false);
      setNewMessageId(null);
      setPrevCursor(undefined);
      setHasMoreMessages(false);
      
      // 3. Navegar imediatamente (não-bloqueante)
      navigate(`/chat/${conversation.id}`);
      
      // 4. Log para debugging
      logger.info('Navegando para conversa:', {
        title: conversation.title,
        conversationId: conversation.id
      });
      
      // 5. O carregamento das mensagens será feito pelo useEffect quando conversationId mudar
      // Isso permite que a UI responda imediatamente enquanto os dados carregam em background
      
    } catch (error) {
      logger.error('Erro ao navegar para conversa:', error);
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

  // Função para rolar até uma mensagem específica - Otimizada com useSmartScroll
  const scrollToMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      // Se usando virtualização, usar o método do componente
      if (messages.length > 20 && virtualizedListRef.current) {
        virtualizedListRef.current.scrollToIndex(messageIndex);
      } else {
        // Usar rolagem inteligente para mensagens não virtualizadas
        await scrollToElement(`message-${messageId}`, {
          behavior: 'smooth',
          block: 'start',
          offset: -24 // Offset para melhor visualização
        });
      }
    }
  };

  // Função para rolar para a mensagem mais recente (última mensagem) - Otimizada com useSmartScroll
  const scrollToLatestMessage = async () => {
    // Aguardar um frame para garantir que o DOM foi atualizado
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    if (virtualizedListRef.current && messages.length > 20) {
      virtualizedListRef.current.scrollToBottom();
    } else {
      // Usar rolagem inteligente para scroll até o final
      await scrollToBottom({
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll para posicionar nova mensagem no topo quando enviada
  useEffect(() => {
    if (newMessageId && hasFirstMessage) {
      scrollToMessage(newMessageId);
    }
  }, [newMessageId, hasFirstMessage]);

  // Auto-scroll para a última mensagem quando mensagens são carregadas
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages && !isStreaming) {
      // Aguardar um pouco mais para garantir que o DOM foi completamente renderizado
      const timer = setTimeout(() => {
        scrollToLatestMessage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isLoadingMessages, isStreaming]);

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
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex overflow-hidden" style={{height: 'calc(100vh - 16px)'}}>
          {/* ChatSidebar lateral esquerda */}
          <div className="flex-shrink-0">
            <ChatSidebar 
              onConversationSelect={handleConversationSelect}
              onNewChat={handleNewChat}
              currentConversationId={currentConversation?.id}
              refreshTrigger={refreshSidebar}
            />
          </div>
          
          {/* Conteúdo principal */}
          <div className="flex-1 flex flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center justify-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#" className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Home
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Chat</BreadcrumbPage>
                    </BreadcrumbItem>
                    {currentConversation?.title && (
                      <>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                          <Dialog open={isEditTitleDialogOpen} onOpenChange={setIsEditTitleDialogOpen}>
                            <DialogTrigger asChild>
                              <BreadcrumbPage 
                                className="max-w-[200px] truncate cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => {
                                  setEditingTitle(currentConversation.title);
                                  setIsEditTitleDialogOpen(true);
                                }}
                              >
                                {currentConversation.title}
                              </BreadcrumbPage>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar título do chat</DialogTitle>
                              </DialogHeader>
                              <form 
                                className="space-y-4"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleSaveTitle();
                                }}
                              >
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  placeholder="Digite o novo título"
                                  className="w-full"
                                />
                                <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => setIsEditTitleDialogOpen(false)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    type="submit"
                                    disabled={!editingTitle.trim()}
                                  >
                                    Salvar
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </BreadcrumbItem>
                      </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            
            <div className="flex flex-1 h-[calc(100vh-4rem)]">
              <div className="flex flex-col flex-1 relative">

            {/* Conteúdo do chat com espaço condicional para input */}
            <div 
              ref={(el) => {
                messagesContainerRef.current = el;
                chatContainerRef.current = el;
              }}
              className="flex-1 overflow-y-auto flex justify-center px-4 sm:px-6 lg:px-8 mr-2" 
              style={{height: hasFirstMessage ? 'calc(100vh - 340px)' : 'calc(100vh - 200px)'}}
            >
                 <div className="w-full max-w-4xl" style={{paddingBottom: hasFirstMessage ? '20px' : '200px'}}>
                  <div
                    className="bg-white rounded-2xl animate-smooth-fade-up mb-6"
                    style={{ animationDelay: '160ms', willChange: 'transform, opacity', marginBottom: '20px' }}
                  >
              {debouncedIsLoadingConversation ? (
                <ChatSkeleton 
                  messageCount={3}
                  variant="full"
                />
              ) : messages.length === 0 && !conversationId ? (
                <div
                  className="p-12 text-center animate-smooth-fade-up"
                  style={{ animationDelay: '220ms', willChange: 'transform, opacity' }}
                >
                  <div className="mx-auto mb-4 relative flex items-center justify-center animate-smooth-fade-up" style={{ animationDelay: '260ms' }}>
                    <AiAnimation isVisible={true} />
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <LogoAnimated />
                    </div>
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
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-blue-600 text-white">
                          {userData?.photo_url ? (
                            <img 
                              src={userData.photo_url} 
                              alt="User" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5" />
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
                            <div className="px-4 py-2 inline-block max-w-fit bg-gray-100 text-gray-900" style={{borderRadius: '20px'}}>
                              <p className="whitespace-pre-wrap">{message.content}</p>
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
              {!hasFirstMessage && !debouncedIsLoadingConversation && (
                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 animate-slide-up-smooth" style={{animationDelay: '200ms', animationFillMode: 'both'}}>
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

            {/* Animação gradient na parte inferior */}
            <div className="flex justify-center px-4 sm:px-6 lg:px-8">
              <div className="w-full max-w-4xl ml-48">
                <GradientAnimation isVisible={isStreaming || isTyping} />
              </div>
            </div>

            {/* Input do chat fixo na parte inferior (após primeira mensagem) */}
            {hasFirstMessage && !debouncedIsLoadingConversation && (
              <div 
                className="py-6 flex justify-center px-4 sm:px-6 lg:px-8 animate-slide-up-smooth" 
                style={{height: 'auto', minHeight: '240px', animationDelay: '300ms', animationFillMode: 'both'}}
              >
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
            </div>
          </div>
        </div>
      </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
