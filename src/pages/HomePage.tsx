import React from 'react';
import { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import Header from '@/components/Header';
import backgroundImage from '../assets/background.png';

export default function HomePage() {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const user = await authService.getUser();
      if (user) {
        // Buscar dados completos do usuário
        const userData = await authService.getUserData();
        const name = userData?.name || user.email?.split('@')[0] || 'Usuário';
        setUserName(name);
      }
    };

    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 md:p-10 overflow-hidden">
        {/* Background com imagem */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{backgroundImage: `url(${backgroundImage})`}}
        >
          {/* Overlay com efeito vidro */}
          <div className="absolute inset-0 bg-[#D9D9D9]/15 backdrop-blur-[12px]"></div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-8 max-w-md w-full text-center border-0 opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_forwards]">
          <div className="mb-8 opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bem-vindo ao Dashboard!
            </h1>
            <p className="text-xl text-gray-600">
              Olá, <span className="font-semibold text-indigo-600">{userName}</span>
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Use a navegação acima para explorar as funcionalidades da plataforma.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}