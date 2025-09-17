 
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useUser } from '../contexts/UserContext'
import { Skeleton } from '@/components/ui/skeleton'
import ChatInput from '../components/ChatInput'
import { useNavigate } from 'react-router-dom'
import { Edit3, Image, User, Code, ArrowRight } from 'lucide-react'
import { CardAplicativos } from '../components/CardAplicativos'
import AiAnimation from '../components/AiAnimation'
import LogoAnimated from '../components/LogoAnimated'
import { useState } from 'react'
import iconAppAnonimizador from '../assets/_icons-modulos/icon-app-anonimizador.png'
import iconAppSensoChat from '../assets/_icons-modulos/icon-app-senso-chat.png'
import iconAppRecrutamento from '../assets/_icons-modulos/icon-app-recrutamento.png'
import iconAppHeuristica from '../assets/_icons-modulos/icon-app-heuristica.png'

export default function HomePage() {
  const { userData, isLoading } = useUser();
  const navigate = useNavigate();
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = userData?.name || 'Usuário';
  const userPhoto = userData?.photo_url || '';
  const firstName = userName.split(' ')[0];

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
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
                  <BreadcrumbPage>Home</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-4 pt-0">
          {/* Seção de Saudação */}
          <div className="flex flex-col items-center space-y-6 w-full">
            {/* Foto do usuário */}
            <div className="relative w-24 h-24">
              {isLoading ? (
                <Skeleton className="w-24 h-24 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              ) : (
                <>
                  {/* Foto do usuário */}
                  <div
                    className={`absolute inset-0 w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold transition-all duration-500 ease-in-out ${
                      isChatInputFocused 
                        ? 'opacity-0 transform translate-y-8 scale-95' 
                        : 'opacity-100 transform translate-y-0 scale-100'
                    }`}
                    style={{ willChange: 'transform, opacity' }}
                  >
                    {userPhoto ? (
                      <img 
                        src={userPhoto} 
                        alt="Foto do usuário" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(userName)}</span>
                    )}
                  </div>
                  
                  {/* Animação AI */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
                      isChatInputFocused 
                        ? 'opacity-100 transform translate-y-0 scale-100' 
                        : 'opacity-0 transform translate-y-8 scale-95'
                    }`}
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <AiAnimation isVisible={isChatInputFocused} />
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <LogoAnimated />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mensagem de boas-vindas */}
            <div className="space-y-2 text-center w-full">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-6 w-1/2 animate-pulse" style={{ animationDelay: '100ms' }} />
                  <Skeleton className="h-6 w-1/3 animate-pulse" style={{ animationDelay: '200ms' }} />
                </div>
              ) : (
                <h1
                  className="text-[22px] font-bold text-foreground animate-smooth-fade-up"
                  style={{ animationDelay: '240ms', willChange: 'transform, opacity' }}
                >
                  Hello {firstName}, que bom ter você de volta ao Senso AI =)
                </h1>
              )}
            </div>

            {/* Chat Input */}
            <div className="mt-8 w-full max-w-4xl">
              <ChatInput 
                currentUserId={userData?.id}
                onFocus={() => setIsChatInputFocused(true)}
                onBlur={() => setIsChatInputFocused(false)}
                onMessageSent={(message) => {
                  // Redirecionar para o chat se houver conversationId
                  if (message.conversation_id) {
                    navigate(`/chat/${message.conversation_id}`);
                  }
                }}
                onConversationCreated={(conversation) => {
                  // Redirecionar para a nova conversa criada
                  if (conversation.id) {
                    navigate(`/chat/${conversation.id}`);
                  }
                }}
              />
            </div>

            {/* Cards de Ações Rápidas */}
            <div className="mt-8 w-full max-w-4xl">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Skeleton Card 1 */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Skeleton className="w-16 h-16 rounded-xl animate-pulse" style={{ animationDelay: '300ms' }} />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4 animate-pulse" style={{ animationDelay: '400ms' }} />
                          <Skeleton className="h-3 w-full animate-pulse" style={{ animationDelay: '500ms' }} />
                          <Skeleton className="h-3 w-2/3 animate-pulse" style={{ animationDelay: '600ms' }} />
                        </div>
                      </div>
                      <Skeleton className="w-8 h-8 rounded-full animate-pulse" style={{ animationDelay: '700ms' }} />
                    </div>
                  </div>
                  
                  {/* Skeleton Card 2 */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Skeleton className="w-16 h-16 rounded-xl animate-pulse" style={{ animationDelay: '400ms' }} />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-2/3 animate-pulse" style={{ animationDelay: '500ms' }} />
                          <Skeleton className="h-3 w-full animate-pulse" style={{ animationDelay: '600ms' }} />
                          <Skeleton className="h-3 w-3/4 animate-pulse" style={{ animationDelay: '700ms' }} />
                        </div>
                      </div>
                      <Skeleton className="w-8 h-8 rounded-full animate-pulse" style={{ animationDelay: '800ms' }} />
                    </div>
                  </div>
                  
                  {/* Skeleton Card 3 */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Skeleton className="w-16 h-16 rounded-xl animate-pulse" style={{ animationDelay: '500ms' }} />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-4/5 animate-pulse" style={{ animationDelay: '600ms' }} />
                          <Skeleton className="h-3 w-full animate-pulse" style={{ animationDelay: '700ms' }} />
                          <Skeleton className="h-3 w-1/2 animate-pulse" style={{ animationDelay: '800ms' }} />
                        </div>
                      </div>
                      <Skeleton className="w-8 h-8 rounded-full animate-pulse" style={{ animationDelay: '900ms' }} />
                    </div>
                  </div>
                  
                  {/* Skeleton Card 4 */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Skeleton className="w-16 h-16 rounded-xl animate-pulse" style={{ animationDelay: '600ms' }} />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-5/6 animate-pulse" style={{ animationDelay: '700ms' }} />
                          <Skeleton className="h-3 w-full animate-pulse" style={{ animationDelay: '800ms' }} />
                          <Skeleton className="h-3 w-3/5 animate-pulse" style={{ animationDelay: '900ms' }} />
                        </div>
                      </div>
                      <Skeleton className="w-8 h-8 rounded-full animate-pulse" style={{ animationDelay: '1000ms' }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1 - Anonimizador de dados */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                        <img src={iconAppAnonimizador} alt="Anonimizador" className="w-16 h-16" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-medium mb-1">Anonimizador de dados</h3>
                        <p className="text-[12px] text-[#818181]">Anonimize informações sensíveis de capturas de telas e documentos automaticamente</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 ml-2 self-center">
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Card 2 - Senso Chat */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                        <img src={iconAppSensoChat} alt="Senso Chat" className="w-16 h-16" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-medium mb-1">Senso Chat</h3>
                        <p className="text-[12px] text-[#818181]">Você pode conversar de forma segura com a IA da Senso</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 ml-2 self-center">
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Card 3 - Assistente de recrutamento */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                        <img src={iconAppRecrutamento} alt="Recrutamento" className="w-16 h-16" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-medium mb-1">Assistente de recrutamento</h3>
                        <p className="text-[12px] text-[#818181]">Desenvolva roteiros personalizados de recrutamento e screening automaticamente</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 ml-2 self-center">
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Card 4 - Assistente de Análise Heurística */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                        <img src={iconAppHeuristica} alt="Heurística" className="w-16 h-16" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-medium mb-1">Assistente de Análise Heurística</h3>
                        <p className="text-[12px] text-[#818181]">Seu avaliador extra de heurísticas, como se fosse mais um Designer na equipe</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 ml-2 self-center">
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                </div>
              )}
            </div>

            {/* Seção de Aplicativos */}
            <div className="mt-12 w-full max-w-6xl hidden">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Aplicativos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CardAplicativos
                  iconSrc={iconAppAnonimizador}
                  titulo="Anonimizador de dados"
                  descricao="Anonimize informações sensíveis de capturas de telas e documentos automaticamente"
                  tags={[
                    { label: "Benchmarking", type: "primary" },
                    { label: "Navegação guiada", type: "primary" }
                  ]}
                />
                <CardAplicativos
                  iconSrc={iconAppSensoChat}
                  titulo="Senso Chat"
                  descricao="Você pode conversar de forma segura com a IA da Senso"
                  tags={[
                    { label: "Conversação", type: "primary" },
                    { label: "Análise", type: "primary" }
                  ]}
                />
                <CardAplicativos
                  iconSrc={iconAppRecrutamento}
                  titulo="Assistente de recrutamento"
                  descricao="Desenvolva roteiros personalizados de recrutamento e screening automaticamente"
                  tags={[
                    { label: "Recrutamento", type: "primary" },
                    { label: "Screening", type: "primary" }
                  ]}
                />
                <CardAplicativos
                  iconSrc={iconAppHeuristica}
                  titulo="Assistente de Análise Heurística"
                  descricao="Seu avaliador extra de heurísticas, como se fosse mais um Designer na equipe."
                  tags={[
                    { label: "Análise Heurística", type: "primary" }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}