 
import Header from '../components/Header';
import { CardAplicativos } from '../components/CardAplicativos';
import ChatInput from '../components/ChatInput';
import backgroundImage from '../assets/background.png';
import iconAppAnonimizador from '../assets/_icons-modulos/icon-app-anonimizador.png';
import iconAppSensoChat from '../assets/_icons-modulos/icon-app-senso-chat.png';
import iconAppRecrutamento from '../assets/_icons-modulos/icon-app-recrutamento.png';
import iconAppHeuristica from '../assets/_icons-modulos/icon-app-heuristica.png';
import { useUser } from '../contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Grid3X3, MessageSquare } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function HomePage() {
  const { userData, isLoading } = useUser();

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
    <div className="min-h-screen bg-background relative">
      {/* Background com imagem - cobrindo toda a tela */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40 z-0"
        style={{backgroundImage: `url(${backgroundImage})`}}
      >
        {/* Overlay com efeito vidro */}
        <div className="absolute inset-0 bg-[#D9D9D9]/15 backdrop-blur-[12px]"></div>
      </div>

      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="relative flex min-h-[calc(100vh-4rem)] w-full p-6 md:p-10 overflow-hidden z-10 pt-20">

        {/* Seção de Saudação */}
        <div className="relative z-10 flex flex-col items-center space-y-3 w-full" style={{marginTop: '80px'}}>
          {/* Foto do usuário */}
          {isLoading ? (
            <Skeleton className="w-24 h-24 rounded-full animate-smooth-fade-up" />
          ) : (
            <div
              className="w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold animate-smooth-fade-up"
              style={{ animationDelay: '120ms', willChange: 'transform, opacity' }}
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
          )}

          {/* Mensagem de boas-vindas */}
          <div className="space-y-2 text-center w-full max-w-4xl">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-6 w-3/5 animate-smooth-fade-up" />
              </div>
            ) : (
              <h1
                className="text-xl md:text-2xl font-bold text-foreground animate-smooth-fade-up"
                style={{ animationDelay: '240ms', willChange: 'transform, opacity' }}
              >
                Hello {firstName}, que bom ter você de volta ao Senso AI =)
              </h1>
            )}
          </div>

          {/* Componente de Tabs */}
          <div className="w-full" style={{marginTop: '48px'}}>
            <Tabs defaultValue="meus-aplicativos" className="items-center">
              <TabsList
                className="bg-white rounded-full p-1 shadow-sm animate-smooth-fade-up"
                style={{ animationDelay: '320ms', willChange: 'transform, opacity' }}
              >
                <TabsTrigger 
                  value="meus-aplicativos" 
                  className="rounded-full px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-transparent text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                  Meus aplicativos
                </TabsTrigger>
                <TabsTrigger 
                  value="novo-chat" 
                  className="rounded-full px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-transparent text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Novo chat
                </TabsTrigger>
              </TabsList>
              <TabsContent value="meus-aplicativos" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center w-full">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl shadow-sm w-full max-w-[296px] overflow-hidden p-5 animate-smooth-fade-up"
                        style={{ animationDelay: `${200 + idx * 150}ms`, willChange: 'transform, opacity' }}
                      >
                        <div className="mb-4">
                          <Skeleton className="h-[60px] w-[60px] rounded-lg" />
                        </div>
                        <Skeleton className="h-4 w-2/3 mb-2" />
                        <div className="space-y-2 mb-4">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-4/5" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 rounded-md" />
                          <Skeleton className="h-6 w-24 rounded-md" />
                          <Skeleton className="h-6 w-20 rounded-md" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Card principal - Anonimizador de dados */}
                      <div
                        className="animate-smooth-fade-up"
                        style={{ animationDelay: '200ms', willChange: 'transform, opacity' }}
                      >
                        <CardAplicativos
                          iconSrc={iconAppAnonimizador}
                          titulo="Anonimizador de dados"
                          descricao="Anonimize informações sensíveis de capturas de telas e documentos automaticamente"
                          tags={[                           
                            { label: "Benchmarking", type: "primary" },
                            { label: "Navegação guiada", type: "primary" }
                          ]}
                        />
                      </div>

                      {/* Card 2 - Senso Chat */}
                      <div
                        className="animate-smooth-fade-up"
                        style={{ animationDelay: '350ms', willChange: 'transform, opacity' }}
                      >
                        <CardAplicativos
                          iconSrc={iconAppSensoChat}
                          titulo="Senso Chat"
                          descricao="Você pode conversar de forma segura com a IA da Senso"
                          tags={[                            
                            { label: "Conversação", type: "primary" },
                            { label: "Análise", type: "primary" }
                          ]}
                        />
                      </div>

                      {/* Card 3 - Assistente de recrutamento */}
                      <div
                        className="animate-smooth-fade-up"
                        style={{ animationDelay: '500ms', willChange: 'transform, opacity' }}
                      >
                        <CardAplicativos
                          iconSrc={iconAppRecrutamento}
                          titulo="Assistente de recrutamento"
                          descricao="Desenvolva roteiros personalizados de recrutamento e screening automaticamente"
                          tags={[                     
                            { label: "Recrutamento", type: "primary" },
                            { label: "Screening", type: "primary" }
                          ]}
                        />
                      </div>


                         {/* Card 4 - Assistente de análise heuristica */}
                      <div
                        className="animate-smooth-fade-up"
                        style={{ animationDelay: '500ms', willChange: 'transform, opacity' }}
                      >
                        <CardAplicativos
                          iconSrc={iconAppHeuristica}
                          titulo="Assistente de Análise Heurística"
                          descricao="Seu avaliador extra de heurísticas, como se fosse mais um Designer na equipe."
                          tags={[                     
                            { label: "Análise Heurística", type: "primary" },                           
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="novo-chat">
                <div className="w-full mt-8 animate-smooth-fade-up" style={{ animationDelay: '240ms', willChange: 'transform, opacity' }}>
                  <ChatInput />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}