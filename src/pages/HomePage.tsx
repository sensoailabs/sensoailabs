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
                  {/* Card principal - Anonimizador de dados (baseado no modelo SVG) */}
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden w-full max-w-[296px]" style={{
                    background: 'linear-gradient(180deg, #FFF 62.85%, #DCDFEE 100%)'
                  }}>
                    {/* Conteúdo único */}
                    <div className="p-5">
                      {/* Ícone */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-[#4E67FF] rounded-md flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-semibold text-[#4E67FF]">ANONIMIZADOR</span>
                      </div>
                      
                      {/* Título */}
                      <h3 className="text-[16px] font-bold text-black mb-2">
                        Anonimizador de dados
                      </h3>
                      
                      {/* Descrição */}
                      <p className="text-[12px] text-[#818181] mb-4 line-clamp-2">
                        Anonimize dados em lote. Lorem ipsum dolor sit amet, consectetur lorem ipsum dolor
                      </p>
                      
                      {/* Tags */}
                      <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-0 hide-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          Geral
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          Benchmarking
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          Navegação guiada
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          +2
                        </span>
                      </div>
                      
                      {/* Imagem */}
                      <img 
                        src="/src/assets/modulo-imagem.png" 
                        alt="Módulo Anonimizador" 
                        className="w-full object-cover mt-4" 
                      />
                    </div>
                  </div>

                  {/* Card 2 - Chat Inteligente */}
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden w-full max-w-[296px]" style={{
                    background: 'linear-gradient(180deg, #FFF 62.85%, #DCDFEE 100%)'
                  }}>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-purple-500 rounded-md flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-semibold text-purple-500">CHAT</span>
                      </div>
                      
                      <h3 className="text-[16px] font-bold text-black mb-2">
                        Chat Inteligente
                      </h3>
                      
                      <p className="text-[12px] text-[#818181] mb-4 line-clamp-2">
                        Converse com IA avançada. Assistente inteligente para suas necessidades
                      </p>
                      
                      <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-4 hide-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          IA
                        </span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          Conversação
                        </span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          Assistente
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 - Análise de Dados */}
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden w-full max-w-[296px]" style={{
                    background: 'linear-gradient(180deg, #FFF 62.85%, #DCDFEE 100%)'
                  }}>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                          <Grid3X3 className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-semibold text-green-500">ANÁLISE</span>
                      </div>
                      
                      <h3 className="text-[16px] font-bold text-black mb-2">
                        Análise de Dados
                      </h3>
                      
                      <p className="text-[12px] text-[#818181] mb-4 line-clamp-2">
                        Visualize e analise dados. Relatórios detalhados e insights avançados
                      </p>
                      
                      <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-4 hide-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          Analytics
                        </span>
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          Visualização
                        </span>
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
                          Relatórios
                        </span>
                      </div>
                    </div>
                  </div>
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