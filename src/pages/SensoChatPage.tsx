import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import ChatInput from '@/components/ChatInput';
import LogoAnimated from '@/components/LogoAnimated';
import { Bot, User } from 'lucide-react';
import { SidebarChat } from '@/components/SidebarChat';
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
import type { ChatMessage, Conversation } from '@/services/chatService';
import { useChatStream } from '@/hooks/useChatStream';
import StreamingMessage from '@/components/StreamingMessage';
import TypingIndicator from '@/components/TypingIndicator';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/clientLogger';

// Usando ChatMessage do serviço

export default function SensoChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { streamingMessage, isTyping, startStreaming, isStreaming, stopStreaming } = useChatStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
  
  // Carregar mensagens da conversa atual
  useEffect(() => {
    if (currentConversation?.id) {
      loadConversationMessages(currentConversation.id);
    }
  }, [currentConversation]);
  
  // Rolagem automática para última mensagem
   useEffect(() => {
     scrollToBottom();
   }, [messages, streamingMessage, isTyping]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const loadConversationMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const conversationMessages = await chatService.getConversationMessages(conversationId);
      setMessages(conversationMessages);
    } catch (error) {
      logger.error('Error loading conversation messages', { error, conversationId });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMessageSent = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };
  
  const handleConversationCreated = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages([]); // Limpar mensagens para nova conversa
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getModelIcon = (model?: string) => {
    switch (model) {
      case 'gpt-4':
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
      <main className="pt-16 h-[calc(100vh-4rem)]">
        <SidebarProvider className="h-full">
          <SidebarChat className="h-full" />
          <SidebarInset className="h-full">
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
                     

          <div
            className="bg-white rounded-2xl mb-6 animate-smooth-fade-up"
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
                  Bem-vindo ao Senso Chat
                </h3>
                <p className="text-gray-500 mb-6 animate-smooth-fade-up" style={{ animationDelay: '340ms' }}>
                  Digite sua primeira mensagem abaixo para começar a conversar.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {messages.map((message, idx) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-4 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    } animate-smooth-fade-up`}
                      style={{ animationDelay: `${120 + idx * 80}ms`, willChange: 'transform, opacity' }}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>

                      <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block max-w-[85%] ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-lg rounded-tr-sm'
                            : 'bg-gray-100 text-gray-900 rounded-lg rounded-tl-sm'
                        } p-4`}>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                        
                        <div className={`text-xs text-gray-500 mt-2 ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          <span>{message.created_at && formatTime(message.created_at)}</span>
                          {message.model_used && message.role === 'assistant' && (
                            <span className="ml-2">
                              {getModelIcon(message.model_used)} {message.model_used.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Indicador de digitando */}
                  <TypingIndicator 
                    isVisible={isTyping} 
                    modelName="Senso AI"
                  />
                  
                  {/* Mensagem de streaming */}
                  {streamingMessage && (
                    <div className="px-4 pb-4">
                      <StreamingMessage 
                        message={streamingMessage} 
                        getModelIcon={getModelIcon}
                      />
                    </div>
                  )}
                  
                  {/* Elemento para rolagem automática */}
                  <div ref={messagesEndRef} />

              </div>
            )}
          </div>

                 <div
                   className="flex justify-center animate-smooth-fade-up"
                   style={{ animationDelay: '240ms', willChange: 'transform, opacity' }}
                 >
                   <ChatInput 
                     onMessageSent={handleMessageSent}
                     onConversationCreated={handleConversationCreated}
                     currentConversationId={currentConversation?.id}
                     currentUserId={currentUserId || undefined}
                     isLoading={isLoading}
                     chatStreamHook={{ streamingMessage, isTyping, startStreaming, isStreaming, stopStreaming }}
                   />
                 </div>
             
          
          </SidebarInset>
        </SidebarProvider>
      </main>
    </div>
  );
}