import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import backgroundImage from '../assets/background.png';
import { authService } from '../services/authService';
import { Grid3X3, MessageSquare, Eye, CheckCircle } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { CardAplicativos } from '@/components/CardAplicativos';

export default function HomePage() {
  const [userName, setUserName] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const user = await authService.getUser();
      if (user) {
        const userData = await authService.getUserData();
        const name = userData?.name || user.email?.split('@')[0] || 'Usuário';
        const firstName = name.split(' ')[0];
        setUserName(firstName);
        setUserPhoto(userData?.photo_url || '');
      }
    };

    getUser();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="relative flex min-h-[calc(100vh-4rem)] w-full p-6 md:p-10 overflow-hidden">
        {/* Background com imagem */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{backgroundImage: `url(${backgroundImage})`}}
        >
          {/* Overlay com efeito vidro */}
          <div className="absolute inset-0 bg-[#D9D9D9]/15 backdrop-blur-[12px]"></div>
        </div>

        {/* Seção de Saudação */}
        <div className="relative z-10 flex flex-col items-center space-y-6 w-full" style={{marginTop: '40px'}}>
          {/* Foto do usuário */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold shadow-lg">
            {userPhoto ? (
              <img 
                src={userPhoto} 
                alt="Foto do usuário" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{getInitials(userName || 'U')}</span>
            )}
          </div>

          {/* Mensagem de boas-vindas */}
          <div className="space-y-2 text-left w-full max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Hello {userName ? userName.split(' ')[0] : 'Usuário'}, que bom ter você de volta ao Senso AI =)
            </h1>
          </div>

          {/* Componente de Tabs */}
          <div className="w-full max-w-4xl mt-8">
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
                    icon={Eye}
                    categoria="Anonimizador de dados"
                    titulo="Anonimize dados em lote"
                    descricao="Anonimize dados em lote. Lorem ipsum dolor sit amet, consectetur lorem ipsum dolor"
                    tags={[
                      { label: "Geral", type: "primary" },
                      { label: "Benchmarking", type: "primary" },
                      { label: "Navegação guiada", type: "primary" }
                    ]}
                    tagsExtras={2}
                    imagemSrc="/src/assets/modulo-imagem.png"
                    imagemAlt="Módulo Anonimizador"
                    tagsPrimaryBgColor="#EBF2FF"
                    tagsPrimaryColor="#4E67FF"
                  />

                  {/* Card 2 - Chat Inteligente (usando componente genérico) */}
                  <CardAplicativos
                    icon={MessageSquare}
                    iconBgColor="#1DA55C"
                    categoria="Senso Chat"
                    categoriaColor="#1DA55C"
                    titulo="Converse com IA da Senso"
                    descricao="Você pode conversar de forma segura com a IA da Senso"
                    tags={[
                      { label: "Geral", type: "primary" },
                      { label: "Conversação", type: "primary" },
                      { label: "Análise", type: "primary" }
                    ]}
                    tagsExtras={1}
                    tagsPrimaryBgColor="#ECFDF5"
                    tagsPrimaryColor="#1DA55C"
                  />
{/* Card 2 - Chat Inteligente (usando componente genérico) */}
                  <CardAplicativos
                    icon={MessageSquare}
                    iconBgColor="#1DA55C"
                    categoria="Senso Chat"
                    categoriaColor="#1DA55C"
                    titulo="Converse com IA da Senso"
                    descricao="Você pode conversar de forma segura com a IA da Senso"
                    tags={[
                      { label: "Geral", type: "primary" },
                      { label: "Conversação", type: "primary" },
                      { label: "Análise", type: "primary" }
                    ]}
                    tagsExtras={1}
                    tagsPrimaryBgColor="#ECFDF5"
                    tagsPrimaryColor="#1DA55C"
                  />

                </div>
              </TabsContent>
              <TabsContent value="novo-chat">
                <div className="w-full">
                  <p className="text-muted-foreground p-4 text-left text-xs w-full">
                    Conteúdo para Novo chat
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}