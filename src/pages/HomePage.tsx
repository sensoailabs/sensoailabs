import React from 'react';
import Header from '@/components/Header';
import backgroundImage from '../assets/background.png';

export default function HomePage() {
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
      </main>
    </div>
  );
}