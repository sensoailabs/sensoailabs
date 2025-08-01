import React, { useState } from 'react';
import Header from '@/components/Header';
import ChatInput from '@/components/ChatInput';
import { Bot, User, Sparkles } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
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

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  model?: string;
}

export default function SensoChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const formatTime = (date: Date) => {
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
          <AppSidebar className="h-full" />
          <SidebarInset className="h-full">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="max-w-4xl mx-auto w-full">
          {/* Header da página */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Senso Chat</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Converse com nossa IA avançada. Faça perguntas, solicite análises ou peça ajuda com qualquer tarefa.
            </p>
          </div>

          {/* Área de Mensagens */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
            {messages.length === 0 ? (
              /* Estado vazio */
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bem-vindo ao Senso Chat
                </h3>
                <p className="text-gray-500 mb-6">
                  Digite sua primeira mensagem abaixo para começar a conversar.
                </p>
                
                {/* Sugestões de perguntas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                    <p className="text-sm text-gray-700">💡 Como posso melhorar minha produtividade?</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                    <p className="text-sm text-gray-700">📊 Analise dados de vendas para mim</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                    <p className="text-sm text-gray-700">🎨 Crie um plano de marketing criativo</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                    <p className="text-sm text-gray-700">🔍 Pesquise tendências do mercado</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Lista de mensagens */
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex items-start gap-4 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}>
                    {/* Avatar */}
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

                    {/* Conteúdo da mensagem */}
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
                      
                      {/* Timestamp e modelo */}
                      <div className={`text-xs text-gray-500 mt-2 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {message.model && message.role === 'assistant' && (
                          <span className="ml-2">
                            {getModelIcon(message.model)} {message.model.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Indicador de digitação */}
                {isTyping && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg rounded-tl-sm p-4 max-w-xs">
                        <div className="flex items-center gap-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-500 ml-2">IA digitando...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

                {/* Área de Input */}
                <div className="flex justify-center">
                  <ChatInput />
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </main>
    </div>
  );
}