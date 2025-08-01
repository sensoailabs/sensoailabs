import React from 'react';
import Header from '../components/Header';
import { CardAplicativos } from '../components/CardAplicativos';
import ChatInput from '../components/ChatInput';
import backgroundImage from '../assets/background.png';
import iconAppAnonimizador from '../assets/_icons-modulos/icon-app-anonimizador.png';
import iconAppSensoChat from '../assets/_icons-modulos/icon-app-senso-chat.png';
import iconAppRecrutamento from '../assets/_icons-modulos/icon-app-recrutamento.png';
import { useUser } from '../contexts/UserContext';
import { Grid3X3, MessageSquare, Eye, CheckCircle, UserCheck } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function HomePage() {
  const { userData } = useUser();

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
          <div className="w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold">
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

          {/* Mensagem de boas-vindas */}
          <div className="space-y-2 text-center w-full max-w-4xl">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Hello {firstName}, que bom ter você de volta ao Senso AI =)
            </h1>
          </div>

          {/* Componente de Tabs */}
          <div className="w-full" style={{marginTop: '48px'}}>
            <Tabs defaultValue="meus-aplicativos" className="items-center">
              <TabsList className="bg-white rounded-full p-1 shadow-sm">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                  {/* Card principal - Anonimizador de dados (componente genérico) */}
                  <CardAplicativos
                    iconSrc={iconAppAnonimizador}
                    titulo="Anonimizador de dados"
                    descricao="Anonimize informações sensíveis de capturas de telas e documentos automaticamente"
                    tags={[
                      { label: "Geral", type: "primary" },
                      { label: "Benchmarking", type: "primary" },
                      { label: "Navegação guiada", type: "primary" }
                    ]}
                  />

                  {/* Card 2 - Chat Inteligente (usando componente genérico) */}
                  <CardAplicativos
                    iconSrc={iconAppSensoChat}
                    titulo="Senso Chat"
                    descricao="Você pode conversar de forma segura com a IA da Senso"
                    tags={[
                      { label: "Geral", type: "primary" },
                      { label: "Conversação", type: "primary" },
                      { label: "Análise", type: "primary" }
                    ]}
                  />

                  {/* Card 3 - Assistente de recrutamento */}
                  <CardAplicativos
                    iconSrc={iconAppRecrutamento}
                    titulo="Assistente de recrutamento"
                    descricao="Desenvolva roteiros personalizados de recrutamento e screening automaticamente"
                    tags={[
                      { label: "Geral", type: "primary" },
                      { label: "Recrutamento", type: "primary" },
                      { label: "Screening", type: "primary" }
                    ]}
                  />                  
                  
                </div>
              </TabsContent>
              <TabsContent value="novo-chat">
                <div className="w-full mt-8">
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