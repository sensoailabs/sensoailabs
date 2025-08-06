import React, { useState } from 'react';
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

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  model?: string;
}

export default function SensoChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);

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
          <SidebarChat className="h-full" />
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
                     

          <div className="bg-white rounded-2xl mb-6">
            {messages.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex justify-center">
                  <LogoAnimated />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bem-vindo ao Senso Chat
                </h3>
                <p className="text-gray-500 mb-6">
                  Digite sua primeira mensagem abaixo para começar a conversar.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {messages.map((message) => (
                    <div key={message.id} className={`flex items-start gap-4 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}>
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


              </div>
            )}
          </div>

                <div className="flex justify-center">
                  <ChatInput />
                </div>
             
          
          </SidebarInset>
        </SidebarProvider>
      </main>
    </div>
  );
}